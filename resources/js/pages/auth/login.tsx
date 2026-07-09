import { Form, Head, router } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { X, Coffee, User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    return (
        <>
            <Head title="Dolce Café - Iniciar Sesión" />

            <div className="relative min-h-screen w-full overflow-hidden bg-[#FBF3E7] font-sans">
                
                {/* ===== DECORACIONES ===== */}
                
                {/* Blob decorativo superior derecho */}
                <svg className="absolute -top-10 right-0 w-[55%] max-w-2xl opacity-90 pointer-events-none" viewBox="0 0 600 500" fill="none">
                    <path d="M120 0C220 20 260 90 340 60C420 30 470 -30 600 10V500H0C-10 380 60 320 40 220C20 120 20 -20 120 0Z" fill="#EAD2AF"/>
                </svg>

                {/* Doodles lineales */}
                <svg className="absolute top-6 left-1/3 w-40 h-40 text-[#8A5A2B]/70 pointer-events-none hidden md:block" viewBox="0 0 160 160" fill="none">
                    <circle cx="35" cy="35" r="26" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M35 61C60 70 70 40 95 45C120 50 110 90 150 80" stroke="currentColor" strokeWidth="1.2"/>
                </svg>
                <svg className="absolute top-0 -left-6 w-24 h-72 text-[#8A5A2B]/50 pointer-events-none hidden md:block" viewBox="0 0 100 300" fill="none">
                    <path d="M10 0C40 40 -10 70 20 110C50 150 10 190 30 230C45 260 20 280 25 300" stroke="currentColor" strokeWidth="1.2"/>
                </svg>

                {/* Hojas decorativas inferiores */}
                <svg className="absolute bottom-0 left-0 w-40 md:w-56 text-[#8A5A2B]/70 pointer-events-none" viewBox="0 0 200 220" fill="none">
                    <path d="M10 220 C 20 160 15 120 40 70 C 55 45 75 30 95 15" stroke="currentColor" strokeWidth="2"/>
                    <ellipse cx="55" cy="95" rx="16" ry="8" fill="currentColor" opacity="0.5" transform="rotate(-30 55 95)"/>
                    <ellipse cx="72" cy="65" rx="16" ry="8" fill="currentColor" opacity="0.6" transform="rotate(-25 72 65)"/>
                    <ellipse cx="88" cy="35" rx="14" ry="7" fill="currentColor" opacity="0.7" transform="rotate(-20 88 35)"/>
                </svg>
                <svg className="absolute bottom-0 right-0 w-40 md:w-56 text-[#8A5A2B]/70 pointer-events-none scale-x-[-1]" viewBox="0 0 200 220" fill="none">
                    <path d="M10 220 C 20 160 15 120 40 70 C 55 45 75 30 95 15" stroke="currentColor" strokeWidth="2"/>
                    <ellipse cx="55" cy="95" rx="16" ry="8" fill="currentColor" opacity="0.5" transform="rotate(-30 55 95)"/>
                    <ellipse cx="72" cy="65" rx="16" ry="8" fill="currentColor" opacity="0.6" transform="rotate(-25 72 65)"/>
                    <ellipse cx="88" cy="35" rx="14" ry="7" fill="currentColor" opacity="0.7" transform="rotate(-20 88 35)"/>
                </svg>

                {/* ===== CONTENIDO PRINCIPAL ===== */}
                <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-28 md:pt-32 pb-40 grid md:grid-cols-2 gap-10 items-center min-h-screen">
                    
                    {/* ===== COLUMNA IZQUIERDA - TEXTO ===== */}
                    <div className="text-left">
                        <div className="flex items-center gap-2 mb-5">
                            <Coffee className="w-5 h-5 text-[#8A5A2B] -rotate-6" />
                            <span className="text-[11px] md:text-xs tracking-[0.2em] font-semibold text-[#5A3A1E] uppercase">
                                Café de calidad, momentos inolvidables
                            </span>
                        </div>

                        <h1 className="font-serif font-bold text-5xl md:text-6xl leading-[1.05] text-[#3A2314]">
                            El sabor que<br/>
                            hace tu día
                            <span className="font-serif italic font-semibold text-[#8A5A2B]"> mejor</span>
                        </h1>

                        <p className="mt-6 max-w-md text-[#3A2314]/70 text-base md:text-lg leading-relaxed">
                            En Dolce Café ofrecemos cafés de especialidad, preparados con pasión y los mejores ingredientes para ti.
                        </p>

                        {/* ===== BOTÓN DE LOGIN (abre modal) ===== */}
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-[#5A3A1E] hover:bg-[#3A2314] active:scale-95 transition-all duration-300 shadow-lg shadow-[#5A3A1E]/30 pl-5 pr-8 py-4 group"
                        >
                            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white/15">
                                <User className="w-4 h-4 text-white" />
                            </span>
                            <span className="font-sans font-semibold text-[#FBF3E7] text-base">
                                Iniciar sesión
                            </span>
                            <ArrowRight className="w-4 h-4 text-[#FBF3E7] group-hover:translate-x-1 transition-transform duration-300" />
                        </button>
                    </div>

                    {/* ===== COLUMNA DERECHA - IMAGEN ===== */}
                    <div className="relative flex justify-center md:justify-end">
                        <div className="relative w-full max-w-md">
                            <img
                                src="https://images.unsplash.com/photo-1523247140972-52cc3cdd2715?fm=jpg&q=80&w=900&auto=format&fit=crop"
                                alt="Latte art"
                                className="w-full h-auto rounded-[2rem] shadow-2xl shadow-[#5A3A1E]/30 object-cover"
                            />
                            <div className="absolute -bottom-6 -left-8 w-24 h-24 md:w-28 md:h-28 rounded-full bg-[#5A3A1E]/90 blur-[1px] opacity-90"></div>
                        </div>
                    </div>
                </div>

                {/* ===== FRANJA INFERIOR ===== */}
                <div className="absolute bottom-0 left-0 w-full h-[92px] bg-[#F3E1C8]"></div>
                <svg className="absolute bottom-[92px] left-0 w-full text-[#F3E1C8]" viewBox="0 0 1440 100" preserveAspectRatio="none">
                    <path d="M0,40 C360,100 1080,0 1440,50 L1440,100 L0,100 Z" fill="currentColor"/>
                </svg>

                {/* ===== SELLO INFERIOR ===== */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20">
                    <Coffee className="w-8 h-8 text-[#8A5A2B]" />
                    <div className="flex items-center gap-4">
                        <span className="h-px w-16 md:w-24 bg-[#8A5A2B]/50"></span>
                        <span className="text-[10px] md:text-xs tracking-[0.35em] text-[#8A5A2B] font-medium uppercase">
                            Pasión en cada taza
                        </span>
                        <span className="h-px w-16 md:w-24 bg-[#8A5A2B]/50"></span>
                    </div>
                </div>

                {/* ============================================================ */}
                {/* ===== MODAL DE LOGIN ===== */}
                {/* ============================================================ */}
                {isModalOpen && (
                    <div 
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <div 
                            className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl transform transition-all duration-300 scale-100"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* ===== CABECERA DEL MODAL ===== */}
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#F3E1C8] flex items-center justify-center">
                                        <Coffee className="w-5 h-5 text-[#5A3A1E]" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-[#3A2314]">Iniciar Sesión</h2>
                                        <p className="text-xs text-[#3A2314]/50">Ingresa tus credenciales</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* ===== FORMULARIO ===== */}
                            <Form
                                method="post"
                                action="/login"
                                className="flex flex-col gap-5"
                                onSuccess={() => {
                                    // ✅ Redirige al dashboard después del login exitoso
                                    router.visit('/dashboard');
                                }}
                            >
                                {({ processing, errors }) => (
                                    <>
                                        {/* Email */}
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="email" className="text-sm font-medium text-[#3A2314]/70">
                                                Correo electrónico
                                            </Label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3A2314]/40" />
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    name="email"
                                                    required
                                                    autoFocus
                                                    autoComplete="email"
                                                    placeholder="tucorreo@ejemplo.com"
                                                    className="pl-10 border-gray-200 focus:ring-2 focus:ring-[#8A5A2B]/50 focus:border-[#8A5A2B] rounded-xl py-3"
                                                />
                                            </div>
                                            <InputError message={errors.email} />
                                        </div>

                                        {/* Contraseña */}
                                        <div className="grid gap-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="password" className="text-sm font-medium text-[#3A2314]/70">
                                                    Contraseña
                                                </Label>
                                                {canResetPassword && (
                                                    <a
                                                        href="/forgot-password"
                                                        className="text-xs text-[#8A5A2B] hover:text-[#5A3A1E] hover:underline transition"
                                                    >
                                                        ¿Olvidaste tu contraseña?
                                                    </a>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3A2314]/40" />
                                                <PasswordInput
                                                    id="password"
                                                    name="password"
                                                    required
                                                    autoComplete="current-password"
                                                    placeholder="••••••••"
                                                    className="pl-10 pr-12 border-gray-200 focus:ring-2 focus:ring-[#8A5A2B]/50 focus:border-[#8A5A2B] rounded-xl py-3"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3A2314]/40 hover:text-[#3A2314]/70 transition"
                                                >
                                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            <InputError message={errors.password} />
                                        </div>

                                        {/* Recordarme */}
                                        <div className="flex items-center space-x-3">
                                            <Checkbox
                                                id="remember"
                                                name="remember"
                                                className="border-gray-300 data-[state=checked]:bg-[#8A5A2B] data-[state=checked]:border-[#8A5A2B]"
                                            />
                                            <Label htmlFor="remember" className="text-sm text-[#3A2314]/60">
                                                Recordarme
                                            </Label>
                                        </div>

                                        {/* Botón Iniciar Sesión */}
                                        <Button
                                            type="submit"
                                            className="w-full bg-[#5A3A1E] hover:bg-[#3A2314] text-white font-semibold py-3.5 rounded-xl transition duration-200 flex items-center justify-center gap-2"
                                            disabled={processing}
                                        >
                                            {processing && <Spinner />}
                                            Iniciar Sesión
                                        </Button>
                                    </>
                                )}
                            </Form>

                            {/* Mensaje de estado */}
                            {status && (
                                <div className="mt-4 text-center text-sm font-medium text-green-600">
                                    {status}
                                </div>
                            )}

                            {/* Footer del modal */}
                            <div className="mt-6 pt-5 border-t border-gray-100 flex justify-center">
                                <span className="text-xs text-[#3A2314]/40">
                                    Dolce Café © 2025 - El sabor que hace tu día mejor
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

// ✅ Sin layout para que ocupe toda la pantalla
Login.layout = (page: React.ReactNode) => page;