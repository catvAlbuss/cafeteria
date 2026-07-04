import { Head } from '@inertiajs/react';
import StatsCard from '@/components/features/StatsCard';
import RecentOrdersTable from '@/components/features/RecentOrdersTable';
import TopProducts from '@/components/features/TopProducts';
export default function Dashboard() {
    // Datos de ejemplo (después los reemplazas con datos reales)
    const stats = {
        salesToday: 1248,
        salesChange: 12,
        orders: 84,
        ordersChange: 7,
        avgTicket: 14.90,
        avgTicketChange: -2,
        weekPerformance: 18,
    };

    const recentOrders = [
        { id: '#00084', customer: 'María López', products: 'Latte x2, Croissant', total: 22.50, status: 'Entregado', time: '11:42 AM' },
        { id: '#00083', customer: 'Carlos Ruiz', products: 'Americano', total: 8.00, status: 'Preparando', time: '11:38 AM' },
        { id: '#00082', customer: 'Ana Torres', products: 'Mocha + Cheesecake', total: 28.00, status: 'Entregado', time: '11:25 AM' },
        { id: '#00081', customer: 'José Mamani', products: 'Cappuccino', total: 16.50, status: 'En camino', time: '11:18 AM' },
        { id: '#00080', customer: 'Lucía Torres', products: 'Matcha Latte x2', total: 32.00, status: 'Entregado', time: '11:05 AM' },
    ];

    const topProducts = [
        { name: 'Americano', sales: 32 },
        { name: 'Latte', sales: 24 },
        { name: 'Croissant', sales: 19 },
        { name: 'Cheesecake', sales: 9 },
    ];

    return (
        <>
            <Head title="Dashboard" />
            
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <h1 className="text-2xl font-bold">Bienvenido al sistema</h1>
                
                {/* Tarjetas de estadísticas */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-4">
                    <StatsCard 
                        title="Ventas hoy" 
                        value={`S/ ${stats.salesToday}`} 
                        change={stats.salesChange} 
                    />
                    <StatsCard 
                        title="Pedidos" 
                        value={stats.orders} 
                        change={stats.ordersChange} 
                    />
                    <StatsCard 
                        title="Tickets promedio" 
                        value={`S/ ${stats.avgTicket}`} 
                        change={stats.avgTicketChange} 
                    />
                    <StatsCard 
                        title="Rendimiento semana" 
                        value={`${stats.weekPerformance}%`} 
                        change={stats.weekPerformance} 
                    />
                </div>

                {/* Tabla de pedidos recientes */}
                <RecentOrdersTable orders={recentOrders} />

                {/* Productos más vendidos */}
                <TopProducts products={topProducts} />
            </div>
        </>
    );
}

Dashboard.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: props.currentTeam ? `/dashboard` : '/',
        },
    ],
});