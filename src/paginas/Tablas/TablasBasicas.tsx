import { useState, useEffect } from "react";
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
// HELPER: Devuelve la tasa de IVA según el código de porcentaje del SRI.
//  "4" = IVA 15% (tarifa general vigente en Ecuador desde mayo 2024)
//  Cualquier otro código = IVA 0% (servicios exentos, medicamentos, etc.)
// ─────────────────────────────────────────────────────────────────────────────
const getIvaRate = (code: string): number => (code === "4" ? 0.15 : 0);

// ─────────────────────────────────────────────────────────────────────────────
// DATOS INICIALES: Catálogo de productos predeterminados.
// Se usan la primera vez que el usuario abre el sistema (localStorage vacío).
// Cada producto tiene: value (ID único), label (nombre visible), precio base
// sin IVA, codigoPorcentaje (para calcular IVA) y code (código de barras).
// ─────────────────────────────────────────────────────────────────────────────
const defaultProducts = [
  { value: "cafeloja",    label: "Café de Loja Premium",          description: "Café arábigo orgánico de altura, tueste medio",           price: 5.65,  codigoPorcentaje: "4", code: "PROD-CAFE001" },
  { value: "chocolate",   label: "Chocolate Pacari Organic",       description: "Chocolate negro 72% cacao, origen Esmeraldas",            price: 4.17,  codigoPorcentaje: "4", code: "PROD-CHOC002" },
  { value: "sombrero",    label: "Sombrero de Paja Toquilla",      description: "Artesanía ecuatoriana certificada, tejido fino",          price: 39.13, codigoPorcentaje: "4", code: "PROD-SOMB003" },
  { value: "consultoria", label: "Consultoría Tributaria (hora)",  description: "Asesoría profesional en materia fiscal y SRI",            price: 50.00, codigoPorcentaje: "0", code: "PROD-CONS004" },
];

