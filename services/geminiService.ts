import { GoogleGenAI, Type } from "@google/genai";
import { StrategicInsight, JohanResponse, AppDataState, ChartData, View, InvoiceLineItem, Invoice, Customer, Product, SalesForecastResponse, ExecutiveReportData, DashboardFilter, AIFinancialForecast, Expense, Supplier, PurchaseOrder, DateRange, Promotion, MarketingCopySuggestion, TransactionRiskAnalysis, RetentionRisk, LoyaltyOffer, SuggestedReply, CreditLimitSuggestion, DuplicateInvoiceCheck, BlockchainVerification, CustomerScore, OpportunityClosePrediction, TicketSuggestion, Quote, User, SupportTicket, AIExtractedExpense, ExpenseCategory, AIPosInsight } from '../types';
import { NAVIGATION_STRUCTURE } from '../constants';
import { formatCurrency } from "../utils/formatters";

if (!process.env.API_KEY) {
  console.error("La variable de entorno API_KEY no está configurada.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// --- Caching ---
const aiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes cache

const withCache = async <T>(
    cacheKey: string,
    apiCall: () => Promise<T>,
    ttl: number = CACHE_TTL
): Promise<T> => {
    const cached = aiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < ttl) {
        return Promise.resolve(cached.data as T);
    }
    
    const result = await apiCall();
    aiCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
}

const generateContentWithRetry = async (params: any, retries = 3, delay = 1000): Promise<any> => {
    try {
        // The type for params would be GenerateContentParameters but it's not exported, so using 'any'.
        return await ai.models.generateContent(params);
    } catch (error) {
        // Robustly stringify the error to check for rate limit codes.
        // This handles plain objects, Error instances, and Error instances with custom properties.
        const errorString = JSON.stringify(error, Object.getOwnPropertyNames(error));

        if ((errorString.includes('RESOURCE_EXHAUSTED') || errorString.includes('429')) && retries > 0) {
            console.warn(`Rate limit exceeded. Retrying in ${delay}ms... (${retries} retries left)`);
            await new Promise(res => setTimeout(res, delay));
            return generateContentWithRetry(params, retries - 1, delay * 2); // Exponential backoff
        }
        // Re-throw the error if retries are exhausted or it's not a rate limit error
        throw error;
    }
};


export const analyzeInvoiceImageWithAI = async (file: File): Promise<{ accentColor: string; designDescription: string; }> => {
  const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return { inlineData: { data: await base64EncodedDataPromise, mimeType: file.type } };
  };

  const imagePart = await fileToGenerativePart(file);

  const prompt = `
    Analiza esta imagen de una factura. Tu tarea es extraer elementos de diseño clave.
    Responde ESTRICTAMENTE en el siguiente formato JSON.
    - accentColor: El color de acento principal (en formato hexadecimal, ej. #0ea5e9). Si no hay un color claro, usa un color profesional como #4f46e5.
    - designDescription: Una descripción MUY corta (máximo 15 palabras) del estilo de diseño. Ejemplos: "Diseño minimalista con enfoque en tipografía", "Estilo moderno y limpio con un logo circular".
  `;
  
  try {
    const response = await generateContentWithRetry({
      model: "gemini-2.5-flash",
      contents: { parts: [{ text: prompt }, imagePart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            accentColor: { type: Type.STRING },
            designDescription: { type: Type.STRING }
          },
          required: ["accentColor", "designDescription"]
        }
      }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);

  } catch (error) {
    console.error("Error al llamar a la API de Gemini para análisis de diseño:", error);
    const errStr = String(error);
    if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("429")) {
        throw new Error("El servicio de IA está ocupado. Por favor, inténtalo de nuevo en unos momentos.");
    }
    throw new Error("No se pudo analizar el diseño de la imagen. Intenta con una imagen más clara.");
  }
};


export const extractInvoiceDataFromDocument = async (file: File, customers: Customer[], products: Product[]): Promise<Partial<Invoice>> => {
   const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return { inlineData: { data: await base64EncodedDataPromise, mimeType: file.type } };
  };
  
  const imagePart = await fileToGenerativePart(file);
  
  const prompt = `
    Analiza este documento (orden de compra o factura) y extrae la información para crear una nueva factura.
    **Contexto de Datos del Sistema:**
    - Clientes Existentes: ${JSON.stringify(customers.map(c => ({ id: c.id, name: c.name })).slice(0, 50))}
    - Productos Existentes: ${JSON.stringify(products.map(p => ({ id: p.id, name: p.name, price: p.price })).slice(0, 100))}

    **Tu Tarea:**
    1.  **Identifica el cliente:** Busca el nombre del cliente en el documento. Si coincide con uno de los clientes existentes, usa su 'id'. Si no existe, puedes dejar el 'customerId' como nulo pero extrae el 'customerName'.
    2.  **Extrae cada línea de producto:** Para cada línea, busca el producto más similar en el catálogo. Usa su 'productId' y su 'price' de catálogo como referencia. Extrae la cantidad del documento.
    3.  **Calcula los totales:** Basado en los datos extraídos y los precios del catálogo, calcula subtotales y totales.

    **Responde ESTRICTAMENTE en el siguiente formato JSON:**
  `;

  try {
     const response = await generateContentWithRetry({
      model: "gemini-2.5-flash",
      contents: { parts: [{text: prompt}, imagePart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            customerId: { type: Type.NUMBER, nullable: true },
            customerName: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  productId: { type: Type.STRING },
                  productName: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unitPrice: { type: Type.NUMBER },
                },
                required: ["productId", "productName", "quantity", "unitPrice"],
              }
            },
          },
        },
      },
    });

    const jsonText = response.text.trim();
    const extractedData = JSON.parse(jsonText);

    let subtotal = 0;
    const processedItems: InvoiceLineItem[] = (extractedData.items || []).map((item: any) => {
        const itemSubtotal = item.quantity * item.unitPrice;
        const itemIva = itemSubtotal * 0.19;
        const itemTotal = itemSubtotal + itemIva;
        subtotal += itemSubtotal;
        return { ...item, subtotal: itemSubtotal, iva: itemIva, total: itemTotal };
    });

    const totalIva = subtotal * 0.19;
    const total = subtotal + totalIva;

    return {
      ...extractedData,
      items: processedItems,
      subtotal,
      iva: totalIva,
      total,
      status: 'borrador',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
    };

  } catch (error) {
    console.error("Error al llamar a la API de Gemini para extracción de factura:", error);
    const errStr = String(error);
    if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("429")) {
        throw new Error("El servicio de IA está ocupado. Por favor, inténtalo de nuevo en unos momentos.");
    }
    throw new Error("No se pudo analizar el documento. Intenta con una imagen más clara.");
  }
};

