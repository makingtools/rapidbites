

import React, { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PaintBrushIcon, SparklesIcon, UploadIcon } from './Icons';
import { analyzeInvoiceImageWithAI } from '../services/geminiService';

const InvoiceDesigner: React.FC = () => {
    const [logo, setLogo] = useState<string | null>(null);
    const [accentColor, setAccentColor] = useState('#0ea5e9');
    const [aiIsLoading, setAiIsLoading] = useState(false);
    const [aiDescription, setAiDescription] = useState<string | null>(null);
    const [aiError, setAiError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogo(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerLogoUpload = () => {
        fileInputRef.current?.click();
    };

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setAiIsLoading(true);
        setAiDescription(null);
        setAiError(null);

        try {
            const result = await analyzeInvoiceImageWithAI(file);
            if (result.accentColor) {
              setAccentColor(result.accentColor);
            }
            setAiDescription(result.designDescription);
        } catch (error) {
            if (error instanceof Error) {
                setAiError(error.message);
            } else {
                setAiError("Ocurrió un error desconocido durante el análisis.");
            }
        } finally {
            setAiIsLoading(false);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpeg', '.png', '.jpg'], 'application/pdf': ['.pdf'] },
        maxFiles: 1,
    });

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
            <header className="mb-6">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center">
                    <PaintBrushIcon className="h-8 w-8 mr-3 text-primary-500" />
                    Diseñador de Facturas Visual
                </h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Crea una factura profesional que refleje tu marca en minutos.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Controls */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                        <h3 className="font-bold text-lg mb-4 flex items-center">
                            <SparklesIcon className="h-6 w-6 text-accent mr-2" />
                            Diseño por IA
                        </h3>
                        <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-300
                            ${isDragActive ? 'border-accent bg-pink-50 dark:bg-pink-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-primary-500'}`}
                        >
                            <input {...getInputProps()} />
                            <div className="flex flex-col items-center justify-center h-24">
                                {aiIsLoading ? (
                                    <>
                                        <SparklesIcon className="h-8 w-8 text-primary-500 animate-pulse" />
                                        <p className="mt-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Analizando diseño...</p>
                                    </>
                                ) : (
                                    <>
                                        <UploadIcon className="h-8 w-8 text-gray-400" />
                                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                            {isDragActive ? "¡Suelta la factura aquí!" : "Arrastra una imagen de tu factura"}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-500">o haz clic para subir</p>
                                    </>
                                )}
                            </div>
                        </div>
                        {aiDescription && !aiIsLoading && (
                            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg text-sm text-green-700 dark:text-green-300">
                                <span className="font-semibold">Análisis de IA:</span> {aiDescription}
                            </div>
                        )}
                        {aiError && !aiIsLoading && (
                             <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg text-sm text-red-700 dark:text-red-300">
                                <span className="font-semibold">Error:</span> {aiError}
                            </div>
                        )}
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                        <h3 className="font-bold text-lg mb-4">Controles Manuales</h3>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-sm mb-2">Tu Logo</h4>
                                <input type="file" accept="image/*" onChange={handleLogoUpload} ref={fileInputRef} className="hidden" />
                                <button
                                    onClick={triggerLogoUpload}
                                    className="w-full bg-gray-100 dark:bg-gray-700 border-2 border-dashed dark:border-gray-600 rounded-lg p-4 text-center hover:border-primary-500 transition"
                                >
                                    {logo ? <img src={logo} alt="Tu logo" className="max-h-16 mx-auto"/> : <span>Haz clic para subir logo</span>}
                                </button>
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm mb-2">Color de Marca</h4>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="color"
                                        value={accentColor}
                                        onChange={(e) => setAccentColor(e.target.value)}
                                        className="w-12 h-12 p-1 bg-transparent border-none rounded-lg cursor-pointer"
                                    />
                                    <div className="font-mono px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-900">{accentColor}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Live Preview */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl">
                    <div className="border border-gray-200 dark:border-gray-700 p-8">
                        <header className="flex justify-between items-start pb-6 border-b-2" style={{borderColor: accentColor}}>
                            <div>
                                <h1 className="text-4xl font-bold" style={{color: accentColor}}>FACTURA</h1>
                                <p className="text-gray-500 dark:text-gray-400">#INV-2024-001</p>
                            </div>
                             <div className="w-32 h-16 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                {logo ? <img src={logo} alt="Logo" className="max-h-full max-w-full"/> : <span className="text-xs text-gray-400">Tu Logo</span>}
                            </div>
                        </header>
                        <section className="flex justify-between mt-8">
                             <div>
                                <h3 className="font-semibold text-gray-500 dark:text-gray-400">Facturar a:</h3>
                                <p className="font-bold text-lg text-gray-900 dark:text-white">Cliente de Ejemplo S.A.S.</p>
                                <p>Carrera 10 # 20-30</p>
                                <p>Bogotá, Colombia</p>
                            </div>
                             <div className="text-right">
                                <p><span className="font-semibold">Fecha de Emisión:</span> 01/08/2024</p>
                                <p><span className="font-semibold">Fecha de Vencimiento:</span> 31/08/2024</p>
                            </div>
                        </section>
                        <section className="mt-8">
                            <table className="w-full text-left">
                                <thead >
                                    <tr style={{backgroundColor: accentColor, color: 'white'}}>
                                        <th className="p-3">Descripción</th>
                                        <th className="p-3 text-right">Cantidad</th>
                                        <th className="p-3 text-right">Precio Unit.</th>
                                        <th className="p-3 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b dark:border-gray-700">
                                        <td className="p-3">Desarrollo Web Corporativo</td>
                                        <td className="p-3 text-right">1</td>
                                        <td className="p-3 text-right">$15.000.000</td>
                                        <td className="p-3 text-right">$15.000.000</td>
                                    </tr>
                                    <tr className="border-b dark:border-gray-700">
                                        <td className="p-3">Hosting y Dominio (Anual)</td>
                                        <td className="p-3 text-right">1</td>
                                        <td className="p-3 text-right">$500.000</td>
                                        <td className="p-3 text-right">$500.000</td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>
                        <footer className="flex justify-end mt-8">
                            <div className="w-1/2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Subtotal:</span>
                                    <span>$15.500.000</span>
                                </div>
                                 <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">IVA (19%):</span>
                                    <span>$2.945.000</span>
                                </div>
                                <div className="flex justify-between font-bold text-xl mt-2 pt-2 border-t dark:border-gray-600" style={{color: accentColor}}>
                                    <span>TOTAL:</span>
                                    <span>$18.445.000</span>
                                </div>
                            </div>
                        </footer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceDesigner;