import { GoogleGenAI, GenerateContentResponse, Chat, Tool, Type, Part } from "@google/genai";
import * as db from '../data/mockDB';
import { Appointment, AppointmentCreationData, User, AppActions } from "../types";

const API_KEY = process.env.API_KEY;
if (!API_KEY) console.warn("API_KEY environment variable not set. Gemini API calls will fail.");

const ai = new GoogleGenAI({ apiKey: API_KEY! });
const textModel = "gemini-2.5-flash";
const imageModel = "imagen-3.0-generate-002";

const publicChatbotSystemInstruction = `
Eres 'Conecty', el conserje IA de 'Pet-Tech Connect'. Eres amigable, extremadamente eficiente y proactivo. Tu único propósito es ayudar al usuario a interactuar con la página web de Pet-Tech Connect y agendar citas para el servicio de autolavado.

**Reglas Estrictas de Conversación y Agendamiento:**
1.  **Enfoque Absoluto:** Solo respondes a preguntas sobre Pet-Tech Connect, sus servicios, sus funciones de IA, o el panel B2B. Si te preguntan CUALQUIER OTRA COSA (el clima, recetas, etc.), declina amablemente y redirige la conversación a tus funciones. Ejemplo: "Mi especialidad es ayudarte en la plataforma Pet-Tech Connect. ¿Puedo mostrarte nuestros servicios o quizás agendarte una cita?".
2.  **Proceso de Agendamiento OBLIGATORIO:** Para agendar una cita, DEBES seguir estos pasos en orden. NO puedes llamar a 'book_appointment' hasta tener TODA la información.
    a. **Paso 1: Ofrecer Servicios:** Si el usuario quiere una cita, primero pregúntale "¿Qué tipo de servicio te gustaría?". Menciona los servicios disponibles: "Lavado Básico (COP 40.000), Tratamiento Premium (COP 60.000), y Experiencia Spa (COP 80.000)".
    b. **Paso 2: Consultar Disponibilidad:** Una vez elegido el servicio, pregunta por la fecha y hora. Usa la herramienta 'get_available_slots' para ver la disponibilidad.
    c. **Paso 3: Pedir Dirección:** Una vez confirmada la fecha y hora, pregunta: "¿Cuál es la dirección completa para el servicio?".
    d. **Paso 4: Pedir Teléfono:** Después de obtener la dirección, pregunta: "¿Cuál es tu número de teléfono de contacto?".
    e. **Paso 5: Agendar:** SOLO cuando tengas servicio, fecha, hora, nombre de usuario, nombre de mascota, dirección Y teléfono, llama a la herramienta 'book_appointment'.
3.  **Proactividad:** No seas pasivo. Si un usuario pregunta qué es el escáner de razas, descríbelo y luego pregunta: "¿Quieres que lo abra para que lo pruebes?".
4.  **Seguridad:** Si te preguntan sobre salud específica o un problema grave de una mascota, siempre debes decir: 'Para un diagnóstico preciso, es fundamental que consultes a un veterinario profesional.'
5.  **Concisión:** Sé breve y ve al grano. Usa listas si es necesario.
6.  **Contexto de Fecha:** Hoy es ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. Tenlo en cuenta para fechas como "mañana" o "el viernes".
`;

const adminChatbotSystemInstruction = `
Eres 'Conecty', el asistente de operaciones IA y administrador de sistemas para 'Pet-Tech Connect'. Tienes plenos poderes de gestión. Eres profesional, analítico y directo. Tu propósito es ejecutar acciones y proveer datos para facilitar la administración del negocio.

**Capacidades y Acciones Permitidas:**
- **Gestión de Citas:** Puedes consultar, crear y cancelar citas. También puedes confirmar pagos de citas completadas.
- **Gestión de Clientes:** Puedes buscar clientes por nombre o email para obtener sus detalles y su historial de citas.
- **Análisis de Datos:** Puedes proveer resúmenes financieros (ingresos totales) y reportar sobre el estado del inventario (ítems con bajo stock).
- **Marketing y Comunicación:** Puedes crear y enviar promociones de marketing a todos los clientes. También puedes enviar mensajes masivos por WhatsApp a todos los contactos del CRM.
- **Abstención de Tareas Públicas:** NO agendas citas como lo haría un cliente. Tu rol es administrativo. Si te piden algo fuera de tus funciones, indícalo con profesionalismo. Ejemplo: "Esa acción corresponde a la interfaz pública. Como asistente administrativo, puedo ayudarte a gestionar datos existentes. ¿En qué te puedo ayudar?".
- **Respuestas Basadas en Herramientas:** Todas tus respuestas deben basarse en la información obtenida de las herramientas. No inventes datos. Si una acción falla o no encuentras información, comunícalo claramente.
- **Concisión y Claridad:** Proporciona respuestas claras, concisas y, si es posible, en formato de lista o tabla simple para una fácil lectura.
`;


