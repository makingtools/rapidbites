
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { CartItem, MenuItem, CustomizationOptionChoice, CustomizationType } from '../types';

import { ChatBubbleLeftRightIcon } from './icons/ChatBubbleLeftRightIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { SendIcon } from './icons/SendIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { SpeakerWaveIcon } from './icons/SpeakerWaveIcon';
import { SpeakerXMarkIcon } from './icons/SpeakerXMarkIcon';
import { CheckoutDetails } from '../PublicApp';

// --- Types for AI Interaction ---
interface ActionButton {
    label: string;
    action: string; // The message to send to the AI when clicked
}

interface Message {
    role: 'user' | 'model';
    text: string;
    actions?: ActionButton[];
}

// --- Web Speech API Setup ---
interface SpeechRecognitionEvent extends Event {
    results: { length: number;[index: number]: { [index: number]: { transcript: string; } } }
}
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
if (recognition) {
    recognition.continuous = false;
    recognition.lang = 'es-US';
    recognition.interimResults = false;
}

// --- System Instruction for the AI ---
const SYSTEM_INSTRUCTION = `You are "RapidBites AI", an advanced conversational agent that has full control over the restaurant's web application. Your goal is to provide a seamless, interactive experience, allowing the user to do everything from browsing the menu to completing an order, all through conversation.

**Core Directives:**
1.  **Be Concise:** Your text responses MUST be short, clear, and direct.
2.  **Output JSON:** EVERY response you generate MUST contain a single, valid JSON object that the application will parse.
3.  **Drive the Conversation:** Guide the user step-by-step. Don't ask for everything at once.
4.  **Use the Knowledge Base:** You have been provided with a comprehensive 'backend-architecture.json'. This is your primary source of truth for the restaurant's operational capabilities, payment methods, etc. Use it to answer questions about HOW the system works.
5.  **Use Real-Time Context:** You will also receive the current menu and the user's shopping cart with every prompt. Use this to provide accurate, up-to-date information on products and the current order.

**JSON Response Structure:**
Your entire response must be a JSON object with the following structure:
{
  "message": "The text to display to the user.",
  "action": { "type": "ACTION_TYPE", ...other_props },
  "quick_actions": [ { "label": "Button Text", "action": "Text to send if button is clicked" } ] // (Optional)
}

**Action Types (\`action.type\`):**
- **DISPLAY_MESSAGE**: Simply display a message. Use for greetings, confirmations, or answers.
- **CUSTOMIZE_ITEM**: Start the process of customizing an item.
    - Props: \`itemId\`, \`customizationState\` (object to track selections).
- **ADD_TO_CART**: Add a fully configured item to the cart.
    - Props: \`itemId\` (number), \`quantity\` (number), \`customizations\` (object), \`totalPrice\` (number).
- **CHECKOUT**: Start the checkout flow.
    - Props: \`checkoutState\` (object to track collected checkout details).
- **COMPLETE_ORDER**: Finalize the order.
    - Props: \`checkoutDetails\` (a complete CheckoutDetails object).
- **OPEN_CART**: Instruct the app to open the cart sidebar.
- **CLEAR_CART**: Instruct the app to clear the cart.

**Example: Customizing an Item**
1.  User says "I want a burger".
2.  You see the burger is customizable. You respond with the first option.
    \`\`\`json
    {
      "message": "¡Claro! Empecemos a personalizar tu hamburguesa. ¿Qué tamaño prefieres?",
      "action": { "type": "CUSTOMIZE_ITEM", "itemId": 1, "customizationState": {} },
      "quick_actions": [
        { "label": "Sencilla", "action": "quiero sencilla" },
        { "label": "Doble (+$4.00)", "action": "la quiero doble" }
      ]
    }
    \`\`\`
3.  User clicks "Doble". The app sends "la quiero doble" back to you.
4.  You update the internal state and ask the next question, including the previous selection in the state.
    \`\`\`json
    {
      "message": "Perfecto, doble. ¿Quieres añadir algún extra?",
      "action": { "type": "CUSTOMIZE_ITEM", "itemId": 1, "customizationState": { "Tamaño": {"name": "Doble", "priceModifier": 4.00} } },
      "quick_actions": [
        { "label": "Tocino", "action": "con tocino" },
        { "label": "Aguacate", "action": "con aguacate" },
        { "label": "Sin extras", "action": "sin extras" }
      ]
    }
    \`\`\`
5.  ...and so on, until the item is fully configured and you use the \`ADD_TO_CART\` action.

**Example: Checkout Flow**
1. User says "checkout".
2. You start the checkout flow by asking for the name.
   \`\`\`json
   {
     "message": "¡Perfecto! Vamos a finalizar tu compra. ¿A nombre de quién es el pedido?",
     "action": { "type": "CHECKOUT", "checkoutState": {} }
   }
   \`\`\`
3. User provides name. You ask for address next.
   \`\`\`json
   {
     "message": "Entendido. ¿Cuál es la dirección de entrega?",
     "action": { "type": "CHECKOUT", "checkoutState": { "name": "Juan Perez" } }
   }
   \`\`\`
4. Continue this for all required fields (address, phone, payment, tip).
5. Once all info is collected, use the \`COMPLETE_ORDER\` action.`;

