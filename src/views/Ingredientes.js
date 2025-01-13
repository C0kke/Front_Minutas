import React, { useEffect, useState } from "react";
import axios from "axios";
import "./styles/ingredientes.css";
import Header from "../components/Header";

const IngredienteList = () => {
  const [ingredientes, setIngredientes] = useState([]);
  const [filteredIngredientes, setFilteredIngredientes] = useState([]);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filter, setFilter] = useState("");
  const token = localStorage.getItem("token")?.trim();

  useEffect(() => {
    if (!token) {
      setError("No autorizado. Inicie sesión.");
      return;
    }

    const fetchIngredientes = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/v1/ingrediente", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIngredientes(response.data);
        setFilteredIngredientes(response.data);
      } catch (error) {
        setError("Error al cargar los ingredientes");
      }
    };

    fetchIngredientes();
  }, [token]);

  const handleFilterChange = (event) => {
    const value = event.target.value.toLowerCase();
    setFilter(value);
    const filtered = ingredientes.filter((ingrediente) =>
      ingrediente.nombreIngrediente.toLowerCase().includes(value)
    );
    setFilteredIngredientes(filtered);
    setCurrentPage(1);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredIngredientes.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(filteredIngredientes.length / itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  return (
    <div>
      <Header />
      <div className="ingrediente-list-container" style={{ position: "relative" }}>
        {/* Campo de búsqueda en la esquina superior derecha */}
        <input
          type="text"
          placeholder="Buscar ingrediente..."
          value={filter}
          onChange={handleFilterChange}
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            padding: "10px",
            width: "300px",
            borderRadius: "5px",
            border: "1px solid #ccc",
            zIndex: 10,
          }}
        />
        <div className="ingrediente-details" style={{ marginTop: "60px" }}>
          <table className="Ingrediente">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Unidad de Medida</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((ingrediente, index) => (
                  <tr key={index}>
                    <td>{ingrediente.nombreIngrediente}</td>
                    <td>{ingrediente.unidadmedida}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" style={{ textAlign: "center" }}>
                    No se encontraron ingredientes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="pagination-buttons" style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
        <button
          onClick={handlePrevPage}
          disabled={currentPage === 1}
          style={{
            backgroundColor: "#2E8B57",
            color: "white",
            border: "none",
            padding: "10px 20px",
            marginRight: "10px",
            cursor: currentPage === 1 ? "not-allowed" : "pointer",
          }}
        >
          {"<"}
        </button>
        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          style={{
            backgroundColor: "#2E8B57",
            color: "white",
            border: "none",
            padding: "10px 20px",
            cursor: currentPage === totalPages ? "not-allowed" : "pointer",
          }}
        >
          {">"}
        </button>
      </div>
    </div>
  );
};

export default IngredienteList;