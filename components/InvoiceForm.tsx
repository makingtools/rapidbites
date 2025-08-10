import React, { useState, useEffect } from 'react';
import { Invoice, Customer, Product, InvoiceLineItem, Warehouse, Salesperson } from '../types';
import { PlusIcon, TrashIcon } from './Icons';
import { formatCurrency } from '../utils/formatters';

interface InvoiceFormProps {
    invoice: Invoice | null;
    customers: Customer[];
    products: Product[];
    warehouses: Warehouse[];
    salespeople: Salesperson[];
    onSave: (invoice: Invoice) => void;
    onCancel: () => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoice, customers, products, warehouses, salespeople, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Partial<Invoice>>({
        status: 'borrador',
        items: [],
    });

    useEffect(() => {
        if (invoice) {
             setFormData({
                ...invoice,
                warehouseId: invoice.warehouseId || (warehouses.length > 0 ? warehouses[0].id : undefined)
            });
        } else {
            setFormData({
                customerId: customers[0]?.id,
                customerName: customers[0]?.name,
                status: 'borrador',
                issueDate: new Date().toISOString().split('T')[0],
                dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
                items: [],
                subtotal: 0,
                iva: 0,
                total: 0,
                warehouseId: warehouses.length > 0 ? warehouses[0].id : undefined,
            });
        }
    }, [invoice, customers, warehouses]);
    
    useEffect(() => {
        if (formData.items) {
            calculateTotals(formData.items);
        }
    }, [formData.items]);


    const calculateTotals = (items: InvoiceLineItem[]) => {
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
        const newItem: InvoiceLineItem = {
            productId: firstProduct.id,
            productName: firstProduct.name,
            quantity: 1,
            unitPrice: firstProduct.price,
            subtotal,
            iva,
            total
        };
        setFormData(prev => ({...prev, items: [...(prev.items || []), newItem]}));
    };

    const handleItemChange = (index: number, field: keyof InvoiceLineItem, value: any) => {
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
        setFormData(prev => ({...prev, items: updatedItems}));
    };

    const handleRemoveItem = (index: number) => {
        const updatedItems = [...(formData.items || [])].filter((_, i) => i !== index);
        setFormData(prev => ({...prev, items: updatedItems}));
    };
    
    const handleCustomerChange = (customerId: number) => {
        const customer = customers.find(c => c.id === customerId);
        setFormData(prev => ({ ...prev, customerId, customerName: customer?.name }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!formData.customerId || !formData.items || formData.items.length === 0 || !formData.warehouseId) {
            alert("Por favor, completa todos los campos requeridos: Cliente, Bodega y al menos un ítem.");
            return;
        }
        onSave(formData as Invoice);
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
                    <label htmlFor="salespersonId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vendedor (Opcional)</label>
                    <select
                        id="salespersonId"
                        value={formData.salespersonId || ''}
                        onChange={(e) => setFormData(prev => ({...prev, salespersonId: e.target.value}))}
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                        <option value="">Usuario Actual</option>
                        {salespeople.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Vencimiento</label>
                    <input
                        type="date"
                        id="dueDate"
                        value={formData.dueDate || ''}
                        onChange={(e) => setFormData(prev => ({...prev, dueDate: e.target.value}))}
                        required
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                </div>
                 <div>
                    <label htmlFor="warehouseId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bodega de Origen</label>
                    <select
                        id="warehouseId"
                        value={formData.warehouseId || ''}
                        onChange={(e) => setFormData(prev => ({...prev, warehouseId: e.target.value}))}
                        required
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                        <option value="">Seleccionar Bodega</option>
                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                </div>
            </div>
            
            <div className="space-y-2">
                <h3 className="text-lg font-medium">Ítems de la Factura</h3>
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
                            placeholder="Cant."
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                            className="col-span-2 mt-1 block w-full px-2 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm"
                            min="0.1"
                            step="0.1"
                        />
                         <input
                            type="number"
                            placeholder="Precio Unit."
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
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition shadow-md">Guardar Factura</button>
            </div>
        </form>
    );
};

export default InvoiceForm;
