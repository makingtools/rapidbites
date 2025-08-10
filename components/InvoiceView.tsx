import React, { useState, useCallback } from 'react';
import { Invoice, SystemSettings, BlockchainVerification } from '../types';
import { PrinterIcon, DocumentDownloadIcon, CheckCircleIcon, ShieldCheckIcon, CloseIcon } from './Icons';
import InvoiceTemplate from './InvoiceTemplate';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import PersonalizedNotes from './PersonalizedNotes';
import { verifyInvoiceOnBlockchain } from '../services/geminiService';
import Modal from './Modal';

interface BlockchainVerificationModalProps {
    verificationData: BlockchainVerification | null;
    invoiceId: string;
    onClose: () => void;
}

const BlockchainVerificationModal: React.FC<BlockchainVerificationModalProps> = ({ verificationData, invoiceId, onClose }) => {
    return (
        <Modal isOpen={true} onClose={onClose} title="Verificación en Blockchain">
            {verificationData ? (
                <div className="text-center p-4">
                    <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-green-600 dark:text-green-400">Transacción Verificada</h3>
                    <p className="text-sm text-gray-500 mt-2">La integridad de la factura <span className="font-mono">{invoiceId}</span> ha sido confirmada en la red.</p>
                    <div className="mt-6 text-left bg-gray-100 dark:bg-neutral-800 p-4 rounded-lg space-y-2 text-sm break-all">
                        <p><strong>Hash de Transacción:</strong> <span className="font-mono text-gray-600 dark:text-gray-300">{verificationData.hash}</span></p>
                        <p><strong>Marca de Tiempo:</strong> <span className="font-mono text-gray-600 dark:text-gray-300">{new Date(verificationData.timestamp).toLocaleString('es-CO')}</span></p>
                    </div>
                </div>
            ) : (
                <div className="text-center p-4">
                    <p>Verificando...</p>
                </div>
            )}
        </Modal>
    );
};

interface InvoiceViewProps {
    invoice: Invoice;
    systemSettings: SystemSettings;
    onMarkAsPaid: (invoiceId: string) => void;
    onUpdateInvoice: (invoice: Invoice) => void;
}

const InvoiceView: React.FC<InvoiceViewProps> = ({ invoice, systemSettings, onMarkAsPaid, onUpdateInvoice }) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationData, setVerificationData] = useState<BlockchainVerification | null>(invoice.blockchainVerification || null);
    const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
    
    const handlePrint = (isTicket = false) => {
        const printableElement = document.getElementById('invoice-wrapper-for-print');
        if (!printableElement) return;

        printableElement.classList.add('printable-area');
        if (isTicket) {
            printableElement.classList.add('ticket-print');
        }

        window.print();
        
        setTimeout(() => {
            printableElement.classList.remove('printable-area');
            if (isTicket) {
                printableElement.classList.remove('ticket-print');
            }
        }, 500);
    };
    
    const handleDownload = () => {
       setIsDownloading(true);
       const invoiceElement = document.getElementById('invoice-wrapper-for-print');
       if(invoiceElement){
            html2canvas(invoiceElement, { 
                scale: 2,
                backgroundColor: '#ffffff'
            }).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`factura_${invoice.id}.pdf`);
            }).finally(() => {
                setIsDownloading(false);
            });
       } else {
           console.error("Printable view element not found");
           setIsDownloading(false);
       }
    };

    const handleVerifyBlockchain = useCallback(async () => {
        setIsVerifying(true);
        setIsVerificationModalOpen(true);
        if (invoice.blockchainVerification) {
             setVerificationData(invoice.blockchainVerification);
        } else {
            const verificationResult = await verifyInvoiceOnBlockchain(invoice.id);
            setVerificationData(verificationResult);
            onUpdateInvoice({ ...invoice, blockchainVerification: verificationResult });
        }
        setIsVerifying(false);
    }, [invoice, onUpdateInvoice]);

    const isPaid = invoice.status === 'pagada';

    return (
        <div className="flex gap-8 text-gray-800 dark:text-gray-200">
            <div id="invoice-wrapper-for-print" className="bg-white flex-grow">
                <InvoiceTemplate invoice={invoice} systemSettings={systemSettings} />
            </div>
            
            <div className="w-80 flex-shrink-0 space-y-6 no-print">
                <div className="p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-lg">
                    <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">Acciones Rápidas</h3>
                     <div className="space-y-3">
                         <button
                            onClick={() => handlePrint(true)}
                            className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition"
                        >
                            <PrinterIcon className="h-5 w-5 mr-2" />
                            Imprimir Ticket
                        </button>
                         <button
                            onClick={() => handlePrint(false)}
                            className="w-full flex items-center justify-center px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition"
                        >
                            <PrinterIcon className="h-5 w-5 mr-2" />
                            Imprimir Carta
                        </button>
                        <button
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-wait"
                        >
                            {isDownloading ? 'Generando...' : <><DocumentDownloadIcon className="h-5 w-5 mr-2" />Descargar PDF</>}
                        </button>
                        <button
                            onClick={handleVerifyBlockchain}
                            disabled={isVerifying}
                            className="w-full flex items-center justify-center px-4 py-2 bg-gray-800 dark:bg-neutral-700 text-white font-semibold rounded-lg hover:bg-black dark:hover:bg-neutral-600 transition disabled:opacity-50"
                        >
                           {verificationData ? <CheckCircleIcon className="h-5 w-5 mr-2 text-green-400" /> : <ShieldCheckIcon className="h-5 w-5 mr-2" />}
                           {isVerifying ? 'Verificando...' : (verificationData ? 'Verificado en Blockchain' : 'Verificar en Blockchain')}
                        </button>
                        {!isPaid && (
                             <button
                                onClick={() => onMarkAsPaid(invoice.id)}
                                className="w-full flex items-center justify-center px-4 py-2 bg-accent-500 text-white font-bold rounded-lg hover:bg-accent-600 transition"
                            >
                                <CheckCircleIcon className="h-5 w-5 mr-2" />
                                Marcar como Pagada
                            </button>
                        )}
                     </div>
                </div>
                 <div className="p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-lg">
                    <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-white">Nota Personalizada (IA)</h3>
                    <PersonalizedNotes invoice={invoice} />
                </div>
            </div>
             {isVerificationModalOpen && (
                <BlockchainVerificationModal
                    verificationData={verificationData}
                    invoiceId={invoice.id}
                    onClose={() => setIsVerificationModalOpen(false)}
                />
            )}
        </div>
    );
};

export default InvoiceView;