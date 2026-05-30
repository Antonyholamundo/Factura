import { useState } from "react";
import { useModal } from "../../ganchos/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/boton/Boton";
import Input from "../formulario/entrada/CampoEntrada";
import Label from "../formulario/Etiqueta";
import { usarEmisor } from "../../ganchos/usar-emisor";

export default function UserAddressCard() {
  const { emisor, guardarEmisor } = usarEmisor();
  const { isOpen, openModal, closeModal } = useModal();

  // ── Estado local para el formulario de edición ──
  const [dirMatriz, setDirMatriz] = useState(emisor.dirMatriz);
  const [dirEstablecimiento, setDirEstablecimiento] = useState(emisor.dirEstablecimiento);
  const [estab, setEstab] = useState(emisor.estab);
  const [ptoEmi, setPtoEmi] = useState(emisor.ptoEmi);
  const [firmaNombre, setFirmaNombre] = useState(emisor.firmaNombre);
  const [firmaPassword, setFirmaPassword] = useState(emisor.firmaPassword || "");
  const [errores, setErrores] = useState<Record<string, string>>({});

  // Abrir modal e inicializar estado local
  const handleOpen = () => {
    setDirMatriz(emisor.dirMatriz);
    setDirEstablecimiento(emisor.dirEstablecimiento);
    setEstab(emisor.estab);
    setPtoEmi(emisor.ptoEmi);
    setFirmaNombre(emisor.firmaNombre);
    setFirmaPassword(emisor.firmaPassword || "");
    setErrores({});
    openModal();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrores({});

    const resultado = guardarEmisor({
      dirMatriz: dirMatriz.trim(),
      dirEstablecimiento: dirEstablecimiento.trim(),
      estab: estab.trim(),
      ptoEmi: ptoEmi.trim(),
      firmaNombre: firmaNombre.trim() || "firma_pruebas_sri.p12",
      firmaPassword: firmaPassword.trim(),
    });

    if (resultado.exito) {
      closeModal();
    } else {
      setErrores(resultado.errores);
    }
  };

  // Simulación de uploader de archivo .p12
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFirmaNombre(file.name);
    }
  };

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h4 className="text-lg font-bold text-gray-800 dark:text-white lg:mb-6">
              Infraestructura Fiscal y Firma Electrónica
            </h4>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div>
                <p className="mb-1 text-xs font-semibold text-gray-400 dark:text-gray-500">
                  Dirección Matriz
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {emisor.dirMatriz}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold text-gray-400 dark:text-gray-500">
                  Dirección del Establecimiento
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {emisor.dirEstablecimiento}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-1 text-xs font-semibold text-gray-400 dark:text-gray-500">
                    Establecimiento
                  </p>
                  <p className="text-sm font-mono font-bold text-gray-800 dark:text-white/90">
                    {emisor.estab}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold text-gray-400 dark:text-gray-500">
                    Punto de Emisión
                  </p>
                  <p className="text-sm font-mono font-bold text-gray-800 dark:text-white/90">
                    {emisor.ptoEmi}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold text-gray-400 dark:text-gray-500">
                  Certificado de Firma Electrónica (.p12)
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                  <span className="text-sm font-mono font-semibold text-gray-800 dark:text-white">
                    {emisor.firmaNombre}
                  </span>
                  {emisor.firmaPassword && (
                    <span className="text-xs text-gray-400">(Protegido con clave)</span>
                  )}
                </div>
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
        <div className="relative w-full p-6 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-10">
          <div className="pr-10 border-b dark:border-gray-800 pb-3 mb-5">
            <h4 className="text-xl font-bold text-gray-800 dark:text-white">
              Editar Direcciones y Firma Digital
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Configure la ubicación de sucursales, códigos de caja e infraestructura criptográfica.
            </p>
          </div>

          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div>
              <Label>Dirección Casa Matriz *</Label>
              <Input
                type="text"
                value={dirMatriz}
                onChange={(e: any) => setDirMatriz(e.target.value)}
                placeholder="Ej: Av. de los Shyris N34-102 y Holanda, Quito"
                className="w-full"
              />
              {errores.dirMatriz && (
                <p className="text-xs text-red-500 font-semibold mt-1">{errores.dirMatriz}</p>
              )}
            </div>

            <div>
              <Label>Dirección del Establecimiento / Sucursal *</Label>
              <Input
                type="text"
                value={dirEstablecimiento}
                onChange={(e: any) => setDirEstablecimiento(e.target.value)}
                placeholder="Ej: Av. de los Shyris N34-102 y Holanda"
                className="w-full"
              />
              {errores.dirEstablecimiento && (
                <p className="text-xs text-red-500 font-semibold mt-1">{errores.dirEstablecimiento}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Código de Establecimiento (3 dígitos) *</Label>
                <Input
                  type="text"
                  maxLength={3}
                  value={estab}
                  onChange={(e: any) => setEstab(e.target.value)}
                  placeholder="Ej: 001"
                  className="w-full font-mono text-center"
                />
                {errores.estab && (
                  <p className="text-xs text-red-500 font-semibold mt-1">{errores.estab}</p>
                )}
              </div>

              <div>
                <Label>Código de Punto Emisión (3 dígitos) *</Label>
                <Input
                  type="text"
                  maxLength={3}
                  value={ptoEmi}
                  onChange={(e: any) => setPtoEmi(e.target.value)}
                  placeholder="Ej: 001"
                  className="w-full font-mono text-center"
                />
                {errores.ptoEmi && (
                  <p className="text-xs text-red-500 font-semibold mt-1">{errores.ptoEmi}</p>
                )}
              </div>
            </div>

            <div className="border-t dark:border-gray-800 pt-4 mt-2">
              <h5 className="text-sm font-bold text-gray-800 dark:text-white mb-3">
                Firma Electrónica (.p12)
              </h5>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                  <Label>Certificado de Firma Electrónica</Label>
                  <div className="relative mt-1">
                    <input
                      type="file"
                      accept=".p12,.pfx"
                      id="p12-uploader"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <label
                      htmlFor="p12-uploader"
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                      </svg>
                      {firmaNombre ? "Cambiar Archivo" : "Cargar Archivo .p12"}
                    </label>
                  </div>
                  {firmaNombre && (
                    <p className="text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400 mt-1.5 truncate">
                      ✓ Seleccionado: {firmaNombre}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Contraseña de Firma Electrónica</Label>
                  <Input
                    type="password"
                    value={firmaPassword}
                    onChange={(e: any) => setFirmaPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full"
                  />
                </div>
              </div>
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
