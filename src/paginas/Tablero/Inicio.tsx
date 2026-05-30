import EcommerceMetrics from "../../componentes/comercio/MetricasComercio";
import MonthlySalesChart from "../../componentes/comercio/GraficaVentasMensuales";
import StatisticsChart from "../../componentes/comercio/GraficaEstadisticas";
import PageMeta from "../../componentes/comunes/MetaPagina";

export default function Home() {
  return (
    <>
      <PageMeta
        title="Facturación Electrónica"
        description="Tablero de control de facturación electrónica"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <EcommerceMetrics />

          <MonthlySalesChart />
        </div>

        <div className="col-span-12">
          <StatisticsChart />
        </div>
      </div>
    </>
  );
}
