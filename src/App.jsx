import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

import UserPage from './UserPage';
import AdminPage from './AdminPage';
import KitchenPage from './KitchenPage';

function App() {
  return (
    <BrowserRouter>
      {/* Hidden Nav for easy testing on local computer */}
      <div style={{ position: 'fixed', bottom: 5, right: 5, zIndex: 9999, opacity: 0.3 }}>
        <Link to="/" style={linkStyle}>Kiosk</Link> | 
        <Link to="/display" style={linkStyle}>Kitchen</Link> | 
        <Link to="/admin" style={linkStyle}>Admin</Link>
      </div>

      <Routes>
        <Route path="/" element={<UserPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/display" element={<KitchenPage />} />
        <Route path="/kitchen" element={<KitchenPage />} />
      </Routes>
    </BrowserRouter>
  );
}

const linkStyle = { textDecoration: 'none', color: 'black', backgroundColor: 'white', padding: '2px 5px', borderRadius: '3px', margin: '0 5px' };

export default App;
