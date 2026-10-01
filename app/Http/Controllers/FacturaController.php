<?php

namespace App\Http\Controllers;

use App\Models\Factura;
use App\Services\CorrelativoService;
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
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class FacturaController extends Controller
{
    private $see;

    public function __construct(
        private readonly CorrelativoService $correlativos,
    ) {
        $this->see = new See;
        $this->see->setCertificate($this->certificado());
        $this->see->setService(config('sunat.url'));
        $this->see->setClaveSOL(
            config('sunat.ruc'),
            config('sunat.usuario_sol'),
            config('sunat.clave_sol')
        );
    }

    /**
     * Lee el certificado digital configurado. Falla con un mensaje claro si no
     * existe, en lugar de propagar un error de tipo al iniciar la emision.
     */
    private function certificado(): string
    {
        $ruta = storage_path(config('sunat.certificado'));

        if (! is_file($ruta)) {
            throw new \RuntimeException("No se encontro el certificado digital en {$ruta}. Verifique SUNAT_CERT_PATH.");
        }

        $contenido = file_get_contents($ruta);

        if ($contenido === false || $contenido === '') {
            throw new \RuntimeException("El certificado digital en {$ruta} esta vacio o no se pudo leer.");
        }

        return $contenido;
    }

    private function reservarCorrelativoYCrearFactura(string $serie, Request $request): Factura
    {
        // Siembra el contador desde las facturas existentes para no repetir
        // un correlativo que SUNAT ya tenga registrado.
        $this->correlativos->sembrarDesdeFacturas($serie);

        $nuevoCorrelativo = $this->correlativos->siguiente($serie);
        $cliente = $this->datosCliente($request);

        $factura = new Factura;
        $factura->serie = $serie;
        $factura->correlativo = $nuevoCorrelativo;
        $factura->vendedor = $request->input('vendedor.nombre');
        $factura->fecha_emitido = now();
        $factura->Cliente = $cliente['razon_social'];
        $factura->documento_cliente = $cliente['numero'];

        // `documento` es exclusivamente el nombre del PDF emitido. Antes de
        // que SUNAT responde no hay archivo, asi que queda en null.
        $factura->documento = null;
        $factura->estado_sunat = 'procesando';
        $factura->montototal = 0;

        // La sede solo ordena la informacion para la UI: el correlativo es
        // compartido por RUC, no por equipo.
        $teamId = auth()->user()?->current_team_id;
        if (is_int($teamId) && $teamId > 0) {
            $factura->team_id = $teamId;
        }

        $factura->save();

        return $factura;
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
                'client.razon_social' => 'required_if:tipo_documento,01',
                // En boleta el DNI es opcional y el nombre nunca se usa: ambos
                // los fija datosCliente().
                'client.dni' => 'nullable|string',
                'client.nombres' => 'nullable|string',
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

            $company = new Company;
            $company->setRuc(config('sunat.ruc'))
                ->setRazonSocial(config('sunat.razon_social'))
                ->setNombreComercial(config('sunat.nombre_comercial'))
                ->setAddress((new Address)
                    ->setUbigueo(config('sunat.ubigeo'))
                    ->setDepartamento(config('sunat.departamento'))
                    ->setProvincia(config('sunat.provincia'))
                    ->setDistrito(config('sunat.distrito'))
                    ->setUrbanizacion('-')
                    ->setDireccion(config('sunat.direccion'))
                    ->setCodLocal(config('sunat.cod_local')));

            // Configurar cliente
            $datos = $this->datosCliente($request);

            $client = new Client;
            $client->setTipoDoc($datos['tipo_doc'])
                ->setNumDoc($datos['numero'])
                ->setRznSocial($datos['razon_social']);

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
                ->setCorrelativo((string) $correlativo)
                ->setFechaEmision(new \DateTime)
                ->setFormaPago(new FormaPagoContado)
                ->setTipoMoneda('PEN')
                ->setCompany($company)
                ->setClient($client);

            // Procesar detalles. SUNAT valida que MtoValorVenta sea exactamente
            // MtoValorUnitario * Cantidad y que el IGV sea el 18% de la base, por
            // eso la aritmetica va de la base hacia el total. Derivando la base
            // con una division y luego repartiendo el IGV, el redondeo a dos
            // decimales descuadra en la mayoria de los precios (por ejemplo
            // 1.00 x 2 daba 0.85 * 2 != 1.69) y SUNAT rechaza la linea.
            $details = [];
            $baseImponible = 0.0;
            $impuestoTotal = 0.0;
            $totalPagado = 0.0;

            $incluidoIgv = $request->input('incluidoigv', false);

            foreach ($request->input('items') as $item) {
                $cantidad = (float) $item['quantity'];
                $precioUnitario = (float) $item['unit_price'];

                if ($incluidoIgv) {
                    $valorUnitario = round($precioUnitario / 1.18, 2);
                    $valorVenta = round($valorUnitario * $cantidad, 2);
                    $igv = round($valorVenta * 0.18, 2);
                    $mtoPrecioUnitario = round($valorVenta + $igv / $cantidad, 2);
                } else {
                    $valorUnitario = round($precioUnitario, 2);
                    $valorVenta = round($valorUnitario * $cantidad, 2);
                    $igv = 0.0;
                    $mtoPrecioUnitario = $valorUnitario;
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
                    ->setMtoPrecioUnitario($mtoPrecioUnitario);

                $details[] = $detail;
                $baseImponible = round($baseImponible + $valorVenta, 2);
                $impuestoTotal = round($impuestoTotal + $igv, 2);
                $totalPagado = round($totalPagado + $valorVenta + $igv, 2);
            }

            // El total del comprobante se reconstruye sumando las lineas ya
            // cuadreadas, no multiplicando el precio original.
            $invoice->setMtoOperGravadas($incluidoIgv ? $baseImponible : 0.0)
                ->setMtoOperExoneradas($incluidoIgv ? 0.0 : $baseImponible)
                ->setMtoIGV($impuestoTotal)
                ->setTotalImpuestos($impuestoTotal)
                ->setValorVenta($baseImponible)
                ->setSubTotal($totalPagado)
                ->setMtoImpVenta($totalPagado)
                ->setDetails($details)
                ->setLegends([
                    (new Legend)
                        ->setCode('1000')
                        ->setValue($this->numberToWords($totalPagado)),
                ]);

            $filename = $invoice->getName();

            if (Storage::exists("invoices/{$filename}.xml")) {
                \Log::critical("Intento de sobrescribir un comprobante ya emitido: {$filename}");
                throw new \Exception("Ya existe un comprobante emitido con el nombre {$filename}.");
            }

            // El XML se firma y se guarda ANTES de enviarlo. Si la peticion se
            // pierde o send() lanza una excepcion, este archivo es lo unico que
            // deja constancia del numero que salio hacia SUNAT; leerlo despues
            // del envio perderia esa evidencia.
            Storage::makeDirectory('invoices');
            $xmlFirmado = $this->see->getXmlSigned($invoice);
            Storage::put("invoices/{$filename}.xml", $xmlFirmado);

            $result = $this->see->send($invoice);

            if ($result->isSuccess()) {
                $cdr = $result->getCdrResponse();

                Storage::makeDirectory('invoices/cdr');
                Storage::put("invoices/cdr/{$filename}.zip", $result->getCdrZip());

                $vendedor = $request->input('vendedor.nombre');
                $factura->montototal = $totalPagado;
                $factura->documento = $filename.'.pdf';
                $factura->estado_sunat = 'aceptado';
                $factura->codigo_sunat = $cdr->getCode();
                $factura->save();

                $this->correlativos->registrarEstado($serie, 'aceptado', $filename);

                try {
                    $this->generatePdfFromXml($filename, $vendedor);
                } catch (\Throwable $e) {
                    \Log::error("Comprobante {$filename} aceptado por SUNAT pero falló el PDF: ".$e->getMessage());
                }

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

                $errorCode = $result->getError()->getCode();
                $errorMessage = $result->getError()->getMessage();
                $factura->montototal = $totalPagado;
                $factura->documento = null;
                $factura->estado_sunat = 'rechazado';
                $factura->error_sunat = $errorMessage;
                $factura->codigo_sunat = $errorCode ?: 'ERROR';
                $factura->save();

                $this->correlativos->registrarEstado($serie, 'rechazado', $filename);

                \Log::error('SUNAT rechazó el comprobante: '.$errorMessage, [
                    'serie' => $serie,
                    'correlativo' => $correlativo,
                    'tipo_documento' => $request->input('tipo_documento'),
                ]);

                \Log::error('SUNAT rechazó el comprobante', [
                    'codigo' => $errorCode,
                    'mensaje' => $errorMessage,
                    'serie' => $serie,
                    'correlativo' => $correlativo,
                    'tipo_documento' => $request->input('tipo_documento'),
                ]);

                $response = [
                    'success' => false,
                    'error' => $errorMessage,
                    'codigo' => $errorCode,
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

                $this->correlativos->registrarEstado($factura->serie, 'error_tecnico', $filename ?? null);
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
                    'phone' => '(+51) 962-XXX-XXX',
                    'email' => 'facturacion@sevenheart.pe',
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
        return $this->descargarComprobante($filename, "invoices/{$filename}.xml", 'XML');
    }

    public function downloadCdr($filename)
    {
        return $this->descargarComprobante($filename, "invoices/cdr/{$filename}.zip", 'CDR');
    }

    public function downloadPdf($filename)
    {
        return $this->descargarComprobante($filename, "invoices/{$filename}.pdf", 'PDF');
    }

    /**
     * Sirve un archivo de comprobante solo si pertenece a la sede actual. El
     * nombre del archivo es el RUC seguido de la serie y el correlativo, asi que
     * sin esta comprobacion cualquier usuario autenticado podria descargar
     * comprobantes de otra sede por simple intuicion.
     */
    private function descargarComprobante(string $filename, string $ruta, string $tipo): mixed
    {
        if (! Storage::exists($ruta)) {
            return response()->json(['success' => false, 'error' => $tipo.' no encontrado'], 404);
        }

        $pertenece = Factura::where('documento', $filename.'.pdf')
            ->where(function ($query) {
                $query->whereNull('team_id')
                    ->orWhere('team_id', auth()->user()?->current_team_id);
            })
            ->exists();

        if (! $pertenece) {
            abort(403, 'Este comprobante no pertenece a tu sede.');
        }

        return Storage::download($ruta);
    }

    public function buscarClienteruc(Request $request, $ruccliente)
    {
        return $this->consultarApis('ruc', $ruccliente);
    }

    public function buscarClientedni(Request $request, $dnicliente)
    {
        return $this->consultarApis('reniec/dni', $dnicliente);
    }

    /**
     * Resuelve los datos del cliente segun el tipo de comprobante. Es la unica
     * fuente de verdad: la usan tanto la fila de `facturas` como el XML que se
     * manda a SUNAT, para que no puedan divergir.
     *
     * Factura (01): RUC y razon social obligatorios, tipo de documento 6.
     *
     * Boleta (03): la razon social es siempre CLIENTES VARIOS y el DNI es
     * opcional; si no se informa se usa 00000000. El nombre que escriba el
     * cajero se descarta a proposito: en una cafeteria la boleta no identifica
     * a la persona, y permitirlo abriria la puerta a comprobantes con datos
     * inconsistentes frente a lo que el RENIEC devuelve.
     *
     * @return array{tipo_doc: string, numero: string, razon_social: string}
     */
    private function datosCliente(Request $request): array
    {
        if ($request->input('tipo_documento') === '01') {
            return [
                'tipo_doc' => '6',
                'numero' => (string) $request->input('client.ruc'),
                'razon_social' => (string) $request->input('client.razon_social'),
            ];
        }

        $dni = trim((string) $request->input('client.dni'));

        return [
            'tipo_doc' => '1',
            'numero' => $dni === '' ? '00000000' : $dni,
            'razon_social' => 'CLIENTES VARIOS',
        ];
    }

    /**
     * Consulta RUC o DNI al proveedor externo usando el token de configuracion.
     */
    private function consultarApis(string $recurso, string $numero): JsonResponse
    {
        $token = config('sunat.token_consulta');

        if (! $token) {
            return response()->json([
                'success' => false,
                'error' => 'Falta configurar SUNAT_TOKEN_CONSULTA en el archivo .env',
            ], 500);
        }

        $curl = curl_init();
        curl_setopt_array($curl, [
            CURLOPT_URL => 'https://api.apis.net.pe/v2/'.$recurso.'?numero='.urlencode($numero),
            CURLOPT_RETURNTRANSFER => true,
            // La peticion viaja con el token de la API: verificar el
            // certificado del servidor es obligatorio.
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_CUSTOMREQUEST => 'GET',
            CURLOPT_HTTPHEADER => [
                'Referer: https://apis.net.pe/api-ruc',
                'Authorization: Bearer '.$token,
            ],
        ]);

        $response = curl_exec($curl);
        $error = curl_error($curl);
        curl_close($curl);

        if (! is_string($response)) {
            \Log::error('Fallo consultando el proveedor de RUC/DNI: '.$error);

            return response()->json([
                'success' => false,
                'error' => 'No se pudo consultar el servicio externo: '.($error ?: 'respuesta vacia'),
            ], 502);
        }

        return response()->json(json_decode($response, true));
    }

    public function correlativoActual(Request $request)
    {
        $serie = $request->input('serie', 'B001');

        $control = DB::table('correlativos_control')
            ->where('ruc', config('sunat.ruc'))
            ->where('serie', $serie)
            ->first();

        $correlativo = $control
            ? (int) $control->ultimo_correlativo
            : (int) (Factura::where('serie', $serie)->max('correlativo') ?? 0);

        return response()->json([
            'serie' => $serie,
            'correlativo' => $correlativo,
            'estado' => $control->estado ?? null,
            'documento' => $control->documento ?? null,
        ]);
    }

    public function nuevoCorrelativo(Request $request)
    {
        $serie = $request->input('serie', 'B001');

        $this->correlativos->sembrarDesdeFacturas($serie);

        return response()->json([
            'serie' => $serie,
            'correlativo' => $this->correlativos->proximo($serie),
        ]);
    }

    public function verificarCorreltaivo(Request $request, $correlativo)
    {
        $serie = $request->input('serie');

        $factura = Factura::query()
            ->when($serie, fn ($query) => $query->where('serie', $serie))
            ->where('correlativo', $correlativo)
            ->first();

        return response()->json(['existe' => $factura !== null]);
    }
}
