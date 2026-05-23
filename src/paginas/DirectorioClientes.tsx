import React, { useState, useEffect } from "react";
import PageBreadcrumb from "../componentes/comunes/MigasPagina";
import ComponentCard from "../componentes/comunes/TarjetaComponente";
import PageMeta from "../componentes/comunes/MetaPagina";
import Label from "../componentes/formulario/Etiqueta";
import Input from "../componentes/formulario/entrada/CampoEntrada";
import Select from "../componentes/formulario/Seleccion";
import Button from "../componentes/ui/boton/Boton";
import { Modal } from "../componentes/ui/modal";

export interface SriCliente {
  tipoIdentificacion: "04" | "05" | "06" | "07"; // 04 = RUC, 05 = Cédula, 06 = Pasaporte, 07 = Consumidor Final
  identificacion: string;
  razonSocial: string;
  direccion: string;
  correo: string;
}

const defaultClients: SriCliente[] = [
  { tipoIdentificacion: "05", identificacion: "1724567890", razonSocial: "JUAN SEBASTIAN PEREZ VALDIVIESO", direccion: "Av. Amazonas N21-147 y Patria, Quito", correo: "juan.perez@example.com" },
  { tipoIdentificacion: "04", identificacion: "1791234567001", razonSocial: "DISTRIBUIDORA COMERCIAL ALFA S.A.", direccion: "Av. Juan Tanca Marengo Km 4.5, Guayaquil", correo: "contacto@alfa.com.ec" },
  { tipoIdentificacion: "05", identificacion: "0923456789", razonSocial: "MARIA ELENA CHAVEZ GOMEZ", direccion: "Calle Larga 8-24 y Benigno Malo, Cuenca", correo: "maria.chavez@example.com" },
  { tipoIdentificacion: "06", identificacion: "A12345678", razonSocial: "JOHN SMITH (PASAPORTE)", direccion: "Hotel Marriott, Av. Francisco de Orellana, Quito", correo: "john.smith@tourist.com" },
];

