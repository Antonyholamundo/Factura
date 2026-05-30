/**
 * HOOK: usarCatalogoProductos
 * PROPÓSITO: Encapsula toda la lógica de negocio del CRUD de productos
 * del catálogo POS. Separa completamente la lógica del JSX de presentación.
 *
 * Funciones expuestas:
 *  - productos: estado actual del catálogo
 *  - registrarProducto: valida y persiste un nuevo producto en localStorage
 *  - eliminarProducto: elimina por codigoPrincipal
 *  - recargarProductos: sincroniza estado con localStorage
 */
import { useState, useEffect, useCallback } from "react";
import type { SriProducto, ErroresCampo } from "../tipos/tipos-sri";
import {
  validarProducto,
  generarCodigoPrincipal,
  calcularTasaIva,
} from "../utilidades/validaciones-sri";

// ─────────────────────────────────────────────────────────────────────────────
// CLAVE DE ALMACENAMIENTO EN localStorage
// Centralizada para evitar inconsistencias entre componentes.
// ─────────────────────────────────────────────────────────────────────────────
const STORAGE_KEY = "pos_products";

// ─────────────────────────────────────────────────────────────────────────────
// CATÁLOGO SEMILLA (seed data)
// Se utiliza solo cuando no existe ningún dato en localStorage.
// Representa productos típicos del mercado ecuatoriano.
// ─────────────────────────────────────────────────────────────────────────────
const PRODUCTOS_SEMILLA: SriProducto[] = [
  {
    codigoPrincipal: "PROD-CAFE001",
    descripcion: "Café de Loja Premium",
    precioUnitario: 5.65,
    codigoPorcentaje: "4", // IVA 15% — producto de consumo general
  },
  {
    codigoPrincipal: "PROD-CHOC002",
    descripcion: "Chocolate Pacari Organic",
    precioUnitario: 4.17,
    codigoPorcentaje: "4", // IVA 15%
  },
  {
    codigoPrincipal: "PROD-SOMB003",
    descripcion: "Sombrero de Paja Toquilla",
    precioUnitario: 39.13,
    codigoPorcentaje: "4", // IVA 15% — artesanía
  },
  {
    codigoPrincipal: "PROD-CONS004",
    descripcion: "Consultoría Tributaria (hora)",
    precioUnitario: 50.0,
    codigoPorcentaje: "0", // IVA 0% — servicios profesionales exentos
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// INTERFAZ DE RETORNO DEL HOOK
// ─────────────────────────────────────────────────────────────────────────────
export interface UsarCatalogoProductosRetorno {
  /** Lista actual del catálogo de productos */
  productos: SriProducto[];

  /**
   * Registra un nuevo producto en el catálogo.
   * @returns objeto de errores de validación (vacío si todo es válido y se guardó)
   */
  registrarProducto: (datos: {
    descripcion: string;
    precioUnitario: string;
    codigoPorcentaje: "0" | "2" | "4";
    codigoPrincipalManual?: string; // Opcional: si vacío, se autogenera
  }) => ErroresCampo;

  /**
   * Elimina un producto del catálogo por su codigoPrincipal.
   * @returns true si se eliminó, false si no se encontró
   */
  eliminarProducto: (codigoPrincipal: string) => boolean;

  /** Fuerza recarga desde localStorage (útil tras eventos externos) */
  recargarProductos: () => void;

  /**
   * Calcula la vista previa de precios para el formulario de registro.
   * No modifica estado — es una función de cálculo pura.
   */
  calcularVistaPrevia: (precioBase: number, codigoPorcentaje: string) => {
    base: number;
    iva: number;
    total: number;
    tasa: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIÓN AUXILIAR: Normaliza un array raw del localStorage al tipo SriProducto.
// Maneja datos legacy (campos "code", "label", "price") de versiones anteriores.
// ─────────────────────────────────────────────────────────────────────────────
function normalizarProductos(raw: any[]): SriProducto[] {
  return raw.map((p) => ({
    codigoPrincipal: p.codigoPrincipal || p.code || p.value || generarCodigoPrincipal(),
    descripcion: p.descripcion || p.label || p.description || "Sin descripción",
    precioUnitario:
      typeof p.precioUnitario === "number"
        ? p.precioUnitario
        : typeof p.price === "number"
        ? p.price
        : 0,
    codigoPorcentaje: (["0", "2", "4"].includes(p.codigoPorcentaje)
      ? p.codigoPorcentaje
      : "4") as "0" | "2" | "4",
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export function usarCatalogoProductos(): UsarCatalogoProductosRetorno {
  const [productos, setProductos] = useState<SriProducto[]>([]);

  // ── CARGA INICIAL desde localStorage ──────────────────────────────────────
  const recargarProductos = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setProductos(normalizarProductos(parsed));
      } else {
        // Primera ejecución: cargar datos semilla
        localStorage.setItem(STORAGE_KEY, JSON.stringify(PRODUCTOS_SEMILLA));
        setProductos(PRODUCTOS_SEMILLA);
      }
    } catch {
      // Si el JSON está corrupto, usar semilla como fallback seguro
      localStorage.setItem(STORAGE_KEY, JSON.stringify(PRODUCTOS_SEMILLA));
      setProductos(PRODUCTOS_SEMILLA);
    }
  }, []);

  useEffect(() => {
    recargarProductos();
  }, [recargarProductos]);

  // ── REGISTRAR NUEVO PRODUCTO ───────────────────────────────────────────────
  const registrarProducto = useCallback(
    (datos: {
      descripcion: string;
      precioUnitario: string;
      codigoPorcentaje: "0" | "2" | "4";
      codigoPrincipalManual?: string;
    }): ErroresCampo => {
      // Preparar el objeto preliminar para validar
      const codigoPrincipal = datos.codigoPrincipalManual?.trim() || generarCodigoPrincipal();
      const precioUnitario = parseFloat(parseFloat(datos.precioUnitario).toFixed(6));

      const productoNuevo: SriProducto = {
        codigoPrincipal,
        descripcion: datos.descripcion.trim(),
        precioUnitario,
        codigoPorcentaje: datos.codigoPorcentaje,
      };

      // Ejecutar validaciones SRI
      const errores = validarProducto(productoNuevo);
      if (Object.keys(errores).length > 0) {
        return errores; // Retornar errores sin guardar
      }

      // Verificar duplicado de codigoPrincipal (debe ser único en el catálogo)
      const stored = localStorage.getItem(STORAGE_KEY);
      const listaActual: any[] = stored ? JSON.parse(stored) : [];
      const esDuplicado = listaActual.some(
        (p: any) =>
          (p.codigoPrincipal || p.code || "") === codigoPrincipal
      );
      if (esDuplicado) {
        return { codigoPrincipal: "Este código ya existe en el catálogo. Use un código diferente." };
      }

      // Persistir en localStorage
      const listaActualizada = [productoNuevo, ...listaActual];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(listaActualizada));

      // Actualizar estado React inmediatamente (sin esperar recargar)
      setProductos(normalizarProductos(listaActualizada));

      return {}; // Objeto vacío = sin errores = éxito
    },
    []
  );

  // ── ELIMINAR PRODUCTO ──────────────────────────────────────────────────────
  const eliminarProducto = useCallback((codigoPrincipal: string): boolean => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return false;

      const lista = JSON.parse(stored);
      const listaFiltrada = lista.filter(
        (p: any) =>
          (p.codigoPrincipal || p.code || p.value || "") !== codigoPrincipal
      );

      if (listaFiltrada.length === lista.length) return false; // No encontrado

      localStorage.setItem(STORAGE_KEY, JSON.stringify(listaFiltrada));
      setProductos(normalizarProductos(listaFiltrada));
      return true;
    } catch {
      return false;
    }
  }, []);

  // ── CALCULAR VISTA PREVIA (función pura, sin side effects) ────────────────
  const calcularVistaPrevia = useCallback(
    (precioBase: number, codigoPorcentaje: string) => {
      const tasa = calcularTasaIva(codigoPorcentaje);
      const iva = precioBase * tasa;
      return {
        base: precioBase,
        iva,
        total: precioBase + iva,
        tasa,
      };
    },
    []
  );

  return {
    productos,
    registrarProducto,
    eliminarProducto,
    recargarProductos,
    calcularVistaPrevia,
  };
}
