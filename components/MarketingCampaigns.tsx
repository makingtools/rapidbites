import React, { useState, useMemo } from 'react';
import { MarketingCampaign, Customer } from '../types';
import { PaperAirplaneIcon, PlusIcon, PencilIcon, CheckCircleIcon, DocumentTextIcon, TagIcon } from './Icons';
import PageHeader from './PageHeader';
import Modal from './Modal';

// Sub-component for the form
const CampaignForm: React.FC<{
    campaign: Partial<MarketingCampaign> | null;
    availableTags: string[];
    onSave: (campaign: MarketingCampaign) => void;
    onCancel: () => void;
}> = ({ campaign, availableTags, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Partial<MarketingCampaign>>(
        campaign || {
            name: '',
            subject: '',
            body: '',
            targetTags: [],
            status: 'borrador',
        }
    );

    const handleTagChange = (tag: string) => {
        const currentTags = formData.targetTags || [];
        const newTags = currentTags.includes(tag)
            ? currentTags.filter(t => t !== tag)
            : [...currentTags, tag];
        setFormData(prev => ({ ...prev, targetTags: newTags }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as MarketingCampaign);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium">Nombre de la Campaña</label>
                <input
                    type="text"
                    value={formData.name || ''}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    className="mt-1 w-full p-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700"
                    required
                />
            </div>
             <div>
                <label className="block text-sm font-medium">Asunto del Email</label>
                <input
                    type="text"
                    value={formData.subject || ''}
                    onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))}
                    className="mt-1 w-full p-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700"
                    required
                />
            </div>
             <div>
                <label className="block text-sm font-medium">Cuerpo del Email</label>
                <textarea
                    value={formData.body || ''}
                    onChange={e => setFormData(p => ({ ...p, body: e.target.value }))}
                    rows={6}
                    className="mt-1 w-full p-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700"
                    placeholder="Usa [Customer Name] para personalizar."
                    required
                />
            </div>
            <div>
                 <label className="block text-sm font-medium mb-2">Segmentación por Etiquetas</label>
                 <div className="flex flex-wrap gap-2 p-2 border rounded-md dark:border-neutral-700">
                     {availableTags.map(tag => (
                         <button
                             type="button"
                             key={tag}
                             onClick={() => handleTagChange(tag)}
                             className={`px-3 py-1 text-sm rounded-full transition-colors ${
                                 formData.targetTags?.includes(tag)
                                 ? 'bg-primary-600 text-white'
                                 : 'bg-slate-200 dark:bg-neutral-700 hover:bg-slate-300 dark:hover:bg-neutral-600'
                             }`}
                         >
                             {tag}
                         </button>
                     ))}
                 </div>
            </div>
            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 dark:bg-neutral-700 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg">Guardar Campaña</button>
            </div>
        </form>
    );
};

interface MarketingCampaignsProps {
    campaigns: MarketingCampaign[];
    customers: Customer[];
    onSaveCampaign: (campaign: MarketingCampaign) => void;
    onSendCampaign: (campaignId: string) => void;
}

const MarketingCampaigns: React.FC<MarketingCampaignsProps> = ({ campaigns, customers, onSaveCampaign, onSendCampaign }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState<Partial<MarketingCampaign> | null>(null);

    const availableTags = useMemo(() => {
        const allTags = new Set<string>();
        customers.forEach(c => c.tags?.forEach(tag => allTags.add(tag)));
        return Array.from(allTags);
    }, [customers]);

    const handleOpenModal = (campaign?: MarketingCampaign) => {
        setSelectedCampaign(campaign || null);
        setIsModalOpen(true);
    };

    const handleSave = (campaign: MarketingCampaign) => {
        onSaveCampaign(campaign);
        setIsModalOpen(false);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
            <PageHeader
                icon={<PaperAirplaneIcon />}
                title="Campañas de Email Marketing"
                description="Diseña, segmenta y envía campañas para conectar con tus clientes."
                actions={<button onClick={() => handleOpenModal()} className="flex items-center bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 transition shadow"><PlusIcon className="h-5 w-5 mr-2"/>Nueva Campaña</button>}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map(campaign => (
                    <div key={campaign.id} className="bg-white dark:bg-neutral-900 rounded-2xl shadow-lg overflow-hidden flex flex-col">
                        <div className="p-5 flex-grow">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-white">{campaign.name}</h3>
                                {campaign.status === 'enviada' ? (
                                    <span className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-800 rounded-full dark:bg-green-900 dark:text-green-300">
                                        <CheckCircleIcon className="h-3 w-3" /> Enviada
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-800 rounded-full dark:bg-neutral-700 dark:text-neutral-300">
                                        <DocumentTextIcon className="h-3 w-3" /> Borrador
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 italic">Asunto: "{campaign.subject}"</p>
                            <div className="mt-4">
                                <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2 flex items-center gap-1"><TagIcon className="h-3 w-3" /> Dirigido a</h4>
                                <div className="flex flex-wrap gap-1">
                                    {campaign.targetTags.map(tag => (
                                        <span key={tag} className="px-2 py-0.5 text-xs font-semibold bg-primary-100 text-primary-800 rounded-full">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-neutral-800/50 p-3 flex justify-end items-center gap-2">
                            <button onClick={() => handleOpenModal(campaign)} className="flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                                <PencilIcon className="h-4 w-4" /> Editar
                            </button>
                            {campaign.status === 'borrador' && (
                                <button onClick={() => onSendCampaign(campaign.id)} className="flex items-center gap-2 px-3 py-1.5 bg-accent-500 text-white text-sm font-bold rounded-lg hover:bg-accent-600 transition shadow">
                                    <PaperAirplaneIcon className="h-4 w-4" /> Enviar
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedCampaign ? "Editar Campaña" : "Nueva Campaña"}>
                    <CampaignForm
                        campaign={selectedCampaign}
                        availableTags={availableTags}
                        onSave={handleSave}
                        onCancel={() => setIsModalOpen(false)}
                    />
                </Modal>
            )}
        </div>
    );
};

export default MarketingCampaigns;
