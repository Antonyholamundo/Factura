import EcommerceMetrics from "../../componentes/comercio/MetricasComercio";
import MonthlySalesChart from "../../componentes/comercio/GraficaVentasMensuales";
import StatisticsChart from "../../componentes/comercio/GraficaEstadisticas";
import PageMeta from "../../componentes/comunes/MetaPagina";

export default function Home() {
  return (
    <>
      <PageMeta
        title="React.js Ecommerce Dashboard | TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
        description="This is React.js Ecommerce Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
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