// ─────────────────────────────────────────────────────────────────────────────
// DATOS INICIALES: Historial de facturas de ejemplo.
// Se cargan la primera vez para que la tabla de comprobantes no aparezca vacía.
// ─────────────────────────────────────────────────────────────────────────────
const defaultInvoices = [
  {
    id: 1,
    user: { image: "/images/user/user-17.jpg", name: "Lindsey Curtis",   role: "RUC: 1792345678001" },
    projectName: "Factura - Sombrero de Paja Toquilla x 2",
    team: { images: ["/images/user/user-22.jpg", "/images/user/user-23.jpg", "/images/user/user-24.jpg"] },
    budget: "$103.50",
    status: "Autorizado",
  },
  {
    id: 2,
    user: { image: "/images/user/user-18.jpg", name: "Kaiya George",     role: "RUC: 0991234567001" },
    projectName: "Factura - Café de Loja Premium x 5",
    team: { images: ["/images/user/user-25.jpg", "/images/user/user-26.jpg"] },
    budget: "$37.38",
    status: "Pendiente",
  },
  {
    id: 3,
    user: { image: "/images/user/user-17.jpg", name: "Zain Geidt",       role: "RUC: 0103456789001" },
    projectName: "Factura - Laptop (Servicio Técnico) x 1",
    team: { images: ["/images/user/user-27.jpg"] },
    budget: "$97.75",
    status: "Autorizado",
  },
  {
    id: 4,
    user: { image: "/images/user/user-20.jpg", name: "Abram Schleifer",  role: "RUC: 1801234567001" },
    projectName: "Factura - Chocolate Pacari Organic x 10",
    team: { images: ["/images/user/user-28.jpg", "/images/user/user-29.jpg", "/images/user/user-30.jpg"] },
    budget: "$55.20",
    status: "Anulado",
  },
  {
    id: 5,
    user: { image: "/images/user/user-21.jpg", name: "Carla George",     role: "RUC: 1729876543001" },
    projectName: "Factura - Sombrero de Paja Toquilla x 1",
    team: { images: ["/images/user/user-31.jpg", "/images/user/user-32.jpg", "/images/user/user-33.jpg"] },
    budget: "$51.75",
    status: "Autorizado",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL: BasicTables
// Funciona como una Terminal POS completa con emisión de comprobantes SRI.
// ─────────────────────────────────────────────────────────────────────────────
export default function BasicTables() {

  // ── ESTADO: Catálogo de productos (cargado desde localStorage) ──────────
  const [products, setProducts] = useState<any[]>([]);

  // ── ESTADO: Historial de facturas emitidas (persiste en localStorage) ───
  const [invoices, setInvoices] = useState<any[]>([]);

  // ── ESTADO: Datos del cliente activo en la venta ─────────────────────────
  const [clientName, setClientName] = useState("");
  const [clientRuc, setClientRuc]   = useState("");

  // ── ESTADO: Carrito de compras — array de productos con { ...producto, qty }
  // Es la fuente de verdad de la venta actual. Cada vez que el cajero
  // agrega un producto desde el grid, se añade o incrementa aquí.
  const [cart, setCart] = useState<any[]>([]);

  // ── ESTADO: Texto de búsqueda para filtrar el catálogo de productos ──────
  const [productQuery, setProductQuery] = useState("");

  // ── ESTADO: Categoría de IVA seleccionada para filtrar el catálogo ───────
  const [category, setCategory] = useState<string>("all");

  // ── ESTADO: Lista de clientes registrados (persiste en localStorage) ─────
  const [clients, setClients] = useState<any[]>(() => {
    const stored = localStorage.getItem("pos_clients");
    return stored ? JSON.parse(stored) : [];
  });

  // ── ESTADO: Controla la visibilidad del modal de nuevo cliente ───────────
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  // ── ESTADO: Datos del formulario para registrar un nuevo cliente ─────────
  const [newClient, setNewClient] = useState({ ruc: "", name: "", email: "", address: "" });

  // ── ESTADO: Forma de pago seleccionada (código SRI: 01=Efectivo, etc.) ───
  const [paymentMethod, setPaymentMethod] = useState("01");

  // ── ESTADO: Mensaje de éxito temporal tras emitir una factura ───────────
  const [successMessage, setSuccessMessage] = useState("");

  // ─────────────────────────────────────────────────────────────────────────
  // EFECTO: Carga inicial de datos desde localStorage.
  // Ejecuta una sola vez al montar el componente (array de dependencias []).
  // Si no hay datos guardados, carga los productos/facturas de ejemplo.
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Cargar catálogo de productos
    const storedProducts = localStorage.getItem("pos_products");
    if (storedProducts) {
      try { setProducts(JSON.parse(storedProducts)); }
      catch { setProducts(defaultProducts); }
    } else {
      localStorage.setItem("pos_products", JSON.stringify(defaultProducts));
      setProducts(defaultProducts);
    }

    // Cargar historial de facturas
    const storedInvoices = localStorage.getItem("pos_invoices");
    if (storedInvoices) {
      try { setInvoices(JSON.parse(storedInvoices)); }
      catch { setInvoices(defaultInvoices); }
    } else {
      localStorage.setItem("pos_invoices", JSON.stringify(defaultInvoices));
      setInvoices(defaultInvoices);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // EFECTO: Sincroniza la lista de clientes con localStorage cada vez
  // que cambia, para que persista entre sesiones del navegador.
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem("pos_clients", JSON.stringify(clients));
  }, [clients]);

  // ─────────────────────────────────────────────────────────────────────────
  // FIX ✅ — FUNCIÓN: handleEmitInvoice
  // Valida y procesa el CARRITO completo para generar una factura.
  // ANTES: usaba `selectedProductCode` y `quantity` (un solo producto).
  // AHORA: usa el array `cart` y la constante `totals` (multi-producto).
  //
  // Flujo:
  //  1. Valida que haya cliente y ítems en el carrito.
  //  2. Genera el resumen de la factura usando los totales del SRI.
  //  3. Agrega la factura al historial y la persiste en localStorage.
  //  4. Limpia el carrito y los datos del cliente (listo para nueva venta).
  //  5. Muestra mensaje de éxito por 5 segundos.
  // ─────────────────────────────────────────────────────────────────────────
  const handleEmitInvoice = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Validación 1: El cliente debe estar identificado
    if (!clientName.trim() || !clientRuc.trim()) {
      alert("Por favor ingrese el RUC/Cédula y el Nombre del cliente antes de emitir.");
      return;
    }

    // Validación 2: El carrito no puede estar vacío
    if (cart.length === 0) {
      alert("El carrito está vacío. Agregue al menos un producto antes de emitir la factura.");
      return;
    }

    // Construir el resumen de productos para el nombre de la factura
    // Ejemplo: "Café de Loja x2, Sombrero x1"
    const productsSummary = cart
      .map((i) => `${i.label} x${i.qty}`)
      .join(", ");

    // Elegir un avatar aleatorio del banco de imágenes disponibles
    const avatarIndex = Math.floor(Math.random() * 5) + 17; // 17..21

    // Construir el objeto de factura usando los TOTALES del SRI (calculados en `totals`)
    const newInvoice = {
      id: Date.now(),
      user: {
        image: `/images/user/user-${avatarIndex}.jpg`,
        name:  clientName.trim(),
        role:  `RUC: ${clientRuc.trim()}`,
      },
      projectName: `Factura - ${productsSummary}`,
      team: {
        images: ["/images/user/user-22.jpg", "/images/user/user-23.jpg", "/images/user/user-24.jpg"],
      },
      // ✅ Se usa `totals.total` que ya incluye subtotales + IVA de TODOS los ítems
      budget: `$${totals.total.toFixed(2)}`,
      status: "Autorizado",
    };

    // Agregar al historial y persistir en localStorage
    const updatedInvoices = [newInvoice, ...invoices];
    setInvoices(updatedInvoices);
    localStorage.setItem("pos_invoices", JSON.stringify(updatedInvoices));

    // ✅ Limpiar el carrito y los datos del cliente para la próxima venta
    setCart([]);
    setClientName("");
    setClientRuc("");

    // Mostrar mensaje de éxito temporal (5 segundos)
    setSuccessMessage(`¡Factura emitida y autorizada por el SRI con éxito para ${newInvoice.user.name}!`);
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // FUNCIÓN: addToCart
  // Agrega un producto al carrito. Si el producto ya existe (mismo `value`),
  // incrementa su cantidad en 1 en lugar de duplicar la entrada.
  // ─────────────────────────────────────────────────────────────────────────
  const addToCart = (product: any) => {
    setCart((c) => {
      const existing = c.find((i) => i.value === product.value);
      if (existing) {
        // Producto ya en carrito → incrementar cantidad
        return c.map((i) => (i.value === product.value ? { ...i, qty: i.qty + 1 } : i));
      }
      // Producto nuevo → agregar al inicio del carrito con qty = 1
      return [{ ...product, qty: 1 }, ...c];
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // FUNCIÓN: removeFromCart
  // Elimina completamente un ítem del carrito usando su `value` como clave.
  // ─────────────────────────────────────────────────────────────────────────
  const removeFromCart = (value: string) => {
    setCart((c) => c.filter((i) => i.value !== value));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // FUNCIÓN: changeQty
  // Actualiza la cantidad de un ítem en el carrito.
  // El mínimo permitido es 1 (Math.max evita que baje de 1).
  // ─────────────────────────────────────────────────────────────────────────
  const changeQty = (value: string, qty: number) => {
    setCart((c) => c.map((i) => (i.value === value ? { ...i, qty: Math.max(1, qty) } : i)));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // FILTRADO DE PRODUCTOS: Aplica búsqueda por texto y filtro por categoría IVA.
  // Se recalcula automáticamente cada vez que cambia `productQuery` o `category`.
  // ─────────────────────────────────────────────────────────────────────────
  const filteredProducts = products.filter((p) => {
    const q = productQuery.trim().toLowerCase();
    // Buscar por nombre, código interno o valor
    const matchesQuery =
      !q ||
      p.label.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.value.toLowerCase().includes(q);
    // Filtrar por categoría de IVA
    const matchesCategory =
      category === "all" ||
      (category === "iva15" && getIvaRate(p.codigoPorcentaje || "4") > 0) ||
      (category === "iva0"  && getIvaRate(p.codigoPorcentaje || "4") === 0);
    return matchesQuery && matchesCategory;
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GESTIÓN DE CLIENTES: Autocompletado por RUC y alta de nuevo cliente
  // ─────────────────────────────────────────────────────────────────────────

  // Al ingresar el RUC, busca si ya existe el cliente y autocompleta el nombre
  const handleRucInput = (ruc: string) => {
    setClientRuc(ruc);
    const found = clients.find((c) => c.ruc === ruc);
    if (found) setClientName(found.name);
  };

  // Rellena los datos del cliente con "Consumidor Final" (RUC genérico SRI)
  const handleConsumidorFinal = () => {
    setClientRuc("9999999999999");
    setClientName("CONSUMIDOR FINAL");
  };

  // Abre el modal de registro con el formulario en blanco
  const openNewClient = () => {
    setNewClient({ ruc: "", name: "", email: "", address: "" });
    setIsClientModalOpen(true);
  };

  // Guarda el nuevo cliente en la lista y lo selecciona automáticamente
  const saveNewClient = () => {
    if (!newClient.ruc || !newClient.name) return alert("RUC y Nombre son obligatorios");
    setClients((c) => [newClient, ...c]);
    setClientRuc(newClient.ruc);
    setClientName(newClient.name);
    setIsClientModalOpen(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // CÁLCULOS SRI: Totales de la venta actual.
  // Se recalcula en cada render cuando `cart` cambia.
  //
  //  • subtotal15 → suma de líneas con IVA 15% (base imponible tarifa 15%)
  //  • subtotal0  → suma de líneas con IVA 0%  (base imponible tarifa 0%)
  //  • iva        → monto total de IVA (subtotal15 × 0.15)
  //  • total      → valor final que paga el cliente (subtotales + IVA)
  // ─────────────────────────────────────────────────────────────────────────
  const totals = cart.reduce(
    (acc, item) => {
      const rate        = getIvaRate(item.codigoPorcentaje || "4");
      const lineSubtotal = item.price * item.qty;
      if (rate > 0) acc.subtotal15 += lineSubtotal;
      else           acc.subtotal0  += lineSubtotal;
      acc.iva   += lineSubtotal * rate;
      acc.total += lineSubtotal + lineSubtotal * rate;
      return acc;
    },
    { subtotal15: 0, subtotal0: 0, iva: 0, total: 0 }
  );

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Meta SEO de la página */}
      <PageMeta
        title="Terminal POS y Emisión de Facturas SRI | Dashboard"
        description="Punto de Venta interactivo integrado con comprobantes autorizados y cálculos del 15% de IVA para el SRI en Ecuador."
      />
      <PageBreadcrumb pageTitle="Terminal POS y Facturación SRI" />

      <div className="space-y-6">
        {/* ── SECCIÓN 1: Terminal POS principal ─────────────────────────── */}
        <ComponentCard title="Terminal POS — Ventas Rápidas (Una sola vista)">

          {/* Mensaje de éxito flotante tras emitir una factura */}
          {successMessage && (
            <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-green-800 text-sm font-medium">
              ✅ {successMessage}
            </div>
          )}

          <div className="grid grid-cols-12 gap-6">

            {/* ── Columna Izquierda: Catálogo de productos (7/12 = ~58%) ── */}
            <div className="col-span-12 lg:col-span-7">
              <div className="space-y-4">

                {/* Input de búsqueda con autoFocus para escaneo inmediato de códigos de barras */}
                <div>
                  <Label htmlFor="productSearch">Buscar producto / código</Label>
                  {/* autoFocus: el cursor aterriza aquí al abrir la pantalla, listo para escanear */}
                  <Input
                    id="productSearch"
                    autoFocus
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                    placeholder="Escanea el código de barras o escribe nombre / código"
                    className="text-lg h-12"
                  />
                </div>

                {/* Filtros rápidos por categoría de IVA */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setCategory("all")}
                    className={`px-3 py-1 rounded-md ${category === "all" ? "bg-brand-500 text-white" : "bg-gray-100"}`}
                  >
                    Todas
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory("iva15")}
                    className={`px-3 py-1 rounded-md ${category === "iva15" ? "bg-brand-500 text-white" : "bg-gray-100"}`}
                  >
                    IVA 15%
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory("iva0")}
                    className={`px-3 py-1 rounded-md ${category === "iva0" ? "bg-brand-500 text-white" : "bg-gray-100"}`}
                  >
                    IVA 0%
                  </button>
                </div>

                {/* Grid de productos — cada tarjeta es un botón que llama a addToCart() */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-3">
                  {filteredProducts.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => addToCart(p)}
                      className="text-left p-3 border rounded-lg hover:shadow-md bg-white dark:bg-gray-800"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-sm">{p.label}</div>
                          <div className="text-xs text-gray-500">{p.code}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-gray-800">${p.price.toFixed(2)}</div>
                          <div className="text-xs text-gray-400">Stock: 10</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

              </div>
            </div>

            {/* ── Columna Derecha: Ticket / Carrito (5/12 = ~42%) ────────── */}
            <div className="col-span-12 lg:col-span-5">
              {/*
                UX ✅: Altura mejorada — h-auto en móvil, altura fija en desktop.
                max-h-[800px] evita que el ticket crezca demasiado en pantallas altas.
              */}
              <div className="flex flex-col h-auto lg:h-[75vh] max-h-[800px] bg-white dark:bg-gray-900 rounded-xl border p-4">

                {/* ── Bloque del cliente ────────────────────────────────── */}
                <div className="mb-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Cliente</h3>
                    <div className="flex gap-2">
                      {/* Atajo: rellena con datos de Consumidor Final (SRI) */}
                      <button
                        type="button"
                        onClick={handleConsumidorFinal}
                        className="px-2 py-1 bg-gray-100 rounded text-sm"
                      >
                        Consumidor Final
                      </button>
                      {/* Abre modal para registrar un cliente nuevo */}
                      <button
                        type="button"
                        onClick={openNewClient}
                        className="px-2 py-1 bg-brand-500 text-white rounded text-sm"
                      >
                        + Nuevo
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <Label>RUC / Cédula</Label>
                      {/* Al escribir el RUC, se busca el cliente y se autocompleta el nombre */}
                      <Input value={clientRuc} onChange={(e) => handleRucInput(e.target.value)} placeholder="172..." />
                    </div>
                    <div>
                      <Label>Nombre / Razón</Label>
                      <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Ej. Juan Pérez" />
                    </div>
                  </div>
                </div>

                {/* ── Lista de ítems del carrito ────────────────────────── */}
                {/* overflow-y-auto permite scroll interno cuando hay muchos productos */}
                <div className="flex-1 overflow-y-auto mb-2">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs text-gray-500 sticky top-0 bg-white dark:bg-gray-900">
                      <tr>
                        <th>Producto</th>
                        <th className="text-right">Precio</th>
                        <th className="text-center">Cant.</th>
                        <th className="text-right">Subtotal</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Mensaje vacío cuando no hay ítems en el carrito */}
                      {cart.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-gray-400">
                            No hay ítems en el carrito
                          </td>
                        </tr>
                      )}

                      {/* Renderiza cada ítem del carrito */}
                      {cart.map((i) => (
                        <tr key={i.value} className="align-middle border-b">
                          <td className="py-2">{i.label}</td>
                          <td className="py-2 text-right">${i.price.toFixed(2)}</td>
                          <td className="py-2 text-center">
                            {/*
                              UX ✅: Botones +/- con área de toque más grande (px-3 py-1).
                              Importante para pantallas táctiles (tablets de caja).
                            */}
                            <div className="inline-flex items-center border rounded overflow-hidden">
                              <button
                                onClick={() => changeQty(i.value, i.qty - 1)}
                                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-l"
                              >
                                −
                              </button>
                              <div className="px-3 py-1 font-medium">{i.qty}</div>
                              <button
                                onClick={() => changeQty(i.value, i.qty + 1)}
                                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-r"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="py-2 text-right">${(i.price * i.qty).toFixed(2)}</td>
                          <td className="py-2 text-right">
                            <button
                              onClick={() => removeFromCart(i.value)}
                              className="text-red-500 hover:text-red-700"
                              title="Eliminar del carrito"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ── Totales SRI y forma de pago ──────────────────────── */}
                <div className="mt-2 pt-3 border-t">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {/* Desglose de subtotales e IVA según normativa SRI */}
                    <div>
                      <div className="flex justify-between"><span>Subtotal 15%</span><span>${totals.subtotal15.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>Subtotal 0%</span> <span>${totals.subtotal0.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>IVA</span>          <span>${totals.iva.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>Descuentos</span>   <span>$0.00</span></div>
                    </div>
                    {/* Total final y selector de forma de pago */}
                    <div>
                      <div className="text-right text-xs text-gray-500">Total a Pagar</div>
                      <div className="text-2xl font-bold text-brand-500 text-right">
                        ${totals.total.toFixed(2)}
                      </div>
                      <div className="mt-3">
                        <Label>Forma de Pago</Label>
                        {/* Códigos según tabla de formas de pago SRI Ecuador */}
                        <Select
                          options={[
                            { value: "01", label: "01 - Efectivo" },
                            { value: "19", label: "19 - Tarjeta de Crédito" },
                            { value: "20", label: "20 - Transferencia" },
                          ]}
                          onChange={(v: any) => setPaymentMethod(v)}
                          defaultValue={paymentMethod}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ✅ Botón de emisión: procesa el carrito completo */}
                  <div className="mt-4">
                    <Button
                      className="w-full bg-brand-500 text-white"
                      onClick={() => handleEmitInvoice()}
                    >
                      Emitir Factura
                    </Button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </ComponentCard>

        {/* ── SECCIÓN 2: Historial de comprobantes autorizados ─────────── */}
        <ComponentCard title="Historial de Comprobantes Autorizados (SRI)">
          {/* Tabla que muestra todas las facturas emitidas en la sesión y anteriores */}
          <BasicTableOne invoices={invoices} />
        </ComponentCard>

        {/* ── MODAL: Registro de nuevo cliente ─────────────────────────── */}
        <Modal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)}>
          <div className="p-6 w-[520px]">
            <h3 className="text-lg font-semibold mb-3">Registrar Cliente Nuevo</h3>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label>RUC / Cédula</Label>
                <Input
                  value={newClient.ruc}
                  onChange={(e: any) => setNewClient({ ...newClient, ruc: e.target.value })}
                />
              </div>
              <div>
                <Label>Nombre / Razón Social</Label>
                <Input
                  value={newClient.name}
                  onChange={(e: any) => setNewClient({ ...newClient, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Correo Electrónico</Label>
                <Input
                  value={newClient.email}
                  onChange={(e: any) => setNewClient({ ...newClient, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Dirección</Label>
                <Input
                  value={newClient.address}
                  onChange={(e: any) => setNewClient({ ...newClient, address: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button onClick={() => setIsClientModalOpen(false)} className="bg-gray-100">
                  Cancelar
                </Button>
                <Button onClick={saveNewClient} className="bg-brand-500 text-white">
                  Guardar y Seleccionar
                </Button>
              </div>
            </div>
          </div>
        </Modal>

      </div>
    </>
  );
}
