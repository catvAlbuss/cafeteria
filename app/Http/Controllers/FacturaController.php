<?php

namespace App\Http\Controllers;

use App\Models\Factura;
use Barryvdh\DomPDF\Facade\Pdf;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;
use Greenter\Model\Client\Client;
use Greenter\Model\Company\Address;
use Greenter\Model\Company\Company;
use Greenter\Model\Sale\FormaPagos\FormaPagoContado;
use Greenter\Model\Sale\Invoice;
use Greenter\Model\Sale\Legend;
use Greenter\Model\Sale\SaleDetail;
use Greenter\See;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class FacturaController extends Controller
{
    private $see;

    public function __construct()
    {
        $this->see = new See;
        $this->see->setCertificate(file_get_contents(storage_path('app/certificates/certificate.pem')));
        $this->see->setService(env('SUNAT_URL'));
    }

    private function reservarCorrelativoYCrearFactura(string $serie, Request $request): Factura
    {
        return DB::transaction(function () use ($serie, $request) {
            $control = DB::table('correlativos_control')
                ->where('serie', $serie)
                ->lockForUpdate()
                ->first();

            if (! $control) {
                $ultimoCorrelativo = Factura::where('serie', $serie)
                    ->pluck('correlativo')
                    ->max(fn ($correlativo) => (int) $correlativo) ?? 0;

                DB::table('correlativos_control')->insert([
                    'serie' => $serie,
                    'ultimo_correlativo' => $ultimoCorrelativo,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $control = DB::table('correlativos_control')
                    ->where('serie', $serie)
                    ->lockForUpdate()
                    ->first();
            }

            $nuevoCorrelativo = $control->ultimo_correlativo + 1;

            DB::table('correlativos_control')
                ->where('serie', $serie)
                ->update([
                    'ultimo_correlativo' => $nuevoCorrelativo,
                    'updated_at' => now(),
                ]);

            $factura = new Factura;
            $factura->serie = $serie;
            $factura->correlativo = $nuevoCorrelativo;
            $factura->vendedor = $request->input('vendedor.nombre');
            $factura->fecha_emitido = now();
            $factura->Cliente = $request->input('client.razon_social') ?? $request->input('client.nombres');
            $factura->documento = $request->input('client.ruc') ?? $request->input('client.dni') ?? '00000000';
            $factura->estado_sunat = 'procesando';
            $factura->montototal = 0;
            $factura->save();

            return $factura;
        });
    }

    public function generateInvoice(Request $request)
    {
        try {
            $request->validate([
                'serie' => 'required|string',
                'tipo_documento' => 'required|in:01,03',
                'incluidoigv' => 'boolean',
                'client' => 'required|array',
                'client.ruc' => 'required_if:tipo_documento,01',
                'client.dni' => 'required_if:tipo_documento,03',
                'client.razon_social' => 'required_if:tipo_documento,01',
                'client.nombres' => 'required_if:tipo_documento,03',
                'client.direccion' => 'required|string',
                'client.ubigeo' => 'required|string',
                'items' => 'required|array|min:1',
                'items.*.code' => 'required|string',
                'items.*.description' => 'required|string',
                'items.*.quantity' => 'required|numeric|min:0',
                'items.*.unit_price' => 'required|numeric|min:0',
                'vendedor.nombre' => 'required|string',
                'items.*.idproducto' => 'required|exists:platos,id',
            ]);

            // Configurar empresa emisora
            $company = new Company;
            $company->setRuc('20000000001')
                ->setRazonSocial('DOLCE CAFFE SAC')
                ->setNombreComercial('DOLCE CAFFE')
                ->setAddress((new Address)
                    ->setUbigueo('100101')
                    ->setDepartamento('HUANUCO')
                    ->setProvincia('HUANUCO')
                    ->setDistrito('HUANUCO')
                    ->setUrbanizacion('-')
                    ->setDireccion('AV. PRINCIPAL 123')
                    ->setCodLocal('0000'));

            // Configurar cliente
            $client = new Client;
            if ($request->input('tipo_documento') === '01') {
                $client->setTipoDoc('6')
                    ->setNumDoc($request->input('client.ruc'))
                    ->setRznSocial($request->input('client.razon_social'));
            } else {
                $client->setTipoDoc('1')
                    ->setNumDoc($request->input('client.dni'))
                    ->setRznSocial($request->input('client.nombres'));
            }
            $client->setAddress((new Address)
                ->setUbigueo($request->input('client.ubigeo'))
                ->setDepartamento($request->input('client.departamento'))
                ->setProvincia($request->input('client.provincia'))
                ->setDistrito($request->input('client.distrito'))
                ->setUrbanizacion('-')
                ->setDireccion($request->input('client.direccion')));

            // Reservar correlativo y crear factura
            $serie = $request->input('serie');
            $factura = $this->reservarCorrelativoYCrearFactura($serie, $request);
            $correlativo = $factura->correlativo;

            // Crear factura/boleta
            $invoice = (new Invoice)
                ->setUblVersion('2.1')
                ->setTipoOperacion('0101')
                ->setTipoDoc($request->input('tipo_documento'))
                ->setSerie($serie)
                ->setCorrelativo($correlativo)
                ->setFechaEmision(new \DateTime)
                ->setFormaPago(new FormaPagoContado)
                ->setTipoMoneda('PEN')
                ->setCompany($company)
                ->setClient($client);

            // Procesar detalles
            $details = [];
            $total = 0;
            $totalIGV = 0;

            $incluidoIgv = $request->input('incluidoigv', false);
            foreach ($request->input('items') as $item) {
                $precioUnitario = floatval($item['unit_price']);
                $cantidad = floatval($item['quantity']);

                if ($incluidoIgv) {
                    $mtoPrecio = round($precioUnitario * $cantidad, 2);
                    $valorVenta = round($mtoPrecio / 1.18, 2);
                    $igv = round($mtoPrecio - $valorVenta, 2);
                    $valorUnitario = round($valorVenta / $cantidad, 2);
                    $precioUnitarioFinal = $precioUnitario;
                } else {
                    $valorUnitario = $precioUnitario;
                    $valorVenta = round($valorUnitario * $cantidad, 2);
                    $igv = 0;
                    $precioUnitarioFinal = $precioUnitario;
                }

                $detail = (new SaleDetail)
                    ->setCodProducto($item['code'])
                    ->setUnidad('NIU')
                    ->setDescripcion($item['description'])
                    ->setCantidad($cantidad)
                    ->setMtoValorUnitario($valorUnitario)
                    ->setMtoValorVenta($valorVenta)
                    ->setMtoBaseIgv($valorVenta)
                    ->setPorcentajeIgv($incluidoIgv ? 18 : 0)
                    ->setIgv($igv)
                    ->setTipAfeIgv($incluidoIgv ? '10' : '20')
                    ->setTotalImpuestos($igv)
                    ->setMtoPrecioUnitario($precioUnitarioFinal);

                $details[] = $detail;
                $total += $valorVenta;
                $totalIGV += $igv;
            }

            $totalVenta = round($total + $totalIGV, 2);

            $invoice->setMtoOperGravadas($incluidoIgv ? $total : 0)
                ->setMtoOperExoneradas($incluidoIgv ? 0 : $total)
                ->setMtoIGV($totalIGV)
                ->setTotalImpuestos($totalIGV)
                ->setValorVenta($total)
                ->setSubTotal($totalVenta)
                ->setMtoImpVenta($totalVenta)
                ->setDetails($details)
                ->setLegends([
                    (new Legend)
                        ->setCode('1000')
                        ->setValue($this->numberToWords($totalVenta)),
                ]);

            $result = $this->see->send($invoice);

            if ($result->isSuccess()) {
                $cdr = $result->getCdrResponse();
                $filename = $invoice->getName();

                if (Storage::exists("invoices/{$filename}.xml")) {
                    \Log::critical("Intento de sobrescribir un comprobante ya emitido: {$filename}");
                    throw new \Exception("Ya existe un comprobante emitido con el nombre {$filename}.");
                }

                Storage::makeDirectory('invoices');
                Storage::makeDirectory('invoices/cdr');
                Storage::put("invoices/{$filename}.xml", $this->see->getFactory()->getLastXml());
                Storage::put("invoices/cdr/{$filename}.zip", $result->getCdrZip());

                $vendedor = $request->input('vendedor.nombre');
                $factura->montototal = $totalVenta;
                $factura->documento = $filename.'.pdf';
                $factura->estado_sunat = 'aceptado';
                $factura->codigo_sunat = $cdr->getCode();
                $factura->save();

                $this->generatePdfFromXml($filename, $vendedor);

                $response = [
                    'success' => true,
                    'file' => $filename,
                    'code' => $cdr->getCode(),
                    'message' => $cdr->getDescription(),
                    'notes' => $cdr->getNotes(),
                    'factura_id' => $factura->idfactura,
                    'pdf_url' => url("facturacion/pdf/{$filename}"),
                    'xml_url' => url("facturacion/xml/{$filename}"),
                    'cdr_url' => url("facturacion/cdr/{$filename}"),
                ];
            } else {
                $errorMessage = $result->getError()->getMessage();
                $factura->montototal = $totalVenta;
                $factura->documento = 'rechazado.pdf';
                $factura->estado_sunat = 'rechazado';
                $factura->error_sunat = $errorMessage;
                $factura->codigo_sunat = 'ERROR';
                $factura->save();

                \Log::error('SUNAT rechazó el comprobante: '.$errorMessage, [
                    'serie' => $serie,
                    'correlativo' => $correlativo,
                    'tipo_documento' => $request->input('tipo_documento'),
                ]);

                $response = [
                    'success' => false,
                    'error' => $errorMessage,
                    'factura_id' => $factura->idfactura,
                ];
            }

            return response()->json($response);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Error de validación',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            if (isset($factura) && $factura->exists) {
                $factura->estado_sunat = 'error_tecnico';
                $factura->error_sunat = $e->getMessage();
                $factura->save();
            }

            \Log::error('Error generando comprobante: '.$e->getMessage(), [
                'serie' => $serie ?? null,
                'correlativo' => $correlativo ?? null,
            ]);

            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'file' => $filename ?? null,
                'factura_id' => $factura->idfactura ?? null,
            ], 500);
        }
    }

    private function numberToWords($number)
    {
        $formatter = new \NumberFormatter('es', \NumberFormatter::SPELLOUT);
        $intPart = floor($number);
        $decPart = round(($number - $intPart) * 100);
        $words = strtoupper($formatter->format($intPart));

        return "SON {$words} CON {$decPart}/100 SOLES";
    }

    private function generatePdfFromXml($filename, $vendedor)
    {
        try {
            $xmlPath = "invoices/{$filename}.xml";
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
            $xpath->registerNamespace('ext', 'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2');

            $details = [];
            $invoiceLines = $xpath->query('//cac:InvoiceLine');
            foreach ($invoiceLines as $line) {
                $details[] = (object) [
                    'quantity' => floatval($xpath->evaluate('string(./cbc:InvoicedQuantity)', $line)),
                    'code' => $xpath->evaluate('string(./cac:Item/cac:SellersItemIdentification/cbc:ID)', $line),
                    'description' => $xpath->evaluate('string(./cac:Item/cbc:Description)', $line),
                    'unitValue' => floatval($xpath->evaluate('string(./cac:Price/cbc:PriceAmount)', $line)),
                    'totalValue' => floatval($xpath->evaluate('string(./cbc:LineExtensionAmount)', $line)),
                ];
            }

            // Generar QR
            $ruc = $xpath->evaluate('string(//cac:AccountingSupplierParty/cac:Party/cac:PartyIdentification/cbc:ID)');
            $partesQr = explode('-', $filename);
            $tipoDocQr = $partesQr[1] ?? '03';
            $serieQr = $partesQr[2] ?? 'B001';
            $correlativoQr = $partesQr[3] ?? '1';
            $igvQr = floatval($xpath->evaluate('string(//cac:TaxTotal/cbc:TaxAmount)')) ?: 0;
            $totalQr = floatval($xpath->evaluate('string(//cac:LegalMonetaryTotal/cbc:PayableAmount)'));
            $fechaQr = $xpath->evaluate('string(//cbc:IssueDate)');
            $tipoDocClienteQr = $tipoDocQr === '01' ? '6' : '1';
            $numDocClienteQr = $xpath->evaluate('string(//cac:AccountingCustomerParty/cac:Party/cac:PartyIdentification/cbc:ID)');
            $hashQr = $xpath->evaluate('string(//ds:DigestValue)') ?: '1234567890';

            $qrData = implode('|', [
                $ruc,
                $tipoDocQr,
                $serieQr,
                $correlativoQr,
                number_format($igvQr, 2, '.', ''),
                number_format($totalQr, 2, '.', ''),
                $fechaQr,
                $tipoDocClienteQr,
                $numDocClienteQr,
                $hashQr,
            ]);

            $qrCode = new QrCode(
                data: $qrData,
                encoding: new Encoding('UTF-8'),
                size: 200,
                margin: 5,
            );

            $writer = new PngWriter;
            $result = $writer->write($qrCode);

            $qrPath = storage_path("app/qr_{$filename}.png");
            $result->saveToFile($qrPath);

            $data = [
                'company' => [
                    'name' => $xpath->evaluate('string(//cac:AccountingSupplierParty/cac:Party/cac:PartyLegalEntity/cbc:RegistrationName)'),
                    'address' => $xpath->evaluate('string(//cac:AccountingSupplierParty/cac:Party/cac:PartyLegalEntity/cac:RegistrationAddress/cac:AddressLine/cbc:Line)'),
                    'phone' => '(+51) 953-992-277',
                    'email' => 'example@gmail.com',
                    'ruc' => $xpath->evaluate('string(//cac:AccountingSupplierParty/cac:Party/cac:PartyIdentification/cbc:ID)'),
                    'logo' => public_path('img/logoTiket.png'),
                ],
                'invoice' => [
                    'ID' => $filename,
                    'details' => $details,
                    'taxableAmount' => floatval($xpath->evaluate('string(//cac:LegalMonetaryTotal/cbc:LineExtensionAmount)')) ?: 0,
                    'tax' => floatval($xpath->evaluate('string(//cac:TaxTotal/cbc:TaxAmount)')) ?: 0,
                    'totalAmount' => floatval($xpath->evaluate('string(//cac:LegalMonetaryTotal/cbc:PayableAmount)')),
                    'date' => $xpath->evaluate('string(//cbc:IssueDate)'),
                    'note' => $xpath->evaluate('string(//cbc:Note)'),
                    'vendedor' => $vendedor,
                    'hash' => $xpath->evaluate('string(//ds:DigestValue)') ?: '1234567890',
                    'qr' => $qrPath,
                    'paymentMethod' => 'Contado',
                ],
                'client' => [
                    'ruc' => $xpath->evaluate('string(//cac:AccountingCustomerParty/cac:Party/cac:PartyIdentification/cbc:ID)'),
                    'name' => $xpath->evaluate('string(//cac:AccountingCustomerParty/cac:Party/cac:PartyLegalEntity/cbc:RegistrationName)'),
                    'address' => $xpath->evaluate('string(//cac:AccountingCustomerParty/cac:Party/cac:PartyLegalEntity/cac:RegistrationAddress/cac:AddressLine/cbc:Line)'),
                    'tipomoneda' => 'Soles',
                ],
            ];

            $partes = explode('-', $filename);
            $tipoDoc = $partes[1] ?? '03';
            $titulo = $tipoDoc === '01' ? 'FACTURA' : 'BOLETA DE VENTA';
            $etiquetaDoc = $tipoDoc === '01' ? 'RUC' : 'DNI';

            if ($tipoDoc === '01') {
                $pdf = Pdf::loadView('pdf.factura', array_merge($data, [
                    'titulo' => $titulo,
                    'etiquetaDoc' => $etiquetaDoc,
                    'partes' => $partes,
                ]))->setPaper('a4', 'portrait');
            } else {
                $pdf = Pdf::loadView('pdf.boleta', array_merge($data, [
                    'titulo' => $titulo,
                    'etiquetaDoc' => $etiquetaDoc,
                    'partes' => $partes,
                ]))->setPaper([0, 0, 226.77, 500], 'portrait');
            }

            $pdfContent = $pdf->output();
            Storage::put("invoices/{$filename}.pdf", $pdfContent);

            return "invoices/{$filename}.pdf";
        } catch (\Exception $e) {
            \Log::error('Error generando PDF: '.$e->getMessage());
            throw $e;
        }
    }

    public function downloadXml($filename)
    {
        $path = "invoices/{$filename}.xml";
        if (! Storage::exists($path)) {
            return response()->json(['success' => false, 'error' => 'XML no encontrado'], 404);
        }

        return Storage::download($path);
    }

    public function downloadCdr($filename)
    {
        $path = "invoices/cdr/{$filename}.zip";
        if (! Storage::exists($path)) {
            return response()->json(['success' => false, 'error' => 'CDR no encontrado'], 404);
        }

        return Storage::download($path);
    }

    public function downloadPdf($filename)
    {
        $path = "invoices/{$filename}.pdf";
        if (! Storage::exists($path)) {
            return response()->json(['success' => false, 'error' => 'PDF no encontrado'], 404);
        }

        return Storage::download($path);
    }

    public function buscarClienteruc(Request $request, $ruccliente)
    {
        $token = 'apis-token-10424.XUaCDKAX2Wgac4w6lR7-u39Ael3LTdCc';
        $curl = curl_init();
        curl_setopt_array($curl, [
            CURLOPT_URL => 'https://api.apis.net.pe/v2/sunat/ruc?numero='.$ruccliente,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => 0,
            CURLOPT_CUSTOMREQUEST => 'GET',
            CURLOPT_HTTPHEADER => [
                'Referer: http://apis.net.pe/api-ruc',
                'Authorization: Bearer '.$token,
            ],
        ]);
        $response = curl_exec($curl);
        curl_close($curl);

        return response()->json(json_decode($response));
    }

    public function buscarClientedni(Request $request, $dnicliente)
    {
        $token = 'apis-token-10424.XUaCDKAX2Wgac4w6lR7-u39Ael3LTdCc';
        $curl = curl_init();
        curl_setopt_array($curl, [
            CURLOPT_URL => 'https://api.apis.net.pe/v2/reniec/dni?numero='.$dnicliente,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => 0,
            CURLOPT_CUSTOMREQUEST => 'GET',
            CURLOPT_HTTPHEADER => [
                'Referer: https://apis.net.pe/consulta-dni-api',
                'Authorization: Bearer '.$token,
            ],
        ]);
        $response = curl_exec($curl);
        curl_close($curl);

        return response()->json(json_decode($response));
    }

    public function correlativoActual()
    {
        $correlativo = Factura::max('correlativo');

        return response()->json(['correlativo' => $correlativo]);
    }

    public function nuevoCorrelativo(Request $request)
    {
        $serie = $request->input('serie', 'B001');
        $correlativo = Factura::where('serie', $serie)->max('correlativo');

        return response()->json(['correlativo' => ($correlativo ?? 0) + 1]);
    }

    public function verificarCorreltaivo($correlativo)
    {
        $factura = Factura::where('correlativo', $correlativo)->first();

        return response()->json(['existe' => $factura !== null]);
    }
}