export default function DirectorioClientes() {
  const [clients, setClients] = useState<SriCliente[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  // Modal State
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState<SriCliente>({
    tipoIdentificacion: "05",
    identificacion: "",
    razonSocial: "",
    correo: "",
    direccion: "",
  });

  // Load clients from localStorage on component mount
  useEffect(() => {
    const stored = localStorage.getItem("pos_clients");
    if (stored) {
      try {
        setClients(JSON.parse(stored));
      } catch {
        setClients(defaultClients);
      }
    } else {
      localStorage.setItem("pos_clients", JSON.stringify(defaultClients));
      setClients(defaultClients);
    }
  }, []);

  // Save clients to localStorage whenever they change
  const saveClientsToLocalStorage = (updatedClients: SriCliente[]) => {
    setClients(updatedClients);
    localStorage.setItem("pos_clients", JSON.stringify(updatedClients));
  };

  const handleOpenCreate = () => {
    setModalMode("create");
    setFormData({
      tipoIdentificacion: "05",
      identificacion: "",
      razonSocial: "",
      correo: "",
      direccion: "",
    });
    setIsOpenModal(true);
  };

  const handleOpenEdit = (index: number, client: SriCliente) => {
    setModalMode("edit");
    setEditingIndex(index);
    setFormData({ ...client });
    setIsOpenModal(true);
  };

  const handleDeleteClient = (identificacion: string) => {
    if (window.confirm("¿Está seguro de eliminar este cliente del directorio?")) {
      const updated = clients.filter((c) => c.identificacion !== identificacion);
      saveClientsToLocalStorage(updated);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.identificacion.trim() ||
      !formData.razonSocial.trim() ||
      !formData.direccion.trim() ||
      !formData.correo.trim()
    ) {
      alert("Por favor, complete todos los campos requeridos.");
      return;
    }

    if (modalMode === "create") {
      // Check if client already exists
      const exists = clients.some(c => c.identificacion === formData.identificacion);
      if (exists) {
        alert("Ya existe un cliente registrado con esta identificación.");
        return;
      }
      const updated = [formData, ...clients];
      saveClientsToLocalStorage(updated);
    } else {
      // Edit
      const updated = [...clients];
      if (editingIndex !== null) {
        updated[editingIndex] = formData;
        saveClientsToLocalStorage(updated);
      }
    }

    setIsOpenModal(false);
  };

  // Filter clients
  const filteredClients = clients.filter((c) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      c.razonSocial.toLowerCase().includes(query) ||
      c.identificacion.includes(query) ||
      c.correo.toLowerCase().includes(query);

    const matchesType =
      filterType === "all" || c.tipoIdentificacion === filterType;

    return matchesQuery && matchesType;
  });

  // Calculate statistics
  const totalCount = clients.length;
  const rucCount = clients.filter((c) => c.tipoIdentificacion === "04").length;
  const cedulaCount = clients.filter((c) => c.tipoIdentificacion === "05").length;
  const otherCount = totalCount - rucCount - cedulaCount;

  // Helper for ID badges
  const getIdBadge = (type: string) => {
    switch (type) {
      case "04":
        return <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200 dark:border-blue-800/40">RUC</span>;
      case "05":
        return <span className="px-2.5 py-0.5 rounded-lg bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold border border-green-200 dark:border-green-800/40">Cédula</span>;
      case "06":
        return <span className="px-2.5 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold border border-purple-200 dark:border-purple-800/40">Pasaporte</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-bold border border-gray-200 dark:border-gray-700">CF</span>;
    }
  };

  // Helper to get initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .filter((n) => n)
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <>
      <PageMeta
        title="Directorio de Clientes | Facturación SRI"
        description="Gestión integral de clientes para facturación electrónica del SRI de acuerdo a las regulaciones de Ecuador."
      />
      <PageBreadcrumb pageTitle="Directorio y Clientes" />

      {/* ── SECCIÓN 1: TARJETAS DE MÉTRICAS PREMIUM ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {/* Total Clientes */}
        <div className="p-5 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Clientes</div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white mt-0.5">{totalCount}</div>
          </div>
        </div>

        {/* Clientes RUC */}
        <div className="p-5 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Empresas / RUC</div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white mt-0.5">{rucCount}</div>
          </div>
        </div>

        {/* Clientes Cédula */}
        <div className="p-5 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-green-50 dark:bg-green-500/10 text-green-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Personas / Cédula</div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white mt-0.5">{cedulaCount}</div>
          </div>
        </div>

        {/* Pasaportes / Otros */}
        <div className="p-5 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h2m-4-3h1.872c.5 0 .965.202 1.302.559l1.637 1.73A1 1 0 0118.063 14H17a2 2 0 00-2 2v2a2 2 0 01-2 2h-1M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Pasaportes / Extr.</div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white mt-0.5">{otherCount}</div>
          </div>
        </div>
      </div>

      {/* ── SECCIÓN 2: CONTROL Y TABLA ── */}
      <ComponentCard title="Directorio de Clientes Registrados">
        <div className="space-y-6">
          {/* Controles de Búsqueda y Botón */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 flex-wrap">
            <div className="flex flex-1 gap-3 flex-wrap">
              {/* Buscador */}
              <div className="relative flex-1 min-w-[240px]">
                <Input
                  value={searchQuery}
                  onChange={(e: any) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por Nombre, ID, o Correo..."
                  className="w-full h-11"
                />
              </div>
              {/* Filtro por Tipo */}
              <div className="w-[180px]">
                <Select
                  options={[
                    { value: "all", label: "Todos los Tipos" },
                    { value: "04", label: "RUC" },
                    { value: "05", label: "Cédula" },
                    { value: "06", label: "Pasaporte" },
                  ]}
                  onChange={(v: any) => setFilterType(v)}
                  defaultValue={filterType}
                />
              </div>
            </div>
            {/* Registrar Nuevo */}
            <button
              onClick={handleOpenCreate}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-sm transition shadow-xs hover:shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Cliente
            </button>
          </div>

          {/* Tabla de Clientes */}
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-800 text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-wider">
                  <th className="pb-3 text-left">Cliente</th>
                  <th className="pb-3 text-left">Identificación</th>
                  <th className="pb-3 text-left">Correo Electrónico</th>
                  <th className="pb-3 text-left">Dirección Física</th>
                  <th className="pb-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400 dark:text-gray-500 font-medium">
                      Ningún cliente coincide con la búsqueda actual o el filtro.
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client, index) => (
                    <tr key={client.identificacion} className="border-b dark:border-gray-800 align-middle hover:bg-gray-25/40 dark:hover:bg-gray-800/10 transition-colors">
                      {/* Avatar e Initials */}
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-sm shadow-2xs">
                            {getInitials(client.razonSocial)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-800 dark:text-white text-sm">{client.razonSocial}</div>
                            <div className="text-[11px] text-gray-400 dark:text-gray-500 font-mono mt-0.5">Ecuador</div>
                          </div>
                        </div>
                      </td>
                      {/* Identificación */}
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          {getIdBadge(client.tipoIdentificacion)}
                          <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">{client.identificacion}</span>
                        </div>
                      </td>
                      {/* Correo */}
                      <td className="py-4 text-gray-600 dark:text-gray-400 font-medium">
                        {client.correo}
                      </td>
                      {/* Dirección */}
                      <td className="py-4 text-gray-600 dark:text-gray-400 font-medium max-w-[200px] truncate" title={client.direccion}>
                        {client.direccion}
                      </td>
                      {/* Acciones */}
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(index, client)}
                            className="h-8 w-8 rounded-lg border dark:border-gray-750 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center justify-center transition-all shadow-3xs"
                            title="Editar Cliente"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-2.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteClient(client.identificacion)}
                            className="h-8 w-8 rounded-lg border border-red-100 dark:border-red-950/40 text-red-500 hover:text-white hover:bg-red-500 hover:border-red-500 flex items-center justify-center transition-all shadow-3xs"
                            title="Eliminar Cliente"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </ComponentCard>

      {/* ── MODAL: CREACIÓN / EDICIÓN DE CLIENTE ── */}
      <Modal isOpen={isOpenModal} onClose={() => setIsOpenModal(false)} className="max-w-[550px]">
        <div className="p-6">
          <div className="flex items-center gap-2.5 border-b dark:border-gray-850 pb-3 mb-4">
            <svg className="w-5.5 h-5.5 text-brand-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
              {modalMode === "create" ? "Registrar Nuevo Cliente" : "Editar Datos del Cliente"}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3.5">
            <div>
              <Label>Tipo de Identificación *</Label>
              <Select
                options={[
                  { value: "05", label: "Cédula (Natural)" },
                  { value: "04", label: "RUC (Empresa/Natural RUC)" },
                  { value: "06", label: "Pasaporte" },
                ]}
                onChange={(v: any) => setFormData({ ...formData, tipoIdentificacion: v as any })}
                defaultValue={formData.tipoIdentificacion}
              />
            </div>

            <div>
              <Label>Identificación (RUC / Cédula / Pasaporte) *</Label>
              <Input
                value={formData.identificacion}
                disabled={modalMode === "edit"} // Disable identification editing in edit mode to preserve key identity
                onChange={(e: any) => setFormData({ ...formData, identificacion: e.target.value })}
                placeholder="Ej: 1729876543 o 1792345678001"
                className="w-full"
              />
            </div>

            <div>
              <Label>Nombre / Razón Social Completa *</Label>
              <Input
                value={formData.razonSocial}
                onChange={(e: any) => setFormData({ ...formData, razonSocial: e.target.value })}
                placeholder="Ej: Juan Andrés Pérez Valdivieso"
                className="w-full"
              />
            </div>

            <div>
              <Label>Correo Electrónico (Para envío de XML/Ride SRI) *</Label>
              <Input
                value={formData.correo}
                onChange={(e: any) => setFormData({ ...formData, correo: e.target.value })}
                placeholder="Ej: correo@sri.gob.ec"
                className="w-full"
              />
            </div>

            <div>
              <Label>Dirección Física Principal *</Label>
              <Input
                value={formData.direccion}
                onChange={(e: any) => setFormData({ ...formData, direccion: e.target.value })}
                placeholder="Ej: Av. de los Granados N45 y Eloy Alfaro"
                className="w-full"
              />
            </div>

            <div className="flex justify-end gap-2 border-t dark:border-gray-850 pt-4 mt-3">
              <Button
                type="button"
                onClick={() => setIsOpenModal(false)}
                className="bg-gray-100 hover:bg-gray-250 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-brand-500 text-white hover:bg-brand-600 font-bold rounded-xl shadow-sm transition"
              >
                {modalMode === "create" ? "Registrar Cliente" : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
