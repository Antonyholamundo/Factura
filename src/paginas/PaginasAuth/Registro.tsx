import PageMeta from "../../componentes/comunes/MetaPagina";
import AuthLayout from "./DisposicionPaginaAuth";
import SignUpForm from "../../componentes/autenticacion/FormularioRegistro";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="React.js SignUp Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js SignUp Tables Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
