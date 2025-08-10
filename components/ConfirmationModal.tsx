import React from 'react';
import { CloseIcon, ExclamationCircleIcon } from './Icons';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmation-title"
        >
            <div 
                className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md m-4 animate-slide-in-up"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 flex items-start">
                    <div className="flex-shrink-0 mr-4">
                        <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <ExclamationCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                    </div>
                    <div className="flex-grow">
                        <h2 id="confirmation-title" className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{message}</p>
                    </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 dark:bg-neutral-800/50 rounded-b-2xl flex justify-end gap-4">
                     <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 text-gray-800 dark:text-gray-100 font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-600 transition"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition shadow-md"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;