

import React, { useState } from 'react';
import { useI18n } from '../i18n';
import { BrandIcon, GoogleIcon } from '../constants';

interface LoginPageProps {
    onLogin: (password: string) => boolean;
    onGoogleLogin: () => void;
    onBack: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onGoogleLogin, onBack }) => {
    const { t } = useI18n();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const success = onLogin(password);
        if (!success) {
            setError(t('login.error'));
            setPassword('');
        } else {
            setError('');
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <BrandIcon className="h-16 w-16 text-cyan-400 mx-auto" />
                    <h1 className="text-3xl font-extrabold text-white mt-4">Pet-Tech<span className="text-cyan-500">Connect</span></h1>
                    <h2 className="text-xl font-bold text-slate-300 mt-2">{t('login.title')}</h2>
                    <p className="text-slate-400">{t('login.subtitle')}</p>
                </div>

                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700">{t('login.password')}</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="mt-1 w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>
                        {error && <p className="text-rose-600 text-sm text-center">{error}</p>}
                        <div>
                            <button
                                type="submit"
                                className="w-full bg-indigo-600 text-white font-semibold p-3 rounded-full hover:bg-indigo-700 transition-colors disabled:bg-indigo-300"
                            >
                                {t('login.button')}
                            </button>
                        </div>
                    </form>
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-slate-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-white px-2 text-slate-500">{t('google_popup.subtitle')}</span>
                        </div>
                    </div>
                     <div>
                        <button
                            type="button"
                            onClick={onGoogleLogin}
                            className="w-full flex justify-center items-center space-x-3 py-3 px-4 border border-slate-300 rounded-full text-slate-700 font-semibold hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <GoogleIcon className="w-5 h-5" />
                            <span>{t('dashboard.google.connect_button')}</span>
                        </button>
                    </div>
                </div>
                 <button onClick={onBack} className="mt-8 text-sm text-slate-400 hover:text-white transition-colors">
                    &larr; {t('login.back')}
                 </button>
            </div>
        </div>
    );
};

export default LoginPage;