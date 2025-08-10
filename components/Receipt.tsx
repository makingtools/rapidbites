

import React from 'react';
import { Invoice, SystemSettings } from '../types';
import { PrinterIcon, PlusIcon, ShieldCheckIcon } from './Icons';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

const getRiskStyles = (level: Invoice['riskLevel']) => {
    switch (level) {
        case 'Alto': return { text: 'text-red-500', icon: <ShieldCheckIcon className="h-3 w-3 text-red-500" /> };
        case 'Medio': return { text: 'text-yellow-600', icon: <ShieldCheckIcon className="h-3 w-3 text-yellow-500" /> };
        default: return { text: 'text-green-600', icon: <ShieldCheckIcon className="h-3 w-3 text-green-500" /> };
    }
};

interface ReceiptProps {
    invoice: Invoice;
    systemSettings: SystemSettings;
    onNewSale: () => void;
}

const Receipt: React.FC<ReceiptProps> = ({ invoice, systemSettings, onNewSale }) => {
    
    const handlePrint = () => {
        const printableElement = document.getElementById('receipt-wrapper-for-print');
        if (!printableElement) return;

        // Add classes to the specific element, not the body
        printableElement.classList.add('printable-area', 'ticket-print');
        
        window.print();
        
        // Clean up classes after printing
        setTimeout(() => {
             printableElement.classList.remove('printable-area', 'ticket-print');
        }, 500);
    };
    
    const riskStyles = getRiskStyles(invoice.riskLevel);
    
    return (
        <div>
            <div id="receipt-wrapper-for-print" className="p-4">
                <div id="receipt-printable-area" className="bg-white text-black p-2 font-mono text-xs">
                    <div className="text-center">
                        <h2 className="text-lg font-bold">{systemSettings.companyName}</h2>
                        <p>{systemSettings.companyAddress}</p>
                        <p>NIT: {systemSettings.companyNit}</p>
                        <p className="mt-2 font-bold">Tiquete de Venta</p>
                        <p>{invoice.id}</p>
                    </div>
                    <div className="border-t border-dashed border-black my-2"></div>
                    <p>Fecha: {new Date(invoice.issueDate).toLocaleString('es-CO')}</p>
                    <p>Cliente: {invoice.customerName}</p>
                    <div className="border-t border-dashed border-black my-2"></div>
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-dashed border-black">
                                <th className="text-left">Cant.</th>
                                <th className="text-left">Producto</th>
                                <th className="text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.items.map(item => (
                                <tr key={item.productId}>
                                    <td className="align-top">{item.quantity}</td>
                                    <td>
                                        {item.productName}<br/>@{formatCurrency(item.unitPrice)}
                                        {item.discount && item.discount > 0 && <div className="text-[10px]">Promo: -{formatCurrency(item.discount)}</div>}
                                    </td>
                                    <td className="text-right align-top">{formatCurrency(item.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     <div className="border-t border-dashed border-black my-2"></div>
                     <div className="space-y-1">
                         <div className="flex justify-between"><span className="font-semibold">Subtotal:</span><span>{formatCurrency(invoice.subtotal)}</span></div>
                         {invoice.totalDiscount && invoice.totalDiscount > 0 && (
                            <div className="flex justify-between"><span className="font-semibold">Descuentos:</span><span>-{formatCurrency(invoice.totalDiscount)}</span></div>
                         )}
                         <div className="flex justify-between"><span className="font-semibold">IVA:</span><span>{formatCurrency(invoice.iva)}</span></div>
                         <div className="flex justify-between text-base font-bold"><span >TOTAL:</span><span>{formatCurrency(invoice.total)}</span></div>
                         <div className="flex justify-between"><span className="font-semibold">Método:</span><span>{invoice.paymentMethod}</span></div>
                     </div>
                     <div className="border-t border-dashed border-black my-2"></div>
                     {invoice.riskLevel && (
                        <div className="flex justify-center items-center gap-1 mt-2 text-[10px]">
                            {riskStyles.icon}
                            <span className={`font-bold ${riskStyles.text}`}>
                                Análisis de Riesgo IA: {invoice.riskLevel}
                            </span>
                        </div>
                     )}
                     <div className="text-center mt-2">
                        <p>¡Gracias por su compra!</p>
                     </div>
                </div>
            </div>

            <div className="p-4 mt-2 flex flex-col gap-3 no-print">
                 <button onClick={handlePrint} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-600 text-white font-bold rounded-lg hover:bg-slate-700 transition">
                     <PrinterIcon className="h-5 w-5" /> Imprimir Recibo
                </button>
                 <button onClick={onNewSale} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition">
                    <PlusIcon className="h-5 w-5" /> Nueva Venta
                </button>
            </div>
        </div>
    );
};

export default Receipt;