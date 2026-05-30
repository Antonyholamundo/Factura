/**
 * SERVICIO: api-sri.ts
 * PROPÓSITO: Cliente HTTP centralizado para comunicarse con la API del SRI
 * backend que corre en http://localhost:3000.
 *
 * Maneja:
 * - Inyección automática del JWT en headers
 * - Tipado de respuestas
 * - Manejo de errores HTTP
 * - Refresh de tokens (relogin)
 */

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN BASE
// ─────────────────────────────────────────────────────────────────────────────
const API_BASE_URL = "http://localhost:3000";

const STORAGE_KEY_TOKEN = "sri_auth_token";
const STORAGE_KEY_USER = "sri_auth_user";
const STORAGE_KEY_COMPANY = "sri_auth_company";

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS DE RESPUESTA DE LA API
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiAuthResponse {
  token: string;
  message?: string;
  user: {
    id: string;
    email: string;
  };
  company: {
    id: string;
    ruc: string;
    razon_social: string;
    nombre_comercial: string;
  } | null;
}

export interface ApiStatusResponse {
  firstRegistration: boolean;
  registrationDisabled: boolean;
  requiresInvitation: boolean;
  masterKeyRequired: boolean;
}

export interface ApiInvoiceResponse {
  success: boolean;
  data?: any;
  xml?: string;
  message?: string;
}

export interface ApiError {
  message: string;
  success?: boolean;
  statusCode: number;
}

export interface ApiClienteBody {
  tipo_identificacion_id?: string;
  identificacion: string;
  razon_social: string;
  email?: string;
  telefono?: string;
  direccion?: string;
}

export interface ApiProductoBody {
  codigo: string;
  descripcion: string;
  precio_unitario: number;
  tiene_iva: boolean;
  categoria?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILIDADES DE ALMACENAMIENTO DEL TOKEN
// ─────────────────────────────────────────────────────────────────────────────

export function obtenerToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_TOKEN);
  } catch {
    return null;
  }
}

export function guardarSesion(data: ApiAuthResponse): void {
  localStorage.setItem(STORAGE_KEY_TOKEN, data.token);
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.user));
  if (data.company) {
    localStorage.setItem(STORAGE_KEY_COMPANY, JSON.stringify(data.company));
  }
}

export function cerrarSesion(): void {
  localStorage.removeItem(STORAGE_KEY_TOKEN);
  localStorage.removeItem(STORAGE_KEY_USER);
  localStorage.removeItem(STORAGE_KEY_COMPANY);
}

