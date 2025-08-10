import React, { useState, useEffect, Suspense, lazy } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { WASH_DATA, TOTAL_WASHES, ALERTS, BrandIcon, ShowerIcon, HomeIcon, UsersIcon, CalendarDaysIcon, ChartBarIcon, Cog6ToothIcon, ArrowLeftOnRectangleIcon, GoogleDriveIcon, GoogleSheetsIcon, GoogleCalendarIcon, SERVICES, DocumentTextIcon, BanknotesIcon, TruckIcon, ReceiptPercentIcon, ArchiveBoxIcon, UserGroupIcon, ChevronDownIcon, ChatBubbleOvalLeftEllipsisIcon, MegaphoneIcon, RocketLaunchIcon } from '../constants';
import * as db from '../data/mockDB';
import * as googleAuth from '../googleAuthService';
import { useI18n, Translations } from '../i18n';
import { Client, Pet, MedicalRecord, Appointment, PaymentMethod, VoiceOption, GoogleUser, CommunicationEntry, AppointmentCreationData, DashboardView, Lead, ServicePopularity, TopClient, PeakHour, Provider, Expense, InventoryItem, DashboardUser, Promotion } from '../types';
import PetCareAssistant from '../components/PetCareAssistant';
import { AppActions } from '../types';

// --- Reusable Components ---
const MetricCard = React.memo(({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: 'green' | 'cyan' | 'indigo' | 'rose' }) => {
    const colorMap = {
      green: { bg: 'bg-green-100', text: 'text-green-600' },
      cyan: { bg: 'bg-cyan-100', text: 'text-cyan-600' },
      indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
      rose: { bg: 'bg-rose-100', text: 'text-rose-600' },
    };
    const selectedColor = colorMap[color];

    return (
        <div className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4 transition-transform transform hover:scale-105">
            <div className={`p-3 rounded-full ${selectedColor.bg} ${selectedColor.text}`}>{icon}</div>
            <div>
                <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
                <p className="text-2xl font-bold text-slate-800">{value}</p>
            </div>
        </div>
    );
});

const Modal: React.FC<{ children: React.ReactNode; onClose: () => void; title: string; size?: 'lg'|'xl'|'2xl'|'md' }> = ({ children, onClose, title, size = 'lg' }) => {
    const sizeMap = { 'md': 'max-w-md', 'lg': 'max-w-lg', 'xl': 'max-w-xl', '2xl': 'max-w-2xl' };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[110] p-4 animate-fade-in" onClick={onClose}>
            <div className={`bg-slate-50 rounded-2xl shadow-2xl w-full ${sizeMap[size]} flex flex-col animate-pop-in`} onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-slate-200 bg-white rounded-t-2xl sticky top-0">
                    <h3 className="text-xl font-bold text-slate-800">{title}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
                        <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                <main className="p-6 overflow-y-auto max-h-[80vh]">{children}</main>
            </div>
        </div>
    );
}

const SkeletonLoader = () => (
    <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="h-24 bg-slate-200 rounded-xl"></div>
            <div className="h-24 bg-slate-200 rounded-xl"></div>
            <div className="h-24 bg-slate-200 rounded-xl"></div>
            <div className="h-24 bg-slate-200 rounded-xl"></div>
        </div>
        <div className="h-80 bg-slate-200 rounded-xl"></div>
    </div>
);


// --- Dashboard Views ---

