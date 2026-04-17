import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import UserPage from './UserPage';
import KitchenScreen from './KitchenScreen';
import DisplayScreen from './DisplayScreen';
import AdminPage from './AdminPage';
import './index.css'; 

function AppContent() {
  const location = useLocation();
  
  // Logic: Sidebar kab hide karna hai?
  // Jab route '/' (User Menu) ho YA '/display' (TV Screen) ho.
  const hideSidebar = location.pathname === '/' || location.pathname === '/display';

  return (
    <div className="app-container">
      
      {/* Agar hideSidebar false hai, tabhi sidebar dikhao */}
      {!hideSidebar && (
        <aside className="sidebar">
          <h2>Cafe OS</h2>
          <Link to="/">🍽️ Order Menu</Link>
          <Link to="/kitchen">🧑‍🍳 Kitchen</Link>
          <Link to="/display">📺 Display</Link>
          <Link to="/admin">📊 Admin</Link>
        </aside>
      )}
      
      {/* Display screen par padding zero chahiye, baaki sab par normal */}
      <main className="main-content" style={location.pathname === '/display' ? { padding: 0 } : {}}>
        <Routes>
          <Route path="/" element={<UserPage />} />
          <Route path="/kitchen" element={<KitchenScreen />} />
          <Route path="/display" element={<DisplayScreen />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
      
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}