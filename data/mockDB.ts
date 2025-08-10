import { Appointment, User, Client, AppointmentCreationData, CommunicationEntry, Lead, ServicePopularity, TopClient, PeakHour, Provider, Expense, InventoryItem, DashboardUser, UserRole, Promotion } from "../types";
import { v4 as uuidv4 } from 'uuid';
import { SERVICES } from "../constants";

// --- In-memory database simulation ---

function getDayString(dayOffset: number) {
    const day = new Date();
    day.setDate(day.getDate() + dayOffset);
    return day.toISOString().split('T')[0];
}

let CLIENTS: Client[] = [
    {
        id: 'c1', name: 'Juan Pérez', email: 'juan.perez@example.com', phone: '555-1234', address: 'Av. Siempreviva 742, Springfield', memberSince: getDayString(-150),
        pet: { 
            name: 'Max', breed: 'Golden Retriever', age: 4, weight: 32, 
            avatarUrl: 'https://images.unsplash.com/photo-1561037404-61cd46aa615b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
            medicalHistory: [ { date: '2024-03-10', description: 'Vacuna anual DHPPL', type: 'vaccine'}, { date: '2024-01-20', description: 'Revisión general, todo OK', type: 'checkup'}, ],
            vaccineReminders: ['Próxima vacuna anual: 2025-03-10']
        },
        communicationLog: [],
    },
    {
        id: 'c2', name: 'Ana García', email: 'ana.garcia@example.com', phone: '555-5678', address: 'Calle Falsa 123, Springfield', memberSince: getDayString(-70),
        pet: { 
            name: 'Luna', breed: 'Beagle', age: 2, weight: 12,
            avatarUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
            medicalHistory: [ { date: '2024-04-15', description: 'Vacuna contra la rabia', type: 'vaccine'}, { date: '2023-11-30', description: 'Tratamiento por alergia leve', type: 'treatment'}, ],
            vaccineReminders: ['Refuerzo rabia: 2025-04-15']
        },
        communicationLog: [],
    },
    {
        id: 'c3', name: 'Carlos Díaz', email: 'carlos.diaz@example.com', phone: '555-9012', address: 'Boulevard de los Sueños Rotos, Springfield', memberSince: getDayString(-25),
        pet: { 
            name: 'Rocky', breed: 'Boxer', age: 6, weight: 30,
            avatarUrl: 'https://images.unsplash.com/photo-1598875706253-33fa34527562?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
            medicalHistory: [],
            vaccineReminders: []
        },
        communicationLog: [],
    }
];

let APPOINTMENTS: Appointment[] = [
    { id: 'app1', date: getDayString(-2), time: '10:00', clientId: 'c1', petName: 'Max', service: 'Experiencia Spa', address: 'Av. Siempreviva 742, Springfield', status: 'completed', paymentStatus: 'paid', syncedToGoogle: true },
    { id: 'app2', date: getDayString(-1), time: '12:00', clientId: 'c2', petName: 'Luna', service: 'Experiencia Spa', address: 'Calle Falsa 123, Springfield', status: 'completed', paymentStatus: 'paid', syncedToGoogle: false },
    { id: 'app3', date: getDayString(0), time: '14:00', clientId: 'c1', petName: 'Max', service: 'Tratamiento Premium', address: 'Av. Siempreviva 742, Springfield', status: 'completed', paymentStatus: 'pending', syncedToGoogle: true },
    { id: 'app4', date: getDayString(1), time: '09:00', clientId: 'c3', petName: 'Rocky', service: 'Lavado Básico', address: 'Boulevard de los Sueños Rotos, Springfield', status: 'confirmed', paymentStatus: 'pending', syncedToGoogle: false },
    { id: 'app5', date: getDayString(-10), time: '15:00', clientId: 'c3', petName: 'Rocky', service: 'Lavado Básico', address: 'Boulevard de los Sueños Rotos, Springfield', status: 'completed', paymentStatus: 'paid', syncedToGoogle: true },
    { id: 'app6', date: getDayString(-5), time: '11:00', clientId: 'c1', petName: 'Max', service: 'Experiencia Spa', address: 'Av. Siempreviva 742, Springfield', status: 'completed', paymentStatus: 'paid', syncedToGoogle: true },
    { id: 'app7', date: getDayString(1), time: '10:00', clientId: 'c1', petName: 'Max', service: 'Tratamiento Premium', address: 'Av. Siempreviva 742, Springfield', status: 'confirmed', paymentStatus: 'pending', syncedToGoogle: false },
    { id: 'app8', date: getDayString(-80), time: '16:00', clientId: 'c2', petName: 'Luna', service: 'Lavado Básico', address: 'Calle Falsa 123, Springfield', status: 'completed', paymentStatus: 'paid', syncedToGoogle: true },
];

