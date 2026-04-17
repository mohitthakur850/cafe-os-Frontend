import React, { useState, useEffect } from 'react';

export default function KitchenScreen() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Sirf wahi orders fetch karo jo Completed nahi hain
    fetch('https://cafe-os-backend.onrender.com/orders')
      .then(res => res.json())
      .then(data => setOrders(data.filter(o => o.status !== 'Completed')));
      
    // WebSocket for Real-time updates
    const ws = new WebSocket('ws://localhost:8000');
    
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'NEW_ORDER') {
        setOrders(prev => [...prev, msg.data]);
      }
      if (msg.type === 'STATUS_UPDATE') {
        if (msg.data.status === 'Completed') {
          // Agar order complete ho gaya, toh list se hata do
          setOrders(prev => prev.filter(o => o.id !== msg.data.id));
        } else {
          // Warna order ka status update kar do
          setOrders(prev => prev.map(o => o.id === msg.data.id ? msg.data : o));
        }
      }
    };
    return () => ws.close();
  }, []);

  const updateStatus = async (id, s) => {
    await fetch(`https://cafe-os-backend.onrender.com/orders/${id}/status?status=${s}`, { method: 'PUT' });
  };

  return (
    <div style={{ padding: '30px', background: '#f4f6f8', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBottom: '30px', color: '#2d3436', fontSize: '2.5rem' }}>Kitchen Orders 👨‍🍳</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
        {orders.map(order => {
          
          // Quantity merge karne ka safe logic
          const groupedItems = order.items.reduce((acc, item) => {
            const existing = acc.find(i => i.name === item.name);
            if (existing) {
              existing.quantity += (item.quantity || 1);
            } else {
              acc.push({ ...item, quantity: item.quantity || 1 });
            }
            return acc;
          }, []);

          // Top border color based on status
          const borderColor = 
            order.status === 'Accepted' ? '#f39c12' : 
            order.status === 'Preparing' ? '#0984e3' : 
            '#27ae60'; // Ready

          return (
            <div key={order.id} style={{ 
              background: 'white', 
              borderRadius: '15px', 
              overflow: 'hidden',
              boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
              borderTop: `8px solid ${borderColor}`,
              display: 'flex',
              flexDirection: 'column'
            }}>
              
              {/* Ticket Header */}
              <div style={{ padding: '20px', borderBottom: '1px solid #f1f2f6', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ color: borderColor, margin: '0 0 5px 0', fontSize: '2.2rem' }}>#{order.id}</h1>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2d3436' }}>👤 {order.customer_name}</div>
                </div>
                <div style={{ 
                  background: borderColor, color: 'white', padding: '5px 10px', 
                  borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold' 
                }}>
                  {order.status}
                </div>
              </div>
              
              {/* Ticket Body (Items & Quantities) */}
              <div style={{ padding: '20px', flex: 1 }}>
                {groupedItems.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px dashed #dfe6e9' }}>
                    <span style={{ fontSize: '1.1rem', color: '#2d3436', fontWeight: '500' }}>{item.name}</span>
                    <span style={{ 
                      background: '#f1f2f6', 
                      padding: '6px 14px', 
                      borderRadius: '8px', 
                      fontWeight: '800', 
                      color: '#2d3436',
                      fontSize: '1.1rem'
                    }}>
                      x{item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              {/* Ticket Footer (Buttons) */}
              <div style={{ padding: '20px', background: '#fafafa' }}>
                
                {/* 1. Accepted -> Preparing */}
                {order.status === 'Accepted' && (
                  <button 
                    onClick={() => updateStatus(order.id, 'Preparing')}
                    style={{ width: '100%', padding: '18px', background: '#0984e3', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '1.1rem', cursor: 'pointer', transition: '0.2s' }}
                    onMouseEnter={e => e.target.style.opacity = 0.9}
                    onMouseLeave={e => e.target.style.opacity = 1}
                  >
                    🔥 Start Preparing
                  </button>
                )}

                {/* 2. Preparing -> Ready */}
                {order.status === 'Preparing' && (
                  <button 
                    onClick={() => updateStatus(order.id, 'Ready')}
                    style={{ width: '100%', padding: '18px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '1.1rem', cursor: 'pointer', transition: '0.2s' }}
                    onMouseEnter={e => e.target.style.opacity = 0.9}
                    onMouseLeave={e => e.target.style.opacity = 1}
                  >
                    ✓ Mark as Ready
                  </button>
                )}

                {/* 3. Ready -> Completed (This will remove the order) */}
                {order.status === 'Ready' && (
                  <button 
                    onClick={() => updateStatus(order.id, 'Completed')}
                    style={{ width: '100%', padding: '18px', background: '#d63031', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '1.1rem', cursor: 'pointer', transition: '0.2s' }}
                    onMouseEnter={e => e.target.style.opacity = 0.9}
                    onMouseLeave={e => e.target.style.opacity = 1}
                  >
                    🛍️ Handed Over (Clear)
                  </button>
                )}

              </div>
            </div>
          );
        })}
        
        {/* Empty State */}
        {orders.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: '#636e72', fontSize: '1.3rem', fontWeight: 'bold' }}>
            No active orders right now. Kitchen is clear! ✨
          </div>
        )}
      </div>
    </div>
  );
}