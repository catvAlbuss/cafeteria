<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <style type="text/css">
        .bold,
        b,
        strong {
            font-weight: 700
        }

        body {
            background-repeat: no-repeat;
            background-position: center center;
            text-align: center;
            margin: 0;
            font-family: Verdana, monospace
        }

        .tabla_borde {
            border: 1px solid #666;
            border-radius: 10px
        }

        tr.border_bottom td {
            border-bottom: 1px solid #000
        }

        tr.border_top td {
            border-top: 1px solid #666
        }

        td.border_right {
            border-right: 1px solid #666
        }

        .table-valores-totales tbody>tr>td {
            border: 0
        }

        .table-valores-totales>tbody>tr>td:first-child {
            text-align: right
        }

        .table-valores-totales>tbody>tr>td:last-child {
            border-bottom: 1px solid #666;
            text-align: right;
            width: 30 %
        }

        hr,
        img {
            border: 0
        }

        table td {
            font-size: 12px
        }

        html {
            font-family: sans-serif;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
            font-size: 10px;
            -webkit-tap-highlight-color: transparent
        }

        a {
            background-color: transparent
        }

        a:active,
        a:hover {
            outline: 0
        }

        img {
            vertical-align: middle
        }

        hr {
            height: 0;
            -webkit-box-sizing: content-box;
            -moz-box-sizing: content-box;
            box-sizing: content-box;
            margin-top: 20px;
            margin-bottom: 20px;
            border-top: 1px solid #eee
        }

        table {
            border-spacing: 0;
            border-collapse: collapse
        }

        @media print {

            blockquote,
            img,
            tr {
                page-break-inside: avoid
            }

            *,
            :after,
            :before {
                color: #000 !important;
                text-shadow: none !important;
                background: 0 0 !important;
                -webkit-box-shadow: none !important;
                box-shadow: none !important
            }

            a,
            a:visited {
                text-decoration: underline
            }

            a[href]:after {
                content: " (" attr(href) ")"
            }

            blockquote {
                border: 1px solid #999
            }

            img {
                max-width: 100% !important
            }

            p {
                orphans: 3;
                widows: 3
            }

            .table {
                border-collapse: collapse !important
            }

            .table td {
                background-color: #fff !important
            }
        }

        a,
        a:focus,
        a:hover {
            text-decoration: none
        }

        *,
        :after,
        :before {
            -webkit-box-sizing: border-box;
            -moz-box-sizing: border-box;
            box-sizing: border-box
        }

        a {
            color: #428bca;
            cursor: pointer
        }

        a:focus,
        a:hover {
            color: #2a6496
        }

        a:focus {
            outline: dotted thin;
            outline: -webkit-focus-ring-color auto 5px;
            outline-offset: -2px
        }

        h6 {
            font-family: inherit;
            line-height: 1.1;
            color: inherit;
            margin-top: 10px;
            margin-bottom: 10px
        }

        p {
            margin: 0 0 10px
        }

        blockquote {
            padding: 10px 20px;
            margin: 0 0 20px;
            border-left: 5px solid #eee
        }

        table {
            background-color: transparent
        }

        .table {
            width: 100%;
            max-width: 100%;
            margin-bottom: 20px
        }

        h6 {
            font-weight: 100;
            font-size: 10px
        }

        body {
            line-height: 1.42857143;
            font-family: "open sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
            background-color: #2f4050;
            font-size: 13px;
            color: #676a6c;
            overflow-x: hidden
        }

        .table>tbody>tr>td {
            vertical-align: top;
            border-top: 1px solid #e7eaec;
            line-height: 1.42857;
            padding: 8px
        }

        .white-bg {
            background-color: #fff
        }

        td {
            padding: 6
        }

        .table-valores-totales tbody>tr>td {
            border-top: 0 none !important
        }
    </style>
</head>

