
import React from 'react';
import { WarehouseTransfer, Warehouse } from '../types';
import { PlusIcon, ArrowPathIcon } from './Icons';

interface TransferListProps {
    transfers: WarehouseTransfer[];
    warehouses: Warehouse[];
    onAdd: () => void;
}

const TransferList: React.FC<TransferListProps> = ({ transfers, warehouses, onAdd }) => {
    
    const getWarehouseName = (id: string) => warehouses.find(w => w.id === id)?.name || 'N/A';

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center">
                        <ArrowPathIcon className="h-8 w-8 mr-3 text-primary-500" />
                        Transferencias de Inventario
                    </h1>
                    <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Consulta todos los movimientos de stock entre bodegas.</p>
                </div>
                 <button
                    onClick={onAdd}
                    className="flex items-center bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors duration-300 shadow-lg"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Nueva Transferencia
                </button>
            </header>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">ID Transferencia</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Fecha</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Bodega Origen</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Bodega Destino</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase text-center">Nº de Items</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {transfers.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((transfer) => (
                                <tr key={transfer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                                    <td className="px-6 py-4 font-mono text-primary-600 dark:text-primary-400">{transfer.id}</td>
                                    <td className="px-6 py-4">{new Date(transfer.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">{getWarehouseName(transfer.fromWarehouseId)}</td>
                                    <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">{getWarehouseName(transfer.toWarehouseId)}</td>
                                    <td className="px-6 py-4 text-center font-semibold">{transfer.items.length}</td>
                                </tr>
                            ))}
                            {transfers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-10 text-gray-500 dark:text-gray-400">
                                        No se han realizado transferencias.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TransferList;
