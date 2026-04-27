import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import UserPage from './UserPage';
import AdminPage from './AdminPage';
import KitchenScreen from './KitchenScreen';
import DisplayScreen from './DisplayScreen';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<UserPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/display" element={<DisplayScreen />} />
        <Route path="/kitchen" element={<KitchenScreen />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;