<?php

namespace App\Http\Controllers;

use App\Models\Factura;
use Greenter\Model\Company\Address;
use Greenter\Model\Company\Company;
use Greenter\Model\Summary\Summary;
use Greenter\Model\Summary\SummaryDetail;
use Greenter\See;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ResumenController extends Controller
{
    private $see;

    public function __construct()
    {
        $this->see = new See;
        $this->see->setCertificate(file_get_contents(storage_path('app/certificates/certificate.pem')));
        $this->see->setService(env('SUNAT_URL'));
    }

    /**
     * Genera y envía el Resumen Diario de Boletas a SUNAT.
     */
    public function enviar(Request $request)
    {
        try {
            // 1. Validar la fecha
            $request->validate([
                'fecha' => 'required|date',
            ]);

            $fecha = $request->input('fecha');

            // 2. Obtener las boletas del día que no hayan sido resumidas
            $boletas = Factura::where('serie', 'LIKE', 'B%')
                ->whereDate('fecha_emitido', $fecha)
                ->whereNull('resumen_id')
                ->get();

            if ($boletas->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'error' => 'No hay boletas pendientes de resumir para esa fecha.',
                ], 404);
            }

            // 3. Configurar empresa emisora
            $company = new Company;
            $company->setRuc(env('GREENTER_RUC'))
                ->setRazonSocial('SEVEN HEART SOCIEDAD ANONIMA CERRADA')
                ->setNombreComercial('DOLCE CAFFE')
                ->setAddress((new Address)
                    ->setUbigueo('100101')
                    ->setDepartamento('HUANUCO')
                    ->setProvincia('HUANUCO')
                    ->setDistrito('HUANUCO')
                    ->setUrbanizacion('-')
                    ->setDireccion('DIRECCION REAL')
                    ->setCodLocal('0000'));

            // 4. Crear el Resumen
            $resumen = (new Summary)
                ->setCorrelativo($this->nuevoCorrelativoResumen())
                ->setFecGeneracion(new \DateTime($fecha))
                ->setFecResumen(new \DateTime($fecha))
                ->setMoneda('PEN')
                ->setCompany($company);

            // 5. Agregar cada boleta al resumen
            $details = [];
            foreach ($boletas as $boleta) {
                $detail = (new SummaryDetail)
                    ->setTipoDoc('03')
                    ->setSerieNro($boleta->serie.'-'.$boleta->correlativo)
                    ->setEstado('1')
                    ->setClienteTipo('1')
                    ->setClienteNro('00000000')
                    ->setTotal((float) $boleta->montototal)
                    ->setMtoOperGravadas(round($boleta->montototal / 1.18, 2))
                    ->setMtoIGV(round($boleta->montototal - ($boleta->montototal / 1.18), 2));

                $details[] = $detail;
            }

            $resumen->setDetails($details);

            // 6. Enviar a SUNAT (Paso 1: obtener ticket)
            $result = $this->see->send($resumen);

            if (! $result->isSuccess()) {
                return response()->json([
                    'success' => false,
                    'error' => $result->getError()->getMessage(),
                ], 500);
            }

            $ticket = $result->getTicket();
            $filename = $resumen->getName();

            // 7. Guardar el ticket en las boletas
            foreach ($boletas as $boleta) {
                $boleta->resumen_ticket = $ticket;
                $boleta->save();
            }

            // 8. Guardar el XML
            Storage::makeDirectory('resumenes');
            Storage::put(
                "resumenes/{$filename}.xml",
                $this->see->getFactory()->getLastXml()
            );

            // 9. Consultar el CDR con el ticket (Paso 2)
            $cdrResult = $this->see->getStatus($ticket);

            if (! $cdrResult->isSuccess()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Error al consultar el CDR: '.$cdrResult->getError()->getMessage(),
                    'ticket' => $ticket,
                    'file' => $filename,
                ], 500);
            }

            // 10. Guardar el CDR
            Storage::makeDirectory('resumenes/cdr');
            Storage::put(
                "resumenes/cdr/{$filename}.zip",
                $cdrResult->getCdrZip()
            );

            // 11. Marcar las boletas como resumidas
            foreach ($boletas as $boleta) {
                $boleta->resumen_id = $filename;
                $boleta->save();
            }

            $cdr = $cdrResult->getCdrResponse();

            return response()->json([
                'success' => true,
                'file' => $filename,
                'ticket' => $ticket,
                'code' => $cdr->getCode(),
                'message' => $cdr->getDescription(),
                'boletas_resumidas' => $boletas->count(),
                'xml_url' => url("sunat/resumen/xml/{$filename}"),
                'cdr_url' => url("sunat/resumen/cdr/{$filename}"),
            ]);
        } catch (\Exception $e) {
            \Log::error('Error al enviar resumen diario: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Consulta el CDR de un resumen ya enviado, usando el ticket.
     * Se usa cuando SUNAT devuelve el error 0200 (servidor no activo).
     */
    public function consultarCdr(Request $request)
    {
        $request->validate([
            'ticket' => 'required|string',
            'filename' => 'required|string',
        ]);

        $ticket = $request->input('ticket');
        $filename = $request->input('filename');

        try {
            $cdrResult = $this->see->getStatus($ticket);

            if (! $cdrResult->isSuccess()) {
                return response()->json([
                    'success' => false,
                    'error' => $cdrResult->getError()->getMessage(),
                    'ticket' => $ticket,
                ], 500);
            }

            // Guardar el CDR
            Storage::makeDirectory('resumenes/cdr');
            Storage::put(
                "resumenes/cdr/{$filename}.zip",
                $cdrResult->getCdrZip()
            );

            // Marcar las boletas como resumidas
            Factura::where('resumen_ticket', $ticket)
                ->update(['resumen_id' => $filename]);

            $cdr = $cdrResult->getCdrResponse();

            return response()->json([
                'success' => true,
                'file' => $filename,
                'ticket' => $ticket,
                'code' => $cdr->getCode(),
                'message' => $cdr->getDescription(),
                'cdr_url' => url("sunat/resumen/cdr/{$filename}"),
            ]);
        } catch (\Exception $e) {
            \Log::error('Error al consultar CDR: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'ticket' => $ticket,
            ], 500);
        }
    }

    /**
     * Genera un nuevo correlativo para el resumen.
     */
    private function nuevoCorrelativoResumen()
    {
        $ultimoResumen = Factura::whereNotNull('resumen_id')
            ->orderBy('idfactura', 'desc')
            ->first();

        if (! $ultimoResumen) {
            return '1';
        }

        $partes = explode('-', $ultimoResumen->resumen_id);
        $ultimoCorrelativo = (int) str_replace('.zip', '', ($partes[3] ?? '0'));

        return (string) ($ultimoCorrelativo + 1);
    }

    /**
     * Descarga el XML del resumen.
     */
    public function downloadXml($filename)
    {
        $path = "resumenes/{$filename}.xml";
        if (! Storage::exists($path)) {
            return response()->json(['success' => false, 'error' => 'XML no encontrado'], 404);
        }

        return Storage::download($path);
    }

    /**
     * Descarga el CDR del resumen.
     */
    public function downloadCdr($filename)
    {
        $path = "resumenes/cdr/{$filename}.zip";
        if (! Storage::exists($path)) {
            return response()->json(['success' => false, 'error' => 'CDR no encontrado'], 404);
        }

        return Storage::download($path);
    }
}
