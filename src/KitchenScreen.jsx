import React, { useState, useEffect } from 'react';
import axios from 'axios';

const KitchenScreen = () => {
  const [orders, setOrders] = useState([]);

  const fetchOrders = () => {
    // 👇 FIX: Link updated to Railway
    axios.get('https://cafe-os-backend-production.up.railway.app/orders')
      .then(res => setOrders(res.data))
      .catch(err => console.error("Error fetching orders", err));
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(), 3000); 
    return () => clearInterval(interval);
  }, []);

  const updateOrderStatus = async (id, newStatus) => {
    // 🚀 OPTIMISTIC UPDATE: Kitchen display instant update hoga bina server ka wait kiye!
    setOrders(prevOrders => prevOrders.map(order => 
      (order.id === id || order._id === id) ? { ...order, status: newStatus } : order
    ));

    try {
      // 👇 FIX: Link updated to Railway
      await axios.put(`https://cafe-os-backend-production.up.railway.app/orders/${id}/status?status=${newStatus}`);
    } catch (error) {
      alert('Error updating status');
      fetchOrders(); // Agar net chala jaye toh wapas purana data laao
    }
  };

 const handleCompleteOrder = async (id) => {
  // 🚀 OPTIMISTIC UPDATE
  setOrders(prevOrders => prevOrders.map(order => 
    (order.id === id || order._id === id) ? { ...order, status: 'Completed' } : order
  ));

  try {
    // 👇 FIX: Link updated to Railway
    await axios.put(`https://cafe-os-backend-production.up.railway.app/orders/${id}/status?status=Completed`);
  } catch (error) {
    alert('Error completing order');
    fetchOrders();
  }
};

  const activeOrders = orders.filter(o => o.status === 'Accepted' || o.status === 'Preparing' || o.status === 'Ready');

  return (
    <div style={{ backgroundColor: '#f0fdfa', minHeight: '100vh', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      
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
            const isPreparing = order.status === 'Preparing';
            
            let headerColor, btnColor, btnText, action;

            // FIX: order.id ki jagah MongoDB ka unique order._id use kiya gaya hai actions ke liye
            const uniqueTargetId = order._id || order.id;

            if (isAccepted) {
              headerColor = '#f5a623'; 
              btnColor = '#0ea5e9';    
              btnText = '🔥 Start Preparing';
              action = () => updateOrderStatus(uniqueTargetId, 'Preparing');
            } else if (isPreparing) {
              headerColor = '#2196f3'; 
              btnColor = '#22c55e';    
              btnText = '✓ Mark as Ready';
              action = () => updateOrderStatus(uniqueTargetId, 'Ready');
            } else {
              headerColor = '#22c55e'; 
              btnColor = '#e74c3c';    // Red for Handover to make it distinct
              btnText = '🤝 Hand Over';
              action = () => handleCompleteOrder(uniqueTargetId); 
            }

            return (
              <div key={order._id || order.id} style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                
                <div style={{ backgroundColor: headerColor, padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '900' }}>#{order.id}</h2>
                  <span style={{ backgroundColor: 'rgba(255,255,255,0.3)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    {order.status}
                  </span>
                </div>
                
                <div style={{ padding: '20px', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1f2937', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '15px', borderBottom: '2px solid #f3f4f6', paddingBottom: '15px' }}>
                    👤 {order.customer_name}
                  </div>
                  
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

                <div style={{ padding: '0 20px 20px 20px' }}>
                  <button 
                    onClick={action}
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
