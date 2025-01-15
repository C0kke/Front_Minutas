import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './auth/Login';
import Platos from './views/Platos';
import Home from './views/Home'
import Minutas from './views/CrearMinuta';
import MinutaLista from './views/MenuHistorico';
import IngredienteList from './views/Ingredientes';
import EditarIngredientes from './views/EditarIngrediente';

import GenerarReporte from './views/GenerarReporte';

function AppRouter() {
  const token = localStorage.getItem('token');

  return (
    <Router>
      <Routes>
        <Route path="/" element={token ? <Navigate to="/home" /> : <Login />} />
        <Route path="/home" element={token ? <Home/> : <Login />} />
        <Route path="/login" element={<Login/>} />
        <Route path="/platos" element={token ? <Platos /> : <Navigate to="/login" />} />
        <Route path="/crear-minuta" element={token ? <Minutas /> : <Navigate to="/login" />} />
        <Route path="/menuhistorico" element={token ? <MinutaLista /> : <Navigate to="/login" />} />
        <Route path="/listaingredientes" element={token ? <IngredienteList /> : <Navigate to="/login" />} />
        <Route path="/editar-ingredientes" element={<EditarIngredientes/>} />
        <Route path="/calculoingrediente" element={token ? <GenerarReporte /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default AppRouter;