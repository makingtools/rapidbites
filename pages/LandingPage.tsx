import React, { useState, useEffect, useRef } from 'react';
import { useI18n, Language, Translations } from '../i18n';
import { Service, AIFeature, ModalType, AppActions } from '../types';
import { SERVICES, ART_STYLES, BrandIcon, SparklesIcon, ShowerIcon, PremiumIcon, SpaIcon, ScanIcon, ArtIcon, ChatIcon, TwitterIcon, InstagramIcon, FacebookIcon } from '../constants';
import * as geminiService from '../services/geminiService';
import * as speechService from '../speechService';
import PetCareAssistant from '../components/PetCareAssistant';

// --- Custom Hook for Scroll Animations ---
const useScrollAnimation = () => {
    useEffect(() => {
        const animatedElements = document.querySelectorAll('.scroll-animate');
        if (animatedElements.length > 0) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                    }
                });
            }, { threshold: 0.1 });

            animatedElements.forEach(el => observer.observe(el));

            return () => {
                animatedElements.forEach(el => observer.unobserve(el));
            };
        }
    }, []);
};

// Utility to convert file to base64
const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
});

// Modal Component
const Modal: React.FC<{ children: React.ReactNode; onClose: () => void; title: string }> = ({ children, onClose, title }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4 scroll-animate fade-in" onClick={onClose}>
        <div className="bg-slate-100 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col animate-pop-in" onClick={e => e.stopPropagation()}>
            <header className="flex items-center justify-between p-4 border-b border-slate-200">
                <h3 className="text-xl font-bold text-slate-800">{title}</h3>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
                    <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </header>
            <main className="p-6 overflow-y-auto">{children}</main>
        </div>
    </div>
);

// AI Feature: Breed Scanner
const BreedScanner: React.FC<{onClose: () => void}> = ({onClose}) => {
    const { t, language } = useI18n();
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string>('');
    const [result, setResult] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImage(file);
            setPreview(URL.createObjectURL(file));
            setResult('');
        }
    };
    
    const handleScan = async () => {
        if (!image) return;
        setIsLoading(true);
        setResult('');
        try {
            const base64Image = await toBase64(image);
            const response = await geminiService.identifyBreed(base64Image, image.type);
            setResult(response);
            if (isVoiceEnabled) speechService.speak(response, language);
        } catch (error) {
            const errorMsg = "Error al procesar la imagen.";
            setResult(errorMsg);
            if (isVoiceEnabled) speechService.speak(errorMsg, language);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal onClose={onClose} title={t('ai.scanner.title')}>
            <div className="text-center">
                <p className="text-slate-600 mb-4">{t('ai.scanner.desc')}</p>
                <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"/>
                {preview && <img src={preview} alt="Vista previa de perro para escáner" className="mt-4 rounded-lg max-h-60 mx-auto shadow-md" />}
                {preview && <button onClick={handleScan} disabled={isLoading} className="mt-4 w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-300">
                    {isLoading ? t('ai.scanner.loading') : t('ai.scanner.button')}
                </button>}
                {result && <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-lg font-semibold text-lg">{result}</div>}
            </div>
        </Modal>
    );
};

// AI Feature: Art Generator
const ArtGenerator: React.FC<{onClose: () => void}> = ({onClose}) => {
    const { t, language } = useI18n();
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string>('');
    const [style, setStyle] = useState<string>(ART_STYLES[0]);
    const [resultImage, setResultImage] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImage(file);
            setPreview(URL.createObjectURL(file));
            setResultImage('');
        }
    };

    const handleGenerate = async () => {
        if (!image) return;
        setIsLoading(true);
        setResultImage('');
        try {
            const base64Image = await toBase64(image);
            const response = await geminiService.generateArt(base64Image, image.type, style);
            setResultImage(response);
            if (response.startsWith('data:image') && isVoiceEnabled) {
                speechService.speak(t('ai.art.success'), language);
            } else if (!response.startsWith('data:image') && isVoiceEnabled) {
                 speechService.speak(response, language);
            }
        } catch (error) {
            const errorMsg = "Error al generar el arte.";
            setResultImage(errorMsg);
            if(isVoiceEnabled) speechService.speak(errorMsg, language);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Modal onClose={onClose} title={t('ai.art.title')}>
             <div className="space-y-4">
                <p className="text-slate-600 text-center">{t('ai.art.desc')}</p>
                <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"/>
                {preview && <img src={preview} alt="Vista previa de mascota para arte" className="rounded-lg max-h-40 mx-auto shadow-md" />}
                <select value={style} onChange={e => setStyle(e.target.value)} className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none">
                    {ART_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={handleGenerate} disabled={isLoading || !image} className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-300">
                    {isLoading ? t('ai.art.loading') : t('ai.art.button')}
                </button>
                {isLoading && <div className="text-center text-slate-500">{t('ai.art.wait')}</div>}
                {resultImage && resultImage.startsWith('data:image') && <img src={resultImage} alt="Arte generado de mascota" className="mt-4 rounded-lg shadow-xl mx-auto" />}
                {resultImage && !resultImage.startsWith('data:image') && <div className="mt-4 p-4 bg-rose-100 text-rose-800 rounded-lg">{resultImage}</div>}
             </div>
        </Modal>
    );
};

// B2B Quote Modal
const QuoteResultModal: React.FC<{onClose: () => void, content: string}> = ({onClose, content}) => {
    const {t} = useI18n();
    return (
        <Modal onClose={onClose} title={t('b2b.form.quote_title')}>
            <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: content }}></div>
        </Modal>
    );
}

