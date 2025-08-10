import React, { useState, useMemo } from 'react';
import { AppDataState } from '../types';
import { CubeIcon, DocumentDownloadIcon } from './Icons';
import PageHeader from './PageHeader';
import FilterBar from './FilterBar';
import { exportToPdf, exportToXlsx } from '../services/downloadService';

const StockReport: React.FC<{ appState: AppDataState }> = ({ appState }) => {
    const { products, warehouses } = appState;
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProducts = useMemo(() => {
        if (!searchTerm) return products;
        const lowerCaseSearch = searchTerm.toLowerCase();
        return products.filter(p =>
            p.name.toLowerCase().includes(lowerCaseSearch) ||
            p.category.toLowerCase().includes(lowerCaseSearch) ||
            p.id.toLowerCase().includes(lowerCaseSearch)
        );
    }, [products, searchTerm]);

    const handleExportPdf = () => {
        const columns = [
            { header: 'Producto', dataKey: 'name' },
            { header: 'Categoría', dataKey: 'category' },
            ...warehouses.map(w => ({ header: w.name, dataKey: w.id })),
            { header: 'Total', dataKey: 'total' }
        ];
        const data = filteredProducts.map(p => {
            const total = Object.values(p.stockByWarehouse).reduce((sum, q) => sum + q, 0);
            const row: any = { name: p.name, category: p.category, total };
            warehouses.forEach(w => {
                row[w.id] = p.stockByWarehouse[w.id] || 0;
            });
            return row;
        });
        exportToPdf(columns, data, "Informe de Stock por Bodega");
    };

    const handleExportXlsx = () => {
        const data = filteredProducts.map(p => {
            const total = Object.values(p.stockByWarehouse).reduce((sum, q) => sum + q, 0);
            const row: any = { Producto: p.name, Categoría: p.category };
            warehouses.forEach(w => {
                row[w.name] = p.stockByWarehouse[w.id] || 0;
            });
            row['Stock Total'] = total;
            return row;
        });
        exportToXlsx(data, "informe_de_stock.xlsx");
    };

    const actions = (
        <>
            <button onClick={handleExportPdf} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg hover:bg-slate-50 dark:hover:bg-neutral-700">
               <DocumentDownloadIcon className="h-5 w-5" /> PDF
            </button>
            <button onClick={handleExportXlsx} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg hover:bg-slate-50 dark:hover:bg-neutral-700">
               <DocumentDownloadIcon className="h-5 w-5" /> Excel
            </button>
        </>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
            <PageHeader
                icon={<CubeIcon />}
                title="Informe de Stock por Bodega"
                description="Consulta las existencias de todos tus productos en cada ubicación."
                actions={actions}
            />
            <FilterBar
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
                searchPlaceholder="Buscar por producto o categoría..."
                showDatePresets={false}
            />
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-neutral-800/50">
                            <tr>
                                <th className="sticky left-0 bg-slate-50 dark:bg-neutral-800/50 px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Producto</th>
                                <th className="px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Categoría</th>
                                {warehouses.map(w => (
                                    <th key={w.id} className="px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider text-right">{w.name}</th>
                                ))}
                                <th className="px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider text-right">Stock Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-neutral-800">
                            {filteredProducts.map(product => {
                                const totalStock = Object.values(product.stockByWarehouse).reduce((sum, q) => sum + q, 0);
                                const isLowStock = totalStock < 50;
                                return (
                                    <tr key={product.id} className={`hover:bg-slate-50 dark:hover:bg-neutral-800/40 ${isLowStock ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}>
                                        <td className="sticky left-0 bg-white dark:bg-neutral-900 px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">{product.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{product.category}</td>
                                        {warehouses.map(w => {
                                            const stock = product.stockByWarehouse[w.id] || 0;
                                            let stockColor = 'text-slate-500 dark:text-slate-400';
                                            if (stock < 20 && stock > 0) stockColor = 'text-yellow-600 dark:text-yellow-400 font-semibold';
                                            if (stock === 0) stockColor = 'text-red-600 dark:text-red-400 font-bold';
                                            return <td key={w.id} className={`px-6 py-4 whitespace-nowrap text-sm text-right ${stockColor}`}>{stock}</td>
                                        })}
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${isLowStock ? 'text-yellow-700 dark:text-yellow-300' : 'text-slate-800 dark:text-white'}`}>{totalStock}</td>
                                    </tr>
                                );
                            })}
                             {filteredProducts.length === 0 && (
                                <tr>
                                    <td colSpan={4 + warehouses.length} className="text-center py-10 text-slate-500 dark:text-slate-400">
                                        No se encontraron productos que coincidan con la búsqueda.
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

export default StockReport;