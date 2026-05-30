import { useState } from "react";
import { useModal } from "../../ganchos/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/boton/Boton";
import Input from "../formulario/entrada/CampoEntrada";
import Label from "../formulario/Etiqueta";
import Select from "../formulario/Seleccion";
import { usarEmisor } from "../../ganchos/usar-emisor";

export default function UserMetaCard() {
  const { emisor, guardarEmisor, restablecerSemilla } = usarEmisor();
  const { isOpen, openModal, closeModal } = useModal();

  // ── Estado local para el formulario de edición ──
  const [nombreComercial, setNombreComercial] = useState(emisor.nombreComercial);
  const [cargoRepresentante, setCargoRepresentante] = useState(emisor.cargoRepresentante);
  const [ambiente, setAmbiente] = useState(emisor.ambiente);
  const [regimen, setRegimen] = useState(emisor.regimen);
  const [contribuyenteEspecial, setContribuyenteEspecial] = useState(emisor.contribuyenteEspecial || "");
  const [errores, setErrores] = useState<Record<string, string>>({});

  // Abrir modal e inicializar estado local con valores actuales del hook
  const handleOpen = () => {
    setNombreComercial(emisor.nombreComercial);
    setCargoRepresentante(emisor.cargoRepresentante);
    setAmbiente(emisor.ambiente);
    setRegimen(emisor.regimen);
    setContribuyenteEspecial(emisor.contribuyenteEspecial || "");
    setErrores({});
    openModal();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrores({});

    // Validar nombre comercial
    if (!nombreComercial.trim()) {
      setErrores({ nombreComercial: "El nombre comercial es obligatorio." });
      return;
    }

    const resultado = guardarEmisor({
      nombreComercial: nombreComercial.trim(),
      cargoRepresentante: cargoRepresentante.trim() || "Representante Legal",
      ambiente,
      regimen,
      contribuyenteEspecial: regimen === "CONTRIBUYENTE-ESPECIAL" ? contribuyenteEspecial.trim() : "",
    });

    if (resultado.exito) {
      closeModal();
    } else {
      setErrores(resultado.errores);
    }
  };

  const handleRestablecer = () => {
    if (window.confirm("¿Está seguro de restablecer los datos del emisor al RUC de pruebas del SRI?")) {
      restablecerSemilla();
      closeModal();
    }
  };

  // Helper para formatear el texto del régimen
  const labelRegimen = (tipo: string) => {
    const mapa: Record<string, string> = {
      "RIMPE-EMPRENDEDOR": "RIMPE Emprendedor",
      "RIMPE-POPULAR": "RIMPE Negocio Popular",
      "REGIMEN-GENERAL": "Régimen General",
      "CONTRIBUYENTE-ESPECIAL": "Contribuyente Especial",
    };
    return mapa[tipo] || tipo;
  };

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            {/* Logo de la empresa o negocio */}
            <div className="w-20 h-20 overflow-hidden border border-brand-100 rounded-2xl dark:border-brand-950/20 bg-brand-50/50 dark:bg-brand-500/5 flex items-center justify-center flex-shrink-0 shadow-2xs">
              <svg className="w-10 h-10 text-brand-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615 3.001 3.001 0 0 0 3.758.615 3.001 3.001 0 0 0 3.758-.615 3.001 3.001 0 0 0 3.758.615m-15 0a3.001 3.001 0 0 0 3.75-.615m3.75.615V3.75m0 0H21M12 3.75v12.25" />
              </svg>
            </div>
            <div className="order-3 xl:order-2 text-center xl:text-left">
              <h4 className="mb-2 text-lg font-bold text-gray-800 dark:text-white/90">
                {emisor.nombreComercial}
              </h4>
              <div className="flex flex-col items-center gap-2 xl:flex-row xl:gap-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {emisor.cargoRepresentante}
                </p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                
                {/* Badge de Ambiente SRI */}
                {emisor.ambiente === "1" ? (
                  <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200 dark:border-blue-800/30">
                    Ambiente: PRUEBAS
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-200 dark:border-rose-800/30 animate-pulse">
                    Ambiente: PRODUCCIÓN
                  </span>
                )}

                {/* Badge de Régimen Impositivo */}
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-200 dark:border-amber-800/30">
                  {labelRegimen(emisor.regimen)}
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
            Editar Configuración
          </button>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[650px] m-4">
        <div className="no-scrollbar relative w-full max-w-[650px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-10">
          <div className="pr-10 border-b dark:border-gray-800 pb-3 mb-5">
            <h4 className="text-xl font-bold text-gray-800 dark:text-white">
              Editar Configuración de Emisión
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Configure las variables fiscales y de entorno para el envío de facturas al SRI.
            </p>
          </div>
          
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div>
              <Label>Nombre Comercial / Establecimiento *</Label>
              <Input
                type="text"
                value={nombreComercial}
                onChange={(e: any) => setNombreComercial(e.target.value)}
                placeholder="Ej: POS INTEGRADO SRI"
                className="w-full"
              />
              {errores.nombreComercial && (
                <p className="text-xs text-red-500 font-semibold mt-1">{errores.nombreComercial}</p>
              )}
            </div>

            <div>
              <Label>Cargo / Actividad Económica del Representante</Label>
              <Input
                type="text"
                value={cargoRepresentante}
                onChange={(e: any) => setCargoRepresentante(e.target.value)}
                placeholder="Ej: Representante Legal o Propietario"
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Ambiente SRI *</Label>
                <Select
                  options={[
                    { value: "1", label: "Pruebas (Entorno Seguro / Test)" },
                    { value: "2", label: "Producción (Comprobantes Reales / Fiscal)" },
                  ]}
                  onChange={(v) => setAmbiente(v as any)}
                  defaultValue={ambiente}
                />
              </div>

              <div>
                <Label>Régimen Impositivo *</Label>
                <Select
                  options={[
                    { value: "REGIMEN-GENERAL", label: "Régimen General" },
                    { value: "RIMPE-EMPRENDEDOR", label: "RIMPE Emprendedor" },
                    { value: "RIMPE-POPULAR", label: "RIMPE Negocio Popular" },
                    { value: "CONTRIBUYENTE-ESPECIAL", label: "Contribuyente Especial" },
                  ]}
                  onChange={(v) => setRegimen(v as any)}
                  defaultValue={regimen}
                />
              </div>
            </div>

            {regimen === "CONTRIBUYENTE-ESPECIAL" && (
              <div>
                <Label>Número de Resolución Contribuyente Especial *</Label>
                <Input
                  type="text"
                  value={contribuyenteEspecial}
                  onChange={(e: any) => setContribuyenteEspecial(e.target.value)}
                  placeholder="Ej: NAC-DNCRASC20-00000001"
                  className="w-full"
                />
              </div>
            )}

            <div className="flex items-center justify-between border-t dark:border-gray-800 pt-5 mt-4">
              {/* Botón Restablecer Semilla */}
              <button
                type="button"
                onClick={handleRestablecer}
                className="text-xs text-red-500 hover:text-red-600 font-bold border border-red-200 dark:border-red-950/40 hover:bg-red-50 dark:hover:bg-red-950/10 px-3.5 py-2.5 rounded-xl transition"
              >
                Cargar Semilla SRI
              </button>

              <div className="flex items-center gap-3">
                <Button size="sm" variant="outline" type="button" onClick={closeModal} className="rounded-xl">
                  Cancelar
                </Button>
                <Button size="sm" type="submit" className="rounded-xl bg-brand-500 text-white hover:bg-brand-600">
                  Guardar Configuración
                </Button>
              </div>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
