import React from 'react';
import { ThumbUpIcon, ThumbDownIcon } from './Icons';

interface AIFeedbackProps {
    value: 'correct' | 'incorrect' | null | undefined;
    onFeedback: (value: 'correct' | 'incorrect') => void;
}

const AIFeedback: React.FC<AIFeedbackProps> = ({ value, onFeedback }) => {
    return (
        <div className="flex items-center gap-1">
            <button 
                onClick={() => onFeedback('correct')} 
                className={`p-0.5 rounded-full transition-colors ${value === 'correct' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-700'}`}
                title="Predicción Correcta"
            >
                <ThumbUpIcon className="h-4 w-4" />
            </button>
            <button 
                onClick={() => onFeedback('incorrect')} 
                className={`p-0.5 rounded-full transition-colors ${value === 'incorrect' ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-700'}`}
                title="Predicción Incorrecta"
            >
                <ThumbDownIcon className="h-4 w-4" />
            </button>
        </div>
    );
};

export default AIFeedback;