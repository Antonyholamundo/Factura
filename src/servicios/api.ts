/**
 * SERVICIO: Centralización de Capa de API REST (api.ts)
 * PROPÓSITO: Sirve como el cliente de API unificado y desacoplado para el POS,
 * abstrayendo toda persistencia en localStorage y delegando al backend.
 */
import {
  listarProductos,
  crearFacturaCompleta,
  crearCliente,
  listarClientes,
  listarFacturas,
  calcularTotales,
  listarTiposIdentificacion,
  listarEmpresasEmisoras,
  actualizarEmpresaEmisora, // <-- Import it from api-sri
} from "./api-sri";

export async function getEmisor() {
  return listarEmpresasEmisoras();
}

export async function actualizarEmisor(id: string, data: any) {
  return actualizarEmpresaEmisora(id, data);
}


export async function getTiposIdentificacion() {
  return listarTiposIdentificacion();
}

export async function getProductos() {
  return listarProductos();
}

export async function crearFactura(data: any) {
  return crearFacturaCompleta(data);
}

export async function registrarCliente(data: any) {
  return crearCliente(data);
}

export async function getClientes() {
  return listarClientes();
}

export async function getHistorial() {
  return listarFacturas();
}

export async function apiCalcularTotales(items: { codigoPrincipal: string; cantidad: number; descuento: number }[]) {
  return calcularTotales(items);
}