export const extractExpenseFromDocument = async (file: File, categories: ExpenseCategory[]): Promise<AIExtractedExpense> => {
   const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return { inlineData: { data: await base64EncodedDataPromise, mimeType: file.type } };
  };

  const imagePart = await fileToGenerativePart(file);

  const prompt = `
    Analiza este documento (recibo o factura de gasto) y extrae la información para crear un nuevo registro de gasto.
    **Contexto de Datos del Sistema:**
    - Categorías de Gastos Existentes: ${JSON.stringify(categories.map(c => ({ id: c.id, name: c.name })))}

    **Tu Tarea:**
    1.  **Identifica la categoría:** Busca el concepto del gasto en el documento y asigna la categoría más apropiada de la lista. Usa su 'id'.
    2.  **Extrae la descripción:** Obtén una descripción corta del gasto (ej. "Almuerzo ejecutivo", "Transporte aeropuerto").
    3.  **Extrae el monto total:** Identifica y extrae el valor total del gasto.
    4.  **Extrae la fecha:** Identifica y extrae la fecha del gasto en formato YYYY-MM-DD. Si no la encuentras, usa la fecha actual: ${new Date().toISOString().split('T')[0]}.

    **Responde ESTRICTAMENTE en el siguiente formato JSON:**
  `;

  try {
     const response = await generateContentWithRetry({
      model: "gemini-2.5-flash",
      contents: { parts: [{text: prompt}, imagePart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            categoryId: { type: Type.STRING },
            description: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            date: { type: Type.STRING },
          },
          required: ["categoryId", "description", "amount", "date"],
        },
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);

  } catch (error) {
    console.error("Error al llamar a la API de Gemini para extracción de gasto:", error);
    const errStr = String(error);
    if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("429")) {
        throw new Error("El servicio de IA está ocupado. Por favor, inténtalo de nuevo en unos momentos.");
    }
    throw new Error("No se pudo analizar el documento. Intenta con una imagen más clara.");
  }
};

export const getAIPosInsight = async (cartItems: InvoiceLineItem[], products: Product[]): Promise<AIPosInsight | null> => {
    if (cartItems.length === 0) return null;

    const cartProductIds = cartItems.map(item => item.productId);
    const cacheKey = `pos-insight-${cartProductIds.sort().join('-')}`;
    
    // Simple cache to prevent spamming API for the same cart
    const cached = aiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 1000 * 60) { // 1 min cache for POS
        return Promise.resolve(cached.data as AIPosInsight | null);
    }

    const prompt = `
        Eres un asistente de ventas experto en un punto de venta de una distribuidora de tecnología. Basado en los productos en el carrito, genera una sugerencia de venta (cross-sell o upsell) o un comentario de lealtad.

        **Productos en el Carrito:**
        ${JSON.stringify(cartItems.map(item => ({ name: item.productName, quantity: item.quantity })))}

        **Catálogo de Productos Disponibles (fragmento para contexto):**
        ${JSON.stringify(products.filter(p => !cartProductIds.includes(p.id)).slice(0, 50).map(p => ({ id: p.id, name: p.name, category: p.category, price: p.price })))}

        **Tu Tarea:**
        Analiza el carrito y sugiere UNA SOLA acción. Prioriza productos que complementen la compra actual.
        - Si sugieres un producto (upsell/cross_sell), incluye su \`suggestedProductId\`.
        - Si no hay una buena sugerencia de producto, ofrece un comentario de lealtad (ej. "¡Excelente elección! Este equipo es muy popular entre nuestros clientes empresariales.").

        **Responde ESTRICTAMENTE en el siguiente formato JSON. No incluyas nada más.**
    `;

    try {
        const response = await generateContentWithRetry({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        insightType: { type: Type.STRING, enum: ['upsell', 'cross_sell', 'loyalty'] },
                        message: { type: Type.STRING },
                        suggestedProductId: { type: Type.STRING, nullable: true },
                    },
                    required: ["insightType", "message"]
                }
            }
        });
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        aiCache.set(cacheKey, { data: result, timestamp: Date.now() });
        return result;
    } catch (error) {
        console.error("Error generating POS insight:", error);
        aiCache.set(cacheKey, { data: null, timestamp: Date.now() });
        return null; // Return null on error to not break the UI
    }
};