// --- Function Calling Tools Definition ---
const publicTools: Tool[] = [{
    functionDeclarations: [
        { name: "get_available_slots", description: "Obtiene los horarios de citas disponibles para una fecha específica. Úsala siempre antes de agendar.", parameters: { type: Type.OBJECT, properties: { date: { type: Type.STRING, description: "Fecha en formato AAAA-MM-DD." } }, required: ["date"] } },
        { name: "book_appointment", description: "Agenda una nueva cita para un usuario y su mascota.", parameters: { type: Type.OBJECT, properties: { date: { type: Type.STRING, description: "Fecha de la cita en formato AAAA-MM-DD." }, time: { type: Type.STRING, description: "Hora de la cita en formato HH:MM (24h)." }, name: { type: Type.STRING, description: "Nombre del dueño." }, petName: { type: Type.STRING, description: "Nombre de la mascota." }, service: { type: Type.STRING, description: "El servicio elegido." }, phone: { type: Type.STRING, description: "Teléfono de contacto." }, address: { type: Type.STRING, description: "La dirección completa." } }, required: ["date", "time", "name", "petName", "service", "phone", "address"] } },
        { name: "navigate_to_section", description: "Navega a una sección de la página web.", parameters: { type: Type.OBJECT, properties: { sectionId: { type: Type.STRING, description: "ID de la sección (ej: 'servicios', 'ia-features')." } }, required: ["sectionId"] } },
        { name: "open_ai_tool", description: "Abre una herramienta de IA ('scanner' o 'art').", parameters: { type: Type.OBJECT, properties: { toolName: { type: Type.STRING, description: "Nombre de la herramienta." } }, required: ["toolName"] } },
        { name: "attempt_login", description: "Intenta iniciar sesión en el panel de administración.", parameters: { type: Type.OBJECT, properties: { password: { type: Type.STRING, description: "La contraseña." } }, required: ["password"] } }
    ]
}];

const adminTools: Tool[] = [{
    functionDeclarations: [
        { name: "find_client", description: "Busca un cliente por nombre o email.", parameters: { type: Type.OBJECT, properties: { name: { type: Type.STRING, description: "Nombre del cliente." }, email: { type: Type.STRING, description: "Email del cliente." } } } },
        { name: "get_client_appointments", description: "Obtiene todas las citas de un cliente específico por su ID.", parameters: { type: Type.OBJECT, properties: { clientId: { type: Type.STRING, description: "El ID del cliente." } }, required: ["clientId"] } },
        { name: "cancel_appointment", description: "Cancela una cita existente por su ID.", parameters: { type: Type.OBJECT, properties: { appointmentId: { type: Type.STRING, description: "El ID de la cita a cancelar." } }, required: ["appointmentId"] } },
        { name: "confirm_payment", description: "Confirma el pago de una cita completada por su ID.", parameters: { type: Type.OBJECT, properties: { appointmentId: { type: Type.STRING, description: "El ID de la cita para confirmar el pago." } }, required: ["appointmentId"] } },
        { name: "get_financial_summary", description: "Obtiene un resumen de los ingresos totales." },
        { name: "get_low_stock_items", description: "Obtiene una lista de los productos con bajo inventario." },
        { 
            name: "create_and_send_promotion", 
            description: "Crea y envía una campaña de marketing promocional a todos los clientes.", 
            parameters: { 
                type: Type.OBJECT, 
                properties: { 
                    title: { type: Type.STRING, description: "El título llamativo de la promoción. Ejemplo: '¡30% de Descuento en Lavados!'" },
                    description: { type: Type.STRING, description: "El texto del mensaje para el cliente, explicando la promoción." },
                    discount: { type: Type.NUMBER, description: "El porcentaje de descuento. Ejemplo: 30 para un 30%." }
                }, 
                required: ["title", "description", "discount"] 
            } 
        },
        { 
            name: "send_whatsapp_to_all_clients", 
            description: "Envía un mensaje de difusión por WhatsApp a todos los clientes registrados en el CRM.", 
            parameters: { 
                type: Type.OBJECT, 
                properties: { 
                    message: { type: Type.STRING, description: "El contenido del mensaje de WhatsApp a enviar." }
                }, 
                required: ["message"] 
            } 
        }
    ]
}];


