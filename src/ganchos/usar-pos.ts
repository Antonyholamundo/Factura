/**
 * HOOK: usarPos
 * PROPÓSITO: Encapsula toda la lógica de negocio del Terminal POS:
 *  - Estado del cliente activo (con soporte Consumidor Final)
 *  - Gestión del carrito de compras
 *  - Cálculos fiscales SRI (subtotales por tarifa, IVA, descuentos, total)
 *  - Construcción del payload JSON para el backend (estructura XML SRI)
 *  - Emisión y persistencia del historial de facturas
 *
 * Sin JSX. Testeable unitariamente.
 */
import { useState, useEffect, useCallback } from "react";
import type {
  SriProducto,
  SriCliente,
  SriDetalleCarrito,
  TotalesFactura,
  FacturaPayload,
  RegistroFactura,
  ErroresCampo,
} from "../tipos/tipos-sri";
import { validarCliente, calcularTasaIva } from "../utilidades/validaciones-sri";
import { estaAutenticado, type ApiError } from "../servicios/api-sri";
import {
  getProductos,
  getClientes,
  registrarCliente as apiRegistrarCliente,
  getHistorial,
  apiCalcularTotales,
  crearFactura as apiCrearFactura,
  getTiposIdentificacion,
  getEmisor,
} from "../servicios/api";

// ─────────────────────────────────────────────────────────────────────────────
// DATOS DEL EMISOR
// IMPORTANTE: En producción, estos datos deben provenir del backend o de
// variables de entorno (.env). NUNCA almacenar el RUC del emisor en el frontend
// de forma expuesta en un repositorio público.
// ─────────────────────────────────────────────────────────────────────────────
const EMISOR_CONFIG = {
  ambiente: "1" as const,           // "1" = Pruebas | "2" = Producción
  tipoEmision: "1" as const,
  razonSocial: "EMPRESA PRUEBA S.A.",
  nombreComercial: "POS INTEGRADO SRI",
  ruc: "1792945678001",             // ← REEMPLAZAR con RUC real en producción
  codDoc: "01" as const,            // "01" = Factura
  estab: "001",
  ptoEmi: "001",
  dirMatriz: "Av. de los Shyris N34-102 y Holanda, Quito",
  dirEstablecimiento: "Av. de los Shyris N34-102 y Holanda",
  obligadoContabilidad: "NO" as const,
};

// ─────────────────────────────────────────────────────────────────────────────
// CLIENTE CONSUMIDOR FINAL (código especial del SRI)
// ─────────────────────────────────────────────────────────────────────────────
const CONSUMIDOR_FINAL: SriCliente = {
  tipoIdentificacion: "07",
  identificacion: "9999999999999",
  razonSocial: "CONSUMIDOR FINAL",
  direccion: "S/N",
  correo: "consumidorfinal@sri.gob.ec",
};

// ─────────────────────────────────────────────────────────────────────────────
// INTERFACE DE RETORNO DEL HOOK
// ─────────────────────────────────────────────────────────────────────────────
export interface UsarPosRetorno {
  // Estado del cliente activo
  cliente: SriCliente;
  setCliente: (c: SriCliente) => void;
  setConsumidorFinal: () => void;

  // Carrito de compras
  carrito: SriDetalleCarrito[];
  agregarAlCarrito: (producto: SriProducto) => void;
  quitarDelCarrito: (codigoPrincipal: string) => void;
  cambiarCantidad: (codigoPrincipal: string, cantidad: number) => void;
  cambiarDescuento: (codigoPrincipal: string, descuento: number) => void;
  limpiarCarrito: () => void;

  // Cálculos fiscales (reactivos al carrito)
  totales: TotalesFactura;
  cargandoTotales: boolean;

  // Catálogo de productos disponibles
  productos: SriProducto[];

  // Clientes registrados
  clientes: SriCliente[];
  registrarCliente: (cliente: SriCliente) => Promise<ErroresCampo>;

  // Historial de facturas
  historial: RegistroFactura[];

  // Formas de pago
  formaPago: string;
  setFormaPago: (codigo: string) => void;

