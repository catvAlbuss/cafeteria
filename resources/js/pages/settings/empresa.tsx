import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/empresa';

interface Config {
    id?: number;
    team_id?: number;
    ruc: string;
    razon_social: string;
    nombre_comercial: string;
    direccion: string;
    ubigeo: string;
    departamento: string;
    provincia: string;
    distrito: string;
    telefono: string;
    email: string;
    serie_factura: string;
    serie_boleta: string;
    certificado_path: string | null;
    logo_path: string | null;
    sol_usuario: string;
    sunat_url: string;
    ambiente: 'beta' | 'produccion';
}

interface Props {
    config: Config | null;
    equipo: { id: number; name: string };
}

export default function EmpresaSettings({ config, equipo }: Props) {
    const { data, setData, patch, processing, errors, recentlySuccessful } = useForm({
        ruc: config?.ruc ?? '',
        razon_social: config?.razon_social ?? '',
        nombre_comercial: config?.nombre_comercial ?? '',
        direccion: config?.direccion ?? '',
        ubigeo: config?.ubigeo ?? '100101',
        departamento: config?.departamento ?? 'HUANUCO',
        provincia: config?.provincia ?? 'HUANUCO',
        distrito: config?.distrito ?? 'HUANUCO',
        telefono: config?.telefono ?? '',
        email: config?.email ?? '',
        serie_factura: config?.serie_factura ?? 'F001',
        serie_boleta: config?.serie_boleta ?? 'B001',
        sol_usuario: config?.sol_usuario ?? '',
        sol_clave: '',
        sunat_url: config?.sunat_url ?? 'https://e-factura.sunat.gob.pe/ol-ti-itcpfegem/billService',
        ambiente: config?.ambiente ?? 'produccion',
        certificado: null as File | null,
        logo: null as File | null,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('empresa.update'), {
            forceFormData: true,
        });
    };

    return (
        <>
            <Head title="Configuración de Empresa" />

            <h1 className="sr-only">Configuración de Empresa</h1>

            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-medium">Facturación Electrónica</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Configura los datos de <strong>{equipo.name}</strong> para la emisión de comprobantes electrónicos (SUNAT).
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    {/* Datos de la Empresa */}
                    <div className="rounded-lg border border-border bg-card p-6 space-y-4">
                        <h2 className="text-lg font-semibold border-b border-border pb-3">Datos de la Empresa</h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="ruc">RUC</Label>
                                <Input
                                    id="ruc"
                                    value={data.ruc}
                                    onChange={(e) => setData('ruc', e.target.value)}
                                    maxLength={11}
                                    placeholder="20123456789"
                                />
                                <InputError message={errors.ruc} />
                            </div>
                            <div>
                                <Label htmlFor="razon_social">Razón Social</Label>
                                <Input
                                    id="razon_social"
                                    value={data.razon_social}
                                    onChange={(e) => setData('razon_social', e.target.value)}
                                    placeholder="MI EMPRESA S.A.C."
                                />
                                <InputError message={errors.razon_social} />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="nombre_comercial">Nombre Comercial</Label>
                            <Input
                                id="nombre_comercial"
                                value={data.nombre_comercial}
                                onChange={(e) => setData('nombre_comercial', e.target.value)}
                            />
                            <InputError message={errors.nombre_comercial} />
                        </div>

                        <div>
                            <Label htmlFor="direccion">Dirección Fiscal</Label>
                            <Input
                                id="direccion"
                                value={data.direccion}
                                onChange={(e) => setData('direccion', e.target.value)}
                            />
                            <InputError message={errors.direccion} />
                        </div>

                        <div className="grid grid-cols-4 gap-3">
                            <div>
                                <Label htmlFor="ubigeo" className="text-xs">Ubigeo</Label>
                                <Input id="ubigeo" value={data.ubigeo} onChange={(e) => setData('ubigeo', e.target.value)} maxLength={6} />
                                <InputError message={errors.ubigeo} />
                            </div>
                            <div>
                                <Label htmlFor="departamento" className="text-xs">Departamento</Label>
                                <Input id="departamento" value={data.departamento} onChange={(e) => setData('departamento', e.target.value)} />
                                <InputError message={errors.departamento} />
                            </div>
                            <div>
                                <Label htmlFor="provincia" className="text-xs">Provincia</Label>
                                <Input id="provincia" value={data.provincia} onChange={(e) => setData('provincia', e.target.value)} />
                                <InputError message={errors.provincia} />
                            </div>
                            <div>
                                <Label htmlFor="distrito" className="text-xs">Distrito</Label>
                                <Input id="distrito" value={data.distrito} onChange={(e) => setData('distrito', e.target.value)} />
                                <InputError message={errors.distrito} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="telefono">Teléfono</Label>
                                <Input id="telefono" value={data.telefono} onChange={(e) => setData('telefono', e.target.value)} />
                                <InputError message={errors.telefono} />
                            </div>
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                                <InputError message={errors.email} />
                            </div>
                        </div>
                    </div>

                    {/* Series */}
                    <div className="rounded-lg border border-border bg-card p-6 space-y-4">
                        <h2 className="text-lg font-semibold border-b border-border pb-3">Series de Comprobantes</h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="serie_factura">Serie Factura</Label>
                                <Input id="serie_factura" value={data.serie_factura} onChange={(e) => setData('serie_factura', e.target.value)} maxLength={4} />
                                <InputError message={errors.serie_factura} />
                            </div>
                            <div>
                                <Label htmlFor="serie_boleta">Serie Boleta</Label>
                                <Input id="serie_boleta" value={data.serie_boleta} onChange={(e) => setData('serie_boleta', e.target.value)} maxLength={4} />
                                <InputError message={errors.serie_boleta} />
                            </div>
                        </div>
                    </div>

                    {/* Credenciales SUNAT */}
                    <div className="rounded-lg border border-border bg-card p-6 space-y-4">
                        <h2 className="text-lg font-semibold border-b border-border pb-3">Credenciales SUNAT (SOL)</h2>

                        <div>
                            <Label htmlFor="ambiente">Ambiente SUNAT</Label>
                            <select
                                id="ambiente"
                                value={data.ambiente}
                                onChange={(e) => setData('ambiente', e.target.value as 'beta' | 'produccion')}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="beta">Beta (Pruebas)</option>
                                <option value="produccion">Producción (Real)</option>
                            </select>
                            <InputError message={errors.ambiente} />
                        </div>

                        <div>
                            <Label htmlFor="sol_usuario">Usuario SOL</Label>
                            <Input id="sol_usuario" value={data.sol_usuario} onChange={(e) => setData('sol_usuario', e.target.value)} />
                            <InputError message={errors.sol_usuario} />
                        </div>

                        <div>
                            <Label htmlFor="sol_clave">Clave SOL</Label>
                            <Input
                                id="sol_clave"
                                type="password"
                                value={data.sol_clave}
                                onChange={(e) => setData('sol_clave', e.target.value)}
                                placeholder="Dejar vacío para mantener la actual"
                            />
                            <InputError message={errors.sol_clave} />
                        </div>

                        <div>
                            <Label htmlFor="sunat_url">URL del Servicio SUNAT</Label>
                            <Input id="sunat_url" value={data.sunat_url} onChange={(e) => setData('sunat_url', e.target.value)} />
                            <InputError message={errors.sunat_url} />
                        </div>
                    </div>

                    {/* Archivos */}
                    <div className="rounded-lg border border-border bg-card p-6 space-y-4">
                        <h2 className="text-lg font-semibold border-b border-border pb-3">Archivos</h2>

                        <div>
                            <Label htmlFor="certificado">Certificado Digital (.pem, .p12, .pfx)</Label>
                            <Input
                                id="certificado"
                                type="file"
                                onChange={(e) => setData('certificado', e.target.files?.[0] ?? null)}
                                accept=".pem,.p12,.pfx"
                            />
                            {config?.certificado_path && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    Actual: {config.certificado_path}
                                </p>
                            )}
                            <InputError message={errors.certificado} />
                        </div>

                        <div>
                            <Label htmlFor="logo">Logo para PDF (opcional)</Label>
                            <Input
                                id="logo"
                                type="file"
                                onChange={(e) => setData('logo', e.target.files?.[0] ?? null)}
                                accept="image/*"
                            />
                            {config?.logo_path && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    Actual: {config.logo_path}
                                </p>
                            )}
                            <InputError message={errors.logo} />
                        </div>
                    </div>

                    {/* Botón Guardar */}
                    <div className="flex items-center gap-4 pt-6 border-t border-border">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Guardando...' : 'Guardar Configuración'}
                        </Button>
                        {recentlySuccessful && (
                            <p className="text-sm text-green-600 dark:text-green-400">✓ Guardado correctamente</p>
                        )}
                    </div>
                </form>
            </div>
        </>
    );
}

EmpresaSettings.layout = {
    breadcrumbs: [
        {
            title: 'Empresa',
            href: edit(),
        },
    ],
};