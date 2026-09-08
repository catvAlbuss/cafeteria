import { useState } from "react";
import { Head, useForm } from "@inertiajs/react";
import QRScanner from "@/components/QRScanner";

interface Botella {
  id: number;
  codigo: string;
  nombre: string;
  marca: string;
  cantidad: number;
}

interface Props {
  botellas: Botella[];
}

export default function Botellas({ botellas }: Props) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [botellaActualId, setBotellaActualId] = useState<number | null>(null);

  const form = useForm({
    codigo: "",
    nombre: "",
    marca: "",
    cantidad: 1,
  });

  const manejarEscaneo = (codigo: string) => {
    const existente = botellas.find((b) => b.codigo === codigo);

    if (existente) {
      setModoEdicion(true);
      setBotellaActualId(existente.id);
      form.setData({
        codigo: existente.codigo,
        nombre: existente.nombre,
        marca: existente.marca,
        cantidad: existente.cantidad,
      });
    } else {
      setModoEdicion(false);
      setBotellaActualId(null);
      form.setData({ codigo, nombre: "", marca: "", cantidad: 1 });
    }

    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    form.reset();
    form.clearErrors();
  };

  const guardar = (e: React.FormEvent) => {
    e.preventDefault();

    if (modoEdicion && botellaActualId) {
      form.put(`/botellas/${botellaActualId}`, {
        onSuccess: cerrarModal,
        preserveScroll: true,
      });
    } else {
      form.post("/botellas", {
        onSuccess: cerrarModal,
        preserveScroll: true,
      });
    }
  };

  const eliminar = (id: number) => {
    if (!confirm("¿Eliminar esta botella del inventario?")) return;
    form.delete(`/botellas/${id}`, { preserveScroll: true });
  };

  return (
    <>
      <Head title="Botellas" />

      <div className="p-6 flex flex-col items-center gap-6">
        <h1 className="text-2xl font-bold">Inventario de botellas</h1>

        <QRScanner onScan={manejarEscaneo} activo={!modalAbierto} />

        <div className="w-full max-w-3xl mt-6">
          <table className="w-full text-sm border rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Código</th>
                <th className="p-2 text-left">Nombre</th>
                <th className="p-2 text-left">Marca</th>
                <th className="p-2 text-left">Cantidad</th>
                <th className="p-2 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {botellas.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-400">
                    Aún no hay botellas registradas
                  </td>
                </tr>
              )}
              {botellas.map((b) => (
                <tr key={b.id} className="border-t">
                  <td className="p-2">{b.codigo}</td>
                  <td className="p-2">{b.nombre}</td>
                  <td className="p-2">{b.marca}</td>
                  <td className="p-2">{b.cantidad}</td>
                  <td className="p-2">
                    <button
                      onClick={() => eliminar(b.id)}
                      className="text-red-500 hover:underline text-xs"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form
            onSubmit={guardar}
            className="bg-white rounded-xl p-6 w-[320px] flex flex-col gap-3 shadow-xl"
          >
            <h2 className="text-lg font-semibold">
              {modoEdicion ? "Editar botella" : "Nueva botella"}
            </h2>

            <div>
              <label className="text-xs text-gray-500">Código</label>
              <input
                type="text"
                value={form.data.codigo}
                readOnly
                className="w-full border rounded-lg p-2 bg-gray-100 text-gray-600"
              />
              {form.errors.codigo && (
                <p className="text-xs text-red-500">{form.errors.codigo}</p>
              )}
            </div>

            <div>
              <label className="text-xs text-gray-500">Nombre</label>
              <input
                type="text"
                value={form.data.nombre}
                onChange={(e) => form.setData("nombre", e.target.value)}
                className="w-full border rounded-lg p-2"
                autoFocus
              />
              {form.errors.nombre && (
                <p className="text-xs text-red-500">{form.errors.nombre}</p>
              )}
            </div>

            <div>
              <label className="text-xs text-gray-500">Marca</label>
              <input
                type="text"
                value={form.data.marca}
                onChange={(e) => form.setData("marca", e.target.value)}
                className="w-full border rounded-lg p-2"
              />
              {form.errors.marca && (
                <p className="text-xs text-red-500">{form.errors.marca}</p>
              )}
            </div>

            <div>
              <label className="text-xs text-gray-500">Cantidad</label>
              <input
                type="number"
                min={1}
                value={form.data.cantidad}
                onChange={(e) =>
                  form.setData("cantidad", Number(e.target.value))
                }
                className="w-full border rounded-lg p-2"
              />
              {form.errors.cantidad && (
                <p className="text-xs text-red-500">{form.errors.cantidad}</p>
              )}
            </div>

            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={cerrarModal}
                className="flex-1 border rounded-lg py-2 text-gray-600"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={form.processing}
                className="flex-1 bg-green-600 text-white rounded-lg py-2 disabled:opacity-50"
              >
                {form.processing ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}