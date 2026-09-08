import { Head, usePage, router } from "@inertiajs/react";
import { useState } from "react";
import { Pencil, X } from "lucide-react";
import QRScanner from "@/components/QRScanner";

interface Inventario {
    id: number;
    codigo: string;
    nombre: string;
    marca: string;
    stock: number;
    areas_id: string;
    area?: {
        id: number;
        nombre: string;
    };
}

interface Area {
    id: number;
    nombre: string;
}

interface Botella {
    id: number;
    codigo: string;
    nombre: string;
    marca: string;
    cantidad: number;
}

const FORM_VACIO = {
    codigo: "",
    nombre: "",
    marca: "",
    stock: "",
    areas_id: "",
};

export default function Inventario() {
    const { inventarios, areas, botellas } = usePage<{
        inventarios: Inventario[];
        areas: Area[];
        botellas: Botella[];
    }>().props;

    const [form, setForm] = useState(FORM_VACIO);
    const [editando, setEditando] = useState(false);
    const [idEditar, setIdEditar] = useState<number | null>(null);

    const [mostrarQR, setMostrarQR] = useState(false);
    const [mostrarQRBotella, setMostrarQRBotella] = useState(false);

    const limpiarFormulario = () => {
        setEditando(false);
        setIdEditar(null);
        setForm(FORM_VACIO);
    };

    const guardar = () => {
        router.post(
            "/inventarios",
            {
                ...form,
                stock: Number(form.stock),
            },
            {
                onSuccess: () => {
                    limpiarFormulario();
                },
            }
        );
    };

    const editar = (item: Inventario) => {
        setEditando(true);
        setIdEditar(item.id);

        setForm({
            codigo: item.codigo,
            nombre: item.nombre,
            marca: item.marca,
            stock: item.stock.toString(),
            areas_id: item.areas_id.toString(),
        });
    };

    const actualizar = () => {
        if (!idEditar) return;

        router.put(
            `/inventarios/${idEditar}`,
            {
                ...form,
                stock: Number(form.stock),
            },
            {
                onSuccess: () => {
                    limpiarFormulario();
                },
            }
        );
    };

    const buscarInventarioPorCodigo = (codigo: string) => {
        return inventarios.find(
            (item) => item.codigo.toString().trim() === codigo.toString().trim()
        );
    };

    const buscarBotellaPorCodigo = (codigo: string) => {
        return botellas.find(
            (item) => item.codigo.toString().trim() === codigo.toString().trim()
        );
    };

    // Guarda o actualiza directamente en la BD, sin esperar click del usuario.
    const guardarAutomatico = (
        datos: {
            codigo: string;
            nombre: string;
            marca: string;
            stock: number;
            areas_id: string;
        },
        inventarioExistente?: Inventario
    ) => {
        if (inventarioExistente) {
            router.put(
                `/inventarios/${inventarioExistente.id}`,
                { ...datos },
                {
                    onSuccess: () => {
                        limpiarFormulario();
                    },
                }
            );
        } else {
            router.post(
                "/inventarios",
                { ...datos },
                {
                    onSuccess: () => {
                        limpiarFormulario();
                    },
                }
            );
        }
    };

    return (
        <>
            <Head title="Inventario" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6 bg-[#FBF3E7]">
                <h1 className="text-3xl font-bold">Inventario</h1>

                <div className="bg-white shadow rounded-xl p-5">
                    <div className="grid grid-cols-5 gap-4">
                        <input
                            className="border rounded-lg p-2"
                            placeholder="Código"
                            value={form.codigo}
                            onChange={(e) =>
                                setForm({ ...form, codigo: e.target.value })
                            }
                        />

                        <input
                            className="border rounded-lg p-2"
                            placeholder="Nombre"
                            value={form.nombre}
                            onChange={(e) =>
                                setForm({ ...form, nombre: e.target.value })
                            }
                        />

                        <input
                            className="border rounded-lg p-2"
                            placeholder="Marca"
                            value={form.marca}
                            onChange={(e) =>
                                setForm({ ...form, marca: e.target.value })
                            }
                        />

                        <input
                            className="border rounded-lg p-2"
                            type="number"
                            min="0"
                            step="1"
                            placeholder="Stock"
                            value={form.stock}
                            onChange={(e) =>
                                setForm({ ...form, stock: e.target.value })
                            }
                        />

                        <select
                            className="border rounded-lg p-2"
                            value={form.areas_id}
                            onChange={(e) =>
                                setForm({ ...form, areas_id: e.target.value })
                            }
                        >
                            <option value="">Seleccionar área</option>
                            {areas.map((area) => (
                                <option key={area.id} value={area.id}>
                                    {area.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-wrap gap-5 mt-5 items-center">
                        <button
                            onClick={editando ? actualizar : guardar}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg shadow"
                        >
                            {editando ? "Actualizar Inventario" : "Guardar Inventario"}
                        </button>

                        {editando && (
                            <button
                                onClick={limpiarFormulario}
                                className="flex items-center gap-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg shadow"
                            >
                                <X size={16} /> Cancelar
                            </button>
                        )}

                        <button
                            onClick={() => {
                                if (!form.areas_id) {
                                    alert(
                                        "Selecciona primero el área antes de escanear, para poder guardar automáticamente."
                                    );
                                    return;
                                }
                                setMostrarQRBotella(!mostrarQRBotella);
                                setMostrarQR(false);
                            }}
                            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg shadow"
                        >
                            Escanear QR Botella
                        </button>
                    </div>

                    {/* ================= QR BOTELLA ================= */}
                    {mostrarQRBotella && (
                        <div className="mt-5 bg-white p-5 rounded-xl shadow w-fit">
                            <h2 className="text-xl font-bold mb-4">Escanear Botella</h2>

                            <QRScanner
                                activo={mostrarQRBotella}
                                onScan={(codigo) => {
                                    console.log("QR Botella:", codigo);

                                    if (!form.areas_id) {
                                        alert(
                                            "Falta seleccionar el área. No se guardó automáticamente."
                                        );
                                        setMostrarQRBotella(false);
                                        return;
                                    }

                                    const botella = buscarBotellaPorCodigo(codigo);
                                    const inventarioExistente =
                                        buscarInventarioPorCodigo(codigo);

                                    const datos = botella
                                        ? {
                                              codigo: botella.codigo,
                                              nombre: botella.nombre,
                                              marca: botella.marca,
                                              stock: botella.cantidad,
                                              areas_id: form.areas_id,
                                          }
                                        : {
                                              codigo,
                                              nombre: "Producto sin catálogo",
                                              marca: "-",
                                              stock: 1,
                                              areas_id: form.areas_id,
                                          };

                                    guardarAutomatico(datos, inventarioExistente);
                                    setMostrarQRBotella(false);
                                }}
                            />
                        </div>
                    )}

                    {/* ================= QR INVENTARIO ================= */}
                    {mostrarQR && (
                        <div className="mt-5 bg-white p-5 rounded-xl shadow w-fit">
                            <h2 className="text-xl font-bold mb-4">Escanear Inventario</h2>

                            <QRScanner
                                activo={mostrarQR}
                                onScan={(codigo) => {
                                    console.log("Código leído:", codigo);

                                    if (!form.areas_id) {
                                        alert(
                                            "Falta seleccionar el área. No se guardó automáticamente."
                                        );
                                        setMostrarQR(false);
                                        return;
                                    }

                                    const producto = buscarInventarioPorCodigo(codigo);

                                    const datos = producto
                                        ? {
                                              codigo: producto.codigo,
                                              nombre: producto.nombre,
                                              marca: producto.marca,
                                              stock: producto.stock,
                                              areas_id: form.areas_id,
                                          }
                                        : {
                                              codigo,
                                              nombre: "Producto sin catálogo",
                                              marca: "-",
                                              stock: 1,
                                              areas_id: form.areas_id,
                                          };

                                    guardarAutomatico(datos, producto);
                                    setMostrarQR(false);
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* ================= TABLA ================= */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 bg-white">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="border p-2">ID</th>
                                <th className="border p-2">Código</th>
                                <th className="border p-2">Nombre</th>
                                <th className="border p-2">Marca</th>
                                <th className="border p-2">Stock</th>
                                <th className="border p-2">Área</th>
                                <th className="border p-2">Acción</th>
                            </tr>
                        </thead>

                        <tbody>
                            {inventarios.map((item, index) => (
                                <tr key={item.id}>
                                    <td className="border border-gray-300 p-2 text-center">
                                        {index + 1}
                                    </td>
                                    <td className="border p-2">{item.codigo}</td>
                                    <td className="border p-2">{item.nombre}</td>
                                    <td className="border p-2">{item.marca}</td>
                                    <td className="border p-2 text-center">
                                        {Number(item.stock)}
                                    </td>
                                    <td className="border p-2">
                                        {item.area?.nombre ?? "Sin área"}
                                    </td>
                                    <td className="border p-2 text-center">
                                        <button
                                            onClick={() => editar(item)}
                                            className="text-orange-500 hover:bg-orange-100 p-2 rounded-lg"
                                            title="Editar"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}