/**
 * COMPONENTE: ModalResultadoEmision
 * PROPÓSITO: Modal que aparece tras emitir una factura electrónica SRI.
 *
 * Muestra:
 *  - Estado de la factura (AUTORIZADA / PENDIENTE / ERROR)
 *  - Clave de acceso de 49 dígitos del SRI
 *  - Número secuencial del comprobante
 *  - Datos del cliente y total
 *  - Botón de descarga PDF (si el SRI autorizó y hay pdfId)
 *  - Botón "Nueva Venta" para reiniciar el POS
 */
import React, { useEffect } from "react";
import { descargarPdf } from "../../servicios/api-sri";
import type { RegistroFactura } from "../../tipos/tipos-sri";


interface ModalResultadoEmisionProps {
  abierto: boolean;
  onCerrar: () => void;
  /** Estado SRI del comprobante */
  status: RegistroFactura["status"];
  /** Datos del cliente de la factura */
  cliente: string;
  identificacion: string;
  /** Monto total formateado, ej: "$103.50" */
  total: string;
  /** Número secuencial del comprobante (9 dígitos) */
  secuencial?: string;
  /** Clave de acceso de 49 dígitos emitida por el SRI */
  claveAcceso?: string;
  /** ID del PDF para descarga */
  pdfId?: string;
  /** Productos del comprobante (resumen textual) */
  productosResumen?: string;
  /** Fecha de emisión */
  fechaEmision?: string;
}

const STATUS_CONFIG: Record<
  RegistroFactura["status"],
  { label: string; icon: React.ReactElement; colorBg: string; colorText: string; colorBorder: string; colorDot: string }
> = {
  Autorizado: {
    label: "AUTORIZADA POR EL SRI",
    colorBg: "bg-emerald-50 dark:bg-emerald-950/20",
    colorText: "text-emerald-700 dark:text-emerald-400",
    colorBorder: "border-emerald-200 dark:border-emerald-800/40",
    colorDot: "bg-emerald-500",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  Pendiente: {
    label: "PENDIENTE DE AUTORIZACIÓN",
    colorBg: "bg-amber-50 dark:bg-amber-950/20",
    colorText: "text-amber-700 dark:text-amber-400",
    colorBorder: "border-amber-200 dark:border-amber-800/40",
    colorDot: "bg-amber-500",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  Local: {
    label: "GUARDADA LOCALMENTE",
    colorBg: "bg-blue-50 dark:bg-blue-950/20",
    colorText: "text-blue-700 dark:text-blue-400",
    colorBorder: "border-blue-200 dark:border-blue-800/40",
    colorDot: "bg-blue-500",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  "Error SRI": {
    label: "ERROR DEL SRI",
    colorBg: "bg-red-50 dark:bg-red-950/20",
    colorText: "text-red-700 dark:text-red-400",
    colorBorder: "border-red-200 dark:border-red-800/40",
    colorDot: "bg-red-500",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  Anulado: {
    label: "ANULADO",
    colorBg: "bg-gray-50 dark:bg-gray-900/20",
    colorText: "text-gray-600 dark:text-gray-400",
    colorBorder: "border-gray-200 dark:border-gray-700",
    colorDot: "bg-gray-500",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
};

export default function ModalResultadoEmision({
  abierto,
  onCerrar,
  status,
  cliente,
  identificacion,
  total,
  secuencial,
  claveAcceso,
  pdfId,
  productosResumen,
  fechaEmision,
}: ModalResultadoEmisionProps) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["Local"];

  // Cerrar con tecla Escape
  useEffect(() => {
    if (!abierto) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  const handleDescargarPdf = () => {
    if (pdfId) {
      descargarPdf(pdfId);
    }
  };

  // Formatear la clave de acceso en bloques de 10 para facilitar lectura
  const claveFormateada = claveAcceso
    ? claveAcceso.match(/.{1,10}/g)?.join(" - ") ?? claveAcceso
    : null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop con blur */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCerrar}
        aria-hidden="true"
      />

      {/* Panel del modal */}
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-[modalSlideUp_0.25s_ease-out]">

        {/* ── CABECERA CON ESTADO ── */}
        <div className={`px-8 pt-8 pb-6 ${cfg.colorBg} border-b ${cfg.colorBorder}`}>
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 p-3 rounded-2xl ${cfg.colorBg} border ${cfg.colorBorder} ${cfg.colorText}`}>
              {cfg.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.colorDot}`} />
                <span className={`text-xs font-black tracking-widest uppercase ${cfg.colorText}`}>
                  {cfg.label}
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                Factura Electrónica
              </h2>
              {secuencial && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                  Comprobante <span className="font-bold text-gray-700 dark:text-gray-200">#{secuencial}</span>
                </p>
              )}
            </div>
            {/* Botón cerrar */}
            <button
              onClick={onCerrar}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition flex-shrink-0"
              aria-label="Cerrar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── CUERPO DEL MODAL ── */}
        <div className="px-8 py-6 space-y-5">

          {/* Datos del comprobante */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 space-y-3">
              <Row label="Cliente" value={cliente} />
              <Row label="Identificación" value={<span className="font-mono">{identificacion}</span>} />
              {fechaEmision && <Row label="Fecha de emisión" value={fechaEmision} />}
              <div className="pt-2 border-t dark:border-gray-700 flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total del comprobante</span>
                <span className="text-2xl font-extrabold text-brand-500 dark:text-brand-400">{total}</span>
              </div>
            </div>
          </div>

          {/* Productos resumen */}
          {productosResumen && (
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wide mb-1">Detalle</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{productosResumen}</p>
            </div>
          )}

          {/* Clave de acceso SRI */}
          {claveFormateada ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-800/30">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-widest mb-2">
                Clave de Acceso SRI
              </p>
              <p className="text-xs font-mono text-emerald-800 dark:text-emerald-300 break-all leading-relaxed">
                {claveFormateada}
              </p>
              <button
                onClick={() => {
                  if (claveAcceso) navigator.clipboard.writeText(claveAcceso);
                }}
                className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200 transition font-semibold"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copiar clave de acceso
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-800/30">
              <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
                {status === "Pendiente"
                  ? "⏳ La clave de acceso estará disponible cuando el SRI autorice el comprobante."
                  : status === "Local"
                  ? "📋 Comprobante guardado localmente. Envíe al SRI cuando la API esté disponible."
                  : "ℹ️ Sin clave de acceso disponible para este comprobante."}
              </p>
            </div>
          )}
        </div>

        {/* ── ACCIONES ── */}
        <div className="px-8 pb-8 flex flex-col gap-3">
          {/* Botón Descargar PDF (solo si hay pdfId) */}
          {pdfId && (
            <button
              onClick={handleDescargarPdf}
              className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Descargar PDF del RIDE
            </button>
          )}

          {/* Botón Nueva Venta */}
          <button
            onClick={onCerrar}
            className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold text-sm transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nueva Venta
          </button>
        </div>

      </div>
    </div>
  );
}

/** Fila de dato: label + valor */
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-3">
      <span className="text-sm text-gray-400 dark:text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-sm font-semibold text-gray-800 dark:text-white text-right">{value}</span>
    </div>
  );
}
