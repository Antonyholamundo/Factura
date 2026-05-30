/**
 * COMPONENTE: RutaProtegida
 * PROPÓSITO: Envuelve rutas que requieren autenticación.
 * Si el usuario no está autenticado, redirige a /signin.
 */
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../../contexto/ContextoAuth";

interface Props {
  children: React.ReactNode;
}

export default function RutaProtegida({ children }: Props) {
  const { autenticado } = useAuth();
  const location = useLocation();

  if (!autenticado) {
    // Guardar la URL a la que quería ir, para redirigir después del login
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
