<?php

namespace App\Http\Controllers;

use App\Models\Factura;
use App\Models\NotaCredito;
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
            // 1. Obtener la factura original
            $factura = Factura::findOrFail($request->input('factura_id'));

            // 2. Verificar que la factura no tenga ya una nota de crédito
            $notaExistente = NotaCredito::where('factura_id', $factura->idfactura)
                ->where('estado_sunat', 'aceptado')
                ->first();

            if ($notaExistente) {
                return response()->json([
                    'success' => false,
                    'error' => 'Esta factura ya tiene una Nota de Crédito emitida.',
                ], 422);
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

            // 4. Configurar cliente
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

            // 5. Generar correlativo de la Nota de Crédito
            $tipoNota = substr($factura->serie, 0, 1) === 'F' ? 'FC01' : 'BC01';
            $correlativo = (NotaCredito::where('serie', $tipoNota)->max('correlativo') ?? 0) + 1;

            // 6. Crear la Nota de Crédito
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

            // 7. Detalle genérico
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

            // 8. Enviar a SUNAT
            $result = $this->see->send($note);

            // 9. Guardar la Nota de Crédito
            $notaCredito = new NotaCredito;
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

                $this->generatePdfFromXml($filename);

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
    private function generatePdfFromXml($filename)
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
                    'phone' => '(+51) 953-992-277',
                    'ruc' => $xpath->evaluate('string(//cac:AccountingSupplierParty/cac:Party/cac:PartyIdentification/cbc:ID)'),
                    'logo' => public_path('img/logoTiket.png'),
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

    /**
     * Descarga el XML de la Nota de Crédito.
     */
    public function downloadXml($filename)
    {
        $path = "notas_credito/{$filename}.xml";
        if (! Storage::exists($path)) {
            return response()->json(['success' => false, 'error' => 'XML no encontrado'], 404);
        }

        return Storage::download($path);
    }

    /**
     * Descarga el CDR de la Nota de Crédito.
     */
    public function downloadCdr($filename)
    {
        $path = "notas_credito/cdr/{$filename}.zip";
        if (! Storage::exists($path)) {
            return response()->json(['success' => false, 'error' => 'CDR no encontrado'], 404);
        }

        return Storage::download($path);
    }

    /**
     * Descarga el PDF de la Nota de Crédito.
     */
    public function downloadPdf($filename)
    {
        $path = "notas_credito/{$filename}.pdf";
        if (! Storage::exists($path)) {
            return response()->json(['success' => false, 'error' => 'PDF no encontrado'], 404);
        }

        return Storage::download($path);
    }
}
