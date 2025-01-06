import React from 'react';
import './Header.css';

const Header = () => {
  return (
    <header className="App-header">
      <div className="Top-header">
        <p>Gerónimo Mendez #1851, Barrio industrial, Coquimbo</p>
        <p>+569 7615 9518 / +569 4785 4598</p>
      </div>
      <img src='/LOGO_GM_EXPRESS.png' className="App-logo" alt="logo" />
    </header>
  );
};

export default Header;