export const getJohanDashboardSynthesis = async (appState: AppDataState, filter: DashboardFilter | null, dateRange: DateRange): Promise<StrategicInsight[]> => {
    const { invoices, products, customers } = appState;
    
    const { start, end } = dateRange;

    const getPeriodData = (startDate: Date | null, endDate: Date | null, data: Invoice[]) => {
        if (!startDate || !endDate) return data.filter(i => i.status === 'pagada'); // return all if no date range
        return data.filter(i => {
            const issueDate = new Date(i.issueDate);
            return i.status === 'pagada' && issueDate >= startDate && issueDate <= endDate;
        });
    };
    
    const timeFilteredInvoices = getPeriodData(start, end, invoices);

    const filteredData = filter && filter.length > 0 ? timeFilteredInvoices.filter(invoice => {
        return filter.every(f => {
             switch (f.type) {
                case 'category':
                    return invoice.items.some(item => products.find(p => p.id === item.productId)?.category === f.value);
                case 'product':
                    return invoice.items.some(item => item.productId === f.value);
                case 'customer':
                    return invoice.customerId === f.value;
                default: return true;
            }
        });
    }) : timeFilteredInvoices;


    const previousPeriod = {
        end: start ? new Date(start.getTime() - 1) : null,
        start: start && end ? new Date(start.getTime() - (end.getTime() - start.getTime())) : null
    };

    const previousInvoices = getPeriodData(previousPeriod.start, previousPeriod.end, invoices);

    const getProductAnalytics = (invoiceSet: Invoice[]) => {
        const analytics: { [key: string]: { sales: number; revenue: number } } = {};
        invoiceSet.flatMap(i => i.items).forEach(item => {
            if (!analytics[item.productId]) analytics[item.productId] = { sales: 0, revenue: 0 };
            analytics[item.productId].sales += item.quantity;
            analytics[item.productId].revenue += item.total;
        });
        return analytics;
    };
    
    const currentAnalytics = getProductAnalytics(filteredData);
    const previousAnalytics = getProductAnalytics(previousInvoices);
    
    const trendAnalysis = Object.keys(currentAnalytics).map(productId => {
        const current = currentAnalytics[productId];
        const previous = previousAnalytics[productId] || { sales: 0, revenue: 0 };
        const salesChange = previous.sales > 0 ? ((current.sales - previous.sales) / previous.sales) * 100 : (current.sales > 0 ? Infinity : 0);
        return { productId, salesChange: salesChange.toFixed(0), currentRevenue: current.revenue };
    }).filter(p => parseFloat(p.salesChange) > 100 && p.currentRevenue > 500000);

    const topCustomersByProfit = customers.map(c => {
        const customerInvoices = filteredData.filter(i => i.customerId === c.id);
        const revenue = customerInvoices.reduce((sum, i) => sum + i.total, 0);
        const cost = customerInvoices.flatMap(i => i.items).reduce((sum, item) => {
            const product = products.find(p => p.id === item.productId);
            return sum + (product ? product.cost * item.quantity : 0);
        }, 0);
        const lastPurchase = customerInvoices.sort((a,b)=> new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())[0];
        return {
            id: c.id, name: c.name, profit: revenue - cost,
            lastPurchaseDate: lastPurchase ? new Date(lastPurchase.issueDate) : null
        };
    }).filter(c => c.profit > 0).sort((a,b) => b.profit - a.profit).slice(0, 20);

    const vipCustomersAtRisk = topCustomersByProfit.filter(c => {
        if (!c.lastPurchaseDate) return false;
        const daysSinceLastPurchase = (new Date().getTime() - c.lastPurchaseDate.getTime()) / (1000 * 3600 * 24);
        return daysSinceLastPurchase > 25;
    });
    
    const filterClause = filter && filter.length > 0 
        ? `El usuario está aplicando un filtro específico: ${filter.map(f => `${f.type}: ${f.label}`).join(', ')}.`
        : "Estás analizando el rendimiento general del negocio.";

    const dateClause = start && end 
        ? `El análisis se centra en el período de ${start.toLocaleDateString('es-CO')} a ${end.toLocaleDateString('es-CO')}.`
        : `El análisis abarca todo el historial de datos.`;


    const prompt = `
        Actúas como "Johan", un consultor de estrategia de McKinsey para un supermercado. Tu análisis es de élite, anticipatorio y siempre cuantifica el impacto.
        **Contexto del Análisis:** ${filterClause} ${dateClause}
        
        **Contexto Analítico Pre-procesado:**
        - **Tendencias Emergentes (Comparativo de período):** ${JSON.stringify(trendAnalysis.slice(0, 3))}
        - **Clientes VIP en Riesgo de Fuga:** ${JSON.stringify(vipCustomersAtRisk.slice(0, 3))}

        **Tu Misión:**
        Genera 2-3 estrategias de alto impacto basadas EXCLUSIVAMENTE en el contexto proporcionado.
        
        **Formatos de Insight REQUERIDOS:**
        1.  **TENDENCIA EMERGENTE:**
            - **Disparador:** Un producto con crecimiento de ventas significativo.
            - **Formato:** { "type": "trend", "title": "Tendencia Emergente: [Nombre Producto]", "summary": "Las ventas de este producto se han disparado. Es crucial asegurar el stock y capitalizar esta demanda creciente.", "kpi": "+[salesChange]% vs período anterior", "financialImpact": "[currentRevenue] en ventas recientes", "action": { "type": "view_product", "payload": "[ID_PRODUCTO]", "label": "Ver Producto y Stock" } }

        2.  **CLIENTE VIP EN RIESGO:**
            - **Disparador:** Un cliente de alta rentabilidad que no ha comprado recientemente.
            - **Formato:** { "type": "anomaly", "title": "Cliente VIP en Riesgo: [Nombre Cliente]", "summary": "Este es uno de tus clientes más rentables y no ha comprado en más de 25 días. Una llamada proactiva podría reactivar la relación.", "urgency": "high", "financialImpact": "Cliente de alto valor", "action": { "type": "view_customer", "payload": "[ID_CLIENTE]", "label": "Ver Perfil del Cliente" } }
            
        **Reglas Finales:**
        - Si no hay tendencias o clientes en riesgo, genera un insight general de "suggestion".
        - Responde ESTRICTAMENTE en el formato JSON especificado. Todas las respuestas en español.
    `;
    
    try {
        const response = await generateContentWithRetry({
            model: "gemini-2.5-flash", contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    insights: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          type: { type: Type.STRING }, title: { type: Type.STRING }, summary: { type: Type.STRING },
                          kpi: { type: Type.STRING, nullable: true }, financialImpact: { type: Type.STRING, nullable: true },
                          urgency: { type: Type.STRING, nullable: true },
                           action: { 
                                type: Type.OBJECT, nullable: true,
                                properties: { type: { type: Type.STRING }, payload: { type: Type.STRING }, label: { type: Type.STRING }, },
                                required: ["type", "payload", "label"]
                           },
                        }, required: ["type", "title", "summary"]
                      }
                    }
                  }
                }
            }
        });
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        
        return (result.insights || []).map((insight: any) => {
            if (insight.action?.type === 'view_product') {
                const product = products.find(p => p.id === insight.action.payload);
                if (product) {
                    const trend = trendAnalysis.find(t => t.productId === product.id);
                    insight.title = insight.title.replace('[Nombre Producto]', product.name);
                    if (trend) {
                        insight.kpi = insight.kpi.replace('[salesChange]', trend.salesChange);
                        insight.financialImpact = `~${formatCurrency(Number(trend.currentRevenue))} en ventas recientes`;
                    }
                }
            }
            if (insight.action?.type === 'view_customer') {
                 const customerId = Number(insight.action.payload);
                 const customer = customers.find(c => c.id === customerId);
                if (customer) insight.title = insight.title.replace('[Nombre Cliente]', customer.name);
            }
            return insight;
        });

    } catch (error) {
        const errorMessage = String(error);
        if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('429')) {
            console.warn("Se ha excedido la cuota de la API de Gemini (Síntesis de Dashboard). No se generarán nuevas ideas estratégicas temporalmente.");
            return [];
        }
        
        console.error("Error de Síntesis de Johan:", error);
        return [{
            type: 'insight',
            title: "Error de Síntesis Estratégica",
            summary: "No pude conectar con mi núcleo estratégico. La visibilidad está comprometida, se recomienda supervisión manual de indicadores clave.",
            urgency: 'high'
        } as StrategicInsight];
    }
}

export const generatePersonalizedInvoiceNote = async (invoice: Invoice): Promise<string> => {
    const cacheKey = `note-${invoice.id}`;
    return withCache(cacheKey, async () => {
        const prompt = `Escribe una nota de agradecimiento muy corta y amigable para la factura de ${invoice.customerName}, haciendo referencia a uno de los productos que compró: ${invoice.items[0]?.productName}.`;
        try {
            const response = await generateContentWithRetry({ model: "gemini-2.5-flash", contents: prompt });
            return response.text.trim();
        } catch (e) {
            console.error("Error generating personalized note", e);
            return `¡Gracias por tu compra, ${invoice.customerName}!`;
        }
    });
};

export const generateSmartReminderText = async (invoice: Invoice): Promise<string> => { 
    const prompt = `Basado en esta factura pendiente ${JSON.stringify(invoice)}, genera un recordatorio de pago MUY corto, amigable y profesional para enviar por WhatsApp.`;
    try {
        const response = await generateContentWithRetry({ model: "gemini-2.5-flash", contents: prompt });
        return response.text.trim();
    } catch(e) {
        console.error(e);
        return `Hola ${invoice.customerName}, te recordamos amablemente que tu factura ${invoice.id} por un total de ${formatCurrency(invoice.total)} está pendiente. ¡Gracias!`;
    }
}

