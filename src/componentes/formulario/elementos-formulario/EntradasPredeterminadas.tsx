/**
 * COMPONENTE: DefaultInputs
 * FUNCIÓN TRIBUTARIA: Formulario de registro de productos/servicios en el catálogo POS,
 * alineado a los campos oficiales del SRI Ecuador:
 *   - codigoPrincipal (auto-generado)
 *   - descripcion (nombre/detalle del producto)
 *   - precioUnitario (SIN IVA, base imponible)
 *   - codigoPorcentaje (tarifa de IVA: 0 = 0%, 4 = 15%)
 */
import { useState } from "react";
import ComponentCard from "../../comunes/TarjetaComponente";
import Label from "../Etiqueta";
import Input from "../entrada/CampoEntrada";
import Select from "../Seleccion";
import Button from "../../ui/boton/Boton";

// Auto-generate a unique código principal (up to 25 chars, alphanumeric)
function generateCodigoPrincipal(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PROD-${timestamp}-${random}`.substring(0, 25);
}

interface DefaultInputsProps {
  onRegister?: () => void;
}

export default function DefaultInputs({ onRegister }: DefaultInputsProps) {
  // React State for SRI product registration
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [codigoPorcentaje, setCodigoPorcentaje] = useState("4"); // Default: 15% IVA
  const [successMessage, setSuccessMessage] = useState("");

  // IVA tax code options as per SRI Ecuador
  const ivaOptions = [
    { value: "4", label: "15% IVA (Código 4) — Tarifa vigente" },
    { value: "0", label: "0% IVA (Código 0) — Exento / No grava" },
  ];

  const handleIvaChange = (value: string) => {
    setCodigoPorcentaje(value);
  };

  // Compute the IVA rate from the code
  const getIvaRate = (code: string): number => {
    return code === "4" ? 0.15 : 0;
  };

  const handleRegister = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!productName.trim()) {
      alert("Por favor, ingrese el nombre del producto o servicio.");
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      alert("Por favor, ingrese un precio unitario válido (sin IVA).");
      return;
    }

    // Default seed products (only used if localStorage is empty)
    const defaultProducts = [
      {
        value: "cafeloja",
        label: "Café de Loja Premium",
        description: "Café arábigo orgánico de altura, tueste medio",
        price: 5.65,
        codigoPorcentaje: "4",
        code: generateCodigoPrincipal(),
      },
      {
        value: "chocolate",
        label: "Chocolate Pacari Organic",
        description: "Chocolate negro 72% cacao, origen Esmeraldas",
        price: 4.17,
        codigoPorcentaje: "4",
        code: generateCodigoPrincipal(),
      },
      {
        value: "sombrero",
        label: "Sombrero de Paja Toquilla",
        description: "Artesanía ecuatoriana certificada, tejido fino",
        price: 39.13,
        codigoPorcentaje: "4",
        code: generateCodigoPrincipal(),
      },
      {
        value: "consultoria",
        label: "Consultoría Tributaria (hora)",
        description: "Asesoría profesional en materia fiscal y SRI",
        price: 50.00,
        codigoPorcentaje: "0",
        code: generateCodigoPrincipal(),
      },
    ];

    const stored = localStorage.getItem("pos_products");
    const currentList = stored ? JSON.parse(stored) : defaultProducts;

    const parsedPrice = parseFloat(parseFloat(price).toFixed(6));
    const autoCode = generateCodigoPrincipal();

    const newProduct = {
      value: autoCode.toLowerCase().replace(/[^a-z0-9]/g, ""),
      label: productName.trim(),
      description: description.trim() || productName.trim(),
      price: parsedPrice,
      codigoPorcentaje: codigoPorcentaje,
      code: autoCode,
    };

    const updatedList = [...currentList, newProduct];
    localStorage.setItem("pos_products", JSON.stringify(updatedList));
    onRegister?.();

    // Compute preview values for confirmation
    const ivaRate = getIvaRate(codigoPorcentaje);
    const ivaAmount = parsedPrice * ivaRate;
    const totalConIva = parsedPrice + ivaAmount;

    setSuccessMessage(
      `Producto "${productName.trim()}" registrado — Código: ${autoCode} | Base: $${parsedPrice.toFixed(2)} + IVA ${ivaRate * 100}%: $${ivaAmount.toFixed(2)} = PVP: $${totalConIva.toFixed(2)}`
    );

    // Clear fields
    setProductName("");
    setDescription("");
    setPrice("");

    setTimeout(() => {
      setSuccessMessage("");
    }, 8000);
  };

  // Live preview of price with IVA
  const parsedPrice = parseFloat(price) || 0;
  const ivaRate = getIvaRate(codigoPorcentaje);
  const ivaPreview = parsedPrice * ivaRate;
  const totalPreview = parsedPrice + ivaPreview;

  return (
    <ComponentCard title="Registrar Nuevo Producto / Servicio (SRI)">
      <form onSubmit={handleRegister} className="space-y-6">

        {/* Nombre del Producto */}
        <div>
          <Label htmlFor="productName">Nombre del Producto / Servicio</Label>
          <Input
            type="text"
            id="productName"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Ej. Mouse Inalámbrico Logitech"
          />
        </div>

        {/* Descripción */}
        <div>
          <Label htmlFor="productDesc">Descripción (hasta 300 caracteres)</Label>
          <Input
            type="text"
            id="productDesc"
            value={description}
            onChange={(e) => setDescription(e.target.value.substring(0, 300))}
            placeholder="Ej. Mouse ergonómico bluetooth, color negro"
          />
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            {description.length}/300 caracteres
          </p>
        </div>

        {/* Precio Unitario SIN IVA */}
        <div>
          <Label htmlFor="price">Precio Unitario (USD) — SIN IVA (Base Imponible)</Label>
          <div className="relative">
            <Input
              type="number"
              step={0.000001}
              id="price"
              placeholder="0.00"
              className="pl-[62px]"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <span className="absolute left-0 top-1/2 flex h-11 w-[46px] -translate-y-1/2 items-center justify-center border-r border-gray-200 dark:border-gray-800">
              <span className="text-gray-500 font-semibold text-sm">$</span>
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Ingrese el precio SIN IVA. Hasta 6 decimales. El SRI exige la base imponible.
          </p>
        </div>

        {/* Tarifa de IVA (codigoPorcentaje) */}
        <div>
          <Label>Tarifa de IVA (codigoPorcentaje SRI)</Label>
          <Select
            options={ivaOptions}
            placeholder="Seleccione la tarifa de IVA"
            onChange={handleIvaChange}
            defaultValue="4"
            className="dark:bg-dark-900"
          />
        </div>

        {/* Live preview of calculations */}
        {parsedPrice > 0 && (
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 dark:border-white/[0.05] dark:bg-white/[0.02]">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-3">
              Vista Previa del Producto
            </h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="border-r border-gray-200 dark:border-white/[0.05]">
                <span className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                  Base Imponible
                </span>
                <span className="text-lg font-bold text-gray-800 dark:text-white/90">
                  ${parsedPrice.toFixed(2)}
                </span>
              </div>
              <div className="border-r border-gray-200 dark:border-white/[0.05]">
                <span className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                  IVA ({ivaRate * 100}%)
                </span>
                <span className="text-lg font-bold text-gray-800 dark:text-white/90">
                  ${ivaPreview.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                  PVP (con IVA)
                </span>
                <span className="text-lg font-bold text-brand-500 dark:text-brand-400">
                  ${totalPreview.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="p-3 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-800/20 dark:text-green-400 flex items-center gap-2.5 animate-fade-in border border-green-200 dark:border-green-800/40">
            {/* SVG Icono Check Éxito */}
            <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        <div className="pt-2">
          <Button className="w-full justify-center" onClick={() => handleRegister()}>
            Registrar Producto en Inventario POS
          </Button>
        </div>
      </form>
    </ComponentCard>
  );
}
