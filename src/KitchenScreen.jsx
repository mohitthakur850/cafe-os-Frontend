import React, { useState, useEffect } from 'react';
import axios from 'axios';

const KitchenScreen = () => {
  const [orders, setOrders] = useState([]);

  const fetchOrders = () => {
    axios.get('https://cafe-os-backend.onrender.com/orders')
      .then(res => setOrders(res.data))
      .catch(err => console.error("Error fetching orders", err));
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(), 3000); // Har 3 second mein fast update
    return () => clearInterval(interval);
  }, []);

  // Backend mein Status Update karne ka function (Accepted -> Preparing -> Ready)
  const updateOrderStatus = async (id, newStatus) => {
    try {
      await axios.put(`https://cafe-os-backend.onrender.com/orders/${id}/status?status=${newStatus}`);
      fetchOrders(); 
    } catch (error) {
      alert('Error updating status');
    }
  };

  // Kitchen mein sirf Accepted aur Preparing orders hi dikhenge
  const activeOrders = orders.filter(o => o.status === 'Accepted' || o.status === 'Preparing');

  return (
    <div style={{ backgroundColor: '#f0fdfa', minHeight: '100vh', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* HEADER */}
      <div style={{ backgroundColor: 'white', padding: '15px 30px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <h1 style={{ margin: 0, color: '#333', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          Kitchen Orders 👨‍🍳
        </h1>
        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#555' }}>
          Active: <span style={{ color: '#dc2626' }}>{activeOrders.length}</span>
        </div>
      </div>

      {activeOrders.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: '100px' }}>
          <h1 style={{ fontSize: '4rem', margin: 0 }}>🍽️</h1>
          <h2>No Active Orders</h2>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', alignItems: 'start' }}>
          {activeOrders.map((order) => {
            const isAccepted = order.status === 'Accepted';
            
            // UI Colors dynamically change based on status
            const headerColor = isAccepted ? '#f5a623' : '#2196f3'; 
            const btnColor = isAccepted ? '#0ea5e9' : '#22c55e';
            const btnText = isAccepted ? '🔥 Start Preparing' : '✓ Mark as Ready';
            const nextStatus = isAccepted ? 'Preparing' : 'Ready';

            return (
              <div key={order.id} style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                
                {/* CARD TOP HEADER (Yellow or Blue) */}
                <div style={{ backgroundColor: headerColor, padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '900' }}>#{order.id}</h2>
                  <span style={{ backgroundColor: 'rgba(255,255,255,0.3)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    {order.status}
                  </span>
                </div>
                
                {/* CARD BODY */}
                <div style={{ padding: '20px', flex: 1 }}>
                  {/* Customer Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1f2937', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '15px', borderBottom: '2px solid #f3f4f6', paddingBottom: '15px' }}>
                    👤 {order.customer_name}
                  </div>
                  
                  {/* Item List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {order.items && order.items.map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', color: '#4b5563', fontSize: '1rem', fontWeight: '500' }}>
                        <div style={{ flex: 1 }}>
                          {item.name}
                          {item.addons && item.addons.length > 0 && (
                            <div style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: '2px' }}>
                              + {item.addons.map(a => a.name).join(', ')}
                            </div>
                          )}
                        </div>
                        <span style={{ backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold', color: '#334155', fontSize: '0.9rem' }}>
                          x{item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ACTION BUTTON */}
                <div style={{ padding: '0 20px 20px 20px' }}>
                  <button 
                    onClick={() => updateOrderStatus(order.id, nextStatus)}
                    style={{ width: '100%', padding: '15px', backgroundColor: btnColor, color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', boxShadow: `0 4px 10px ${btnColor}40` }}
                  >
                    {btnText}
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default KitchenScreen;
