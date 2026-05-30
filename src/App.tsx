import { BrowserRouter as Router, Routes, Route } from "react-router";

// ── Contexto de Autenticación ─────────────────────────────────────────────────
import { AuthProvider } from "./contexto/ContextoAuth";
import RutaProtegida from "./componentes/autenticacion/RutaProtegida";

// ── Páginas de autenticación ──────────────────────────────────────────────────
import SignIn from "./paginas/PaginasAuth/InicioSesion";
import SignUp from "./paginas/PaginasAuth/Registro";

// ── Páginas de error ──────────────────────────────────────────────────────────
import NotFound from "./paginas/OtraPagina/NoEncontrado";

// ── Módulos del sistema POS SRI ───────────────────────────────────────────────
import Home from "./paginas/Tablero/Inicio";
import BasicTables from "./paginas/Tablas/TablasBasicas";
import FormElements from "./paginas/Formularios/ElementosFormulario";
import DirectorioClientes from "./paginas/DirectorioClientes";
import UserProfiles from "./paginas/PerfilesUsuario";

// ── Layout principal ──────────────────────────────────────────────────────────
import AppLayout from "./diseno/DisposicionApp";
import { ScrollToTop } from "./componentes/comunes/ScrollAlInicio";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* ── Layout con barra lateral (módulos POS SRI) — PROTEGIDOS ── */}
          <Route
            element={
              <RutaProtegida>
                <AppLayout />
              </RutaProtegida>
            }
          >
            {/* Tablero / Inicio */}
            <Route index path="/" element={<Home />} />

            {/* Facturación POS — Terminal de Venta */}
            <Route path="/facturador" element={<BasicTables />} />

            {/* Catálogo de Productos e Inventario */}
            <Route path="/form-elements" element={<FormElements />} />

            {/* Directorio de Clientes */}
            <Route path="/clientes" element={<DirectorioClientes />} />

            {/* Configuración — Datos del Emisor / Firma Electrónica */}
            <Route path="/profile" element={<UserProfiles />} />
          </Route>

          {/* ── Autenticación (sin layout de barra lateral, PÚBLICAS) ── */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* ── Ruta de fallback ── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
