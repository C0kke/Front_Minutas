import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import App from './App';
import Login from './auth/Login';
import Platos from './views/Platos';
import Home from './views/Home'

function AppRouter() {
  const token = localStorage.getItem('token');

  return (
    <Router>
      <Routes>
        <Route path="/" element={token ? <Navigate to="/view" /> : <Login />} />
        <Route path="/home" element={token ?   <Home />: <Navigate to="/"/>} />
        <Route path="/view" element={token ? <App /> : <Navigate to="/" />} />
        <Route path="/platos" element={token ? <Platos /> : <Navigate to="/" />} />
       
      </Routes>
    </Router>
  );
}

export default AppRouter;