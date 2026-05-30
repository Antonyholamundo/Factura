/**
 * HOOK: usarEmisor
 * PROPÓSITO: Centraliza la gestión del perfil del emisor fiscal (RUC, régimen, ambiente).
 * Provee persistencia en localStorage bajo la clave 'pos_emisor_config'.
 */
import { useState, useEffect, useCallback } from "react";
import { validarIdentificacion } from "../utilidades/validaciones-sri";
import { getEmisor, actualizarEmisor } from "../servicios/api";
import { obtenerEmpresa, estaAutenticado } from "../servicios/api-sri";

export interface SriEmisorConfig {
  ambiente: "1" | "2";              // "1" = Pruebas | "2" = Producción
  tipoEmision: "1";                 // "1" = Normal
  razonSocial: string;              // Razón social legal
  nombreComercial: string;          // Nombre de fantasía comercial
  ruc: string;                      // RUC de 13 dígitos
  codDoc: "01";                     // "01" = Factura
  estab: string;                    // 3 dígitos, ej: "001"
  ptoEmi: string;                   // 3 dígitos, ej: "001"
  dirMatriz: string;                // Dirección de la matriz
  dirEstablecimiento: string;       // Dirección de la sucursal/establecimiento
  obligadoContabilidad: "SI" | "NO";
  regimen: "RIMPE-EMPRENDEDOR" | "RIMPE-POPULAR" | "REGIMEN-GENERAL" | "CONTRIBUYENTE-ESPECIAL";
  resolucionAgente?: string;        // Número si es Agente de Retención
  contribuyenteEspecial?: string;   // Número si es Contribuyente Especial
  telefono: string;
  correo: string;
  cargoRepresentante: string;       // Cargo del representante (ej. Representante Legal)
  firmaNombre: string;              // Nombre del archivo de firma .p12
  firmaPassword?: string;           // Contraseña de firma
}

export const STORAGE_KEY_EMISOR = "pos_emisor_config";

export const EMISOR_SEMILLA: SriEmisorConfig = {
  ambiente: "1",
  tipoEmision: "1",
  razonSocial: "EMPRESA PRUEBA S.A.",
  nombreComercial: "POS INTEGRADO SRI",
  ruc: "1792945678001",
  codDoc: "01",
  estab: "001",
  ptoEmi: "001",
  dirMatriz: "Av. de los Shyris N34-102 y Holanda, Quito",
  dirEstablecimiento: "Av. de los Shyris N34-102 y Holanda",
  obligadoContabilidad: "NO",
  regimen: "REGIMEN-GENERAL",
  telefono: "+593 2 3456789",
  correo: "contacto@empresarueba.com.ec",
  cargoRepresentante: "Representante Legal",
  firmaNombre: "firma_pruebas_sri.p12",
  firmaPassword: "",
};

export interface UsarEmisorRetorno {
  emisor: SriEmisorConfig;
  guardarEmisor: (datos: Partial<SriEmisorConfig>) => { exito: boolean; errores: Record<string, string> };
  restablecerSemilla: () => void;
}

