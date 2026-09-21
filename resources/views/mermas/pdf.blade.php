
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">

    <title>Reporte de Mermas - Dolce Cafe</title>

    <style>

        @page {
            size: A4 landscape;
            margin: 25px 28px 30px 28px;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            padding: 0;
            font-family: DejaVu Sans, sans-serif;
            color: #2D1B1A;
            font-size: 9px;
            background: #FFFFFF;
        }

        /* =====================================================
           HEADER COMPACTO
        ===================================================== */

        .header {
            width: 100%;
            background: #2D1B1A;
            margin-bottom: 15px;
            padding: 10px 14px;
        }

        .header-table {
            width: 100%;
            border-collapse: collapse;
        }

        .brand-icon {
            width: 27px;
            height: 27px;
            background: transparent;
            border: none;
            text-align: center;
            vertical-align: middle;
            font-size: 15px;
            color: #C9A96E;
            padding: 0;
        }

        .brand {
            padding-left: 8px;
            vertical-align: middle;
        }

        .brand-name {
            color: #FFFFFF;
            font-size: 16px;
            font-weight: bold;
            line-height: 1.1;
        }

        .brand-description {
            color: #DCC9B3;
            font-size: 7px;
            margin-top: 3px;
        }

        .report-info {
            text-align: right;
            vertical-align: middle;
            color: #FFFFFF;
            font-size: 7px;
            line-height: 1.4;
        }

        .report-info-label {
            color: #C9A96E;
            font-weight: bold;
            font-size: 6.5px;
            text-transform: uppercase;
        }


        /* =====================================================
           RESUMEN
        ===================================================== */

        .summary {
            width: 100%;
            margin-bottom: 18px;
        }

        .summary-table {
            width: 100%;
            border-collapse: collapse;
        }

        .summary-table td {
            width: 33.33%;
            padding-right: 8px;
        }

        .summary-table td:last-child {
            padding-right: 0;
        }

        .summary-card {
            height: 65px;
            border: 1px solid #E8D5C4;
            background: #FBF7F0;
            padding: 11px 14px;
            vertical-align: middle;
        }

        .summary-label {
            color: #7A6250;
            font-size: 7px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 6px;
        }

        .summary-value {
            color: #2D1B1A;
            font-size: 16px;
            font-weight: bold;
            line-height: 1;
        }

        .summary-value.loss {
            color: #C0392B;
        }


        /* =====================================================
           SECCIÓN
        ===================================================== */

        .section {
            margin-bottom: 9px;
        }

        .section-title {
            font-size: 12px;
            font-weight: bold;
            color: #2D1B1A;
            line-height: 1.2;
        }

        .section-line {
            height: 2px;
            width: 100%;
            background: #C9A96E;
            margin-top: 5px;
        }

        .section-description {
            color: #7A6250;
            font-size: 7px;
            margin-top: 4px;
        }


        /* =====================================================
           TABLA
        ===================================================== */

        .data-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }

        .data-table thead {
            display: table-header-group;
        }

        .data-table thead th {
            height: 28px;
            background: #2D1B1A;
            color: #FFFFFF;
            border: 1px solid #2D1B1A;
            padding: 5px 4px;
            font-size: 6.8px;
            font-weight: bold;
            text-transform: uppercase;
            vertical-align: middle;
        }

        .data-table tbody tr {
            page-break-inside: avoid;
        }

        .data-table tbody td {
            min-height: 28px;
            padding: 5px 4px;
            border: 1px solid #E8D5C4;
            background: #FFFFFF;
            color: #4D3629;
            font-size: 7.5px;
            vertical-align: middle;
            line-height: 1.2;
        }

        .data-table tbody tr:nth-child(even) td {
            background: #FBF7F0;
        }


        /* =====================================================
           COLUMNAS
        ===================================================== */

        .fecha {
            width: 11%;
        }

        .tipo {
            width: 9%;
        }

        .item {
            width: 19%;
        }

        .cantidad {
            width: 8%;
            text-align: center !important;
        }

        .motivo {
            width: 18%;
        }

        .costo {
            width: 11%;
            text-align: right !important;
        }

        .responsable {
            width: 12%;
        }

        .observaciones {
            width: 12%;
        }


        /* =====================================================
           TEXTO
        ===================================================== */

        .date-text {
            color: #5A3D2B;
            white-space: nowrap;
        }

        .item-name {
            color: #2D1B1A;
            font-weight: bold;
            font-size: 7.8px;
        }

        .type-product {
            color: #8A5A2B;
            font-weight: bold;
            font-size: 6.8px;
        }

        .type-input {
            color: #6B4F3A;
            font-weight: bold;
            font-size: 6.8px;
        }

        .quantity-value {
            color: #2D1B1A;
            font-weight: bold;
            text-align: center;
        }

        .cost-value {
            color: #C0392B;
            font-weight: bold;
            text-align: right;
            white-space: nowrap;
        }

        .responsible-value {
            color: #5A3D2B;
            font-weight: bold;
        }

        .observation-value {
            color: #7A6250;
        }


        /* =====================================================
           MOTIVOS
        ===================================================== */

        .reason-main {
            color: #2D1B1A;
            font-weight: bold;
        }

        .reason-detail {
            color: #7A6250;
        }


        /* =====================================================
           TOTAL
        ===================================================== */

        .total-container {
            width: 100%;
            margin-top: 12px;
        }

        .total-table {
            width: 100%;
            border-collapse: collapse;
        }

        .total-left {
            background: #FBF7F0;
            border: 1px solid #E8D5C4;
            border-right: none;
            padding: 9px 11px;
            color: #5A3D2B;
            font-size: 7.5px;
            font-weight: bold;
            text-transform: uppercase;
            vertical-align: middle;
        }

        .total-right {
            width: 25%;
            background: #2D1B1A;
            border: 1px solid #2D1B1A;
            padding: 9px 11px;
            color: #FFFFFF;
            text-align: right;
            vertical-align: middle;
        }

        .total-label {
            color: #C9A96E;
            font-size: 6.5px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .total-value {
            color: #FFFFFF;
            font-size: 14px;
            font-weight: bold;
            margin-top: 2px;
        }


        /* =====================================================
           SIN REGISTROS
        ===================================================== */

        .empty {
            width: 100%;
            padding: 30px;
            background: #FBF7F0;
            border: 1px solid #E8D5C4;
            text-align: center;
            color: #7A6250;
            font-size: 8px;
        }


        /* =====================================================
           FOOTER
        ===================================================== */

        .footer {
            width: 100%;
            margin-top: 15px;
            padding-top: 7px;
            border-top: 1px solid #E8D5C4;
        }

        .footer-table {
            width: 100%;
            border-collapse: collapse;
        }

        .footer-left {
            color: #7A6250;
            font-size: 6.5px;
        }

        .footer-right {
            color: #7A6250;
            font-size: 6.5px;
            text-align: right;
        }

    </style>
</head>

<body>

    <!-- =====================================================
         HEADER
    ====================================================== -->

    <div class="header">

        <table class="header-table">

            <tr>

                <td width="4%">

                    <div class="brand-icon">
                        ♨
                    </div>

                </td>

                <td width="61%" class="brand">

                    <div class="brand-name">
                        Dolce Cafe
                    </div>

                    <div class="brand-description">
                        Reporte de Mermas e Inventario
                    </div>

                </td>

                <td width="35%" class="report-info">

                    <div class="report-info-label">
                        FECHA DE GENERACIÓN
                    </div>

                    <div>
                        {{ $fechaGeneracion->format('d/m/Y') }}
                        &nbsp; | &nbsp;
                        {{ $fechaGeneracion->format('H:i') }}
                    </div>

                </td>

            </tr>

        </table>

    </div>


    <!-- =====================================================
         RESUMEN
    ====================================================== -->

    <div class="summary">

        <table class="summary-table">

            <tr>

                <td>

                    <div class="summary-card">

                        <div class="summary-label">
                            Pérdidas totales
                        </div>

                        <div class="summary-value loss">
                            S/ {{ number_format($totalPerdidas, 2) }}
                        </div>

                    </div>

                </td>

                <td>

                    <div class="summary-card">

                        <div class="summary-label">
                            Registros registrados
                        </div>

                        <div class="summary-value">
                            {{ $totalRegistros }}
                        </div>

                    </div>

                </td>

                <td>

                    <div class="summary-card">

                        <div class="summary-label">
                            Promedio por registro
                        </div>

                        <div class="summary-value">
                            S/
                            {{ number_format(
                                $totalRegistros > 0
                                    ? $totalPerdidas / $totalRegistros
                                    : 0,
                                2
                            ) }}
                        </div>

                    </div>

                </td>

            </tr>

        </table>

    </div>


    <!-- =====================================================
         TÍTULO
    ====================================================== -->

    <div class="section">

        <div class="section-title">
            Detalle de mermas
        </div>

        <div class="section-line"></div>

        <div class="section-description">
            Historial de productos terminados e insumos registrados como pérdida.
        </div>

    </div>


    <!-- =====================================================
         TABLA
    ====================================================== -->

    @if($mermas->count() > 0)

        <table class="data-table">

            <thead>

                <tr>

                    <th class="fecha">
                        Fecha
                    </th>

                    <th class="tipo">
                        Tipo
                    </th>

                    <th class="item">
                        Producto / Insumo
                    </th>

                    <th class="cantidad">
                        Cantidad
                    </th>

                    <th class="motivo">
                        Motivo
                    </th>

                    <th class="costo">
                        Costo
                    </th>

                    <th class="responsable">
                        Responsable
                    </th>

                    <th class="observaciones">
                        Observaciones
                    </th>

                </tr>

            </thead>

            <tbody>

                @foreach($mermas as $merma)

                    @php

                        $precio = (float) ($merma->item?->precio ?? 0);

                        $cantidad = (float) $merma->cantidad;

                        if ($merma->item_type === 'insumo') {
                            $costo = $cantidad * $precio * 0.100;
                        } else {
                            $costo = $cantidad * $precio;
                        }

                    @endphp

                    <tr>

                        <td class="fecha">

                            <span class="date-text">
                                {{ $merma->created_at
                                    ? $merma->created_at->format('d/m/Y H:i')
                                    : '-' }}
                            </span>

                        </td>

                        <td class="tipo">

                            @if($merma->item_type === 'plato')

                                <span class="type-product">
                                    PRODUCTO
                                </span>

                            @else

                                <span class="type-input">
                                    INSUMO
                                </span>

                            @endif

                        </td>

                        <td class="item">

                            <span class="item-name">
                                {{ $merma->item?->nombre ?? 'Sin nombre' }}
                            </span>

                        </td>

                        <td class="cantidad">

                            <span class="quantity-value">

                                {{ rtrim(
                                    rtrim(
                                        number_format($cantidad, 2, '.', ''),
                                        '0'
                                    ),
                                    '.'
                                ) }}

                            </span>

                        </td>

                        <td class="motivo">

                            @switch($merma->submotivo)

                                @case('quemado')

                                    <span class="reason-main">
                                        Quemado
                                    </span>

                                    @break

                                @case('sobreproduccion')

                                    <span class="reason-main">
                                        Sobreproducción
                                    </span>

                                    @break

                                @case('devolucion')

                                    <span class="reason-main">
                                        Devolución
                                    </span>

                                    @break

                                @case('caducado')

                                    <span class="reason-main">
                                        Caducado
                                    </span>

                                    @break

                                @case('rotura')

                                    <span class="reason-main">
                                        Rotura
                                    </span>

                                    @break

                                @case('refrigeracion')

                                    <span class="reason-main">
                                        Refrigeración
                                    </span>

                                    @break

                                @case('mala_preparacion')

                                    <span class="reason-main">
                                        Mala preparación
                                    </span>

                                    @break

                                @case('otro')

                                    <span class="reason-main">
                                        Otro
                                    </span>

                                    @break

                                @default

                                    <span class="reason-main">
                                        {{ $merma->submotivo ?? 'Sin especificar' }}
                                    </span>

                            @endswitch

                        </td>

                        <td class="costo">

                            <span class="cost-value">
                                S/ {{ number_format($costo, 2) }}
                            </span>

                        </td>

                        <td class="responsable">

                            <span class="responsible-value">
                                {{ $merma->user?->name ?? 'Sistema' }}
                            </span>

                        </td>

                        <td class="observaciones">

                            <span class="observation-value">
                                {{ $merma->observaciones ?: '-' }}
                            </span>

                        </td>

                    </tr>

                @endforeach

            </tbody>

        </table>


        <!-- =================================================
             TOTAL
        ================================================== -->

        <div class="total-container">

            <table class="total-table">

                <tr>

                    <td class="total-left">
                        Total de pérdidas registradas
                    </td>

                    <td class="total-right">

                        <div class="total-label">
                            Pérdida acumulada
                        </div>

                        <div class="total-value">
                            S/ {{ number_format($totalPerdidas, 2) }}
                        </div>

                    </td>

                </tr>

            </table>

        </div>

    @else

        <div class="empty">
            No existen registros de mermas para mostrar.
        </div>

    @endif


    <!-- =====================================================
         FOOTER
    ====================================================== -->

    <div class="footer">

        <table class="footer-table">

            <tr>

                <td class="footer-left">
                    Dolce Cafe · Sistema de gestión de inventario
                </td>

                <td class="footer-right">
                    Reporte generado automáticamente
                </td>

            </tr>

        </table>

    </div>

</body>
</html>
