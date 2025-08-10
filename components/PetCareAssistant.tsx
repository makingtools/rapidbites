import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, AppActions } from '../types';
import * as geminiService from '../services/geminiService';
import * as speechService from '../speechService';
import { BrandIcon, SparklesIcon } from '../constants';
import { useI18n, Language } from '../i18n';

interface PetCareAssistantProps {
    onClose: () => void;
    appActions: AppActions;
    userType?: 'public' | 'admin';
}

const PetCareAssistant: React.FC<PetCareAssistantProps> = ({ onClose, appActions, userType = 'public' }) => {
    const { t, language } = useI18n();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const chatInstanceRef = useRef<any>(null);

    // Effect to initialize or reset chat based on userType
    useEffect(() => {
        chatInstanceRef.current = geminiService.startChat(userType);
        resetChat(userType);
        inputRef.current?.focus();
    }, [userType]);

    // Save messages to localStorage
    useEffect(() => {
        if (userType === 'public') {
            const savedMessages = localStorage.getItem('pet-tech-chat');
            if(savedMessages && savedMessages.length > 2) { // >2 to avoid just welcome msg
                 setMessages(JSON.parse(savedMessages));
            }
        }
    }, []); // Only on mount for public

    useEffect(() => {
        if (userType === 'public') {
            localStorage.setItem('pet-tech-chat', JSON.stringify(messages));
        }
    }, [messages, userType]);


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);
    
    const resetChat = (currentUserType: 'public' | 'admin') => {
        const welcomeKey = currentUserType === 'admin' ? 'ai.chat.welcome_message_admin' : 'ai.chat.welcome_message';
        const initialMessage: ChatMessage = { 
            id: 'init-' + Date.now(),
            sender: 'bot', 
            text: t(welcomeKey)
        };
        setMessages([initialMessage]);
        chatInstanceRef.current = geminiService.startChat(currentUserType);
        if(isVoiceEnabled) speechService.speak(initialMessage.text, language);
    }
    
    const getToolCallMessage = (toolName: string): string => {
        switch (toolName) {
            case 'book_appointment':
                return t('ai.chat.tool_call_booking');
            case 'get_available_slots':
                return t('ai.chat.tool_call_availability');
            default:
                return t('ai.chat.tool_call_generic');
        }
    };


    const handleSend = async (text: string) => {
        if (!text.trim() || isLoading) return;

        const userMessage: ChatMessage = { id: 'user-' + Date.now(), sender: 'user', text };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        speechService.cancel(); // Stop any current speech on new send

        let fullBotResponse = '';
        let botMessageId = 'bot-' + Date.now();
        let botMessageIndex = -1;
        let sentenceBufferForSpeech = ''; // For sentence-by-sentence speech

        try {
            const stream = geminiService.streamChatResponse(text, appActions);
            for await (const chunk of stream) {
                if (chunk.type === 'tool_call') {
                    const toolMessage: ChatMessage = {
                        id: 'tool-' + Date.now(),
                        sender: 'bot',
                        state: 'tool_code',
                        text: getToolCallMessage(chunk.toolName)
                    };
                    setMessages(prev => [...prev, toolMessage]);
                } else if (chunk.type === 'text') {
                    fullBotResponse += chunk.content;
                    sentenceBufferForSpeech += chunk.content;

                    // Update UI with streaming text
                    if (botMessageIndex === -1) {
                         const newBotMessage: ChatMessage = { id: botMessageId, sender: 'bot', text: fullBotResponse };
                         setMessages(prev => {
                            botMessageIndex = prev.length;
                            return [...prev, newBotMessage];
                         });
                    } else {
                        setMessages(prev => prev.map(msg => msg.id === botMessageId ? {...msg, text: fullBotResponse} : msg));
                    }

                    // Speak sentence by sentence
                    // Split by punctuation followed by a space. The lookbehind keeps the delimiter.
                    const sentences = sentenceBufferForSpeech.split(/(?<=[.?!])\s+/);
                    if (sentences.length > 1) {
                        for (let i = 0; i < sentences.length - 1; i++) {
                            const sentenceToSpeak = sentences[i].trim();
                            if (sentenceToSpeak && isVoiceEnabled) {
                                speechService.speak(sentenceToSpeak, language);
                            }
                        }
                        sentenceBufferForSpeech = sentences[sentences.length - 1];
                    }
                }
            }
            
            // Speak any remaining text in the buffer after the stream ends
            if (isVoiceEnabled && sentenceBufferForSpeech.trim()) {
                speechService.speak(sentenceBufferForSpeech.trim(), language);
            }

        } catch (error) {
            const errorText = t('ai.chat.error_message');
            const errorMessage: ChatMessage = { id: 'error-' + Date.now(), sender: 'bot', text: errorText, state: 'error' };
            setMessages(prev => [...prev, errorMessage]);
            if (isVoiceEnabled) speechService.speak(errorText, language);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };
    
    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSend(input);
        setInput('');
    }

    const handleMicClick = async () => {
        if (isListening) {
            speechService.stopListening();
            setIsListening(false);
            return;
        }
        speechService.cancel();
        setIsListening(true);
        try {
            const transcript = await speechService.startListening(language);
            setInput(transcript);
            if (transcript) {
                 handleSend(transcript);
                 setInput('');
            }
        } catch (error) {
            console.error("Speech recognition error:", error);
        } finally {
            setIsListening(false);
        }
    };
    
    const toggleVoice = () => {
        setIsVoiceEnabled(!isVoiceEnabled);
        if (isVoiceEnabled) { 
            speechService.cancel();
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        speechService.cancel();
        setInput(e.target.value);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg h-[85vh] md:h-[80vh] flex flex-col animate-pop-in">
                <header className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-800 text-white rounded-t-2xl">
                    <div className="flex items-center space-x-3">
                         <SparklesIcon className="h-8 w-8 text-cyan-400" />
                         <h2 className="text-xl font-bold">{t('ai.chat.title')}</h2>
                    </div>
                    <div className="flex items-center space-x-2">
                         <button onClick={() => resetChat(userType)} title={t('ai.chat.new_chat')} className="p-1.5 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>
                        </button>
                        <button onClick={toggleVoice} title={isVoiceEnabled ? t('ai.chat.mute') : t('ai.chat.unmute')} className={`p-1.5 rounded-full hover:bg-slate-700 transition-colors ${isVoiceEnabled ? 'text-white' : 'text-slate-400'}`}>
                            {isVoiceEnabled ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5.78 3.22a.75.75 0 00-1.06 1.06L8.94 8.5H6.25a.75.75 0 000 1.5h.51l-1.64 1.64A2.5 2.5 0 004.5 14v.5a.75.75 0 001.5 0v-.5a1 1 0 011-1h.34l5.61 5.61a.75.75 0 001.06-1.06l-10-10zM14.5 14a1 1 0 01-1-1v-1.56l-1.94-1.94v3a.75.75 0 001.5 0v-.5a2.5 2.5 0 00-2.5-2.5h-.51l-1-1H10a.75.75 0 000-1.5h.72l-1-1h-.97a2.5 2.5 0 00-2.5 2.5v.5a.75.75 0 001.5 0v-.5a1 1 0 011-1h.28l1.03-1.03-.51-.51a.75.75 0 00-1.06 1.06l.51.51-1.64 1.64A2.5 2.5 0 006.5 8v-.5a.75.75 0 00-1.5 0v.5a4 4 0 004 4h.5a4 4 0 004-4v-1.56l-2.5-2.5v6.06a2.5 2.5 0 01-2.5 2.5z"/></svg>
                            : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1 1 0 011 1v1.586l6.293 6.293a1 1 0 01-1.414 1.414L15 12.414V13a5 5 0 01-10 0v-1.586l-1.293-1.293a1 1 0 011.414-1.414L6 9.414V4a1 1 0 011-1h3zm-1 6a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            }
                        </button>
                        <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </header>
                <main className="flex-1 p-4 overflow-y-auto bg-slate-100">
                    <div className="space-y-4">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.sender === 'bot' && (
                                    <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white flex-shrink-0">
                                        <BrandIcon className="w-5 h-5"/>
                                    </div>
                                )}
                                <div className={`flex items-center gap-2 max-w-xs md:max-w-md p-3 rounded-2xl shadow-sm ${
                                    msg.sender === 'user' 
                                        ? 'bg-indigo-600 text-white rounded-br-lg' 
                                        : msg.state === 'tool_code' 
                                        ? 'bg-slate-200 text-slate-600 italic rounded-bl-lg'
                                        : msg.state === 'error'
                                        ? 'bg-rose-100 text-rose-800 rounded-bl-lg'
                                        : 'bg-white text-slate-800 rounded-bl-lg'
                                }`}>
                                    {msg.state === 'tool_code' && 
                                        <svg className="w-4 h-4 text-slate-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    }
                                    <p className="whitespace-pre-wrap animate-fade-in">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                         {isLoading && messages[messages.length - 1]?.sender === 'user' && (
                            <div className="flex items-start gap-3 justify-start">
                                 <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white flex-shrink-0">
                                    <BrandIcon className="w-5 h-5"/>
                                </div>
                                <div className="p-3 rounded-2xl shadow-sm bg-white text-slate-800 rounded-bl-lg">
                                    <div className="flex items-center justify-center gap-1.5">
                                        <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </main>
                <footer className="p-4 bg-white border-t border-slate-200 rounded-b-2xl">
                    <form onSubmit={handleFormSubmit} className="flex items-center space-x-2">
                        <button type="button" onClick={handleMicClick} className={`p-3 rounded-full transition-colors ${isListening ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0a5 5 0 01-5 5a.75.75 0 01-.75-.75V9.5a.75.75 0 011.5 0v1.43A3.5 3.5 0 0112.5 14a.75.75 0 010 1.5A5.002 5.002 0 007 10a1 1 0 10-2 0a7.001 7.001 0 006 6.93V17.5a.75.75 0 01-1.5 0V14.93z" clipRule="evenodd" /></svg>
                        </button>
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={handleInputChange}
                            placeholder={t('ai.chat.placeholder')}
                            className="w-full bg-slate-100 p-3 rounded-full border-2 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-0 outline-none transition-colors"
                        />
                         <button type="submit" disabled={!input.trim() || isLoading} className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                        </button>
                    </form>
                </footer>
            </div>
        </div>
    );
};

export default PetCareAssistant;