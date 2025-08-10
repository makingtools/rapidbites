

import React, { useState, useMemo } from 'react';
import { Product, Invoice, PurchaseOrder, Warehouse, WarehouseTransfer } from '../types';
import { DocumentTextIcon, DocumentDownloadIcon } from './Icons';
import { exportToPdf, exportToXlsx } from '../services/downloadService';

const KardexReport: React.FC<{ products: Product[], invoices: Invoice[], purchaseOrders: PurchaseOrder[], warehouses: Warehouse[], transfers: WarehouseTransfer[] }> = ({ products, invoices, purchaseOrders, warehouses, transfers }) => {
    const [selectedProductId, setSelectedProductId] = useState<string | null>(products[0]?.id || null);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('all');

    const kardexData = useMemo(() => {
        if (!selectedProductId) return [];

        const transactions: { date: string, type: 'Venta' | 'Compra' | 'Transferencia Salida' | 'Transferencia Entrada', refId: string, quantityChange: number, cost?: number }[] = [];

        // Sales (outflows)
        invoices.forEach(invoice => {
            if (invoice.status !== 'borrador' && (selectedWarehouseId === 'all' || invoice.warehouseId === selectedWarehouseId)) {
                invoice.items.forEach(item => {
                    if (item.productId === selectedProductId) {
                        transactions.push({
                            date: invoice.issueDate,
                            type: 'Venta',
                            refId: invoice.id,
                            quantityChange: -item.quantity
                        });
                    }
                });
            }
        });
        
        // Purchases (inflows)
        purchaseOrders.forEach(po => {
            if (po.status === 'recibida' && (selectedWarehouseId === 'all' || po.warehouseId === selectedWarehouseId)) {
                po.items.forEach(item => {
                    if (item.productId === selectedProductId) {
                        transactions.push({
                            date: po.issueDate,
                            type: 'Compra',
                            refId: po.id,
                            quantityChange: item.quantity,
                            cost: item.unitCost,
                        });
                    }
                });
            }
        });

        // Transfers
        transfers.forEach(transfer => {
            transfer.items.forEach(item => {
                if(item.productId === selectedProductId) {
                    // Outflow from source warehouse
                    if(selectedWarehouseId === 'all' || transfer.fromWarehouseId === selectedWarehouseId) {
                        transactions.push({
                            date: transfer.date,
                            type: 'Transferencia Salida',
                            refId: transfer.id,
                            quantityChange: -item.quantity
                        });
                    }
                    // Inflow to destination warehouse
                     if(selectedWarehouseId === 'all' || transfer.toWarehouseId === selectedWarehouseId) {
                        transactions.push({
                            date: transfer.date,
                            type: 'Transferencia Entrada',
                            refId: transfer.id,
                            quantityChange: item.quantity
                        });
                    }
                }
            });
        });

        transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        // Calculate running balance
        let balance = 0;
        return transactions.map(t => {
            balance += t.quantityChange;
            return { ...t, balance };
        });

    }, [selectedProductId, selectedWarehouseId, invoices, purchaseOrders, transfers]);
    
    const selectedProductName = products.find(p => p.id === selectedProductId)?.name || "N/A";

    const columns = [
        { header: 'Fecha', dataKey: 'date' },
        { header: 'Tipo', dataKey: 'type' },
        { header: 'Referencia', dataKey: 'refId' },
        { header: 'Entrada', dataKey: 'in' },
        { header: 'Salida', dataKey: 'out' },
        { header: 'Saldo', dataKey: 'balance' },
    ];
    
    const exportableData = kardexData.map(t => ({
        ...t,
        in: t.quantityChange > 0 ? t.quantityChange : '',
        out: t.quantityChange < 0 ? Math.abs(t.quantityChange) : '',
    }));
    
    const handleExportPdf = () => exportToPdf(columns, exportableData, `Kardex - ${selectedProductName}`);
    const handleExportXlsx = () => exportToXlsx(exportableData, `kardex_${selectedProductName}.xlsx`);

    const getTransactionTypeChip = (type: string) => {
        const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
        switch (type) {
            case 'Compra':
            case 'Transferencia Entrada':
                return <span className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`}>{type}</span>;
            case 'Venta':
            case 'Transferencia Salida':
                 return <span className={`${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`}>{type}</span>;
            default:
                return <span>{type}</span>;
        }
    }


    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
            <header className="mb-6">
                 <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center">
                            <DocumentTextIcon className="h-8 w-8 mr-3 text-primary-500" />
                            Informe Kardex de Inventario
                        </h1>
                        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Trazabilidad completa de las entradas y salidas de tus productos.</p>
                    </div>
                     <div className="flex items-center gap-2">
                        <button onClick={handleExportPdf} disabled={!selectedProductId || kardexData.length === 0} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50">
                            <DocumentDownloadIcon className="h-5 w-5" /> PDF
                        </button>
                        <button onClick={handleExportXlsx} disabled={!selectedProductId || kardexData.length === 0} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50">
                            <DocumentDownloadIcon className="h-5 w-5" /> Excel
                        </button>
                    </div>
                </div>
            </header>

            <div className="mb-4 flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <label htmlFor="product-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Selecciona un Producto:</label>
                    <select
                        id="product-select"
                        value={selectedProductId || ''}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                 <div className="flex-1">
                    <label htmlFor="warehouse-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Filtrar por Bodega:</label>
                    <select
                        id="warehouse-select"
                        value={selectedWarehouseId}
                        onChange={(e) => setSelectedWarehouseId(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="all">Todas las Bodegas</option>
                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Fecha</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tipo</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Referencia</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase text-right">Entrada</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase text-right">Salida</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase text-right">Saldo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {kardexData.map((t, index) => (
                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{new Date(t.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">{getTransactionTypeChip(t.type)}</td>
                                    <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-400">{t.refId}</td>
                                    <td className="px-6 py-4 text-right text-green-600 dark:text-green-400 font-semibold">{t.quantityChange > 0 ? t.quantityChange : '-'}</td>
                                    <td className="px-6 py-4 text-right text-red-600 dark:text-red-400 font-semibold">{t.quantityChange < 0 ? Math.abs(t.quantityChange) : '-'}</td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-800 dark:text-white">{t.balance}</td>
                                </tr>
                            ))}
                            {kardexData.length === 0 && (
                                <tr><td colSpan={6} className="text-center py-10 text-gray-500 dark:text-gray-400">No hay movimientos para este producto y bodega.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default KardexReport;
