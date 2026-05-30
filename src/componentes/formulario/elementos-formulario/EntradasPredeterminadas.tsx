/**
 * COMPONENTE: EntradasPredeterminadas (Formulario de Registro de Productos)
 * PROPÓSITO: Formulario para registrar nuevos productos/servicios en el catálogo POS.
 *
 * Campos obligatorios SRI:
 *  - codigoPrincipal: Auto-generado (hasta 25 chars). El usuario puede sobreescribirlo.
 *  - descripcion: Nombre/detalle del bien o servicio (máx. 300 chars).
 *  - precioUnitario: Precio SIN IVA. Es la base imponible (hasta 6 decimales).
 *  - codigoPorcentaje: Tarifa de IVA ("4" = 15%, "0" = 0%).
 *
 * Refactorizado para:
 *  - Usar el hook usarCatalogoProductos (lógica extraída del componente)
 *  - Validación inline por campo (sin alert())
 *  - Vista previa de cálculo IVA en tiempo real
 */
import React, { useState } from "react";
import ComponentCard from "../../comunes/TarjetaComponente";
import Label from "../Etiqueta";
import Input from "../entrada/CampoEntrada";
import Select from "../Seleccion";
import Button from "../../ui/boton/Boton";
import { usarCatalogoProductos } from "../../../ganchos/usar-catalogo-productos";
import type { ErroresCampo } from "../../../tipos/tipos-sri";

interface EntradasPredeterminadasProps {
  /** Callback opcional que se llama tras registrar un producto exitosamente */
  onRegister?: () => void;
}

/** Opciones de tarifa de IVA disponibles en el catálogo SRI Ecuador */
const OPCIONES_IVA = [
  { value: "4", label: "15% IVA (Código 4) — Tarifa general vigente" },
  { value: "0", label: "0% IVA (Código 0) — Exento / No grava" },
  // { value: "2", label: "8% IVA (Código 2) — Tarifa transitoria Ley Solidaridad" },
];

