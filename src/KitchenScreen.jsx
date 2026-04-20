import React, { useState, useEffect } from 'react';
import './KitchenScreen.css';

const API_URL = 'https://cafe-os-backend.onrender.com';
const WS_URL = 'wss://cafe-os-backend.onrender.com';

export default function KitchenScreen() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/orders`).then(res => res.json()).then(setOrders);
    const socket = new WebSocket(WS_URL);
    socket.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if(msg.type === "NEW_ORDER") {
        setOrders(prev => [msg.data, ...prev]);
      } else if (msg.type === "STATUS_UPDATE") {
        setOrders(prev => prev.map(o => o.id === msg.data.id ? msg.data : o));
      }
    };
    return () => socket.close();
  }, []);

  const updateStatus = async (id, status) => {
    await fetch(`${API_URL}/orders/${id}/status?status=${status}`, { method: 'PUT' });
    setOrders(prev => prev.map(o => o.id === id ? {...o, status} : o));
  };

  const activeOrders = orders.filter(o => o.status !== 'Delivered');

  return (
    <div className="kitchen-container">
      <div className="kitchen-header">
        <h2 className="kitchen-title">Kitchen Orders 🧑‍🍳</h2>
        <div className="kitchen-active-info">Active: <span className="kitchen-active-count">{activeOrders.length}</span></div>
      </div>

      <div className="kitchen-grid">
        {activeOrders.map(o => {
          let headerBg = '#e1b12c'; 
          let buttonBg = '#0984e3'; 
          let buttonText = '🔥 Start Preparing';
          let nextStatus = 'Preparing';
          let borderColor = '#fbc531';

          if (o.status === 'Preparing') {
            headerBg = '#0984e3'; 
            buttonBg = '#27ae60'; 
            buttonText = '✓ Mark as Ready';
            nextStatus = 'Completed';
            borderColor = '#74b9ff';
          } else if (o.status === 'Completed') {
            headerBg = '#27ae60'; 
            buttonBg = '#e17055'; 
            buttonText = '👋 Hand Over (Clear TV)';
            nextStatus = 'Delivered'; 
            borderColor = '#2ecc71';
          }

          return (
            <div key={o.id} className="kitchen-ticket" style={{ border: `2px solid ${borderColor}` }}>
              <div className="ticket-header-top" style={{ background: headerBg }}>
                <div className="ticket-id">#{o.id}</div>
                <div className="ticket-status-badge">{o.status}</div>
              </div>

              <div className="ticket-customer-row">
                <span className="ticket-customer-icon">👤</span>
                <span className="ticket-customer-name">{o.customer_name}</span>
              </div>

              <div className="ticket-items-container">
                {Array.isArray(o.items) ? o.items.map((item, idx) => (
                  <div key={idx} className="ticket-item-row">
                    <span>{typeof item === 'string' ? item : item.name}</span>
                    <span className="ticket-item-qty">x{item.quantity || 1}</span>
                  </div>
                )) : (
                  <div className="ticket-error-msg">Items data format error</div>
                )}
              </div>

              <div className="ticket-action-container">
                <button className="btn-ticket-action" onClick={() => updateStatus(o.id, nextStatus)} style={{ background: buttonBg }}>
                  {buttonText}
                </button>
              </div>
            </div>
          );
        })}
        {activeOrders.length === 0 && (
          <div className="kitchen-empty-msg">No active orders right now. Kitchen is clear! ✨</div>
        )}
      </div>
    </div>
  );
}