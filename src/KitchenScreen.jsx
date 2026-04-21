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
    const interval = setInterval(() => fetchOrders(), 5000); 
    return () => clearInterval(interval);
  }, []);

  const handleCompleteOrder = async (id) => {
    try {
      await axios.delete(`https://cafe-os-backend.onrender.com/orders/${id}`);
      fetchOrders(); 
    } catch (error) { alert('Error completing order'); }
  };

  return (
    <div style={{ backgroundColor: '#111827', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      
      <div style={{ backgroundColor: '#1f2937', padding: '15px 30px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '4px solid #ef4444' }}>
        <h1 style={{ margin: 0, color: 'white', fontSize: '2rem' }}>👨‍🍳 Kitchen Display System</h1>
        <div style={{ backgroundColor: '#ef4444', color: 'white', padding: '10px 20px', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold' }}>
          Pending Orders: {orders.length}
        </div>
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '100px' }}>
          <h1 style={{ fontSize: '4rem', margin: 0 }}>☕</h1>
          <h2>No Pending Orders</h2>
          <p>Kitchen is clear!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {orders.map((order, idx) => (
            <div key={order._id || idx} style={{ backgroundColor: '#fef9c3', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderTop: '8px solid #eab308', display: 'flex', flexDirection: 'column' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px dashed #ca8a04', paddingBottom: '10px', marginBottom: '15px' }}>
                <h2 style={{ margin: 0, color: '#854d0e', fontSize: '1.5rem' }}>{order.customer_name}</h2>
                <span style={{ color: '#a16207', fontWeight: 'bold' }}>#{String(order._id || idx).slice(-4)}</span>
              </div>
              
              <div style={{ flex: 1, marginBottom: '20px' }}>
                {order.items && order.items.map((item, i) => (
                  <div key={i} style={{ marginBottom: '12px', fontSize: '1.2rem', color: '#1f2937', fontWeight: 'bold' }}>
                    • {item.quantity}x {item.name}
                    {item.addons && item.addons.length > 0 && (
                      <div style={{ color: '#dc2626', fontSize: '1rem', marginLeft: '20px', marginTop: '4px' }}>
                        + {item.addons.map(a => a.name).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button 
                onClick={() => handleCompleteOrder(order._id)}
                style={{ width: '100%', padding: '15px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}
              >
                Food Ready 🛎️
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default KitchenScreen;
