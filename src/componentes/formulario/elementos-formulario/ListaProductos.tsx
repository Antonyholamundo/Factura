/**
 * COMPONENTE: ListaProductos
 * PROPÓSITO: Tabla/listado del inventario de productos registrados en el catálogo POS.
 *
 * Funcionalidades:
 *  - Búsqueda por descripción o codigoPrincipal
 *  - Filtro por tarifa de IVA (15% / 0%)
 *  - Indicadores de inventario (total, por tarifa)
 *  - Eliminación con confirmación visual inline (sin alert())
 *
 * Refactorizado para usar SriProducto directamente (campos normalizados)
 * en lugar de la interfaz legacy ProductItem con getters redundantes.
 */
import React, { useState } from "react";
import ComponentCard from "../../comunes/TarjetaComponente";
import Input from "../entrada/CampoEntrada";
import Select from "../Seleccion";
import { calcularTasaIva } from "../../../utilidades/validaciones-sri";
import type { SriProducto } from "../../../tipos/tipos-sri";

interface ListaProductosProps {
  /** Catálogo de productos ya tipados con SriProducto */
  productos: SriProducto[];
  /** Callback al eliminar un producto (recibe codigoPrincipal) */
  onEliminarProducto: (codigoPrincipal: string) => void;
}

export default function ListaProductos({ productos, onEliminarProducto }: ListaProductosProps) {
  // ── Estado de controles de búsqueda y filtrado ────────────────────────────
  const [busqueda, setBusqueda] = useState("");
  const [filtroIva, setFiltroIva] = useState("all");

  // ── Estado de confirmación de eliminación inline (reemplaza window.confirm) ─
  const [codigoAEliminar, setCodigoAEliminar] = useState<string | null>(null);

  // ── Filtrar el catálogo ────────────────────────────────────────────────────
  const productosFiltrados = productos.filter((p) => {
    const q = busqueda.trim().toLowerCase();
    const coincideTexto =
      !q ||
      p.descripcion.toLowerCase().includes(q) ||
      p.codigoPrincipal.toLowerCase().includes(q);

    const coincideIva =
      filtroIva === "all" ||
      (filtroIva === "iva15" && p.codigoPorcentaje === "4") ||
      (filtroIva === "iva0"  && p.codigoPorcentaje === "0");

    return coincideTexto && coincideIva;
  });

  // ── Estadísticas rápidas del inventario ────────────────────────────────────
  const totalProductos = productos.length;
  const totalIva15 = productos.filter(p => p.codigoPorcentaje === "4").length;
  const totalIva0  = productos.filter(p => p.codigoPorcentaje === "0").length;

  /** Confirma la eliminación de un producto */
  const confirmarEliminacion = (codigoPrincipal: string) => {
    onEliminarProducto(codigoPrincipal);
    setCodigoAEliminar(null);
  };

  return (
    <ComponentCard title="Inventario de Productos Registrados">
      <div className="space-y-5">

        {/* ── MINI-INDICADORES DE INVENTARIO ── */}
        <div className="grid grid-cols-3 gap-3 p-3 rounded-2xl bg-gray-25 dark:bg-gray-900 border dark:border-gray-800 text-center">
          <div>
            <span className="block text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-0.5">
              Total Ítems
            </span>
            <span className="text-xl font-extrabold text-gray-800 dark:text-white">
              {totalProductos}
            </span>
          </div>
          <div className="border-x dark:border-gray-800">
            <span className="block text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-0.5">
              IVA 15%
            </span>
            <span className="text-xl font-extrabold text-blue-500 dark:text-blue-400">
              {totalIva15}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-0.5">
              IVA 0%
            </span>
            <span className="text-xl font-extrabold text-green-500 dark:text-green-400">
              {totalIva0}
            </span>
          </div>
        </div>

        {/* ── CONTROLES DE BÚSQUEDA Y FILTRO ── */}
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <Input
              value={busqueda}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBusqueda(e.target.value)}
              placeholder="Buscar por descripción o código..."
              className="h-10 text-sm"
            />
          </div>
          <div className="w-[150px]">
            <Select
              options={[
                { value: "all",   label: "Todos" },
                { value: "iva15", label: "IVA 15%" },
                { value: "iva0",  label: "IVA 0%" },
              ]}
              onChange={(v: any) => setFiltroIva(v)}
              defaultValue={filtroIva}
              className="h-10 text-sm"
            />
          </div>
        </div>

        {/* ── LISTADO DE PRODUCTOS ── */}
        <div className="max-h-[480px] overflow-y-auto custom-scrollbar pr-1 space-y-2.5">
          {productosFiltrados.length === 0 ? (
            <div className="py-14 text-center text-gray-400 dark:text-gray-500 font-medium">
              <svg className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              No hay productos que coincidan con la búsqueda.
            </div>
          ) : (
            productosFiltrados.map((p) => {
              // Calcular precio con IVA para mostrar el PVP
              const tasa = calcularTasaIva(p.codigoPorcentaje);
              const pvp = p.precioUnitario * (1 + tasa);
              const estaEnConfirmacion = codigoAEliminar === p.codigoPrincipal;

              return (
                <div
                  key={p.codigoPrincipal}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-4 flex-wrap ${
                    estaEnConfirmacion
                      ? "border-red-300 dark:border-red-900/50 bg-red-50 dark:bg-red-950/10"
                      : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/40 hover:border-brand-200 dark:hover:border-brand-900/60 hover:shadow-2xs"
                  }`}
                >
                  {/* ── INFO DEL PRODUCTO ── */}
                  <div className="flex-1 min-w-[150px]">
                    <div className="font-bold text-sm text-gray-800 dark:text-white line-clamp-1">
                      {p.descripcion}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">
                      {p.codigoPrincipal}
                    </div>
                    {/* Badge de tarifa IVA */}
                    <div className="mt-1.5">
                      <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold border ${
                        p.codigoPorcentaje === "4"
                          ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30"
                          : "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/30"
                      }`}>
                        IVA {p.codigoPorcentaje === "4" ? "15%" : p.codigoPorcentaje === "2" ? "8%" : "0%"}
                      </span>
                    </div>
                  </div>

                  {/* ── PRECIOS ── */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-gray-400 dark:text-gray-500 font-semibold">
                      Base: ${p.precioUnitario.toFixed(2)}
                    </div>
                    <div className="text-sm font-extrabold text-brand-500 dark:text-brand-400 mt-0.5">
                      PVP: ${pvp.toFixed(2)}
                    </div>
                  </div>

                  {/* ── ACCIONES (Eliminar con confirmación inline) ── */}
                  <div className="flex items-center gap-2">
                    {estaEnConfirmacion ? (
                      /* Panel de confirmación de eliminación (reemplaza window.confirm) */
                      <>
                        <span className="text-xs text-red-600 dark:text-red-400 font-semibold">
                          ¿Eliminar?
                        </span>
                        <button
                          onClick={() => confirmarEliminacion(p.codigoPrincipal)}
                          className="h-8 px-3 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition"
                        >
                          Sí
                        </button>
                        <button
                          onClick={() => setCodigoAEliminar(null)}
                          className="h-8 px-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-300 transition"
                        >
                          No
                        </button>
                      </>
                    ) : (
                      /* Botón de papelera normal */
                      <button
                        onClick={() => setCodigoAEliminar(p.codigoPrincipal)}
                        className="h-8 w-8 rounded-lg border border-red-100 dark:border-red-950/40 text-red-500 hover:text-white hover:bg-red-500 hover:border-red-500 flex items-center justify-center transition-all"
                        title="Eliminar del inventario"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Resumen del filtro activo */}
        {busqueda || filtroIva !== "all" ? (
          <p className="text-xs text-center text-gray-400 dark:text-gray-500">
            Mostrando {productosFiltrados.length} de {totalProductos} producto(s)
          </p>
        ) : null}
      </div>
    </ComponentCard>
  );
}