let USERS: User[] = CLIENTS.map(c => ({ name: c.name, email: c.email, petName: c.pet.name, petBreed: c.pet.breed, phone: c.phone }));

const allTimeSlots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

let LEADS: Lead[] = [
    { id: 'lead1', name: 'Carlos Santana', email: 'carlos.s@guitargods.com', phone: '555-2021', message: 'Interested in 2 units for my new grooming salon in Tijuana.', capturedAt: getDayString(-1), status: 'new' },
    { id: 'lead2', name: 'Maria Rodriguez', email: 'maria.r@pethaven.com', phone: '555-2022', message: 'How much does maintenance cost per year?', capturedAt: getDayString(-2), status: 'contacted' },
];

let PROVIDERS: Provider[] = [
    { id: 'prov1', name: 'PetGroom Supplies', contactPerson: 'Mariana Soto', phone: '310-555-0101', email: 'sales@petgroom.com', category: 'supplies' },
    { id: 'prov2', 'name': 'AquaTech Mantenimiento', contactPerson: 'Roberto Frias', phone: '310-555-0102', email: 'support@aquatech.com', category: 'maintenance' },
];

let EXPENSES: Expense[] = [
    { id: 'exp1', date: getDayString(-5), description: 'Compra de champús y acondicionadores', category: 'supplies', amount: 850000 },
    { id: 'exp2', date: getDayString(-1), description: 'Publicidad en redes sociales - Campaña Mayo', category: 'marketing', amount: 450000 },
];

let INVENTORY_ITEMS: InventoryItem[] = [
    { id: 'inv1', name: 'Champú Hipoalergénico (Galón)', stock: 12, lowStockThreshold: 5, supplierId: 'prov1' },
    { id: 'inv2', name: 'Acondicionador (Galón)', stock: 8, lowStockThreshold: 5, supplierId: 'prov1' },
    { id: 'inv3', name: 'Filtro de Agua Modelo X', stock: 25, lowStockThreshold: 10, supplierId: 'prov2' },
];

let DASHBOARD_USERS: DashboardUser[] = [
    { id: 'user1', name: 'Admin Manager', email: 'admin.manager@pet-tech.io', role: 'admin', lastLogin: getDayString(0) },
    { id: 'user2', name: 'Gerente Tienda', email: 'gerente.tienda@pet-tech.io', role: 'manager', lastLogin: getDayString(-1) },
    { id: 'user3', name: 'Empleado Mostrador', email: 'empleado1@pet-tech.io', role: 'employee', lastLogin: getDayString(0) },
];

let PROMOTIONS: Promotion[] = [
    { id: 'promo1', title: '20% Off en Experiencia Spa!', description: 'Consiente a tu mejor amigo con nuestra lujosa experiencia de spa. Reserva esta semana y obtén un 20% de descuento.', discount: 20, sentAt: getDayString(-5) }
];


// --- API function simulations ---

export const getLeads = async (): Promise<Lead[]> => {
    return Promise.resolve([...LEADS].sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()));
};

export const updateLeadStatus = async (leadId: string, status: Lead['status']): Promise<Lead | undefined> => {
    const lead = LEADS.find(l => l.id === leadId);
    if (lead) lead.status = status;
    return Promise.resolve(lead);
};

export const getAvailableSlotsForDate = async (date: string): Promise<{ availableSlots: string[] } | { error: string }> => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Formato de fecha inválido. Por favor, usa AAAA-MM-DD." };
    const bookedSlots = APPOINTMENTS.filter(app => app.date === date && app.status === 'confirmed').map(app => app.time);
    const availableSlots = allTimeSlots.filter(slot => !bookedSlots.includes(slot));
    return { availableSlots };
};

