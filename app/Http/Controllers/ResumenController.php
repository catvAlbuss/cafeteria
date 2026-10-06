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
        // Respaldo global (fallback)
        $this->see = new See;
        $this->see->setCertificate(file_get_contents(storage_path('app/certificates/certificate.pem')));
        $this->see->setService(env('SUNAT_URL'));
    }

    public function enviar(Request $request)
    {
        try {
            $request->validate([
                'fecha' => 'required|date',
            ]);

            $fecha = $request->input('fecha');
            $teamId = auth()->user()->current_team_id;

            // ✅ Leer configuración de la BD de ESTA empresa
            $config = \App\Models\ConfiguracionFacturacion::where('team_id', $teamId)->first();

            // ✅ Sobrescribir See con la config de la empresa
            if ($config) {
                if ($config->certificado_path) {
                    $certPath = storage_path('app/certificates/'.$config->certificado_path);
                    if (file_exists($certPath)) {
                        $this->see->setCertificate(file_get_contents($certPath));
                    }
                }
                if ($config->sol_usuario && $config->sol_clave) {
                    $this->see->setClaveSOL($config->ruc, $config->sol_usuario, $config->sol_clave);
                }
                if ($config->sunat_url) {
                    $this->see->setService($config->sunat_url);
                }
            }

            // ✅ Filtrar boletas por team_id
            $boletas = Factura::where('team_id', $teamId)
                ->where('serie', 'LIKE', 'B%')
                ->whereDate('fecha_emitido', $fecha)
                ->whereNull('resumen_id')
                ->get();

            if ($boletas->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'error' => 'No hay boletas pendientes de resumir para esa fecha.',
                ], 404);
            }

            // ✅ Datos de la empresa desde config o fallback
            $ruc = $config?->ruc ?? env('GREENTER_RUC');
            $razonSocial = $config?->razon_social ?? 'SEVEN HEART SOCIEDAD ANONIMA CERRADA';
            $nombreComercial = $config?->nombre_comercial ?? 'DOLCE CAFFE';
            $ubigeo = $config?->ubigeo ?? '100101';
            $departamento = $config?->departamento ?? 'HUANUCO';
            $provincia = $config?->provincia ?? 'HUANUCO';
            $distrito = $config?->distrito ?? 'HUANUCO';
            $direccion = $config?->direccion ?? 'DIRECCION REAL';

            $company = new Company;
            $company->setRuc($ruc)
                ->setRazonSocial($razonSocial)
                ->setNombreComercial($nombreComercial)
                ->setAddress((new Address)
                    ->setUbigueo($ubigeo)
                    ->setDepartamento($departamento)
                    ->setProvincia($provincia)
                    ->setDistrito($distrito)
                    ->setUrbanizacion('-')
                    ->setDireccion($direccion)
                    ->setCodLocal('0000'));

            $resumen = (new Summary)
                ->setCorrelativo($this->nuevoCorrelativoResumen($teamId)) // ✅ Pasar teamId
                ->setFecGeneracion(new \DateTime($fecha))
                ->setFecResumen(new \DateTime($fecha))
                ->setMoneda('PEN')
                ->setCompany($company);

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

            $result = $this->see->send($resumen);

            if (! $result->isSuccess()) {
                return response()->json([
                    'success' => false,
                    'error' => $result->getError()->getMessage(),
                ], 500);
            }

            $ticket = $result->getTicket();
            $filename = $resumen->getName();

            foreach ($boletas as $boleta) {
                $boleta->resumen_ticket = $ticket;
                $boleta->save();
            }

            Storage::makeDirectory('resumenes');
            Storage::put(
                "resumenes/{$filename}.xml",
                $this->see->getFactory()->getLastXml()
            );

            $cdrResult = $this->see->getStatus($ticket);

            if (! $cdrResult->isSuccess()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Error al consultar el CDR: '.$cdrResult->getError()->getMessage(),
                    'ticket' => $ticket,
                    'file' => $filename,
                ], 500);
            }

            Storage::makeDirectory('resumenes/cdr');
            Storage::put(
                "resumenes/cdr/{$filename}.zip",
                $cdrResult->getCdrZip()
            );

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

    public function consultarCdr(Request $request)
    {
        $request->validate([
            'ticket' => 'required|string',
            'filename' => 'required|string',
        ]);

        $ticket = $request->input('ticket');
        $filename = $request->input('filename');
        $teamId = auth()->user()->current_team_id;

        try {
            // ✅ Sobrescribir See con config de la empresa
            $config = \App\Models\ConfiguracionFacturacion::where('team_id', $teamId)->first();
            if ($config) {
                if ($config->certificado_path) {
                    $certPath = storage_path('app/certificates/'.$config->certificado_path);
                    if (file_exists($certPath)) {
                        $this->see->setCertificate(file_get_contents($certPath));
                    }
                }
                if ($config->sol_usuario && $config->sol_clave) {
                    $this->see->setClaveSOL($config->ruc, $config->sol_usuario, $config->sol_clave);
                }
                if ($config->sunat_url) {
                    $this->see->setService($config->sunat_url);
                }
            }

            $cdrResult = $this->see->getStatus($ticket);

            if (! $cdrResult->isSuccess()) {
                return response()->json([
                    'success' => false,
                    'error' => $cdrResult->getError()->getMessage(),
                    'ticket' => $ticket,
                ], 500);
            }

            Storage::makeDirectory('resumenes/cdr');
            Storage::put(
                "resumenes/cdr/{$filename}.zip",
                $cdrResult->getCdrZip()
            );

            // ✅ Filtrar por team_id
            Factura::where('team_id', $teamId)
                ->where('resumen_ticket', $ticket)
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

    // ✅ Ahora recibe $teamId
    private function nuevoCorrelativoResumen($teamId)
    {
        $ultimoResumen = Factura::where('team_id', $teamId)
            ->whereNotNull('resumen_id')
            ->orderBy('idfactura', 'desc')
            ->first();

        if (! $ultimoResumen) {
            return '1';
        }

        $partes = explode('-', $ultimoResumen->resumen_id);
        $ultimoCorrelativo = (int) str_replace('.zip', '', ($partes[3] ?? '0'));

        return (string) ($ultimoCorrelativo + 1);
    }

    public function downloadXml($filename)
    {
        $path = "resumenes/{$filename}.xml";
        if (! Storage::exists($path)) {
            return response()->json(['success' => false, 'error' => 'XML no encontrado'], 404);
        }
        return Storage::download($path);
    }

    public function downloadCdr($filename)
    {
        $path = "resumenes/cdr/{$filename}.zip";
        if (! Storage::exists($path)) {
            return response()->json(['success' => false, 'error' => 'CDR no encontrado'], 404);
        }
        return Storage::download($path);
    }
}