export const processJohanCommand = async (query: string, file: File | null, context: AppDataState): Promise<JohanResponse> => {
    
    const today = new Date();

    // Get the most recent data without pre-filtering by date. The model will handle filtering.
    const recentInvoices = [...context.invoices].sort((a,b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()).slice(0, 200);
    const recentPurchaseOrders = [...context.purchaseOrders].sort((a,b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()).slice(0, 100);
    const recentExpenses = [...context.expenses].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 100);
    
    let prompt = `
        Actúas como "Johan", un asistente de IA experto en contabilidad y análisis de negocios, con acceso total a los datos del ERP. Eres proactivo, preciso y tu objetivo es ser el mejor asistente contable y financiero posible, capaz de responder cualquier pregunta sobre la operación.

        **Fecha Actual:** ${today.toISOString().split('T')[0]}

        **Consulta del Usuario:** ${JSON.stringify(query)}
        
        **Tu Tarea Principal (3 Pasos):**
        1.  **Interpreta el Rango de Fechas:** Analiza la "Consulta del Usuario". Si menciona un período (ej. "ayer", "últimos 15 días", "este mes", "agosto"), determina las fechas de inicio y fin. Si no se menciona, asume los últimos 30 días desde la "Fecha Actual".
        2.  **Filtra y Analiza los Datos:** Usa el rango de fechas que determinaste para filtrar mentalmente los "Datos Completos del ERP" que se proporcionan a continuación. Realiza todos tus cálculos y análisis BASÁNDOTE ÚNICAMENTE en los datos que caen dentro de ese período.
        3.  **Responde al Usuario:** Basado en tu análisis de los datos filtrados, responde la consulta del usuario. Genera gráficos, texto o comandos según sea necesario.

        **Datos Completos del ERP (Datos sin filtrar, debes filtrarlos tú mismo):**
        - Facturas Recientes: ${JSON.stringify(recentInvoices)}
        - Órdenes de Compra Recientes: ${JSON.stringify(recentPurchaseOrders)}
        - Gastos Recientes: ${JSON.stringify(recentExpenses)}
        - Catálogo de Productos: ${JSON.stringify(context.products.slice(0, 200))}
        - Lista de Clientes: ${JSON.stringify(context.customers.slice(0, 200))}
        - Lista de Proveedores: ${JSON.stringify(context.suppliers)}
        - Categorías de Gastos: ${JSON.stringify(context.expenseCategories)}

        **Vistas Disponibles para Navegación (usa el 'id' para el comando 'navigate'):**
        ${NAVIGATION_STRUCTURE.flatMap(s => s.groups.flatMap(g => g.links)).map(l => `- ${l.label}: '${l.id}'`).join('\n')}
        
        **Reglas:**
        - Si te preguntan por un desglose (ej. "desglose de gastos operativos"), debes analizar la lista de 'Gastos Recientes' DENTRO DEL PERÍODO DE TIEMPO RELEVANTE, agruparlos por categoría y presentar un resumen.
        - Responde ESTRICTAMENTE en el formato JSON especificado por el schema. Todo en español.
    `;

    try {
        if (file) {
             prompt += "\n**Nota Adicional:** El usuario ha adjuntado un archivo. Informa que has recibido el archivo, pero que la capacidad de análisis de documentos está en desarrollo y no puedes procesarlo en este momento."
        }

        const response = await generateContentWithRetry({
            model: "gemini-2.5-flash",
            contents: { parts: [{ text: prompt }] },
             config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        command: {
                            type: Type.OBJECT,
                            nullable: true,
                            properties: {
                                name: { type: Type.STRING },
                                payload: { 
                                    type: Type.OBJECT,
                                    properties: {
                                        view: { type: Type.STRING, nullable: true },
                                        report_name: { type: Type.STRING, nullable: true },
                                        invoiceId: { type: Type.STRING, nullable: true },
                                        format: { type: Type.STRING, nullable: true },
                                    }
                                 }
                            },
                            required: ["name", "payload"]
                        },
                        parts: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    type: { type: Type.STRING },
                                    content: { type: Type.STRING, nullable: true },
                                    question: { type: Type.STRING, nullable: true },
                                    title: { type: Type.STRING, nullable: true },
                                    summary: { type: Type.STRING, nullable: true },
                                    chartType: { type: Type.STRING, nullable: true },
                                    description: { type: Type.STRING, nullable: true },
                                    data: {
                                        type: Type.OBJECT,
                                        nullable: true,
                                        properties: {
                                            labels: { type: Type.ARRAY, items: { type: Type.STRING } },
                                            datasets: {
                                                type: Type.ARRAY,
                                                items: {
                                                    type: Type.OBJECT,
                                                    properties: {
                                                        label: { type: Type.STRING },
                                                        data: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                                                    },
                                                    required: ["label", "data"]
                                                }
                                            }
                                        },
                                        required: ["labels", "datasets"]
                                    }
                                },
                                required: ["type"]
                            }
                        }
                    },
                    required: ["parts"]
                }
            }
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error al procesar el comando de Johan:", error);
        const errStr = String(error);
        if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("429")) {
             return { parts: [{ type: 'text', content: "Mis circuitos están sobrecargados. Por favor, intenta de nuevo en un momento." }] };
        }
        return { parts: [{ type: 'text', content: "Tuve un problema procesando tu solicitud. ¿Podrías intentarlo de nuevo?" }] };
    }
};


export const generateProductDescription = async (productName: string, category: string): Promise<string> => {
    const prompt = `Genera una descripción de producto atractiva y concisa (máximo 25 palabras) para un producto de papelería llamado "${productName}" en la categoría "${category}". Enfócate en los beneficios para el cliente.`;
    try {
        const response = await generateContentWithRetry({ model: "gemini-2.5-flash", contents: prompt });
        return response.text.trim().replace(/"/g, ''); // Remove quotes
    } catch (error) {
        console.error("Error generating product description", error);
        return "Descripción detallada del producto.";
    }
};

export const getSalesForecast = async (productId: string, appState: AppDataState): Promise<SalesForecastResponse> => {
    const product = appState.products.find(p => p.id === productId);
    if (!product) throw new Error("Producto no encontrado");

    const salesHistory = appState.invoices
        .filter(i => i.status === 'pagada')
        .flatMap(i => i.items.map(item => ({...item, date: i.issueDate})))
        .filter(item => item.productId === productId)
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(item => ({ date: item.date, quantity: item.quantity }));
    
    const prompt = `
        Actúas como un analista de demanda para una papelería.
        **Datos de Entrada:**
        - Producto: ${product.name}
        - Historial de ventas (últimos 90 días): ${JSON.stringify(salesHistory.slice(-90))}
        - Stock actual: ${Object.values(product.stockByWarehouse).reduce((s,q)=>s+q,0)}
        - Precio: ${product.price}, Costo: ${product.cost}

        **Tu Tarea:**
        1.  **Proyección:** Genera una proyección de ventas (unidades) para los próximos 7 días.
        2.  **Análisis:** Proporciona un breve análisis de la tendencia de ventas.
        3.  **Recomendación:** Basado en el stock actual y la proyección, da una recomendación clara sobre si se debe reabastecer el producto.

        **Formato de Salida JSON Estricto:**
    `;
    
    try {
        const response = await generateContentWithRetry({
            model: "gemini-2.5-flash", contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        forecast: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: { day: { type: Type.NUMBER }, predicted_sales: { type: Type.NUMBER } },
                                required: ["day", "predicted_sales"]
                            }
                        },
                        analysis: { type: Type.STRING },
                        recommendation: { type: Type.STRING }
                    },
                    required: ["forecast", "analysis", "recommendation"]
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error al generar el pronóstico de ventas:", error);
         const errStr = String(error);
        if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("429")) {
             throw new Error("El servicio de IA está ocupado. Por favor, inténtalo de nuevo en unos momentos.");
        }
        throw new Error("No se pudo generar el pronóstico de ventas.");
    }
};

