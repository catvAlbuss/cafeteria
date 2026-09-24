<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
@page {
    size: 80mm auto;
    margin: 0;
}
body {
    font-family: 'Courier New', monospace;
    font-size: 10px;
    margin: 0;
    padding: 3mm;
    width: 74mm;   
    color: #000;
    box-sizing: border-box;
}
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .bold { font-weight: bold; }
        .divider {
            border-top: 1px dashed #000;
            margin: 4px 0;
        }
        .divider-solid {
            border-top: 1px solid #000;
            margin: 4px 0;
        }
        .titulo {
            font-size: 13px;
            font-weight: bold;
            letter-spacing: 1px;
        }
        .subtitulo {
            font-size: 11px;
            font-weight: bold;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        table td {
            font-size: 9px;
            padding: 1px 0;
        }
        .producto-desc {
            font-size: 9px;
        }
        .total-row {
            font-size: 11px;
            font-weight: bold;
        }
        .qr {
            text-align: center;
            margin-top: 5px;
        }
        .qr img {
            width: 80px;
            height: 80px;
        }
        .footer {
            font-size: 8px;
            text-align: center;
            margin-top: 5px;
        }
        .hash {
            font-size: 6px;
            word-break: break-all;
            color: #555;
        }
    </style>
</head>
<body>

    {{-- LOGO --}}
    <div class="text-center">
        <img src="{{ public_path('img/logoTiket.png') }}" alt="Logo" style="width: 70px;">
    </div>

    {{-- DATOS DEL EMISOR --}}
    <div class="text-center">
        <div class="subtitulo">{{ $company['name'] }}</div>
        <div>RUC: {{ $company['ruc'] }}</div>
        <div>{{ $company['address'] }}</div>
        <div>Tel: {{ $company['phone'] }}</div>
    </div>

    <div class="divider"></div>

    {{-- TÍTULO --}}
    <div class="text-center">
        <div class="titulo">{{ $titulo }}</div>
        <div class="subtitulo">ELECTRÓNICA</div>
        <div style="font-size: 11px; margin-top: 3px;">
            N° {{ $partes[2] ?? 'B001' }}-{{ str_pad($partes[3] ?? '1', 8, '0', STR_PAD_LEFT) }}
        </div>
    </div>

    <div class="divider"></div>

    {{-- DATOS DEL CLIENTE --}}
    <table>
        <tr>
            <td class="text-left">Fecha:</td>
            <td class="text-right">{{ $invoice['date'] }}</td>
        </tr>
        <tr>
            <td class="text-left">Cliente:</td>
            <td class="text-right">{{ $client['name'] }}</td>
        </tr>
        <tr>
            <td class="text-left">{{ $etiquetaDoc }}:</td>
            <td class="text-right">{{ $client['ruc'] }}</td>
        </tr>
        @if($client['address'] && $client['address'] !== '-')
        <tr>
            <td class="text-left">Dirección:</td>
            <td class="text-right">{{ $client['address'] }}</td>
        </tr>
        @endif
    </table>

    <div class="divider"></div>

    {{-- PRODUCTOS --}}
    <table>
        <thead>
            <tr>
                <td class="text-left bold" style="width: 10%;">Cant</td>
                <td class="text-left bold" style="width: 60%;">Descripción</td>
                <td class="text-right bold" style="width: 30%;">Total</td>
            </tr>
        </thead>
        <tbody>
            @foreach ($invoice['details'] as $item)
            <tr>
                <td class="text-left">{{ $item->quantity }}</td>
                <td class="text-left producto-desc">{{ $item->description }}</td>
                <td class="text-right">{{ number_format($item->unitValue * $item->quantity, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="divider"></div>

    {{-- TOTALES --}}
    <table>
        <tr>
            <td class="text-left">Subtotal:</td>
            <td class="text-right">S/ {{ number_format($invoice['taxableAmount'], 2) }}</td>
        </tr>
        <tr>
            <td class="text-left">IGV (18%):</td>
            <td class="text-right">S/ {{ number_format($invoice['tax'], 2) }}</td>
        </tr>
        <tr class="total-row">
            <td class="text-left bold">TOTAL:</td>
            <td class="text-right bold">S/ {{ number_format($invoice['totalAmount'], 2) }}</td>
        </tr>
    </table>

    <div class="divider"></div>

    {{-- MÉTODO DE PAGO --}}
    <table>
        <tr>
            <td class="text-left">Método de pago:</td>
            <td class="text-right bold">{{ strtoupper($invoice['paymentMethod']) }}</td>
        </tr>
    </table>

    <div class="divider"></div>

    {{-- LEYENDA --}}
    <div class="text-center" style="font-size: 8px;">
        {{ $invoice['note'] }}
    </div>

    <div class="divider"></div>

    {{-- FOOTER --}}
    <div class="text-center">
        <div class="subtitulo">¡GRACIAS POR SU VISITA!</div>
        <div style="font-size: 8px;">Atendido por: {{ $invoice['vendedor'] }}</div>
    </div>

    {{-- QR --}}
    <div class="qr">
        <img src="{{ $invoice['qr'] }}" alt="QR">
    </div>

    {{-- HASH --}}
    <div class="hash text-center">
        Hash: {{ $invoice['hash'] }}
    </div>

    {{-- LEYENDA LEGAL --}}
    <div class="footer">
        Representación impresa de la {{ $titulo }} ELECTRÓNICA.<br>
        Autorizado mediante Resolución N° 034-005-0005929/SUNAT<br>
        Consulta tu comprobante en www.sunat.gob.pe
    </div>

</body>
</html>