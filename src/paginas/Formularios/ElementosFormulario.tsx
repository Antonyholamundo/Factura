import PageBreadcrumb from "../../componentes/comunes/MigasPagina";
import DefaultInputs from "../../componentes/formulario/elementos-formulario/EntradasPredeterminadas";
import PageMeta from "../../componentes/comunes/MetaPagina";

export default function FormElements() {
  return (
    <div>
      <PageMeta
        title="Registro de Productos | Inventario POS SRI"
        description="Página de registro e inventario de productos y servicios para facturación electrónica del SRI."
      />
      <PageBreadcrumb pageTitle="Registro de Productos POS" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <DefaultInputs />
        </div>
      </div>
    </div>
  );
}
