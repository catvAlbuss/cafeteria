import { Form, Head } from '@inertiajs/react';
import { X, Coffee, User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { swalError, errorsToText } from '@/lib/swal';

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

            <div className="relative min-h-screen w-full overflow-hidden bg-cream-soft font-sans transition-colors dark:bg-walnut">
                {/* ===== DECORACIONES ===== */}

                {/* Blob decorativo superior derecho */}
                <svg
                    className="pointer-events-none absolute -top-10 right-0 w-[55%] max-w-2xl opacity-90 dark:opacity-20"
                    viewBox="0 0 600 500"
                    fill="none"
                >
                    <path
                        d="M120 0C220 20 260 90 340 60C420 30 470 -30 600 10V500H0C-10 380 60 320 40 220C20 120 20 -20 120 0Z"
                        className="fill-mocha dark:fill-espresso"
                    />
                </svg>

                {/* Doodles lineales */}
                <svg
                    className="pointer-events-none absolute top-6 left-1/3 hidden h-40 w-40 text-cinnamon/70 md:block dark:text-gold/30"
                    viewBox="0 0 160 160"
                    fill="none"
                >
                    <circle
                        cx="35"
                        cy="35"
                        r="26"
                        stroke="currentColor"
                        strokeWidth="1.2"
                    />
                    <path
                        d="M35 61C60 70 70 40 95 45C120 50 110 90 150 80"
                        stroke="currentColor"
                        strokeWidth="1.2"
                    />
                </svg>
                <svg
                    className="pointer-events-none absolute top-0 -left-6 hidden h-72 w-24 text-cinnamon/50 md:block dark:text-gold/20"
                    viewBox="0 0 100 300"
                    fill="none"
                >
                    <path
                        d="M10 0C40 40 -10 70 20 110C50 150 10 190 30 230C45 260 20 280 25 300"
                        stroke="currentColor"
                        strokeWidth="1.2"
                    />
                </svg>

                {/* Hojas decorativas inferiores */}
                <svg
                    className="pointer-events-none absolute bottom-0 left-0 w-40 text-cinnamon/70 md:w-56 dark:text-gold/30"
                    viewBox="0 0 200 220"
                    fill="none"
                >
                    <path
                        d="M10 220 C 20 160 15 120 40 70 C 55 45 75 30 95 15"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    <ellipse
                        cx="55"
                        cy="95"
                        rx="16"
                        ry="8"
                        fill="currentColor"
                        opacity="0.5"
                        transform="rotate(-30 55 95)"
                    />
                    <ellipse
                        cx="72"
                        cy="65"
                        rx="16"
                        ry="8"
                        fill="currentColor"
                        opacity="0.6"
                        transform="rotate(-25 72 65)"
                    />
                    <ellipse
                        cx="88"
                        cy="35"
                        rx="14"
                        ry="7"
                        fill="currentColor"
                        opacity="0.7"
                        transform="rotate(-20 88 35)"
                    />
                </svg>
                <svg
                    className="pointer-events-none absolute right-0 bottom-0 w-40 scale-x-[-1] text-cinnamon/70 md:w-56 dark:text-gold/30"
                    viewBox="0 0 200 220"
                    fill="none"
                >
                    <path
                        d="M10 220 C 20 160 15 120 40 70 C 55 45 75 30 95 15"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    <ellipse
                        cx="55"
                        cy="95"
                        rx="16"
                        ry="8"
                        fill="currentColor"
                        opacity="0.5"
                        transform="rotate(-30 55 95)"
                    />
                    <ellipse
                        cx="72"
                        cy="65"
                        rx="16"
                        ry="8"
                        fill="currentColor"
                        opacity="0.6"
                        transform="rotate(-25 72 65)"
                    />
                    <ellipse
                        cx="88"
                        cy="35"
                        rx="14"
                        ry="7"
                        fill="currentColor"
                        opacity="0.7"
                        transform="rotate(-20 88 35)"
                    />
                </svg>

                {/* ===== CONTENIDO PRINCIPAL ===== */}
                <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-6 pt-28 pb-40 md:grid-cols-2 md:px-12 md:pt-32">
                    {/* ===== COLUMNA IZQUIERDA - TEXTO ===== */}
                    <div className="text-left">
                        <div className="mb-5 flex items-center gap-2">
                            <Coffee className="h-5 w-5 -rotate-6 text-cinnamon dark:text-gold" />
                            <span className="text-[11px] font-semibold tracking-[0.2em] text-cinnamon uppercase md:text-xs dark:text-gold">
                                Café de calidad, momentos inolvidables
                            </span>
                        </div>

                        <h1 className="font-serif text-5xl leading-[1.05] font-bold text-espresso md:text-6xl dark:text-latte">
                            El sabor que
                            <br />
                            hace tu día
                            <span className="font-serif font-semibold text-cinnamon italic dark:text-gold">
                                {' '}
                                mejor
                            </span>
                        </h1>

                        <p className="mt-6 max-w-md text-base leading-relaxed text-espresso/70 md:text-lg dark:text-latte/70">
                            En Dolce Café ofrecemos cafés de especialidad,
                            preparados con pasión y los mejores ingredientes
                            para ti.
                        </p>

                        {/* ===== BOTÓN DE LOGIN (abre modal) ===== */}
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="group mt-8 inline-flex items-center gap-3 rounded-2xl bg-cinnamon py-4 pr-8 pl-5 shadow-lg shadow-cinnamon/30 transition-all duration-300 hover:bg-espresso active:scale-95 dark:bg-gold dark:shadow-black/40 dark:hover:bg-gold-deep"
                        >
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 dark:bg-black/15">
                                <User className="h-4 w-4 text-white dark:text-ink" />
                            </span>
                            <span className="font-sans text-base font-semibold text-cream-soft dark:text-ink">
                                Iniciar sesión
                            </span>
                            <ArrowRight className="h-4 w-4 text-cream-soft transition-transform duration-300 group-hover:translate-x-1 dark:text-ink" />
                        </button>
                    </div>

                    {/* ===== COLUMNA DERECHA - IMAGEN ===== */}
                    <div className="relative flex justify-center md:justify-end">
                        <div className="relative w-full max-w-md">
                            <img
                                src="https://images.unsplash.com/photo-1523247140972-52cc3cdd2715?fm=jpg&q=80&w=900&auto=format&fit=crop"
                                alt="Latte art"
                                className="h-auto w-full rounded-[2rem] object-cover shadow-2xl shadow-cinnamon/30"
                            />
                            <div className="absolute -bottom-6 -left-8 h-24 w-24 rounded-full bg-cinnamon/90 opacity-90 blur-[1px] md:h-28 md:w-28"></div>
                        </div>
                    </div>
                </div>

                {/* ===== FRANJA INFERIOR ===== */}
                <div className="absolute bottom-0 left-0 h-[92px] w-full bg-sand dark:bg-walnut"></div>
                <svg
                    className="absolute bottom-[92px] left-0 w-full text-sand dark:text-walnut"
                    viewBox="0 0 1440 100"
                    preserveAspectRatio="none"
                >
                    <path
                        d="M0,40 C360,100 1080,0 1440,50 L1440,100 L0,100 Z"
                        fill="currentColor"
                    />
                </svg>

                {/* ===== SELLO INFERIOR ===== */}
                <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2">
                    <Coffee className="h-8 w-8 text-cinnamon dark:text-gold" />
                    <div className="flex items-center gap-4">
                        <span className="h-px w-16 bg-cinnamon/50 md:w-24 dark:bg-gold/40"></span>
                        <span className="text-[10px] font-medium tracking-[0.35em] text-cinnamon uppercase md:text-xs dark:text-gold">
                            Pasión en cada taza
                        </span>
                        <span className="h-px w-16 bg-cinnamon/50 md:w-24 dark:bg-gold/40"></span>
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
                            className="mx-4 w-full max-w-md scale-100 transform rounded-3xl bg-card p-8 shadow-2xl transition-all duration-300 dark:bg-walnut dark:shadow-black/50"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* ===== CABECERA DEL MODAL ===== */}
                            <div className="mb-6 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sand dark:bg-espresso">
                                        <Coffee className="h-5 w-5 text-cinnamon dark:text-gold" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-espresso dark:text-latte">
                                            Iniciar Sesión
                                        </h2>
                                        <p className="text-xs text-espresso/50 dark:text-latte/50">
                                            Ingresa tus credenciales
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex h-8 w-8 items-center justify-center rounded-full text-cocoa-soft transition hover:bg-sand hover:text-cocoa dark:text-latte/40 dark:hover:bg-white/10 dark:hover:text-latte/70"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* ===== FORMULARIO ===== */}
                            <Form
                                method="post"
                                action="/login"
                                className="flex flex-col gap-5"
                                onError={(errors) =>
                                    swalError(
                                        'No se pudo iniciar sesión',
                                        errorsToText(errors),
                                    )
                                }
                            >
                                {({ processing, errors }) => (
                                    <>
                                        {/* Email */}
                                        <div className="grid gap-1.5">
                                            <Label
                                                htmlFor="email"
                                                className="text-sm font-medium text-espresso/70 dark:text-latte/70"
                                            >
                                                Correo electrónico
                                            </Label>
                                            <div className="relative">
                                                <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-espresso/40 dark:text-latte/40" />
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    name="email"
                                                    required
                                                    autoFocus
                                                    autoComplete="email"
                                                    placeholder="tucorreo@ejemplo.com"
                                                    className="rounded-xl border-wheat py-3 pl-10 focus:border-cinnamon focus:ring-2 focus:ring-cinnamon/50 dark:border-white/10 dark:text-latte dark:placeholder:text-latte/30"
                                                />
                                            </div>
                                            <InputError
                                                message={errors.email}
                                            />
                                        </div>

                                        {/* Contraseña */}
                                        <div className="grid gap-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label
                                                    htmlFor="password"
                                                    className="text-sm font-medium text-espresso/70 dark:text-latte/70"
                                                >
                                                    Contraseña
                                                </Label>
                                                {canResetPassword && (
                                                    <a
                                                        href="/forgot-password"
                                                        className="text-xs text-cinnamon transition hover:text-cinnamon hover:underline dark:text-gold dark:hover:text-latte"
                                                    >
                                                        ¿Olvidaste tu
                                                        contraseña?
                                                    </a>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-espresso/40 dark:text-latte/40" />
                                                <PasswordInput
                                                    id="password"
                                                    name="password"
                                                    required
                                                    autoComplete="current-password"
                                                    placeholder="••••••••"
                                                    className="rounded-xl border-wheat py-3 pr-12 pl-10 focus:border-cinnamon focus:ring-2 focus:ring-cinnamon/50 dark:border-white/10 dark:text-latte dark:placeholder:text-latte/30"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowPassword(
                                                            !showPassword,
                                                        )
                                                    }
                                                    className="absolute top-1/2 right-3 -translate-y-1/2 text-espresso/40 transition hover:text-espresso/70 dark:text-latte/40 dark:hover:text-latte/70"
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </div>
                                            <InputError
                                                message={errors.password}
                                            />
                                        </div>

                                        {/* Recordarme */}
                                        <div className="flex items-center space-x-3">
                                            <Checkbox
                                                id="remember"
                                                name="remember"
                                                className="border-cocoa-soft/40 data-[state=checked]:border-cinnamon data-[state=checked]:bg-cinnamon dark:border-white/20"
                                            />
                                            <Label
                                                htmlFor="remember"
                                                className="text-sm text-espresso/60 dark:text-latte/60"
                                            >
                                                Recordarme
                                            </Label>
                                        </div>

                                        {/* Botón Iniciar Sesión */}
                                        <Button
                                            type="submit"
                                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-cinnamon py-3.5 font-semibold text-white transition duration-200 hover:bg-espresso dark:bg-gold dark:text-ink dark:hover:bg-gold-deep"
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
                                <div className="mt-4 text-center text-sm font-medium text-green-600 dark:text-green-400">
                                    {status}
                                </div>
                            )}

                            {/* Footer del modal */}
                            <div className="mt-6 flex justify-center border-t border-sand pt-5 dark:border-white/10">
                                <span className="text-xs text-espresso/40 dark:text-latte/40">
                                    Dolce Café © 2025 - El sabor que hace tu día
                                    mejor
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