// --- Component Props ---
interface AIChatProps {
    cartItems: CartItem[];
    menuItems: MenuItem[];
    onAddToCart: (item: CartItem) => void;
    onPlaceOrder: (details: CheckoutDetails) => void;
    onOpenCart: () => void;
    onClearCart: () => void;
}

export const AIChat: React.FC<AIChatProps> = ({ cartItems, menuItems, onAddToCart, onPlaceOrder, onOpenCart, onClearCart }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    
    const [knowledgeBase, setKnowledgeBase] = useState<any>(null);

    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // Fetch Knowledge Base and Initialize Chat
    useEffect(() => {
        if (!process.env.API_KEY) return;
        
        fetch('/backend-architecture.json')
            .then(res => res.json())
            .then(data => setKnowledgeBase(data))
            .catch(err => console.error("Failed to load AI knowledge base:", err));

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        chatRef.current = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
            }
        });
        
        setMessages([{ role: 'model', text: '¡Hola! Soy tu asistente de RapidBites. Puedo tomar tu pedido, personalizarlo y procesar tu pago. ¿Qué se te antoja hoy?' }]);
    }, []);

    // Scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const speak = useCallback((text: string) => {
        if (isMuted || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        window.speechSynthesis.speak(utterance);
    }, [isMuted]);

    // Main message handler
    const handleSendMessage = useCallback(async (messageText: string) => {
        if (!messageText.trim() || isLoading || !chatRef.current) return;
        
        const text = messageText.trim();
        setInput('');
        setIsLoading(true);
        setMessages(prev => [...prev, { role: 'user', text }]);
        
        const simplifiedCart = cartItems.map(item => ({ name: item.menuItem.name, quantity: item.quantity, totalPrice: item.totalPrice }));
        const simplifiedMenu = menuItems.map(item => ({ id: item.id, name: item.name, price: item.price, category: item.category, customizable: !!item.customizableOptions?.length }));
        const dynamicContext = `CONTEXTO:\n- KNOWLEDGE_BASE: ${JSON.stringify(knowledgeBase)}\n- MENU: ${JSON.stringify(simplifiedMenu)}\n- CART: ${JSON.stringify(simplifiedCart)}\n\nCONVERSATION_HISTORY:\n${messages.map(m => `${m.role}: ${m.text}`).join('\n')}\n\nUSER_REQUEST: "${text}"`;

        let responseText = '';
        try {
            const response: GenerateContentResponse = await chatRef.current.sendMessage({ message: dynamicContext });
            responseText = response.text.trim();
            
            const aiResponse = JSON.parse(responseText);
            const { message: aiMessage, action, quick_actions } = aiResponse;

            // Perform app actions based on AI response
            if (action) {
                switch(action.type) {
                    case 'ADD_TO_CART': {
                        const menuItem = menuItems.find(m => m.id === action.itemId);
                        if (menuItem) {
                            const newCartItem: CartItem = {
                                id: `${action.itemId}-${Date.now()}`,
                                menuItem: menuItem,
                                quantity: action.quantity,
                                customizations: action.customizations,
                                totalPrice: action.totalPrice
                            };
                            onAddToCart(newCartItem);
                        } else {
                            console.error(`AI tried to add item with invalid ID: ${action.itemId}`);
                            const errorMsg = { role: 'model' as const, text: "Lo siento, no pude encontrar ese artículo en nuestro menú. ¿Podrías intentar con otro?" };
                            setMessages(prev => [...prev, errorMsg]);
                            speak(errorMsg.text);
                        }
                        break;
                    }
                    case 'COMPLETE_ORDER':
                        onPlaceOrder(action.checkoutDetails as CheckoutDetails);
                        break;
                    case 'OPEN_CART':
                        onOpenCart();
                        break;
                    case 'CLEAR_CART':
                        onClearCart();
                        break;
                }
            }
            
            setMessages(prev => [...prev, { role: 'model', text: aiMessage, actions: quick_actions }]);
            speak(aiMessage);

        } catch (error) {
            console.error("Error parsing AI response:", error, "Raw response:", responseText);
            const errorMessage = "Lo siento, tuve un problema. Por favor, intenta de nuevo o con otras palabras.";
            setMessages(prev => [...prev, { role: 'model', text: errorMessage }]);
            speak(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, speak, cartItems, menuItems, knowledgeBase, messages, onAddToCart, onPlaceOrder, onOpenCart, onClearCart]);

    // --- Speech Recognition Logic ---
    useEffect(() => {
        if (!recognition) return;
        const handleResult = (event: SpeechRecognitionEvent) => {
            const transcript = event.results[event.results.length - 1][0].transcript;
            setInput(transcript); // Set input for user feedback
            handleSendMessage(transcript); // Send the message immediately
        };
        const handleEnd = () => setIsListening(false);
        recognition.addEventListener('result', handleResult);
        recognition.addEventListener('end', handleEnd);
        return () => {
            recognition.removeEventListener('result', handleResult);
            recognition.removeEventListener('end', handleEnd);
        };
    }, [handleSendMessage]);

    const toggleListening = () => {
        if (!recognition) return;
        if (isListening) {
            recognition.stop();
        } else {
            window.speechSynthesis.cancel();
            recognition.start();
            setIsListening(true);
        }
    };
    
    // --- Render Logic ---
    if (!process.env.API_KEY) return null;
    
    return (
        <>
            <button onClick={() => setIsModalOpen(true)} className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all transform hover:scale-110 z-40" aria-label="Abrir chat de IA">
                <ChatBubbleLeftRightIcon className="h-8 w-8" />
            </button>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center sm:items-center animate-fade-in">
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg h-[90vh] sm:h-[80vh] flex flex-col transform transition-transform duration-300 animate-slide-up">
                        <div className="p-4 border-b flex justify-between items-center bg-light rounded-t-2xl">
                            <h2 className="text-xl font-display font-bold text-dark">Asistente IA</h2>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setIsMuted(!isMuted)} className="text-gray-500 hover:text-primary p-1">
                                    {isMuted ? <SpeakerXMarkIcon className="w-6 h-6" /> : <SpeakerWaveIcon className="w-6 h-6" />}
                                </button>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-primary p-1">
                                    <XMarkIcon className="w-7 h-7" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-grow overflow-y-auto p-4 space-y-4">
                            {messages.map((msg, index) => (
                                <div key={index} className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-secondary flex-shrink-0"></div>}
                                        <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.role === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-gray-200 text-dark rounded-bl-none'}`}>
                                            <p className="text-sm">{msg.text}</p>
                                        </div>
                                    </div>
                                    {msg.actions && msg.actions.length > 0 && (
                                        <div className="flex flex-wrap gap-2 ml-10">
                                            {msg.actions.map((action, i) => (
                                                <button key={i} onClick={() => handleSendMessage(action.action)} className="px-3 py-1.5 bg-accent text-white text-sm font-semibold rounded-full hover:bg-teal-500 transition-colors">
                                                    {action.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex items-end gap-2 justify-start">
                                    <div className="w-8 h-8 rounded-full bg-secondary flex-shrink-0"></div>
                                    <div className="max-w-xs md:max-w-md p-3 rounded-2xl bg-gray-200 text-dark rounded-bl-none">
                                        <div className="flex items-center gap-1.5 p-1">
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></span>
                                            <span style={{animationDelay: '100ms'}} className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></span>
                                            <span style={{animationDelay: '200ms'}} className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 border-t bg-light rounded-b-2xl">
                            <div className="flex items-center gap-2 bg-white rounded-full p-1 border">
                                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(input)} placeholder="Escribe o habla..." className="flex-grow bg-transparent p-2 focus:outline-none text-dark" disabled={isLoading || isListening}/>
                                {recognition && (
                                <button onClick={toggleListening} className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 text-primary hover:bg-gray-300'}`} aria-label={isListening ? 'Detener' : 'Hablar'} disabled={isLoading}>
                                    <MicrophoneIcon className="w-6 h-6" />
                                </button>
                                )}
                                <button onClick={() => handleSendMessage(input)} className="bg-primary text-white p-2 rounded-full disabled:bg-gray-400 transition-colors" disabled={!input.trim() || isLoading} aria-label="Enviar">
                                    <SendIcon className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};