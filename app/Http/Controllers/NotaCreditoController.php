<?php

namespace App\Http\Controllers;

use App\Models\Factura;
use App\Models\NotaCredito;
use Barryvdh\DomPDF\Facade\Pdf;
use Greenter\Model\Client\Client;
use Greenter\Model\Company\Address;
use Greenter\Model\Company\Company;
use Greenter\Model\Sale\Note;
use Greenter\Model\Sale\SaleDetail;
use Greenter\See;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class NotaCreditoController extends Controller
{
    private $see;

    public function __construct()
    {
        // Respaldo global (fallback)
        $this->see = new See;
        $this->see->setCertificate(file_get_contents(storage_path('app/certificates/certificate.pem')));
        $this->see->setService(env('SUNAT_URL'));
    }

    /**
     * Emite una Nota de Crédito para anular una factura/boleta.
     */
    public function emitir(Request $request)
    {
        $request->validate([
            'factura_id' => 'required|exists:facturas,idfactura',
            'motivo_codigo' => 'required|in:01,02,03,04,05,06,07,08,09,10',
            'motivo_descripcion' => 'required|string|max:255',
        ]);

        try {
            // ✅ 1. Leer configuración de la BD de ESTA empresa
            $teamId = auth()->user()->current_team_id;
            $config = \App\Models\ConfiguracionFacturacion::where('team_id', $teamId)->first();

            // ✅ 2. Sobrescribir See con la config de la empresa
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

            // ✅ 3. Verificar que la factura pertenece a ESTA empresa
            $factura = Factura::where('idfactura', $request->input('factura_id'))
                ->where('team_id', $teamId)
                ->firstOrFail();

            // 4. Verificar que la factura no tenga ya una nota de crédito
            $notaExistente = NotaCredito::where('factura_id', $factura->idfactura)
                ->where('estado_sunat', 'aceptado')
                ->first();

            if ($notaExistente) {
                return response()->json([
                    'success' => false,
                    'error' => 'Esta factura ya tiene una Nota de Crédito emitida.',
                ], 422);
            }

            // ✅ 5. Datos de empresa desde config o fallback
            $ruc = $config?->ruc ?? env('GREENTER_RUC');
            $razonSocial = $config?->razon_social ?? 'SEVEN HEART SOCIEDAD ANONIMA CERRADA';
            $nombreComercial = $config?->nombre_comercial ?? 'DOLCE CAFFE';
            $ubigeo = $config?->ubigeo ?? '100101';
            $departamento = $config?->departamento ?? 'HUANUCO';
            $provincia = $config?->provincia ?? 'HUANUCO';
            $distrito = $config?->distrito ?? 'HUANUCO';
            $direccion = $config?->direccion ?? 'DIRECCION REAL';

            // ✅ Datos para el PDF
            $telefonoEmpresa = $config?->telefono ?? '(+51) 953-992-277';
            $emailEmpresa = $config?->email ?? 'facturacion@sevenheart.pe';
            $logoPath = $config?->logo_path ? storage_path('app/public/'.$config->logo_path) : public_path('img/logoTiket.png');

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

            // 6. Configurar cliente
            $client = new Client;
            if (substr($factura->serie, 0, 1) === 'F') {
                $client->setTipoDoc('6')
                    ->setNumDoc($factura->Cliente)
                    ->setRznSocial($factura->Cliente);
            } else {
                $client->setTipoDoc('1')
                    ->setNumDoc('00000000')
                    ->setRznSocial($factura->Cliente);
            }

            // ✅ 7. Correlativo filtrado por team_id
            $tipoNota = substr($factura->serie, 0, 1) === 'F' ? 'FC01' : 'BC01';
            $correlativo = (NotaCredito::where('team_id', $teamId)
                            ->where('serie', $tipoNota)
                            ->max('correlativo') ?? 0) + 1;

            // 8. Crear la Nota de Crédito
            $note = (new Note)
                ->setUblVersion('2.1')
                ->setTipoDoc('07')
                ->setSerie($tipoNota)
                ->setCorrelativo($correlativo)
                ->setFechaEmision(new \DateTime)
                ->setTipDocAfectado(substr($factura->serie, 0, 1) === 'F' ? '01' : '03')
                ->setNumDocfectado($factura->serie.'-'.$factura->correlativo)
                ->setCodMotivo($request->input('motivo_codigo'))
                ->setDesMotivo($request->input('motivo_descripcion'))
                ->setTipoMoneda('PEN')
                ->setCompany($company)
                ->setClient($client)
                ->setMtoOperGravadas(round($factura->montototal / 1.18, 2))
                ->setMtoIGV(round($factura->montototal - ($factura->montototal / 1.18), 2))
                ->setTotalImpuestos(round($factura->montototal - ($factura->montototal / 1.18), 2))
                ->setMtoImpVenta($factura->montototal);

            // 9. Detalle genérico
            $detail = (new SaleDetail)
                ->setCodProducto('ANULACION')
                ->setUnidad('NIU')
                ->setDescripcion('ANULACIÓN TOTAL DE LA OPERACIÓN')
                ->setCantidad(1)
                ->setMtoValorUnitario(round($factura->montototal / 1.18, 2))
                ->setMtoValorVenta(round($factura->montototal / 1.18, 2))
                ->setMtoBaseIgv(round($factura->montototal / 1.18, 2))
                ->setPorcentajeIgv(18)
                ->setIgv(round($factura->montototal - ($factura->montototal / 1.18), 2))
                ->setTipAfeIgv('10')
                ->setTotalImpuestos(round($factura->montototal - ($factura->montototal / 1.18), 2))
                ->setMtoPrecioUnitario($factura->montototal);

            $note->setDetails([$detail]);

            // 10. Enviar a SUNAT
            $result = $this->see->send($note);

            // ✅ 11. Guardar la Nota de Crédito CON team_id
            $notaCredito = new NotaCredito;
            $notaCredito->team_id = $teamId; // ← NUEVO
            $notaCredito->factura_id = $factura->idfactura;
            $notaCredito->serie = $tipoNota;
            $notaCredito->correlativo = $correlativo;
            $notaCredito->tipo_documento = substr($factura->serie, 0, 1) === 'F' ? '01' : '03';
            $notaCredito->motivo_codigo = $request->input('motivo_codigo');
            $notaCredito->motivo_descripcion = $request->input('motivo_descripcion');
            $notaCredito->monto = $factura->montototal;
            $notaCredito->cliente = $factura->Cliente;
            $notaCredito->cliente_documento = '00000000';

            if ($result->isSuccess()) {
                $cdr = $result->getCdrResponse();
                $filename = $note->getName();

                Storage::makeDirectory('notas_credito');
                Storage::makeDirectory('notas_credito/cdr');

                Storage::put(
                    "notas_credito/{$filename}.xml",
                    $this->see->getFactory()->getLastXml()
                );
                Storage::put(
                    "notas_credito/cdr/{$filename}.zip",
                    $result->getCdrZip()
                );

                $notaCredito->estado_sunat = 'aceptado';
                $notaCredito->codigo_sunat = $cdr->getCode();
                $notaCredito->documento = $filename.'.pdf';
                $notaCredito->save();

                // ✅ Pasamos los datos de la empresa para el PDF
                $this->generatePdfFromXml($filename, $telefonoEmpresa, $emailEmpresa, $logoPath);

                $response = [
                    'success' => true,
                    'file' => $filename,
                    'code' => $cdr->getCode(),
                    'message' => $cdr->getDescription(),
                    'nota_id' => $notaCredito->id,
                    'pdf_url' => url("sunat/nota-credito/pdf/{$filename}"),
                    'xml_url' => url("sunat/nota-credito/xml/{$filename}"),
                    'cdr_url' => url("sunat/nota-credito/cdr/{$filename}"),
                ];
            } else {
                $errorMessage = $result->getError()->getMessage();

                $notaCredito->estado_sunat = 'rechazado';
                $notaCredito->error_sunat = $errorMessage;
                $notaCredito->save();

                \Log::error('SUNAT rechazó la Nota de Crédito: '.$errorMessage);

                $response = [
                    'success' => false,
                    'error' => $errorMessage,
                ];
            }

            return response()->json($response);
        } catch (\Exception $e) {
            \Log::error('Error al emitir Nota de Crédito: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Genera el PDF de la Nota de Crédito desde el XML.
     */
    private function generatePdfFromXml($filename, $telefono, $email, $logoPath)
    {
        try {
            $xmlPath = "notas_credito/{$filename}.xml";
            if (! Storage::exists($xmlPath)) {
                throw new \Exception("XML no encontrado: {$xmlPath}");
            }

            $xmlContent = Storage::get($xmlPath);
            $dom = new \DOMDocument;
            $dom->loadXML($xmlContent, LIBXML_NOCDATA);
            $xpath = new \DOMXPath($dom);

            $xpath->registerNamespace('cbc', 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2');
            $xpath->registerNamespace('cac', 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2');
            $xpath->registerNamespace('ds', 'http://www.w3.org/2000/09/xmldsig#');

            $data = [
                'company' => [
                    'name' => $xpath->evaluate('string(//cac:AccountingSupplierParty/cac:Party/cac:PartyLegalEntity/cbc:RegistrationName)'),
                    'address' => $xpath->evaluate('string(//cac:AccountingSupplierParty/cac:Party/cac:PartyLegalEntity/cac:RegistrationAddress/cac:AddressLine/cbc:Line)'),
                    'phone' => $telefono, // ✅ Dinámico
                    'email' => $email,     // ✅ Dinámico
                    'ruc' => $xpath->evaluate('string(//cac:AccountingSupplierParty/cac:Party/cac:PartyIdentification/cbc:ID)'),
                    'logo' => $logoPath,   // ✅ Dinámico
                ],
                'client' => [
                    'ruc' => $xpath->evaluate('string(//cac:AccountingCustomerParty/cac:Party/cac:PartyIdentification/cbc:ID)'),
                    'name' => $xpath->evaluate('string(//cac:AccountingCustomerParty/cac:Party/cac:PartyLegalEntity/cbc:RegistrationName)'),
                    'tipomoneda' => 'Soles',
                ],
                'nota' => [
                    'date' => $xpath->evaluate('string(//cbc:IssueDate)'),
                    'documento_afectado' => $xpath->evaluate('string(//cac:BillingReference/cac:InvoiceDocumentReference/cbc:ID)'),
                    'motivo_descripcion' => $xpath->evaluate('string(//cac:DiscrepancyResponse/cbc:Description)'),
                    'mto_oper_gravadas' => floatval($xpath->evaluate('string(//cac:LegalMonetaryTotal/cbc:LineExtensionAmount)')) ?: 0,
                    'mto_igv' => floatval($xpath->evaluate('string(//cac:TaxTotal/cbc:TaxAmount)')) ?: 0,
                    'mto_imp_venta' => floatval($xpath->evaluate('string(//cac:LegalMonetaryTotal/cbc:PayableAmount)')),
                    'note' => $xpath->evaluate('string(//cbc:Note)'),
                    'hash' => $xpath->evaluate('string(//ds:DigestValue)') ?: '1234567890',
                    'qr' => storage_path("app/qr_{$filename}.png"),
                ],
            ];

            $partes = explode('-', $filename);
            $etiquetaDoc = 'RUC';

            $pdf = Pdf::loadView('pdf.nota-credito', array_merge($data, [
                'partes' => $partes,
                'etiquetaDoc' => $etiquetaDoc,
            ]))->setPaper('a4', 'portrait');

            $pdfContent = $pdf->output();
            Storage::put("notas_credito/{$filename}.pdf", $pdfContent);

            return "notas_credito/{$filename}.pdf";
        } catch (\Exception $e) {
            \Log::error('Error generando PDF de Nota de Crédito: '.$e->getMessage());
            throw $e;
        }
    }

    public function downloadXml($filename)
    {
        $path = "notas_credito/{$filename}.xml";
        if (! Storage::exists($path)) {
            return response()->json(['success' => false, 'error' => 'XML no encontrado'], 404);
        }

        return Storage::download($path);
    }

    public function downloadCdr($filename)
    {
        $path = "notas_credito/cdr/{$filename}.zip";
        if (! Storage::exists($path)) {
            return response()->json(['success' => false, 'error' => 'CDR no encontrado'], 404);
        }

        return Storage::download($path);
    }

    public function downloadPdf($filename)
    {
        $path = "notas_credito/{$filename}.pdf";
        if (! Storage::exists($path)) {
            return response()->json(['success' => false, 'error' => 'PDF no encontrado'], 404);
        }

        return Storage::download($path);
    }
}