import PageMeta from "../../componentes/comunes/MetaPagina";
import AuthLayout from "./DisposicionPaginaAuth";
import SignInForm from "../../componentes/autenticacion/FormularioInicioSesion";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="React.js SignIn Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js SignIn Tables Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
