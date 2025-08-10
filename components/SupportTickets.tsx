import React, { useState, useMemo, useCallback } from 'react';
import { AppDataState, SupportTicket, User } from '../types';
import { ClipboardDocumentListIcon, PlusIcon, SparklesIcon, ClockIcon } from './Icons';
import PageHeader from './PageHeader';
import Modal from './Modal';
import { suggestTicketPriorityAndAgent } from '../services/geminiService';

type TicketStatus = SupportTicket['status'];

interface SupportTicketsProps {
    appState: AppDataState;
    onSaveTicket: (ticket: SupportTicket) => void;
}

const NewTicketForm: React.FC<{
    customers: AppDataState['customers'];
    agents: User[];
    onSave: (ticket: SupportTicket) => void;
    onCancel: () => void;
}> = ({ customers, agents, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Partial<SupportTicket>>({
        customerId: customers[0]?.id,
        status: 'Nuevo',
        priority: 'Media',
        agentId: agents[0]?.id
    });
    const [isSuggesting, setIsSuggesting] = useState(false);

    const handleAISuggestions = useCallback(async () => {
        if (!formData.subject && !formData.description) return;
        setIsSuggesting(true);
        try {
            const suggestion = await suggestTicketPriorityAndAgent(formData, agents);
            setFormData(prev => ({ ...prev, priority: suggestion.priority, agentId: suggestion.agentId }));
        } catch (e) {
            console.error(e);
        } finally {
            setIsSuggesting(false);
        }
    }, [formData.subject, formData.description, agents]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const customer = customers.find(c => c.id === formData.customerId);
        const finalTicket: SupportTicket = {
            ...formData,
            id: `TKT-${Date.now()}`,
            customerName: customer?.name,
            createdAt: new Date().toISOString(),
        } as SupportTicket;
        onSave(finalTicket);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium">Cliente</label>
                <select value={formData.customerId} onChange={e => setFormData(p => ({...p, customerId: Number(e.target.value)}))} className="mt-1 w-full p-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700">
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
             <div>
                <label className="block text-sm font-medium">Asunto</label>
                <input type="text" value={formData.subject || ''} onBlur={handleAISuggestions} onChange={e => setFormData(p => ({...p, subject: e.target.value}))} className="mt-1 w-full p-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700" required />
            </div>
             <div>
                <label className="block text-sm font-medium">Descripción</label>
                <textarea value={formData.description || ''} onBlur={handleAISuggestions} onChange={e => setFormData(p => ({...p, description: e.target.value}))} rows={4} className="mt-1 w-full p-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium">Prioridad {isSuggesting ? '(IA...)' : ''}</label>
                     <select value={formData.priority} onChange={e => setFormData(p => ({...p, priority: e.target.value as any}))} className="mt-1 w-full p-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700">
                        <option>Baja</option>
                        <option>Media</option>
                        <option>Alta</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium">Agente Asignado {isSuggesting ? '(IA...)' : ''}</label>
                     <select value={formData.agentId} onChange={e => setFormData(p => ({...p, agentId: e.target.value}))} className="mt-1 w-full p-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700">
                        {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                </div>
            </div>
            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 dark:bg-neutral-700 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg">Crear Ticket</button>
            </div>
        </form>
    );
};


const SupportTickets: React.FC<SupportTicketsProps> = ({ appState, onSaveTicket }) => {
    const { supportTickets, users } = appState;
    const [draggedTicket, setDraggedTicket] = useState<SupportTicket | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const agents = useMemo(() => users.filter(u => u.profileId === 'UP-VENDEDOR' || u.profileId === 'UP-SUPERADMIN'), [users]);

    const ticketsByStatus = useMemo(() => {
        const columns: Record<TicketStatus, SupportTicket[]> = { 'Nuevo': [], 'Abierto': [], 'Resuelto': [] };
        supportTickets.forEach(ticket => {
            if (columns[ticket.status]) {
                columns[ticket.status].push(ticket);
            }
        });
        return columns;
    }, [supportTickets]);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, ticket: SupportTicket) => {
        setDraggedTicket(ticket);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnd = () => setDraggedTicket(null);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, status: TicketStatus) => {
        e.preventDefault();
        if (draggedTicket && draggedTicket.status !== status) {
            onSaveTicket({ ...draggedTicket, status });
        }
        setDraggedTicket(null);
    };
    
    const isSlaBreached = (ticket: SupportTicket): boolean => {
        if (ticket.status === 'Resuelto') return false;
        
        const slaHours = { 'Alta': 4, 'Media': 24, 'Baja': 72 };
        const slaMilliseconds = slaHours[ticket.priority] * 60 * 60 * 1000;
        const ticketAge = Date.now() - new Date(ticket.createdAt).getTime();
        
        return ticketAge > slaMilliseconds;
    };

    const priorityStyles = {
        'Alta': 'border-red-500 bg-red-50 dark:bg-red-900/20',
        'Media': 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
        'Baja': 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
    }

    const columns: { id: TicketStatus, title: string }[] = [
        { id: 'Nuevo', title: 'Nuevos Tickets' },
        { id: 'Abierto', title: 'En Proceso' },
        { id: 'Resuelto', title: 'Resueltos' }
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in h-full flex flex-col">
            <PageHeader
                icon={<ClipboardDocumentListIcon />}
                title="Gestión de Tickets de Soporte"
                description="Organiza y resuelve las solicitudes de tus clientes de manera eficiente."
                actions={<button onClick={() => setIsModalOpen(true)} className="flex items-center bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 transition shadow"><PlusIcon className="h-5 w-5 mr-2"/>Nuevo Ticket</button>}
            />
            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4 overflow-x-auto">
                {columns.map(col => (
                    <div 
                        key={col.id} 
                        className="bg-slate-100 dark:bg-neutral-900/50 rounded-lg p-3 flex flex-col min-w-[300px]"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, col.id)}
                    >
                        <h3 className="font-bold text-slate-800 dark:text-white pb-2 mb-3 border-b-2 border-primary-500">{col.title} ({ticketsByStatus[col.id].length})</h3>
                        <div className="space-y-3 overflow-y-auto h-full pr-1">
                            {ticketsByStatus[col.id].map(ticket => {
                                const slaBreached = isSlaBreached(ticket);
                                return (
                                <div
                                    key={ticket.id}
                                    draggable
                                    onDragStart={e => handleDragStart(e, ticket)}
                                    onDragEnd={handleDragEnd}
                                    className={`bg-white dark:bg-neutral-800 rounded-md p-3 shadow-sm cursor-grab active:cursor-grabbing border-l-4 ${priorityStyles[ticket.priority]}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <p className="font-semibold text-sm pr-2">{ticket.subject}</p>
                                        {slaBreached && (
                                            <div className="flex-shrink-0 flex items-center gap-1 text-red-500" title="SLA Vencido">
                                                <ClockIcon className="h-4 w-4" />
                                                <span className="text-xs font-bold">VENCIDO</span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{ticket.customerName} - {ticket.id}</p>
                                    <div className="flex justify-between items-center mt-3 text-xs">
                                        <span>{agents.find(a => a.id === ticket.agentId)?.name || 'Sin asignar'}</span>
                                        <span className="font-semibold">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            )})}
                        </div>
                    </div>
                ))}
            </div>
            
            {isModalOpen && (
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Crear Nuevo Ticket de Soporte">
                    <NewTicketForm 
                        customers={appState.customers} 
                        agents={agents}
                        onSave={(ticket) => { onSaveTicket(ticket); setIsModalOpen(false); }}
                        onCancel={() => setIsModalOpen(false)}
                    />
                </Modal>
            )}
        </div>
    );
};

export default SupportTickets;
