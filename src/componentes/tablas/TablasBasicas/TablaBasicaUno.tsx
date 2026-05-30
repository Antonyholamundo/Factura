/**
 * COMPONENTE: BasicTableOne (Historial de Comprobantes Emitidos)
 * FUNCIÓN: Tabla premium del historial de facturas electrónicas SRI.
 * Muestra: fecha, cliente, secuencial, estado SRI, total y acciones (PDF).
 */
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import Badge from "../../ui/insignia/Insignia";
import { descargarPdf } from "../../../servicios/api-sri";
import type { RegistroFactura, FacturaPayload } from "../../../tipos/tipos-sri";
import ModalResultadoEmision from "../../pos/ModalResultadoEmision";

// Tipo adaptado para compatibilidad con datos legacy (modo offline/local)
interface InvoiceRow {
  id: number | string;
  user: { image: string; name: string; role: string };
  projectName: string;
  team?: { images: string[] };
  status: string;
  budget: string;
  // Campos SRI enriquecidos
  pdfId?: string;
  claveAcceso?: string;
  secuencial?: string;
  fechaEmision?: string;
  payload?: FacturaPayload;
}

interface BasicTableOneProps {
  invoices?: InvoiceRow[];
  /** Historial tipado directamente desde el hook usarPos */
  registros?: RegistroFactura[];
}

/** Normaliza un RegistroFactura al formato InvoiceRow para la tabla */
function normalizarRegistro(r: RegistroFactura): InvoiceRow {
  return {
    id: r.id,
    user: {
      image: "/images/user/user-17.jpg",
      name: r.cliente,
      role: `ID: ${r.identificacion}`,
    },
    projectName: r.productosResumen,
    budget: r.total,
    status: r.status,
    pdfId: r.pdfId,
    claveAcceso: r.claveAcceso,
    secuencial: r.secuencial,
    fechaEmision: r.fechaEmision,
    payload: r.payload,
  };
}

/** Color del badge según el estado SRI */
function colorBadge(status: string): "success" | "warning" | "error" | "info" {
  switch (status) {
    case "Autorizado": return "success";
    case "Pendiente": return "warning";
    case "Local": return "info";
    case "Error SRI":
    case "Anulado": return "error";
    default: return "info";
  }
}

export default function BasicTableOne({ invoices, registros }: BasicTableOneProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow | null>(null);

  // Priorizar registros tipados; si no, usar invoices legacy
  const rows: InvoiceRow[] = registros
    ? registros.map(normalizarRegistro)
    : (invoices ?? []);

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <svg className="w-14 h-14 text-gray-200 dark:text-gray-700 mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-gray-400 dark:text-gray-500 font-medium text-sm">Sin comprobantes emitidos todavía.</p>
        <p className="text-gray-300 dark:text-gray-600 text-xs mt-1">Las facturas aparecerán aquí después de emitirlas.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* Encabezados */}
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              {["Fecha", "Cliente", "Comprobante", "Estado SRI", "Total", "Acciones"].map((h) => (
                <TableCell
                  key={h}
                  isHeader
                  className="px-5 py-3 font-semibold text-gray-500 text-start text-theme-xs dark:text-gray-400 uppercase tracking-wide whitespace-nowrap"
                >
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>

          {/* Filas */}
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {rows.map((row) => (
              <TableRow 
                key={row.id} 
                className="hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                onClick={() => setSelectedInvoice(row)}
              >

                {/* Fecha */}
                <TableCell className="px-5 py-4 whitespace-nowrap">
                  <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                    {row.fechaEmision || "—"}
                  </span>
                </TableCell>

                {/* Cliente */}
                <TableCell className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 overflow-hidden rounded-full flex-shrink-0 bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-brand-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <span className="block font-semibold text-gray-800 text-theme-sm dark:text-white/90 max-w-[160px] truncate">
                        {row.user.name}
                      </span>
                      <span className="block text-gray-400 text-theme-xs dark:text-gray-500 font-mono">
                        {row.user.role}
                      </span>
                    </div>
                  </div>
                </TableCell>

                {/* Comprobante: secuencial + descripción */}
                <TableCell className="px-5 py-4">
                  <div>
                    {row.secuencial && (
                      <span className="block text-xs font-bold text-brand-500 dark:text-brand-400 font-mono mb-0.5">
                        #{row.secuencial}
                      </span>
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 max-w-[200px]">
                      {row.projectName}
                    </span>
                  </div>
                </TableCell>

                {/* Estado SRI */}
                <TableCell className="px-5 py-4">
                  <Badge size="sm" color={colorBadge(row.status)}>
                    {row.status}
                  </Badge>
                </TableCell>

                {/* Total */}
                <TableCell className="px-5 py-4 font-bold text-gray-800 dark:text-white tabular-nums text-theme-sm whitespace-nowrap">
                  {row.budget}
                </TableCell>

                {/* Acciones */}
                <TableCell className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    {/* Botón PDF (solo si hay pdfId) */}
                    {row.pdfId ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); descargarPdf(row.pdfId!); }}
                        title="Descargar PDF del RIDE"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 dark:bg-brand-500/10 dark:hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-semibold transition-all"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        PDF
                      </button>
                    ) : (
                      <span
                        onClick={(e) => e.stopPropagation()}
                        title={row.status === "Autorizado" ? "PDF en proceso..." : "PDF no disponible"}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 text-xs font-semibold cursor-not-allowed"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        PDF
                      </span>
                    )}

                    {/* Copiar clave de acceso */}
                    {row.claveAcceso && (
                      <button
                        onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(row.claveAcceso!); }}
                        title="Copiar clave de acceso SRI"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </TableCell>

              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {selectedInvoice && (
        <ModalResultadoEmision
          abierto={!!selectedInvoice}
          onCerrar={() => setSelectedInvoice(null)}
          status={selectedInvoice.status as any}
          cliente={selectedInvoice.user.name}
          identificacion={selectedInvoice.user.role.replace("ID: ", "")}
          total={selectedInvoice.budget}
          secuencial={selectedInvoice.secuencial}
          claveAcceso={selectedInvoice.claveAcceso}
          pdfId={selectedInvoice.pdfId}
          productosResumen={selectedInvoice.projectName}
          fechaEmision={selectedInvoice.fechaEmision}
        />
      )}
    </div>
  );
}
