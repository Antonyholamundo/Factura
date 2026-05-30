/**
 * COMPONENTE: ModalGestionClientes
 * PROPÓSITO: Modal de búsqueda y registro de clientes para el POS.
 *
 * Dos pestañas:
 *  1. "Buscar Registrado" — búsqueda en tiempo real por nombre o identificación
 *  2. "Registrar Nuevo" — formulario con validación SRI inline (sin alert())
 *
 * Validaciones implementadas:
 *  - Tipo de identificación (RUC / Cédula / Pasaporte)
 *  - Dígito verificador de cédula y RUC ecuatoriano
 *  - Email válido (RFC básico)
 *  - Razón social y dirección obligatorias
 */
import React, { useState } from "react";
import { Modal } from "../ui/modal";
import Input from "../formulario/entrada/CampoEntrada";
import Label from "../formulario/Etiqueta";
import Select from "../formulario/Seleccion";
import Button from "../ui/boton/Boton";
import type { SriCliente, ErroresCampo } from "../../tipos/tipos-sri";

interface ModalGestionClientesProps {
  abierto: boolean;
  onCerrar: () => void;
  /** Lista de clientes registrados para búsqueda */
  clientes: SriCliente[];
  /** Callback al seleccionar un cliente existente o guardar uno nuevo */
  onSeleccionar: (cliente: SriCliente) => void;
  /** Callback para guardar un cliente nuevo en el directorio */
  onRegistrarCliente: (cliente: SriCliente) => Promise<ErroresCampo>;
  /** Pestaña inicial al abrir el modal */
  tabInicial?: "search" | "create";
}

/** Opciones de tipo de identificación del SRI */
const TIPOS_IDENTIFICACION = [
  { value: "05", label: "Cédula (Persona Natural)" },
  { value: "04", label: "RUC (Empresa / Natural con RUC)" },
  { value: "06", label: "Pasaporte" },
];

/** Estado inicial del formulario de nuevo cliente */
const CLIENTE_VACIO: SriCliente = {
  tipoIdentificacion: "05",
  identificacion: "",
  razonSocial: "",
  correo: "",
  direccion: "",
};