export function usarEmisor(): UsarEmisorRetorno {
  const [emisor, setEmisor] = useState<SriEmisorConfig>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_EMISOR);
      return stored ? JSON.parse(stored) : EMISOR_SEMILLA;
    } catch {
      return EMISOR_SEMILLA;
    }
  });

  // Asegurar de que exista un registro base en localStorage al montar y sincronizar con BD
  useEffect(() => {
    let isMounted = true;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_EMISOR);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY_EMISOR, JSON.stringify(EMISOR_SEMILLA));
      }
    } catch (e) {
      console.error("Error al inicializar localStorage de emisor", e);
    }

    if (estaAutenticado()) {
      getEmisor()
        .then((emisorList) => {
          if (isMounted && emisorList && emisorList.length > 0) {
            const emp = emisorList[0];
            const emisorNormalizado: SriEmisorConfig = {
              ambiente: String(emp.tipo_ambiente || 1) as "1" | "2",
              tipoEmision: "1",
              razonSocial: emp.razon_social || "",
              nombreComercial: emp.nombre_comercial || "",
              ruc: emp.ruc || "",
              codDoc: "01",
              estab: emp.codigo_establecimiento || "001",
              ptoEmi: emp.punto_emision || "001",
              dirMatriz: emp.direccion_matriz || emp.direccion || "",
              dirEstablecimiento: emp.direccion_establecimiento || emp.direccion || "",
              obligadoContabilidad: emp.obligado_contabilidad ? "SI" : "NO",
              regimen: "REGIMEN-GENERAL",
              telefono: emp.telefono || "",
              correo: emp.email || "",
              cargoRepresentante: "Representante Legal",
              firmaNombre: "firma_sri.p12",
              firmaPassword: "",
            };
            localStorage.setItem(STORAGE_KEY_EMISOR, JSON.stringify(emisorNormalizado));
            setEmisor(emisorNormalizado);
            window.dispatchEvent(new Event("emisor_config_changed"));
          }
        })
        .catch((err) => {
          console.error("Error al cargar emisor de la base de datos:", err);
        });
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const guardarEmisor = useCallback(
    (datosNuevos: Partial<SriEmisorConfig>) => {
      const errores: Record<string, string> = {};
      const emisorPropuesto = { ...emisor, ...datosNuevos };

      // ── VALIDACIÓN DE CAMPOS CRÍTICOS ──

      // 1. RUC
      if (!emisorPropuesto.ruc?.trim()) {
        errores.ruc = "El RUC del emisor es obligatorio.";
      } else {
        const valIdent = validarIdentificacion("04", emisorPropuesto.ruc);
        if (!valIdent.valido) {
          errores.ruc = valIdent.mensaje;
        }
      }

      // 2. Razón Social
      if (!emisorPropuesto.razonSocial?.trim()) {
        errores.razonSocial = "La Razón Social del emisor es obligatoria.";
      }

      // 3. Dirección Matriz y Dirección Establecimiento
      if (!emisorPropuesto.dirMatriz?.trim()) {
        errores.dirMatriz = "La dirección de la casa matriz es obligatoria.";
      }
      if (!emisorPropuesto.dirEstablecimiento?.trim()) {
        errores.dirEstablecimiento = "La dirección del establecimiento es obligatoria.";
      }

      // 4. Códigos de Establecimiento y Punto de Emisión (deben ser 3 dígitos)
      let estabFormateado = emisorPropuesto.estab.trim().replace(/\D/g, "");
      if (estabFormateado.length > 0) {
        estabFormateado = estabFormateado.padStart(3, "0").substring(0, 3);
        emisorPropuesto.estab = estabFormateado;
      } else {
        errores.estab = "Código de establecimiento requerido (ej. 001).";
      }

      let ptoEmiFormateado = emisorPropuesto.ptoEmi.trim().replace(/\D/g, "");
      if (ptoEmiFormateado.length > 0) {
        ptoEmiFormateado = ptoEmiFormateado.padStart(3, "0").substring(0, 3);
        emisorPropuesto.ptoEmi = ptoEmiFormateado;
      } else {
        errores.ptoEmi = "Código de punto de emisión requerido (ej. 001).";
      }

      // 5. Correo Electrónico
      if (!emisorPropuesto.correo?.trim()) {
        errores.correo = "El correo electrónico es obligatorio.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emisorPropuesto.correo.trim())) {
        errores.correo = "Ingrese un correo electrónico válido.";
      }

      // Si hay errores, no guardar y retornarlos
      if (Object.keys(errores).length > 0) {
        return { exito: false, errores };
      }

      // Persistir localmente
      localStorage.setItem(STORAGE_KEY_EMISOR, JSON.stringify(emisorPropuesto));
      setEmisor(emisorPropuesto);

      // Despachar evento para notificar a otras pestañas/hooks si es necesario
      window.dispatchEvent(new Event("emisor_config_changed"));

      // Guardar en la base de datos asíncronamente (si está autenticado)
      if (estaAutenticado()) {
        const company = obtenerEmpresa();
        if (company && company.id) {
          const apiBody = {
            ruc: emisorPropuesto.ruc,
            razon_social: emisorPropuesto.razonSocial,
            nombre_comercial: emisorPropuesto.nombreComercial,
            telefono: emisorPropuesto.telefono,
            email: emisorPropuesto.correo,
            codigo_establecimiento: emisorPropuesto.estab,
            punto_emision: emisorPropuesto.ptoEmi,
            direccion_matriz: emisorPropuesto.dirMatriz,
            direccion_establecimiento: emisorPropuesto.dirEstablecimiento,
            obligado_contabilidad: emisorPropuesto.obligadoContabilidad === "SI",
            tipo_ambiente: parseInt(emisorPropuesto.ambiente || "1"),
          };
          actualizarEmisor(company.id, apiBody).catch((err) => {
            console.error("Error al actualizar emisor en base de datos:", err);
          });
        }
      }

      return { exito: true, errores };
    },
    [emisor]
  );

  const restablecerSemilla = useCallback(() => {
    localStorage.setItem(STORAGE_KEY_EMISOR, JSON.stringify(EMISOR_SEMILLA));
    setEmisor(EMISOR_SEMILLA);
    window.dispatchEvent(new Event("emisor_config_changed"));
  }, []);

  return {
    emisor,
    guardarEmisor,
    restablecerSemilla,
  };
}
