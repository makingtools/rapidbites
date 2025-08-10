
import React, { useState } from 'react';
import { Warehouse, Product, WarehouseTransfer, WarehouseTransferItem } from '../types';
import { PlusIcon, TrashIcon } from './Icons';

interface TransferFormProps {
    warehouses: Warehouse[];
    products: Product[];
    onSave: (transfer: WarehouseTransfer) => void;
    onCancel: () => void;
}

const TransferForm: React.FC<TransferFormProps> = ({ warehouses, products, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Partial<WarehouseTransfer>>({
        fromWarehouseId: warehouses[0]?.id,
        toWarehouseId: warehouses[1]?.id,
        date: new Date().toISOString().split('T')[0],
        items: [],
    });

    const handleAddItem = () => {
        if (products.length === 0) return;
        const firstProduct = products[0];
        const newItem: WarehouseTransferItem = {
            productId: firstProduct.id,
            productName: firstProduct.name,
            quantity: 1,
        };
        setFormData(prev => ({...prev, items: [...(prev.items || []), newItem]}));
    };
    
    const handleItemChange = (index: number, field: keyof WarehouseTransferItem, value: any) => {
        const updatedItems = [...(formData.items || [])];
        const item = { ...updatedItems[index] };

        if (field === 'productId') {
            const product = products.find(p => p.id === value);
            if(product){
                item.productId = product.id;
                item.productName = product.name;
            }
        } else {
            // @ts-ignore
            item[field] = parseFloat(value) || 0;
        }
        updatedItems[index] = item;
        setFormData(prev => ({...prev, items: updatedItems}));
    };

    const handleRemoveItem = (index: number) => {
        const updatedItems = (formData.items || []).filter((_, i) => i !== index);
        setFormData(prev => ({...prev, items: updatedItems}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { fromWarehouseId, toWarehouseId, items } = formData;
        if (!fromWarehouseId || !toWarehouseId || !items || items.length === 0) {
            alert("Completa todos los campos: origen, destino y al menos un ítem.");
            return;
        }
        if (fromWarehouseId === toWarehouseId) {
            alert("La bodega de origen y destino no pueden ser la misma.");
            return;
        }

        // Stock validation
        for (const item of items) {
            const product = products.find(p => p.id === item.productId);
            const stockInSource = product?.stockByWarehouse[fromWarehouseId] ?? 0;
            if (item.quantity > stockInSource) {
                alert(`Stock insuficiente para "${item.productName}" en ${warehouses.find(w => w.id === fromWarehouseId)?.name}. Disponible: ${stockInSource}`);
                return;
            }
             if (item.quantity <= 0) {
                alert(`La cantidad para "${item.productName}" debe ser mayor a cero.`);
                return;
            }
        }
        
        onSave(formData as WarehouseTransfer);
    };
    
    const { fromWarehouseId, items } = formData;
    const availableProducts = fromWarehouseId ? products.filter(p => (p.stockByWarehouse[fromWarehouseId] ?? 0) > 0) : products;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label htmlFor="fromWarehouseId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bodega Origen</label>
                    <select
                        id="fromWarehouseId"
                        value={formData.fromWarehouseId}
                        onChange={(e) => setFormData(prev => ({ ...prev, fromWarehouseId: e.target.value }))}
                        required
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="toWarehouseId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bodega Destino</label>
                    <select
                        id="toWarehouseId"
                        value={formData.toWarehouseId}
                        onChange={(e) => setFormData(prev => ({ ...prev, toWarehouseId: e.target.value }))}
                        required
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                         {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                </div>
            </div>
            
             <div className="space-y-2">
                <h3 className="text-lg font-medium">Ítems a Transferir</h3>
                {items?.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <select
                            value={item.productId}
                            onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                            className="col-span-8 mt-1 block w-full px-2 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 text-sm"
                        >
                            {availableProducts.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stockByWarehouse[fromWarehouseId || ''] || 0})</option>)}
                        </select>
                        <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                            className="col-span-3 mt-1 block w-full px-2 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm"
                            min="1"
                            step="1"
                        />
                        <div className="col-span-1 text-center">
                             <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700 p-1">
                                <TrashIcon className="h-5 w-5"/>
                             </button>
                        </div>
                    </div>
                ))}
                <button type="button" onClick={handleAddItem} className="flex items-center text-sm text-primary-600 dark:text-primary-400 font-semibold hover:underline disabled:opacity-50" disabled={!fromWarehouseId}>
                     <PlusIcon className="h-4 w-4 mr-1"/> Añadir Ítem
                </button>
             </div>

            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition shadow-md">Confirmar Transferencia</button>
            </div>
        </form>
    );
};

export default TransferForm;