export default function ModalGestionClientes({
  abierto,
  onCerrar,
  clientes,
  onSeleccionar,
  onRegistrarCliente,
  tabInicial = "search",
}: ModalGestionClientesProps) {
  // Pestaña activa dentro del modal
  const [tab, setTab] = useState<"search" | "create">(tabInicial);

  // Texto de búsqueda en la pestaña de clientes registrados
  const [busqueda, setBusqueda] = useState("");

  // Datos del formulario de nuevo cliente
  const [nuevoCliente, setNuevoCliente] = useState<SriCliente>(CLIENTE_VACIO);

  // Errores de validación por campo (para mostrar inline bajo cada input)
  const [errores, setErrores] = useState<ErroresCampo>({});

  // Clientes filtrados por la búsqueda
  const clientesFiltrados = clientes.filter((c) => {
    const q = busqueda.trim().toLowerCase();
    return (
      !q ||
      c.razonSocial.toLowerCase().includes(q) ||
      c.identificacion.includes(q) ||
      c.correo.toLowerCase().includes(q)
    );
  });

  /** Actualiza un campo del formulario de nuevo cliente y limpia su error */
  const actualizarCampo = (campo: keyof SriCliente, valor: string) => {
    setNuevoCliente((prev) => ({ ...prev, [campo]: valor }));
    // Limpiar el error del campo que el usuario está modificando (UX inmediata)
    if (errores[campo]) {
      setErrores((prev) => ({ ...prev, [campo]: undefined }));
    }
  };

  /** Intenta guardar el nuevo cliente — muestra errores inline si no valida */
  const handleGuardar = async () => {
    // Validar con el módulo de validaciones SRI
    const erroresValidacion = await onRegistrarCliente(nuevoCliente);
    if (Object.keys(erroresValidacion).length > 0) {
      setErrores(erroresValidacion);
      return;
    }
    // Seleccionar inmediatamente al cliente recién registrado
    onSeleccionar(nuevoCliente);
    setNuevoCliente(CLIENTE_VACIO);
    setErrores({});
    onCerrar();
  };

  /** Selecciona un cliente de la lista y cierra el modal */
  const handleSeleccionar = (cliente: SriCliente) => {
    onSeleccionar(cliente);
    onCerrar();
  };

  /** Resetea el estado al cambiar de pestaña */
  const cambiarTab = (nuevaTab: "search" | "create") => {
    setTab(nuevaTab);
    setErrores({});
  };

  /** Badge de tipo de identificación */
  const labelTipoId = (tipo: SriCliente["tipoIdentificacion"]) => {
    const mapa: Record<string, string> = { "04": "RUC", "05": "Cédula", "06": "Pasaporte", "07": "CF" };
    return mapa[tipo] || tipo;
  };

  return (
    <Modal isOpen={abierto} onClose={onCerrar} className="max-w-[560px]">
      <div className="p-6">
        {/* ── CABECERA ── */}
        <div className="flex items-center gap-2.5 border-b dark:border-gray-800 pb-3 mb-4">
          <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">
            Gestión de Clientes
          </h3>
        </div>

        {/* ── PESTAÑAS ── */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-5">
          <button
            type="button"
            onClick={() => cambiarTab("search")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
              tab === "search"
                ? "bg-white dark:bg-gray-900 text-brand-500 shadow-xs"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Buscar Registrado
          </button>
          <button
            type="button"
            onClick={() => cambiarTab("create")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
              tab === "create"
                ? "bg-white dark:bg-gray-900 text-brand-500 shadow-xs"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Registrar Nuevo
          </button>
        </div>

        {/* ── PESTAÑA: BUSCAR CLIENTE REGISTRADO ── */}
        {tab === "search" ? (
          <div className="space-y-3">
            <Input
              value={busqueda}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBusqueda(e.target.value)}
              placeholder="Busca por nombre, RUC, cédula o email..."
              className="w-full"
            />

            <div className="text-[11px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              {busqueda.trim() === ""
                ? `${clientes.length} clientes registrados`
                : `${clientesFiltrados.length} resultado(s)`}
            </div>

            <div className="space-y-2 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
              {clientesFiltrados.length === 0 ? (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                  Ningún cliente coincide con la búsqueda.
                  <br />
                  <button
                    onClick={() => cambiarTab("create")}
                    className="mt-2 text-brand-500 hover:underline font-semibold"
                  >
                    Registrar nuevo cliente →
                  </button>
                </div>
              ) : (
                clientesFiltrados.map((c) => (
                  <button
                    key={c.identificacion}
                    type="button"
                    onClick={() => handleSeleccionar(c)}
                    className="w-full text-left p-3.5 border dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 hover:border-brand-400 hover:bg-brand-25 dark:hover:bg-brand-500/5 transition-all flex justify-between items-center shadow-3xs group"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-gray-800 dark:text-white truncate group-hover:text-brand-600">
                        {c.razonSocial}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-bold">
                          {labelTipoId(c.tipoIdentificacion)}
                        </span>
                        <span className="font-mono">{c.identificacion}</span>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-brand-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          /* ── PESTAÑA: REGISTRAR NUEVO CLIENTE ── */
          <div className="space-y-3.5">
            {/* Tipo de Identificación */}
            <div>
              <Label>Tipo de Identificación *</Label>
              <Select
                options={TIPOS_IDENTIFICACION}
                onChange={(v: any) => actualizarCampo("tipoIdentificacion", v)}
                defaultValue={nuevoCliente.tipoIdentificacion}
              />
              {errores.tipoIdentificacion && (
                <p className="mt-1 text-xs text-red-500">{errores.tipoIdentificacion}</p>
              )}
            </div>

            {/* Número de Identificación */}
            <div>
              <Label>
                {nuevoCliente.tipoIdentificacion === "04" ? "RUC (13 dígitos)" :
                 nuevoCliente.tipoIdentificacion === "05" ? "Cédula (10 dígitos)" :
                 "Número de Pasaporte"} *
              </Label>
              <Input
                value={nuevoCliente.identificacion}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  actualizarCampo("identificacion", e.target.value)
                }
                placeholder={
                  nuevoCliente.tipoIdentificacion === "04" ? "Ej. 1792345678001" :
                  nuevoCliente.tipoIdentificacion === "05" ? "Ej. 1729876543" :
                  "Ej. A12345678"
                }
                className={errores.identificacion ? "border-red-400 focus:border-red-500" : ""}
              />
              {errores.identificacion && (
                <p className="mt-1 text-xs text-red-500">{errores.identificacion}</p>
              )}
            </div>

            {/* Razón Social / Nombre */}
            <div>
              <Label>Nombre / Razón Social *</Label>
              <Input
                value={nuevoCliente.razonSocial}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  actualizarCampo("razonSocial", e.target.value.toUpperCase())
                }
                placeholder="Ej. JUAN ANDRÉS PÉREZ ALMEIDA"
                className={errores.razonSocial ? "border-red-400 focus:border-red-500" : ""}
              />
              {errores.razonSocial && (
                <p className="mt-1 text-xs text-red-500">{errores.razonSocial}</p>
              )}
            </div>

            {/* Correo Electrónico */}
            <div>
              <Label>Correo Electrónico * (RIDE SRI)</Label>
              <Input
                type="email"
                value={nuevoCliente.correo}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  actualizarCampo("correo", e.target.value)
                }
                placeholder="Ej. correo@empresa.com.ec"
                className={errores.correo ? "border-red-400 focus:border-red-500" : ""}
              />
              {errores.correo && (
                <p className="mt-1 text-xs text-red-500">{errores.correo}</p>
              )}
            </div>

            {/* Dirección */}
            <div>
              <Label>Dirección Física *</Label>
              <Input
                value={nuevoCliente.direccion}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  actualizarCampo("direccion", e.target.value)
                }
                placeholder="Ej. Av. Amazonas N21-147 y Patria, Quito"
                className={errores.direccion ? "border-red-400 focus:border-red-500" : ""}
              />
              {errores.direccion && (
                <p className="mt-1 text-xs text-red-500">{errores.direccion}</p>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-2 pt-3 border-t dark:border-gray-800">
              <Button
                onClick={onCerrar}
                className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleGuardar}
                className="bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-sm transition"
              >
                Guardar y Seleccionar
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
