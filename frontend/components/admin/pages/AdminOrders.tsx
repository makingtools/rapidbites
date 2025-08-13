import React, { useState, useEffect } from 'react';
import { getOrders } from '../../../services/api';
import { OrderStatus, AdminOrder } from '../../../types';

const getStatusColor = (status: OrderStatus) => {
    switch (status) {
        case 'Entregado': return 'bg-green-100 text-green-800';
        case 'En Camino': return 'bg-blue-100 text-blue-800';
        case 'Preparando': return 'bg-yellow-100 text-yellow-800';
        case 'Cancelado': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

export const AdminOrders: React.FC = () => {
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadOrders() {
            try {
                setIsLoading(true);
                const fetchedOrders = await getOrders();
                setOrders(fetchedOrders);
            } catch (error) {
                console.error("Failed to load orders", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadOrders();
    }, []);


    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestión de Pedidos</h1>
            
            <div className="bg-white rounded-lg shadow-md">
                <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">Todos los Pedidos</h2>
                    {/* Placeholder for filters */}
                    <button className="text-sm font-medium text-primary hover:text-red-500">Filtrar</button>
                </div>
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <p className="p-6 text-center">Cargando pedidos...</p>
                    ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Pedido</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {orders.map((order: AdminOrder) => (
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
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <a href="#" className="text-primary hover:text-red-600">Ver Detalles</a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    )}
                </div>
                {/* Placeholder for pagination */}
                <div className="p-4 border-t text-sm text-gray-500">
                    Mostrando 1 a {orders.length} de {orders.length} resultados
                </div>
            </div>
        </div>
    );
};