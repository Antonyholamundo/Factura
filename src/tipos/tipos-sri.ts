/**
 * ARCHIVO: tipos-sri.ts
 * PROPÓSITO: Fuente única de verdad para todas las interfaces TypeScript
 * alineadas al estándar de Facturación Electrónica del SRI (Ecuador).
 *
 * Referencia oficial:
 *   Ficha Técnica de Comprobantes Electrónicos — SRI Ecuador v2.21
 *   https://www.sri.gob.ec/facturacion-electronica
 */

// ─────────────────────────────────────────────────────────────────────────────
// CATÁLOGO DE PRODUCTOS / SERVICIOS
// Campos mínimos exigidos por el SRI en el nodo <detalle> de la factura XML.
// ─────────────────────────────────────────────────────────────────────────────
export interface SriProducto {
  /** Código principal del producto (máx. 25 chars, alfanumérico). Obligatorio SRI. */
  codigoPrincipal: string;

  /** Descripción del bien o servicio (máx. 300 chars). Obligatorio SRI. */
  descripcion: string;

  /**
   * Precio unitario SIN IVA. Es la base imponible por unidad.
   * El SRI exige hasta 6 decimales.
   */
  precioUnitario: number;

  /**
   * Código de tarifa IVA según catálogo SRI:
   *  "0"  → IVA  0%  (bienes exentos, medicamentos, canasta básica)
   *  "2"  → IVA  8%  (tarifa transitoria 2024, Ley Solidaridad)
   *  "4"  → IVA 15%  (tarifa general vigente desde mayo 2024)
   */
  codigoPorcentaje: "0" | "2" | "4";
}

// ─────────────────────────────────────────────────────────────────────────────
// DATOS DEL COMPRADOR
// Requeridos por el SRI en el nodo <infoFactura>.
// ─────────────────────────────────────────────────────────────────────────────
export interface SriCliente {
  /**
   * Tipo de documento del comprador. Códigos SRI:
   *  "04" → RUC
   *  "05" → Cédula de identidad
   *  "06" → Pasaporte
   *  "07" → Consumidor Final (identificación = "9999999999999")
   */
  tipoIdentificacion: "04" | "05" | "06" | "07";

  /** Número de RUC, cédula o pasaporte del comprador. */
  identificacion: string;

  /** Razón social o nombre completo del comprador (en mayúsculas). */
  razonSocial: string;

  /** Dirección del comprador. Obligatorio para facturas con RUC/cédula. */
  direccion: string;

  /** Correo electrónico para notificación de RIDE. Obligatorio SRI. */
  correo: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// ÍTEM DEL CARRITO DE COMPRA
// Extiende SriProducto con cantidad y descuento por línea.
// ─────────────────────────────────────────────────────────────────────────────
export interface SriDetalleCarrito extends SriProducto {
  /** Cantidad de unidades del producto en esta línea. Mínimo 1. */
  cantidad: number;

  /** Descuento en dólares ($) aplicado a esta línea. El SRI requiere descuento por ítem. */
  descuento: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// TOTALES CALCULADOS DEL COMPROBANTE
// Resultado intermedio antes de construir el payload final.
// ─────────────────────────────────────────────────────────────────────────────
export interface TotalesFactura {
  /** Suma de bases imponibles de ítems con IVA 15% (código 4), sin descuentos. */
  subtotal15: number;

  /** Suma de bases imponibles de ítems con IVA 0% (código 0), sin descuentos. */
  subtotal0: number;

  /** Suma de bases imponibles de ítems con IVA 8% (código 2), sin descuentos. */
  subtotal8: number;

  /** Total de descuentos aplicados en dólares (suma de todos los ítems). */
  totalDescuento: number;

  /** Monto total de IVA calculado (todas las tarifas combinadas). */
  iva: number;

  /** Valor total del comprobante (base + IVA - descuentos). */
  total: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// IMPUESTO POR LÍNEA DE DETALLE
// Nodo <impuesto> dentro de cada <detalle> en el XML SRI.
// ─────────────────────────────────────────────────────────────────────────────
export interface SriImpuestoDetalle {
  /** Código de tipo de impuesto. "2" = IVA (siempre para facturas locales). */
  codigo: "2";

  /** Código de la tarifa de IVA ("0", "2" o "4"). */
  codigoPorcentaje: string;

  /** Tasa porcentual (0, 8 o 15). */
  tarifa: number;

