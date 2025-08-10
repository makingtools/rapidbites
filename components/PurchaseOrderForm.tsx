
import React, { useState, useEffect } from 'react';
import { PurchaseOrder, Supplier, Product, PurchaseOrderLineItem, Warehouse } from '../types';
import { PlusIcon, TrashIcon } from './Icons';

interface PurchaseOrderFormProps {
    purchaseOrder: PurchaseOrder | null;
    suppliers: Supplier[];
    products: Product[];
    warehouses: Warehouse[];
    onSave: (po: PurchaseOrder) => void;
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

const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({ purchaseOrder, suppliers, products, warehouses, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Partial<PurchaseOrder>>({
        status: 'borrador',
        items: [],
    });

    useEffect(() => {
        const initialDraft = purchaseOrder?.items?.[0]?.productId 
            ? {
                ...purchaseOrder,
                supplierId: suppliers.find(s => s.category === products.find(p => p.id === purchaseOrder.items![0].productId)?.category)?.id || suppliers[0]?.id,
              }
            : purchaseOrder;

        if (initialDraft && initialDraft.id) {
            setFormData({
                ...initialDraft,
                warehouseId: initialDraft.warehouseId || (warehouses.length > 0 ? warehouses[0].id : undefined)
            });
        } else {
            setFormData({
                supplierId: suppliers[0]?.id,
                supplierName: suppliers[0]?.name,
                status: 'borrador',
                issueDate: new Date().toISOString().split('T')[0],
                items: initialDraft?.items || [],
                subtotal: 0,
                iva: 0,
                total: 0,
                warehouseId: warehouses.length > 0 ? warehouses[0].id : undefined,
            });
        }
    }, [purchaseOrder, suppliers, warehouses, products]);

     useEffect(() => {
        if(formData.items){
            calculateTotals(formData.items);
        }
    }, [formData.items]);


    const calculateTotals = (items: PurchaseOrderLineItem[]) => {
        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        const iva = subtotal * 0.19;
        const total = subtotal + iva;
        setFormData(prev => ({...prev, items, subtotal, iva, total}));
    };

    const handleAddItem = () => {
        if (products.length === 0) return;
        const firstProduct = products[0];
        const newItem: PurchaseOrderLineItem = {
            productId: firstProduct.id,
            productName: firstProduct.name,
            quantity: 10,
            unitCost: firstProduct.cost,
            total: firstProduct.cost * 10,
        };
        calculateTotals([...(formData.items || []), newItem]);
    };

    const handleItemChange = (index: number, field: keyof PurchaseOrderLineItem, value: any) => {
        const updatedItems = [...(formData.items || [])];
        const item = updatedItems[index];

        if (field === 'productId') {
            const product = products.find(p => p.id === value);
            if(product){
                item.productId = product.id;
                item.productName = product.name;
                item.unitCost = product.cost; // Update cost when product changes
            }
        } else {
            // @ts-ignore
            item[field] = value;
        }

        item.total = item.quantity * item.unitCost;
        calculateTotals(updatedItems);
    };

    const handleRemoveItem = (index: number) => {
        const updatedItems = [...(formData.items || [])].filter((_, i) => i !== index);
        calculateTotals(updatedItems);
    };
    
    const handleSupplierChange = (supplierId: string) => {
        const supplier = suppliers.find(s => s.id === supplierId);
        setFormData(prev => ({ ...prev, supplierId, supplierName: supplier?.name }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!formData.supplierId || !formData.items || formData.items.length === 0) {
            alert("Por favor, selecciona un proveedor y añade al menos un ítem a la orden.");
            return;
        }
        if(formData.status === 'recibida' && !formData.warehouseId) {
            alert("Por favor, selecciona una bodega de destino para recibir la mercancía.");
            return;
        }
        onSave(formData as PurchaseOrder);
    };
    
    const statuses: PurchaseOrder['status'][] = ['borrador', 'enviada', 'recibida'];

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Proveedor</label>
                    <select
                        id="supplierId"
                        value={formData.supplierId}
                        onChange={(e) => handleSupplierChange(e.target.value)}
                        required
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
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
            </div>
            
            <div className="space-y-2">
                <h3 className="text-lg font-medium">Ítems de la Orden</h3>
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
                            min="1"
                            step="1"
                        />
                         <input
                            type="number"
                            placeholder="Costo Unit."
                            value={item.unitCost}
                            onChange={(e) => handleItemChange(index, 'unitCost', parseFloat(e.target.value))}
                            className="col-span-3 mt-1 block w-full px-2 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm"
                            min="0"
                        />
                        <div className="col-span-2 text-right">
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
            
            <div className="flex justify-between items-end gap-6">
                 <div className='flex-1'>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estado de la Orden</label>
                    <select
                        id="status"
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({...prev, status: e.target.value as PurchaseOrder['status']}))}
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                        {statuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                </div>
                 {formData.status === 'recibida' && (
                    <div className='flex-1'>
                        <label htmlFor="warehouseId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bodega de Destino</label>
                        <select
                            id="warehouseId"
                            value={formData.warehouseId || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, warehouseId: e.target.value }))}
                            required
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="">Seleccionar Bodega</option>
                            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                    </div>
                )}
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
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition shadow-md">Guardar Orden de Compra</button>
            </div>
        </form>
    );
};

export default PurchaseOrderForm;
