/**
 * PÁGINA: TablasBasicas (Terminal POS — Facturación Electrónica SRI)
 * RUTA: /basic-tables
 *
 * Terminal Punto de Venta (POS) minimalista para emisión de comprobantes
 * electrónicos autorizados por el SRI Ecuador.
 *
 * ARQUITECTURA:
 *  - Toda la lógica de negocio vive en el hook usarPos (src/ganchos/usar-pos.ts)
 *  - Este componente solo orquesta JSX + estado de UI (modales abiertos, tabs)
 *  - Los modales están extraídos a componentes independientes:
 *      · ModalCatalogoProductos — selección de productos
 *      · ModalGestionClientes   — búsqueda y registro de clientes
 *  - El panel fiscal está en ResumenTotalesPOS
 *
 * FLUJO POS (< 5 clics para emitir):
 *  1. Clic "Consumidor Final" o "Buscar/Crear Cliente"
 *  2. Clic "Agregar Producto" → seleccionar ítem
 *  3. Ajustar cantidad / descuento si es necesario
 *  4. Seleccionar forma de pago
 *  5. Clic "Emitir Factura"
 */
import { useState } from "react";
import { createPortal } from "react-dom";
import PageBreadcrumb from "../../componentes/comunes/MigasPagina";
import ComponentCard from "../../componentes/comunes/TarjetaComponente";
import PageMeta from "../../componentes/comunes/MetaPagina";
import BasicTableOne from "../../componentes/tablas/TablasBasicas/TablaBasicaUno";
import ModalCatalogoProductos from "../../componentes/pos/ModalCatalogoProductos";
import ModalGestionClientes from "../../componentes/pos/ModalGestionClientes";
import ResumenTotalesPOS from "../../componentes/pos/ResumenTotalesPOS";
import ModalResultadoEmision from "../../componentes/pos/ModalResultadoEmision";
import { usarPos } from "../../ganchos/usar-pos";
import type { RegistroFactura } from "../../tipos/tipos-sri";