export const addAppointment = async (appointmentData: AppointmentCreationData): Promise<{ confirmation: string } | { error: string }> => {
    const { date, time, name, petName, service, phone, address } = appointmentData;
    if (!date || !time || !name || !petName || !service || !phone || !address) return { error: "Faltan datos para agendar la cita." };

    const bookedSlots = APPOINTMENTS.filter(app => app.date === date && app.status === 'confirmed').map(app => app.time);
    if (bookedSlots.includes(time)) {
        return { error: `Lo siento, el horario de las ${time} el día ${date} ya no está disponible.` };
    }

    let client = CLIENTS.find(c => c.name.toLowerCase() === name.toLowerCase());
    let clientId: string;

    if (client) {
        clientId = client.id;
        client.phone = phone; client.address = address;
    } else {
        clientId = uuidv4();
        CLIENTS.push({
            id: clientId, name, email: `${name.toLowerCase().replace(/\s/g, '.')}@example.com`, phone, address, memberSince: getDayString(0),
            pet: { name: petName, breed: 'Desconocida', age: 0, weight: 0, avatarUrl: `https://i.pravatar.cc/150?u=${petName}`, medicalHistory: [], vaccineReminders: [] },
            communicationLog: []
        });
    }

    const newAppointment: Appointment = {
        id: uuidv4(), date, time, clientId, petName, service, address, status: 'confirmed', paymentStatus: 'pending', syncedToGoogle: false,
    };
    APPOINTMENTS.push(newAppointment);
    return { confirmation: `¡Excelente! La cita para ${petName} ha sido confirmada para el ${date} a las ${time}.` };
};

export const addUser = async (userData: User): Promise<{ confirmation: string } | { error: string }> => {
    if (USERS.find(u => u.email.toLowerCase() === userData.email.toLowerCase())) return { error: `El usuario con el email ${userData.email} ya existe.` };
    USERS.push(userData);
    return { confirmation: `Usuario ${userData.name} creado exitosamente.` };
};

export const getClients = async (): Promise<Client[]> => Promise.resolve(CLIENTS);
export const getClientById = async (id: string): Promise<Client | undefined> => Promise.resolve(CLIENTS.find(c => c.id === id));

export const findClient = async (query: {name?: string, email?: string}): Promise<Client | { error: string }> => {
    const { name, email } = query;
    let client;
    if (name) {
        client = CLIENTS.find(c => c.name.toLowerCase().includes(name.toLowerCase()));
    } else if (email) {
        client = CLIENTS.find(c => c.email.toLowerCase() === email.toLowerCase());
    }

    if (client) return client;
    return { error: `No se encontró ningún cliente con los datos proporcionados.` };
}

export const addCommunicationNote = async (clientId: string, text: string): Promise<void> => {
    const client = CLIENTS.find(c => c.id === clientId);
    if(client) client.communicationLog.unshift({ id: uuidv4(), date: new Date().toISOString(), text });
    return Promise.resolve();
};