<body class="white-bg">

    @php
        // Extraer el tipo de documento del nombre del archivo.
        // Ejemplo: 20000000001-03-B001-2  →  $partes[1] = '03' (Boleta)
        // Ejemplo: 20000000001-01-F001-2  →  $partes[1] = '01' (Factura)
        $partes = explode('-', $invoice['ID']);
        $tipoDoc = $partes[1] ?? '03';
        $titulo = $tipoDoc === '01' ? 'FACTURA' : 'BOLETA DE VENTA';
        $etiquetaDoc = $tipoDoc === '01' ? 'RUC' : 'DNI';
    @endphp

    <table whidth="100%">
        <tbody>
            <tr>
                <td style="padding:30px; !important">
                    {{-- Encabezado --}}
                    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 0; padding: 0;">
                        <tbody>
                            <tr>
                                {{-- Logo --}}
                                <td width="50%" align="center" style="vertical-align: middle;">
                                    <img src="{{ $company['logo'] }}" alt="Logo"
                                        style="width: 80%; height: auto; margin: 0;">
                                </td>

                                <td width="45%" rowspan="2" valign="bottom" style="padding-left:0">
                                    <div class="tabla_borde">
                                        {{-- informacion de la empresa --}}
                                        <table width="100%" border="0" height="200" cellpadding="6"
                                            cellspacing="0">
                                            <tbody>
                                                <tr>
                                                    <td align="center">
                                                        <span
                                                            style="font-family:Tahoma, Geneva, sans-serif; font-size:29px"
                                                            text-align="center">
                                                            {{ $titulo }}
                                                        </span>
                                                        <br>
                                                        <span
                                                            style="font-family:Tahoma, Geneva, sans-serif; font-size:19px"
                                                            text-align="center">
                                                            E L E C T R Ó N I C A
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td align="center">
                                                        <span style="font-size:15px" text-align="center">
                                                            R.U.C.:
                                                            {{ $company['ruc'] }}
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td align="center">
                                                        <span style="font-size:24px">
                                                            {{ $invoice['ID'] }}
                                                        </span>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </td>
                            </tr>
                            {{-- Company --}}
                            <tr>
                                <td valign="bottom" style="padding-left:0">
                                    <div class="tabla_borde">
                                        <table width="96%" height="100%" border="0" border-radius=""
                                            cellpadding="9" cellspacing="0">
                                            <tbody>
                                                <tr>
                                                    <td align="center">
                                                        <strong>
                                                            <span style="font-size:15px">
                                                                {{-- RazonSocial --}}
                                                                {{ $company['name'] }}
                                                            </span>
                                                        </strong>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td align="left">
                                                        <strong>
                                                            Dirección:
                                                        </strong>
                                                        {{ $company['address'] }}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td align="left">
                                                        Tel: {{ $company['phone'] }}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div class="tabla_borde">
                        <table width="100%" border="0" cellpadding="5" cellspacing="0">
                            <tbody>
                                <tr>
                                    <td width="60%" align="left">
                                        <strong>
                                            Razón Social:
                                        </strong>
                                        {{ $client['name'] }}
                                    </td>
                                    <td width="40%" align="left">
                                        <strong>
                                            {{ $etiquetaDoc }}:
                                        </strong>
                                        {{ $client['ruc'] }}
                                    </td>
                                </tr>
                                <tr>
                                    <td width="60%" align="left">
                                        <strong>
                                            Fecha Emisión:
                                        </strong>
                                        {{ $invoice['date'] }}
                                    </td>
                                    <td width="40%" align="left">
                                        <strong>
                                            Dirección:
                                        </strong>
                                        {{ $client['address'] }}
                                    </td>
                                </tr>
                                <tr>
                                    <td width="60%" align="left">
                                        <strong>
                                            Tipo Moneda:
                                        </strong>
                                        {{ $client['tipomoneda'] }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <br>

                    <div class="tabla_borde">
                        <table width="100%" border="0" cellpadding="5" cellspacing="0">
                            <tbody>
                                <tr>
                                    <td align="center" class="bold">
                                        Cantidad
                                    </td>
                                    <td align="center" class="bold">
                                        Código
                                    </td>
                                    <td align="center" class="bold">
                                        Descripción
                                    </td>
                                    <td align="center" class="bold">
                                        Valor Unitario
                                    </td>
                                    <td align="center" class="bold">
                                        Valor Total
                                    </td>
                                </tr>
                                @foreach ($invoice['details'] as $item)
                                    <tr class="border_top">
                                        <td align="center">
                                            {{ $item->quantity }}
                                        </td>
                                        <td align="center">
                                            {{ $item->code }}
                                        </td>
                                        <td align="center" width="300px">
                                            <span>
                                                {{ $item->description }}
                                            </span>
                                            <br>
                                        </td>
                                        <td align="center">
                                            S/ {{ number_format($item->unitValue, 2) }}
                                        </td>
                                        <td align="center">
                                            S/ {{ number_format($item->totalValue, 2) }}
                                        </td>
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                        <tbody>
                            <tr>
                                <td width="50%" valign="top">
                                    <table width="100%" border="0" cellpadding="5" cellspacing="0">
                                        <tbody>
                                            <tr>
                                                <td colspan="4">
                                                    <br>
                                                    <span
                                                        style="font-family:Tahoma, Geneva, sans-serif; font-size:12px"
                                                        text-align="center">
                                                        <strong>
                                                            {{ $invoice['note'] }}
                                                        </strong>
                                                    </span>
                                                    <br>
                                                    <br>
                                                    <strong>
                                                        Información Adicional
                                                    </strong>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    <table width="100%" border="0" cellpadding="5" cellspacing="0">
                                        <tbody>
                                            <tr class="border_top">
                                                <td width="30%" style="font-size: 10px;">
                                                    LEYENDA:
                                                </td>
                                                <td width="70%" style="font-size: 10px;">
                                                    <p></p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td width="30%" style="font-size: 10px;">
                                                    MEDIO DE PAGO:
                                                </td>
                                                <td width="70%" style="font-size: 10px;">
                                                    {{ $invoice['paymentMethod'] }}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td width="30%" style="font-size: 10px;">
                                                    Vendedor:
                                                </td>
                                                <td width="70%" style="font-size: 10px;">
                                                    {{ $invoice['vendedor'] }}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                                <td width="50%" valign="top">
                                    <br>
                                    <table width="100%" border="0" cellpadding="0" cellspacing="0"
                                        class="table table-valores-totales">
                                        <tbody>
                                            <tr class="border_bottom">
                                                <td align="right">
                                                    <strong>
                                                        Op. Gravadas:
                                                    </strong>
                                                </td>
                                                <td width="120" align="right">
                                                    <span>
                                                        S/ {{ number_format($invoice['taxableAmount'], 2) }}
                                                    </span>
                                                </td>
                                            </tr>

                                            <tr>
                                                <td align="right">
                                                    <strong>
                                                        I.G.V. :
                                                    </strong>
                                                </td>
                                                <td width="120" align="right">
                                                    <span>
                                                        S/ {{ number_format($invoice['tax'], 2) }}
                                                    </span>
                                                </td>
                                            </tr>

                                            <tr>
                                                <td align="right">
                                                    <strong>
                                                        Total a Pagar:
                                                    </strong>
                                                </td>
                                                <td width="120" align="right">
                                                    <span>
                                                        S/ {{ number_format($invoice['totalAmount'], 2) }}
                                                    </span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
        </tbody>
    </table>
</body>

</html>