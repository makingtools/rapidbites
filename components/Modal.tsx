import React from 'react';
import { CloseIcon } from './Icons';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title: string;
    size?: 'lg' | '5xl' | '7xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title, size = 'lg' }) => {
    if (!isOpen) return null;

    const sizeClass = 
        size === '7xl' ? 'max-w-7xl' :
        size === '5xl' ? 'max-w-5xl' : 'max-w-lg';

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center animate-fade-in"
            onClick={onClose}
        >
            <div 
                className={`bg-white dark:bg-neutral-900 rounded-lg shadow-2xl w-full ${sizeClass} m-4 animate-slide-in-up max-h-[90vh] flex flex-col`}
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b border-slate-200 dark:border-neutral-800 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition">
                        <CloseIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;