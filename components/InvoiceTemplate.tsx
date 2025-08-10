
import React from 'react';
import { Invoice, SystemSettings } from '../types';
import { ShieldCheckIcon } from './Icons';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 2,
    }).format(value);
};

interface InvoiceTemplateProps {
    invoice: Invoice;
    systemSettings: SystemSettings;
}

const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ invoice, systemSettings }) => {
    const accentColor = "#0284c7"; // primary-600
    return (
        <div className="bg-white p-10 font-sans text-sm text-gray-800" style={{width: '210mm', minHeight: '297mm', display: 'flex', flexDirection: 'column'}}>
            <main className="flex-grow">
                <header className="flex justify-between items-start pb-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold uppercase" style={{color: accentColor}}>{systemSettings.companyName}</h1>
                        <p className="text-gray-600">{systemSettings.companyAddress}</p>
                        <p className="text-gray-600">NIT: {systemSettings.companyNit}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-4xl font-light text-gray-500 uppercase">Factura</h2>
                        <p className="font-semibold text-gray-700 mt-1">{invoice.id}</p>
                    </div>
                </header>
                
                <section className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="font-semibold text-gray-500 uppercase tracking-wider mb-2">Facturar A</h3>
                        <p className="font-bold text-base mt-1">{invoice.customerName}</p>
                        <p>NIT/CC: {invoice.customerId}</p>
                    </div>
                    <div className="text-right bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-baseline">
                            <span className="font-semibold text-gray-500">Fecha Emisión:</span>
                            <span className="font-medium">{new Date(invoice.issueDate).toLocaleDateString('es-CO')}</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                            <span className="font-semibold text-gray-500">Fecha Vencimiento:</span>
                            <span className="font-medium">{new Date(invoice.dueDate).toLocaleDateString('es-CO')}</span>
                        </div>
                         <div className="flex justify-between items-baseline mt-2">
                            <span className="font-semibold text-gray-500">Estado:</span>
                            <span className="font-bold uppercase px-2 py-0.5 rounded" style={{color: accentColor, backgroundColor: `${accentColor}1A`}}>{invoice.status}</span>
                        </div>
                    </div>
                </section>
                
                <section>
                    <table className="w-full text-left">
                        <thead>
                            <tr style={{backgroundColor: accentColor, color: 'white'}}>
                                <th className="p-3 font-semibold uppercase text-sm tracking-wider w-1/2">Descripción</th>
                                <th className="p-3 text-right font-semibold uppercase text-sm tracking-wider">Cant.</th>
                                <th className="p-3 text-right font-semibold uppercase text-sm tracking-wider">Precio Unit.</th>
                                <th className="p-3 text-right font-semibold uppercase text-sm tracking-wider">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {invoice.items.map((item, index) => (
                                <tr key={index}>
                                    <td className="p-3">
                                        <p className="font-semibold">{item.productName}</p>
                                        <p className="text-gray-500 text-xs">{item.productId}</p>
                                        {item.discount && item.discount > 0 && (
                                            <p className="text-accent text-xs italic">{item.promotionName} (-{formatCurrency(item.discount)})</p>
                                        )}
                                    </td>
                                    <td className="p-3 text-right">{item.quantity.toFixed(2)}</td>
                                    <td className="p-3 text-right">{formatCurrency(item.unitPrice)}</td>
                                    <td className="p-3 text-right font-medium">{formatCurrency(item.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            </main>
            
            <footer className="mt-10 pt-4 border-t">
                <div className="flex justify-end mb-6">
                    <div className="w-full sm:w-2/5 space-y-2 text-gray-700">
                        <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>{formatCurrency(invoice.subtotal)}</span>
                        </div>
                        {invoice.totalDiscount && invoice.totalDiscount > 0 && (
                             <div className="flex justify-between text-accent">
                                <span>Descuentos:</span>
                                <span>-{formatCurrency(invoice.totalDiscount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span>IVA (19%):</span>
                            <span>{formatCurrency(invoice.iva)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-xl mt-2 pt-2 border-t-2" style={{borderColor: accentColor, color: accentColor}}>
                            <span className="uppercase">Total a Pagar:</span>
                            <span>{formatCurrency(invoice.total)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                     <div className="flex items-center gap-2">
                        <ShieldCheckIcon className="h-5 w-5 text-green-500"/>
                        <div>
                            <p className="font-bold">Factura Electrónica Validada por la DIAN</p>
                            <p className="font-mono text-gray-400 text-[10px]">CUNE: {invoice.cune}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="font-semibold">{systemSettings.companyName}</p>
                        <p>Gracias por su negocio.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default InvoiceTemplate;
