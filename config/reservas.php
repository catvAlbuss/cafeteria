<?php

return [
    /*
    | Margen de preparación entre reservas de una misma mesa (en minutos).
    | Una reserva solo se puede crear si no se solapa con otra existente
    | en el rango [inicio - margen, fin + margen].
    */
    'margen_minutos' => env('RESERVAS_MARGEN_MINUTOS', 15),

    /*
    | Anticipación con la que una reserva "bloquea" la mesa (en minutos).
    | Antes de esa ventana la mesa se usa normalmente; dentro de la ventana
    | (p. ej. 10 min antes de la hora de inicio) pasa a estado "reserva".
    */
    'margen_inicio_minutos' => env('RESERVAS_MARGEN_INICIO_MINUTOS', 10),

    /*
    | Adelanto mínimo (S/) que se exige al crear una reserva. Se caja en el
    | momento como un ingreso; al cobrar la mesa se emite un egreso de ese
    | monto (el total de la factura no cambia).
    */
    'adelanto_minimo' => (float) env('RESERVAS_ADELANTO_MINIMO', 20),

    /*
    | Minutos que el cliente puede llegar tarde a su hora_fin antes de que la
    | reserva pase a "no presentado". Dentro de ese plazo conserva su mesa y
    | su adelanto sigue como "pagado"; pasado pasa a "retenido" y caja decide.
    */
    'tolerancia_minutos' => (int) env('RESERVAS_TOLERANCIA_MINUTOS', 10),
];
