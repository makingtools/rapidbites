
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Invoice, Customer, Product } from '../types';
import { extractInvoiceDataFromDocument } from '../services/geminiService';
import { UploadIcon, SparklesIcon } from './Icons';

interface InvoiceFromDocumentProps {
  onDataExtracted: (data: Partial<Invoice>) => void;
  customers: Customer[];
  products: Product[];
}

const InvoiceFromDocument: React.FC<InvoiceFromDocumentProps> = ({ onDataExtracted, customers, products }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    try {
      const extractedData = await extractInvoiceDataFromDocument(file, customers, products);
      onDataExtracted(extractedData);
    } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError("Ocurrió un error desconocido.");
        }
    } finally {
      setIsLoading(false);
    }
  }, [onDataExtracted, customers, products]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.png', '.jpg'], 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center">
          <SparklesIcon className="h-8 w-8 mr-3 text-accent" />
          Crear Factura desde Documento
        </h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
          Sube una orden de compra (imagen o PDF) y deja que la IA de Johan la convierta en un borrador de factura.
        </p>
      </header>

      <div className="max-w-3xl mx-auto">
        <div
          {...getRootProps()}
          className={`border-4 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300
            ${isDragActive ? 'border-accent bg-pink-50 dark:bg-pink-900/20 scale-105' : 'border-gray-300 dark:border-gray-600 hover:border-primary-500'}`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center h-48">
            {isLoading ? (
              <>
                <SparklesIcon className="h-12 w-12 text-primary-500 animate-pulse" />
                <p className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-200">Johan está analizando el documento...</p>
                <p className="text-sm text-gray-500">Esto puede tardar unos segundos.</p>
              </>
            ) : (
              <>
                <UploadIcon className="h-12 w-12 text-gray-400" />
                <p className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-200">
                  {isDragActive ? "¡Suelta el archivo aquí!" : "Arrastra y suelta tu orden de compra"}
                </p>
                <p className="text-gray-500 dark:text-gray-400">o haz clic para seleccionar un archivo (JPG, PNG, PDF)</p>
              </>
            )}
          </div>
        </div>
        {error && !isLoading && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 rounded-lg text-center text-red-700 dark:text-red-300">
            <span className="font-semibold">Error:</span> {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceFromDocument;
