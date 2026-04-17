import React, { useState, useEffect } from 'react';

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

  // FIX: Ab sirf "Delivered" orders hide honge. 'Completed' (Ready) wale screen par rahenge taaki unhe Hand over kiya ja sake.
  const activeOrders = orders.filter(o => o.status !== 'Delivered');

  return (
    <div style={{ 
      padding: '20px', 
      background: '#f4f7f6', 
      minHeight: '100vh', 
      fontFamily: 'sans-serif',
      boxSizing: 'border-box'
    }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: 'white', padding: '15px 20px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
        <h2 style={{ margin: 0, color: '#2d3436', fontSize: '1.4rem' }}>Kitchen Orders 🧑‍🍳</h2>
        <div style={{ color: '#636e72', fontWeight: 'bold', fontSize: '0.9rem' }}>Active: <span style={{ color: '#d63031', fontSize: '1.2rem' }}>{activeOrders.length}</span></div>
      </div>

      {/* Grid Layout for compact tickets */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: '15px' 
      }}>
        {activeOrders.map(o => {
          
          // NEW LOGIC: 3 Steps for colors and buttons
          let headerBg = '#e1b12c'; // Yellow for Pending/New
          let buttonBg = '#0984e3'; // Blue button
          let buttonText = '🔥 Start Preparing';
          let nextStatus = 'Preparing';
          let borderColor = '#fbc531';

          if (o.status === 'Preparing') {
            headerBg = '#0984e3'; // Blue header
            buttonBg = '#27ae60'; // Green button
            buttonText = '✓ Mark as Ready';
            nextStatus = 'Completed';
            borderColor = '#74b9ff';
          } else if (o.status === 'Completed') {
            headerBg = '#27ae60'; // Green header (Ready)
            buttonBg = '#e17055'; // Orange/Red button for Hand Over
            buttonText = '👋 Hand Over (Clear TV)';
            nextStatus = 'Delivered'; // This will clear it from TV and Kitchen
            borderColor = '#2ecc71';
          }

          return (
            <div key={o.id} style={{ 
              background: 'white', 
              borderRadius: '12px', 
              overflow: 'hidden', 
              boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
              display: 'flex', 
              flexDirection: 'column',
              border: `2px solid ${borderColor}`
            }}>
              
              {/* Ticket Header */}
              <div style={{ 
                background: headerBg, 
                color: 'white', 
                padding: '12px 15px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>#{o.id}</div>
                <div style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  padding: '4px 10px', 
                  borderRadius: '12px', 
                  fontSize: '0.8rem', 
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}>
                  {o.status}
                </div>
              </div>

              {/* Customer Info */}
              <div style={{ padding: '10px 15px', borderBottom: '1px dashed #dfe6e9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1rem' }}>👤</span>
                <span style={{ fontWeight: 'bold', color: '#2d3436', fontSize: '1.1rem' }}>{o.customer_name}</span>
              </div>

              {/* Items List */}
              <div style={{ padding: '15px', flex: 1, overflowY: 'auto', maxHeight: '150px' }}>
                {Array.isArray(o.items) ? o.items.map((item, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '8px',
                    fontSize: '0.95rem',
                    color: '#2d3436'
                  }}>
                    <span>{typeof item === 'string' ? item : item.name}</span>
                    <span style={{ 
                      background: '#f1f2f6', 
                      padding: '2px 8px', 
                      borderRadius: '6px', 
                      fontWeight: 'bold', 
                      fontSize: '0.85rem' 
                    }}>
                      x{item.quantity || 1}
                    </span>
                  </div>
                )) : (
                  <div style={{ color: '#636e72', fontSize: '0.9rem' }}>Items data format error</div>
                )}
              </div>

              {/* Action Button */}
              <div style={{ padding: '15px', background: '#fafafa', borderTop: '1px solid #f1f2f6' }}>
                <button 
                  onClick={() => updateStatus(o.id, nextStatus)}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    background: buttonBg, 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '8px', 
                    fontWeight: 'bold', 
                    fontSize: '1rem',
                    cursor: 'pointer',
                    transition: '0.2s',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                  }}
                >
                  {buttonText}
                </button>
              </div>

            </div>
          );
        })}
        {activeOrders.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#b2bec3', fontSize: '1.2rem' }}>
            No active orders right now. Kitchen is clear! ✨
          </div>
        )}
      </div>

    </div>
  );
}
