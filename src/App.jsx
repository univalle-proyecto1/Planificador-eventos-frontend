import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Hoy from './pages/Hoy';
import CrearEvento from './pages/CrearEvento';
import DetalleEvento from './pages/DetalleEvento';
import Progreso from './pages/Progreso';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirigimos la ruta raíz a la vista principal del proyecto */}
        <Route path="/" element={<Navigate to="/hoy" />} />

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