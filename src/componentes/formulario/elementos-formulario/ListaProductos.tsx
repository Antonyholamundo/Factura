import React, { useState } from "react";
import ComponentCard from "../../comunes/TarjetaComponente";
import Input from "../entrada/CampoEntrada";
import Select from "../Seleccion";

export interface ProductItem {
  value?: string;
  label?: string;
  description?: string;
  price?: number;
  precioUnitario?: number;
  codigoPorcentaje?: string;
  code?: string;
  codigoPrincipal?: string;
}

interface ListaProductosProps {
  products: ProductItem[];
  onDeleteProduct: (code: string) => void;
}

export default function ListaProductos({ products, onDeleteProduct }: ListaProductosProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterIva, setFilterIva] = useState("all");

  // Normalized helpers
  const getCode = (p: ProductItem) => p.codigoPrincipal || p.code || p.value || "";
  const getName = (p: ProductItem) => p.descripcion || p.label || "";
  const getPrice = (p: ProductItem) => typeof p.precioUnitario === "number" ? p.precioUnitario : (p.price || 0);
  const getIvaCode = (p: ProductItem) => p.codigoPorcentaje || "4";

  const getIvaRate = (code: string): number => (code === "4" ? 0.15 : 0);

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const name = getName(p).toLowerCase();
    const code = getCode(p).toLowerCase();
    const query = searchQuery.trim().toLowerCase();

    const matchesQuery = !query || name.includes(query) || code.includes(query);
    const matchesIva =
      filterIva === "all" ||
      (filterIva === "iva15" && getIvaCode(p) === "4") ||
      (filterIva === "iva0" && getIvaCode(p) === "0");

    return matchesQuery && matchesIva;
  });

  // Calculate some nice inventory stats
  const totalProducts = products.length;
  const iva15Products = products.filter((p) => getIvaCode(p) === "4").length;
  const iva0Products = products.filter((p) => getIvaCode(p) === "0").length;

  return (
    <ComponentCard title="Inventario de Productos Registrados">
      <div className="space-y-5">
        
        {/* ── MINI INDICADORES DE INVENTARIO ── */}
        <div className="grid grid-cols-3 gap-3 p-3 rounded-2xl bg-gray-25 dark:bg-gray-900 border dark:border-gray-800 text-center shadow-3xs">
          <div>
            <span className="block text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">Items</span>
            <span className="text-base font-extrabold text-gray-800 dark:text-white">{totalProducts}</span>
          </div>
          <div className="border-x dark:border-gray-800">
            <span className="block text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">IVA 15%</span>
            <span className="text-base font-extrabold text-blue-500">{iva15Products}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">IVA 0%</span>
            <span className="text-base font-extrabold text-green-500">{iva0Products}</span>
          </div>
        </div>

        {/* ── CONTROLES DE FILTRADO Y BÚSQUEDA ── */}
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <Input
              value={searchQuery}
              onChange={(e: any) => setSearchQuery(e.target.value)}
              placeholder="Buscar por descripción o código..."
              className="h-10 text-sm"
            />
          </div>
          <div className="w-[140px]">
            <Select
              options={[
                { value: "all", label: "Todos" },
                { value: "iva15", label: "IVA 15%" },
                { value: "iva0", label: "IVA 0%" },
              ]}
              onChange={(v: any) => setFilterIva(v)}
              defaultValue={filterIva}
              className="h-10 text-sm"
            />
          </div>
        </div>

        {/* ── TABLA / LISTADO DE ITEMS ── */}
        <div className="max-h-[460px] overflow-y-auto custom-scrollbar pr-1">
          {filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-gray-400 dark:text-gray-500 font-medium">
              No hay productos registrados en el inventario que coincidan con la búsqueda.
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredProducts.map((p) => {
                const code = getCode(p);
                const name = getName(p);
                const basePrice = getPrice(p);
                const ivaRate = getIvaRate(getIvaCode(p));
                const pvp = basePrice * (1 + ivaRate);

                return (
                  <div
                    key={code}
                    className="p-3.5 rounded-xl border dark:border-gray-800 bg-white dark:bg-gray-900/40 hover:border-brand-200 dark:hover:border-brand-900/60 hover:shadow-2xs transition-all flex items-center justify-between gap-4 flex-wrap"
                  >
                    <div className="flex-1 min-w-[150px]">
                      <div className="font-bold text-sm text-gray-800 dark:text-white line-clamp-1">
                        {name}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">
                        {code}
                      </div>
                      <div className="mt-1.5 flex gap-1.5 flex-wrap">
                        {getIvaCode(p) === "4" ? (
                          <span className="px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold border border-blue-100 dark:border-blue-900/30">
                            IVA 15%
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-md bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-extrabold border border-green-100 dark:border-green-900/30">
                            IVA 0%
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-gray-400 dark:text-gray-500 font-semibold">
                        Base: ${basePrice.toFixed(2)}
                      </div>
                      <div className="text-sm font-extrabold text-brand-500 dark:text-brand-400 mt-0.5">
                        PVP: ${pvp.toFixed(2)}
                      </div>
                    </div>

                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => onDeleteProduct(code)}
                        className="h-8 w-8 rounded-lg border border-red-100 dark:border-red-950/40 text-red-500 hover:text-white hover:bg-red-500 hover:border-red-500 flex items-center justify-center transition-all shadow-3xs"
                        title="Eliminar del inventario"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ComponentCard>
  );
}
