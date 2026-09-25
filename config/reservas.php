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
];
