
import React, { useState } from 'react';
import { AppDataState, ExecutiveReportData } from '../types';
import { DocumentChartBarIcon, SparklesIcon } from './Icons';
import { getExecutiveReport } from '../services/geminiService';

const ExecutiveReport: React.FC<{ appState: AppDataState }> = ({ appState }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [reportData, setReportData] = useState<ExecutiveReportData | null>(null);

    const handleGenerateReport = async () => {
        setIsLoading(true);
        setError(null);
        setReportData(null);
        try {
            const data = await getExecutiveReport(appState);
            setReportData(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error desconocido");
        } finally {
            setIsLoading(false);
        }
    };
    
    const KPI_Card: React.FC<{ title: string; value: string }> = ({ title, value }) => (
        <div className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400">{title}</h4>
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">{value}</p>
        </div>
    );

    const InsightCard: React.FC<{ title: string; detail: string; colorClass: string }> = ({ title, detail, colorClass }) => (
        <div className={`p-4 rounded-lg border-l-4 ${colorClass}`}>
            <h4 className="font-bold">{title}</h4>
            <p className="text-sm mt-1">{detail}</p>
        </div>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
            <header className="mb-6">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center">
                    <DocumentChartBarIcon className="h-8 w-8 mr-3 text-primary-500" />
                    Informe Ejecutivo IA
                </h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Un resumen estratégico de la salud de tu negocio, generado por Johan.</p>
            </header>

            {!reportData && (
                <div className="text-center py-20">
                    <button
                        onClick={handleGenerateReport}
                        disabled={isLoading}
                        className="flex items-center justify-center gap-3 mx-auto px-8 py-4 bg-primary-600 text-white font-bold text-lg rounded-lg hover:bg-primary-700 transition-colors duration-300 shadow-lg disabled:opacity-50 disabled:cursor-wait"
                    >
                        <SparklesIcon className="h-6 w-6" />
                        {isLoading ? 'Generando Informe...' : 'Generar Informe Ejecutivo'}
                    </button>
                    {error && <div className="mt-4 text-red-500">{error}</div>}
                </div>
            )}
            
            {reportData && (
                 <div className="space-y-8 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-3">Resumen Ejecutivo</h2>
                        <p className="text-gray-600 dark:text-gray-300 italic">{reportData.executive_summary}</p>
                    </div>
                    
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Indicadores Clave de Rendimiento (KPIs)</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {reportData.kpis.map(kpi => <KPI_Card key={kpi.title} title={kpi.title} value={kpi.value} />)}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg space-y-4">
                            <h3 className="text-lg font-bold text-green-600 dark:text-green-400">Fortalezas</h3>
                            {reportData.strengths.map(s => <InsightCard key={s.title} {...s} colorClass="border-green-500 bg-green-50 dark:bg-green-900/20" />)}
                        </div>
                         <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg space-y-4">
                            <h3 className="text-lg font-bold text-yellow-600 dark:text-yellow-400">Debilidades</h3>
                            {reportData.weaknesses.map(w => <InsightCard key={w.title} {...w} colorClass="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20" />)}
                        </div>
                         <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg space-y-4">
                            <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400">Recomendaciones Estratégicas</h3>
                            {reportData.recommendations.map(r => <InsightCard key={r.title} {...r} colorClass="border-blue-500 bg-blue-50 dark:bg-blue-900/20" />)}
                        </div>
                    </div>

                    <div className="text-center pt-4">
                         <button
                            onClick={handleGenerateReport}
                            disabled={isLoading}
                            className="flex items-center justify-center gap-2 mx-auto px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-300 disabled:opacity-50"
                        >
                             {isLoading ? 'Actualizando...' : 'Volver a Generar'}
                        </button>
                    </div>
                 </div>
            )}
        </div>
    );
};

export default ExecutiveReport;
