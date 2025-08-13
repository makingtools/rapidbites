import React, { useState, useCallback } from 'react';
import { uploadMenuContent } from '../../../services/api';
import { DocumentArrowUpIcon } from '../../icons/DocumentArrowUpIcon';
import { PhotoIcon } from '../../icons/PhotoIcon';
import { CheckCircleIcon } from '../../icons/CheckCircleIcon';

export const AdminMenu: React.FC = () => {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [processingResult, setProcessingResult] = useState('');

    const handlePdfChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setPdfFile(event.target.files[0]);
        }
    };

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const files = Array.from(event.target.files);
            setImageFiles(files);

            const previews = files.map(file => URL.createObjectURL(file));
            setImagePreviews(previews);
        }
    };
    
    const handleProcessWithAI = useCallback(async () => {
        if (!pdfFile && imageFiles.length === 0) {
            alert("Por favor, sube al menos un archivo PDF o una imagen.");
            return;
        }
        setIsLoading(true);
        setProcessingResult('');
        
        try {
            const result = await uploadMenuContent(pdfFile, imageFiles);
            setProcessingResult(result.message);
        } catch (error) {
            console.error("AI processing failed:", error);
            setProcessingResult("Hubo un error al procesar los archivos. Inténtalo de nuevo.");
        } finally {
            setIsLoading(false);
        }

    }, [pdfFile, imageFiles]);

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Gestión de Contenido con IA</h1>
            <p className="text-gray-600 mb-6">Carga el menú de tu restaurante en PDF e imágenes de tus platos. Nuestra IA los analizará para actualizar automáticamente el catálogo de productos, precios y promociones.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* PDF Upload */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <DocumentArrowUpIcon className="w-6 h-6 text-primary" />
                        <span>Cargar Menú (PDF)</span>
                    </h2>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input type="file" id="pdf-upload" className="hidden" accept=".pdf" onChange={handlePdfChange} />
                        <label htmlFor="pdf-upload" className="cursor-pointer text-primary font-semibold hover:underline">
                            {pdfFile ? `Archivo seleccionado: ${pdfFile.name}` : "Selecciona un archivo PDF"}
                        </label>
                        <p className="text-xs text-gray-500 mt-1">Sube el menú completo para que la IA lo procese.</p>
                    </div>
                </div>

                {/* Image Upload */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <PhotoIcon className="w-6 h-6 text-primary" />
                        <span>Cargar Imágenes de Platos</span>
                    </h2>
                     <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input type="file" id="image-upload" className="hidden" accept="image/*" multiple onChange={handleImageChange} />
                        <label htmlFor="image-upload" className="cursor-pointer text-primary font-semibold hover:underline">
                             {imageFiles.length > 0 ? `${imageFiles.length} imágenes seleccionadas` : "Selecciona imágenes"}
                        </label>
                        <p className="text-xs text-gray-500 mt-1">Sube imágenes de alta calidad de tus productos.</p>
                    </div>
                    {imagePreviews.length > 0 && (
                        <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                            {imagePreviews.map((src, index) => (
                                <img key={index} src={src} alt={`Preview ${index}`} className="w-full h-20 object-cover rounded-md" />
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            <div className="mt-8">
                 <button 
                    onClick={handleProcessWithAI}
                    disabled={isLoading || (!pdfFile && imageFiles.length === 0)}
                    className="w-full bg-primary text-white font-bold py-4 px-8 rounded-full text-lg hover:bg-red-500 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                    {isLoading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Procesando con IA...</span>
                        </>
                    ) : (
                        'Analizar y Cargar Contenido con IA'
                    )}
                </button>
            </div>

            {processingResult && (
                 <div className="mt-8 bg-green-50 border-2 border-green-200 rounded-xl p-6 shadow-md animate-fade-in flex items-center gap-4">
                    <CheckCircleIcon className="w-10 h-10 text-green-500 flex-shrink-0"/>
                    <div>
                         <h3 className="text-xl font-display font-bold text-green-800">Análisis Exitoso</h3>
                        <p className="mt-2 text-green-700">{processingResult}</p>
                    </div>
                </div>
            )}
        </div>
    );
};