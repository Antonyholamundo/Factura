/**
 * COMPONENTE: ModalCatalogoProductos
 * PROPÓSITO: Modal de selección de productos del catálogo para agregar al carrito.
 * Soporta búsqueda por texto (descripción o código) y filtro por tarifa de IVA.
 * Diseñado para uso con lector de código de barras (autofocus en buscador).
 *
 * Parte de la arquitectura POS "menos de 5 clics para emitir factura".
 */
import React, { useEffect } from "react";
import { Modal } from "../ui/modal";
import Input from "../formulario/entrada/CampoEntrada";
import Button from "../ui/boton/Boton";
import type { SriProducto, SriDetalleCarrito } from "../../tipos/tipos-sri";

interface ModalCatalogoProductosProps {
  /** Controla la visibilidad del modal */
  abierto: boolean;
  /** Callback para cerrar el modal */
  onCerrar: () => void;
  /** Lista completa del catálogo de productos */
  productos: SriProducto[];
  /** Ítems actualmente en el carrito (para mostrar indicador de cantidad) */
  carrito: SriDetalleCarrito[];
  /** Callback al hacer clic en un producto — lo agrega al carrito */
  onAgregar: (producto: SriProducto) => void;
  /** Texto de búsqueda (controlado externamente para persistir entre aperturas) */
  busqueda: string;
  onBusquedaChange: (valor: string) => void;
  /** Filtro de categoría IVA activo */
  categoria: string;
  onCategoriaChange: (categoria: string) => void;
}

export default function ModalCatalogoProductos({
  abierto,
  onCerrar,
  productos,
  carrito,
  onAgregar,
  busqueda,
  onBusquedaChange,
  categoria,
  onCategoriaChange,
}: ModalCatalogoProductosProps) {

  // Autofocus en el buscador al abrir (soporte lector de código de barras)
  useEffect(() => {
    if (abierto) {
      const timer = setTimeout(() => {
        document.getElementById("buscadorCatalogo")?.focus();
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [abierto]);

  // Filtrar productos según búsqueda y categoría IVA
  const productosFiltrados = productos.filter((p) => {
    const q = busqueda.trim().toLowerCase();
    const coincideTexto =
      !q ||
      p.descripcion.toLowerCase().includes(q) ||
      p.codigoPrincipal.toLowerCase().includes(q);

    const coincideCategoria =
      categoria === "all" ||
      (categoria === "iva15" && p.codigoPorcentaje === "4") ||
      (categoria === "iva8"  && p.codigoPorcentaje === "2") ||
      (categoria === "iva0"  && p.codigoPorcentaje === "0");

    return coincideTexto && coincideCategoria;
  });

  /** Obtiene la cantidad actual en carrito para un producto */
  const cantidadEnCarrito = (codigoPrincipal: string): number => {
    return carrito.find(i => i.codigoPrincipal === codigoPrincipal)?.cantidad ?? 0;
  };

  return (
    <Modal isOpen={abierto} onClose={onCerrar} className="max-w-[700px]">
      <div className="p-6">
        {/* ── CABECERA ── */}
        <div className="flex items-center gap-2.5 border-b dark:border-gray-800 pb-3 mb-4">
          <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">
            Catálogo de Productos
          </h3>
          <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
            {productos.length} ítems en catálogo
          </span>
        </div>

        <div className="space-y-4">
          {/* ── BUSCADOR (autofocus para lector de código de barras) ── */}
          <Input
            id="buscadorCatalogo"
            value={busqueda}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onBusquedaChange(e.target.value)}
            placeholder="Escribe descripción o escanea código de barras..."
            className="w-full h-11"
          />

          {/* ── FILTROS POR TARIFA IVA ── */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            {[
              { id: "all",   label: "Todos" },
              { id: "iva15", label: "IVA 15%" },
              { id: "iva0",  label: "IVA 0%" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onCategoriaChange(tab.id)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  categoria === tab.id
                    ? "bg-white dark:bg-gray-900 text-brand-500 shadow-xs"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── GRILLA DE PRODUCTOS ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
            {productosFiltrados.length === 0 ? (
              <div className="col-span-2 text-center py-10 text-gray-400 dark:text-gray-500 font-medium">
                <svg className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Ningún producto coincide con el filtro.
              </div>
            ) : (
              productosFiltrados.map((p) => {
                const enCarrito = cantidadEnCarrito(p.codigoPrincipal);
                return (
                  <button
                    key={p.codigoPrincipal}
                    type="button"
                    onClick={() => onAgregar(p)}
                    className="group text-left p-3.5 border dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 hover:border-brand-300 dark:hover:border-brand-900 hover:shadow-sm transition-all flex items-center justify-between gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      {/* Descripción del producto */}
                      <div className="font-bold text-sm text-gray-800 dark:text-white line-clamp-1 group-hover:text-brand-500 transition-colors">
                        {p.descripcion}
                      </div>
                      {/* Código principal (SKU) */}
                      <div className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5 truncate">
                        {p.codigoPrincipal}
                      </div>
                      {/* Badge de tarifa IVA */}
                      <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        p.codigoPorcentaje === "4"
                          ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                          : "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400"
                      }`}>
                        IVA: {p.codigoPorcentaje === "4" ? "15%" : p.codigoPorcentaje === "2" ? "8%" : "0%"}
                      </span>
                    </div>

                    <div className="text-right flex-shrink-0">
                      {/* Precio base sin IVA */}
                      <div className="text-base font-extrabold text-gray-800 dark:text-gray-200">
                        ${p.precioUnitario.toFixed(2)}
                      </div>
                      {/* Indicador de cantidad en carrito */}
                      {enCarrito > 0 && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-brand-500 text-[10px] font-black text-white">
                          ×{enCarrito} en caja
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── PIE DEL MODAL ── */}
        <div className="flex items-center justify-between border-t dark:border-gray-800 mt-5 pt-4">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {carrito.length > 0 ? `${carrito.length} línea(s) en el comprobante` : "Carrito vacío"}
          </span>
          <Button
            onClick={onCerrar}
            className="bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl px-6 py-2.5 transition"
          >
            Listo / Volver a Caja
          </Button>
        </div>
      </div>
    </Modal>
  );
}
