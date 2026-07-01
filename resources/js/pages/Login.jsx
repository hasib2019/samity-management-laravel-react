import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { setAppLanguage } from '../i18n';
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    Loader2,
    ArrowRight,
    ShieldCheck,
    Users,
    Wallet,
    AlertCircle,
    Building2,
} from 'lucide-react';

const featureKeys = [
    { icon: Users, key: 'member_management' },
    { icon: Wallet, key: 'accounts_dues' },
    { icon: ShieldCheck, key: 'role_based_access' },
];

const GuestLanguageToggle = () => {
    const { i18n, t } = useTranslation();

    return (
        <div className="flex overflow-hidden rounded-md border border-slate-200 bg-white/80 backdrop-blur">
            <button
                type="button"
                onClick={() => setAppLanguage('en')}
                className={`px-2.5 py-1 text-xs font-medium ${i18n.language === 'en' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
                EN
            </button>
            <button
                type="button"
                onClick={() => setAppLanguage('bn')}
                className={`px-2.5 py-1 text-xs font-medium ${i18n.language === 'bn' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
                বাংলা
            </button>
        </div>
    );
};

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            const message =
                err.response?.data?.message ||
                err.response?.data?.errors?.email?.[0] ||
                t('login.invalid_credentials');
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex bg-slate-50 text-slate-900">
            {/* Local keyframes for the ambient brand panel */}
            <style>{`
                @keyframes blob {
                    0%, 100% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(24px, -36px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.95); }
                }
                .animate-blob { animation: blob 14s ease-in-out infinite; }
                @keyframes rise {
                    from { opacity: 0; transform: translateY(14px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-rise { animation: rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
            `}</style>

            <div className="absolute top-4 right-4 z-20">
                <GuestLanguageToggle />
            </div>

            {/* ---------- Left: Brand panel ---------- */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-linear-to-br from-blue-900 via-blue-800 to-indigo-900">
                {/* Ambient blurred orbs */}
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-blob" />
                <div className="absolute bottom-0 right-0 w-md h-112 bg-indigo-400/20 rounded-full blur-3xl animate-blob" style={{ animationDelay: '4s' }} />
                <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-sky-400/20 rounded-full blur-3xl animate-blob" style={{ animationDelay: '8s' }} />

                {/* Subtle grid overlay */}
                <div
                    className="absolute inset-0 opacity-[0.07]"
                    style={{
                        backgroundImage:
                            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                        backgroundSize: '44px 44px',
                    }}
                />

                <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 text-white w-full">
                    {/* Logo */}
                    <div className="flex items-center gap-3 animate-rise">
                        <div className="grid place-items-center w-11 h-11 rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <span className="text-lg font-semibold tracking-tight">{t('login.brand')}</span>
                    </div>

                    {/* Headline + features */}
                    <div className="max-w-md">
                        <h1 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight animate-rise">
                            {t('login.headline_line1')}
                            <span className="block text-blue-300">{t('login.headline_line2')}</span>
                        </h1>
                        <p className="mt-5 text-blue-100/80 text-base leading-relaxed animate-rise" style={{ animationDelay: '0.05s' }}>
                            {t('login.subheadline')}
                        </p>

                        <div className="mt-10 space-y-5">
                            {featureKeys.map((f, i) => (
                                <div
                                    key={f.key}
                                    className="flex items-start gap-4 animate-rise"
                                    style={{ animationDelay: `${0.15 + i * 0.08}s` }}
                                >
                                    <div className="grid place-items-center shrink-0 w-10 h-10 rounded-lg bg-white/10 ring-1 ring-white/15">
                                        <f.icon className="w-5 h-5 text-blue-200" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{t(`login.features.${f.key}.title`)}</p>
                                        <p className="text-sm text-blue-100/70">{t(`login.features.${f.key}.desc`)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="text-sm text-blue-200/60 animate-rise" style={{ animationDelay: '0.4s' }}>
                        {t('login.footer_rights', { year: new Date().getFullYear() })}
                    </p>
                </div>
            </div>

            {/* ---------- Right: Login form ---------- */}
            <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-10">
                <div className="w-full max-w-md animate-rise">
                    {/* Mobile brand */}
                    <div className="lg:hidden flex items-center gap-3 mb-10">
                        <div className="grid place-items-center w-11 h-11 rounded-xl bg-blue-900 text-white">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <span className="text-lg font-semibold tracking-tight">{t('login.brand')}</span>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">{t('login.welcome_back')}</h2>
                        <p className="mt-2 text-slate-500">{t('login.sign_in_subtitle')}</p>
                    </div>

                    {error && (
                        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 animate-rise">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                                {t('login.email_label')}
                            </label>
                            <div className="relative">
                                <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t('login.email_placeholder')}
                                    className="w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                                    {t('login.password_label')}
                                </label>
                                <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition">
                                    {t('login.forgot_password')}
                                </a>
                            </div>
                            <div className="relative">
                                <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full rounded-xl border border-slate-300 bg-white pl-11 pr-11 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Remember me */}
                        <label className="flex items-center gap-2.5 select-none cursor-pointer">
                            <input
                                type="checkbox"
                                checked={remember}
                                onChange={(e) => setRemember(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/30"
                            />
                            <span className="text-sm text-slate-600">{t('login.remember_me')}</span>
                        </label>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-700 to-indigo-700 px-4 py-3 font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:from-blue-800 hover:to-indigo-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    {t('login.signing_in')}
                                </>
                            ) : (
                                <>
                                    {t('login.sign_in')}
                                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-slate-500">
                        {t('login.protected_area')}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
