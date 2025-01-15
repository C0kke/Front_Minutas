import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './styles/Aprobar.css';

const MenuSemanalAprobacion = () => {
  const [menusPendientes, setMenusPendientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState(null);

  useEffect(() => {
    // Fetch menús pendientes de aprobación
    const fetchMenusPendientes = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/v1/menudiario/verificar/no-aprobados'); // Asegúrate de que este endpoint exista
        setMenusPendientes(response.data);
      } catch (error) {
        console.error('Error al cargar los menús pendientes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenusPendientes();
  }, []);

  const handleMenuClick = (menu) => {
    setSelectedMenu(menu);
  };

  const handleAprobar = async () => {
    if (selectedMenu) {
      try {
        await axios.patch(`/api/menus/${selectedMenu._id}`, { aprobado: true }); // Endpoint para aprobar
        setMenusPendientes(prevState => prevState.filter(menu => menu._id !== selectedMenu._id));
        setSelectedMenu(null);
      } catch (error) {
        console.error('Error al aprobar el menú:', error);
      }
    }
  };

  if (loading) {
    return <div>Cargando menús...</div>;
  }

  return (
    <div>
      <h1>Menús Pendientes de Aprobación</h1>
      {menusPendientes.length === 0 ? (
        <p>No hay menús pendientes de aprobación.</p>
      ) : (
        <div>
          <ul>
            {menusPendientes.map(menu => (
              <li key={menu._id}>
                <span>{new Date(menu.fecha).toLocaleDateString()} - {menu.aprobado ? 'Aprobado' : 'Pendiente'}</span>
                {!menu.aprobado && (
                  <button onClick={() => handleMenuClick(menu)}>Ver Menú</button>
                )}
              </li>
            ))}
          </ul>

          {selectedMenu && (
            <div>
              <h2>Menú Diario: {new Date(selectedMenu.fecha).toLocaleDateString()}</h2>
              <ul>
                {selectedMenu.listaplatos.map((plato, index) => (
                  <li key={index}>{plato}</li> // Aquí puedes agregar más detalles sobre el plato si los tienes
                ))}
              </ul>
              <button onClick={handleAprobar}>Aprobar Menú</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MenuSemanalAprobacion;