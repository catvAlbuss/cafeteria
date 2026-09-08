// resources/js/utils/clasificarPedidos.ts

interface Producto {
    nombre: string;
    cantidad: number;
    precio: number;
    subtotal: number;
    categoria?: string;
}

interface Pedido {
    id: number;
    numero: string;
    productos: Producto[];
    estado: string;
    area?: string;
    tipo_origen?: 'mesa' | 'delivery';
    mesa?: { numero: string } | null;
    cliente: string;
    total: number;
    tomado?: boolean;
}

// 📋 MAPA DE CATEGORÍAS (fácil de mantener y expandir)
export const AREAS = {
    cocina: {
        id: 'cocina',
        nombre: 'Cocina',
        icono: '🍳',
        color: 'orange',
        palabrasClave: [
            'plato fuerte', 'entrada', 'sopa', 'comida', 'principal',
            'carnes', 'pescado', 'pollo', 'res', 'cerdo', 'hamburguesa',
            'sandwich', 'waffles', 'pollo a la plancha', 'lomo saltado',
            'arroz', 'pasta', 'ensalada', 'guiso', 'estofado',
            'milanesa', 'filete', 'costilla', 'chorizo', 'salchicha',
            'torta salada', 'empanada salada', 'lasaña', 'canelones'
        ]
    },
    bar: {
        id: 'bar',
        nombre: 'Bar',
        icono: '☕',
        color: 'blue',
        palabrasClave: [
            'bebida', 'café', 'jugo', 'licor', 'coctel', 'infusión',
            'té', 'cerveza', 'vino', 'refresco', 'cappuccino', 'latte',
            'matcha', 'chocolate caliente', 'frappé', 'limonada',
            'agua', 'gaseosa', 'smoothie', 'batido', 'milk shake',
            'espresso', 'americano', 'mocaccino', 'té chai'
        ]
    },
    horno: {
        id: 'horno',
        nombre: 'Horno',
        icono: '🔥',
        color: 'red',
        palabrasClave: [
            'pan', 'pastel', 'pizza', 'masa', 'horneado', 'croissant',
            'muffin', 'bagel', 'panetón', 'empanada', 'galleta',
            'tarta', 'quiche', 'focaccia', 'ciabatta', 'brioche',
            'pan de muerto', 'rosquilla', 'pretzel'
        ]
    },
    postres: {
        id: 'postres',
        nombre: 'Postres',
        icono: '🍰',
        color: 'pink',
        palabrasClave: [
            'postre', 'helado', 'torta', 'dulce', 'flan', 'crema',
            'cheesecake', 'brownie', 'tiramisú', 'alfajor', 'donut',
            'mousse', 'panna cotta', 'crepe', 'waffle dulce',
            'pudin', 'gelatina', 'fruta confitada', 'merengue',
            'tres leches', 'pie', 'cobbler'
        ]
    }
};

// 🔍 Función para detectar el área de un pedido
export const detectarArea = (productos: Producto[]): string => {
    if (!productos || productos.length === 0) return 'cocina';

    const areasEncontradas: string[] = [];

    for (const producto of productos) {
        // Buscar en nombre y categoría
        const texto = (producto.nombre + ' ' + (producto.categoria || '')).toLowerCase();
        
        for (const [area, config] of Object.entries(AREAS)) {
            for (const palabra of config.palabrasClave) {
                if (texto.includes(palabra)) {
                    areasEncontradas.push(area);
                    break;
                }
            }
        }
    }

    // Si no se encontró nada, devolver cocina por defecto
    if (areasEncontradas.length === 0) return 'cocina';

    // Prioridad: cocina > bar > horno > postres
    const prioridad = ['cocina', 'bar', 'horno', 'postres'];
    for (const area of prioridad) {
        if (areasEncontradas.includes(area)) {
            return area;
        }
    }

    return 'cocina';
};

// 📊 Función para agrupar pedidos por área
export const agruparPedidosPorArea = (pedidos: Pedido[]) => {
    const grupos: Record<string, Pedido[]> = {
        cocina: [],
        bar: [],
        horno: [],
        postres: []
    };

    for (const pedido of pedidos) {
        // Si es delivery y no está tomado, no mostrarlo
        if (pedido.tipo_origen === 'delivery' && !pedido.tomado) {
            continue;
        }

        // Si ya tiene área asignada, usarla
        if (pedido.area && grupos[pedido.area]) {
            grupos[pedido.area].push(pedido);
        } else {
            // Si no, detectarla
            const area = detectarArea(pedido.productos);
            if (grupos[area]) {
                grupos[area].push(pedido);
            } else {
                grupos.cocina.push(pedido); // Fallback
            }
        }
    }

    return grupos;
};

// 📊 Obtener estadísticas por área
export const getEstadisticasPorArea = (pedidos: Pedido[]) => {
    const agrupados = agruparPedidosPorArea(pedidos);
    const estadisticas: Record<string, any> = {};

    for (const [area, pedidosArea] of Object.entries(agrupados)) {
        estadisticas[area] = {
            total: pedidosArea.length,
            pendientes: pedidosArea.filter(p => p.estado === 'pendiente').length,
            preparando: pedidosArea.filter(p => p.estado === 'preparando').length,
            listos: pedidosArea.filter(p => p.estado === 'listo').length,
        };
    }

    return estadisticas;
};

// 📊 Obtener configuración de un área
export const getAreaConfig = (area: string) => {
    return AREAS[area as keyof typeof AREAS] || AREAS.cocina;
};

// 🎯 Obtener color de área para Tailwind
export const getAreaColor = (area: string) => {
    const config = getAreaConfig(area);
    const colores = {
        orange: {
            bg: 'bg-orange-100',
            text: 'text-orange-700',
            border: 'border-orange-300',
            hover: 'hover:border-orange-400'
        },
        blue: {
            bg: 'bg-blue-100',
            text: 'text-blue-700',
            border: 'border-blue-300',
            hover: 'hover:border-blue-400'
        },
        red: {
            bg: 'bg-red-100',
            text: 'text-red-700',
            border: 'border-red-300',
            hover: 'hover:border-red-400'
        },
        pink: {
            bg: 'bg-pink-100',
            text: 'text-pink-700',
            border: 'border-pink-300',
            hover: 'hover:border-pink-400'
        }
    };
    return colores[config.color as keyof typeof colores] || colores.orange;
};