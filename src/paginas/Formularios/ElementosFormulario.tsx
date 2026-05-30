/**
 * PÁGINA: ElementosFormulario (Catálogo de Productos e Inventario)
 * RUTA: /form-elements
 *
 * CRUD completo de productos conectado a la API del backend.
 * - Listar productos con búsqueda y filtro de IVA
 * - Crear producto (modal)
 * - Editar producto (modal)
 * - Estado IVA visual (15% / 0%)
 */
import { useState, useEffect, useCallback } from "react";
import PageBreadcrumb from "../../componentes/comunes/MigasPagina";
import PageMeta from "../../componentes/comunes/MetaPagina";
import {
  listarProductos,
  crearProducto,
  actualizarProducto,
} from "../../servicios/api-sri";
import { estaAutenticado } from "../../servicios/api-sri";

interface Producto {
  _id?: string;
  codigo: string;
  descripcion: string;
  precio_unitario: number;
  tiene_iva: boolean;
  categoria?: string;
}

const PRODUCTO_VACIO: Omit<Producto, "_id"> = {
  codigo: "",
  descripcion: "",
  precio_unitario: 0,
  tiene_iva: true,
  categoria: "",
};

export default function ElementosFormulario() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtroIva, setFiltroIva] = useState<"todos" | "iva" | "noiva">("todos");

  // Modal de creación / edición
  const [modal, setModal] = useState<{
    abierto: boolean;
    modo: "crear" | "editar";
    form: Omit<Producto, "_id">;
    editandoId?: string;
  }>({
    abierto: false,
    modo: "crear",
    form: { ...PRODUCTO_VACIO },
  });
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  // Cargar productos desde la API
  const cargarProductos = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listarProductos();
      setProductos(data);
    } catch (err: any) {
      setError(err.message || "Error al cargar los productos del servidor.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (estaAutenticado()) {
      cargarProductos();
    } else {
      setLoading(false);
    }
  }, [cargarProductos]);

  // Filtrar productos por búsqueda e IVA
  const productosFiltrados = productos.filter((p) => {
    const coincide =
      !busqueda ||
      p.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.categoria ?? "").toLowerCase().includes(busqueda.toLowerCase());

    const passIva =
      filtroIva === "todos" ||
      (filtroIva === "iva" && p.tiene_iva) ||
      (filtroIva === "noiva" && !p.tiene_iva);

    return coincide && passIva;
  });

  const abrirCrear = () => {
    setModal({ abierto: true, modo: "crear", form: { ...PRODUCTO_VACIO } });
    setErrorForm("");
  };

  const abrirEditar = (p: Producto) => {
    setModal({
      abierto: true,
      modo: "editar",
      editandoId: p._id,
      form: {
        codigo: p.codigo,
        descripcion: p.descripcion,
        precio_unitario: p.precio_unitario,
        tiene_iva: p.tiene_iva,
        categoria: p.categoria ?? "",
      },
    });
    setErrorForm("");
  };

  const cerrarModal = () => {
    if (!guardando) setModal((prev) => ({ ...prev, abierto: false }));
  };

  const handleChange = (field: keyof Omit<Producto, "_id">, value: any) => {
    setModal((prev) => ({ ...prev, form: { ...prev.form, [field]: value } }));
  };

  const handleGuardar = async () => {
    const { form, modo, editandoId } = modal;

    // Validaciones básicas
    if (!form.codigo.trim()) return setErrorForm("El código del producto es obligatorio.");
    if (!form.descripcion.trim()) return setErrorForm("La descripción es obligatoria.");
    if (form.precio_unitario <= 0) return setErrorForm("El precio unitario debe ser mayor a $0.00.");

    setGuardando(true);
    setErrorForm("");
    try {
      if (modo === "crear") {
        const nuevo = await crearProducto({
          codigo: form.codigo.trim().toUpperCase(),
          descripcion: form.descripcion.trim(),
          precio_unitario: parseFloat(String(form.precio_unitario)),
          tiene_iva: form.tiene_iva,
          categoria: form.categoria?.trim() || undefined,
        });
        setProductos((prev) => [nuevo, ...prev]);
      } else if (editandoId) {
        const actualizado = await actualizarProducto(editandoId, {
          codigo: form.codigo.trim().toUpperCase(),
          descripcion: form.descripcion.trim(),
          precio_unitario: parseFloat(String(form.precio_unitario)),
          tiene_iva: form.tiene_iva,
          categoria: form.categoria?.trim() || undefined,
        });
        setProductos((prev) =>
          prev.map((p) => (p._id === editandoId ? { ...p, ...actualizado } : p))
        );
      }
      cerrarModal();
    } catch (err: any) {
      setErrorForm(err.message || "Error al guardar el producto.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Catálogo de Productos | Facturación Electrónica SRI"
        description="Gestión del inventario de productos y servicios para la facturación electrónica. Administra precios, códigos y tarifas de IVA."
      />
      <PageBreadcrumb pageTitle="Catálogo de Productos e Inventario" />

      <div className="space-y-6">
        {/* ── BARRA DE ACCIONES ── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Buscador */}
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por código, descripción..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-white focus:border-brand-500 focus:outline-none transition"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Filtro IVA */}
            <div className="inline-flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 border dark:border-gray-700">
              {[
                { k: "todos", l: "Todos" },
                { k: "iva", l: "IVA 15%" },
                { k: "noiva", l: "IVA 0%" },
              ].map(({ k, l }) => (
                <button
                  key={k}
                  onClick={() => setFiltroIva(k as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filtroIva === k
                      ? "bg-white dark:bg-gray-900 text-brand-500 shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-800"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Botón nuevo producto */}
            <button
              onClick={abrirCrear}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-sm transition-all hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Producto
            </button>
          </div>
        </div>

        {/* ── TABLA DE PRODUCTOS ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="w-10 h-10 text-brand-500 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : error ? (
          <div className="p-8 text-center rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/10 dark:border-red-900/30">
            <p className="text-red-600 dark:text-red-400 font-semibold">{error}</p>
            <button onClick={cargarProductos} className="mt-3 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl transition">
              Reintentar
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03]">
            {productosFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <svg className="w-14 h-14 text-gray-200 dark:text-gray-700 mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-gray-400 font-medium text-sm">No se encontraron productos.</p>
                <button onClick={abrirCrear} className="mt-4 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold rounded-xl transition">
                  Crear primer producto
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                      {["Código", "Descripción", "Categoría", "Precio Unit. (sin IVA)", "IVA", "Acciones"].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {productosFiltrados.map((p, i) => (
                      <tr key={p._id ?? i} className="hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-4 font-mono text-xs font-bold text-gray-600 dark:text-gray-300 whitespace-nowrap">
                          {p.codigo}
                        </td>
                        <td className="px-5 py-4 text-gray-800 dark:text-white font-medium max-w-[220px]">
                          <span className="line-clamp-2">{p.descripcion}</span>
                        </td>
                        <td className="px-5 py-4 text-gray-500 dark:text-gray-400 text-xs">
                          {p.categoria || <span className="text-gray-300 dark:text-gray-600 italic">—</span>}
                        </td>
                        <td className="px-5 py-4 font-bold text-gray-800 dark:text-white tabular-nums whitespace-nowrap">
                          ${p.precio_unitario.toFixed(2)}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                            p.tiene_iva
                              ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                              : "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400"
                          }`}>
                            {p.tiene_iva ? "15%" : "0%"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => abrirEditar(p)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-semibold transition"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Footer contador */}
                <div className="px-5 py-3 border-t dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Mostrando <strong>{productosFiltrados.length}</strong> de{" "}
                    <strong>{productos.length}</strong> productos
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: CREAR / EDITAR PRODUCTO
      ══════════════════════════════════════════════════════════════════════ */}
      {modal.abierto && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={cerrarModal} />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-[modalSlideUp_0.2s_ease-out]">

            {/* Cabecera */}
            <div className="px-6 py-5 border-b dark:border-gray-800 flex items-center justify-between">
              <h2 className="font-extrabold text-gray-900 dark:text-white text-lg">
                {modal.modo === "crear" ? "Nuevo Producto" : "Editar Producto"}
              </h2>
              <button onClick={cerrarModal} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Formulario */}
            <div className="px-6 py-5 space-y-4">
              {errorForm && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium">
                  {errorForm}
                </div>
              )}

              <Field label="Código *" hint="Alfanumérico, máx. 25 caracteres">
                <input
                  type="text"
                  value={modal.form.codigo}
                  onChange={(e) => handleChange("codigo", e.target.value)}
                  maxLength={25}
                  placeholder="Ej: PROD-001"
                  className={inputClass}
                />
              </Field>

              <Field label="Descripción *">
                <input
                  type="text"
                  value={modal.form.descripcion}
                  onChange={(e) => handleChange("descripcion", e.target.value)}
                  placeholder="Nombre del bien o servicio"
                  className={inputClass}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Precio Unitario (sin IVA) *">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input
                      type="number"
                      value={modal.form.precio_unitario}
                      onChange={(e) => handleChange("precio_unitario", parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className={`${inputClass} pl-7`}
                    />
                  </div>
                </Field>

                <Field label="Categoría (opcional)">
                  <input
                    type="text"
                    value={modal.form.categoria ?? ""}
                    onChange={(e) => handleChange("categoria", e.target.value)}
                    placeholder="Ej: Electrónicos"
                    className={inputClass}
                  />
                </Field>
              </div>

              {/* Toggle IVA */}
              <Field label="Tarifa de IVA">
                <div className="inline-flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 border dark:border-gray-700 w-full">
                  <button
                    type="button"
                    onClick={() => handleChange("tiene_iva", true)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                      modal.form.tiene_iva
                        ? "bg-blue-500 text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    IVA 15%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange("tiene_iva", false)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                      !modal.form.tiene_iva
                        ? "bg-green-500 text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    IVA 0%
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {modal.form.tiene_iva
                    ? "Código SRI: 4 — Tarifa general vigente desde mayo 2024"
                    : "Código SRI: 0 — Bienes exentos, medicamentos, canasta básica"}
                </p>
              </Field>
            </div>

            {/* Acciones */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={cerrarModal}
                disabled={guardando}
                className="flex-1 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={guardando}
                className="flex-1 py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                {guardando ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Guardando...
                  </>
                ) : (
                  modal.modo === "crear" ? "Crear Producto" : "Guardar Cambios"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Componente auxiliar de campo de formulario */
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm text-gray-800 dark:text-white focus:border-brand-500 focus:outline-none transition placeholder-gray-300 dark:placeholder-gray-600 dark:bg-gray-800/50";
