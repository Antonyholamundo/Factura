import React, { useState, useEffect } from "react";
import PageBreadcrumb from "../../componentes/comunes/MigasPagina";
import ComponentCard from "../../componentes/comunes/TarjetaComponente";
import PageMeta from "../../componentes/comunes/MetaPagina";
import BasicTableOne from "../../componentes/tablas/TablasBasicas/TablaBasicaUno";
import Label from "../../componentes/formulario/Etiqueta";
import Input from "../../componentes/formulario/entrada/CampoEntrada";
import Select from "../../componentes/formulario/Seleccion";
import Button from "../../componentes/ui/boton/Boton";
import { Modal } from "../../componentes/ui/modal";

// ─────────────────────────────────────────────────────────────────────────────
// INTERFACES TÉCNICAS REQUERIDAS POR EL SRI (ECUADOR)
// ─────────────────────────────────────────────────────────────────────────────
export interface SriCliente {
  tipoIdentificacion: "04" | "05" | "06" | "07"; // 04 = RUC, 05 = Cédula, 06 = Pasaporte, 07 = Consumidor Final
  identificacion: string;
  razonSocial: string;
  direccion: string;
  correo: string;
}

export interface SriProducto {
  codigoPrincipal: string;
  descripcion: string;
  precioUnitario: number; // SIN IVA
  codigoPorcentaje: "4" | "0"; // "4" = IVA 15% (Ecuador general), "0" = IVA 0%
}