// --- Chat Service with Function Calling ---
let chat: Chat;

export function startChat(userType: 'public' | 'admin' = 'public'): Chat {
    if (!API_KEY) throw new Error("El servicio de asistente no está disponible por falta de API_KEY.");
    
    const systemInstruction = userType === 'admin' ? adminChatbotSystemInstruction : publicChatbotSystemInstruction;
    const tools = userType === 'admin' ? adminTools : publicTools;

    chat = ai.chats.create({
        model: textModel,
        config: { systemInstruction, temperature: 0.7, tools },
    });
    return chat;
}

export async function* streamChatResponse(prompt: string, actions: AppActions) {
    if (!chat) startChat();
    
    const stream = await chat.sendMessageStream({ message: prompt });
    
    for await (const chunk of stream) {
        const functionCalls = chunk.functionCalls;

        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            const { name, args } = call;
            
            yield { type: 'tool_call', toolName: name, toolArgs: args };
            
            let toolResult: any;
            try {
                switch (name) {
                    // Public Tools
                    case "get_available_slots":
                        toolResult = await db.getAvailableSlotsForDate((args as {date: string}).date);
                        break;
                    case "book_appointment":
                        toolResult = await db.addAppointment(args as unknown as AppointmentCreationData);
                        break;
                    case "navigate_to_section":
                        actions.navigateTo((args as { sectionId: string }).sectionId);
                        toolResult = { success: true, message: `Navegando a la sección ${ (args as { sectionId: string }).sectionId}.` };
                        break;
                    case "open_ai_tool":
                        const tool = (args as { toolName: 'scanner' | 'art' }).toolName;
                        actions.openModal(tool);
                        toolResult = { success: true, message: `Abriendo el ${tool}.` };
                        break;
                    case "attempt_login":
                        const success = actions.attemptLogin((args as { password: string }).password);
                        toolResult = success 
                            ? { success: true, message: "Inicio de sesión exitoso. Redirigiendo al panel." }
                            : { success: false, error: "Contraseña incorrecta." };
                        break;
                    
                    // Admin Tools
                    case "find_client":
                        toolResult = await db.findClient(args as { name?: string, email?: string });
                        break;
                    case "get_client_appointments":
                        toolResult = await db.getAppointmentsForClient((args as { clientId: string }).clientId);
                        break;
                    case "cancel_appointment":
                        toolResult = await db.cancelAppointment((args as { appointmentId: string }).appointmentId);
                        break;
                    case "confirm_payment":
                        toolResult = await db.confirmPayment((args as { appointmentId: string }).appointmentId);
                        break;
                    case "get_financial_summary":
                        const analytics = await db.getAnalyticsData();
                        toolResult = { totalRevenue: analytics.totalRevenue };
                        break;
                     case "get_low_stock_items":
                        const inventory = await db.getInventory();
                        toolResult = inventory.filter(item => item.stock <= item.lowStockThreshold);
                        break;
                     case "create_and_send_promotion":
                        toolResult = await db.createAndSendPromotion(args as { title: string; description: string; discount: number });
                        break;
                    case "send_whatsapp_to_all_clients":
                        toolResult = await db.sendWhatsappToAllClients((args as { message: string }).message);
                        break;
                        
                    default:
                        throw new Error(`Herramienta desconocida: ${name}`);
                }
                
                const functionResponseStream = await chat.sendMessageStream(
                    { message: [{ functionResponse: { name, response: { result: toolResult } } }] }
                );

                for await (const finalChunk of functionResponseStream) {
                    yield { type: 'text', content: finalChunk.text };
                }

            } catch (error) {
                 const errorMessage = error instanceof Error ? error.message : "Error desconocido";
                 const functionResponseStream = await chat.sendMessageStream(
                     { message: [{ functionResponse: { name, response: { error: errorMessage } } }] }
                 );
                 for await (const finalChunk of functionResponseStream) {
                    yield { type: 'text', content: finalChunk.text };
                }
            }
        } else if (chunk.text) {
             yield { type: 'text', content: chunk.text };
        }
    }
}

