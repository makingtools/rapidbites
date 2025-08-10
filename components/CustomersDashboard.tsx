import React, { useState, useMemo, useCallback } from 'react';
import { Customer, Invoice, View, User, UserProfile } from '../types';
import { UsersIcon, UserPlusIcon, ViewColumnsIcon, SparklesIcon } from './Icons';
import PageHeader from './PageHeader';
import { calculateCustomerScore } from '../services/geminiService';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

interface ContactsHubProps {
    customers: Customer[];
    invoices: Invoice[];
    onNavigate: (view: View, payload?: any) => void;
    onScoreCustomer: (customerId: number, score: number) => void;
    user: User;
    userProfiles: UserProfile[];
}

const ContactsHub: React.FC<ContactsHubProps> = ({ customers, invoices, onNavigate, onScoreCustomer, user, userProfiles }) => {
    const [viewType, setViewType] = useState<'list' | 'kanban'>('list');
    const [loadingScores, setLoadingScores] = useState<number[]>([]);

    const canViewProfile = useMemo(() => {
        const profile = userProfiles.find(p => p.id === user.profileId);
        return profile?.permissions?.customer_profile?.view ?? false;
    }, [user, userProfiles]);

    const handleScoreCustomer = useCallback(async (customer: Customer) => {
        setLoadingScores(prev => [...prev, customer.id]);
        const customerInvoices = invoices.filter(i => i.customerId === customer.id);
        try {
            const result = await calculateCustomerScore(customer, customerInvoices);
            onScoreCustomer(customer.id, result.score);
        } catch (error) {
            console.error("Failed to score customer", error);
        } finally {
            setLoadingScores(prev => prev.filter(id => id !== customer.id));
        }
    }, [invoices, onScoreCustomer]);

    const kanbanColumns: { title: string, tags: string[] }[] = [
        { title: 'Nuevos', tags: ['Nuevo'] },
        { title: 'Calificados', tags: ['Calificado'] },
        { title: 'Clientes Fieles', tags: ['Cliente Fiel', 'VIP'] },
        { title: 'Inactivos', tags: ['Inactivo'] },
    ];
    
    const customersByTag = useMemo(() => {
        const columnsData: Record<string, Customer[]> = {
            'Nuevos': [],
            'Calificados': [],
            'Clientes Fieles': [],
            'Inactivos': [],
            'Otros': []
        };
        customers.forEach(c => {
            const assignedColumn = kanbanColumns.find(col => col.tags.some(t => c.tags?.includes(t)));
            if (assignedColumn) {
                columnsData[assignedColumn.title].push(c);
            } else {
                columnsData['Otros'].push(c);
            }
        });
        return columnsData;
    }, [customers]);

    const actions = (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-neutral-800 p-1 rounded-lg">
                <button onClick={() => setViewType('list')} className={`p-1.5 rounded-md ${viewType === 'list' ? 'bg-white dark:bg-neutral-900 shadow' : 'text-slate-500'}`}><UsersIcon className="h-5 w-5" /></button>
                <button onClick={() => setViewType('kanban')} className={`p-1.5 rounded-md ${viewType === 'kanban' ? 'bg-white dark:bg-neutral-900 shadow' : 'text-slate-500'}`}><ViewColumnsIcon className="h-5 w-5" /></button>
            </div>
             <button onClick={() => onNavigate('crm_contacts', { action: 'create' })} className="flex items-center bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors shadow">
                <UserPlusIcon className="h-5 w-5 mr-2" />
                Nuevo Contacto
            </button>
        </div>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in flex flex-col h-full">
            <PageHeader
                icon={<UsersIcon />}
                title="Hub de Contactos"
                description="Gestiona y segmenta todos los clientes y prospectos de tu negocio."
                actions={actions}
            />
            {viewType === 'list' ? (
                 <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-neutral-800/50">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Nombre</th>
                                    <th className="px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Email</th>
                                    <th className="px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Etiquetas</th>
                                    <th className="px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-300 uppercase text-center">Puntuación IA</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-neutral-800">
                                {customers.map(customer => (
                                    <tr key={customer.id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/40">
                                        <td className="px-6 py-4">
                                            {canViewProfile ? (
                                                <button onClick={() => onNavigate('customer_profile', customer.id)} className="font-medium text-primary-600 hover:underline">{customer.name}</button>
                                            ) : (
                                                <span className="font-medium text-slate-800 dark:text-slate-200">{customer.name}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">{customer.email}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {customer.tags?.map(tag => <span key={tag} className="px-2 py-0.5 text-xs font-semibold bg-primary-100 text-primary-800 rounded-full">{tag}</span>)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-lg">{customer.customerScore ?? '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto">
                    {[...kanbanColumns, { title: 'Otros', tags: [] }].map(col => (
                        <div key={col.title} className="bg-slate-100 dark:bg-neutral-900/50 rounded-lg p-3 flex flex-col min-w-[280px]">
                            <h3 className="font-bold text-slate-800 dark:text-white pb-2 mb-3 border-b-2 border-primary-500">{col.title} ({customersByTag[col.title]?.length || 0})</h3>
                            <div className="space-y-3 overflow-y-auto h-full pr-1">
                                {customersByTag[col.title]?.map(customer => (
                                    <div key={customer.id} className="bg-white dark:bg-neutral-800 rounded-md p-3 shadow-sm">
                                        <div className="flex justify-between items-start">
                                            {canViewProfile ? (
                                                <button onClick={() => onNavigate('customer_profile', customer.id)} className="font-semibold text-sm hover:underline text-left">{customer.name}</button>
                                            ) : (
                                                <span className="font-semibold text-sm text-left">{customer.name}</span>
                                            )}
                                            <div className={`text-xl font-bold ${customer.customerScore && customer.customerScore > 75 ? 'text-green-500' : 'text-slate-700 dark:text-slate-200'}`}>
                                                {customer.customerScore}
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500">{customer.contact}</p>
                                        <button 
                                            onClick={() => handleScoreCustomer(customer)} 
                                            disabled={loadingScores.includes(customer.id)}
                                            className="mt-2 w-full flex items-center justify-center gap-2 text-xs font-semibold p-1 bg-slate-100 dark:bg-neutral-700 rounded hover:bg-slate-200 dark:hover:bg-neutral-600 disabled:opacity-50"
                                        >
                                            <SparklesIcon className={`h-4 w-4 text-accent ${loadingScores.includes(customer.id) ? 'animate-spin' : ''}`} />
                                            {loadingScores.includes(customer.id) ? 'Analizando...' : 'Calificar con IA'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ContactsHub;