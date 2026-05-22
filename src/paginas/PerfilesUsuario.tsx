import PageBreadcrumb from "../componentes/comunes/MigasPagina";
import UserMetaCard from "../componentes/PerfilUsuario/TarjetaMetaUsuario";
import UserInfoCard from "../componentes/PerfilUsuario/TarjetaInfoUsuario";
import UserAddressCard from "../componentes/PerfilUsuario/TarjetaDireccionUsuario";
import PageMeta from "../componentes/comunes/MetaPagina";

export default function UserProfiles() {
  return (
    <>
      <PageMeta
        title="React.js Profile Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Profile Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Datos del Emisor" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Datos del Emisor
        </h3>
        <div className="space-y-6">
          <UserMetaCard />
          <UserInfoCard />
          <UserAddressCard />
        </div>
      </div>
    </>
  );
}