export interface SriDetalleCarrito extends SriProducto {
  cantidad: number;
  descuento: number; // Descuento en dólares ($) por línea de producto
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Devuelve la tasa de IVA según el código de porcentaje del SRI.
//  "4" = IVA 15% (tarifa general vigente en Ecuador desde mayo 2024)
//  Cualquier otro código = IVA 0% (servicios exentos, medicamentos, etc.)
// ─────────────────────────────────────────────────────────────────────────────
const getIvaRate = (code: string): number => (code === "4" ? 0.15 : 0);

// ─────────────────────────────────────────────────────────────────────────────
// DATOS INICIALES: Catálogo de productos predeterminados.
// ─────────────────────────────────────────────────────────────────────────────
const defaultProducts: SriProducto[] = [
  { codigoPrincipal: "PROD-CAFE001", descripcion: "Café de Loja Premium", precioUnitario: 5.65, codigoPorcentaje: "4" },
  { codigoPrincipal: "PROD-CHOC002", descripcion: "Chocolate Pacari Organic", precioUnitario: 4.17, codigoPorcentaje: "4" },
  { codigoPrincipal: "PROD-SOMB003", descripcion: "Sombrero de Paja Toquilla", precioUnitario: 39.13, codigoPorcentaje: "4" },
  { codigoPrincipal: "PROD-CONS004", descripcion: "Consultoría Tributaria (hora)", precioUnitario: 50.00, codigoPorcentaje: "0" },
];

// ─────────────────────────────────────────────────────────────────────────────
// DATOS INICIALES: Historial de facturas de ejemplo.
// ─────────────────────────────────────────────────────────────────────────────
const defaultInvoices = [
  {
    id: 1,
    user: { image: "/images/user/user-17.jpg", name: "Lindsey Curtis", role: "RUC: 1792345678001" },
    projectName: "Factura - Sombrero de Paja Toquilla x 2",
    team: { images: ["/images/user/user-22.jpg", "/images/user/user-23.jpg", "/images/user/user-24.jpg"] },
    budget: "$103.50",
    status: "Autorizado",
  },
  {
    id: 2,
    user: { image: "/images/user/user-18.jpg", name: "Kaiya George", role: "RUC: 0991234567001" },
    projectName: "Factura - Café de Loja Premium x 5",
    team: { images: ["/images/user/user-25.jpg", "/images/user/user-26.jpg"] },
    budget: "$37.38",
    status: "Pendiente",
  },
  {
    id: 3,
    user: { image: "/images/user/user-17.jpg", name: "Zain Geidt", role: "RUC: 0103456789001" },
    projectName: "Factura - Laptop (Servicio Técnico) x 1",
    team: { images: ["/images/user/user-27.jpg"] },
    budget: "$97.75",
    status: "Autorizado",
  },
  {
    id: 4,
    user: { image: "/images/user/user-20.jpg", name: "Abram Schleifer", role: "RUC: 1801234567001" },
    projectName: "Factura - Chocolate Pacari Organic x 10",
    team: { images: ["/images/user/user-28.jpg", "/images/user/user-29.jpg", "/images/user/user-30.jpg"] },
    budget: "$55.20",
    status: "Anulado",
  },
  {
    id: 5,
    user: { image: "/images/user/user-21.jpg", name: "Carla George", role: "RUC: 1729876543001" },
    projectName: "Factura - Sombrero de Paja Toquilla x 1",
    team: { images: ["/images/user/user-31.jpg", "/images/user/user-32.jpg", "/images/user/user-33.jpg"] },
    budget: "$51.75",
    status: "Autorizado",
  },
];
// ─────────────────────────────────────────────────────────────────────────────
// DATOS INICIALES: Clientes de ejemplo registrados (Semilla POS).
// ─────────────────────────────────────────────────────────────────────────────
const defaultClients: SriCliente[] = [
  { tipoIdentificacion: "05", identificacion: "1724567890", razonSocial: "JUAN SEBASTIAN PEREZ VALDIVIESO", direccion: "Av. Amazonas N21-147 y Patria, Quito", correo: "juan.perez@example.com" },
  { tipoIdentificacion: "04", identificacion: "1791234567001", razonSocial: "DISTRIBUIDORA COMERCIAL ALFA S.A.", direccion: "Av. Juan Tanca Marengo Km 4.5, Guayaquil", correo: "contacto@alfa.com.ec" },
  { tipoIdentificacion: "05", identificacion: "0923456789", razonSocial: "MARIA ELENA CHAVEZ GOMEZ", direccion: "Calle Larga 8-24 y Benigno Malo, Cuenca", correo: "maria.chavez@example.com" },
  { tipoIdentificacion: "06", identificacion: "A12345678", razonSocial: "JOHN SMITH (PASAPORTE)", direccion: "Hotel Marriott, Av. Francisco de Orellana, Quito", correo: "john.smith@tourist.com" },
];

export default function BasicTables() {
  // ── ESTADO DE NAVEGACIÓN: Alternar entre POS e Historial de Ventas ──────────
  const [activeTab, setActiveTab] = useState<"pos" | "history">("pos");

  // ── ESTADO: Catálogo de productos (cargado desde localStorage) ──────────
  const [products, setProducts] = useState<SriProducto[]>([]);

  // ── ESTADO: Historial de facturas emitidas (persiste en localStorage) ───
  const [invoices, setInvoices] = useState<any[]>([]);

  // ── ESTADOS: Datos del cliente activo en la venta (Tipado estricto SRI) ───
  const [clientTipoIdentificacion, setClientTipoIdentificacion] = useState<"04" | "05" | "06" | "07">("07");
  const [clientRuc, setClientRuc] = useState("9999999999999");
  const [clientName, setClientName] = useState("CONSUMIDOR FINAL");
  const [clientDireccion, setClientDireccion] = useState("S/N");
  const [clientCorreo, setClientCorreo] = useState("consumidorfinal@sri.gob.ec");

  // ── ESTADO: Carrito de compras — array de productos tipo SriDetalleCarrito
  const [cart, setCart] = useState<SriDetalleCarrito[]>([]);

  // ── ESTADO: Texto de búsqueda para filtrar el catálogo de productos en el modal ──
  const [productQuery, setProductQuery] = useState("");

  // ── ESTADO: Categoría de IVA seleccionada para filtrar el catálogo en el modal ───
  const [category, setCategory] = useState<string>("all");

  // ── ESTADO: Lista de clientes registrados (persiste en localStorage o carga defaultClients)
  const [clients, setClients] = useState<SriCliente[]>(() => {
    const stored = localStorage.getItem("pos_clients");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return defaultClients;
      }
    }
    return defaultClients;
  });

  // ── ESTADOS DE MODALES ───────────────────────────────────────────────────
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientModalTab, setClientModalTab] = useState<"search" | "create">("search");
  const [clientSearchQuery, setClientSearchQuery] = useState("");

  // ── ESTADO: Datos del formulario para registrar un nuevo cliente ───
  const [newClient, setNewClient] = useState<SriCliente>({
    tipoIdentificacion: "05", // Por defecto Cédula
    identificacion: "",
    razonSocial: "",
    correo: "",
    direccion: "",
  });

  // ── ESTADO: Forma de pago seleccionada (código SRI: 01=Efectivo, etc.) ───
  const [paymentMethod, setPaymentMethod] = useState("01");

  // ── ESTADO: Mensaje de éxito temporal tras emitir una factura ───────────
  const [successMessage, setSuccessMessage] = useState("");

  // ─────────────────────────────────────────────────────────────────────────
  // EFECTO: Carga inicial de datos desde localStorage.
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const storedProducts = localStorage.getItem("pos_products");
    if (storedProducts) {
      try {
        const parsed = JSON.parse(storedProducts);
        const mapped: SriProducto[] = parsed.map((p: any) => ({
          codigoPrincipal: p.codigoPrincipal || p.code || p.value || "",
          descripcion: p.descripcion || p.label || "",
          precioUnitario: typeof p.precioUnitario === "number" ? p.precioUnitario : (p.price || 0),
          codigoPorcentaje: p.codigoPorcentaje || "4",
        }));
        setProducts(mapped);
      }
      catch {
        setProducts(defaultProducts);
      }
    } else {
      localStorage.setItem("pos_products", JSON.stringify(defaultProducts));
      setProducts(defaultProducts);
    }

    const storedInvoices = localStorage.getItem("pos_invoices");
    if (storedInvoices) {
      try { setInvoices(JSON.parse(storedInvoices)); }
      catch { setInvoices(defaultInvoices); }
    } else {
      localStorage.setItem("pos_invoices", JSON.stringify(defaultInvoices));
      setInvoices(defaultInvoices);
    }
  }, []);

  // Sincronizar clientes con localStorage
  useEffect(() => {
    localStorage.setItem("pos_clients", JSON.stringify(clients));
  }, [clients]);

  // Enfocar buscador al abrir modal de productos (soporte código de barras)
  useEffect(() => {
    if (isProductModalOpen) {
      setTimeout(() => {
        document.getElementById("productModalSearch")?.focus();
      }, 100);
    }
  }, [isProductModalOpen]);

  // ─────────────────────────────────────────────────────────────────────────
  // GESTIÓN DE CLIENTES: Autocompletado y atajo Consumidor Final
  // ─────────────────────────────────────────────────────────────────────────
  const handleSelectClient = (c: SriCliente) => {
    setClientTipoIdentificacion(c.tipoIdentificacion);
    setClientRuc(c.identificacion);
    setClientName(c.razonSocial);
    setClientDireccion(c.direccion);
    setClientCorreo(c.correo);
    setIsClientModalOpen(false);
  };

  const handleConsumidorFinal = () => {
    setClientTipoIdentificacion("07");
    setClientRuc("9999999999999");
    setClientName("CONSUMIDOR FINAL");
    setClientDireccion("S/N");
    setClientCorreo("consumidorfinal@sri.gob.ec");
  };

  const saveNewClient = () => {
    if (
      !newClient.identificacion.trim() ||
      !newClient.razonSocial.trim() ||
      !newClient.direccion.trim() ||
      !newClient.correo.trim()
    ) {
      return alert("Por favor complete todos los campos obligatorios del cliente.");
    }
    const exists = clients.some(c => c.identificacion === newClient.identificacion);
    if (!exists) {
      setClients((c) => [newClient, ...c]);
    }
    handleSelectClient(newClient);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // GESTIÓN DEL CARRITO DE COMPRAS
  // ─────────────────────────────────────────────────────────────────────────
  const addToCart = (product: SriProducto) => {
    setCart((c) => {
      const existing = c.find((i) => i.codigoPrincipal === product.codigoPrincipal);
      if (existing) {
        return c.map((i) =>
          i.codigoPrincipal === product.codigoPrincipal
            ? { ...i, cantidad: i.cantidad + 1 }
            : i
        );
      }
      return [{ ...product, cantidad: 1, descuento: 0 }, ...c];
    });
  };

  const removeFromCart = (codigoPrincipal: string) => {
    setCart((c) => c.filter((i) => i.codigoPrincipal !== codigoPrincipal));
  };

  const changeQty = (codigoPrincipal: string, cantidad: number) => {
    setCart((c) =>
      c.map((i) =>
        i.codigoPrincipal === codigoPrincipal
          ? { ...i, cantidad: Math.max(1, cantidad) }
          : i
      )
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // FILTRADOS
  // ─────────────────────────────────────────────────────────────────────────
  const filteredProducts = products.filter((p) => {
    const q = productQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      p.descripcion.toLowerCase().includes(q) ||
      p.codigoPrincipal.toLowerCase().includes(q);
    const matchesCategory =
      category === "all" ||
      (category === "iva15" && getIvaRate(p.codigoPorcentaje) > 0) ||
      (category === "iva0" && getIvaRate(p.codigoPorcentaje) === 0);
    return matchesQuery && matchesCategory;
  });

  const filteredClients = clients.filter((c) => {
    const q = clientSearchQuery.trim().toLowerCase();
    return (
      !q ||
      c.razonSocial.toLowerCase().includes(q) ||
      c.identificacion.includes(q)
    );
  });

  // ─────────────────────────────────────────────────────────────────────────
  // CÁLCULOS SRI
  // ─────────────────────────────────────────────────────────────────────────
  const totals = cart.reduce(
    (acc, item) => {
      const rate = getIvaRate(item.codigoPorcentaje);
      const lineBase = item.precioUnitario * item.cantidad;
      const lineDiscount = item.descuento || 0;
      const lineSubtotal = Math.max(0, lineBase - lineDiscount);

      if (rate > 0) {
        acc.subtotal15 += lineSubtotal;
      } else {
        acc.subtotal0 += lineSubtotal;
      }
      acc.totalDescuento += lineDiscount;
      acc.iva += lineSubtotal * rate;
      acc.total += lineSubtotal + (lineSubtotal * rate);
      return acc;
    },
    { subtotal15: 0, subtotal0: 0, totalDescuento: 0, iva: 0, total: 0 }
  );

  // ─────────────────────────────────────────────────────────────────────────
  // EMISIÓN DE FACTURA
  // ─────────────────────────────────────────────────────────────────────────
  const handleEmitInvoice = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (
      !clientName.trim() ||
      !clientRuc.trim() ||
      !clientDireccion.trim() ||
      !clientCorreo.trim()
    ) {
      alert("Por favor seleccione o complete un cliente antes de emitir.");
      return;
    }

    if (cart.length === 0) {
      alert("El carrito está vacío. Agregue productos antes de emitir la factura.");
      return;
    }

    const fechaActual = new Date();
    const dia = String(fechaActual.getDate()).padStart(2, "0");
    const mes = String(fechaActual.getMonth() + 1).padStart(2, "0");
    const anio = fechaActual.getFullYear();
    const fechaEmisionStr = `${dia}/${mes}/${anio}`;

    const totalImpuestosMap: { [key: string]: { baseImponible: number; valor: number; tarifa: number } } = {};

    const detallesPayload = cart.map((item) => {
      const rate = getIvaRate(item.codigoPorcentaje);
      const lineBase = item.precioUnitario * item.cantidad;
      const lineDiscount = item.descuento || 0;
      const lineSubtotal = Math.max(0, lineBase - lineDiscount);
      const lineIva = lineSubtotal * rate;
      const tarifa = rate * 100;

      const taxKey = item.codigoPorcentaje;
      if (!totalImpuestosMap[taxKey]) {
        totalImpuestosMap[taxKey] = { baseImponible: 0, valor: 0, tarifa };
      }
      totalImpuestosMap[taxKey].baseImponible += lineSubtotal;
      totalImpuestosMap[taxKey].valor += lineIva;

      return {
        codigoPrincipal: item.codigoPrincipal,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        descuento: lineDiscount,
        precioTotalSinImpuesto: parseFloat(lineSubtotal.toFixed(2)),
        impuestos: [
          {
            codigo: "2", // Código 2 = IVA
            codigoPorcentaje: item.codigoPorcentaje,
            tarifa: tarifa,
            baseImponible: parseFloat(lineSubtotal.toFixed(2)),
            valor: parseFloat(lineIva.toFixed(2)),
          },
        ],
      };
    });

    const totalImpuestosPayload = Object.keys(totalImpuestosMap).map((key) => {
      const tax = totalImpuestosMap[key];
      return {
        codigo: "2",
        codigoPorcentaje: key,
        baseImponible: parseFloat(tax.baseImponible.toFixed(2)),
        tarifa: tax.tarifa,
        valor: parseFloat(tax.valor.toFixed(2)),
      };
    });

    const facturaPayload = {
      infoTributaria: {
        ambiente: "1",
        tipoEmision: "1",
        razonSocial: "EMPRESA PRUEBA S.A.",
        nombreComercial: "POS INTEGRADO SRI",
        ruc: "1792945678001",
        codDoc: "01",
        estab: "001",
        ptoEmi: "001",
        secuencial: String(invoices.length + 1).padStart(9, "0"),
        dirMatriz: "Av. de los Shyris N34-102 y Holanda, Quito",
      },
      infoFactura: {
        fechaEmision: fechaEmisionStr,
        dirEstablecimiento: "Av. de los Shyris N34-102 y Holanda",
        obligadoContabilidad: "NO",
        tipoIdentificacionComprador: clientTipoIdentificacion,
        razonSocialComprador: clientName.trim().toUpperCase(),
        identificacionComprador: clientRuc.trim(),
        direccionComprador: clientDireccion.trim(),
        correoComprador: clientCorreo.trim(),
        totalSinImpuestos: parseFloat((totals.subtotal15 + totals.subtotal0).toFixed(2)),
        totalDescuento: parseFloat(totals.totalDescuento.toFixed(2)),
        totalConImpuestos: parseFloat(totals.total.toFixed(2)),
        propina: 0.0,
        moneda: "DOLAR",
        formaPago: paymentMethod,
        pagos: [
          {
            formaPago: paymentMethod,
            total: parseFloat(totals.total.toFixed(2)),
            plazo: "0",
            unidadTiempo: "dias",
          },
        ],
        totalImpuesto: totalImpuestosPayload,
      },
      detalles: detallesPayload,
    };

    console.log("=== SRI FACTURA PAYLOAD GENERADO ===");
    console.log(JSON.stringify(facturaPayload, null, 2));

    const productsSummary = cart
      .map((i) => `${i.descripcion} x${i.cantidad}`)
      .join(", ");

    const avatarIndex = Math.floor(Math.random() * 5) + 17;

    const newInvoice = {
      id: Date.now(),
      user: {
        image: `/images/user/user-${avatarIndex}.jpg`,
        name: clientName.trim(),
        role: `RUC: ${clientRuc.trim()}`,
      },
      projectName: `Factura - ${productsSummary}`,
      team: {
        images: ["/images/user/user-22.jpg", "/images/user/user-23.jpg", "/images/user/user-24.jpg"],
      },
      budget: `$${totals.total.toFixed(2)}`,
      status: "Autorizado",
    };

    const updatedInvoices = [newInvoice, ...invoices];
    setInvoices(updatedInvoices);
    localStorage.setItem("pos_invoices", JSON.stringify(updatedInvoices));

    setCart([]);
    handleConsumidorFinal();

    setSuccessMessage(`¡Factura emitida y autorizada por el SRI con éxito para ${newInvoice.user.name}!`);
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER JSX
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <PageMeta
        title="Terminal POS Minimalista | Facturación SRI"
        description="Punto de Venta moderno, minimalista y despejado integrado con el SRI (Ecuador) y cálculo automático del 15% de IVA."
      />
      <PageBreadcrumb pageTitle="Terminal POS y Facturación SRI" />

      {/* ── CABECERA DE PESTAÑAS (NAVEGACIÓN ULTRA LIMPIA) ── */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="inline-flex rounded-xl bg-gray-150 p-1 dark:bg-gray-800 border dark:border-gray-700">
          <button
            onClick={() => setActiveTab("pos")}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === "pos" ? "bg-white dark:bg-gray-900 text-brand-500 shadow-sm" : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"}`}
          >
            {/* SVG Icono Carrito */}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Terminal de Ventas
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === "history" ? "bg-white dark:bg-gray-900 text-brand-500 shadow-sm" : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"}`}
          >
            {/* SVG Icono Historial / Reporte */}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Historial de Ventas
          </button>
        </div>

        {activeTab === "pos" && (
          <div className="flex gap-2">
            <button
              onClick={handleConsumidorFinal}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 font-semibold rounded-xl text-sm border dark:border-gray-700 transition shadow-3xs"
            >
              {/* SVG Icono Consumidor Final */}
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Consumidor Final
            </button>
            <button
              onClick={() => {
                setClientModalTab("search");
                setIsClientModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl text-sm shadow-sm hover:shadow-md transition"
            >
              {/* SVG Icono Lupa */}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Buscar/Crear Cliente
            </button>
          </div>
        )}
      </div>

      {successMessage && (
        <div className="mb-6 rounded-2xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/40 px-5 py-4 text-green-800 dark:text-green-400 text-sm font-medium shadow-sm transition-all animate-fade-in flex items-center gap-2.5">
          {/* SVG Icono Check Éxito */}
          <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      {activeTab === "pos" ? (
        /* ─────────────────────────────────────────────────────────────────────
           VISTA POS: MÁXIMA LIMPIEZA VISUAL (UNA SOLA COLUMNA CENTRADA)
           ───────────────────────────────────────────────────────────────────── */
        <div className="max-w-4xl mx-auto space-y-6">
          <ComponentCard title="Caja POS — Registro de Transacción">
            <div className="space-y-6">

              {/* ── SECCIÓN CLIENTE ACTIVO (ESTILO TARJETA DE RESUMEN PREMIUM) ── */}
              <div className="p-4 rounded-2xl bg-gray-25 dark:bg-gray-900 border dark:border-gray-800 flex items-center justify-between flex-wrap gap-4 shadow-2xs">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-500 flex items-center justify-center shadow-xs">
                    {/* SVG Icono Usuario */}
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-800 dark:text-white text-base">
                        {clientName}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-semibold">
                        {clientTipoIdentificacion === "04" ? "RUC" : clientTipoIdentificacion === "05" ? "Cédula" : clientTipoIdentificacion === "06" ? "Pasaporte" : "Cons. Final"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      Doc: <span className="font-semibold">{clientRuc}</span> • Dir: <span className="font-semibold">{clientDireccion}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setClientModalTab("search");
                      setIsClientModalOpen(true);
                    }}
                    className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 text-xs font-semibold shadow-xs transition"
                  >
                    {/* SVG Icono Lapiz */}
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-2.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Cambiar
                  </button>
                  {clientRuc !== "9999999999999" && (
                    <button
                      onClick={handleConsumidorFinal}
                      className="px-3.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 text-xs font-semibold transition"
                    >
                      Restablecer CF
                    </button>
                  )}
                </div>
              </div>

              {/* ── BOTÓN ENORME Y PREMIUM: AGREGAR PRODUCTO AL COMPROBANTE ── */}
              <div className="flex justify-center py-2">
                <button
                  onClick={() => {
                    setProductQuery("");
                    setIsProductModalOpen(true);
                  }}
                  className="group flex items-center justify-center gap-3 px-8 py-4.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-base shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  {/* SVG Icono Mas */}
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Agregar Producto a la Venta
                </button>
              </div>

              {/* ── TABLA DE DETALLES DEL COMPROBANTE ── */}
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-gray-800 text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-wider">
                      <th className="pb-3 text-left">Código / Descripción</th>
                      <th className="pb-3 text-right">Precio Unit.</th>
                      <th className="pb-3 text-center">Cant.</th>
                      <th className="pb-3 text-right">Desc. ($)</th>
                      <th className="pb-3 text-right">Subtotal</th>
                      <th className="pb-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-400 dark:text-gray-500 font-medium">
                          <div className="flex justify-center mb-3">
                            {/* SVG Carrito grande vacío */}
                            <svg className="w-12 h-12 text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          El carrito de ventas está vacío.<br />Haz clic en el botón de arriba para registrar productos.
                        </td>
                      </tr>
                    ) : (
                      cart.map((i) => {
                        const lineBase = i.precioUnitario * i.cantidad;
                        const lineDiscount = i.descuento || 0;
                        const lineSubtotal = Math.max(0, lineBase - lineDiscount);

                        return (
                          <tr key={i.codigoPrincipal} className="border-b dark:border-gray-800 align-middle hover:bg-gray-25/40 dark:hover:bg-gray-800/10 transition-colors">
                            <td className="py-4">
                              <div className="font-bold text-gray-800 dark:text-white">{i.descripcion}</div>
                              <div className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">{i.codigoPrincipal}</div>
                            </td>
                            <td className="py-4 text-right font-medium text-gray-800 dark:text-gray-200">
                              ${i.precioUnitario.toFixed(2)}
                            </td>
                            <td className="py-4 text-center">
                              <div className="inline-flex items-center border dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800 shadow-3xs">
                                <button
                                  type="button"
                                  onClick={() => changeQty(i.codigoPrincipal, i.cantidad - 1)}
                                  className="px-3 py-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 font-extrabold text-gray-500 dark:text-gray-400 transition"
                                >
                                  −
                                </button>
                                <span className="px-3 py-1.5 font-bold text-sm text-gray-800 dark:text-white">
                                  {i.cantidad}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => changeQty(i.codigoPrincipal, i.cantidad + 1)}
                                  className="px-3 py-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 font-extrabold text-gray-500 dark:text-gray-400 transition"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="py-4 text-right">
                              <div className="inline-flex justify-end items-center">
                                <span className="text-gray-400 mr-1">$</span>
                                <input
                                  type="number"
                                  value={i.descuento === 0 ? "" : i.descuento}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setCart((c) =>
                                      c.map((item) =>
                                        item.codigoPrincipal === i.codigoPrincipal
                                          ? { ...item, descuento: Math.max(0, val) }
                                          : item
                                      )
                                    );
                                  }}
                                  placeholder="0.00"
                                  className="h-9 w-18 text-right px-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent text-sm text-gray-800 dark:text-white focus:border-brand-500 focus:outline-hidden dark:bg-gray-900 transition-all font-semibold"
                                  min="0"
                                  step="0.01"
                                />
                              </div>
                            </td>
                            <td className="py-4 text-right font-bold text-gray-800 dark:text-white">
                              ${lineSubtotal.toFixed(2)}
                            </td>
                            <td className="py-4 text-right">
                              <button
                                type="button"
                                onClick={() => removeFromCart(i.codigoPrincipal)}
                                className="h-9 w-9 rounded-xl border border-red-200 dark:border-red-950/40 text-red-500 hover:text-white hover:bg-red-500 hover:border-red-500 flex items-center justify-center transition-all shadow-3xs"
                                title="Quitar item"
                              >
                                {/* SVG Basura */}
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* ── TOTALES Y SECCIÓN DE EMISIÓN DE FACTURA ── */}
              {cart.length > 0 && (
                <div className="pt-6 border-t dark:border-gray-800 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">

                    {/* Caja de Forma de Pago y Tributación */}
                    <div className="md:col-span-6 space-y-4">
                      <div>
                        <Label>Forma de Pago del SRI</Label>
                        <Select
                          options={[
                            { value: "01", label: "01 - Sin utilización del sistema financiero (Efectivo)" },
                            { value: "19", label: "19 - Tarjeta de Crédito" },
                            { value: "20", label: "20 - Otros con utilización del sistema financiero (Transferencia)" },
                          ]}
                          onChange={(v: any) => setPaymentMethod(v)}
                          defaultValue={paymentMethod}
                        />
                      </div>
                      <div className="flex gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/30 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        {/* SVG Advertencia */}
                        <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>
                          <strong>Nota SRI</strong>: De acuerdo a la Ficha Técnica de Facturación Electrónica en Ecuador, los impuestos del IVA y descuentos se desglosarán individualmente por ítem en el payload final `facturaPayload`.
                        </span>
                      </div>
                    </div>

                    {/* Desglose de importes */}
                    <div className="md:col-span-6 rounded-2xl bg-gray-25 dark:bg-gray-900 border dark:border-gray-800 p-5 space-y-3 shadow-2xs">
                      <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>Subtotal IVA 15%</span>
                        <span className="font-semibold text-gray-800 dark:text-white">${totals.subtotal15.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>Subtotal IVA 0%</span>
                        <span className="font-semibold text-gray-800 dark:text-white">${totals.subtotal0.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>IVA (15%)</span>
                        <span className="font-semibold text-gray-800 dark:text-white">${totals.iva.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>Descuentos Aplicados</span>
                        <span className="font-semibold text-red-500">-${totals.totalDescuento.toFixed(2)}</span>
                      </div>
                      <div className="pt-3 border-t dark:border-gray-800 flex justify-between items-baseline">
                        <span className="font-bold text-gray-800 dark:text-white text-base">Total Comprobante</span>
                        <span className="text-3xl font-extrabold text-brand-500">
                          ${totals.total.toFixed(2)}
                        </span>
                      </div>
                    </div>

                  </div>

                  <div className="mt-6">
                    <Button
                      onClick={() => handleEmitInvoice()}
                      className="w-full py-4 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all"
                    >
                      Emitir y Generar XML SRI (Factura Electrónica)
                    </Button>
                  </div>
                </div>
              )}

            </div>
          </ComponentCard>
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────────────
           VISTA DEL HISTORIAL: DESPEJADA Y EN PESTAÑA APARTE
           ───────────────────────────────────────────────────────────────────── */
        <ComponentCard title="Historial de Comprobantes Emitidos (SRI)">
          <BasicTableOne invoices={invoices} />
        </ComponentCard>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
         [MODAL] CATÁLOGO DE PRODUCTOS (INTERACTIVO, RÁPIDO CON BUSCADOR)
         ─────────────────────────────────────────────────────────────────────── */}
      <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} className="max-w-[700px]">
        <div className="p-6">
          <div className="flex items-center gap-2.5 border-b dark:border-gray-850 pb-3 mb-4">
            {/* SVG Icono Caja de Productos */}
            <svg className="w-5.5 h-5.5 text-brand-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
              Catálogo de Productos
            </h3>
          </div>

          <div className="space-y-4">
            {/* Buscador predictivo */}
            <div>
              <Input
                id="productModalSearch"
                value={productQuery}
                onChange={(e: any) => setProductQuery(e.target.value)}
                placeholder="Escribe descripción o código de barras para filtrar..."
                className="w-full h-11"
              />
            </div>

            {/* Pestañas de categorías IVA */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setCategory("all")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${category === "all" ? "bg-white dark:bg-gray-900 text-brand-500 shadow-xs" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"}`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setCategory("iva15")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${category === "iva15" ? "bg-white dark:bg-gray-900 text-brand-500 shadow-xs" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"}`}
              >
                Tarifa IVA 15%
              </button>
              <button
                type="button"
                onClick={() => setCategory("iva0")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${category === "iva0" ? "bg-white dark:bg-gray-900 text-brand-500 shadow-xs" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"}`}
              >
                Tarifa IVA 0%
              </button>
            </div>

            {/* Listado en cuadrícula rápida */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
              {filteredProducts.length === 0 ? (
                <div className="col-span-2 text-center py-8 text-gray-400 font-medium">
                  Ningún producto coincide con el filtro.
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const inCart = cart.find(item => item.codigoPrincipal === p.codigoPrincipal);
                  return (
                    <button
                      key={p.codigoPrincipal}
                      onClick={() => addToCart(p)}
                      className="group text-left p-3.5 border dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 hover:border-brand-300 dark:hover:border-brand-900 hover:shadow-xs transition-all flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-sm text-gray-800 dark:text-white line-clamp-1 group-hover:text-brand-500 transition-colors">
                          {p.descripcion}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">{p.codigoPrincipal}</div>
                        <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-[10px] font-bold text-gray-500 dark:text-gray-400">
                          IVA: {p.codigoPorcentaje === "4" ? "15%" : "0%"}
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="text-base font-extrabold text-gray-800 dark:text-gray-200">
                          ${p.precioUnitario.toFixed(2)}
                        </div>
                        {inCart && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-brand-500 text-[10px] font-black text-white">
                            x{inCart.cantidad}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex justify-end border-t dark:border-gray-850 mt-5 pt-4">
            <Button
              onClick={() => setIsProductModalOpen(false)}
              className="bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl px-6 py-2.5 transition"
            >
              Listo / Volver a Caja
            </Button>
          </div>
        </div>
      </Modal>

      {/* ───────────────────────────────────────────────────────────────────────
         [MODAL] GESTIÓN DE CLIENTES (BÚSQUEDA Y CREACIÓN)
         ─────────────────────────────────────────────────────────────────────── */}
      <Modal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} className="max-w-[550px]">
        <div className="p-6">
          <div className="flex items-center gap-2.5 border-b dark:border-gray-850 pb-3 mb-4">
            {/* SVG Icono Usuario / Cliente */}
            <svg className="w-5.5 h-5.5 text-brand-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
              Gestión de Clientes
            </h3>
          </div>

          {/* Mini-pestañas del modal */}
          <div className="flex gap-4 mb-4 border-b dark:border-gray-800 pb-2">
            <button
              onClick={() => setClientModalTab("search")}
              className={`flex items-center gap-1.5 pb-2 px-1 text-sm font-bold border-b-2 transition ${clientModalTab === "search" ? "border-brand-500 text-brand-500" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              {/* SVG Buscar */}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Buscar Registrado
            </button>
            <button
              onClick={() => setClientModalTab("create")}
              className={`flex items-center gap-1.5 pb-2 px-1 text-sm font-bold border-b-2 transition ${clientModalTab === "create" ? "border-brand-500 text-brand-500" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              {/* SVG Agregar */}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Registrar Nuevo
            </button>
          </div>

          {clientModalTab === "search" ? (
            /* VISTA: BÚSQUEDA DE CLIENTES EXISTENTES */
            <div className="space-y-4">
              <Input
                value={clientSearchQuery}
                onChange={(e: any) => setClientSearchQuery(e.target.value)}
                placeholder="Busca por nombre, RUC o cédula..."
                className="w-full"
              />

              <div className="text-[11px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-1 mb-2">
                {clientSearchQuery.trim() === "" ? "Últimos Clientes Registrados" : `Resultados de Búsqueda (${filteredClients.length})`}
              </div>

              <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                {filteredClients.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-sm leading-relaxed">
                    Ningún cliente coincide con la búsqueda.<br />
                    Haz clic en **"Registrar Nuevo"** para registrar uno.
                  </div>
                ) : (
                  filteredClients.map((c) => (
                    <button
                      key={c.identificacion}
                      onClick={() => handleSelectClient(c)}
                      className="w-full text-left p-3 border dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/5 transition-all flex justify-between items-center shadow-3xs"
                    >
                      <div>
                        <div className="font-bold text-sm text-gray-800 dark:text-white">
                          {c.razonSocial}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          ID: <span className="font-semibold">{c.identificacion}</span> • Dir: {c.direccion}
                        </div>
                      </div>
                      <span className="text-brand-500 font-bold text-xs flex items-center gap-1">
                        Seleccionar
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* VISTA: FORMULARIO DE NUEVO CLIENTE */
            <div className="grid grid-cols-1 gap-3.5">
              <div>
                <Label>Tipo Identificación</Label>
                <Select
                  options={[
                    { value: "05", label: "Cédula (Persona Natural)" },
                    { value: "04", label: "RUC (Sociedad / Empresa / Natural RUC)" },
                    { value: "06", label: "Pasaporte" },
                  ]}
                  onChange={(v: any) => setNewClient({ ...newClient, tipoIdentificacion: v as any })}
                  defaultValue={newClient.tipoIdentificacion}
                />
              </div>
              <div>
                <Label>Identificación</Label>
                <Input
                  value={newClient.identificacion}
                  onChange={(e: any) => setNewClient({ ...newClient, identificacion: e.target.value })}
                  placeholder="Ej. 1729876543 o 1792345678001"
                />
              </div>
              <div>
                <Label>Nombre / Razón Social</Label>
                <Input
                  value={newClient.razonSocial}
                  onChange={(e: any) => setNewClient({ ...newClient, razonSocial: e.target.value })}
                  placeholder="Ej. Juan Andrés Pérez"
                />
              </div>
              <div>
                <Label>Correo Electrónico *</Label>
                <Input
                  value={newClient.correo}
                  onChange={(e: any) => setNewClient({ ...newClient, correo: e.target.value })}
                  placeholder="Ej. correo@sri.gob.ec"
                />
              </div>
              <div>
                <Label>Dirección Física *</Label>
                <Input
                  value={newClient.direccion}
                  onChange={(e: any) => setNewClient({ ...newClient, direccion: e.target.value })}
                  placeholder="Ej. Av. de los Granados N45 y Eloy Alfaro"
                />
              </div>

              <div className="flex justify-end gap-2 border-t dark:border-gray-850 pt-4 mt-3">
                <Button
                  onClick={() => setIsClientModalOpen(false)}
                  className="bg-gray-100 hover:bg-gray-250 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={saveNewClient}
                  className="bg-brand-500 text-white hover:bg-brand-600 font-bold rounded-xl shadow-sm transition"
                >
                  Guardar y Seleccionar
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