export default function BasicTables() {
  // ── Hook POS: toda la lógica de negocio ────────────────────────────────────
  const {
    cliente,
    setCliente,
    setConsumidorFinal,
    carrito,
    agregarAlCarrito,
    quitarDelCarrito,
    cambiarCantidad,
    cambiarDescuento,
    totales,
    cargandoTotales,
    productos,
    clientes,
    registrarCliente,
    historial,
    formaPago,
    setFormaPago,
    emitirFactura,
    mensajeExito,
    apiConectada,
    loading,
    error,
  } = usarPos();

  // ── Estado de UI — solo controles visuales (no lógica de negocio) ──────────
  const [tabActiva, setTabActiva] = useState<"pos" | "history">("pos");
  const [modalProductoAbierto, setModalProductoAbierto] = useState(false);
  const [modalClienteAbierto, setModalClienteAbierto] = useState(false);
  const [tabCliente, setTabCliente] = useState<"search" | "create">("search");
  const [emitiendo, setEmitiendo] = useState(false);
  const [errorEmision, setErrorEmision] = useState("");

  // Estado del modal de resultado de emisión
  const [modalResultado, setModalResultado] = useState<{
    abierto: boolean;
    status: RegistroFactura["status"];
    cliente: string;
    identificacion: string;
    total: string;
    secuencial?: string;
    claveAcceso?: string;
    pdfId?: string;
    productosResumen?: string;
    fechaEmision?: string;
  }>({
    abierto: false,
    status: "Local",
    cliente: "",
    identificacion: "",
    total: "",
  });

  // ── Estado local del buscador y filtro del modal de productos ─────────────
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [categoriaProducto, setCategoriaProducto] = useState("all");

  /** Maneja la emisión y abre el modal de resultado */
  const handleEmitir = async () => {
    if (emitiendo) return;
    setEmitiendo(true);
    setErrorEmision("");

    // Capturar los datos ANTES de emitir (el hook limpia el carrito después)
    const clienteSnap = { ...cliente };
    const carritoSnap = [...carrito];
    const totalSnap = totales.total;

    try {
      const resultado = await emitirFactura();

      // Siempre calcular el total desde snapshot (ya que el carrito se limpió)
      const totalStr = `$${(resultado.payload?.infoFactura?.totalConImpuestos ?? totalSnap).toFixed(2)}`;

      if (!resultado.exito) {
        // Si hay error del SRI pero tenemos payload, mostrar modal de error
        if (resultado.payload) {
          setModalResultado({
            abierto: true,
            status: "Error SRI",
            cliente: clienteSnap.razonSocial,
            identificacion: clienteSnap.identificacion,
            total: totalStr,
            secuencial: resultado.payload?.infoTributaria?.secuencial,
            productosResumen: carritoSnap.map(i => `${i.descripcion} x${i.cantidad}`).join(", "),
            fechaEmision: resultado.payload?.infoFactura?.fechaEmision,
          });
        } else {
          setErrorEmision(resultado.mensaje);
        }
        return;
      }

      // Éxito — abrir modal con todos los datos
      setModalResultado({
        abierto: true,
        status: resultado.status ?? "Local",
        cliente: clienteSnap.razonSocial,
        identificacion: clienteSnap.identificacion,
        total: totalStr,
        secuencial: resultado.secuencial ?? resultado.payload?.infoTributaria?.secuencial,
        claveAcceso: resultado.claveAcceso,
        pdfId: resultado.pdfId,
        productosResumen: carritoSnap.map(i => `${i.descripcion} x${i.cantidad}`).join(", "),
        fechaEmision: resultado.payload?.infoFactura?.fechaEmision,
      });

    } catch (err: any) {
      console.error("[POS] handleEmitir error:", err);
      setErrorEmision(err.message || "Error inesperado al emitir la factura.");
    } finally {
      setEmitiendo(false);
    }
  };



  /** Badge del tipo de identificación del cliente activo */
  const labelTipoId = (tipo: string) => {
    const mapa: Record<string, string> = {
      "04": "RUC", "05": "Cédula", "06": "Pasaporte", "07": "Cons. Final"
    };
    return mapa[tipo] || tipo;
  };

  return (
    <>
      <PageMeta
        title="Terminal POS | Facturación Electrónica SRI Ecuador"
        description="Punto de venta integrado con el SRI Ecuador. Emisión de comprobantes electrónicos con cálculo automático de IVA 15% y 0%."
      />
      <PageBreadcrumb pageTitle="Terminal POS — Facturación SRI" />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-3xl p-6 shadow-sm">
          <svg className="w-12 h-12 text-brand-500 animate-spin mb-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-600 dark:text-gray-400 font-bold text-base">Cargando datos comerciales desde el servidor...</p>
        </div>
      ) : error ? (
        <div className="p-10 text-center border border-red-200 dark:border-red-950 bg-red-50 dark:bg-red-950/10 rounded-3xl">
          <span className="text-red-500 text-4xl mb-4 block">⚠️</span>
          <h2 className="text-xl font-extrabold text-red-800 dark:text-red-300 mb-2">Error de Conexión</h2>
          <p className="text-red-700 dark:text-red-400 max-w-md mx-auto mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md transition-all">
            Reintentar Conexión
          </button>
        </div>
      ) : (
        <>
          {/* ── NAVEGACIÓN DE PESTAÑAS ── */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="inline-flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 border dark:border-gray-700">
          <button
            onClick={() => setTabActiva("pos")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              tabActiva === "pos"
                ? "bg-white dark:bg-gray-900 text-brand-500 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Terminal de Ventas
          </button>
          <button
            onClick={() => setTabActiva("history")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              tabActiva === "history"
                ? "bg-white dark:bg-gray-900 text-brand-500 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Historial de Ventas
            {historial.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-brand-500 text-white text-[10px] font-black">
                {historial.length}
              </span>
            )}
          </button>
        </div>

        {/* Accesos rápidos de cliente (solo en pestaña POS) */}
        {tabActiva === "pos" && (
          <div className="flex gap-2">
            <button
              onClick={setConsumidorFinal}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl text-sm border dark:border-gray-700 transition"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Consumidor Final
            </button>
            <button
              onClick={() => { setTabCliente("search"); setModalClienteAbierto(true); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl text-sm shadow-sm transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Buscar / Crear Cliente
            </button>
          </div>
        )}
      </div>

      {/* ── INDICADOR DE ESTADO DE API ── */}
      {tabActiva === "pos" && (
        <div className="mb-4 flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
            apiConectada
              ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
              : "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
          }`}>
            <span className={`w-2 h-2 rounded-full ${apiConectada ? "bg-green-500 animate-pulse" : "bg-amber-500"}`} />
            {apiConectada ? "API SRI Conectada" : "Modo Local (sin conexión a API)"}
          </span>
        </div>
      )}

      {/* ── BANNER DE ÉXITO — solo si el modal no está abierto ── */}
      {mensajeExito && !modalResultado.abierto && (
        <div className="mb-6 rounded-2xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/40 px-5 py-4 text-green-800 dark:text-green-400 text-sm font-medium flex items-center gap-2.5">
          <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* ── BANNER DE ERROR DE EMISIÓN ── */}
      {errorEmision && (
        <div className="mb-6 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 px-5 py-4 text-red-800 dark:text-red-400 text-sm font-medium flex items-center gap-2.5">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{errorEmision}</span>
          <button onClick={() => setErrorEmision("")} className="ml-auto text-red-500 hover:text-red-700 dark:hover:text-red-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VISTA PRINCIPAL: TERMINAL POS
      ══════════════════════════════════════════════════════════════════════ */}
      {tabActiva === "pos" ? (
        <div className="max-w-4xl mx-auto space-y-6">
          <ComponentCard title="Caja POS — Registro de Transacción">
            <div className="space-y-6">

              {/* ── TARJETA DEL CLIENTE ACTIVO ── */}
              <div className="p-4 rounded-2xl bg-gray-25 dark:bg-gray-900 border dark:border-gray-800 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  {/* Avatar icono cliente */}
                  <div className="h-12 w-12 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-500 flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-800 dark:text-white text-base">
                        {cliente.razonSocial}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-semibold">
                        {labelTipoId(cliente.tipoIdentificacion)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      ID: <span className="font-mono font-semibold">{cliente.identificacion}</span>
                      {cliente.tipoIdentificacion !== "07" && (
                        <> • {cliente.direccion}</>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => { setTabCliente("search"); setModalClienteAbierto(true); }}
                    className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 text-sm font-semibold shadow-sm transition"
                  >
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-2.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Cambiar
                  </button>
                  {cliente.tipoIdentificacion !== "07" && (
                    <button
                      onClick={setConsumidorFinal}
                      className="px-4.5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold transition shadow-sm"
                    >
                      Restablecer CF
                    </button>
                  )}
                </div>
              </div>

              {/* ── BOTÓN AGREGAR PRODUCTO ── */}
              <div className="flex justify-center py-2">
                <button
                  onClick={() => { setBusquedaProducto(""); setModalProductoAbierto(true); }}
                  className="group flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-base shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Agregar Producto a la Venta
                </button>
              </div>

              {/* ── TABLA DE DETALLES DEL COMPROBANTE ── */}
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-gray-800 text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-wider">
                      <th className="pb-3 text-left">Código / Descripción</th>
                      <th className="pb-3 text-right">Precio Unit.</th>
                      <th className="pb-3 text-center">Cant.</th>
                      <th className="pb-3 text-right">Desc. ($)</th>
                      <th className="pb-3 text-right">Subtotal</th>
                      <th className="pb-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {carrito.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-14 text-center text-gray-400 dark:text-gray-500 font-medium">
                          <div className="flex justify-center mb-3">
                            <svg className="w-12 h-12 text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          El comprobante está vacío.<br />
                          <span className="text-xs">Haz clic en el botón de arriba para agregar productos.</span>
                        </td>
                      </tr>
                    ) : (
                      carrito.map((item) => {
                        // Calcular subtotal de la línea para mostrar en la tabla
                        const lineaBase = item.precioUnitario * item.cantidad;
                        const lineaDescuento = item.descuento || 0;
                        const lineaSubtotal = Math.max(0, lineaBase - lineaDescuento);

                        return (
                          <tr
                            key={item.codigoPrincipal}
                            className="border-b dark:border-gray-800 align-middle hover:bg-gray-25/40 dark:hover:bg-gray-800/10 transition-colors"
                          >
                            {/* Descripción y código */}
                            <td className="py-4">
                              <div className="font-bold text-gray-800 dark:text-white">{item.descripcion}</div>
                              <div className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">{item.codigoPrincipal}</div>
                              <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                item.codigoPorcentaje === "4"
                                  ? "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400"
                                  : "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400"
                              }`}>
                                IVA {item.codigoPorcentaje === "4" ? "15%" : "0%"}
                              </span>
                            </td>

                            {/* Precio unitario (base sin IVA) */}
                            <td className="py-4 text-right font-medium text-gray-800 dark:text-gray-200">
                              ${item.precioUnitario.toFixed(2)}
                            </td>

                            {/* Control de cantidad +/- */}
                            <td className="py-4 text-center">
                              <div className="inline-flex items-center border dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800">
                                <button
                                  type="button"
                                  onClick={() => cambiarCantidad(item.codigoPrincipal, item.cantidad - 1)}
                                  className="px-3 py-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 font-extrabold text-gray-500 dark:text-gray-400 transition"
                                >
                                  −
                                </button>
                                <span className="px-3 py-1.5 font-bold text-sm text-gray-800 dark:text-white tabular-nums">
                                  {item.cantidad}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => cambiarCantidad(item.codigoPrincipal, item.cantidad + 1)}
                                  className="px-3 py-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 font-extrabold text-gray-500 dark:text-gray-400 transition"
                                >
                                  +
                                </button>
                              </div>
                            </td>

                            {/* Descuento en $ editable inline */}
                            <td className="py-4 text-right">
                              <div className="inline-flex justify-end items-center">
                                <span className="text-gray-400 mr-1 text-sm">$</span>
                                <input
                                  type="number"
                                  value={item.descuento === 0 ? "" : item.descuento}
                                  onChange={(e) => cambiarDescuento(item.codigoPrincipal, parseFloat(e.target.value) || 0)}
                                  placeholder="0.00"
                                  className="h-9 w-20 text-right px-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent text-sm text-gray-800 dark:text-white focus:border-brand-500 focus:outline-none dark:bg-gray-900 transition-all font-semibold"
                                  min="0"
                                  step="0.01"
                                />
                              </div>
                            </td>

                            {/* Subtotal de la línea */}
                            <td className="py-4 text-right font-bold text-gray-800 dark:text-white tabular-nums">
                              ${lineaSubtotal.toFixed(2)}
                            </td>

                            {/* Botón eliminar ítem */}
                            <td className="py-4 text-right">
                              <button
                                type="button"
                                onClick={() => quitarDelCarrito(item.codigoPrincipal)}
                                className="h-9 w-9 rounded-xl border border-red-200 dark:border-red-950/40 text-red-500 hover:text-white hover:bg-red-500 hover:border-red-500 flex items-center justify-center transition-all"
                                title="Quitar ítem del comprobante"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* ── PANEL DE TOTALES Y EMISIÓN (solo si hay ítems en el carrito) ── */}
              {carrito.length > 0 && (
                <ResumenTotalesPOS
                  totales={totales}
                  formaPago={formaPago}
                  onFormaPagoChange={setFormaPago}
                  onEmitir={handleEmitir}
                  emitiendo={emitiendo || cargandoTotales}
                />
              )}

            </div>
          </ComponentCard>
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════════════════
            VISTA: HISTORIAL DE COMPROBANTES EMITIDOS
        ══════════════════════════════════════════════════════════════════════ */
        <ComponentCard title={`Historial de Comprobantes Emitidos — ${historial.length} registro(s)`}>
          <BasicTableOne registros={historial} />
        </ComponentCard>
      )}
        </>
      )}

      {/* ── MODAL: CATÁLOGO DE PRODUCTOS ── */}
      <ModalCatalogoProductos
        abierto={modalProductoAbierto}
        onCerrar={() => setModalProductoAbierto(false)}
        productos={productos}
        carrito={carrito}
        onAgregar={(p) => { agregarAlCarrito(p); /* No cierra el modal para agregar múltiples */ }}
        busqueda={busquedaProducto}
        onBusquedaChange={setBusquedaProducto}
        categoria={categoriaProducto}
        onCategoriaChange={setCategoriaProducto}
      />

      {/* ── MODAL: GESTIÓN DE CLIENTES ── */}
      <ModalGestionClientes
        abierto={modalClienteAbierto}
        onCerrar={() => setModalClienteAbierto(false)}
        clientes={clientes}
        onSeleccionar={setCliente}
        onRegistrarCliente={registrarCliente}
        tabInicial={tabCliente}
      />

      {/* ── MODAL: RESULTADO DE EMISIÓN — renderizado en document.body para evitar conflictos de re-render ── */}
      {createPortal(
        <ModalResultadoEmision
          abierto={modalResultado.abierto}
          onCerrar={() => setModalResultado(prev => ({ ...prev, abierto: false }))}
          status={modalResultado.status}
          cliente={modalResultado.cliente}
          identificacion={modalResultado.identificacion}
          total={modalResultado.total}
          secuencial={modalResultado.secuencial}
          claveAcceso={modalResultado.claveAcceso}
          pdfId={modalResultado.pdfId}
          productosResumen={modalResultado.productosResumen}
          fechaEmision={modalResultado.fechaEmision}
        />,
        document.body
      )}
    </>
  );
}
