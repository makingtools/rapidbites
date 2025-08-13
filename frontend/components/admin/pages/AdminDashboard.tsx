import React, { useState, useEffect } from 'react';
import { getStats, getOrders } from '../../../services/api';
import { OrderStatus, AdminOrder, AdminStats } from '../../../types';
import { CurrencyDollarIcon } from '../../icons/CurrencyDollarIcon';
import { ShoppingCartIcon } from '../../icons/ShoppingCartIcon';
import { UsersIcon } from '../../icons/UsersIcon';
import { StarIcon } from '../../icons/StarIcon';

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string; }> = ({ icon, title, value }) => (
    <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
        <div className="p-3 rounded-full bg-primary/10 text-primary">
            {icon}
        </div>
        <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
    </div>
);

const getStatusColor = (status: OrderStatus) => {
    switch (status) {
        case 'Entregado': return 'bg-green-100 text-green-800';
        case 'En Camino': return 'bg-blue-100 text-blue-800';
        case 'Preparando': return 'bg-yellow-100 text-yellow-800';
        case 'Cancelado': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadDashboardData() {
            try {
                setIsLoading(true);
                const [fetchedStats, fetchedOrders] = await Promise.all([
                    getStats(),
                    getOrders(),
                ]);
                setStats(fetchedStats);
                setRecentOrders(fetchedOrders.slice(0, 5));
            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadDashboardData();
    }, []);

    if (isLoading) {
        return (
            <div>
                 <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
                 <p>Cargando datos...</p>
            </div>
        );
    }
    
    if (!stats) {
        return <p>No se pudieron cargar las estadísticas.</p>;
    }


    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard icon={<CurrencyDollarIcon className="h-8 w-8"/>} title="Ingresos de Hoy" value={stats.revenueToday.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })} />
                <StatCard icon={<ShoppingCartIcon className="h-8 w-8"/>} title="Pedidos de Hoy" value={stats.ordersToday.toString()} />
                <StatCard icon={<UsersIcon className="h-8 w-8"/>} title="Nuevos Clientes" value={stats.newCustomers.toString()} />
                <StatCard icon={<StarIcon className="h-8 w-8"/>} title="Calificación Promedio" value={stats.averageRating.toString()} />
            </div>

            <div className="bg-white rounded-lg shadow-md">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Pedidos Recientes</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Pedido</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {recentOrders.map((order: AdminOrder) => (
                                <tr key={order.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.customerName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.total.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};