export function obtenerUsuario(): { id: string; email: string } | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_USER);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function obtenerEmpresa(): ApiAuthResponse["company"] | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_COMPANY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function estaAutenticado(): boolean {
  const token = obtenerToken();
  if (!token) return false;

  // Verificar expiración básica del JWT
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const ahora = Math.floor(Date.now() / 1000);
    return payload.exp > ahora;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIÓN FETCH GENÉRICA CON AUTH
// ─────────────────────────────────────────────────────────────────────────────

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = obtenerToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Si el token expiró, despachar evento para que el contexto redirija al login
    if (response.status === 401) {
      cerrarSesion();
      window.dispatchEvent(new CustomEvent("sri_auth_expired"));
      throw {
        message: "Sesión expirada. Inicie sesión nuevamente.",
        statusCode: 401,
      } as ApiError;
    }

    // Si es una respuesta vacía (204 No Content)
    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json();

    if (!response.ok) {
      throw {
        message: data.message || `Error ${response.status}`,
        success: false,
        statusCode: response.status,
      } as ApiError;
    }

    return data as T;
  } catch (err: any) {
    // Si ya es un ApiError, relanzar
    if (err.statusCode) throw err;

    // Error de red (API caída o sin conectividad)
    throw {
      message: `No se pudo conectar con el servidor (${API_BASE_URL}). Verifique que la API esté corriendo.`,
      statusCode: 0,
    } as ApiError;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ENDPOINTS DE AUTENTICACIÓN (PÚBLICOS)
// ─────────────────────────────────────────────────────────────────────────────

/** Consulta el estado del sistema (primer registro, etc.) */
export async function consultarEstadoSistema(): Promise<ApiStatusResponse> {
  return fetchApi<ApiStatusResponse>("/status");
}

/** Login: POST /auth */
export async function iniciarSesion(
  email: string,
  password: string
): Promise<ApiAuthResponse> {
  const resp = await fetchApi<ApiAuthResponse>("/auth", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  guardarSesion(resp);
  return resp;
}

/** Registro: POST /register */
export async function registrarUsuario(datos: {
  email: string;
  password: string;
  masterKey?: string;
  invitationCode?: string;
  ruc: string;
  razon_social: string;
  nombre_comercial?: string;
  direccion?: string;
  telefono?: string;
  codigo_establecimiento?: string;
  punto_emision?: string;
  tipo_ambiente?: number;
  certificate: string;
  certificate_password: string;
}): Promise<ApiAuthResponse> {
  const resp = await fetchApi<ApiAuthResponse>("/register", {
    method: "POST",
    body: JSON.stringify(datos),
  });
  guardarSesion(resp);
  return resp;
}

// ─────────────────────────────────────────────────────────────────────────────
// ENDPOINTS DE FACTURACIÓN (PROTEGIDOS)
// ─────────────────────────────────────────────────────────────────────────────

/** Crear factura completa: POST /api/v1/invoice/complete */
export async function crearFacturaCompleta(
  factura: any
): Promise<ApiInvoiceResponse> {
  return fetchApi<ApiInvoiceResponse>("/api/v1/invoice/complete", {
    method: "POST",
    body: JSON.stringify({ factura }),
  });
}

/** Listar facturas: GET /api/v1/invoice */
export async function listarFacturas(): Promise<any[]> {
  return fetchApi<any[]>("/api/v1/invoice");
}

/** Obtener factura por ID: GET /api/v1/invoice/:id */
export async function obtenerFactura(id: string): Promise<any> {
  return fetchApi<any>(`/api/v1/invoice/${id}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// ENDPOINTS DE PDFs (PROTEGIDOS)
// ─────────────────────────────────────────────────────────────────────────────

/** Listar PDFs: GET /api/v1/invoice-pdf */
export async function listarPdfs(params?: Record<string, string>): Promise<any[]> {
  const query = params ? "?" + new URLSearchParams(params).toString() : "";
  return fetchApi<any[]>(`/api/v1/invoice-pdf${query}`);
}

/** Obtener PDF por ID de factura: GET /api/v1/invoice-pdf/factura/:id */
export async function obtenerPdfPorFactura(facturaId: string): Promise<any> {
  return fetchApi<any>(`/api/v1/invoice-pdf/factura/${facturaId}`);
}

/** Descargar PDF: abre el PDF en una nueva ventana del navegador */
export function descargarPdf(pdfId: string): void {
  const token = obtenerToken();
  // Abrir en nueva pestaña con token en header no es posible directamente,
  // así que hacemos fetch y creamos un blob URL
  fetch(`${API_BASE_URL}/api/v1/invoice-pdf/${pdfId}/download`, {
    headers: { Authorization: `Bearer ${token || ""}` },
  })
    .then((res) => res.blob())
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      // Limpiar el URL después de un momento
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    })
    .catch((err) => console.error("Error al descargar PDF:", err));
}

/** Regenerar PDF: POST /api/v1/invoice-pdf/regenerate/:facturaId */
export async function regenerarPdf(facturaId: string): Promise<any> {
  return fetchApi<any>(`/api/v1/invoice-pdf/regenerate/${facturaId}`, {
    method: "POST",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ENDPOINTS DE CLIENTES (PROTEGIDOS)
// ─────────────────────────────────────────────────────────────────────────────

/** Crear cliente: POST /api/v1/client */
export async function crearCliente(datos: ApiClienteBody): Promise<any> {
  return fetchApi<any>("/api/v1/client", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

/** Listar clientes: GET /api/v1/client */
export async function listarClientes(): Promise<any[]> {
  return fetchApi<any[]>("/api/v1/client");
}

/** Actualizar cliente: PUT /api/v1/client/:id */
export async function actualizarCliente(
  id: string,
  datos: Partial<ApiClienteBody>
): Promise<any> {
  return fetchApi<any>(`/api/v1/client/${id}`, {
    method: "PUT",
    body: JSON.stringify(datos),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ENDPOINTS DE PRODUCTOS (PROTEGIDOS)
// ─────────────────────────────────────────────────────────────────────────────

/** Crear producto: POST /api/v1/product */
export async function crearProducto(datos: ApiProductoBody): Promise<any> {
  return fetchApi<any>("/api/v1/product", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

/** Listar productos: GET /api/v1/product */
export async function listarProductos(): Promise<any[]> {
  return fetchApi<any[]>("/api/v1/product");
}

/** Actualizar producto: PUT /api/v1/product/:id */
export async function actualizarProducto(
  id: string,
  datos: Partial<ApiProductoBody>
): Promise<any> {
  return fetchApi<any>(`/api/v1/product/${id}`, {
    method: "PUT",
    body: JSON.stringify(datos),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ENDPOINTS DE TIPOS DE IDENTIFICACIÓN (PROTEGIDOS)
// ─────────────────────────────────────────────────────────────────────────────

/** Listar tipos de identificación: GET /api/v1/identification-type */
export async function listarTiposIdentificacion(): Promise<any[]> {
  return fetchApi<any[]>("/api/v1/identification-type");
}

/** Crear tipo de identificación: POST /api/v1/identification-type */
export async function crearTipoIdentificacion(datos: {
  codigo: string;
  descripcion: string;
}): Promise<any> {
  return fetchApi<any>("/api/v1/identification-type", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ENDPOINTS DE EMPRESA EMISORA (PROTEGIDOS)
// ─────────────────────────────────────────────────────────────────────────────

/** Listar empresas emisoras: GET /api/v1/issuing-company */
export async function listarEmpresasEmisoras(): Promise<any[]> {
  return fetchApi<any[]>("/api/v1/issuing-company");
}

/** Actualizar empresa emisora: PUT /api/v1/issuing-company/:id */
export async function actualizarEmpresaEmisora(
  id: string,
  datos: Record<string, any>
): Promise<any> {
  return fetchApi<any>(`/api/v1/issuing-company/${id}`, {
    method: "PUT",
    body: JSON.stringify(datos),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────────────────────────────────────

/** Verificar que la API esté en línea: GET /health */
export async function verificarSaludApi(): Promise<{
  status: string;
  timestamp: string;
  cors: string;
  environment: string;
}> {
  return fetchApi("/health");
}

/** Calcular totales de la factura de forma segura en el backend: POST /api/v1/invoice/calculate */
export async function calcularTotales(items: { codigoPrincipal: string; cantidad: number; descuento: number }[]): Promise<{
  subtotal15: number;
  subtotal8: number;
  subtotal0: number;
  totalDescuento: number;
  iva: number;
  total: number;
}> {
  return fetchApi<{
    subtotal15: number;
    subtotal8: number;
    subtotal0: number;
    totalDescuento: number;
    iva: number;
    total: number;
  }>("/api/v1/invoice/calculate", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}