  // Emisión de factura
  emitirFactura: () => Promise<{
    exito: boolean;
    mensaje: string;
    payload?: FacturaPayload;
    respuestaApi?: any;
    claveAcceso?: string;
    numeroAutorizacion?: string;
    pdfId?: string;
    secuencial?: string;
    status?: RegistroFactura["status"];
  }>;
  ultimoPayload: FacturaPayload | null;

  // Mensaje de éxito temporal (auto-limpiado)
  mensajeExito: string;

  // Indica si la API del SRI está conectada y el usuario autenticado
  apiConectada: boolean;

  // Estado de carga y errores de API
  loading: boolean;
  error: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIÓN PURA: Calcular totales del carrito
// Separada del hook para ser testeable unitariamente.
// ─────────────────────────────────────────────────────────────────────────────
export function calcularTotalesCarrito(carrito: SriDetalleCarrito[]): TotalesFactura {
  return carrito.reduce(
    (acc, item) => {
      const tasa = calcularTasaIva(item.codigoPorcentaje);
      // Base de la línea antes del descuento
      const lineaBase = item.precioUnitario * item.cantidad;
      const lineaDescuento = Math.max(0, item.descuento || 0);
      // El SRI calcula el IVA DESPUÉS de aplicar el descuento
      const lineaSubtotal = Math.max(0, lineaBase - lineaDescuento);
      const lineaIva = lineaSubtotal * tasa;

      // Segregar subtotales por tarifa (requerimiento de desglose SRI)
      if (item.codigoPorcentaje === "4") {
        acc.subtotal15 += lineaSubtotal;
      } else if (item.codigoPorcentaje === "2") {
        acc.subtotal8 += lineaSubtotal;
      } else {
        acc.subtotal0 += lineaSubtotal;
      }

      acc.totalDescuento += lineaDescuento;
      acc.iva += lineaIva;
      acc.total += lineaSubtotal + lineaIva;
      return acc;
    },
    { subtotal15: 0, subtotal0: 0, subtotal8: 0, totalDescuento: 0, iva: 0, total: 0 }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIÓN PURA: Construir el payload JSON de la factura electrónica
// Este JSON es enviado al backend Node.js/Express para firma y autorización.
// ─────────────────────────────────────────────────────────────────────────────
export function construirFacturaPayload(
  cliente: SriCliente,
  carrito: SriDetalleCarrito[],
  totales: TotalesFactura,
  formaPago: string,
  emisorConfig: any,
  secuencial: number
): FacturaPayload {
  // Fecha de emisión en formato DD/MM/YYYY (exigido por el SRI)
  const hoy = new Date();
  const dia  = String(hoy.getDate()).padStart(2, "0");
  const mes  = String(hoy.getMonth() + 1).padStart(2, "0");
  const anio = hoy.getFullYear();
  const fechaEmision = `${dia}/${mes}/${anio}`;

  // Mapa de impuestos totales agrupados por codigoPorcentaje (para el nodo totalConImpuestos)
  const mapaImpuestosTotal: Record<string, { baseImponible: number; valor: number; tarifa: number }> = {};

  // Construir el array de detalles del comprobante
  const detalles = carrito.map((item) => {
    const tasa = calcularTasaIva(item.codigoPorcentaje);
    const lineaBase = item.precioUnitario * item.cantidad;
    const lineaDescuento = Math.max(0, item.descuento || 0);
    const lineaSubtotal = Math.max(0, lineaBase - lineaDescuento);
    const lineaIva = lineaSubtotal * tasa;
    const tarifaPorcentaje = tasa * 100;

    // Acumular impuesto total por tarifa
    const key = item.codigoPorcentaje;
    if (!mapaImpuestosTotal[key]) {
      mapaImpuestosTotal[key] = { baseImponible: 0, valor: 0, tarifa: tarifaPorcentaje };
    }
    mapaImpuestosTotal[key].baseImponible += lineaSubtotal;
    mapaImpuestosTotal[key].valor += lineaIva;

    return {
      codigoPrincipal: item.codigoPrincipal,
      descripcion: item.descripcion,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario,
      descuento: parseFloat(lineaDescuento.toFixed(2)),
      precioTotalSinImpuesto: parseFloat(lineaSubtotal.toFixed(2)),
      impuestos: [
        {
          codigo: "2" as const,               // "2" = IVA (siempre para facturas locales)
          codigoPorcentaje: item.codigoPorcentaje,
          tarifa: tarifaPorcentaje,
          baseImponible: parseFloat(lineaSubtotal.toFixed(2)),
          valor: parseFloat(lineaIva.toFixed(2)),
        },
      ],
    };
  });

  // Construir el array de impuestos totales del comprobante
  const totalImpuesto = Object.keys(mapaImpuestosTotal).map((key) => ({
    codigo: "2" as const,
    codigoPorcentaje: key,
    baseImponible: parseFloat(mapaImpuestosTotal[key].baseImponible.toFixed(2)),
    tarifa: mapaImpuestosTotal[key].tarifa,
    valor: parseFloat(mapaImpuestosTotal[key].valor.toFixed(2)),
  }));

  const totalSinImpuestos = parseFloat(
    (totales.subtotal15 + totales.subtotal8 + totales.subtotal0).toFixed(2)
  );

  return {
    infoTributaria: {
      ambiente: emisorConfig.ambiente,
      tipoEmision: emisorConfig.tipoEmision || "1",
      razonSocial: emisorConfig.razonSocial,
      nombreComercial: emisorConfig.nombreComercial,
      ruc: emisorConfig.ruc,
      codDoc: emisorConfig.codDoc || "01",
      estab: emisorConfig.estab,
      ptoEmi: emisorConfig.ptoEmi,
      dirMatriz: emisorConfig.dirMatriz,
      secuencial: String(secuencial).padStart(9, "0"),
    },
    infoFactura: {
      fechaEmision,
      dirEstablecimiento: emisorConfig.dirEstablecimiento,
      obligadoContabilidad: emisorConfig.obligadoContabilidad || "NO",
      tipoIdentificacionComprador: cliente.tipoIdentificacion,
      razonSocialComprador: cliente.razonSocial.trim().toUpperCase(),
      identificacionComprador: cliente.identificacion.trim(),
      direccionComprador: cliente.direccion.trim(),
      correoComprador: cliente.correo.trim(),
      totalSinImpuestos,
      totalDescuento: parseFloat(totales.totalDescuento.toFixed(2)),
      totalConImpuestos: parseFloat(totales.total.toFixed(2)),
      propina: 0.0,
      moneda: "DOLAR",
      formaPago,
      pagos: [
        {
          formaPago,
          total: parseFloat(totales.total.toFixed(2)),
          plazo: "0",
          unidadTiempo: "dias",
        },
      ],
      totalImpuesto,
    },
    detalles,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK PRINCIPAL: usarPos
// ─────────────────────────────────────────────────────────────────────────────
export function usarPos(): UsarPosRetorno {
  // ── Estado del Emisor (dinámico de localStorage) ──────────────────────────
  const [emisorConfig, setEmisorConfig] = useState(() => {
    try {
      const stored = localStorage.getItem("pos_emisor_config");
      return stored ? JSON.parse(stored) : EMISOR_CONFIG;
    } catch {
      return EMISOR_CONFIG;
    }
  });

  // Escuchar actualizaciones del emisor
  useEffect(() => {
    const handleEmisorChange = () => {
      try {
        const stored = localStorage.getItem("pos_emisor_config");
        if (stored) {
          setEmisorConfig(JSON.parse(stored));
        }
      } catch (e) {
        console.error(e);
      }
    };
    window.addEventListener("emisor_config_changed", handleEmisorChange);
    return () => window.removeEventListener("emisor_config_changed", handleEmisorChange);
  }, []);

  // ── Estado de carga y errores ──────────────────────────────────────────────
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cargandoTotales, setCargandoTotales] = useState<boolean>(false);
  const [tiposIdentificacion, setTiposIdentificacion] = useState<any[]>([]);

  // ── Estado del cliente activo ──────────────────────────────────────────────
  const [cliente, setClienteState] = useState<SriCliente>(CONSUMIDOR_FINAL);

  // ── Carrito de compras ─────────────────────────────────────────────────────
  const [carrito, setCarrito] = useState<SriDetalleCarrito[]>([]);

  // ── Catálogo de productos (cargado desde API) ────────────────────
  const [productos, setProductos] = useState<SriProducto[]>([]);

  // ── Clientes registrados ───────────────────────────────────────────────────
  const [clientes, setClientes] = useState<SriCliente[]>([]);

  // ── Historial de facturas emitidas ─────────────────────────────────────────
  const [historial, setHistorial] = useState<RegistroFactura[]>([]);

  // ── Totales reactivos al carrito, calculados por el Backend ────────────────
  const [totales, setTotales] = useState<TotalesFactura>({
    subtotal15: 0,
    subtotal0: 0,
    subtotal8: 0,
    totalDescuento: 0,
    iva: 0,
    total: 0,
  });

  // ── Forma de pago seleccionada (código SRI) ────────────────────────────────
  const [formaPago, setFormaPago] = useState("01"); // "01" = Efectivo

  // ── Último payload generado (para debug/preview) ──────────────────────────
  const [ultimoPayload, setUltimoPayload] = useState<FacturaPayload | null>(null);

  // ── Mensaje de éxito temporal ──────────────────────────────────────────────
  const [mensajeExito, setMensajeExito] = useState("");

  // ── Cargar datos iniciales desde la API en lugar de localStorage ──────────
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [prodList, cliList, histList, identTypes, emisorList] = await Promise.all([
          getProductos(),
          getClientes(),
          getHistorial(),
          getTiposIdentificacion(),
          getEmisor(),
        ]);

        if (isMounted) {
          setTiposIdentificacion(identTypes);

          // Normalizar emisor desde la API MongoDB
          if (emisorList && emisorList.length > 0) {
            const emp = emisorList[0];
            const emisorNormalizado = {
              ambiente: String(emp.tipo_ambiente || 1) as "1" | "2",
              tipoEmision: String(emp.tipo_emision || 1) as "1",
              razonSocial: emp.razon_social || "",
              nombreComercial: emp.nombre_comercial || "",
              ruc: emp.ruc || "",
              codDoc: "01" as const,
              estab: emp.codigo_establecimiento || "001",
              ptoEmi: emp.punto_emision || "001",
              dirMatriz: emp.direccion_matriz || emp.direccion || "",
              dirEstablecimiento: emp.direccion_establecimiento || emp.direccion || "",
              obligadoContabilidad: emp.obligado_contabilidad ? ("SI" as const) : ("NO" as const),
            };
            setEmisorConfig(emisorNormalizado);
            localStorage.setItem("pos_emisor_config", JSON.stringify(emisorNormalizado));
          }

          // Normalizar productos desde la API MongoDB
          const normalizados: SriProducto[] = prodList.map((p: any) => ({
            codigoPrincipal: p.codigo || p.codigoPrincipal || "",
            descripcion: p.descripcion || "",
            precioUnitario: p.precio_unitario || 0,
            codigoPorcentaje: p.tiene_iva ? "4" : "0",
          }));
          setProductos(normalizados);

          // Normalizar clientes desde la API MongoDB
          const clientesNormalizados: SriCliente[] = cliList.map((c: any) => ({
            tipoIdentificacion: (c.tipo_identificacion_id?.codigo || c.tipoIdentificacion || "05") as any,
            identificacion: c.identificacion || "",
            razonSocial: c.razon_social || "",
            direccion: c.direccion || "",
            correo: c.email || c.correo || "",
          }));
          
          const hasConsumidorFinal = clientesNormalizados.some(c => c.tipoIdentificacion === "07");
          const finalClients = hasConsumidorFinal ? clientesNormalizados : [CONSUMIDOR_FINAL, ...clientesNormalizados];
          setClientes(finalClients);

          // Normalizar historial desde la API MongoDB
          const historialNormalizado: RegistroFactura[] = histList.map((h: any) => ({
            id: h._id,
            fechaEmision: new Date(h.fecha_emision).toLocaleDateString("es-EC", { day: "2-digit", month: "2-digit", year: "numeric" }),
            cliente: h.cliente_id?.razon_social || "Consumidor Final",
            identificacion: h.cliente_id?.identificacion || "9999999999999",
            productosResumen: h.secuencial ? `Factura #${h.secuencial}` : "Comprobante emitido",
            total: `$${h.total_con_impuestos.toFixed(2)}`,
            status: h.sri_estado === "AUTORIZADO" || h.estado === "CREADA" ? "Autorizado" : "Local",
            payload: {} as FacturaPayload,
          }));
          setHistorial(historialNormalizado);
        }
      } catch (err: any) {
        if (isMounted) {
          setError("Error al cargar datos desde la API del backend. Verifique que esté iniciada.");
          console.error("Error loading POS initial data:", err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (estaAutenticado()) {
      loadData();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // ── Calcular totales de forma asíncrona mediante el Backend con Debounce ──
  useEffect(() => {
    if (carrito.length === 0) {
      setTotales({
        subtotal15: 0,
        subtotal0: 0,
        subtotal8: 0,
        totalDescuento: 0,
        iva: 0,
        total: 0,
      });
      return;
    }

    const calculate = async () => {
      setCargandoTotales(true);
      try {
        const items = carrito.map(i => ({
          codigoPrincipal: i.codigoPrincipal,
          cantidad: i.cantidad,
          descuento: i.descuento || 0,
        }));
        const res = await apiCalcularTotales(items);
        setTotales(res);
      } catch (err) {
        console.error("Error calculating backend totals:", err);
        // Fallback en cliente si el backend falla
        const fallback = calcularTotalesCarrito(carrito);
        setTotales(fallback);
      } finally {
        setCargandoTotales(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      calculate();
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [carrito]);

  // ── GESTIÓN DEL CLIENTE ────────────────────────────────────────────────────

  /** Establece el cliente activo en la transacción */
  const setCliente = useCallback((c: SriCliente) => {
    setClienteState(c);
  }, []);

  /** Atajo de un clic para Consumidor Final (tipo 07, identificación fija SRI) */
  const setConsumidorFinal = useCallback(() => {
    setClienteState(CONSUMIDOR_FINAL);
  }, []);

  /** Valida y registra un nuevo cliente en el backend de forma asíncrona */
  const registrarCliente = useCallback(async (nuevoCliente: SriCliente): Promise<ErroresCampo> => {
    const errores = validarCliente(nuevoCliente);
    if (Object.keys(errores).length > 0) return errores;

    try {
      // Buscar el mongo ID del tipo de identificación en los datos cargados del backend
      const tipoObj = tiposIdentificacion.find(t => t.codigo === nuevoCliente.tipoIdentificacion);
      if (!tipoObj) {
        return { tipoIdentificacion: "Tipo de identificación no válido o no encontrado en el sistema." };
      }

      const backendClientBody = {
        tipo_identificacion_id: tipoObj._id,
        identificacion: nuevoCliente.identificacion,
        razon_social: nuevoCliente.razonSocial,
        direccion: nuevoCliente.direccion,
        email: nuevoCliente.correo,
        telefono: "0999999999", // Valor por defecto requerido
      };

      const cliGuardado = await apiRegistrarCliente(backendClientBody);
      
      const nuevoClienteNormalizado: SriCliente = {
        tipoIdentificacion: nuevoCliente.tipoIdentificacion,
        identificacion: cliGuardado.identificacion || nuevoCliente.identificacion,
        razonSocial: cliGuardado.razon_social || nuevoCliente.razonSocial,
        direccion: cliGuardado.direccion || nuevoCliente.direccion,
        correo: cliGuardado.email || nuevoCliente.correo,
      };

      setClientes((prev) => {
        const existe = prev.some(c => c.identificacion === nuevoClienteNormalizado.identificacion);
        if (existe) return prev;
        return [nuevoClienteNormalizado, ...prev];
      });

      return {};
    } catch (err: any) {
      console.error("Error al registrar cliente:", err);
      return { identificacion: err.message || "Error del servidor al registrar el cliente." };
    }
  }, [tiposIdentificacion]);

  // ── GESTIÓN DEL CARRITO ────────────────────────────────────────────────────

  /** Agrega un producto al carrito. Si ya existe, incrementa la cantidad. */
  const agregarAlCarrito = useCallback((producto: SriProducto) => {
    setCarrito((prev) => {
      const existente = prev.find(i => i.codigoPrincipal === producto.codigoPrincipal);
      if (existente) {
        return prev.map(i =>
          i.codigoPrincipal === producto.codigoPrincipal
            ? { ...i, cantidad: i.cantidad + 1 }
            : i
        );
      }
      // Agregar al inicio del carrito para visibilidad inmediata
      return [{ ...producto, cantidad: 1, descuento: 0 }, ...prev];
    });
  }, []);

  /** Elimina completamente un ítem del carrito */
  const quitarDelCarrito = useCallback((codigoPrincipal: string) => {
    setCarrito(prev => prev.filter(i => i.codigoPrincipal !== codigoPrincipal));
  }, []);

  /** Cambia la cantidad de un ítem. Mínimo: 1. */
  const cambiarCantidad = useCallback((codigoPrincipal: string, cantidad: number) => {
    setCarrito(prev =>
      prev.map(i =>
        i.codigoPrincipal === codigoPrincipal
          ? { ...i, cantidad: Math.max(1, Math.round(cantidad)) }
          : i
      )
    );
  }, []);

  /** Cambia el descuento en $ de un ítem. Mínimo: 0. */
  const cambiarDescuento = useCallback((codigoPrincipal: string, descuento: number) => {
    setCarrito(prev =>
      prev.map(i =>
        i.codigoPrincipal === codigoPrincipal
          ? { ...i, descuento: Math.max(0, descuento) }
          : i
      )
    );
  }, []);

  /** Vacía el carrito completamente */
  const limpiarCarrito = useCallback(() => {
    setCarrito([]);
  }, []);

  // ── ESTADO DE CONEXIÓN CON API ─────────────────────────────────────────────
  const apiConectada = estaAutenticado();

  // ── EMISIÓN DE FACTURA ─────────────────────────────────────────────────────
  const emitirFactura = useCallback(async (): Promise<{
    exito: boolean;
    mensaje: string;
    payload?: FacturaPayload;
    respuestaApi?: any;
    claveAcceso?: string;
    numeroAutorizacion?: string;
    pdfId?: string;
    secuencial?: string;
    status?: RegistroFactura["status"];
  }> => {
    // Validación 1: Carrito no vacío
    if (carrito.length === 0) {
      return { exito: false, mensaje: "El carrito está vacío. Agregue al menos un producto." };
    }

    // Validación 2: Datos del cliente completos (Consumidor Final siempre pasa)
    const erroresCliente = validarCliente(cliente);
    if (Object.keys(erroresCliente).length > 0) {
      return { exito: false, mensaje: "Datos del cliente incompletos. Revise el comprador." };
    }

    // Validación 3: Total mayor a cero (evitar facturas en $0)
    if (totales.total <= 0) {
      return { exito: false, mensaje: "El total del comprobante no puede ser $0.00." };
    }

    // Construir el payload limpio para el backend
    const secuencialNum = historial.length + 1;
    const payload = construirFacturaPayload(cliente, carrito, totales, formaPago, emisorConfig, secuencialNum);
    setUltimoPayload(payload);

    // Log del payload en consola para verificación durante desarrollo
    console.group("=== PAYLOAD FACTURA ELECTRÓNICA SRI ===");
    console.log(JSON.stringify(payload, null, 2));
    console.groupEnd();

    // ── ENVIAR A LA API DEL SRI (si está autenticado) ──
    let respuestaApi: any = null;
    let statusFactura: RegistroFactura["status"] = "Local";

    if (estaAutenticado()) {
      try {
        // Transformar el payload al formato que espera la API
        const facturaApi = {
          infoTributaria: {
            ruc: payload.infoTributaria.ruc,
          },
          infoFactura: {
            fechaEmision: payload.infoFactura.fechaEmision,
            tipoIdentificacionComprador: payload.infoFactura.tipoIdentificacionComprador,
            identificacionComprador: payload.infoFactura.identificacionComprador,
            razonSocialComprador: payload.infoFactura.razonSocialComprador,
            totalSinImpuestos: String(payload.infoFactura.totalSinImpuestos.toFixed(2)),
            importeTotal: String(payload.infoFactura.totalConImpuestos.toFixed(2)),
          },
          detalles: payload.detalles.map((d) => ({
            detalle: {
              codigoPrincipal: d.codigoPrincipal,
              descripcion: d.descripcion,
              cantidad: String(d.cantidad.toFixed(2)),
              precioUnitario: String(d.precioUnitario.toFixed(2)),
              precioTotalSinImpuesto: String(d.precioTotalSinImpuesto.toFixed(2)),
              impuestos: d.impuestos.map((imp) => ({
                impuesto: {
                  codigo: imp.codigo,
                  codigoPorcentaje: imp.codigoPorcentaje,
                  tarifa: String(imp.tarifa.toFixed(2)),
                  baseImponible: String(imp.baseImponible.toFixed(2)),
                  valor: String(imp.valor.toFixed(2)),
                },
              })),
            },
          })),
        };

        respuestaApi = await apiCrearFactura(facturaApi);
        statusFactura = respuestaApi?.success ? "Autorizado" : "Error SRI";
        console.log("✅ Respuesta API SRI:", respuestaApi);
      } catch (err: any) {
        const apiErr = err as ApiError;
        console.warn("⚠️ Error al enviar a API SRI:", apiErr.message);
        // Si el error es de conexión (API caída), guardar localmente
        if (apiErr.statusCode === 0) {
          statusFactura = "Pendiente";
        } else {
          // Error de validación del SRI o del backend — retornar con payload para que el modal lo muestre
          return {
            exito: false,
            mensaje: `Error del SRI: ${apiErr.message}`,
            payload,
            status: "Error SRI" as const,
          };
        }
      }
    }
    // Extraer campos del response de la API (si llegaron)
    const claveAcceso: string | undefined =
      respuestaApi?.data?.factura?.clave_acceso ||
      respuestaApi?.data?.clave_acceso ||
      respuestaApi?.data?.claveAcceso ||
      respuestaApi?.claveAcceso ||
      undefined;
    const numeroAutorizacion: string | undefined =
      respuestaApi?.data?.factura?.autorizacion_numero ||
      respuestaApi?.data?.numero_autorizacion ||
      respuestaApi?.data?.numeroAutorizacion ||
      undefined;
    const pdfId: string | undefined =
      respuestaApi?.data?.pdf?._id ||
      respuestaApi?.data?.pdfId ||
      undefined;
    const secuencialStr: string | undefined =
      respuestaApi?.data?.factura?.secuencial ||
      respuestaApi?.data?.secuencial ||
      payload.infoTributaria.secuencial ||
      undefined;


    // Construir registro de historial para la tabla de comprobantes
    const nuevoRegistro: RegistroFactura = {
      id: respuestaApi?.data?._id || String(Date.now()),
      fechaEmision: payload.infoFactura.fechaEmision,
      cliente: cliente.razonSocial,
      identificacion: cliente.identificacion,
      productosResumen: carrito.map(i => `${i.descripcion} x${i.cantidad}`).join(", "),
      total: `$${totales.total.toFixed(2)}`,
      status: statusFactura,
      payload,
      claveAcceso,
      numeroAutorizacion,
      pdfId,
      secuencial: secuencialStr,
    };

    const historialActualizado = [nuevoRegistro, ...historial];
    setHistorial(historialActualizado);

    // Limpiar estado de la transacción
    setCarrito([]);
    setClienteState(CONSUMIDOR_FINAL);
    setFormaPago("01");

    const estadoMensaje = statusFactura === "Autorizado"
      ? "✓ Autorizada por el SRI"
      : statusFactura === "Pendiente"
        ? "⏳ Guardada localmente (API no disponible)"
        : "✓ Registrada localmente";

    const mensaje = `${estadoMensaje} — Factura #${payload.infoTributaria.secuencial} para ${cliente.razonSocial}`;
    setMensajeExito(mensaje);
    setTimeout(() => setMensajeExito(""), 8000);

    return { exito: true, mensaje, payload, respuestaApi, claveAcceso, numeroAutorizacion, pdfId, secuencial: secuencialStr, status: statusFactura };
  }, [carrito, cliente, formaPago, emisorConfig, historial, totales]);

  return {
    cliente,
    setCliente,
    setConsumidorFinal,
    carrito,
    agregarAlCarrito,
    quitarDelCarrito,
    cambiarCantidad,
    cambiarDescuento,
    limpiarCarrito,
    totales,
    cargandoTotales,
    productos,
    clientes,
    registrarCliente,
    historial,
    formaPago,
    setFormaPago,
    emitirFactura,
    ultimoPayload,
    mensajeExito,
    apiConectada,
    loading,
    error,
  };
}
