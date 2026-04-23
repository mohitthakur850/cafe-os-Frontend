import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

import UserPage from './UserPage';
import AdminPage from './AdminPage';
import KitchenScreen from './KitchenScreen';
import DisplayScreen from './DisplayScreen';

function App() {
  return (
    <BrowserRouter>
     <div style={{ textAlign: 'center', padding: '10px' }}>
  <Link to="/">Kiosk</Link> | 
  <Link to="/kitchen">Kitchen</Link> | 
  <Link to="/admin">Admin</Link>
</div>

      <Routes>
        <Route path="/" element={<UserPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/display" element={<DisplayScreen />} />
        <Route path="/kitchen" element={<KitchenScreen />} />
      </Routes>
    </BrowserRouter>
  );
}

const linkStyle = { textDecoration: 'none', color: 'black', backgroundColor: 'white', padding: '2px 5px', borderRadius: '3px', margin: '0 5px' };

export default App;
