import React, { useState, useEffect, useRef, useCallback } from 'react';
import { JohanIcon, MicrophoneIcon, CloseIcon, PaperAirplaneIcon, StopIcon } from './Icons';
import { AppDataState, JohanState, ChatMessage, JohanResponse, JohanCommand, StrategicInsight } from '../types';
import { processJohanCommand } from '../services/geminiService';
import SimpleChart from './SimpleChart';

interface JohanAIChatProps {
  isOpen: boolean;
  onClose: () => void;
  appContext: AppDataState;
  onCommand: (command: JohanCommand) => void;
}

const ThinkingIndicator: React.FC = () => (
  <div className="flex items-start gap-3 justify-start animate-fade-in">
    <JohanIcon className="h-7 w-7 text-primary-500 flex-shrink-0" />
    <div className="w-fit max-w-sm p-4 rounded-2xl bg-gray-200 dark:bg-neutral-800 flex items-center space-x-2">
      <div className="h-2 w-2 bg-gray-400 dark:bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="h-2 w-2 bg-gray-400 dark:bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="h-2 w-2 bg-gray-400 dark:bg-neutral-400 rounded-full animate-bounce"></div>
    </div>
  </div>
);

const JohanAIChat: React.FC<JohanAIChatProps> = ({ isOpen, onClose, appContext, onCommand }) => {
  const [johanState, setJohanState] = useState<JohanState>('idle');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const synth = window.speechSynthesis;
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
        setMessages([{
            id: 0,
            sender: 'johan',
            response: { parts: [{ type: 'text', content: 'Soy Johan. ¿En qué puedo ayudarte?' }] }
        }]);
    }
  }, [isOpen, messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputText]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, johanState]);

  const speak = useCallback((text: string, onEnd: () => void) => {
    if (synth.speaking) synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.pitch = 0.95;
    utterance.rate = 1.1;
    utterance.onstart = () => setJohanState('speaking');
    utterance.onend = onEnd;
    synth.speak(utterance);
  }, [synth]);

  const processAndRespond = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: query }]);
    setJohanState('thinking');
    
    try {
        const response: JohanResponse = await processJohanCommand(query, null, appContext);
        
        if (response.command) {
            onCommand(response.command);
        }

        setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'johan', response }]);
        
        const textToSpeak = (response.parts || [])
          .filter(p => p.type === 'text' || p.type === 'question' || p.type === 'insight')
          .map(p => {
            if (p.type === 'text') return p.content;
            if (p.type === 'question') return p.question;
            if (p.type === 'insight') return `${p.title}. ${p.summary}`;
            return '';
          }).join(' ');
        
        if(textToSpeak.trim()) {
            speak(textToSpeak, () => setJohanState('idle'));
        } else {
            setJohanState('idle');
        }

    } catch (error) {
        console.error("Error procesando comando de Johan:", error);
        const errorText = "He encontrado una anomalía. Por favor, intenta de nuevo.";
        setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'johan', response: { parts: [{ type: 'text', content: errorText }] }}]);
        speak(errorText, () => setJohanState('idle'));
    }
  }, [appContext, speak, onCommand]);
  
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.warn("Speech recognition not supported in this browser.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'es-CO';
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript.trim()) {
            processAndRespond(transcript.trim());
        }
    };

    recognition.onend = () => {
        setJohanState('idle');
    };
    
    recognition.onerror = (event: any) => {
      console.error('Error de reconocimiento de voz:', event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setRecognitionError('Acceso al micrófono denegado. Revisa los permisos del navegador.');
      } else if (event.error === 'no-speech') {
        setRecognitionError('No se detectó voz. Inténtalo de nuevo.');
      } else {
        setRecognitionError('Ocurrió un error con el reconocimiento de voz.');
      }
      setJohanState('idle');
    };

    recognitionRef.current = recognition;
  }, [processAndRespond]);

  const handleSendText = useCallback(() => {
    if (inputText.trim()) {
      processAndRespond(inputText.trim());
      setInputText('');
    }
  }, [inputText, processAndRespond]);

  const handleListen = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) {
        setRecognitionError("El reconocimiento de voz no es compatible con este navegador.");
        return;
    }
    
    setRecognitionError(null);

    if (johanState === 'speaking' || synth.speaking) {
      synth.cancel();
      setJohanState('idle');
      return;
    }
    
    if (johanState === 'listening') {
      recognition.stop();
      return;
    }
    
    if (johanState !== 'idle') return;

    setJohanState('listening');
    try {
        recognition.start();
    } catch(e) {
        console.error("No se pudo iniciar el reconocimiento de voz", e);
        setRecognitionError("No se pudo iniciar el micrófono. Asegúrate de haber dado permiso.");
        setJohanState('idle');
    }
  }, [johanState, synth]);
  
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendText();
    }
  };
  
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (synth.speaking) {
      synth.cancel();
      setJohanState('idle');
    }
    setInputText(e.target.value);
    setRecognitionError(null);
  }, [synth]);

  useEffect(() => {
    if (!isOpen) {
        synth.cancel();
        if (recognitionRef.current && johanState === 'listening') {
            recognitionRef.current.abort();
        }
        setJohanState('idle');
        setRecognitionError(null);
    }
  }, [isOpen, synth, johanState]);

  const renderJohanPart = (part: JohanResponse['parts'][0], index: number) => {
    switch (part.type) {
        case 'text':
            return <p key={index}>{part.content}</p>
        case 'chart':
            return <div key={index} className="bg-gray-100 dark:bg-neutral-800 rounded-lg p-3 my-2 border border-gray-200 dark:border-neutral-700">
                <h4 className="font-bold text-primary-600 dark:text-primary-400 mb-2">{part.title}</h4>
                <SimpleChart chartData={part} />
            </div>;
        case 'insight':
            const insightPart = part as StrategicInsight;
            return <div key={index} className="p-3 bg-gray-100 dark:bg-neutral-800 rounded-lg my-2 border-l-4 border-primary-500">
                <h4 className="font-bold text-primary-700 dark:text-primary-400">{insightPart.title}</h4>
                <p className="mt-2 text-sm text-gray-700 dark:text-neutral-300">{insightPart.summary}</p>
            </div>;
        case 'question':
            return <p key={index} className="font-medium italic text-gray-800 dark:text-neutral-100">{part.question}</p>;
        default:
            return null;
    }
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-500 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className={`w-[400px] h-[600px] max-h-[80vh] bg-gray-50 dark:bg-neutral-900/80 dark:backdrop-blur-sm rounded-2xl shadow-2xl flex flex-col border border-gray-200 dark:border-neutral-800 overflow-hidden transform-gpu transition-transform duration-500 ${isOpen ? 'translate-y-0' : 'translate-y-10'}`}>
          <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <JohanIcon className="h-7 w-7 text-primary-500" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Johan</h3>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-800 dark:hover:text-white transition rounded-full p-1"><CloseIcon className="h-6 w-6" /></button>
          </div>

          <main className="flex-grow overflow-y-auto p-4 space-y-6">
            {messages.map(msg => (
              <div key={msg.id} className={`flex items-start gap-3 w-full animate-slide-in-up ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'johan' && <JohanIcon className="h-7 w-7 text-primary-500 flex-shrink-0" />}
                <div className={`w-fit max-w-xs p-3.5 rounded-2xl ${msg.sender === 'user' ? 'bg-primary-600 text-white rounded-br-none' : 'bg-white dark:bg-neutral-800 text-gray-800 dark:text-neutral-100 rounded-bl-none shadow-sm'}`}>
                  {msg.sender === 'user' && <p>{msg.text}</p>}
                  {msg.sender === 'johan' && msg.response && <div className="space-y-1">{(msg.response.parts || []).map(renderJohanPart)}</div>}
                </div>
              </div>
            ))}
            {johanState === 'thinking' && <ThinkingIndicator />}
            <div ref={messagesEndRef} />
          </main>

          <div className="flex-shrink-0 p-3 bg-gray-100/50 dark:bg-black/20 border-t border-gray-200 dark:border-neutral-800">
              {recognitionError && (
                  <div className="text-center text-xs text-red-500 pb-2">{recognitionError}</div>
              )}
              <div className="relative flex items-end gap-2">
                <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={handleTextareaKeyDown}
                    placeholder={johanState === 'listening' ? 'Escuchando...' : 'Escribe tu consulta...'}
                    rows={1}
                    className="w-full bg-white dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-neutral-400 rounded-xl py-3 pl-4 pr-24 resize-none focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all duration-200 max-h-32 border border-gray-200 dark:border-neutral-700"
                    disabled={johanState === 'thinking' || johanState === 'speaking'}
                />
                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                  <button
                    onClick={handleListen}
                    className={`p-2 rounded-full transition-colors ${johanState === 'speaking' ? 'bg-accent text-white' : 'hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-500 dark:text-neutral-300'}`}
                    aria-label={johanState === 'speaking' ? 'Detener' : 'Usar micrófono'}
                  >
                    {johanState === 'speaking' ? <StopIcon className="h-5 w-5" /> : <MicrophoneIcon className={`h-5 w-5 ${johanState === 'listening' ? 'text-primary-500 animate-pulse' : ''}`}/>}
                  </button>
                  <button 
                    onClick={handleSendText}
                    disabled={!inputText.trim() || johanState !== 'idle'}
                    className="p-2 bg-primary-600 text-white rounded-full transition-all duration-200 enabled:hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Enviar mensaje"
                  >
                    <PaperAirplaneIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default JohanAIChat;
