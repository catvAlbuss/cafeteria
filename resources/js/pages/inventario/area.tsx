import { Head, usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
interface Areas {
    id: number;
    nombre: string;
    capacidad: string;
}
export default function Area() {
    const { areas } = usePage().props as unknown as { areas: Areas[] };
    const [areaList, setAreaList] = useState<Areas[]>(areas);
    const [newArea, setNewArea] = useState({ nombre: '', capacidad: '' });
    const [editingArea, setEditingArea] = useState<Areas | null>(null);

    return (
        <>
            <Head title="Platos - Dolce Cafe" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6 bg-[#FBF3E7]">

                {/* ===== HEADER ===== */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[#2D1B1A]">Áreas</h1>
                        <p className="text-[#5A3D2B] text-sm mt-1">Gestión de áreas en la cafetería</p>
                    </div>
                </div>

                {/* ===== GRID DE ÁREAS ===== */}
                {/* <div className="">
                    {areas.map((area) => {
                        return (
                            <div key={area.id} className="bg-[#F5E9D6] p-4 rounded-lg shadow-md">
                                <h2 className="text-xl font-semibold text-[#2D1B1A]">{area.nombre}</h2>
                                <p className="text-[#5A3D2B]">Capacidad: {area.capacidad}</p>
                            </div>
                        );
                    })}
                </div>   */}

               <table className="w-full border border-gray-300 text-sm">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="border border-gray-300 p-2">ID</th>
                            <th className="border border-gray-300 p-2">Nombre</th>
                            <th className="border border-gray-300 p-2">Capacidad</th>
                            
                        </tr>
                    </thead>
                    <tbody>
                        {areaList.map((area) => (
                            <tr key={area.id}>
                                <td className="border border-gray-300 p-2">{area.id}</td>
                                <td className="border border-gray-300 p-2">{area.nombre}</td>
                                <td className="border border-gray-300 p-2">{area.capacidad}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );

}