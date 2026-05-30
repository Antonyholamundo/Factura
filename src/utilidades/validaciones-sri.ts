/**
 * ARCHIVO: validaciones-sri.ts
 * PROPÓSITO: Funciones puras de validación tributaria para el SRI Ecuador.
 * Sin dependencias de React. Testeable de forma unitaria.
 *
 * Incluye:
 *  - Algoritmo de dígito verificador para Cédula y RUC ecuatoriano
 *  - Validación de email (RFC básico)
 *  - Generación y validación del codigoPrincipal
 *  - Mapeo código de tarifa → tasa IVA decimal
 */

import type { SriProducto, SriCliente, ErroresCampo } from "../tipos/tipos-sri";

// ─────────────────────────────────────────────────────────────────────────────
// MAPEO DE TARIFA IVA
// Retorna la tasa decimal según el codigoPorcentaje del SRI.
// ─────────────────────────────────────────────────────────────────────────────
export function calcularTasaIva(codigoPorcentaje: string): number {
  switch (codigoPorcentaje) {
    case "4": return 0.15;  // Tarifa general vigente Ecuador (mayo 2024)
    case "2": return 0.08;  // Tarifa transitoria (Ley Solidaridad 2024)
    case "0": return 0.00;  // Exento / No grava IVA
    default:  return 0.00;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERADOR DE CÓDIGO PRINCIPAL
// Auto-genera un SKU único conforme al límite de 25 caracteres del SRI.
// Formato: PROD-<timestamp-base36>-<random4> → máx. 25 chars alfanumérico.
// ─────────────────────────────────────────────────────────────────────────────
export function generarCodigoPrincipal(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PROD-${timestamp}-${random}`.substring(0, 25);
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDADOR DE EMAIL (formato básico RFC)
// ─────────────────────────────────────────────────────────────────────────────
export function validarEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
}

// ─────────────────────────────────────────────────────────────────────────────
// ALGORITMO DE DÍGITO VERIFICADOR — CÉDULA ECUATORIANA
// Módulo 10. Fuente: Registro Civil Ecuador / SRI.
// ─────────────────────────────────────────────────────────────────────────────
export function validarCedula(cedula: string): boolean {
  const numero = cedula.trim();

  // Debe tener exactamente 10 dígitos
  if (!/^\d{10}$/.test(numero)) return false;

  // Los dos primeros dígitos deben ser un código de provincia válido (01–24)
  const provincia = parseInt(numero.substring(0, 2), 10);
  if (provincia < 1 || provincia > 24) return false;

  // El tercer dígito debe ser menor a 6 (para personas naturales)
  const tercerDigito = parseInt(numero[2], 10);
  if (tercerDigito >= 6) return false;

  // Algoritmo de módulo 10
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let valor = parseInt(numero[i], 10) * coeficientes[i];
    if (valor >= 10) valor -= 9;
    suma += valor;
  }
  const residuo = suma % 10;
  const digitoVerificador = residuo === 0 ? 0 : 10 - residuo;

  return digitoVerificador === parseInt(numero[9], 10);
}

// ─────────────────────────────────────────────────────────────────────────────
// ALGORITMO DE DÍGITO VERIFICADOR — RUC PERSONA NATURAL (11 dígitos)
// Los 10 primeros corresponden a la cédula, los últimos 3 son el establecimiento.
// ─────────────────────────────────────────────────────────────────────────────
export function validarRucPersonaNatural(ruc: string): boolean {
  const numero = ruc.trim();
  if (!/^\d{13}$/.test(numero)) return false;

  // El establecimiento (dígitos 11-13) debe ser "001" como mínimo
  const establecimiento = parseInt(numero.substring(10, 13), 10);
  if (establecimiento < 1) return false;

  // Los primeros 10 dígitos son la cédula
  return validarCedula(numero.substring(0, 10));
}

// ─────────────────────────────────────────────────────────────────────────────
// ALGORITMO DE DÍGITO VERIFICADOR — RUC SOCIEDAD / EMPRESA (módulo 11)
// Aplica para RUC donde el tercer dígito es 9.
// ─────────────────────────────────────────────────────────────────────────────
export function validarRucSociedad(ruc: string): boolean {
  const numero = ruc.trim();
  if (!/^\d{13}$/.test(numero)) return false;

  const provincia = parseInt(numero.substring(0, 2), 10);
  if (provincia < 1 || provincia > 24) return false;

  // Tercer dígito debe ser 9 para sociedades privadas
  if (parseInt(numero[2], 10) !== 9) return false;

  const coeficientes = [4, 3, 2, 7, 6, 5, 4, 3, 2];
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    suma += parseInt(numero[i], 10) * coeficientes[i];
  }
  const residuo = suma % 11;
  const digitoVerificador = residuo === 0 ? 0 : 11 - residuo;

  return digitoVerificador === parseInt(numero[9], 10);
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDADOR UNIFICADO DE IDENTIFICACIÓN
// Llama al validador correcto según el tipo de documento SRI.
// ─────────────────────────────────────────────────────────────────────────────
export function validarIdentificacion(
  tipo: SriCliente["tipoIdentificacion"],
  valor: string
): { valido: boolean; mensaje: string } {
  const v = valor.trim();

  switch (tipo) {
    case "07": // Consumidor Final — siempre válido con el valor fijo SRI
      return { valido: true, mensaje: "" };

    case "05": // Cédula
      if (!validarCedula(v)) {
        return { valido: false, mensaje: "Cédula inválida. Debe tener 10 dígitos y dígito verificador correcto." };
      }
      return { valido: true, mensaje: "" };

    case "04": // RUC
      if (v.length !== 13) {
        return { valido: false, mensaje: "RUC debe tener exactamente 13 dígitos." };
      }
      // Detectar tipo: natural (3er dígito < 6) o sociedad (3er dígito = 9)
      const tercero = parseInt(v[2], 10);
      if (tercero < 6) {
        if (!validarRucPersonaNatural(v)) {
          return { valido: false, mensaje: "RUC de persona natural inválido (dígito verificador incorrecto)." };
        }
      } else if (tercero === 9) {
        if (!validarRucSociedad(v)) {
          return { valido: false, mensaje: "RUC de sociedad inválido (dígito verificador incorrecto)." };
        }
      } else {
        return { valido: false, mensaje: "RUC inválido. El tercer dígito no corresponde a ninguna categoría conocida." };
      }
      return { valido: true, mensaje: "" };

    case "06": // Pasaporte — validación básica (no vacío, máx 20 chars)
      if (v.length < 3 || v.length > 20) {
        return { valido: false, mensaje: "Pasaporte inválido. Debe tener entre 3 y 20 caracteres." };
      }
      return { valido: true, mensaje: "" };

    default:
      return { valido: false, mensaje: "Tipo de identificación no reconocido." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDADOR COMPLETO DE PRODUCTO (campos obligatorios SRI)
// Retorna un objeto de errores por campo. Si está vacío, el producto es válido.
// ─────────────────────────────────────────────────────────────────────────────
export function validarProducto(datos: Partial<SriProducto>): ErroresCampo {
  const errores: ErroresCampo = {};

  // codigoPrincipal: obligatorio, máx 25 chars, sin espacios al inicio/fin
  if (!datos.codigoPrincipal?.trim()) {
    errores.codigoPrincipal = "El código principal es obligatorio (campo SRI).";
  } else if (datos.codigoPrincipal.trim().length > 25) {
    errores.codigoPrincipal = "El código principal no puede exceder 25 caracteres (límite SRI).";
  }

  // descripcion: obligatorio, máx 300 chars
  if (!datos.descripcion?.trim()) {
    errores.descripcion = "La descripción del producto es obligatoria (campo SRI).";
  } else if (datos.descripcion.trim().length > 300) {
    errores.descripcion = "La descripción no puede exceder 300 caracteres (límite SRI).";
  }

  // precioUnitario: obligatorio, positivo, hasta 6 decimales
  if (datos.precioUnitario === undefined || datos.precioUnitario === null) {
    errores.precioUnitario = "El precio unitario es obligatorio (base imponible SRI).";
  } else if (isNaN(datos.precioUnitario) || datos.precioUnitario <= 0) {
    errores.precioUnitario = "El precio unitario debe ser mayor a $0.00.";
  } else {
    // Verificar que no tenga más de 6 decimales
    const decimales = (datos.precioUnitario.toString().split(".")[1] || "").length;
    if (decimales > 6) {
      errores.precioUnitario = "El precio unitario no puede tener más de 6 decimales (SRI).";
    }
  }

  // codigoPorcentaje: debe ser uno de los valores válidos del SRI
  const codigosValidos = ["0", "2", "4"];
  if (!datos.codigoPorcentaje || !codigosValidos.includes(datos.codigoPorcentaje)) {
    errores.codigoPorcentaje = "Seleccione una tarifa de IVA válida (0%, 8% o 15%).";
  }

  return errores;
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDADOR COMPLETO DE CLIENTE (campos obligatorios SRI)
// ─────────────────────────────────────────────────────────────────────────────
export function validarCliente(datos: Partial<SriCliente>): ErroresCampo {
  const errores: ErroresCampo = {};

  // Consumidor Final: siempre válido sin más verificaciones
  if (datos.tipoIdentificacion === "07") return errores;

  // Tipo de identificación
  if (!datos.tipoIdentificacion) {
    errores.tipoIdentificacion = "Seleccione el tipo de identificación.";
  }

  // Identificación
  if (!datos.identificacion?.trim()) {
    errores.identificacion = "El número de identificación es obligatorio.";
  } else if (datos.tipoIdentificacion) {
    const resultado = validarIdentificacion(datos.tipoIdentificacion, datos.identificacion);
    if (!resultado.valido) {
      errores.identificacion = resultado.mensaje;
    }
  }

  // Razón Social
  if (!datos.razonSocial?.trim()) {
    errores.razonSocial = "El nombre o razón social es obligatorio.";
  }

  // Dirección
  if (!datos.direccion?.trim()) {
    errores.direccion = "La dirección es obligatoria para clientes con identificación.";
  }

  // Correo electrónico
  if (!datos.correo?.trim()) {
    errores.correo = "El correo electrónico es obligatorio (RIDE SRI).";
  } else if (!validarEmail(datos.correo)) {
    errores.correo = "Ingrese un correo electrónico válido.";
  }

  return errores;
}
