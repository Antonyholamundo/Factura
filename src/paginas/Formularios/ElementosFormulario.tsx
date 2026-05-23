import React, { useState, useEffect } from "react";
import PageBreadcrumb from "../../componentes/comunes/MigasPagina";
import DefaultInputs from "../../componentes/formulario/elementos-formulario/EntradasPredeterminadas";
import ListaProductos, { ProductItem } from "../../componentes/formulario/elementos-formulario/ListaProductos";
import PageMeta from "../../componentes/comunes/MetaPagina";

const defaultProducts = [
  { code: "PROD-CAFE001", label: "Café de Loja Premium", description: "Café de Loja Premium", price: 5.65, codigoPorcentaje: "4" },
  { code: "PROD-CHOC002", label: "Chocolate Pacari Organic", description: "Chocolate Pacari Organic", price: 4.17, codigoPorcentaje: "4" },
  { code: "PROD-SOMB003", label: "Sombrero de Paja Toquilla", description: "Sombrero de Paja Toquilla", price: 39.13, codigoPorcentaje: "4" },
  { code: "PROD-CONS004", label: "Consultoría Tributaria (hora)", description: "Consultoría Tributaria (hora)", price: 50.00, codigoPorcentaje: "0" },
];

export default function FormElements() {
  const [products, setProducts] = useState<ProductItem[]>([]);

  const loadProducts = () => {
    const stored = localStorage.getItem("pos_products");
    if (stored) {
      try {
        setProducts(JSON.parse(stored));
      } catch {
        setProducts(defaultProducts);
      }
    } else {
      localStorage.setItem("pos_products", JSON.stringify(defaultProducts));
      setProducts(defaultProducts);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDeleteProduct = (code: string) => {
    if (window.confirm("¿Está seguro de eliminar este producto del inventario?")) {
      const stored = localStorage.getItem("pos_products");
      if (stored) {
        try {
          const list: ProductItem[] = JSON.parse(stored);
          const getCode = (p: ProductItem) => p.codigoPrincipal || p.code || p.value || "";
          const updated = list.filter((p) => getCode(p) !== code);
          localStorage.setItem("pos_products", JSON.stringify(updated));
          loadProducts();
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  return (
    <div>
      <PageMeta
        title="Inventario de Productos | Facturación POS SRI"
        description="Gestión completa de catálogo de productos e inventario para emisión de comprobantes autorizados."
      />
      <PageBreadcrumb pageTitle="Inventario y Productos" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <DefaultInputs onRegister={loadProducts} />
        </div>
        <div className="space-y-6">
          <ListaProductos products={products} onDeleteProduct={handleDeleteProduct} />
        </div>
      </div>
    </div>
  );
}