// Sub-components
const Header: React.FC<{ onAdminPanel: () => void, onSchedule: () => void }> = ({ onAdminPanel, onSchedule }) => {
    const { t, language, setLanguage } = useI18n();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    
    const navLinks = [
        { key: 'nav.services', href: '#servicios' },
        { key: 'nav.ai_features', href: '#ia-features' },
        { key: 'nav.locations', href: '#ubicaciones' },
        { key: 'nav.b2b', href: '#b2b' },
    ];

    const handleNavClick = (href: string) => {
        setIsMenuOpen(false);
        document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
         <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled || isMenuOpen ? 'bg-white/80 shadow-md backdrop-blur-lg' : 'bg-transparent'}`}>
            <div className="container mx-auto px-6 py-3 flex justify-between items-center">
                <button onClick={() => handleNavClick('#inicio')} className="flex items-center space-x-2" aria-label="Volver al inicio">
                    <BrandIcon className="h-8 w-8 text-indigo-600" />
                    <span className={`text-2xl font-extrabold transition-colors ${isScrolled || isMenuOpen ? 'text-slate-800' : 'text-white'}`}>Pet-Tech<span className="text-cyan-500">Connect</span></span>
                </button>
                <nav className="hidden lg:flex items-center space-x-2">
                    {navLinks.map(link => <button key={link.key} onClick={() => handleNavClick(link.href)} className={`font-medium px-4 py-2 rounded-md transition-colors ${isScrolled ? 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50' : 'text-white/80 hover:text-white hover:bg-white/10'}`}>{t(link.key as keyof Translations)}</button>)}
                    <button onClick={onAdminPanel} className={`font-medium text-sm px-4 py-2 rounded-md transition-colors ${isScrolled ? 'text-slate-500 hover:text-indigo-600' : 'text-white/70 hover:text-white'}`}>({t('nav.admin_panel')})</button>
                </nav>
                <div className="flex items-center space-x-2">
                     <div className="relative">
                        <select onChange={(e) => setLanguage(e.target.value as Language)} value={language} className="bg-transparent text-sm font-medium border rounded-full py-1 pl-3 pr-8 appearance-none focus:outline-none transition-colors"
                            style={{color: isScrolled || isMenuOpen ? '#475569' : 'white', borderColor: isScrolled || isMenuOpen ? '#cbd5e1' : 'rgba(255,255,255,0.5)'}}>
                            <option value="es-ES" className="text-black">ES</option>
                            <option value="en-US" className="text-black">EN</option>
                        </select>
                    </div>
                    <button onClick={onSchedule} className="hidden sm:block bg-rose-500 text-white font-semibold px-5 py-2 rounded-full hover:bg-rose-600 transition-transform transform hover:scale-105 shadow-md hover:shadow-lg">{t('nav.schedule')}</button>
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden" aria-label="Abrir menú">
                        <svg className={`w-6 h-6 transition-colors ${isScrolled || isMenuOpen ? 'text-slate-800' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
                    </button>
                </div>
            </div>
            {isMenuOpen && <div className="lg:hidden bg-white py-4 scroll-animate fade-in">{navLinks.map(link => <button key={link.key} onClick={() => handleNavClick(link.href)} className="block w-full text-center py-2 text-slate-600 hover:bg-slate-100">{t(link.key as keyof Translations)}</button>)}</div>}
        </header>
    );
};

const HeroSection: React.FC<{ onSchedule: () => void }> = ({ onSchedule }) => {
    const { t } = useI18n();
    return (
        <section id="inicio" className="relative h-screen flex items-center justify-center text-white bg-slate-900 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent z-10"></div>
            <img src="https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=1920&q=80" alt="Perro feliz siendo cuidado" className="absolute inset-0 w-full h-full object-cover ken-burns"/>
            <div className="relative z-20 text-center p-6 max-w-4xl">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-4 scroll-animate fade-in-up" style={{textShadow: '3px 3px 8px rgba(0,0,0,0.7)'}}>{t('hero.title')}</h1>
                <p className="text-lg md:text-xl mb-8 text-slate-300 scroll-animate fade-in-up" style={{ animationDelay: '0.2s', textShadow: '1px 1px 4px rgba(0,0,0,0.7)'}}>{t('hero.subtitle')}</p>
                <div className="space-x-4 scroll-animate fade-in-up" style={{ animationDelay: '0.4s' }}>
                    <button onClick={() => document.querySelector('#servicios')?.scrollIntoView({ behavior: 'smooth' })} className="bg-rose-500 text-white font-semibold px-8 py-3 rounded-full hover:bg-rose-600 transition-transform transform hover:scale-105 shadow-lg hover:shadow-rose-500/40 inline-block">{t('hero.cta_main')}</button>
                    <button onClick={() => document.querySelector('#ia-features')?.scrollIntoView({ behavior: 'smooth' })} className="bg-transparent border-2 border-cyan-400 text-cyan-400 font-semibold px-8 py-3 rounded-full hover:bg-cyan-400 hover:text-slate-900 transition-colors inline-block">{t('hero.cta_secondary')}</button>
                </div>
            </div>
             <a href="#servicios" className="scroll-down" aria-label="Ir a la siguiente sección">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </a>
        </section>
    );
};

const ServicesSection: React.FC = () => {
    const { t } = useI18n();
    const formatCurrency = (value: number) => 
        new Intl.NumberFormat('es-CO', { 
            style: 'currency', 
            currency: 'COP', 
            minimumFractionDigits: 0 
        }).format(value);

    return (
        <section id="servicios" className="py-24 bg-slate-50">
            <div className="container mx-auto px-6 text-center">
                <div className="scroll-animate fade-in-up">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">{t('services.title')}</h2>
                    <p className="text-slate-600 mb-16 max-w-2xl mx-auto">{t('services.subtitle')}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {SERVICES.map((service: Service, index: number) => {
                        return (
                             <div key={service.titleKey} className="bg-white p-8 rounded-xl shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 transform hover:-translate-y-2 border-t-4 border-transparent hover:border-cyan-500 scroll-animate fade-in-up" style={{animationDelay: `${index * 150}ms`}}>
                                <div className="inline-block bg-cyan-100 text-cyan-600 p-4 rounded-full mb-5 transition-transform duration-300 transform group-hover:scale-110"><service.icon className="h-8 w-8" /></div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">{t(service.titleKey as keyof Translations)}</h3>
                                <p className="text-slate-600 mb-4">{t(service.descriptionKey as keyof Translations)}</p>
                                <p className="text-3xl font-extrabold text-indigo-600">{formatCurrency(service.price)}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

const AIFeaturesSection: React.FC<{ features: AIFeature[] }> = ({ features }) => {
    const { t } = useI18n();
    return (
        <section id="ia-features" className="py-24 bg-slate-900 text-white aurora-bg">
            <div className="container mx-auto px-6 text-center relative z-10">
                 <div className="scroll-animate fade-in-up">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('ai.title')}</h2>
                    <p className="text-slate-400 mb-16 max-w-2xl mx-auto">{t('ai.subtitle')}</p>
                 </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div key={feature.titleKey} className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-xl shadow-lg hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center scroll-animate fade-in-up" style={{animationDelay: `${index * 150}ms`}}>
                           <div className="inline-block bg-slate-700 text-indigo-400 p-4 rounded-full mb-5"><feature.icon className="h-8 w-8" /></div>
                           <h3 className="text-xl font-bold text-white mb-2">{t(feature.titleKey as keyof Translations)}</h3>
                           <p className="text-slate-400 mb-6 flex-grow">{t(feature.descriptionKey as keyof Translations)}</p>
                           <button onClick={feature.action} className="w-full bg-indigo-600 text-white font-semibold py-2 rounded-full hover:bg-indigo-500 transition-colors shadow-lg hover:shadow-indigo-500/50">{t(feature.buttonKey as keyof Translations)}</button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const B2BSection: React.FC<{ setQuoteContent: (content: string) => void }> = ({ setQuoteContent }) => {
    const { t } = useI18n();
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);
        const company = formData.get('company') as string;
        const email = formData.get('email') as string;
        const units = formData.get('units') as string;
        
        try {
            const quote = await geminiService.getAutomatedQuote(company, email, units);
            setQuoteContent(quote);
            formRef.current?.reset();
            setIsSubmitted(true);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <section id="b2b" className="py-24 bg-slate-50">
            <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
                <div className="scroll-animate fade-in-up">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">{t('b2b.title')}</h2>
                    <p className="text-slate-600 mb-8">{t('b2b.subtitle')}</p>
                </div>
                <div className="bg-white p-8 rounded-xl shadow-2xl scroll-animate fade-in-up" style={{animationDelay: '150ms'}}>
                     {isSubmitted ? (
                        <div className="text-center p-6">
                             <h3 className="text-2xl font-bold text-green-600 mb-2">{t('b2b.form.success_title')}</h3>
                             <p className="text-slate-600 mb-4">{t('b2b.form.success_desc')}</p>
                             <button onClick={() => setIsSubmitted(false)} className="w-full bg-indigo-600 text-white font-semibold p-3 rounded-full hover:bg-indigo-700 transition-colors">
                                 {t('b2b.form.success_cta')}
                             </button>
                        </div>
                     ) : (
                        <>
                            <h3 className="text-xl font-bold text-center text-slate-800 mb-1">{t('b2b.form.title')}</h3>
                            <SparklesIcon className="w-8 h-8 mx-auto text-indigo-500 mb-4" />
                            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                                <input name="company" type="text" placeholder={t('b2b.form.name')} required className="w-full p-3 rounded-md border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"/>
                                <input name="email" type="email" placeholder={t('b2b.form.email')} required className="w-full p-3 rounded-md border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"/>
                                <input name="units" type="number" placeholder={t('b2b.form.units')} min="1" required className="w-full p-3 rounded-md border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"/>
                                <button type="submit" disabled={isLoading} className="w-full bg-rose-500 text-white font-semibold p-3 rounded-full hover:bg-rose-600 transition-colors disabled:bg-rose-300">
                                {isLoading ? t('b2b.form.loading') : t('b2b.form.cta')}
                                </button>
                            </form>
                        </>
                     )}
                </div>
            </div>
        </section>
    );
};

const LocationsSection: React.FC = () => {
    const { t } = useI18n();
    return (
        <section id="ubicaciones" className="py-24 bg-white">
            <div className="container mx-auto px-6 text-center">
                 <div className="scroll-animate fade-in-up">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">{t('locations.title')}</h2>
                    <p className="text-slate-600 mb-12 max-w-2xl mx-auto">{t('locations.subtitle')}</p>
                 </div>
                 <div className="rounded-xl overflow-hidden shadow-2xl h-96 md:h-[500px] scroll-animate fade-in-up">
                    <iframe 
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3901.989710382098!2d-77.0368706856114!3d-12.042571891471719!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9105c8b5d7d96339%3A0x6a3f2b4a3c6a48a4!2sPlaza%20de%20Armas%20de%20Lima!5e0!3m2!1ses!2spe!4v1678886400000" 
                        width="100%" height="100%" style={{ border: 0 }} allowFullScreen={false} 
                        loading="lazy" referrerPolicy="no-referrer-when-downgrade" title={t('locations.title')}
                    ></iframe>
                </div>
            </div>
        </section>
    )
}

const Footer: React.FC = () => {
    const { t } = useI18n();
    const socialLinks = [
        { name: 'Twitter', icon: TwitterIcon, href: '#' },
        { name: 'Instagram', icon: InstagramIcon, href: '#' },
        { name: 'Facebook', icon: FacebookIcon, href: '#' },
    ];
    return (
        <footer className="bg-slate-800 text-white">
            <div className="container mx-auto px-6 py-12">
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
                     <div className="md:col-span-2">
                        <h4 className="text-lg font-semibold mb-4 text-cyan-400">Pet-Tech Connect</h4>
                        <p className="text-slate-400 text-sm mb-4">{t('footer.about')}</p>
                        <div className="flex justify-center md:justify-start space-x-4">
                            {socialLinks.map(link => (
                                <a key={link.name} href={link.href} aria-label={`Pet-Tech en ${link.name}`} className="text-slate-400 hover:text-cyan-400 transition-colors">
                                    <link.icon className="h-6 w-6" />
                                </a>
                            ))}
                        </div>
                    </div>
                     <div>
                        <h4 className="text-lg font-semibold mb-4">{t('footer.links')}</h4>
                        <ul className="space-y-2 text-sm">
                            <li><button onClick={() => document.querySelector('#servicios')?.scrollIntoView({ behavior: 'smooth' })} className="text-slate-300 hover:text-cyan-400 transition-colors">{t('nav.services')}</button></li>
                            <li><button onClick={() => document.querySelector('#ia-features')?.scrollIntoView({ behavior: 'smooth' })} className="text-slate-300 hover:text-cyan-400 transition-colors">{t('nav.ai_features')}</button></li>
                            <li><button onClick={() => document.querySelector('#b2b')?.scrollIntoView({ behavior: 'smooth' })} className="text-slate-300 hover:text-cyan-400 transition-colors">{t('nav.b2b')}</button></li>
                        </ul>
                    </div>
                     <div>
                         <h4 className="text-lg font-semibold mb-4">{t('footer.legal')}</h4>
                         <ul className="space-y-2 text-sm">
                            <li><a href="#" className="text-slate-300 hover:text-cyan-400 transition-colors">{t('footer.privacy')}</a></li>
                            <li><a href="#" className="text-slate-300 hover:text-cyan-400 transition-colors">{t('footer.terms')}</a></li>
                        </ul>
                    </div>
                 </div>
                 <div className="mt-12 border-t border-slate-700 pt-8 text-center text-slate-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} Pet-Tech Connect. {t('footer.rights')}</p>
                </div>
            </div>
        </footer>
    );
};

// Main Landing Page Component
const LandingPage: React.FC<{
  onAdminPanel: () => void;
  setActiveModal: (modal: ModalType) => void;
  activeModal: ModalType;
  setQuoteContent: (content: string) => void;
  quoteContent: string;
  appActions: AppActions;
}> = ({
  onAdminPanel,
  activeModal,
  setActiveModal,
  quoteContent,
  setQuoteContent,
  appActions
}) => {
    useScrollAnimation();
    const handleSchedule = () => setActiveModal('chat');

    const aiFeatures: AIFeature[] = [
        { icon: ChatIcon, titleKey: 'ai.chat.title', descriptionKey: 'ai.chat.desc', buttonKey: 'ai.chat.button', action: () => setActiveModal('chat') },
        { icon: ScanIcon, titleKey: 'ai.scanner.title', descriptionKey: 'ai.scanner.desc', buttonKey: 'ai.scanner.button', action: () => setActiveModal('scanner') },
        { icon: ArtIcon, titleKey: 'ai.art.title', descriptionKey: 'ai.art.desc', buttonKey: 'ai.art.button', action: () => setActiveModal('art') },
    ];

    useEffect(() => {
        if(quoteContent) {
            setActiveModal('quote');
        }
    }, [quoteContent, setActiveModal]);

    return (
        <div className="bg-white">
            <Header onAdminPanel={onAdminPanel} onSchedule={handleSchedule} />
            <main>
                <HeroSection onSchedule={handleSchedule} />
                <ServicesSection />
                <AIFeaturesSection features={aiFeatures} />
                <LocationsSection />
                <B2BSection setQuoteContent={setQuoteContent} />
            </main>
            <Footer />
            {activeModal === 'scanner' && <BreedScanner onClose={() => setActiveModal(null)} />}
            {activeModal === 'art' && <ArtGenerator onClose={() => setActiveModal(null)} />}
            {activeModal === 'chat' && <PetCareAssistant onClose={() => setActiveModal(null)} appActions={appActions} />}
            {activeModal === 'quote' && quoteContent && <QuoteResultModal onClose={() => { setActiveModal(null); setQuoteContent(''); }} content={quoteContent} />}
        </div>
    );
};

export default LandingPage;