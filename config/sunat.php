<?php

return [
    'url' => env('SUNAT_URL'),
    'ruc' => env('GREENTER_RUC'),
    'usuario_sol' => env('GREENTER_USERNAME'),
    'clave_sol' => env('GREENTER_PASSWORD'),

    /*
     | Datos del emisor que viajan en el XML. Deben coincidir exactamente con
     | la ficha del RUC en SUNAT, o el CDR llega con observaciones y en
     | produccion la constancia es rechazada.
     |
     | El nombre comercial registrado ante SUNAT es SEVEN HEART. DOLCE CAFFE es
     | la marca de la cafeteria, pero mientras no se de de alta como nombre
     | comercial adicional en la ficha del RUC, enviarlo aqui produce una
     | observacion en cada comprobante.
     */
    'razon_social' => env('SUNAT_RAZON_SOCIAL', 'SEVEN HEART SOCIEDAD ANONIMA CERRADA'),
    'nombre_comercial' => env('SUNAT_NOMBRE_COMERCIAL', 'SEVEN HEART'),
    'direccion' => env('SUNAT_DIRECCION', 'JR. SIMON BOLIVAR NRO. 487 (A UNA CUADRA DE TIENDAS YOLU) HUANUCO - HUANUCO - HUANUCO'),
    'ubigeo' => env('SUNAT_UBIGEO', '100101'),
    'departamento' => env('SUNAT_DEPARTAMENTO', 'HUANUCO'),
    'provincia' => env('SUNAT_PROVINCIA', 'HUANUCO'),
    'distrito' => env('SUNAT_DISTRITO', 'HUANUCO'),
    'cod_local' => env('SUNAT_COD_LOCAL', '0000'),

    'certificado' => env('SUNAT_CERT_PATH', 'app/certificates/certificate.pem'),

    /*
     | Token del servicio de consulta RUC/DNI. Es una credencial: nunca debe
     | quedar escrita en el codigo.
     */
    'token_consulta' => env('SUNAT_TOKEN_CONSULTA'),
];