export const getExecutiveReport = async (appState: AppDataState): Promise<ExecutiveReportData> => {
    const { invoices, products, customers, expenses } = appState;
    const today = new Date();
    const last30Days = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30);

    const recentInvoices = invoices.filter(i => new Date(i.issueDate) >= last30Days && i.status === 'pagada');
    const recentRevenue = recentInvoices.reduce((sum, i) => sum + i.total, 0);
    const recentCOGS = recentInvoices.flatMap(i => i.items).reduce((sum, item) => sum + (products.find(p => p.id === item.productId)?.cost || 0) * item.quantity, 0);
    const recentProfit = recentRevenue - recentCOGS;
    const topProduct = Object.entries(recentInvoices.flatMap(i=>i.items).reduce((acc, item) => { acc[item.productName] = (acc[item.productName] || 0) + item.total; return acc; }, {} as Record<string, number>)).sort((a,b)=>b[1]-a[1])[0];
    const topCustomer = Object.entries(recentInvoices.reduce((acc, i) => { acc[i.customerName!] = (acc[i.customerName!] || 0) + i.total; return acc; }, {} as Record<string, number>)).sort((a,b)=>b[1]-a[1])[0];
    const accountsReceivable = invoices.filter(i => i.status === 'pendiente' || i.status === 'vencida').reduce((sum, i) => sum + i.total, 0);
    const inventoryValue = products.reduce((sum, p) => sum + p.cost * Object.values(p.stockByWarehouse).reduce((s, v) => s + v, 0), 0);

    const prompt = `
        Eres Johan, un Director Financiero (CFO) de IA. Tu tarea es generar un informe ejecutivo conciso y estratégico para el gerente de una distribuidora de papelería.
        
        **Datos Clave (últimos 30 días, a menos que se indique lo contrario):**
        - Ingresos: ${recentRevenue}
        - Ganancia Bruta: ${recentProfit}
        - Producto con más ventas: ${topProduct?.[0]} (${topProduct?.[1]})
        - Cliente con más compras: ${topCustomer?.[0]} (${topCustomer?.[1]})
        - Cuentas por Cobrar (Total): ${accountsReceivable}
        - Valor del Inventario (Total): ${inventoryValue}

        **Tu Misión:**
        Analiza los datos y genera un informe en formato JSON que contenga:
        1.  \`executive_summary\`: Un párrafo corto (2-3 frases) que resuma la salud general del negocio.
        2.  \`kpis\`: Un array de 4 KPIs clave extraídos directamente de los datos.
        3.  \`strengths\`: Un array de 2 fortalezas notables basadas en los datos.
        4.  \`weaknesses\`: Un array de 2 debilidades o áreas de preocupación.
        5.  \`recommendations\`: Un array de 2 recomendaciones estratégicas y accionables.

        **Formato de Salida Estricto (JSON):**
    `;

    try {
        const response = await generateContentWithRetry({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        executive_summary: { type: Type.STRING },
                        kpis: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, value: { type: Type.STRING } }, required: ["title", "value"] } },
                        strengths: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, detail: { type: Type.STRING } }, required: ["title", "detail"] } },
                        weaknesses: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, detail: { type: Type.STRING } }, required: ["title", "detail"] } },
                        recommendations: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, detail: { type: Type.STRING } }, required: ["title", "detail"] } }
                    },
                    required: ["executive_summary", "kpis", "strengths", "weaknesses", "recommendations"]
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error al generar el informe ejecutivo:", error);
        const errStr = String(error);
        if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("429")) {
            throw new Error("El servicio de IA está ocupado. Por favor, inténtalo de nuevo en unos momentos.");
        }
        throw new Error("No se pudo generar el informe ejecutivo.");
    }
};

export const getAIFinancialForecast = async (appState: AppDataState): Promise<AIFinancialForecast> => {
    const { invoices, expenses } = appState;

    const monthlyData: Record<string, { income: number; expenses: number }> = {};
    
    invoices.filter(i => i.status === 'pagada').forEach(i => {
        const monthKey = i.issueDate.substring(0, 7); // YYYY-MM
        if (!monthlyData[monthKey]) monthlyData[monthKey] = { income: 0, expenses: 0 };
        monthlyData[monthKey].income += i.total;
    });

    expenses.forEach(e => {
        const monthKey = e.date.substring(0, 7); // YYYY-MM
        if (!monthlyData[monthKey]) monthlyData[monthKey] = { income: 0, expenses: 0 };
        monthlyData[monthKey].expenses += e.amount;
    });
    
    const sortedMonths = Object.keys(monthlyData).sort().slice(-6); // Last 6 months
    const historicalData = sortedMonths.map(key => ({ month: key, ...monthlyData[key] }));
    const avgMonthlyIncome = historicalData.reduce((sum, d) => sum + d.income, 0) / historicalData.length || 0;
    const avgMonthlyExpenses = historicalData.reduce((sum, d) => sum + d.expenses, 0) / historicalData.length || 0;

    const totalIncome = invoices.filter(i => i.status === 'pagada').reduce((sum, i) => sum + i.total, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const currentCashBalance = totalIncome - totalExpenses;
    
    const prompt = `
        Eres un analista financiero de IA. Tu tarea es crear una proyección de flujo de caja simplificada para los próximos 3 meses.
        
        **Datos Históricos y Actuales:**
        - Saldo de caja actual estimado: ${currentCashBalance}
        - Promedio de ingresos mensuales (últimos 6 meses): ${avgMonthlyIncome}
        - Promedio de gastos mensuales (últimos 6 meses): ${avgMonthlyExpenses}

        **Tu Misión:**
        1.  **Proyección (\`forecast\`):** Crea un array para los próximos 3 meses. Para cada mes, calcula \`cash_in\`, \`cash_out\`, \`net_flow\`, y \`end_balance\`. Asume que los ingresos y gastos serán similares al promedio histórico.
        2.  **Análisis (\`analysis\`):** Escribe un análisis corto (2 frases) sobre la salud del flujo de caja proyectado.
        3.  **Recomendaciones (\`recommendations\`):** Proporciona un array de 2 recomendaciones accionables para mejorar el flujo de caja.

        **Formato de Salida Estricto (JSON):**
    `;

     try {
        const response = await generateContentWithRetry({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        forecast: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    month: { type: Type.STRING },
                                    cash_in: { type: Type.NUMBER },
                                    cash_out: { type: Type.NUMBER },
                                    net_flow: { type: Type.NUMBER },
                                    end_balance: { type: Type.NUMBER },
                                },
                                required: ["month", "cash_in", "cash_out", "net_flow", "end_balance"]
                            }
                        },
                        analysis: { type: Type.STRING },
                        recommendations: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: { title: { type: Type.STRING }, detail: { type: Type.STRING } },
                                required: ["title", "detail"]
                            }
                        }
                    },
                    required: ["forecast", "analysis", "recommendations"]
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error al generar el pronóstico financiero:", error);
        const errStr = String(error);
        if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("429")) {
            throw new Error("El servicio de IA está ocupado. Por favor, inténtalo de nuevo en unos momentos.");
        }
        throw new Error("No se pudo generar el pronóstico financiero.");
    }
};

