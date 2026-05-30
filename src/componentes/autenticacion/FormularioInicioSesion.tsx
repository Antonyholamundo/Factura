/**
 * COMPONENTE: FormularioInicioSesion
 * PROPÓSITO: Formulario de login funcional que se conecta con POST /auth
 * de la API del SRI para obtener el JWT.
 */
import { useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../iconos";
import Label from "../formulario/Etiqueta";
import Input from "../formulario/entrada/CampoEntrada";
import Checkbox from "../formulario/entrada/Casilla";
import Button from "../ui/boton/Boton";
import { useAuth } from "../../contexto/ContextoAuth";

export default function SignInForm() {
  const { login, cargando, error, limpiarError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [apiOffline, setApiOffline] = useState(false);

  // Destino después del login exitoso
  const from = (location.state as any)?.from?.pathname || "/";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    limpiarError();
    setApiOffline(false);

    if (!email.trim() || !password.trim()) return;

    const exito = await login(email.trim(), password);

    if (exito) {
      navigate(from, { replace: true });
    } else {
      // Detectar si el error es de conexión
      if (error?.includes("No se pudo conectar")) {
        setApiOffline(true);
      }
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Volver al inicio
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Iniciar Sesión
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ingrese su correo y contraseña para acceder al sistema de
              facturación electrónica.
            </p>
          </div>

          {/* ── Indicador de API offline ── */}
          {apiOffline && (
            <div className="p-4 mb-5 text-sm border rounded-lg bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-amber-600 dark:text-amber-400">⚠️</span>
                <span className="font-semibold text-amber-800 dark:text-amber-300">
                  API no disponible
                </span>
              </div>
              <p className="text-amber-700 dark:text-amber-400">
                No se pudo conectar con el servidor en{" "}
                <code className="px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-800/40">
                  localhost:3000
                </code>
                . Asegúrese de que la API del SRI esté corriendo.
              </p>
            </div>
          )}

          {/* ── Error de autenticación ── */}
          {error && !apiOffline && (
            <div className="p-4 mb-5 text-sm border rounded-lg bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700">
              <div className="flex items-center gap-2">
                <span className="text-red-600 dark:text-red-400">✕</span>
                <span className="text-red-800 dark:text-red-300">{error}</span>
              </div>
            </div>
          )}

          <div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Correo Electrónico{" "}
                    <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    placeholder="admin@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={cargando}
                  />
                </div>
                <div>
                  <Label>
                    Contraseña <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Ingrese su contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={cargando}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Mantener sesión
                    </span>
                  </div>
                </div>
                <div>
                  <Button
                    type="submit"
                    className="w-full"
                    size="sm"
                    disabled={cargando || !email.trim() || !password.trim()}
                  >
                    {cargando ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="w-4 h-4 animate-spin"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Autenticando...
                      </span>
                    ) : (
                      "Iniciar Sesión"
                    )}
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                ¿No tiene una cuenta?{" "}
                <Link
                  to="/signup"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Registrarse
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