const SummaryView: React.FC = () => {
    const { t } = useI18n();
    const [googleUser, setGoogleUser] = useState<GoogleUser | null>(googleAuth.getCurrentUser());
    const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
    const [unsyncedCount, setUnsyncedCount] = useState(0);
    const [syncMessage, setSyncMessage] = useState('');
    const [leadsCount, setLeadsCount] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);

    const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

    useEffect(() => {
        const fetchData = async () => {
            const unsynced = await db.getUnsyncedAppointments();
            setUnsyncedCount(unsynced.length);

            const allLeads = await db.getLeads();
            setLeadsCount(allLeads.filter(l => l.status === 'new').length);
            
            const analytics = await db.getAnalyticsData();
            setTotalRevenue(analytics.totalRevenue);
        };
        fetchData();
    }, []);

    const handleGoogleConnect = () => setIsGoogleModalOpen(true);
    const handleSignIn = () => { setGoogleUser(googleAuth.signIn()); setIsGoogleModalOpen(false); }
    const handleGoogleDisconnect = () => { googleAuth.signOut(); setGoogleUser(null); };

    const runGoogleAction = async (
        action: (onProgress: (messageKey: keyof Translations) => void) => Promise<{ message: string }>
    ) => {
        if (syncMessage) return; // Prevent multiple clicks

        const handleProgress = (messageKey: keyof Translations) => {
            setSyncMessage(t(messageKey));
        };

        try {
            // Set a generic "in progress" message if needed, e.g., t('dashboard.google.syncing')
            // handleProgress('dashboard.google.syncing'); 
            const result = await action(handleProgress);
            setSyncMessage(result.message); // Set final success message

            if (action === googleAuth.syncCalendar) {
                const updatedUnsynced = await db.getUnsyncedAppointments();
                setUnsyncedCount(updatedUnsynced.length);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            console.error("Google Action failed:", error);
            setSyncMessage(errorMessage);
        } finally {
            setTimeout(() => setSyncMessage(''), 5000);
        }
    };

    return (
        <>
            {isGoogleModalOpen && <Modal onClose={() => setIsGoogleModalOpen(false)} title={t('google_popup.title')} size="md">
                <div className="text-center">
                    <p className="text-slate-600 mb-6">{t('google_popup.subtitle')}</p>
                    <div onClick={handleSignIn} className="flex items-center space-x-4 p-3 border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors">
                        <img src={googleAuth.getMockUser().picture} alt="Google User" className="w-10 h-10 rounded-full" />
                        <div className="text-left">
                            <p className="font-semibold text-slate-800">{googleAuth.getMockUser().name}</p>
                            <p className="text-sm text-slate-500">{googleAuth.getMockUser().email}</p>
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-6">{t('google_popup.footer')}</p>
                </div>
            </Modal>}
            <h1 className="text-3xl font-bold text-slate-800 mb-6">{t('dashboard.summary.title')}</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard title={t('dashboard.summary.revenue')} value={formatCurrency(totalRevenue)} color="green" icon={<BanknotesIcon className="h-6 w-6" />} />
                <MetricCard title={t('dashboard.summary.washes')} value={TOTAL_WASHES} color="cyan" icon={<ShowerIcon className="h-6 w-6" />} />
                <MetricCard title={t('dashboard.summary.new_leads')} value={leadsCount} color="indigo" icon={<DocumentTextIcon className="h-6 w-6" />} />
                <MetricCard title={t('dashboard.summary.alerts')} value={ALERTS} color="rose" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-md">
                    <h3 className="font-semibold text-slate-700 mb-4">{t('dashboard.summary.washes')}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={WASH_DATA} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="day" tick={{fontSize: 12}} />
                            <YAxis />
                            <Tooltip wrapperClassName="!bg-white !border-slate-200 !rounded-lg !shadow-lg" />
                            <Bar dataKey="lavados" >
                                {WASH_DATA.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#14b8a6' : '#06b6d4'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                    <h3 className="font-semibold text-slate-700 mb-4">{t('dashboard.google.title')}</h3>
                    {googleUser ? (
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                                <img src={googleUser.picture} alt="Google User" className="w-10 h-10 rounded-full" />
                                <div>
                                    <p className="font-semibold text-slate-800">{googleUser.name}</p>
                                    <p className="text-sm text-slate-500">{googleUser.email}</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <button onClick={() => runGoogleAction(googleAuth.syncCalendar)} disabled={unsyncedCount === 0 || !!syncMessage} className="w-full flex items-center justify-center space-x-2 bg-blue-500 text-white font-semibold py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300">
                                    <GoogleCalendarIcon className="w-5 h-5" />
                                    <span>{t('dashboard.google.sync_calendar')} ({unsyncedCount})</span>
                                </button>
                                <button onClick={() => runGoogleAction(googleAuth.backupToDrive)} disabled={!!syncMessage} className="w-full flex items-center justify-center space-x-2 bg-green-500 text-white font-semibold py-2 rounded-lg hover:bg-green-600 transition-colors disabled:bg-green-300">
                                    <GoogleDriveIcon className="w-5 h-5" />
                                    <span>{t('dashboard.google.backup_drive')}</span>
                                </button>
                                <button onClick={() => runGoogleAction(googleAuth.exportToSheets)} disabled={!!syncMessage} className="w-full flex items-center justify-center space-x-2 bg-emerald-500 text-white font-semibold py-2 rounded-lg hover:bg-emerald-600 transition-colors disabled:bg-emerald-300">
                                    <GoogleSheetsIcon className="w-5 h-5" />
                                    <span>{t('dashboard.google.export_sheets')}</span>
                                </button>
                            </div>
                            {syncMessage && <p className="text-sm text-center text-slate-600 mt-2">{syncMessage}</p>}
                            <button onClick={handleGoogleDisconnect} className="w-full text-sm text-rose-600 hover:underline mt-2">{t('dashboard.google.disconnect')}</button>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-slate-600 mb-4">{t('dashboard.google.connect_prompt')}</p>
                            <button onClick={handleGoogleConnect} className="bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-800 transition-colors">
                                {t('dashboard.google.connect_button')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

const NewAppointmentModal: React.FC<{ client: Client, onClose: () => void, onAppointmentBooked: () => void }> = ({ client, onClose, onAppointmentBooked }) => {
    const { t } = useI18n();
    const today = new Date().toISOString().split('T')[0];
    const [formData, setFormData] = useState({ service: SERVICES[0].titleKey, date: today, time: '09:00' });
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const serviceName = t(formData.service as keyof Translations);
        const result = await db.addAppointment({ name: client.name, petName: client.pet.name, service: serviceName, address: client.address, phone: client.phone, date: formData.date, time: formData.time });
        if ('confirmation' in result) { onAppointmentBooked(); onClose(); } else { alert(`Error: ${result.error}`); }
    };

    return (
        <Modal onClose={onClose} title={`${t('dashboard.clients.new_appointment_title')} ${client.pet.name}`} size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="service" className="block text-sm font-medium text-slate-700">{t('dashboard.clients.form_service')}</label>
                    <select id="service" name="service" value={formData.service} onChange={handleInputChange} className="mt-1 w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none">
                        {SERVICES.map(s => <option key={s.titleKey} value={s.titleKey}>{t(s.titleKey as keyof Translations)}</option>)}
                    </select>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-slate-700">{t('dashboard.clients.form_date')}</label>
                        <input type="date" id="date" name="date" value={formData.date} min={today} onChange={handleInputChange} className="mt-1 w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"/>
                    </div>
                    <div>
                        <label htmlFor="time" className="block text-sm font-medium text-slate-700">{t('dashboard.clients.form_time')}</label>
                        <input type="time" id="time" name="time" value={formData.time} step="1800" onChange={handleInputChange} className="mt-1 w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"/>
                    </div>
                </div>
                <div className="pt-4 flex justify-end">
                     <button type="submit" className="bg-indigo-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                        {t('dashboard.clients.book_button')}
                     </button>
                </div>
            </form>
        </Modal>
    );
};

const ClientsView: React.FC = () => {
    const { t } = useI18n();
    const [clients, setClients] = useState<Client[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
    const [newNote, setNewNote] = useState('');
    const [filter, setFilter] = useState<'all' | 'recent' | 'loyal' | 'at_risk'>('all');

    useEffect(() => {
        db.getClients().then(setClients);
        db.getAppointments().then(setAppointments);
    }, []);

    const refreshData = async () => {
        const updatedClient = selectedClient ? await db.getClientById(selectedClient.id) : null;
        if(updatedClient) setSelectedClient(updatedClient);
        const allAppointments = await db.getAppointments();
        setAppointments(allAppointments);
    }

    const handleAddNote = async () => {
        if (newNote.trim() && selectedClient) {
            await db.addCommunicationNote(selectedClient.id, newNote);
            setNewNote('');
            refreshData();
        }
    };
    
    const filteredClients = clients.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.pet.name.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;
        switch(filter) {
            case 'recent': return new Date().getTime() - new Date(c.memberSince).getTime() < 30 * 24 * 60 * 60 * 1000;
            case 'loyal': return appointments.filter(a => a.clientId === c.id && a.status === 'completed').length > 1;
            case 'at_risk':
                const clientApps = appointments.filter(a => a.clientId === c.id && a.status === 'completed');
                if (clientApps.length === 0) return false;
                const lastAppDate = new Date(clientApps.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date);
                return new Date().getTime() - lastAppDate.getTime() > 60 * 24 * 60 * 60 * 1000;
            default: return true;
        }
    });

    return (
        <>
            <h1 className="text-3xl font-bold text-slate-800 mb-6">{t('dashboard.clients.title')}</h1>
            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                     <input type="text" placeholder={t('dashboard.clients.search_placeholder')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"/>
                    <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-full">
                        {(['all', 'recent', 'loyal', 'at_risk'] as const).map(f => (
                            <button key={f} onClick={() => setFilter(f)} className={`w-full px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${filter === f ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}>
                                {t(`dashboard.clients.filter_${f}` as keyof Translations)}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-600 text-sm font-semibold">
                            <tr>
                                <th className="p-3">{t('dashboard.clients.table_client')}</th><th className="p-3">{t('dashboard.clients.table_pet')}</th><th className="p-3">{t('dashboard.clients.table_contact')}</th><th className="p-3">{t('dashboard.clients.table_member_since')}</th><th className="p-3 text-center">{t('dashboard.clients.table_actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClients.map(client => (
                                <tr key={client.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="p-3 font-medium text-slate-800">{client.name}</td><td className="p-3">{client.pet.name} ({client.pet.breed})</td><td className="p-3">{client.email}</td><td className="p-3">{client.memberSince}</td>
                                    <td className="p-3 text-center">
                                        <button onClick={() => setSelectedClient(client)} className="bg-indigo-100 text-indigo-700 text-xs font-bold py-1 px-3 rounded-full hover:bg-indigo-200 transition-colors">
                                            {t('dashboard.clients.view_details_button')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {selectedClient && (
                <Modal onClose={() => setSelectedClient(null)} title={`${t('dashboard.clients.pet_sheet_for')} ${selectedClient.pet.name}`} size="2xl">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 text-center">
                            <img src={selectedClient.pet.avatarUrl} alt={selectedClient.pet.name} className="w-32 h-32 rounded-full mx-auto shadow-lg mb-4"/>
                            <h3 className="text-2xl font-bold text-slate-800">{selectedClient.pet.name}</h3>
                            <p className="text-slate-500">{selectedClient.pet.breed}</p>
                            <div className="mt-4 text-sm text-left bg-slate-100 p-3 rounded-lg space-y-1">
                                <p><strong>{t('dashboard.clients.age')}:</strong> {selectedClient.pet.age} {t('dashboard.clients.years')}</p>
                                <p><strong>{t('dashboard.clients.weight')}:</strong> {selectedClient.pet.weight} kg</p>
                                <p><strong>{t('dashboard.clients.owner')}:</strong> {selectedClient.name}</p>
                            </div>
                            <button onClick={() => setIsAppointmentModalOpen(true)} className="mt-4 w-full bg-indigo-600 text-white font-semibold py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                               {t('dashboard.clients.add_appointment_button')}
                            </button>
                        </div>
                        <div className="lg:col-span-2 space-y-4">
                            <div>
                                 <h4 className="text-lg font-bold text-slate-700 mb-2 border-b pb-1">{t('dashboard.clients.communication_log')}</h4>
                                 <div className="space-y-2 text-sm max-h-32 overflow-y-auto pr-2 mb-2">
                                    {selectedClient.communicationLog.length > 0 ? selectedClient.communicationLog.map(note => (
                                        <div key={note.id} className="p-2 bg-slate-100 rounded-md">
                                            <p className="text-slate-800">{note.text}</p>
                                            <p className="text-xs text-slate-400 text-right">{new Date(note.date).toLocaleString()}</p>
                                        </div>
                                    )) : <p className="text-slate-500 italic text-center py-4">No notes yet.</p>}
                                </div>
                                <div className="flex space-x-2">
                                    <input type="text" value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder={t('dashboard.clients.add_note_placeholder')} className="w-full p-2 text-sm rounded-md border border-slate-300"/>
                                    <button onClick={handleAddNote} className="bg-slate-700 text-white font-semibold px-4 rounded-lg hover:bg-slate-800 transition-colors">{t('dashboard.clients.add_note_button')}</button>
                                </div>
                            </div>
                             <div>
                                <h4 className="text-lg font-bold text-slate-700 mb-2 border-b pb-1">{t('dashboard.clients.medical_history')}</h4>
                                <ul className="space-y-2 text-sm max-h-24 overflow-y-auto pr-2">
                                    {selectedClient.pet.medicalHistory.map((record, i) => (<li key={i} className="flex justify-between p-2 bg-slate-100 rounded-md"><span>{record.description}</span><span className="text-slate-500">{record.date}</span></li>))}
                                </ul>
                            </div>
                             <div>
                                <h4 className="text-lg font-bold text-slate-700 mb-2 mt-4 border-b pb-1">{t('dashboard.clients.vaccine_reminders')}</h4>
                                <ul className="space-y-2 text-sm">
                                    {selectedClient.pet.vaccineReminders.map((reminder, i) => (<li key={i} className="p-2 bg-amber-100 text-amber-800 rounded-md">{reminder}</li>))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
            {isAppointmentModalOpen && selectedClient && <NewAppointmentModal client={selectedClient} onClose={() => setIsAppointmentModalOpen(false)} onAppointmentBooked={refreshData} />}
        </>
    );
};

const AppointmentsView: React.FC = () => {
    const { t } = useI18n();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [filter, setFilter] = useState<'all' | Appointment['status']>('all');

    const fetchData = async () => {
        db.getAppointments().then(setAppointments);
        db.getClients().then(setClients);
    }
    useEffect(() => { fetchData(); }, []);

    const handleConfirmPayment = async (appId: string) => {
        await db.updateAppointmentPaymentStatus(appId, 'paid');
        fetchData();
    }

    const getClientName = (clientId: string) => clients.find(c => c.id === clientId)?.name || 'N/A';
    const filteredAppointments = appointments.filter(a => filter === 'all' || a.status === filter);
    const statusClasses: {[key in Appointment['status']]: string} = { confirmed: 'bg-blue-100 text-blue-800', completed: 'bg-green-100 text-green-800', canceled: 'bg-rose-100 text-rose-800' }
    const paymentStatusClasses: {[key in Appointment['paymentStatus']]: string} = { paid: 'bg-green-100 text-green-800', pending: 'bg-amber-100 text-amber-800' }

    return (
        <>
            <h1 className="text-3xl font-bold text-slate-800 mb-6">{t('dashboard.appointments.title')}</h1>
            <div className="bg-white p-6 rounded-xl shadow-md">
                 <div className="flex space-x-2 mb-4">
                    {(['all', 'confirmed', 'completed', 'canceled'] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${filter === f ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
                            {t(`dashboard.appointments.filter_${f}` as keyof Translations)}
                        </button>
                    ))}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-600 text-sm font-semibold">
                            <tr>
                                <th className="p-3">{t('dashboard.appointments.table_date')}</th><th className="p-3">{t('dashboard.appointments.table_client')} / {t('dashboard.clients.table_pet')}</th><th className="p-3">{t('dashboard.appointments.table_service')}</th><th className="p-3 text-center">{t('dashboard.appointments.table_status')}</th><th className="p-3 text-center">{t('dashboard.appointments.table_payment')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAppointments.map(app => (
                                <tr key={app.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="p-3 font-medium text-slate-800">{app.date} @ {app.time}</td>
                                    <td className="p-3">{getClientName(app.clientId)} / {app.petName}</td>
                                    <td className="p-3">{app.service}</td>
                                    <td className="p-3 text-center"><span className={`px-3 py-1 rounded-full text-xs font-bold ${statusClasses[app.status]}`}>{t(`dashboard.appointments.status_${app.status}` as keyof Translations)}</span></td>
                                    <td className="p-3 text-center">
                                        {app.status === 'completed' && app.paymentStatus === 'pending' ? (
                                            <button onClick={() => handleConfirmPayment(app.id)} className="bg-emerald-500 text-white text-xs font-bold py-1 px-3 rounded-full hover:bg-emerald-600 transition-colors">
                                                {t('dashboard.appointments.confirm_payment')}
                                            </button>
                                        ) : (
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${paymentStatusClasses[app.paymentStatus]}`}>{t(`dashboard.appointments.payment_status_${app.paymentStatus}` as keyof Translations)}</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

const LeadsView: React.FC = () => {
    const { t } = useI18n();
    const [leads, setLeads] = useState<Lead[]>([]);
    useEffect(() => { db.getLeads().then(setLeads); }, []);
    const handleStatusChange = async (leadId: string, newStatus: Lead['status']) => {
        await db.updateLeadStatus(leadId, newStatus);
        const updatedLeads = await db.getLeads(); setLeads(updatedLeads);
    };
    const statusClasses: {[key in Lead['status']]: string} = { new: 'bg-blue-100 text-blue-800', contacted: 'bg-amber-100 text-amber-800', converted: 'bg-green-100 text-green-800' };
    const statusOptions: Lead['status'][] = ['new', 'contacted', 'converted'];

    return (
        <>
            <h1 className="text-3xl font-bold text-slate-800 mb-6">{t('dashboard.leads.title')}</h1>
            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-600 text-sm font-semibold">
                            <tr>
                                <th className="p-3">{t('dashboard.leads.table_lead')}</th><th className="p-3">{t('dashboard.leads.table_message')}</th><th className="p-3">{t('dashboard.leads.table_date')}</th><th className="p-3 text-center">{t('dashboard.leads.table_status')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leads.map(lead => (
                                <tr key={lead.id} className="border-b border-slate-100">
                                    <td className="p-3 align-top"><p className="font-medium text-slate-800">{lead.name}</p><p className="text-sm text-slate-500">{lead.email}</p><p className="text-sm text-slate-500">{lead.phone}</p></td>
                                    <td className="p-3 max-w-sm align-top"><p className="text-sm text-slate-600">{lead.message}</p></td>
                                    <td className="p-3 text-sm align-top">{new Date(lead.capturedAt).toLocaleDateString()}</td>
                                    <td className="p-3 text-center align-top">
                                        <select value={lead.status} onChange={(e) => handleStatusChange(lead.id, e.target.value as Lead['status'])} className={`px-3 py-1 rounded-full text-xs font-bold border-none outline-none appearance-none ${statusClasses[lead.status]} cursor-pointer`}>
                                            {statusOptions.map(status => (<option key={status} value={status} className="bg-white text-black">{t(`dashboard.leads.status_${status}` as keyof Translations)}</option>))}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

const AnalyticsView: React.FC = () => {
    const { t } = useI18n();
    const [data, setData] = useState<{ servicePopularity: ServicePopularity[]; topClients: TopClient[]; peakHours: PeakHour[]; } | null>(null);
    useEffect(() => { db.getAnalyticsData().then(setData); }, []);
    const formatCurrency = (v: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v);
    const PIE_COLORS = ['#818cf8', '#38bdf8', '#fb7185', '#4ade80', '#facc15'];

    if (!data) return <SkeletonLoader />;

    return (
        <>
            <h1 className="text-3xl font-bold text-slate-800 mb-6">{t('dashboard.analytics.title')}</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md xl:col-span-1">
                    <h3 className="font-semibold text-slate-700 mb-4">{t('dashboard.analytics.service_popularity')}</h3>
                    <ResponsiveContainer width="100%" height={300}><PieChart><Pie data={data.servicePopularity} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>{data.servicePopularity.map((e, i) => (<Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />))}</Pie><Tooltip formatter={(v) => [`${v} lavados`, 'Total']} /><Legend /></PieChart></ResponsiveContainer>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md xl:col-span-2">
                    <h3 className="font-semibold text-slate-700 mb-4">{t('dashboard.analytics.top_clients')}</h3>
                    <ResponsiveContainer width="100%" height={300}><BarChart data={data.topClients} layout="vertical" margin={{ right: 30, left: 30 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tickFormatter={formatCurrency} /><YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} /><Tooltip formatter={(v: number) => [formatCurrency(v), 'Ingresos']} wrapperClassName="!bg-white !border-slate-200 !rounded-lg !shadow-lg"/><Bar dataKey="revenue" fill="#818cf8" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>
                </div>
                 <div className="bg-white p-6 rounded-xl shadow-md lg:col-span-2 xl:col-span-3">
                    <h3 className="font-semibold text-slate-700 mb-4">{t('dashboard.analytics.peak_hours')}</h3>
                     <ResponsiveContainer width="100%" height={300}><LineChart data={data.peakHours}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="hour" /><YAxis allowDecimals={false} /><Tooltip formatter={(v) => [`${v} citas`, 'Total']} wrapperClassName="!bg-white !border-slate-200 !rounded-lg !shadow-lg"/><Line type="monotone" dataKey="appointments" stroke="#38bdf8" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} /></LineChart></ResponsiveContainer>
                 </div>
            </div>
        </>
    );
};

const MarketingView: React.FC = () => {
    const { t } = useI18n();
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [formData, setFormData] = useState({ title: '', description: '', discount: 20 });
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState('');

    useEffect(() => {
        db.getPromotions().then(setPromotions);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(p => ({ ...p, [name]: name === 'discount' ? parseInt(value) || 0 : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.description || formData.discount <= 0) {
            setFeedback('Por favor completa todos los campos.');
            return;
        }
        setIsLoading(true);
        setFeedback(t('dashboard.marketing.sending'));
        try {
            const result = await db.createAndSendPromotion(formData);
            setFeedback(result.confirmation);
            const updatedPromos = await db.getPromotions();
            setPromotions(updatedPromos);
            setFormData({ title: '', description: '', discount: 20 }); // Reset form
        } catch (error) {
            setFeedback('Error al enviar la promoción.');
            console.error(error);
        } finally {
            setIsLoading(false);
            setTimeout(() => setFeedback(''), 5000); // Clear feedback after 5s
        }
    };

    return (
        <>
            <h1 className="text-3xl font-bold text-slate-800 mb-6">{t('dashboard.marketing.title')}</h1>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Form Column */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <h2 className="text-xl font-bold text-slate-800 mb-2">{t('dashboard.marketing.form_title')}</h2>
                        <p className="text-sm text-slate-600 mb-6">{t('dashboard.marketing.form_desc')}</p>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-slate-700">{t('dashboard.marketing.promo_title')}</label>
                                <input type="text" name="title" id="title" value={formData.title} onChange={handleInputChange} required className="mt-1 w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-slate-700">{t('dashboard.marketing.promo_desc')}</label>
                                <textarea name="description" id="description" value={formData.description} onChange={handleInputChange} required rows={4} className="mt-1 w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"></textarea>
                            </div>
                            <div>
                                <label htmlFor="discount" className="block text-sm font-medium text-slate-700">{t('dashboard.marketing.promo_discount')}</label>
                                <input type="number" name="discount" id="discount" value={formData.discount} onChange={handleInputChange} required min="1" max="100" className="mt-1 w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                            <button type="submit" disabled={isLoading} className="w-full bg-rose-500 text-white font-semibold p-3 rounded-full hover:bg-rose-600 transition-colors disabled:bg-rose-300 flex items-center justify-center space-x-2">
                                <MegaphoneIcon className="h-5 w-5" />
                                <span>{isLoading ? t('dashboard.marketing.sending') : t('dashboard.marketing.send_button')}</span>
                            </button>
                            {feedback && <p className="text-center text-sm mt-4 text-slate-600">{feedback}</p>}
                        </form>
                    </div>
                </div>

                {/* History Column */}
                <div className="lg:col-span-3">
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">{t('dashboard.marketing.past_promos_title')}</h2>
                         <div className="overflow-x-auto max-h-[60vh]">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-600 text-sm font-semibold sticky top-0">
                                    <tr>
                                        <th className="p-3">{t('dashboard.marketing.table_title')}</th>
                                        <th className="p-3">{t('dashboard.marketing.table_discount')}</th>
                                        <th className="p-3">{t('dashboard.marketing.table_sent_at')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {promotions.map(promo => (
                                        <tr key={promo.id} className="border-b border-slate-100">
                                            <td className="p-3 align-top">
                                                <p className="font-medium text-slate-800">{promo.title}</p>
                                                <p className="text-sm text-slate-500">{promo.description}</p>
                                            </td>
                                            <td className="p-3 align-top">
                                                <span className="font-bold text-rose-600">{promo.discount}%</span>
                                            </td>
                                            <td className="p-3 align-top text-sm">{new Date(promo.sentAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

const UserManagementView: React.FC = () => {
    const { t } = useI18n();
    const [users, setUsers] = useState<DashboardUser[]>([]);
    useEffect(() => { db.getDashboardUsers().then(setUsers); }, []);

    return (
        <div className="bg-white p-6 rounded-xl shadow-md mt-8">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">{t('dashboard.settings.users_title')}</h3>
                    <p className="text-slate-600 text-sm">{t('dashboard.settings.users_desc')}</p>
                </div>
                <button className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">{t('dashboard.settings.invite_user')}</button>
            </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-600 text-sm font-semibold">
                        <tr><th className="p-3">{t('dashboard.settings.table_user')}</th><th className="p-3">{t('dashboard.settings.table_role')}</th><th className="p-3">{t('dashboard.settings.table_last_login')}</th></tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="border-b border-slate-100">
                                <td className="p-3"><p className="font-medium text-slate-800">{user.name}</p><p className="text-sm text-slate-500">{user.email}</p></td>
                                <td className="p-3">{t(`dashboard.settings.role_${user.role}` as keyof Translations)}</td>
                                <td className="p-3">{user.lastLogin}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const DeploymentModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { t } = useI18n();
    type StepStatus = 'pending' | 'running' | 'success';
    const initialSteps = [
        { id: 'build', name: t('dashboard.deploy_modal.step_build'), status: 'pending' as StepStatus },
        { id: 'test', name: t('dashboard.deploy_modal.step_test'), status: 'pending' as StepStatus },
        { id: 'publish', name: t('dashboard.deploy_modal.step_publish'), status: 'pending' as StepStatus },
    ];
    const [steps, setSteps] = useState(initialSteps);
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        const runDeployment = async () => {
            for (let i = 0; i < steps.length; i++) {
                setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'running' } : s));
                await new Promise(resolve => setTimeout(resolve, 1500));
                setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'success' } : s));
            }
            setIsComplete(true);
        };
        runDeployment();
    }, []);

    const getStatusIcon = (status: StepStatus) => {
        switch (status) {
            case 'pending': return <div className="w-4 h-4 rounded-full border-2 border-slate-400"></div>;
            case 'running': return <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>;
            case 'success': return <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
        }
    };

    return (
        <Modal onClose={onClose} title={t('dashboard.deploy_modal.title')} size="md">
            <div className="space-y-4">
                {steps.map(step => (
                    <div key={step.id} className="flex items-center space-x-4 p-3 bg-slate-100 rounded-lg">
                        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">{getStatusIcon(step.status)}</div>
                        <p className={`font-medium ${step.status === 'pending' ? 'text-slate-500' : 'text-slate-800'}`}>{step.name}</p>
                    </div>
                ))}
                {isComplete && (
                    <div className="text-center p-4 bg-green-100 rounded-lg animate-fade-in">
                        <h4 className="font-bold text-green-700">{t('dashboard.deploy_modal.step_done')}</h4>
                        <button onClick={onClose} className="mt-4 bg-green-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors">
                            {t('dashboard.deploy_modal.close_button')}
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
};

const SettingsView: React.FC = () => {
    const { t } = useI18n();
    const [brandSettings, setBrandSettings] = useState({ logoPreview: null as string | null, primaryColor: '#4f46e5' });
    const [editableServices, setEditableServices] = useState(SERVICES.map((s, i) => ({ id: `service-${i}`, titleKey: s.titleKey as keyof Translations, price: s.price, duration: 20 + i * 5 })));
    const [copyButtonText, setCopyButtonText] = useState(t('dashboard.settings.copy_code'));
    const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onloadend = () => setBrandSettings(p => ({ ...p, logoPreview: reader.result as string }));
            reader.readAsDataURL(e.target.files[0]);
        }
    };
    const handleServiceChange = (id: string, field: 'price' | 'duration', value: string) => {
        const numVal = parseInt(value, 10);
        setEditableServices(p => p.map(s => s.id === id ? { ...s, [field]: isNaN(numVal) ? s[field] : numVal } : s));
    };
    const widgetCode = `<script src="https://my-pet-tech.com/widget.js" data-provider-id="YOUR_UNIQUE_ID" async defer></script>`;
    const handleCopyCode = () => {
        navigator.clipboard.writeText(widgetCode).then(() => {
            setCopyButtonText(t('dashboard.settings.copied'));
            setTimeout(() => setCopyButtonText(t('dashboard.settings.copy_code')), 2000);
        });
    };

    return (
        <>
            <h1 className="text-3xl font-bold text-slate-800 mb-6">{t('dashboard.settings.title')}</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-md flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">{t('dashboard.settings.branding_title')}</h3>
                    <p className="text-slate-600 text-sm mb-4">{t('dashboard.settings.branding_desc')}</p>
                    <div className="space-y-4 flex-grow">
                        <div className="flex items-center space-x-4">
                            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                               {brandSettings.logoPreview ? <img src={brandSettings.logoPreview} alt="Logo preview" className="w-full h-full object-cover" /> : <span className="text-slate-400 text-xs text-center">Logo</span>}
                            </div>
                            <label htmlFor="logo-upload" className="cursor-pointer bg-slate-200 text-slate-800 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 transition-colors">{t('dashboard.settings.upload_logo')}</label>
                            <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                        </div>
                        <div>
                            <label htmlFor="primary-color" className="block text-sm font-medium text-slate-700 mb-1">{t('dashboard.settings.primary_color')}</label>
                            <div className="flex items-center space-x-2">
                                <input id="primary-color" type="color" value={brandSettings.primaryColor} onChange={(e) => setBrandSettings(p => ({...p, primaryColor: e.target.value}))} className="h-10 w-10 p-1 border-none rounded-md cursor-pointer"/>
                                <span className="font-mono text-slate-500">{brandSettings.primaryColor}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md flex flex-col">
                     <h3 className="text-lg font-bold text-slate-800 mb-2">{t('dashboard.settings.services_title')}</h3>
                     <p className="text-slate-600 text-sm mb-4">{t('dashboard.settings.services_desc')}</p>
                     <div className="space-y-3 flex-grow">
                        {editableServices.map(s => (
                            <div key={s.id} className="grid grid-cols-3 gap-x-4 items-center p-2 bg-slate-50 rounded-lg">
                                 <span className="font-medium text-slate-700 col-span-1 truncate" title={t(s.titleKey)}>{t(s.titleKey)}</span>
                                 <div><label className="text-xs text-slate-500">{t('dashboard.settings.service_price')}</label><input type="number" value={s.price} onChange={e => handleServiceChange(s.id, 'price', e.target.value)} className="w-full p-2 text-sm rounded-md border border-slate-300"/></div>
                                 <div><label className="text-xs text-slate-500">{t('dashboard.settings.service_duration')}</label><input type="number" value={s.duration} onChange={e => handleServiceChange(s.id, 'duration', e.target.value)} className="w-full p-2 text-sm rounded-md border border-slate-300"/></div>
                            </div>
                        ))}
                     </div>
                </div>
                <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">{t('dashboard.settings.widget_title')}</h3>
                    <p className="text-slate-600 text-sm mb-4">{t('dashboard.settings.widget_desc')}</p>
                    <div className="relative bg-slate-800 text-white p-4 rounded-lg font-mono text-sm">
                        <button onClick={handleCopyCode} className="absolute top-2 right-2 bg-slate-600 hover:bg-slate-500 text-white text-xs font-semibold py-1 px-2 rounded">{copyButtonText}</button>
                        <pre><code>{widgetCode}</code></pre>
                    </div>
                </div>
                <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-md border-t-4 border-rose-500">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">{t('dashboard.settings.deploy_title')}</h3>
                    <p className="text-slate-600 text-sm mb-4">{t('dashboard.settings.deploy_desc')}</p>
                    <button
                        onClick={() => setIsDeployModalOpen(true)}
                        className="bg-rose-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-rose-700 transition-colors flex items-center space-x-2"
                    >
                        <RocketLaunchIcon className="w-5 h-5" />
                        <span>{t('dashboard.settings.deploy_button')}</span>
                    </button>
                </div>
            </div>
            <UserManagementView />
            {isDeployModalOpen && <DeploymentModal onClose={() => setIsDeployModalOpen(false)} />}
        </>
    );
};

// Finance Views
const ProvidersView: React.FC = () => {
    const { t } = useI18n();
    const [providers, setProviders] = useState<Provider[]>([]);
    useEffect(() => { db.getProviders().then(setProviders); }, []);

    return (
         <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold text-slate-800 mb-4">{t('dashboard.finances.providers.title')}</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-600 text-sm font-semibold">
                        <tr><th className="p-3">{t('dashboard.finances.providers.table_provider')}</th><th className="p-3">{t('dashboard.finances.providers.table_contact')}</th><th className="p-3">{t('dashboard.finances.providers.table_category')}</th></tr>
                    </thead>
                    <tbody>
                        {providers.map(p => (
                            <tr key={p.id} className="border-b border-slate-100">
                                <td className="p-3"><p className="font-medium text-slate-800">{p.name}</p><p className="text-sm text-slate-500">{p.email}</p></td>
                                <td className="p-3">{p.contactPerson}</td><td className="p-3">{t(`dashboard.finances.category.${p.category}` as keyof Translations)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ExpensesView: React.FC = () => {
    const { t } = useI18n();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    useEffect(() => { db.getExpenses().then(setExpenses); }, []);
    const formatCurrency = (v: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v);

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold text-slate-800 mb-4">{t('dashboard.finances.expenses.title')}</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-600 text-sm font-semibold">
                        <tr><th className="p-3">{t('dashboard.finances.expenses.table_date')}</th><th className="p-3">{t('dashboard.finances.expenses.table_description')}</th><th className="p-3">{t('dashboard.finances.expenses.table_category')}</th><th className="p-3 text-right">{t('dashboard.finances.expenses.table_amount')}</th></tr>
                    </thead>
                    <tbody>
                        {expenses.map(e => (
                            <tr key={e.id} className="border-b border-slate-100">
                                <td className="p-3">{e.date}</td><td className="p-3">{e.description}</td><td className="p-3">{t(`dashboard.finances.category.${e.category}` as keyof Translations)}</td><td className="p-3 text-right font-medium">{formatCurrency(e.amount)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const InventoryView: React.FC = () => {
    const { t } = useI18n();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [providers, setProviders] = useState<Provider[]>([]);
    useEffect(() => {
        db.getInventory().then(setItems);
        db.getProviders().then(setProviders);
    }, []);
    const getProviderName = (id: string) => providers.find(p => p.id === id)?.name || 'N/A';
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold text-slate-800 mb-4">{t('dashboard.finances.inventory.title')}</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-600 text-sm font-semibold">
                        <tr><th className="p-3">{t('dashboard.finances.inventory.table_item')}</th><th className="p-3">{t('dashboard.finances.inventory.table_stock')}</th><th className="p-3">{t('dashboard.finances.inventory.table_supplier')}</th></tr>
                    </thead>
                    <tbody>
                        {items.map(i => (
                            <tr key={i.id} className="border-b border-slate-100">
                                <td className="p-3 font-medium">{i.name}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${i.stock <= i.lowStockThreshold ? 'bg-rose-100 text-rose-800' : 'bg-green-100 text-green-800'}`}>
                                        {i.stock} {i.stock <= i.lowStockThreshold ? `(${t('dashboard.finances.inventory.status_low')})` : ''}
                                    </span>
                                </td>
                                <td className="p-3">{getProviderName(i.supplierId)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


// Main Dashboard Component
const DashboardPage: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const { t } = useI18n();
    const [view, setView] = useState<DashboardView>('summary');
    const [isFinanceMenuOpen, setFinanceMenuOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);

    const appActions: AppActions = { navigateTo: () => {}, openModal: () => {}, attemptLogin: () => false };
    
    const navItems: { id: DashboardView; nameKey: keyof Translations; icon: React.FC<any> }[] = [
        { id: 'summary', nameKey: 'dashboard.nav.summary', icon: HomeIcon },
        { id: 'analytics', nameKey: 'dashboard.nav.analytics', icon: ChartBarIcon },
        { id: 'marketing', nameKey: 'dashboard.nav.marketing', icon: MegaphoneIcon },
        { id: 'leads', nameKey: 'dashboard.nav.leads', icon: DocumentTextIcon },
        { id: 'appointments', nameKey: 'dashboard.nav.appointments', icon: CalendarDaysIcon },
        { id: 'clients', nameKey: 'dashboard.nav.clients', icon: UsersIcon },
    ];
    const financeNavItems: { id: DashboardView; nameKey: keyof Translations; icon: React.FC<any> }[] = [
        { id: 'providers', nameKey: 'dashboard.nav.providers', icon: TruckIcon },
        { id: 'expenses', nameKey: 'dashboard.nav.expenses', icon: ReceiptPercentIcon },
        { id: 'inventory', nameKey: 'dashboard.nav.inventory', icon: ArchiveBoxIcon },
    ];

    const handleNavClick = (v: DashboardView) => {
        if (!financeNavItems.some(i => i.id === v)) { setFinanceMenuOpen(false); }
        setView(v);
    };

    const renderView = () => {
        switch (view) {
            case 'summary': return <SummaryView />;
            case 'analytics': return <AnalyticsView />;
            case 'marketing': return <MarketingView />;
            case 'leads': return <LeadsView />;
            case 'clients': return <ClientsView />;
            case 'appointments': return <AppointmentsView />;
            case 'settings': return <SettingsView />;
            case 'providers': return <ProvidersView />;
            case 'expenses': return <ExpensesView />;
            case 'inventory': return <InventoryView />;
            default: return <SummaryView />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
            <aside className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col">
                 <div className="p-4 flex items-center space-x-3 border-b border-slate-700 h-16">
                    <BrandIcon className="h-8 w-8 text-cyan-400" />
                    <span className="text-xl font-bold">{t('dashboard.panel_title')}</span>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map(item => (<button key={item.id} onClick={() => handleNavClick(item.id)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${view === item.id ? 'bg-indigo-600 font-semibold' : 'hover:bg-slate-700'}`}><item.icon className="h-5 w-5" /><span>{t(item.nameKey)}</span></button>))}
                    <div>
                        <button onClick={() => setFinanceMenuOpen(!isFinanceMenuOpen)} className={`w-full flex items-center justify-between space-x-3 px-4 py-3 rounded-md transition-colors ${financeNavItems.some(i=>i.id===view) ? 'bg-indigo-600 font-semibold' : 'hover:bg-slate-700'}`}>
                            <div className="flex items-center space-x-3"><BanknotesIcon className="h-5 w-5" /><span>{t('dashboard.nav.finances')}</span></div>
                            <ChevronDownIcon className={`h-5 w-5 transition-transform ${isFinanceMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isFinanceMenuOpen && (
                            <div className="mt-2 space-y-1 pl-4">
                                {financeNavItems.map(item => (<button key={item.id} onClick={() => handleNavClick(item.id)} className={`w-full flex items-center space-x-3 px-4 py-2 rounded-md transition-colors text-sm ${view === item.id ? 'bg-indigo-500 font-semibold' : 'hover:bg-slate-700'}`}><item.icon className="h-4 w-4" /><span>{t(item.nameKey)}</span></button>))}
                            </div>
                        )}
                    </div>
                     <button onClick={() => handleNavClick('settings')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${view === 'settings' ? 'bg-indigo-600 font-semibold' : 'hover:bg-slate-700'}`}><Cog6ToothIcon className="h-5 w-5" /><span>{t('dashboard.nav.settings')}</span></button>
                </nav>
                 <div className="p-4 border-t border-slate-700">
                      <button onClick={onLogout} className="w-full flex items-center space-x-3 px-4 py-3 rounded-md hover:bg-slate-700 transition-colors"><ArrowLeftOnRectangleIcon className="h-5 w-5" /><span>{t('dashboard.nav.logout')}</span></button>
                 </div>
            </aside>
            <main className="flex-1 p-6 md:p-8 overflow-y-auto relative">
                <Suspense fallback={<SkeletonLoader />}>
                    {renderView()}
                </Suspense>
                
                <button onClick={() => setIsChatOpen(true)} className="fixed bottom-8 right-8 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-transform transform hover:scale-110 z-[99]">
                    <ChatBubbleOvalLeftEllipsisIcon className="h-8 w-8" />
                </button>
                {isChatOpen && <PetCareAssistant onClose={() => setIsChatOpen(false)} appActions={appActions} userType="admin" />}
            </main>
        </div>
    );
};

export default DashboardPage;