export const generatePromotionCopy = async (promotion: Promotion, products: Product[]): Promise<MarketingCopySuggestion[]> => {
    const target = promotion.targetType === 'product'
        ? `el producto "${products.find(p => p.id === promotion.targetValue)?.name || 'seleccionado'}"`
        : `la categoría "${promotion.targetValue}"`;

    const prompt = `
        Eres un copywriter experto en marketing para retail.
        **Promoción:** "${promotion.name}" - ${promotion.description}. Aplica a ${target}.
        **Tu Tarea:** Genera 3 textos de marketing cortos y persuasivos, uno para cada canal, con el objetivo de impulsar ventas.
        **Canales:** SMS, Redes Sociales (Instagram/Facebook), Email Subject.
        **Formato de Salida Estricto (JSON):**
    `;
    
    try {
        const response = await generateContentWithRetry({
            model: "gemini-2.5-flash", contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggestions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: { channel: { type: Type.STRING }, copy: { type: Type.STRING }},
                                required: ["channel", "copy"]
                            }
                        }
                    },
                    required: ["suggestions"]
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText).suggestions;
    } catch (error) {
        console.error("Error al generar copia de marketing:", error);
        throw new Error("No se pudo generar la copia de marketing.");
    }
};

export const analyzeCustomerLoyalty = async (customer: Customer, invoices: Invoice[]): Promise<{ risk: RetentionRisk; offer?: LoyaltyOffer; }> => {
    const cacheKey = `loyalty-${customer.id}`;
    return withCache(cacheKey, async () => {
        const customerInvoices = invoices.filter(i => i.customerId === customer.id).sort((a,b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
        if (customerInvoices.length === 0) {
            return { risk: { level: 'Bajo', reason: 'Nuevo cliente sin historial de compras.' }};
        }

        const lastPurchaseDate = new Date(customerInvoices[0].issueDate);
        const daysSinceLastPurchase = Math.floor((new Date().getTime() - lastPurchaseDate.getTime()) / (1000 * 3600 * 24));
        const totalSpent = customerInvoices.reduce((sum, i) => sum + i.total, 0);
        const purchaseFrequency = customerInvoices.length;

        const prompt = `
            Actúas como un especialista en retención de clientes para una distribuidora de papelería.
            **Datos del Cliente:**
            - Nombre: ${customer.name}
            - Días desde la última compra: ${daysSinceLastPurchase}
            - Gasto total histórico: ${totalSpent}
            - Frecuencia de compra (Nº facturas): ${purchaseFrequency}
            
            **Tu Tarea:**
            1.  **Analiza el riesgo de fuga (\`risk\`):** Basado en los datos, determina el nivel de riesgo ('Bajo', 'Medio', 'Alto') y proporciona una razón concisa. Un cliente que no ha comprado en más de 60 días es de alto riesgo. Un cliente frecuente con una compra reciente es de bajo riesgo.
            2.  **Crea una oferta de lealtad (\`offer\`):** Si el riesgo es 'Medio' o 'Alto', crea una oferta personalizada para incentivar una nueva compra. La oferta debe ser relevante y atractiva. Si el riesgo es 'Bajo', no generes una oferta.

            **Formato de Salida Estricto (JSON):**
        `;

        try {
            const response = await generateContentWithRetry({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            risk: {
                                type: Type.OBJECT,
                                properties: {
                                    level: { type: Type.STRING },
                                    reason: { type: Type.STRING }
                                },
                                required: ["level", "reason"]
                            },
                            offer: {
                                type: Type.OBJECT,
                                properties: {
                                    offerTitle: { type: Type.STRING },
                                    offerDetails: { type: Type.STRING }
                                },
                                required: ["offerTitle", "offerDetails"],
                                nullable: true
                            }
                        },
                        required: ["risk"]
                    }
                }
            });
            const jsonText = response.text.trim();
            return JSON.parse(jsonText);
        } catch (error) {
            console.error("Error al analizar la lealtad del cliente:", error);
            throw new Error("No se pudo realizar el análisis de lealtad.");
        }
    });
};