export const getAppointments = async (): Promise<Appointment[]> => Promise.resolve([...APPOINTMENTS].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
export const getAppointmentsForClient = async (clientId: string): Promise<Appointment[] | { error: string }> => {
    const clientExists = CLIENTS.some(c => c.id === clientId);
    if (!clientExists) return { error: `Cliente con ID ${clientId} no encontrado.`};
    return APPOINTMENTS.filter(a => a.clientId === clientId);
}

export const updateAppointmentPaymentStatus = async (appointmentId: string, status: 'paid' | 'pending'): Promise<void> => {
    const appointment = APPOINTMENTS.find(a => a.id === appointmentId);
    if (appointment) appointment.paymentStatus = status;
    return Promise.resolve();
};

export const confirmPayment = async (appointmentId: string): Promise<{ confirmation: string } | { error: string }> => {
    const appointment = APPOINTMENTS.find(a => a.id === appointmentId);
    if (appointment) {
        if (appointment.status === 'completed') {
            appointment.paymentStatus = 'paid';
            return { confirmation: `El pago para la cita ${appointmentId} ha sido confirmado.` };
        } else {
            return { error: 'No se puede confirmar el pago de una cita que no está completada.' };
        }
    }
    return { error: `Cita con ID ${appointmentId} no encontrada.` };
};

export const getUnsyncedAppointments = async (): Promise<Appointment[]> => {
    return Promise.resolve(APPOINTMENTS.filter(a => !a.syncedToGoogle && a.status !== 'canceled'));
};

export const markAppointmentsAsSynced = async (): Promise<void> => {
    APPOINTMENTS.forEach(app => {
        if (!app.syncedToGoogle) {
            app.syncedToGoogle = true;
        }
    });
    return Promise.resolve();
};

export const cancelAppointment = async (appointmentId: string): Promise<{ confirmation: string } | { error: string }> => {
    const appointment = APPOINTMENTS.find(a => a.id === appointmentId);
    if (appointment) {
        if (appointment.status === 'confirmed') {
            appointment.status = 'canceled';
            return { confirmation: `La cita ${appointmentId} ha sido cancelada.` };
        } else {
            return { error: `No se puede cancelar una cita que está '${appointment.status}'.` };
        }
    }
    return { error: `Cita con ID ${appointmentId} no encontrada.` };
};

const getPrice = (serviceName: string): number => {
    const sName = serviceName.toLowerCase();
    if (sName.includes('básico') || sName.includes('basic')) return 40000;
    if (sName.includes('premium')) return 60000;
    if (sName.includes('spa')) return 80000;
    return 0;
};

export const getAnalyticsData = async (): Promise<{ totalRevenue: number, servicePopularity: ServicePopularity[], topClients: TopClient[], peakHours: PeakHour[] }> => {
    
    const totalRevenue = APPOINTMENTS
        .filter(a => a.paymentStatus === 'paid')
        .reduce((sum, a) => sum + (getPrice(a.service) || 0), 0);

    const servicePopularity: ServicePopularity[] = APPOINTMENTS.reduce((acc, a) => {
        const existing = acc.find(s => s.name === a.service);
        if (existing) {
            existing.count++;
        } else {
            acc.push({ name: a.service, count: 1 });
        }
        return acc;
    }, [] as ServicePopularity[]);

    const clientRevenue: {[key: string]: number} = {};
     APPOINTMENTS
        .filter(a => a.paymentStatus === 'paid')
        .forEach(a => {
            const price = getPrice(a.service);
            if (price > 0) {
                clientRevenue[a.clientId] = (clientRevenue[a.clientId] || 0) + price;
            }
        });

    const topClients: TopClient[] = Object.entries(clientRevenue)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([clientId, revenue]) => ({
            name: CLIENTS.find(c => c.id === clientId)?.name || 'Unknown',
            revenue,
        }));

    const peakHours: PeakHour[] = allTimeSlots.map(hour => ({
        hour,
        appointments: APPOINTMENTS.filter(a => a.time === hour).length
    }));
    
    return Promise.resolve({ totalRevenue, servicePopularity, topClients, peakHours });
};

export const getInventory = async (): Promise<InventoryItem[]> => Promise.resolve(INVENTORY_ITEMS);

export const createAndSendPromotion = async (promoData: { title: string; description: string; discount: number }): Promise<{ confirmation: string }> => {
    const newPromo: Promotion = {
        id: uuidv4(),
        ...promoData,
        sentAt: new Date().toISOString(),
    };
    PROMOTIONS.unshift(newPromo);
    return Promise.resolve({ confirmation: `¡Promoción '${promoData.title}' enviada con éxito a ${CLIENTS.length} clientes!` });
};

export const sendWhatsappToAllClients = async (message: string): Promise<{ confirmation: string }> => {
    console.log(`Simulating sending WhatsApp: "${message}" to ${CLIENTS.length} clients.`);
    // Add to communication log for each client
    const noteText = `(Mensaje masivo WA): ${message}`;
    CLIENTS.forEach(client => {
        client.communicationLog.unshift({ id: uuidv4(), date: new Date().toISOString(), text: noteText });
    });
    return Promise.resolve({ confirmation: `Mensaje de WhatsApp enviado a ${CLIENTS.length} clientes.` });
};

export const getPromotions = async (): Promise<Promotion[]> => {
    return Promise.resolve([...PROMOTIONS].sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()));
};

export const getDashboardUsers = async (): Promise<DashboardUser[]> => Promise.resolve(DASHBOARD_USERS);
export const getProviders = async (): Promise<Provider[]> => Promise.resolve(PROVIDERS);
export const getExpenses = async (): Promise<Expense[]> => Promise.resolve(EXPENSES);
