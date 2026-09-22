<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <style>
        @page {
            size: A4;
            margin: 15mm;
        }
        body {
            font-family: Arial, sans-serif;
            font-size: 10px;
            color: #333;
            margin: 0;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .bold { font-weight: bold; }
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }
        .header-table td {
            vertical-align: top;
            padding: 5px;
        }
        .logo-cell {
            width: 30%;
        }
        .logo-cell img {
            max-width: 120px;
        }
        .empresa-cell {
            width: 40%;
            font-size: 9px;
        }
        .comprobante-cell {
            width: 30%;
            border: 2px solid #333;
            border-radius: 8px;
            padding: 10px;
            text-align: center;
        }
        .comprobante-titulo {
            font-size: 14px;
            font-weight: bold;
            letter-spacing: 1px;
        }
        .comprobante-numero {
            font-size: 12px;
            font-weight: bold;
            margin-top: 5px;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #999;
            margin-bottom: 10px;
        }
        .info-table td {
            padding: 5px;
            font-size: 10px;
        }
        .info-table .label {
            font-weight: bold;
            color: #555;
        }
        .motivo-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #999;
            margin-bottom: 10px;
            background-color: #f9f9f9;
        }
        .motivo-table td {
            padding: 8px;
            font-size: 10px;
        }
        .totales-table {
            width: 40%;
            margin-left: auto;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .totales-table td {
            padding: 3px 5px;
            font-size: 10px;
        }
        .totales-table .total-final {
            font-size: 12px;
            font-weight: bold;
            border-top: 2px solid #333;
        }
        .footer {
            margin-top: 20px;
            font-size: 8px;
            text-align: center;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 10px;
        }
        .qr-cell {
            text-align: center;
            vertical-align: middle;
        }
        .qr-cell img {
            width: 100px;
            height: 100px;
        }
        .anulado {
            color: #dc2626;
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            border: 3px solid #dc2626;
            padding: 10px;
            margin: 10px 0;
            transform: rotate(-5deg);
        }
    </style>
</head>
<body>

    {{-- ENCABEZADO --}}
    <table class="header-table">
        <tr>
            {{-- LOGO --}}
            <td class="logo-cell text-center">
                <img src="{{ public_path('img/logoTiket.png') }}" alt="Logo">
            </td>

            {{-- DATOS DE LA EMPRESA --}}
            <td class="empresa-cell">
                <div class="bold" style="font-size: 12px;">{{ $company['name'] }}</div>
                <div>RUC: {{ $company['ruc'] }}</div>
                <div>{{ $company['address'] }}</div>
                <div>Tel: {{ $company['phone'] }}</div>
            </td>

            {{-- DATOS DEL COMPROBANTE --}}
            <td class="comprobante-cell">
                <div class="comprobante-titulo">NOTA DE CRÉDITO</div>
                <div style="font-size: 10px;">ELECTRÓNICA</div>
                <div class="comprobante-numero">
                    N° {{ $partes[2] ?? 'FC01' }}-{{ str_pad($partes[3] ?? '1', 8, '0', STR_PAD_LEFT) }}
                </div>
                <div style="font-size: 9px; margin-top: 5px;">
                    RUC: {{ $company['ruc'] }}
                </div>
            </td>
        </tr>
    </table>

    {{-- DOCUMENTO QUE MODIFICA --}}
    <div class="motivo-table">
        <table style="width: 100%;">
            <tr>
                <td width="30%"><span class="label">Documento que modifica:</span></td>
                <td width="70%"><strong>{{ $nota['documento_afectado'] }}</strong></td>
            </tr>
            <tr>
                <td><span class="label">Motivo:</span></td>
                <td><strong>{{ $nota['motivo_descripcion'] }}</strong></td>
            </tr>
        </table>
    </div>

    {{-- DATOS DEL CLIENTE --}}
    <table class="info-table">
        <tr>
            <td width="50%">
                <span class="label">Señor(es):</span> {{ $client['name'] }}
            </td>
            <td width="50%">
                <span class="label">{{ $etiquetaDoc }}:</span> {{ $client['ruc'] }}
            </td>
        </tr>
        <tr>
            <td>
                <span class="label">Fecha de Emisión:</span> {{ $nota['date'] }}
            </td>
            <td>
                <span class="label">Tipo Moneda:</span> {{ $client['tipomoneda'] }}
            </td>
        </tr>
    </table>

    {{-- SELLO DE ANULADO --}}
    <div class="anulado">ANULADO</div>

    {{-- TOTALES --}}
    <table class="totales-table">
        <tr>
            <td class="text-right">Op. Gravadas:</td>
            <td class="text-right">S/ {{ number_format($nota['mto_oper_gravadas'], 2) }}</td>
        </tr>
        <tr>
            <td class="text-right">IGV (18%):</td>
            <td class="text-right">S/ {{ number_format($nota['mto_igv'], 2) }}</td>
        </tr>
        <tr class="total-final">
            <td class="text-right">IMPORTE TOTAL:</td>
            <td class="text-right">S/ {{ number_format($nota['mto_imp_venta'], 2) }}</td>
        </tr>
    </table>

    {{-- LEYENDA --}}
    <div style="margin-top: 15px; font-size: 10px;">
        <span class="bold">SON:</span> {{ $nota['note'] }}
    </div>

    {{-- QR Y HASH --}}
    <table style="width: 100%; margin-top: 20px;">
        <tr>
            <td class="qr-cell" width="20%">
                <img src="{{ $nota['qr'] }}" alt="QR">
            </td>
            <td style="vertical-align: middle; padding-left: 15px;">
                <div style="font-size: 9px; color: #555;">
                    <span class="bold">Hash:</span><br>
                    <span style="word-break: break-all;">{{ $nota['hash'] }}</span>
                </div>
            </td>
        </tr>
    </table>

    {{-- FOOTER --}}
    <div class="footer">
        Representación impresa de la NOTA DE CRÉDITO ELECTRÓNICA.<br>
        Autorizado mediante Resolución N° 034-005-5929/SUNAT<br>
        Consulta tu comprobante en www.sunat.gob.pe
    </div>

</body>
</html>