export const getJohanSupplierAnalysis = async (supplier: Supplier, purchaseOrders: PurchaseOrder[], products: Product[]): Promise<StrategicInsight[]> => {
    const cacheKey = `supplier-${supplier.id}`;

    return withCache(cacheKey, async () => {
        const supplierPOs = purchaseOrders.filter(po => po.supplierId === supplier.id && po.status !== 'borrador');
        if (supplierPOs.length < 2) {
            return [{ type: 'insight', title: 'Nueva Relación Comercial', summary: 'Este es un proveedor relativamente nuevo. Es un buen momento para establecer una buena comunicación y monitorear la calidad de los primeros pedidos.' }];
        }

        const totalValue = supplierPOs.reduce((sum, po) => sum + po.total, 0);
        const topProducts = Object.entries(supplierPOs.flatMap(po => po.items).reduce((acc, item) => {
            acc[item.productName] = (acc[item.productName] || 0) + item.total;
            return acc;
        }, {} as Record<string, number>)).sort((a, b) => b[1] - a[1]).slice(0, 3);
        
        const lowStockProductsFromSupplier = products.filter(p => {
            // A simple heuristic to link product to supplier if it's in their main category
            const productFromThisSupplier = purchaseOrders.some(po => po.supplierId === supplier.id && po.items.some(i => i.productId === p.id));
            const stockLevel = Object.values(p.stockByWarehouse).reduce((sum, q) => sum + q, 0);
            return productFromThisSupplier && stockLevel < 20;
        }).slice(0, 2);

        const prompt = `
            Eres Johan, un analista de cadena de suministro. Tu tarea es generar 2-3 insights estratégicos sobre la relación con un proveedor.
            **Datos del Proveedor:**
            - Nombre: ${supplier.name}
            - Valor total comprado: ${totalValue}
            - Top productos comprados: ${JSON.stringify(topProducts)}
            - Productos de este proveedor con bajo stock: ${JSON.stringify(lowStockProductsFromSupplier.map(p => p.name))}

            **Tu Misión:**
            Genera un array de 2-3 insights en formato JSON.
            - **Tipo de Insight:** Usa 'suggestion' para oportunidades (ej. negociar descuentos), 'anomaly' para riesgos (ej. bajo stock), o 'trend' para observaciones de patrones.
            - **Sé Accionable:** El \`summary\` debe ser claro y directo.
            
            **Formato de Salida Estricto (JSON):**
        `;

        try {
            const response = await generateContentWithRetry({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            insights: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        type: { type: Type.STRING },
                                        title: { type: Type.STRING },
                                        summary: { type: Type.STRING }
                                    },
                                    required: ["type", "title", "summary"]
                                }
                            }
                        },
                        required: ["insights"]
                    }
                }
            });
            const jsonText = response.text.trim();
            return JSON.parse(jsonText).insights;
        } catch (error) {
            console.error("Error al analizar el proveedor:", error);
            throw new Error("No se pudo generar el análisis del proveedor.");
        }
    });
};

export const generateSuggestedReplyForCustomer = async (customer: Customer, topic: string): Promise<SuggestedReply> => {
    const prompt = `
        Actúas como un asistente de servicio al cliente experto y amigable para una distribuidora de papelería.
        **Contexto del Cliente:**
        - Nombre: ${customer.name}
        - Historial de pago: ${customer.paymentBehavior || 'nuevo'}

        **Consulta del Cliente (Tema):** "${topic}"

        **Tu Tarea:**
        Genera una respuesta profesional y útil para el cliente. La respuesta debe ser un borrador de correo electrónico.
        - **Asunto (\`subject\`):** Debe ser claro y conciso, ej. "Respuesta a tu consulta sobre la factura".
        - **Cuerpo (\`body\`):** Debe ser amigable, saludar al cliente por su nombre, abordar el tema y ofrecer ayuda.

        **Formato de Salida Estricto (JSON):**
    `;
    try {
        const response = await generateContentWithRetry({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        subject: { type: Type.STRING },
                        body: { type: Type.STRING }
                    },
                    required: ["subject", "body"]
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error al generar la respuesta sugerida:", error);
        throw new Error("No se pudo generar la respuesta sugerida.");
    }
};

export const analyzeTransactionRisk = async (invoice: Partial<Invoice>, customer: Customer | undefined): Promise<TransactionRiskAnalysis> => {
    // Create a cache key based on the transaction details. Prevents re-analyzing the same transaction if saved multiple times quickly.
    const cacheKey = `risk-${customer?.id}-${invoice.total}-${invoice.items?.length}`;
    
    return withCache(cacheKey, async () => {
        const prompt = `
          Eres un analista de fraude para una distribuidora de papelería. Analiza esta transacción y determina su nivel de riesgo.
          
          **Contexto de la Transacción:**
          - Cliente: ${customer ? `ID: ${customer.id}, Nombre: ${customer.name}, Historial de pago: ${customer.paymentBehavior || 'nuevo'}` : 'Consumidor Final / Cliente Nuevo'}
          - Total de la Factura: ${invoice.total}
          - Número de Ítems: ${invoice.items?.length}
          - Ítems (muestra): ${JSON.stringify(invoice.items?.slice(0, 3).map(i => i.productName))}
          - Método de Pago: ${invoice.paymentMethod}
    
          **Tu Tarea:**
          Evalúa el riesgo de la transacción como 'Bajo', 'Medio', o 'Alto'. Considera estos factores:
          - **Monto Alto:** Transacciones > 2,000,000 COP son de mayor riesgo, especialmente para clientes nuevos ('Consumidor Final' o con historial 'nuevo').
          - **Cliente Nuevo:** La primera compra de un cliente, si es de alto valor, incrementa el riesgo.
          - **Método de Pago:** 'Contra Entrega' para montos altos es más riesgoso. 'Transferencia' o 'Tarjeta' son más seguros.
    
          **Responde ESTRICTAMENTE en el siguiente formato JSON:**
        `;
    
        try {
          const response = await generateContentWithRetry({
              model: "gemini-2.5-flash", contents: prompt,
              config: {
                  responseMimeType: "application/json",
                  responseSchema: {
                      type: Type.OBJECT,
                      properties: {
                          riskLevel: { type: Type.STRING, enum: ['Bajo', 'Medio', 'Alto'] },
                          reason: { type: Type.STRING },
                          recommendation: { type: Type.STRING }
                      },
                      required: ["riskLevel", "reason", "recommendation"]
                  }
              }
          });
          const jsonText = response.text.trim();
          return JSON.parse(jsonText);
        } catch(e) {
          console.error("Error analyzing transaction risk", e);
          const errorString = JSON.stringify(e, Object.getOwnPropertyNames(e));
          if (errorString.includes('RESOURCE_EXHAUSTED') || errorString.includes('429')) {
             return { riskLevel: 'Bajo', reason: 'Análisis de IA ocupado. Reintente más tarde.', recommendation: 'Proceder con precaución estándar.' };
          }
          // Return a default low-risk assessment on other errors to avoid blocking transactions.
          return { riskLevel: 'Bajo', reason: 'Análisis de IA no disponible en este momento.', recommendation: 'Proceder con precaución estándar.' };
        }
    });
};

export const suggestCreditLimitForCustomer = async (customer: Customer, invoices: Invoice[]): Promise<CreditLimitSuggestion> => {
    const cacheKey = `credit-limit-${customer.id}`;
    return withCache(cacheKey, async () => {
        const prompt = `
            Eres un analista de crédito de IA. Tu tarea es sugerir un límite de crédito para un cliente B2B de una distribuidora de tecnología.

            **Contexto del Cliente:**
            - Cliente: ${JSON.stringify(customer)}
            - Historial de Facturas (resumen): ${JSON.stringify(invoices.map(i => ({ status: i.status, total: i.total, issueDate: i.issueDate, dueDate: i.dueDate, paymentDate: i.paymentDate })))}

            **Tu Misión:**
            Analiza el historial de compras, la puntualidad en los pagos y el volumen. Determina un límite de crédito razonable.
            - **Clientes nuevos ('new'):** Empieza con un límite conservador (ej. 5,000,000 COP).
            - **Clientes puntuales ('on_time'):** Premia con un límite más alto, considera el valor promedio de sus facturas.
            - **Clientes con retrasos ('late'):** Mantén o reduce el límite, justifica la decisión en el riesgo.
            
            **Responde ESTRICTAMENTE en el siguiente formato JSON:**
        `;
        try {
            const response = await generateContentWithRetry({
                model: "gemini-2.5-flash", contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            limit: { type: Type.NUMBER },
                            reason: { type: Type.STRING }
                        },
                        required: ["limit", "reason"]
                    }
                }
            });
            const jsonText = response.text.trim();
            return JSON.parse(jsonText);
        } catch (e) {
            console.error("Error suggesting credit limit", e);
            return { limit: 0, reason: "No se pudo generar una sugerencia de crédito debido a un error del sistema." };
        }
    });
};

