import { useState } from "react";
import { useModal } from "../../ganchos/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/boton/Boton";
import Input from "../formulario/entrada/CampoEntrada";
import Label from "../formulario/Etiqueta";
import Select from "../formulario/Seleccion";
import { usarEmisor } from "../../ganchos/usar-emisor";

export default function UserInfoCard() {
  const { emisor, guardarEmisor } = usarEmisor();
  const { isOpen, openModal, closeModal } = useModal();

  // ── Estado local para el formulario de edición ──
  const [razonSocial, setRazonSocial] = useState(emisor.razonSocial);
  const [ruc, setRuc] = useState(emisor.ruc);
  const [correo, setCorreo] = useState(emisor.correo);
  const [telefono, setTelefono] = useState(emisor.telefono);
  const [obligadoContabilidad, setObligadoContabilidad] = useState(emisor.obligadoContabilidad);
  const [errores, setErrores] = useState<Record<string, string>>({});

  // Abrir modal e inicializar estado local con valores actuales
  const handleOpen = () => {
    setRazonSocial(emisor.razonSocial);
    setRuc(emisor.ruc);
    setCorreo(emisor.correo);
    setTelefono(emisor.telefono);
    setObligadoContabilidad(emisor.obligadoContabilidad);
    setErrores({});
    openModal();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrores({});

    const resultado = guardarEmisor({
      razonSocial: razonSocial.trim(),
      ruc: ruc.trim(),
      correo: correo.trim(),
      telefono: telefono.trim(),
      obligadoContabilidad,
    });

    if (resultado.exito) {
      closeModal();
    } else {
      setErrores(resultado.errores);
    }
  };

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h4 className="text-lg font-bold text-gray-800 dark:text-white lg:mb-6">
              Información Fiscal del Emisor
            </h4>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div>
                <p className="mb-1 text-xs font-semibold text-gray-400 dark:text-gray-500">
                  Razón Social / Propietario
                </p>
                <p className="text-sm font-bold text-gray-800 dark:text-white/90">
                  {emisor.razonSocial}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold text-gray-400 dark:text-gray-500">
                  RUC del Emisor
                </p>
                <p className="text-sm font-mono font-bold text-gray-800 dark:text-white/90">
                  {emisor.ruc}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold text-gray-400 dark:text-gray-500">
                  Correo Electrónico (Notificaciones)
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {emisor.correo}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold text-gray-400 dark:text-gray-500">
                  Teléfono de Contacto
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {emisor.telefono}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold text-gray-400 dark:text-gray-500">
                  Obligado a llevar Contabilidad
                </p>
                <span className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-md text-xs font-bold ${
                  emisor.obligadoContabilidad === "SI"
                    ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                }`}>
                  {emisor.obligadoContabilidad}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleOpen}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
            </svg>
            Editar
          </button>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[650px] m-4">
        <div className="no-scrollbar relative w-full max-w-[650px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-10">
          <div className="pr-10 border-b dark:border-gray-800 pb-3 mb-5">
            <h4 className="text-xl font-bold text-gray-800 dark:text-white">
              Editar Datos Fiscales del Emisor
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Estos campos se registrarán en la firma digital y en los XMLs de comprobantes electrónicos autorizados por el SRI.
            </p>
          </div>
          
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div>
              <Label>Nombre o Razón Social Legal *</Label>
              <Input
                type="text"
                value={razonSocial}
                onChange={(e: any) => setRazonSocial(e.target.value)}
                placeholder="Ej: DISTRIBUIDORA COMERCIAL ALFA S.A."
                className="w-full"
              />
              {errores.razonSocial && (
                <p className="text-xs text-red-500 font-semibold mt-1">{errores.razonSocial}</p>
              )}
            </div>

            <div>
              <Label>Número de RUC (13 dígitos) *</Label>
              <Input
                type="text"
                value={ruc}
                onChange={(e: any) => setRuc(e.target.value)}
                placeholder="Ej: 1791234567001"
                className="w-full font-mono"
              />
              {errores.ruc && (
                <p className="text-xs text-red-500 font-semibold mt-1">{errores.ruc}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Correo de Notificaciones *</Label>
                <Input
                  type="email"
                  value={correo}
                  onChange={(e: any) => setCorreo(e.target.value)}
                  placeholder="Ej: contabilidad@alfa.com"
                  className="w-full"
                />
                {errores.correo && (
                  <p className="text-xs text-red-500 font-semibold mt-1">{errores.correo}</p>
                )}
              </div>

              <div>
                <Label>Teléfono de Contacto</Label>
                <Input
                  type="text"
                  value={telefono}
                  onChange={(e: any) => setTelefono(e.target.value)}
                  placeholder="Ej: +593 2 3456789"
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <Label>¿Obligado a llevar Contabilidad? *</Label>
              <Select
                options={[
                  { value: "NO", label: "NO" },
                  { value: "SI", label: "SÍ" },
                ]}
                onChange={(v) => setObligadoContabilidad(v as "SI" | "NO")}
                defaultValue={obligadoContabilidad}
              />
            </div>

            <div className="flex items-center justify-end gap-3 border-t dark:border-gray-800 pt-5 mt-4">
              <Button size="sm" variant="outline" type="button" onClick={closeModal} className="rounded-xl">
                Cancelar
              </Button>
              <Button size="sm" type="submit" className="rounded-xl bg-brand-500 text-white hover:bg-brand-600">
                Guardar Cambios
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
