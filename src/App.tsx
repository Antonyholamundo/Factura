import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./paginas/PaginasAuth/InicioSesion";
import SignUp from "./paginas/PaginasAuth/Registro";
import NotFound from "./paginas/OtraPagina/NoEncontrado";
import UserProfiles from "./paginas/PerfilesUsuario";
import DirectorioClientes from "./paginas/DirectorioClientes";
import Videos from "./paginas/ElementosUI/Videos";
import Images from "./paginas/ElementosUI/Imagenes";
import Alerts from "./paginas/ElementosUI/Alertas";
import Badges from "./paginas/ElementosUI/Insignias";
import Avatars from "./paginas/ElementosUI/Avatares";
import Buttons from "./paginas/ElementosUI/Botones";
import LineChart from "./paginas/Graficas/GraficaLineas";
import BarChart from "./paginas/Graficas/GraficaBarras";
import BasicTables from "./paginas/Tablas/TablasBasicas";
import FormElements from "./paginas/Formularios/ElementosFormulario";
import AppLayout from "./diseno/DisposicionApp";
import { ScrollToTop } from "./componentes/comunes/ScrollAlInicio";
import Home from "./paginas/Tablero/Inicio";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Dashboard Layout */}
          <Route element={<AppLayout />}>
            <Route index path="/" element={<Home />} />

            {/* Others Page */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/clientes" element={<DirectorioClientes />} />

            {/* Forms */}
            <Route path="/form-elements" element={<FormElements />} />

            {/* Tables */}
            <Route path="/basic-tables" element={<BasicTables />} />

            {/* Ui Elements */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />

            {/* Charts */}
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