export const checkDuplicateInvoice = async (newInvoice: Partial<Invoice>, existingInvoices: Invoice[]): Promise<DuplicateInvoiceCheck> => {
    const prompt = `
        Eres un sistema de validación de datos. Tu tarea es determinar si una nueva factura es un posible duplicado de una existente para el mismo cliente.

        **Nueva Factura:**
        - Fecha: ${newInvoice.issueDate}
        - Total: ${newInvoice.total}

        **Facturas Existentes del Mismo Cliente:**
        ${JSON.stringify(existingInvoices.map(i => ({ id: i.id, issueDate: i.issueDate, total: i.total })))}

        **Tu Misión:**
        Compara la nueva factura con las existentes. Una factura es un 'posible duplicado' si existe otra para el mismo cliente con un total similar ( +/- 5% de diferencia) y una fecha muy cercana (+/- 3 días).

        **Responde ESTRICTAMENTE en el siguiente formato JSON:**
    `;

    try {
        const response = await generateContentWithRetry({
            model: "gemini-2.5-flash", contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isDuplicate: { type: Type.BOOLEAN },
                        reason: { type: Type.STRING }
                    },
                    required: ["isDuplicate", "reason"]
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (e) {
        console.error("Error checking for duplicate invoice", e);
        // Default to not a duplicate to avoid blocking the user
        return { isDuplicate: false, reason: "El servicio de verificación de duplicados no está disponible." };
    }
};

export const verifyInvoiceOnBlockchain = async (invoiceId: string): Promise<BlockchainVerification> => {
    // This is a simulation. In a real application, this would interact with a smart contract.
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                hash: '0x' + [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
                timestamp: new Date().toISOString(),
                status: 'verified'
            });
        }, 1500); // Simulate network latency
    });
};

// --- New CRM AI Services ---

export const calculateCustomerScore = async (customer: Customer, invoices: Invoice[]): Promise<CustomerScore> => {
    const prompt = `
        Eres un analista de CRM. Tu tarea es calificar a un cliente de 1 a 100 basado en su valor para el negocio.
        
        **Contexto del Cliente:**
        - Cliente: ${JSON.stringify(customer)}
        - Resumen de Facturas: ${JSON.stringify(invoices.map(i => ({ total: i.total, status: i.status, issueDate: i.issueDate })))}

        **Tu Misión:**
        Analiza el historial de compras (frecuencia y valor), la puntualidad de pago y el tiempo como cliente.
        - **Clientes VIP:** Altos volúmenes de compra, pagos puntuales -> Score > 85.
        - **Clientes Promedio:** Compras consistentes, pagos normales -> Score 50-84.
        - **Clientes en Riesgo:** Compras esporádicas, pagos tardíos -> Score < 50.
        
        Proporciona una puntuación y una razón concisa para tu evaluación.
        
        **Responde ESTRICTAMENTE en el siguiente formato JSON:**
    `;
    try {
        const response = await generateContentWithRetry({
            model: "gemini-2.5-flash", contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: { score: { type: Type.NUMBER }, reason: { type: Type.STRING } },
                    required: ["score", "reason"]
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (e) {
        console.error("Error calculating customer score", e);
        return { score: 50, reason: "Análisis de IA no disponible." };
    }
};

export const predictOpportunityCloseProbability = async (quote: Quote, customerInvoices: Invoice[]): Promise<OpportunityClosePrediction> => {
    const prompt = `
        Eres un experto en ventas B2B. Predice la probabilidad de cierre para la siguiente oportunidad de venta.
        
        **Datos de la Oportunidad (Cotización):**
        - ${JSON.stringify(quote)}
        
        **Historial del Cliente (Facturas Anteriores):**
        - ${JSON.stringify(customerInvoices.map(i => ({ total: i.total, status: i.status })))}

        **Tu Misión:**
        Analiza el valor de la cotización, la etapa actual del pipeline y el historial de compras del cliente.
        - **Etapas avanzadas ('Negociación'):** Mayor probabilidad.
        - **Clientes con historial de compras grandes:** Mayor probabilidad.
        - **Valores muy altos en cotización:** Pueden tener menor probabilidad si se desvían del promedio del cliente.

        Proporciona una probabilidad de cierre (0-100) y una razón concisa.
        
        **Responde ESTRICTAMENTE en el siguiente formato JSON:**
    `;
    try {
        const response = await generateContentWithRetry({
            model: "gemini-2.5-flash", contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: { probability: { type: Type.NUMBER }, reason: { type: Type.STRING } },
                    required: ["probability", "reason"]
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (e) {
        console.error("Error predicting opportunity probability", e);
        return { probability: 50, reason: "Análisis de IA no disponible." };
    }
};

export const suggestTicketPriorityAndAgent = async (ticket: Partial<SupportTicket>, agents: User[]): Promise<TicketSuggestion> => {
    const prompt = `
        Eres un coordinador de soporte técnico. Tu tarea es asignar un nuevo ticket.
        
        **Datos del Ticket:**
        - Asunto: "${ticket.subject}"
        - Descripción: "${ticket.description}"
        
        **Agentes Disponibles:**
        - ${JSON.stringify(agents.map(a => ({ id: a.id, name: a.name })))}

        **Tu Misión:**
        1.  **Determina la Prioridad:** Analiza el texto. Palabras como "urgente", "no funciona", "caído" implican prioridad 'Alta'. Consultas generales son 'Baja'.
        2.  **Asigna un Agente:** Asigna el ticket a uno de los agentes disponibles de forma balanceada.
        
        **Responde ESTRICTAMENTE en el siguiente formato JSON:**
    `;
     try {
        const response = await generateContentWithRetry({
            model: "gemini-2.5-flash", contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        priority: { type: Type.STRING, enum: ['Baja', 'Media', 'Alta'] },
                        agentId: { type: Type.STRING }
                    },
                    required: ["priority", "agentId"]
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (e) {
        console.error("Error suggesting ticket priority/agent", e);
        return { priority: 'Media', agentId: agents[0]?.id || '' };
    }
};