export default function EntradasPredeterminadas({ onRegister }: EntradasPredeterminadasProps) {
  // ── Hook de catálogo: toda la lógica de negocio vive aquí ──────────────────
  const { registrarProducto, calcularVistaPrevia } = usarCatalogoProductos();

  // ── Estado local del formulario ────────────────────────────────────────────
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [codigoPorcentaje, setCodigoPorcentaje] = useState<"0" | "2" | "4">("4");

  // ── Estado de errores de validación por campo ──────────────────────────────
  const [errores, setErrores] = useState<ErroresCampo>({});

  // ── Estado de mensaje de éxito temporal ───────────────────────────────────
  const [mensajeExito, setMensajeExito] = useState("");

  // ── Vista previa de cálculo IVA (reactiva, sin setState) ──────────────────
  const precioNumerico = parseFloat(precio) || 0;
  const vistaPrevia = calcularVistaPrevia(precioNumerico, codigoPorcentaje);

  /** Limpia el error de un campo específico cuando el usuario empieza a escribir */
  const limpiarError = (campo: string) => {
    if (errores[campo]) {
      setErrores((prev) => ({ ...prev, [campo]: undefined }));
    }
  };

  /** Maneja el envío del formulario de registro */
  const handleRegistrar = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Delegar validación y persistencia al hook
    const erroresValidacion = registrarProducto({
      descripcion,
      precioUnitario: precio,
      codigoPorcentaje,
    });

    // Si hay errores, mostrarlos inline y detener
    if (Object.keys(erroresValidacion).length > 0) {
      setErrores(erroresValidacion);
      return;
    }

    // ── Éxito: mostrar mensaje temporal y limpiar formulario ──
    setMensajeExito(
      `Producto registrado — Base: $${vistaPrevia.base.toFixed(2)} + IVA ${(vistaPrevia.tasa * 100)}%: $${vistaPrevia.iva.toFixed(2)} = PVP: $${vistaPrevia.total.toFixed(2)}`
    );
    setDescripcion("");
    setPrecio("");
    setCodigoPorcentaje("4");
    setErrores({});

    // Notificar al componente padre para que recargue la lista
    onRegister?.();

    setTimeout(() => setMensajeExito(""), 8000);
  };

  return (
    <ComponentCard title="Registrar Nuevo Producto / Servicio (SRI)">
      <form onSubmit={handleRegistrar} className="space-y-5" noValidate>

        {/* ── DESCRIPCIÓN DEL PRODUCTO ── */}
        <div>
          <Label htmlFor="productoDescripcion">
            Descripción del Producto / Servicio *
          </Label>
          <Input
            type="text"
            id="productoDescripcion"
            value={descripcion}
            onChange={(e) => {
              setDescripcion(e.target.value.substring(0, 300));
              limpiarError("descripcion");
            }}
            placeholder="Ej. Mouse Inalámbrico Logitech M185"
            className={errores.descripcion ? "border-red-400 focus:border-red-500" : ""}
          />
          {/* Contador de caracteres + error inline */}
          <div className="mt-1 flex justify-between">
            <span className={`text-xs ${errores.descripcion ? "text-red-500 font-medium" : "text-gray-400 dark:text-gray-500"}`}>
              {errores.descripcion || `${descripcion.length}/300 caracteres`}
            </span>
          </div>
        </div>

        {/* ── PRECIO UNITARIO SIN IVA (BASE IMPONIBLE SRI) ── */}
        <div>
          <Label htmlFor="productoPrecio">
            Precio Unitario (USD) — SIN IVA (Base Imponible SRI) *
          </Label>
          <div className="relative">
            <Input
              type="number"
              step={0.000001}
              min={0.000001}
              id="productoPrecio"
              placeholder="0.000000"
              className={`pl-[62px] ${errores.precioUnitario ? "border-red-400 focus:border-red-500" : ""}`}
              value={precio}
              onChange={(e) => {
                setPrecio(e.target.value);
                limpiarError("precioUnitario");
              }}
            />
            {/* Prefijo $ decorativo */}
            <span className="absolute left-0 top-1/2 flex h-11 w-[46px] -translate-y-1/2 items-center justify-center border-r border-gray-200 dark:border-gray-700 pointer-events-none">
              <span className="text-gray-500 font-semibold text-sm">$</span>
            </span>
          </div>
          {errores.precioUnitario ? (
            <p className="mt-1 text-xs text-red-500 font-medium">{errores.precioUnitario}</p>
          ) : (
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Ingrese el precio SIN IVA (base imponible). El SRI acepta hasta 6 decimales.
            </p>
          )}
        </div>

        {/* ── TARIFA DE IVA (codigoPorcentaje SRI) ── */}
        <div>
          <Label>Tarifa de IVA (codigoPorcentaje SRI) *</Label>
          <Select
            options={OPCIONES_IVA}
            placeholder="Seleccione la tarifa de IVA"
            onChange={(v: any) => {
              setCodigoPorcentaje(v as "0" | "2" | "4");
              limpiarError("codigoPorcentaje");
            }}
            defaultValue="4"
          />
          {errores.codigoPorcentaje && (
            <p className="mt-1 text-xs text-red-500 font-medium">{errores.codigoPorcentaje}</p>
          )}
        </div>

        {/* ── VISTA PREVIA DEL CÁLCULO (solo si hay precio) ── */}
        {precioNumerico > 0 && (
          <div className="p-4 rounded-xl border border-gray-200 dark:border-white/[0.05] bg-gray-50 dark:bg-white/[0.02]">
            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Vista Previa del Cálculo SRI
            </h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="border-r border-gray-200 dark:border-white/[0.05]">
                <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Base Imponible
                </span>
                <span className="text-lg font-bold text-gray-800 dark:text-white/90">
                  ${vistaPrevia.base.toFixed(2)}
                </span>
              </div>
              <div className="border-r border-gray-200 dark:border-white/[0.05]">
                <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  IVA ({(vistaPrevia.tasa * 100).toFixed(0)}%)
                </span>
                <span className="text-lg font-bold text-gray-800 dark:text-white/90">
                  ${vistaPrevia.iva.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  PVP (con IVA)
                </span>
                <span className="text-lg font-bold text-brand-500 dark:text-brand-400">
                  ${vistaPrevia.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── MENSAJE DE ÉXITO ── */}
        {mensajeExito && (
          <div className="p-3 text-sm text-green-700 bg-green-50 dark:bg-green-800/10 rounded-lg dark:text-green-400 flex items-start gap-2.5 border border-green-200 dark:border-green-800/30">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{mensajeExito}</span>
          </div>
        )}

        {/* ── BOTÓN DE REGISTRO ── */}
        <div className="pt-1">
          <Button type="submit" className="w-full justify-center">
            Registrar en Catálogo POS
          </Button>
        </div>
      </form>
    </ComponentCard>
  );
}
