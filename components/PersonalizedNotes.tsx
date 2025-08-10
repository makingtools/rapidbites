
import React, { useState, useEffect } from 'react';
import { Invoice } from '../types';
import { generatePersonalizedInvoiceNote } from '../services/geminiService';
import { SparklesIcon } from './Icons';

interface PersonalizedNotesProps {
  invoice: Invoice;
}

const PersonalizedNotes: React.FC<PersonalizedNotesProps> = ({ invoice }) => {
  const [note, setNote] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNote = async () => {
      setIsLoading(true);
      try {
        const generatedNote = await generatePersonalizedInvoiceNote(invoice);
        setNote(generatedNote);
      } catch (error) {
        console.error("Failed to fetch personalized note:", error);
        setNote("Gracias por su compra. ¡Esperamos verlo pronto!");
      } finally {
        setIsLoading(false);
      }
    };
    fetchNote();
  }, [invoice]);

  if (isLoading) {
    return (
        <div className="animate-pulse space-y-2">
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
        </div>
    );
  }

  return (
    <p className="text-sm text-gray-600 dark:text-gray-300 italic">
        "{note}"
    </p>
  );
};

export default PersonalizedNotes;
