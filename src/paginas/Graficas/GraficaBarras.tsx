import PageBreadcrumb from "../../componentes/comunes/MigasPagina";
import ComponentCard from "../../componentes/comunes/TarjetaComponente";
import BarChartOne from "../../componentes/graficas/barras/GraficaBarrasUno";
import PageMeta from "../../componentes/comunes/MetaPagina";

export default function BarChart() {
  return (
    <div>
      <PageMeta
        title="React.js Chart Dashboard | TailAdmin - React.js Admin Dashboard Template"
        description="This is React.js Chart Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Bar Chart" />
      <div className="space-y-6">
        <ComponentCard title="Bar Chart 1">
          <BarChartOne />
        </ComponentCard>
      </div>
    </div>
  );
}
