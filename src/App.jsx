import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Hoy from './pages/Hoy';
import CrearEvento from './pages/CrearEvento';
import DetalleEvento from './pages/DetalleEvento';
import Progreso from './pages/Progreso';
import Loguin from './pages/loguin';
import Registro from './pages/registro';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* La página inicial muestra el formulario de acceso */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Loguin />} />
        <Route path="/registro" element={<Registro />} />

        {/* Rutas requeridas por el documento */}
        <Route path="/hoy" element={<Hoy />} />
        <Route path="/crear" element={<CrearEvento />} />
        <Route path="/evento/:id" element={<DetalleEvento />} />
        <Route path="/progreso" element={<Progreso />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;