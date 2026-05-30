/**
 * COMPONENTE: FormularioRegistro
 * PROPÓSITO: Formulario de registro funcional que se conecta con POST /register
 * de la API del SRI para crear usuario + empresa emisora + certificado digital.
 */
import { useState, useEffect, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../iconos";
import Label from "../formulario/Etiqueta";
import Input from "../formulario/entrada/CampoEntrada";
import Checkbox from "../formulario/entrada/Casilla";
import Button from "../ui/boton/Boton";
import { useAuth } from "../../contexto/ContextoAuth";
import { consultarEstadoSistema, type ApiStatusResponse } from "../../servicios/api-sri";

export default function SignUpForm() {
  const { registro, cargando, error, limpiarError } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [apiStatus, setApiStatus] = useState<ApiStatusResponse | null>(null);

  // Campos del formulario
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [masterKey, setMasterKey] = useState("");
  const [invitationCode, setInvitationCode] = useState("");
  const [ruc, setRuc] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [nombreComercial, setNombreComercial] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [certificateBase64, setCertificateBase64] = useState("");
  const [certificatePassword, setCertificatePassword] = useState("");
  const [certFileName, setCertFileName] = useState("");

  // Consultar el estado del sistema al montar
  useEffect(() => {
    consultarEstadoSistema()
      .then(setApiStatus)
      .catch(() => setApiStatus(null));
  }, []);

  // Manejo de subida del archivo .p12
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCertFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1] || "";
      setCertificateBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    limpiarError();

    if (!email.trim() || !password.trim() || !ruc.trim() || !razonSocial.trim()) return;
    if (!certificateBase64) return;
    if (!certificatePassword.trim()) return;

    const exito = await registro({
      email: email.trim(),
      password,
      masterKey: masterKey.trim() || undefined,
      invitationCode: invitationCode.trim() || undefined,
      ruc: ruc.trim(),
      razon_social: razonSocial.trim(),
      nombre_comercial: nombreComercial.trim() || undefined,
      direccion: direccion.trim() || undefined,
      telefono: telefono.trim() || undefined,
      certificate: certificateBase64,
      certificate_password: certificatePassword,
    });

    if (exito) {
      navigate("/", { replace: true });
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
      <div className="w-full max-w-md mx-auto mb-5 sm:pt-10">
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
              Registrar Empresa
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {apiStatus?.firstRegistration
                ? "Primer registro del sistema. Se requiere la clave maestra de administración."
                : "Complete los datos para registrar una nueva empresa emisora."}
            </p>
          </div>

          {/* ── Error de registro ── */}
          {error && (
            <div className="p-4 mb-5 text-sm border rounded-lg bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700">
              <div className="flex items-center gap-2">
                <span className="text-red-600 dark:text-red-400">✕</span>
                <span className="text-red-800 dark:text-red-300">{error}</span>
              </div>
            </div>
          )}

          <div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                {/* ── Seguridad: Master Key o Invitación ── */}
                {apiStatus?.masterKeyRequired && (
                  <div>
                    <Label>
                      Clave Maestra <span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="password"
                      placeholder="Clave maestra del sistema"
                      value={masterKey}
                      onChange={(e) => setMasterKey(e.target.value)}
                      disabled={cargando}
                    />
                  </div>
                )}

                {apiStatus?.requiresInvitation && (
                  <div>
                    <Label>Código de Invitación</Label>
                    <Input
                      type="text"
                      placeholder="INV2024001"
                      value={invitationCode}
                      onChange={(e) => setInvitationCode(e.target.value)}
                      disabled={cargando}
                    />
                  </div>
                )}

                {/* ── Datos de Acceso ── */}
                <div className="p-4 border rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    🔐 Datos de Acceso
                  </h3>
                  <div className="space-y-4">
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
                          placeholder="Contraseña segura"
                          type={showPassword ? "text" : "password"}
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
                  </div>
                </div>

                {/* ── Datos de la Empresa ── */}
                <div className="p-4 border rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    🏢 Datos de la Empresa
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <Label>
                          RUC <span className="text-error-500">*</span>
                        </Label>
                        <Input
                          type="text"
                          placeholder="1234567890001"
                          value={ruc}
                          onChange={(e) => setRuc(e.target.value)}
                          disabled={cargando}
                        />
                      </div>
                      <div>
                        <Label>Teléfono</Label>
                        <Input
                          type="text"
                          placeholder="0999999999"
                          value={telefono}
                          onChange={(e) => setTelefono(e.target.value)}
                          disabled={cargando}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>
                        Razón Social <span className="text-error-500">*</span>
                      </Label>
                      <Input
                        type="text"
                        placeholder="Empresa Ejemplo S.A."
                        value={razonSocial}
                        onChange={(e) => setRazonSocial(e.target.value)}
                        disabled={cargando}
                      />
                    </div>
                    <div>
                      <Label>Nombre Comercial</Label>
                      <Input
                        type="text"
                        placeholder="Nombre Comercial (opcional)"
                        value={nombreComercial}
                        onChange={(e) => setNombreComercial(e.target.value)}
                        disabled={cargando}
                      />
                    </div>
                    <div>
                      <Label>Dirección</Label>
                      <Input
                        type="text"
                        placeholder="Av. Principal 123, Ciudad"
                        value={direccion}
                        onChange={(e) => setDireccion(e.target.value)}
                        disabled={cargando}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Certificado Digital ── */}
                <div className="p-4 border rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    🔏 Certificado Digital (.p12)
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label>
                        Archivo .p12 <span className="text-error-500">*</span>
                      </Label>
                      <div className="relative">
                        <input
                          type="file"
                          accept=".p12,.pfx"
                          onChange={handleFileChange}
                          disabled={cargando}
                          className="block w-full text-sm text-gray-700 dark:text-gray-300
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-lg file:border-0
                            file:text-sm file:font-semibold
                            file:bg-brand-50 file:text-brand-600
                            hover:file:bg-brand-100
                            dark:file:bg-brand-900/30 dark:file:text-brand-400
                            cursor-pointer"
                        />
                        {certFileName && (
                          <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                            ✓ {certFileName} cargado
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label>
                        Contraseña del Certificado{" "}
                        <span className="text-error-500">*</span>
                      </Label>
                      <Input
                        type="password"
                        placeholder="Contraseña del archivo .p12"
                        value={certificatePassword}
                        onChange={(e) => setCertificatePassword(e.target.value)}
                        disabled={cargando}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Checkbox ── */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    className="w-5 h-5"
                    checked={isChecked}
                    onChange={setIsChecked}
                  />
                  <p className="inline-block font-normal text-gray-500 dark:text-gray-400">
                    Acepto que la información proporcionada es verídica y{" "}
                    <span className="text-gray-800 dark:text-white/90">
                      autorizo la emisión de comprobantes electrónicos
                    </span>{" "}
                    a nombre de esta empresa.
                  </p>
                </div>

                {/* ── Botón ── */}
                <div>
                  <Button
                    type="submit"
                    className="w-full"
                    size="sm"
                    disabled={
                      cargando ||
                      !isChecked ||
                      !email.trim() ||
                      !password.trim() ||
                      !ruc.trim() ||
                      !razonSocial.trim() ||
                      !certificateBase64 ||
                      !certificatePassword.trim()
                    }
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
                        Registrando...
                      </span>
                    ) : (
                      "Registrar Empresa"
                    )}
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-5 mb-10">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                ¿Ya tiene una cuenta?{" "}
                <Link
                  to="/signin"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Iniciar Sesión
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
