import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import UserPage from './UserPage';
import AdminPage from './AdminPage';
import KitchenScreen from './KitchenScreen';
import DisplayScreen from './DisplayScreen';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Main link par aane par sidha Customer ka menu khulega */}
        <Route path="/" element={<UserPage />} />
        
        {/* Yeh hidden links hain jo sirf aapko pata honge */}
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/kitchen" element={<KitchenScreen />} />
        <Route path="/display" element={<DisplayScreen />} />
        
        {/* Agar koi galat link dalta hai, toh usey wapas menu par bhej dega */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
