import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { X } from 'lucide-react';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <Head title="Iniciar Sesión" />

            {/* Fondo de pantalla completa */}
            <div 
                className="flex min-h-screen items-center justify-center bg-cover bg-center"
                style={{
                    backgroundImage: `url('/img/login.png')`
                }}
            >
                {/* Capa oscura */}
                <div className="absolute inset-0 bg-black/50"></div>
                
                {/* Contenido centrado */}
                <div className="relative z-10 text-center">
                    <div className="mb-12">
                        <h1 className="font-serif text-6xl font-bold tracking-wider text-white drop-shadow-lg">
                            DOLCE CAFFE
                        </h1>
                        <p className="mt-2 text-sm font-light tracking-[0.5em] text-white/80">
                            EST. 2023
                        </p>
                    </div>

                    <Button
                        onClick={() => setIsModalOpen(true)}
                        className="px-10 py-4 text-lg font-medium bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-2 border-white/50 rounded-lg transition-all duration-300 hover:scale-105"
                    >
                        Iniciar Sesión
                    </Button>
                </div>

                {/* MODAL */}
                {isModalOpen && (
                    <div 
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <div 
                            className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            <h2 className="mb-6 text-center font-serif text-3xl font-bold text-amber-800">
                                Iniciar Sesión
                            </h2>

                            <Form
                                method="post"
                                action="/login"
                                className="flex flex-col gap-6"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="email" className="text-gray-700">
                                                Correo electrónico
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                name="email"
                                                required
                                                autoFocus
                                                autoComplete="email"
                                                placeholder="tucorreo@ejemplo.com"
                                                className="border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                                            />
                                            <InputError message={errors.email} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="password" className="text-gray-700">
                                                Contraseña
                                            </Label>
                                            <PasswordInput
                                                id="password"
                                                name="password"
                                                required
                                                autoComplete="current-password"
                                                placeholder="••••••••"
                                                className="border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                                            />
                                            <InputError message={errors.password} />
                                        </div>

                                        <div className="flex items-center space-x-3">
                                            <Checkbox
                                                id="remember"
                                                name="remember"
                                                className="border-gray-300 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                                            />
                                            <Label htmlFor="remember" className="text-sm text-gray-600">
                                                Recordarme
                                            </Label>
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full bg-amber-700 hover:bg-amber-800 text-white font-medium py-2 rounded-lg transition duration-200"
                                            disabled={processing}
                                        >
                                            {processing && <Spinner />}
                                            Iniciar Sesión
                                        </Button>

                                        {canResetPassword && (
                                            <a
                                                href="/forgot-password"
                                                className="text-center text-sm text-amber-600 hover:text-amber-800 hover:underline"
                                            >
                                                ¿Olvidaste tu contraseña?
                                            </a>
                                        )}
                                    </>
                                )}
                            </Form>

                            {status && (
                                <div className="mt-4 text-center text-sm font-medium text-green-600">
                                    {status}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}


Login.layout = (page: React.ReactNode) => page;