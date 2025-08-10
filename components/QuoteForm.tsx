import React, { useState, useEffect } from 'react';
import { Quote, Customer, Product, QuoteLineItem } from '../types';
import { PlusIcon, TrashIcon } from './Icons';

interface QuoteFormProps {
    quote: Quote | null;
    customers: Customer[];
    products: Product[];
    onSave: (quote: Quote) => void;
    onCancel: () => void;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
};

const QuoteForm: React.FC<QuoteFormProps> = ({ quote, customers, products, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Partial<Quote>>({
        stage: 'Calificación',
        items: [],
    });

    useEffect(() => {
        if (quote) {
             setFormData(quote);
        } else {
            setFormData({
                customerId: customers[0]?.id,
                stage: 'Calificación',
                issueDate: new Date().toISOString().split('T')[0],
                expiryDate: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0],
                items: [],
                subtotal: 0,
                iva: 0,
                total: 0,
            });
        }
    }, [quote, customers]);

    const calculateTotals = (items: QuoteLineItem[]) => {
        const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
        const iva = subtotal * 0.19;
        const total = subtotal + iva;
        setFormData(prev => ({...prev, items, subtotal, iva, total}));
    };

    const handleAddItem = () => {
        if (products.length === 0) return;
        const firstProduct = products[0];
        const subtotal = firstProduct.price * 1;
        const iva = subtotal * 0.19;
        const total = subtotal + iva;
        const newItem: QuoteLineItem = {
            productId: firstProduct.id,
            productName: firstProduct.name,
            quantity: 1,
            unitPrice: firstProduct.price,
            subtotal,
            iva,
            total
        };
        calculateTotals([...(formData.items || []), newItem]);
    };

    const handleItemChange = (index: number, field: keyof QuoteLineItem, value: any) => {
        const updatedItems = [...(formData.items || [])];
        const item = updatedItems[index];

        if (field === 'productId') {
            const product = products.find(p => p.id === value);
            if(product){
                item.productId = product.id;
                item.productName = product.name;
                item.unitPrice = product.price;
            }
        } else {
            // @ts-ignore
            item[field] = value;
        }

        item.subtotal = item.quantity * item.unitPrice;
        item.iva = item.subtotal * 0.19;
        item.total = item.subtotal + item.iva;
        calculateTotals(updatedItems);
    };

    const handleRemoveItem = (index: number) => {
        const updatedItems = [...(formData.items || [])].filter((_, i) => i !== index);
        calculateTotals(updatedItems);
    };
    
    const handleCustomerChange = (customerId: number) => {
        const customer = customers.find(c => c.id === customerId);
        setFormData(prev => ({ ...prev, customerId, customerName: customer?.name }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!formData.customerId || !formData.items || formData.items.length === 0) {
            alert("Por favor, selecciona un cliente y añade al menos un ítem a la cotización.");
            return;
        }
        onSave(formData as Quote);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cliente</label>
                    <select
                        id="customerId"
                        value={formData.customerId}
                        onChange={(e) => handleCustomerChange(Number(e.target.value))}
                        required
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="stage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Etapa</label>
                    <select
                        id="stage"
                        value={formData.stage}
                        onChange={(e) => setFormData(prev => ({ ...prev, stage: e.target.value as Quote['stage'] }))}
                        required
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                        <option value="Calificación">Calificación</option>
                        <option value="Propuesta Enviada">Propuesta Enviada</option>
                        <option value="Negociación">Negociación</option>
                        <option value="Ganada">Ganada</option>
                        <option value="Perdida">Perdida</option>
                    </select>
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Emisión</label>
                    <input
                        type="date"
                        id="issueDate"
                        value={formData.issueDate || ''}
                        onChange={(e) => setFormData(prev => ({...prev, issueDate: e.target.value}))}
                        required
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                </div>
                <div>
                    <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Vencimiento</label>
                    <input
                        type="date"
                        id="expiryDate"
                        value={formData.expiryDate || ''}
                        onChange={(e) => setFormData(prev => ({...prev, expiryDate: e.target.value}))}
                        required
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                </div>
            </div>
            
            <div className="space-y-2">
                <h3 className="text-lg font-medium">Ítems de la Cotización</h3>
                {formData.items?.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <select
                            value={item.productId}
                            onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                            className="col-span-5 mt-1 block w-full px-2 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 text-sm"
                        >
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                            className="col-span-2 mt-1 block w-full px-2 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm"
                            min="0.1"
                            step="0.1"
                        />
                         <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))}
                            className="col-span-3 mt-1 block w-full px-2 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm"
                        />
                        <div className="col-span-2 text-center">
                             <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700 p-1">
                                <TrashIcon className="h-5 w-5"/>
                             </button>
                        </div>
                    </div>
                ))}
                 <button type="button" onClick={handleAddItem} className="flex items-center text-sm text-primary-600 dark:text-primary-400 font-semibold hover:underline">
                     <PlusIcon className="h-4 w-4 mr-1"/> Añadir Ítem
                </button>
            </div>
            
            <div className="flex justify-end">
                <div className="w-full md:w-1/2 space-y-2 pt-4 border-t dark:border-gray-600">
                    <div className="flex justify-between"><span className="text-gray-500">Subtotal:</span> <span>{formatCurrency(formData.subtotal || 0)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">IVA (19%):</span> <span>{formatCurrency(formData.iva || 0)}</span></div>
                    <div className="flex justify-between font-bold text-lg"><span className="text-gray-800 dark:text-white">Total:</span> <span className="text-primary-600 dark:text-primary-400">{formatCurrency(formData.total || 0)}</span></div>
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition shadow-md">Guardar Cotización</button>
            </div>
        </form>
    );
};

export default QuoteForm;