  /** Base imponible de esta línea después de descuentos, en dólares. */
  baseImponible: number;

  /** Valor del IVA calculado: baseImponible × (tarifa / 100). */
  valor: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// ÍTEM DE DETALLE EN EL PAYLOAD FINAL
// Nodo <detalle> del XML de la factura electrónica.
// ─────────────────────────────────────────────────────────────────────────────
export interface SriDetallePayload {
  codigoPrincipal: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  precioTotalSinImpuesto: number;
  impuestos: SriImpuestoDetalle[];
}

// ─────────────────────────────────────────────────────────────────────────────
// IMPUESTO TOTAL DEL COMPROBANTE
// Nodo <totalImpuesto> dentro de <totalConImpuestos> del XML SRI.
// ─────────────────────────────────────────────────────────────────────────────
export interface SriImpuestoTotal {
  codigo: "2";
  codigoPorcentaje: string;
  baseImponible: number;
  tarifa: number;
  valor: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMA DE PAGO DEL COMPROBANTE
// Nodo <pago> dentro de <pagos> del XML SRI.
// ─────────────────────────────────────────────────────────────────────────────
export interface SriPago {
  /** Código de forma de pago. "01" = Efectivo, "19" = Tarjeta crédito, "20" = Transferencia. */
  formaPago: string;

  /** Monto pagado con esta forma de pago. */
  total: number;

  /** Días de plazo (0 = pago inmediato). */
  plazo: string;

  /** Unidad de tiempo para el plazo. */
  unidadTiempo: "dias" | "meses";
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYLOAD COMPLETO DE LA FACTURA ELECTRÓNICA
// Este objeto JSON es el que se envía al backend Node.js/Express para
// que lo firme con el certificado .p12 y lo envíe al WebService del SRI.
// ─────────────────────────────────────────────────────────────────────────────
export interface FacturaPayload {
  /** Datos del emisor y secuencial del comprobante. */
  infoTributaria: {
    ambiente: "1" | "2";        // "1" = Pruebas, "2" = Producción
    tipoEmision: "1";           // "1" = Normal
    razonSocial: string;
    nombreComercial: string;
    ruc: string;                // RUC del emisor (13 dígitos)
    codDoc: "01";               // "01" = Factura
    estab: string;              // Código establecimiento (3 dígitos)
    ptoEmi: string;             // Punto de emisión (3 dígitos)
    secuencial: string;         // Número secuencial (9 dígitos, relleno ceros)
    dirMatriz: string;
  };

  /** Datos fiscales del comprobante. */
  infoFactura: {
    fechaEmision: string;       // Formato DD/MM/YYYY
    dirEstablecimiento: string;
    obligadoContabilidad: "SI" | "NO";
    tipoIdentificacionComprador: SriCliente["tipoIdentificacion"];
    razonSocialComprador: string;
    identificacionComprador: string;
    direccionComprador: string;
    correoComprador: string;
    totalSinImpuestos: number;
    totalDescuento: number;
    totalConImpuestos: number;
    propina: number;
    moneda: "DOLAR";
    formaPago: string;
    pagos: SriPago[];
    totalImpuesto: SriImpuestoTotal[];
  };

  /** Array de líneas de detalle del comprobante. */
  detalles: SriDetallePayload[];
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTADO DE VALIDACIÓN POR CAMPO
// Usado en la UI para mostrar errores inline sin recurrir a alert().
// ─────────────────────────────────────────────────────────────────────────────
export interface ErroresCampo {
  [campo: string]: string | undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRO DEL HISTORIAL DE FACTURAS EMITIDAS (UI solamente)
// No forma parte del payload SRI, es solo para visualización en la tabla.
// ─────────────────────────────────────────────────────────────────────────────
export interface RegistroFactura {
  id: number | string;
  fechaEmision: string;
  cliente: string;
  identificacion: string;
  productosResumen: string;
  total: string;
  status: "Autorizado" | "Pendiente" | "Anulado" | "Local" | "Error SRI";
  payload: FacturaPayload;
  /** Clave de acceso de 49 dígitos emitida por el SRI al autorizar */
  claveAcceso?: string;
  /** Número de autorización del SRI */
  numeroAutorizacion?: string;
  /** ID del PDF generado en Cloudinary/local para descarga */
  pdfId?: string;
  /** Número secuencial visible del comprobante */
  secuencial?: string;
}
