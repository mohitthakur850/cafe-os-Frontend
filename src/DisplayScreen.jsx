import React, { useState, useEffect } from 'react';

export default function DisplayScreen() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetch('https://cafe-os-backend.onrender.com/orders').then(res => res.json()).then(data => setOrders(data.filter(o => o.status !== 'Completed')));
    const ws = new WebSocket('ws://cafe-os-backend.onrender.com');
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'NEW_ORDER') setOrders(prev => [...prev, msg.data]);
      if (msg.type === 'STATUS_UPDATE') {
        if (msg.data.status === 'Completed') setOrders(prev => prev.filter(o => o.id !== msg.data.id));
        else setOrders(prev => prev.map(o => o.id === msg.data.id ? msg.data : o));
      }
    };
    return () => ws.close();
  }, []);

  const preparing = orders.filter(o => o.status === 'Accepted' || o.status === 'Preparing');
  const ready = orders.filter(o => o.status === 'Ready');

  return (
    <div className="tv-layout">
      <div className="tv-main">
        <div className="tv-column preparing-col">
          <h1 className="tv-header text-preparing">Preparing</h1>
          <div className="tv-grid">
            {preparing.map(o => <div key={o.id} className="tv-order-number"><div className="order-id-label">ID</div><div className="order-id-value">{o.id}</div></div>)}
          </div>
        </div>
        <div className="tv-column ready-col">
          <h1 className="tv-header text-ready">Please Collect</h1>
          <div className="tv-grid">
            {ready.map(o => <div key={o.id} className="tv-order-number ready"><div className="order-id-label">ID</div><div className="order-id-value">{o.id}</div></div>)}
          </div>
        </div>
      </div>
      <div className="tv-ticker-container"><div className="tv-ticker-text">🍔 Welcome to Cafe OS! Freshly prepared meals just for you. 🥤 Check your ID on screen!</div></div>
    </div>
  );
}