import PageBreadcrumb from "../../componentes/comunes/MigasPagina";
import ResponsiveImage from "../../componentes/ui/imagenes/ImagenResponsiva";
import TwoColumnImageGrid from "../../componentes/ui/imagenes/GridImagenesDosColumnas";
import ThreeColumnImageGrid from "../../componentes/ui/imagenes/GridImagenesTresColumnas";
import ComponentCard from "../../componentes/comunes/TarjetaComponente";
import PageMeta from "../../componentes/comunes/MetaPagina";

export default function Images() {
  return (
    <>
      <PageMeta
        title="React.js Images Dashboard | TailAdmin - React.js Admin Dashboard Template"
        description="This is React.js Images page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Images" />
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Responsive image">
          <ResponsiveImage />
        </ComponentCard>
        <ComponentCard title="Image in 2 Grid">
          <TwoColumnImageGrid />
        </ComponentCard>
        <ComponentCard title="Image in 3 Grid">
          <ThreeColumnImageGrid />
        </ComponentCard>
      </div>
    </>
  );
}
