import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

// Aapke teeno pages import ho rahe hain
import UserPage from './UserPage';
import AdminPage from './AdminPage';
import KitchenScreen from './KitchenScreen';
import DisplayScreen from './DisplayScreen';
function App() {
  return (
    <BrowserRouter>
      {/* OPTIONAL: Yeh ek chhota sa hidden nav bar hai (sirf testing ke liye).
        Jab aap cafe mein setup karenge toh isey hata dijiyega. 
      */}
      <div style={{ position: 'fixed', bottom: 5, right: 5, zIndex: 9999, opacity: 0.3 }}>
        <Link to="/" style={linkStyle}>Kiosk</Link> | 
        <Link to="/kitchen" style={linkStyle}>Kitchen</Link> | 
        <Link to="/admin" style={linkStyle}>Admin</Link>
      </div>

      <Routes>
        {/* 1. Customer Kiosk Screen (Default Page) */}
        <Route path="/" element={<UserPage />} />

        {/* 2. Admin Dashboard */}
        <Route path="/admin" element={<AdminPage />} />

        {/* 3. Kitchen Display System (KDS) */}
        <Route path="/kitchen" element={<KitchenScreen />} />
        <Route path="/display" element={<DisplayScreen />} />
      </Routes>
    </BrowserRouter>
  );
}

const linkStyle = {
  textDecoration: 'none', 
  color: 'black', 
  backgroundColor: 'white', 
  padding: '2px 5px', 
  borderRadius: '3px',
  margin: '0 5px'
};

export default App;