// --- Other AI Functions ---
const getErrorMessage = (error: unknown, serviceName: string) => {
    console.error(`Error calling Gemini API for ${serviceName}:`, error);
    return `Lo siento, ha ocurrido un error de conexión con nuestros sistemas de IA. Por favor, inténtalo de nuevo más tarde.`;
};

export const identifyBreed = async (base64Image: string, mimeType: string): Promise<string> => {
    if (!API_KEY) return "El servicio de escáner no está disponible.";
    try {
        const imagePart = { inlineData: { data: base64Image, mimeType } };
        const textPart = { text: "Identifica la raza o mezcla de razas de este perro. Sé conciso y directo en tu respuesta. Si no es un perro, dilo." };

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: textModel,
            contents: { parts: [imagePart, textPart] },
        });
        return response.text;
    } catch (error) {
        return getErrorMessage(error, 'Breed Scanner');
    }
};

export const generateArt = async (base64Image: string, mimeType: string, style: string): Promise<string> => {
    if (!API_KEY) return "El servicio de arte no está disponible.";
    try {
        const imagePart = { inlineData: { data: base64Image, mimeType } };
        const descriptionPrompt = "Describe a la mascota en esta imagen en una frase corta para un generador de imágenes. Ejemplo: 'Un cachorro de golden retriever esponjoso sentado en un campo verde'.";
        const textPart = { text: descriptionPrompt };
        
        const descriptionResponse = await ai.models.generateContent({
            model: textModel,
            contents: { parts: [imagePart, textPart] },
        });
        const imagePrompt = `${descriptionResponse.text}, en el estilo de ${style}.`;

        const imageResponse = await ai.models.generateImages({
            model: imageModel,
            prompt: imagePrompt,
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '1:1' }
        });
        
        if (imageResponse.generatedImages?.length > 0) {
             return `data:image/jpeg;base64,${imageResponse.generatedImages[0].image.imageBytes}`;
        } else {
            return "No se pudo generar la imagen. Intenta con otra foto o estilo.";
        }
    } catch (error) {
        return getErrorMessage(error, 'Art Generator');
    }
};

export const getAutomatedQuote = async (company: string, email: string, units: string): Promise<string> => {
    if (!API_KEY) return "El servicio de cotización no está disponible.";
    try {
        const prompt = `Eres un asistente de ventas de 'Pet-Tech Connect'. Genera un borrador de presupuesto profesional y atractivo para un potencial socio B2B.
        - Empresa: ${company} - Email: ${email} - Unidades interesadas: ${units}
        Estructura la respuesta en HTML simple (usa <br> para saltos de línea y <strong> para negritas):
        1.  **Encabezado:** Agradece el interés.
        2.  **Resumen de la Propuesta:** Describe brevemente el valor de las estaciones de autolavado.
        3.  **Borrador de Inversión (Estimado):** Crea una lista simple con 'Concepto' y 'Costo Estimado'. Sé creativo con los números.
        4.  **Próximos Pasos:** Indica que un especialista contactará en 24-48 horas.
        5.  **Cierre:** Un cierre profesional.`;
        
        const response = await ai.models.generateContent({
            model: textModel,
            contents: prompt,
            config: { temperature: 0.5 }
        });

        return response.text;
    } catch (error) {
        return getErrorMessage(error, 'B2B Quote');
    }
};