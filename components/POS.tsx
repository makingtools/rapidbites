import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { AppDataState, CashSession, Invoice, InvoiceLineItem, Product, View, Customer, AIPosInsight } from '../types';
import { SearchIcon, PlusIcon, XMarkIcon, UserPlusIcon, TrashIcon, LockClosedIcon, DocumentTextIcon, BackspaceIcon, CubeIcon, BanknotesIcon, SparklesIcon } from './Icons';
import PaymentModal from './PaymentModal';
import Receipt from './Receipt';
import { formatCurrency } from '../utils/formatters';
import { getAIPosInsight } from '../services/geminiService';

type Bill = {
    id: number;
    name: string;
    items: InvoiceLineItem[];
    customerId: number;
}

const CustomerSelect: React.FC<{ customers: Customer[], selectedId: number, onChange: (id: number) => void, onNewCustomer: () => void }> = React.memo(({ customers, selectedId, onChange, onNewCustomer }) => (
    <div className="flex items-center gap-2 flex-grow">
        <select
            value={selectedId}
            onChange={e => onChange(Number(e.target.value))}
            className="w-full bg-transparent font-semibold text-lg focus:outline-none"
        >
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={onNewCustomer} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-neutral-800" title="Nuevo Cliente">
            <UserPlusIcon className="h-6 w-6 text-slate-500" />
        </button>
    </div>
));

