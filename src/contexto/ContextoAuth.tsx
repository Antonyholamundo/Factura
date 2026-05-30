/**
 * CONTEXTO: ContextoAuth
 * PROPÓSITO: Provee el estado de autenticación (JWT, usuario, empresa)
 * a toda la aplicación React. Gestiona login, logout, y verificación
 * de sesión activa.
 */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  iniciarSesion,
  registrarUsuario,
  cerrarSesion as limpiarStorage,
  estaAutenticado as verificarToken,
  obtenerUsuario,
  obtenerEmpresa,
  type ApiAuthResponse,
  type ApiError,
} from "../servicios/api-sri";

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────

interface AuthUsuario {
  id: string;
  email: string;
}

interface AuthEmpresa {
  id: string;
  ruc: string;
  razon_social: string;
  nombre_comercial: string;
}

interface AuthState {
  /** Indica si el usuario está autenticado y el JWT es válido */
  autenticado: boolean;
  /** Datos del usuario activo */
  usuario: AuthUsuario | null;
  /** Datos de la empresa asociada al usuario */
  empresa: AuthEmpresa | null;
  /** Indica si se está realizando una operación de auth */
  cargando: boolean;
  /** Mensaje de error de la última operación */
  error: string | null;
}

interface AuthContexto extends AuthState {
  /** Inicia sesión con email y contraseña */
  login: (email: string, password: string) => Promise<boolean>;
  /** Registra un nuevo usuario y empresa */
  registro: (datos: RegistroDatos) => Promise<boolean>;
  /** Cierra la sesión y limpia el almacenamiento */
  logout: () => void;
  /** Limpia el error actual */
  limpiarError: () => void;
}

export interface RegistroDatos {
  email: string;
  password: string;
  masterKey?: string;
  invitationCode?: string;
  ruc: string;
  razon_social: string;
  nombre_comercial?: string;
  direccion?: string;
  telefono?: string;
  codigo_establecimiento?: string;
  punto_emision?: string;
  tipo_ambiente?: number;
  certificate: string;
  certificate_password: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXTO
// ─────────────────────────────────────────────────────────────────────────────

const AuthCtx = createContext<AuthContexto | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// PROVEEDOR
// ─────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => ({
    autenticado: verificarToken(),
    usuario: obtenerUsuario(),
    empresa: obtenerEmpresa(),
    cargando: false,
    error: null,
  }));

  // Escuchar eventos de expiración del token (disparados por el servicio API)
  useEffect(() => {
    const handleExpired = () => {
      setState({
        autenticado: false,
        usuario: null,
        empresa: null,
        cargando: false,
        error: "Su sesión ha expirado. Inicie sesión nuevamente.",
      });
    };

    window.addEventListener("sri_auth_expired", handleExpired);
    return () => window.removeEventListener("sri_auth_expired", handleExpired);
  }, []);

  // Login
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setState((prev) => ({ ...prev, cargando: true, error: null }));

    try {
      const resp: ApiAuthResponse = await iniciarSesion(email, password);
      setState({
        autenticado: true,
        usuario: resp.user,
        empresa: resp.company,
        cargando: false,
        error: null,
      });
      return true;
    } catch (err: any) {
      const apiErr = err as ApiError;
      setState((prev) => ({
        ...prev,
        autenticado: false,
        cargando: false,
        error: apiErr.message || "Error al iniciar sesión",
      }));
      return false;
    }
  }, []);

  // Registro
  const registro = useCallback(async (datos: RegistroDatos): Promise<boolean> => {
    setState((prev) => ({ ...prev, cargando: true, error: null }));

    try {
      const resp: ApiAuthResponse = await registrarUsuario(datos);
      setState({
        autenticado: true,
        usuario: resp.user,
        empresa: resp.company,
        cargando: false,
        error: null,
      });
      return true;
    } catch (err: any) {
      const apiErr = err as ApiError;
      setState((prev) => ({
        ...prev,
        autenticado: false,
        cargando: false,
        error: apiErr.message || "Error al registrarse",
      }));
      return false;
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    limpiarStorage();
    setState({
      autenticado: false,
      usuario: null,
      empresa: null,
      cargando: false,
      error: null,
    });
  }, []);

  // Limpiar error
  const limpiarError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return (
    <AuthCtx.Provider
      value={{
        ...state,
        login,
        registro,
        logout,
        limpiarError,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK DE CONSUMO
// ─────────────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContexto {
  const ctx = useContext(AuthCtx);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de un <AuthProvider>");
  }
  return ctx;
}
