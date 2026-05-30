/**
 * COMPONENTE: ResumenTotalesPOS
 * PROPÓSITO: Panel de desglose fiscal del comprobante en el Terminal POS.
 *
 * Muestra, separados por tarifa de IVA:
 *  - Subtotal IVA 15% (codigoPorcentaje "4")
 *  - Subtotal IVA 0%  (codigoPorcentaje "0")
 *  - IVA calculado
 *  - Descuentos aplicados
 *  - Total del comprobante
 *
 * Además incluye el selector de Forma de Pago según los códigos del SRI.
 *
 * TRIBUTARIO: El SRI exige desglosar los totales por tarifa en el comprobante.
 * Ver: Ficha Técnica de Comprobantes Electrónicos v2.21, nodo <totalConImpuestos>.
 */
import Label from "../formulario/Etiqueta";
import Select from "../formulario/Seleccion";
import Button from "../ui/boton/Boton";
import type { TotalesFactura } from "../../tipos/tipos-sri";

interface ResumenTotalesPOSProps {
  /** Totales calculados del carrito actual */
  totales: TotalesFactura;
  /** Código de forma de pago seleccionado actualmente */
  formaPago: string;
  /** Callback al cambiar la forma de pago */
  onFormaPagoChange: (codigo: string) => void;
  /** Callback al hacer clic en "Emitir Factura" */
  onEmitir: () => void;
  /** Indica si el botón de emisión debe estar deshabilitado */
  emitiendo?: boolean;
}

/** Formas de pago aceptadas por el SRI en facturación electrónica */
const FORMAS_PAGO = [
  { value: "01", label: "01 — Efectivo" },
  { value: "16", label: "16 — Tarjeta de Débito" },
  { value: "19", label: "19 — Tarjeta de Crédito" },
  { value: "20", label: "20 — Transferencia Bancaria" },
  { value: "21", label: "21 — Endoso de Títulos" },
];

export default function ResumenTotalesPOS({
  totales,
  formaPago,
  onFormaPagoChange,
  onEmitir,
  emitiendo = false,
}: ResumenTotalesPOSProps) {
  const tieneDescuentos = totales.totalDescuento > 0;
  const tieneIva8 = totales.subtotal8 > 0;

  return (
    <div className="pt-6 border-t dark:border-gray-800 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">

        {/* ── COLUMNA IZQUIERDA: FORMA DE PAGO + NOTA SRI ── */}
        <div className="md:col-span-5 space-y-4">
          <div>
            <Label>Forma de Pago (Código SRI)</Label>
            <Select
              options={FORMAS_PAGO}
              onChange={(v: any) => onFormaPagoChange(v)}
              defaultValue={formaPago}
            />
          </div>

          {/* Nota informativa sobre el payload */}
          <div className="flex gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/30 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>
              <strong>Nota SRI:</strong> El payload JSON generado incluye descuento e impuesto
              desglosados por cada ítem, según la Ficha Técnica v2.21 del SRI.
            </span>
          </div>
        </div>

        {/* ── COLUMNA DERECHA: DESGLOSE DE IMPORTES ── */}
        <div className="md:col-span-7 rounded-2xl bg-gray-25 dark:bg-gray-900 border dark:border-gray-800 p-5 space-y-2.5 shadow-2xs">

          {/* Subtotal IVA 15% — solo se muestra si hay ítems con esta tarifa */}
          {totales.subtotal15 > 0 && (
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>Subtotal gravado IVA 15%</span>
              <span className="font-semibold text-gray-800 dark:text-white">
                ${totales.subtotal15.toFixed(2)}
              </span>
            </div>
          )}

          {/* Subtotal IVA 8% — tarifa transitoria, solo si hay ítems */}
          {tieneIva8 && (
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>Subtotal gravado IVA 8%</span>
              <span className="font-semibold text-gray-800 dark:text-white">
                ${totales.subtotal8.toFixed(2)}
              </span>
            </div>
          )}

          {/* Subtotal IVA 0% — solo si hay ítems exentos */}
          {totales.subtotal0 > 0 && (
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>Subtotal no gravado (IVA 0%)</span>
              <span className="font-semibold text-gray-800 dark:text-white">
                ${totales.subtotal0.toFixed(2)}
              </span>
            </div>
          )}

          {/* IVA total calculado */}
          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>IVA calculado</span>
            <span className="font-semibold text-gray-800 dark:text-white">
              ${totales.iva.toFixed(2)}
            </span>
          </div>

          {/* Descuentos — solo si hay alguno */}
          {tieneDescuentos && (
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>Descuentos aplicados</span>
              <span className="font-semibold text-red-500">
                −${totales.totalDescuento.toFixed(2)}
              </span>
            </div>
          )}

          {/* Línea separadora + Total */}
          <div className="pt-3 border-t dark:border-gray-700 flex justify-between items-baseline">
            <span className="font-bold text-gray-800 dark:text-white">Total Comprobante</span>
            <span className="text-3xl font-extrabold text-brand-500 dark:text-brand-400 tabular-nums">
              ${totales.total.toFixed(2)}
            </span>
          </div>
        </div>

      </div>

      {/* ── BOTÓN DE EMISIÓN ── */}
      <div className="mt-6">
        <Button
          onClick={onEmitir}
          disabled={emitiendo}
          className="w-full py-4 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 text-base"
        >
          {/* Ícono de documento con check */}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {emitiendo ? "Generando comprobante..." : "Emitir y Generar XML SRI (Factura Electrónica)"}
        </Button>
        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-2">
          Se generará el payload JSON para firma electrónica en el backend.
        </p>
      </div>
    </div>
  );
}