const AIPosSuggestions: React.FC<{
    cartItems: InvoiceLineItem[],
    products: Product[],
    onAddSuggested: (product: Product) => void
}> = ({ cartItems, products, onAddSuggested }) => {
    const [suggestion, setSuggestion] = useState<AIPosInsight | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const debounceTimeout = useRef<number | null>(null);

    useEffect(() => {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
        if (cartItems.length > 0) {
            setIsLoading(true);
            debounceTimeout.current = window.setTimeout(async () => {
                try {
                    const result = await getAIPosInsight(cartItems, products);
                    setSuggestion(result);
                } catch (e) {
                    console.error("Failed to get AI POS suggestion:", e);
                    setSuggestion(null);
                } finally {
                    setIsLoading(false);
                }
            }, 1500); // Debounce API calls
        } else {
            setSuggestion(null);
            setIsLoading(false);
        }

        return () => {
            if (debounceTimeout.current) {
                clearTimeout(debounceTimeout.current);
            }
        };
    }, [cartItems, products]);

    if (!isLoading && !suggestion) {
        return null;
    }

    const handleAddClick = () => {
        if (suggestion?.suggestedProductId) {
            const productToAdd = products.find(p => p.id === suggestion.suggestedProductId);
            if (productToAdd) {
                onAddSuggested(productToAdd);
            }
        }
    };

    return (
        <div className="p-3 mb-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border-l-4 border-primary-500 animate-fade-in">
            <div className="flex items-start gap-3">
                <SparklesIcon className="h-6 w-6 text-primary-500 flex-shrink-0 mt-1" />
                <div>
                    <h4 className="font-bold text-primary-700 dark:text-primary-300">Asistente de Ventas IA</h4>
                    {isLoading ? (
                        <p className="text-sm text-slate-500 italic">Analizando...</p>
                    ) : suggestion ? (
                        <>
                            <p className="text-sm text-slate-700 dark:text-slate-200 mt-1">{suggestion.message}</p>
                            {suggestion.suggestedProductId && (
                                <button
                                    onClick={handleAddClick}
                                    className="mt-2 flex items-center gap-1 text-xs font-bold text-accent-600 dark:text-accent-400 hover:underline"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                    Añadir al Carrito
                                </button>
                            )}
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

const QuickAccessProducts: React.FC<{
    products: Product[],
    onAddToCart: (product: Product) => void
}> = ({ products, onAddToCart }) => {
    const quickProducts = useMemo(() => products.slice(0, 8), [products]);

    return (
        <div className="flex-shrink-0 p-3 bg-slate-200/50 dark:bg-neutral-800/50">
             <h3 className="text-xs font-bold uppercase text-slate-500 mb-2">Acceso Rápido</h3>
             <div className="grid grid-cols-4 lg:grid-cols-8 gap-2">
                 {quickProducts.map(product => (
                     <button
                        key={product.id}
                        onClick={() => onAddToCart(product)}
                        className="p-2 bg-white dark:bg-neutral-900 rounded-lg shadow-sm hover:bg-primary-100 dark:hover:bg-primary-900/40 hover:ring-2 ring-primary-500 transition-all text-center aspect-square flex flex-col justify-center items-center"
                        title={product.name}
                     >
                         <span className="text-xs font-semibold leading-tight line-clamp-2">{product.name}</span>
                         <span className="text-xs font-bold text-primary-600 mt-1">{formatCurrency(product.price)}</span>
                     </button>
                 ))}
             </div>
        </div>
    );
};

interface POSProps {
    appState: AppDataState;
    activeCashSession: CashSession | null;
    onSaveInvoice: (invoice: Invoice) => void;
    onNavigate: (view: View, payload?: any) => void;
    selectedWarehouseId: string;
    showConfirmation: (title: string, message: string, onConfirm: () => void) => void;
}

const POS: React.FC<POSProps> = ({ appState, activeCashSession, onSaveInvoice, onNavigate, selectedWarehouseId, showConfirmation }) => {
    const [bills, setBills] = useState<Bill[]>([{ id: Date.now(), name: 'Cuenta 1', items: [], customerId: 1 }]);
    const [activeBillId, setActiveBillId] = useState<number>(bills[0].id);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [completedInvoice, setCompletedInvoice] = useState<Invoice | null>(null);
    const nextBillNumber = useRef(2);
    const [mobileView, setMobileView] = useState<'cart' | 'catalog'>('cart');


    const activeBill = useMemo(() => bills.find(b => b.id === activeBillId)!, [bills, activeBillId]);

    const sessionSalesTotal = useMemo(() => {
        if (!activeCashSession) {
            return 0;
        }
        return appState.invoices
            .filter(i => i.cashSessionId === activeCashSession.id && i.status === 'pagada')
            .reduce((sum, inv) => sum + inv.total, 0);
    }, [appState.invoices, activeCashSession]);

    const productsInWarehouse = useMemo(() => {
        return appState.products.filter(p => (p.stockByWarehouse[selectedWarehouseId] || 0) > 0);
    }, [appState.products, selectedWarehouseId]);
    
    const categories = useMemo(() => ['all', ...Array.from(new Set(productsInWarehouse.map(p => p.category)))], [productsInWarehouse]);
    
    const filteredProducts = useMemo(() => {
        return productsInWarehouse.filter(p => {
            const categoryMatch = selectedCategory === 'all' || p.category === selectedCategory;
            const searchMatch = searchTerm === '' || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toLowerCase().includes(searchTerm.toLowerCase());
            return categoryMatch && searchMatch;
        });
    }, [searchTerm, selectedCategory, productsInWarehouse]);

    const activePromotions = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return appState.promotions.filter(p => p.startDate <= today && p.endDate >= today);
    }, [appState.promotions]);
    
    const applyPromotions = useCallback((lineItems: InvoiceLineItem[], products: Product[]): InvoiceLineItem[] => {
        return lineItems.map(item => {
            const product = products.find(p => p.id === item.productId);
            if (!product) return item;

            const applicablePromotion = activePromotions.find(p => 
                (p.targetType === 'product' && p.targetValue === product.id) ||
                (p.targetType === 'category' && p.targetValue === product.category)
            );
            
            let discount = 0;
            let promotionName;

            if (applicablePromotion) {
                promotionName = applicablePromotion.name;
                if (applicablePromotion.type === 'percentage') {
                    discount = (item.unitPrice * item.quantity) * (applicablePromotion.value / 100);
                } else {
                    discount = applicablePromotion.value;
                }
            }
            
            const newSubtotal = item.unitPrice * item.quantity;
            const finalSubtotalAfterDiscount = newSubtotal - (discount || 0);
            const newIva = finalSubtotalAfterDiscount * 0.19;
            const newTotal = finalSubtotalAfterDiscount + newIva;

            return { ...item, subtotal: newSubtotal, discount, promotionName, iva: newIva, total: newTotal };
        });
    }, [activePromotions]);
    
    const updateBillItems = useCallback((billId: number, items: InvoiceLineItem[]) => {
        const newItems = applyPromotions(items, appState.products);
        setBills(currentBills => currentBills.map(b => b.id === billId ? {...b, items: newItems} : b));
    }, [applyPromotions, appState.products]);

    const handleAddToCart = useCallback((product: Product) => {
        const existingItem = activeBill.items.find(item => item.productId === product.id);
        let newItems;
        if (existingItem) {
            newItems = activeBill.items.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
        } else {
            newItems = [...activeBill.items, { productId: product.id, productName: product.name, quantity: 1, unitPrice: product.price, subtotal: 0, iva: 0, total: 0, note: '' }];
        }
        updateBillItems(activeBillId, newItems);
        setMobileView('cart');
    }, [activeBill, activeBillId, updateBillItems]);

    const handleUpdateQuantity = useCallback((productId: string, quantity: number) => {
        const newItems = activeBill.items.map(item => item.productId === productId ? { ...item, quantity } : item).filter(item => item.quantity > 0);
        updateBillItems(activeBillId, newItems);
    }, [activeBill, activeBillId, updateBillItems]);

    const handleRemoveFromCart = useCallback((productId: string) => {
        const newItems = activeBill.items.filter(item => item.productId !== productId);
        updateBillItems(activeBillId, newItems);
    }, [activeBill.items, activeBillId, updateBillItems]);

    const handleUpdateCustomer = useCallback((customerId: number) => {
        setBills(bills => bills.map(b => b.id === activeBillId ? {...b, customerId} : b));
    }, [activeBillId]);

    const handleAddBill = () => {
        const newBillId = Date.now();
        const newBill: Bill = { id: newBillId, name: `Cuenta ${nextBillNumber.current++}`, items: [], customerId: 1 };
        setBills(bills => [...bills, newBill]);
        setActiveBillId(newBillId);
    };

    const handleRemoveBill = (billId: number) => {
        if (bills.length === 1) return;
        showConfirmation('Cerrar Cuenta', '¿Estás seguro de que quieres cerrar esta cuenta? Se perderán todos los datos.', () => {
            const billIndex = bills.findIndex(b => b.id === billId);
            const newBills = bills.filter(b => b.id !== billId);
            setBills(newBills);
            if (activeBillId === billId) {
                setActiveBillId(newBills[Math.max(0, billIndex - 1)].id);
            }
        });
    };

    const { subtotal, iva, total, totalDiscount } = useMemo(() => {
        if (!activeBill) return { subtotal: 0, iva: 0, total: 0, totalDiscount: 0 };
        const subtotal = activeBill.items.reduce((sum, item) => sum + item.subtotal, 0);
        const totalDiscount = activeBill.items.reduce((sum, item) => sum + (item.discount || 0), 0);
        const finalSubtotal = subtotal - totalDiscount;
        const iva = finalSubtotal * 0.19;
        const total = finalSubtotal + iva;
        return { subtotal, iva, total, totalDiscount };
    }, [activeBill]);

    const handleCharge = () => {
        if (!activeBill || activeBill.items.length === 0) return;
        setIsPaymentModalOpen(true);
    };

    const handlePaymentSuccess = (paymentMethod: Invoice['paymentMethod']) => {
        const customer = appState.customers.find(c => c.id === activeBill.customerId);
        
        const isPaidImmediately = ['Efectivo', 'Tarjeta de Crédito/Débito', 'PSE', 'Nequi', 'Daviplata'].includes(paymentMethod);

        const newInvoice: Invoice = {
            id: `INV-POS-${Date.now()}`,
            customerId: activeBill.customerId,
            customerName: customer?.name || 'Consumidor Final',
            issueDate: new Date().toISOString().split('T')[0],
            dueDate: new Date().toISOString().split('T')[0],
            status: isPaidImmediately ? 'pagada' : 'pendiente',
            items: activeBill.items,
            subtotal, iva, total, totalDiscount,
            paymentMethod,
            paymentDate: isPaidImmediately ? new Date().toISOString().split('T')[0] : null,
            warehouseId: selectedWarehouseId,
            cashSessionId: activeCashSession?.id
        };
        onSaveInvoice(newInvoice);
        setIsPaymentModalOpen(false);
        setCompletedInvoice(newInvoice);
    };

    const startNewSale = () => {
        const billToRemove = activeBillId;
        const billIndex = bills.findIndex(b => b.id === billToRemove);
        const newBills = bills.filter(b => b.id !== billToRemove);
        
        if (newBills.length > 0) {
            setBills(newBills);
            setActiveBillId(newBills[Math.max(0, billIndex - 1)].id);
        } else {
             const newBillId = Date.now();
             const newBill: Bill = { id: newBillId, name: `Cuenta 1`, items: [], customerId: 1 };
             nextBillNumber.current = 2;
             setBills([newBill]);
             setActiveBillId(newBillId);
        }
        setCompletedInvoice(null);
    };
    
    if (completedInvoice) {
        return (
             <div className="p-8 flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-neutral-900">
                <h2 className="text-2xl font-bold text-green-600 mb-4">¡Venta completada con éxito!</h2>
                <div className="w-full max-w-sm bg-white dark:bg-neutral-800 rounded-lg shadow-lg">
                     <Receipt invoice={completedInvoice} systemSettings={appState.systemSettings} onNewSale={startNewSale} />
                </div>
            </div>
        );
    }
    
    if (!activeCashSession) {
        return (
            <div className="p-8 flex flex-col items-center justify-center h-screen bg-yellow-50 dark:bg-yellow-900/20 text-center">
                <LockClosedIcon className="h-16 w-16 text-yellow-500 mb-4" />
                <h2 className="text-2xl font-bold text-yellow-800 dark:text-yellow-300">Caja Cerrada</h2>
                <p className="mt-2 text-yellow-700 dark:text-yellow-200">Para poder registrar ventas, primero debes abrir una sesión de caja.</p>
                <button
                    onClick={() => onNavigate('cash_drawer_closing')}
                    className="mt-6 px-6 py-3 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors shadow-md"
                >
                    Ir a Gestión de Caja
                </button>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col lg:flex-row h-screen bg-slate-100 dark:bg-neutral-950 font-sans text-sm">
            <div className={`${mobileView === 'catalog' ? 'flex' : 'hidden'} lg:flex w-full lg:w-2/3 flex-col border-r border-slate-200 dark:border-neutral-800`}>
                <header className="p-4 bg-white dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800 flex-shrink-0 flex items-center gap-4">
                     <button onClick={() => setMobileView('cart')} className="lg:hidden p-2 rounded-md hover:bg-slate-200 dark:hover:bg-neutral-700">
                        <BackspaceIcon className="h-6 w-6" />
                    </button>
                     <div className="relative flex-grow">
                        <SearchIcon className="h-5 w-5 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Buscar producto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-neutral-700 rounded-lg bg-slate-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </header>
                <QuickAccessProducts products={productsInWarehouse} onAddToCart={handleAddToCart} />
                <div className="flex-grow flex overflow-hidden">
                    <nav className="w-full sm:w-1/4 p-4 overflow-y-auto bg-slate-50 dark:bg-neutral-900">
                        <h3 className="font-bold mb-3 text-slate-700 dark:text-neutral-300">Categorías</h3>
                        <ul className="space-y-1">
                            {categories.map(cat => (
                                <li key={cat}>
                                    <button onClick={() => setSelectedCategory(cat)} className={`w-full text-left px-3 py-2 rounded-md font-semibold transition-colors ${selectedCategory === cat ? 'bg-primary-500 text-white' : 'text-slate-500 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-neutral-800'}`}>
                                        {cat === 'all' ? 'Todas' : cat}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>
                    <main className="w-full sm:w-3/4 p-3 overflow-y-auto">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                            {filteredProducts.map(product => (
                                <button key={product.id} onClick={() => handleAddToCart(product)} className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-lg text-center shadow-sm hover:shadow-lg hover:ring-2 ring-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all flex flex-col justify-between aspect-[4/5] overflow-hidden group">
                                    <div className="h-1/2 w-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center group-hover:bg-slate-200 dark:group-hover:bg-neutral-700 transition-colors">
                                        <CubeIcon className="h-10 w-10 text-slate-400 dark:text-neutral-600" />
                                    </div>
                                    <div className="p-2 flex-grow flex flex-col justify-center">
                                        <p className="text-xs font-semibold leading-tight">{product.name}</p>
                                    </div>
                                    <div className="p-2 bg-slate-50 dark:bg-neutral-800/50">
                                        <p className="text-sm font-bold text-primary-600 dark:text-primary-400">{formatCurrency(product.price)}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </main>
                </div>
            </div>

            <div className={`${mobileView === 'cart' ? 'flex' : 'hidden'} lg:flex w-full lg:w-1/3 flex-col bg-white dark:bg-neutral-900`}>
                <header className="p-4 border-b border-slate-200 dark:border-neutral-800 flex-shrink-0 flex items-center justify-between gap-4">
                    <CustomerSelect customers={appState.customers} selectedId={activeBill.customerId} onChange={handleUpdateCustomer} onNewCustomer={() => onNavigate('crm_contacts', {action: 'create'})} />
                    <div className="text-right flex-shrink-0 hidden sm:flex items-center gap-2">
                        <BanknotesIcon className="h-8 w-8 text-primary-500/50" />
                        <div>
                            <p className="text-xs text-slate-500 dark:text-neutral-400">Ventas Sesión</p>
                            <p className="font-bold text-lg text-primary-600 dark:text-primary-400">{formatCurrency(sessionSalesTotal)}</p>
                        </div>
                    </div>
                    <button onClick={() => onNavigate('dashboard')} className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-neutral-800">
                        <LockClosedIcon className="h-6 w-6 text-slate-500" />
                    </button>
                </header>
                <div className="p-2 border-b border-slate-200 dark:border-neutral-800 flex-shrink-0">
                    <div className="flex items-center gap-1 overflow-x-auto pb-1">
                        {bills.map(bill => (
                            <div key={bill.id} className="relative">
                                <button onClick={() => setActiveBillId(bill.id)} className={`px-4 py-2 rounded-t-md font-semibold whitespace-nowrap transition-colors ${activeBillId === bill.id ? 'bg-primary-500 text-white' : 'bg-slate-200 dark:bg-neutral-800 hover:bg-slate-300 dark:hover:bg-neutral-700'}`}>
                                    {bill.name}
                                </button>
                                <button onClick={() => handleRemoveBill(bill.id)} className={`absolute -top-1 -right-1 p-0.5 rounded-full bg-slate-400 text-white hover:bg-red-500 transition-colors ${bills.length > 1 ? 'visible' : 'invisible'}`}>
                                    <XMarkIcon className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                        <button onClick={handleAddBill} className="p-2 ml-1 bg-slate-200 dark:bg-neutral-800 rounded-full hover:bg-primary-500 hover:text-white transition-colors">
                            <PlusIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
                <div className="flex-grow p-4 overflow-y-auto space-y-2">
                    <AIPosSuggestions cartItems={activeBill.items} products={appState.products} onAddSuggested={handleAddToCart} />
                    {activeBill.items.length === 0 ? (
                        <div className="text-center text-slate-500 mt-10">
                            <DocumentTextIcon className="h-12 w-12 mx-auto text-slate-300 dark:text-neutral-600" />
                            <p className="mt-2">Agrega productos a esta cuenta</p>
                        </div>
                    ) : (
                        activeBill.items.map(item => (
                            <div key={item.productId} className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-neutral-800 rounded-lg">
                                <div className="flex-grow">
                                    <p className="font-semibold text-sm truncate">{item.productName}</p>
                                    <p className="text-xs text-slate-500">{formatCurrency(item.unitPrice)}</p>
                                </div>
                                <input type="number" value={item.quantity} onChange={e => handleUpdateQuantity(item.productId, parseFloat(e.target.value) || 0)} className="w-14 text-center bg-white dark:bg-neutral-700 border border-slate-300 dark:border-neutral-600 rounded-md py-1" />
                                <p className="font-semibold w-20 text-right">{formatCurrency(item.total)}</p>
                                <button onClick={() => handleRemoveFromCart(item.productId)}><TrashIcon className="h-4 w-4 text-red-400 hover:text-red-600" /></button>
                            </div>
                        ))
                    )}
                </div>
                <footer className="p-4 border-t border-slate-200 dark:border-neutral-800 flex-shrink-0 space-y-3 sticky bottom-0 bg-white dark:bg-neutral-900">
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between"><span className="text-slate-500">Subtotal:</span><span className="font-semibold">{formatCurrency(subtotal)}</span></div>
                        {totalDiscount > 0 && <div className="flex justify-between text-accent-600"><span className="font-semibold">Descuentos:</span><span className="font-semibold">-{formatCurrency(totalDiscount)}</span></div>}
                        <div className="flex justify-between"><span className="text-slate-500">IVA (19%):</span><span className="font-semibold">{formatCurrency(iva)}</span></div>
                        <div className="flex justify-between font-bold text-xl border-t border-dashed pt-2 mt-2"><span >Total:</span><span>{formatCurrency(total)}</span></div>
                    </div>
                     <button 
                        onClick={handleCharge}
                        disabled={!activeBill || activeBill.items.length === 0}
                        className="w-full py-4 bg-primary-600 text-white font-bold text-lg rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
                    >
                        Cobrar {formatCurrency(total)}
                    </button>
                </footer>
            </div>
            
            <button
                onClick={() => setMobileView('catalog')}
                className={`${mobileView === 'cart' ? 'flex' : 'hidden'} lg:hidden fixed bottom-28 right-6 z-10 items-center justify-center w-16 h-16 bg-accent-500 text-white rounded-full shadow-lg hover:bg-accent-600 transition-transform transform active:scale-95`}
            >
                <PlusIcon className="h-8 w-8" />
            </button>


            <PaymentModal 
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                totalAmount={total}
                onPaymentSuccess={handlePaymentSuccess}
            />
        </div>
    );
}

export default POS;