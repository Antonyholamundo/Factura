/**
 * COMPONENTE: EcommerceMetrics
 * FUNCIÓN: KPIs del tablero calculados en tiempo real desde la API del backend.
 * Muestra: total facturado del mes, facturas autorizadas, pendientes e IVA.
 */
import { useEffect, useState } from "react";
import { ArrowUpIcon, GroupIcon, BoxIconLine } from "../../iconos";
import Badge from "../ui/insignia/Insignia";
import { listarFacturas, listarClientes } from "../../servicios/api-sri";
import { estaAutenticado } from "../../servicios/api-sri";

interface KPIs {
  totalMes: number;
  facturasAutorizadas: number;
  facturasPendientes: number;
  totalClientes: number;
  ivaRecaudado: number;
}

function MetricCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color?: "success" | "warning" | "error" | "info";
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex items-center justify-center w-12 h-12 bg-brand-50 dark:bg-brand-500/10 rounded-xl">
        {icon}
      </div>
      <div className="flex items-end justify-between mt-5">
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
          <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">{value}</h4>
          {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
        </div>
        {color && (
          <Badge color={color}>
            <ArrowUpIcon />
          </Badge>
        )}
      </div>
    </div>
  );
}

export default function EcommerceMetrics() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!estaAutenticado()) {
      setLoading(false);
      return;
    }

    const mesActual = new Date().getMonth();
    const anioActual = new Date().getFullYear();

    Promise.all([listarFacturas(), listarClientes()])
      .then(([facturas, clientes]) => {
        const facturasMes = facturas.filter((f: any) => {
          const fecha = new Date(f.fecha_emision || f.createdAt || Date.now());
          return fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual;
        });

        const totalMes = facturasMes.reduce(
          (sum: number, f: any) => sum + (parseFloat(f.total_con_impuestos) || 0),
          0
        );

        const ivaRecaudado = facturasMes.reduce(
          (sum: number, f: any) => sum + (parseFloat(f.iva) || parseFloat(f.total_iva) || 0),
          0
        );

        const autorizadas = facturas.filter(
          (f: any) => f.sri_estado === "AUTORIZADO" || f.estado === "AUTORIZADO"
        ).length;

        const pendientes = facturas.filter(
          (f: any) => f.sri_estado === "PENDIENTE" || f.estado === "PENDIENTE" || f.estado === "CREADA"
        ).length;

        setKpis({
          totalMes,
          facturasAutorizadas: autorizadas,
          facturasPendientes: pendientes,
          totalClientes: clientes.length,
          ivaRecaudado,
        });
      })
      .catch(() => setKpis(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 animate-pulse">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl" />
            <div className="mt-5 space-y-2">
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
              <div className="h-7 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const totalMesStr = kpis
    ? `$${kpis.totalMes.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "$0.00";

  const ivaStr = kpis
    ? `$${kpis.ivaRecaudado.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "$0.00";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* Total facturado del mes */}
      <MetricCard
        icon={<svg className="w-6 h-6 text-brand-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        label="Facturado este Mes"
        value={totalMesStr}
        sub={`IVA recaudado: ${ivaStr}`}
        color="success"
      />

      {/* Total de clientes */}
      <MetricCard
        icon={<GroupIcon className="text-brand-500 size-6" />}
        label="Clientes Registrados"
        value={kpis ? String(kpis.totalClientes) : "—"}
        sub="Base de clientes activa"
      />

      {/* Facturas autorizadas */}
      <MetricCard
        icon={<svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        label="Facturas Autorizadas"
        value={kpis ? String(kpis.facturasAutorizadas) : "—"}
        sub="Confirmadas por el SRI"
        color="success"
      />

      {/* Facturas pendientes */}
      <MetricCard
        icon={<BoxIconLine className="text-amber-500 size-6" />}
        label="Facturas Pendientes"
        value={kpis ? String(kpis.facturasPendientes) : "—"}
        sub="Esperando autorización SRI"
      />
    </div>
  );
}
