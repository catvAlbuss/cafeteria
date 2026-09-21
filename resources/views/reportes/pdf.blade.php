<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">

    <title>Reporte de Ventas</title>

    <style>
        @page {
            margin: 25px 30px;
        }

        body {
            font-family: DejaVu Sans, sans-serif;
            color: #6B4F3A;
            font-size: 11px;
            background: #FFFFFF;
        }

        /* ==========================================
           COLORES
        ========================================== */

        /*
            Marrón principal: #6B4F3A
            Marrón medio:     #8B6B52
            Marrón claro:     #B9A18E
            Crema:            #F8F3EE
            Crema suave:      #FCF9F6
            Bordes:           #DCCFC3
            Blanco:           #FFFFFF
        */

        /* ==========================================
           TITULO
        ========================================== */

        .titulo {
            background: #6B4F3A;
            color: #FFFFFF;
            text-align: center;
            padding: 15px;
            font-size: 22px;
            font-weight: bold;
            border-radius: 5px;
        }

        .fecha {
            text-align: center;
            color: #8B6B52;
            font-size: 11px;
            margin-top: 8px;
            margin-bottom: 20px;
        }

        /* ==========================================
           RESUMEN
        ========================================== */

        .resumen {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
        }

        .resumen th {
            background: #8B6B52;
            color: #FFFFFF;
            padding: 9px;
            text-align: center;
            font-size: 11px;
            border: 1px solid #DCCFC3;
        }

        .resumen td {
            background: #FFFFFF;
            color: #6B4F3A;
            padding: 10px;
            text-align: center;
            font-size: 12px;
            font-weight: bold;
            border: 1px solid #DCCFC3;
        }

        /* ==========================================
           TITULOS DE SECCIONES
        ========================================== */

        .seccion {
            color: #6B4F3A;
            font-size: 16px;
            font-weight: bold;
            margin-top: 15px;
            margin-bottom: 10px;
        }

        /* ==========================================
           TABLAS
        ========================================== */

        .tabla {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
        }

        .tabla th {
            background: #8B6B52;
            color: #FFFFFF;
            padding: 8px;
            text-align: center;
            font-size: 10px;
            font-weight: bold;
            border: 1px solid #8B6B52;
        }

        .tabla td {
            padding: 7px;
            border: 1px solid #DCCFC3;
            color: #6B4F3A;
            font-size: 10px;
        }

        .tabla tr:nth-child(even) td {
            background: #F8F3EE;
        }

        .tabla tr:nth-child(odd) td {
            background: #FFFFFF;
        }

        /* ==========================================
           ALINEACIONES
        ========================================== */

        .centro {
            text-align: center;
        }

        .derecha {
            text-align: right;
        }

        .izquierda {
            text-align: left;
        }

        /* ==========================================
           TOTAL
        ========================================== */

        .total {
            background: #FCF9F6;
            color: #6B4F3A;
            font-weight: bold;
        }

        /* ==========================================
           PIE DE PAGINA
        ========================================== */

        .footer {
            margin-top: 20px;
            padding-top: 8px;
            border-top: 1px solid #DCCFC3;
            text-align: center;
            color: #B9A18E;
            font-size: 9px;
        }
    </style>
</head>

<body>

    {{-- ==========================================
         TITULO
    ========================================== --}}

    <div class="titulo">
        Reporte de Ventas
    </div>

    {{-- ==========================================
         FECHA
    ========================================== --}}

    <div class="fecha">
        Del {{ $fechaInicio ?? $fecha_inicio ?? '' }}
        al
        {{ $fechaFin ?? $fecha_fin ?? '' }}
    </div>


    {{-- ==========================================
         RESUMEN
    ========================================== --}}

    <table class="resumen">
        <thead>
            <tr>
                <th colspan="2">Ventas</th>
                <th>Tickets</th>
                <th>Gastos</th>
                <th>Ganancia</th>
            </tr>
        </thead>

        <tbody>
            <tr>
                <td colspan="2">
                    S/ {{ number_format($totalVentas ?? 0, 2) }}
                </td>

                <td>
                    {{ $totalTickets ?? 0 }}
                </td>

                <td>
                    S/ {{ number_format($totalGastos ?? 0, 2) }}
                </td>

                <td>
                    S/ {{ number_format($totalGanancia ?? 0, 2) }}
                </td>
            </tr>
        </tbody>
    </table>


    {{-- ==========================================
         VENTAS DIARIAS
    ========================================== --}}

    <div class="seccion">
        Ventas diarias
    </div>

    <table class="tabla">

        <thead>
            <tr>
                <th>Fecha</th>
                <th>Tickets</th>
                <th>Ventas</th>
                <th>Gastos</th>
                <th>Ganancia</th>
            </tr>
        </thead>

        <tbody>

            @forelse($ventasDiarias ?? [] as $venta)

                <tr>

                    <td class="centro">
                        {{ $venta['fecha'] ?? '' }}
                    </td>

                    <td class="centro">
                        {{ $venta['tickets'] ?? 0 }}
                    </td>

                    <td class="derecha">
                        S/
                        {{ number_format((float) ($venta['ventas'] ?? 0), 2) }}
                    </td>

                    <td class="derecha">
                        S/
                        {{ number_format((float) ($venta['gastos'] ?? 0), 2) }}
                    </td>

                    <td class="derecha">
                        S/
                        {{ number_format((float) ($venta['ganancia'] ?? 0), 2) }}
                    </td>

                </tr>

            @empty

                <tr>
                    <td colspan="5" class="centro">
                        No hay datos de ventas para mostrar.
                    </td>
                </tr>

            @endforelse

        </tbody>

    </table>


    {{-- ==========================================
         METODOS DE PAGO
    ========================================== --}}

    @if(!empty($metodosPago ?? $metodos_pago ?? []))

        <div class="seccion">
            Métodos de pago
        </div>

        <table class="tabla">

            <thead>
                <tr>
                    <th>Método</th>
                    <th>Cantidad</th>
                    <th>Total</th>
                    <th>Porcentaje</th>
                </tr>
            </thead>

            <tbody>

                @foreach(($metodosPago ?? $metodos_pago ?? []) as $metodo)

                    <tr>

                        <td class="izquierda">
                            {{
                                $metodo['metodo']
                                ?? $metodo['metodo_pago']
                                ?? $metodo['nombre']
                                ?? ''
                            }}
                        </td>

                        <td class="centro">
                            {{
                                $metodo['cantidad']
                                ?? $metodo['count']
                                ?? 0
                            }}
                        </td>

                        <td class="derecha">
                            S/
                            {{
                                number_format(
                                    (float) (
                                        $metodo['total']
                                        ?? $metodo['ventas']
                                        ?? 0
                                    ),
                                    2
                                )
                            }}
                        </td>

                        <td class="centro">

                            @php
                                $porcentaje = $metodo['porcentaje'] ?? 0;
                            @endphp

                            {{ is_numeric($porcentaje) ? $porcentaje . '%' : $porcentaje }}

                        </td>

                    </tr>

                @endforeach

            </tbody>

        </table>

    @endif


    {{-- ==========================================
         PIE
    ========================================== --}}

    <div class="footer">
        Reporte de ventas — Dolce Cafe
    </div>

</body>
</html>
