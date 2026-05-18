import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import './KitchenScreen.css';

// 👇 Tera naya Render wala Backend URL
const API_URL = 'https://cafe-os-backend.onrender.com';

export default function KitchenPage() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 🔥 Yeh naya state track karega ki kaunsa order abhi update ho raha hai
  const [updatingOrders, setUpdatingOrders] = useState([]); 

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/orders?t=${Date.now()}`);
      setOrders(res.data);
    } catch (err) {
      console.error("Error fetching kitchen orders:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const socket = io(API_URL, { transports: ['websocket'] });
    
    socket.on('orderUpdated', () => {
      console.log('⚡ New Order Update Received in Kitchen!');
      fetchOrders();
    });

    const interval = setInterval(fetchOrders, 30000);
    return () => { clearInterval(interval); socket.disconnect(); };
  }, []);

  // 🔥 Smart Update Function (With Loading Lock)
  const updateStatus = async (id, status) => {
    setUpdatingOrders(prev => [...prev, id]); // Button ko 'Updating...' state mein daalo

    try {
      await axios.put(`${API_URL}/orders/${id}/status?status=${status}`);
      await fetchOrders(); // Naya data laao
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setUpdatingOrders(prev => prev.filter(orderId => orderId !== id)); // Button normal kar do
    }
  };

  // 🔥 THE MAGIC CODE: Auto-merges duplicate items inside a ticket 🔥
  const groupIdenticalItems = (items) => {
    const grouped = {};
    items.forEach(item => {
      // Create a unique identifier for the item based on name + addons
      const addonStr = item.addons && item.addons.length > 0 
        ? item.addons.map(a => a.name).sort().join(',') 
        : 'no-addons';
      const key = `${item.name}|${addonStr}`;

      if (grouped[key]) {
        grouped[key].quantity += (item.quantity || 1);
      } else {
        grouped[key] = { ...item, quantity: item.quantity || 1 };
      }
    });
    return Object.values(grouped);
  };

  // Organize Orders
  const newOrders = orders.filter(o => o.status === 'Accepted').sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
  const prepOrders = orders.filter(o => o.status === 'Preparing').sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
  const readyOrders = orders.filter(o => o.status === 'Ready').sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 20);

  const activeCount = newOrders.length + prepOrders.length;

  return (
    <div className="kitchen-container">
      {isLoading && (
        <div className="kitchen-loading-overlay">
          <div className="kitchen-spinner"></div>
          <h2 style={{color:'#0f172a', marginTop: '20px'}}>Syncing Kitchen... 👨‍🍳</h2>
        </div>
      )}

      <header className="kitchen-header">
        <h1 className="kitchen-title">👨‍🍳 Kitchen KDS</h1>
        <div className="kitchen-active-count">
          Active Tickets: <span className="kitchen-active-number">{activeCount}</span>
        </div>
      </header>

      <main className="kitchen-main-grid">
        
        {/* ================= COLUMN 1: NEW ORDERS ================= */}
        <section className="kitchen-column">
          <div className="column-header">
            <h3>🚨 New Orders</h3>
            <span className="col-count">{newOrders.length}</span>
          </div>
          <div className="kitchen-grid">
            {newOrders.map(order => {
              const orderId = order._id || order.id;
              const isUpdating = updatingOrders.includes(orderId);

              return (
                <div key={orderId} className="kitchen-card">
                  <div className="card-top-bar bg-orange">
                    <h3 className="card-order-id">#{order.id}</h3>
                    <span className="card-status-badge">New</span>
                  </div>
                  <div className="card-body">
                    <div className="card-customer">👤 {order.customer_name}</div>
                    <div className="item-list">
                      {groupIdenticalItems(order.items).map((item, idx) => (
                        <div key={idx} className="item-row">
                          <div className="item-name-col">
                            {item.name}
                            {item.addons && item.addons.length > 0 && (
                              <span className="item-addons">+ {item.addons.map(a => a.name).join(', ')}</span>
                            )}
                          </div>
                          <div className="item-qty">x{item.quantity}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="card-action-box">
                    <button 
                      className="kitchen-btn" 
                      style={{ backgroundColor: isUpdating ? '#94a3b8' : '#0ea5e9', cursor: isUpdating ? 'not-allowed' : 'pointer' }}
                      disabled={isUpdating}
                      onClick={() => updateStatus(orderId, 'Preparing')}
                    >
                      {isUpdating ? '⏳ Updating...' : '🔥 Start Preparing'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================= COLUMN 2: PREPARING ================= */}
        <section className="kitchen-column">
          <div className="column-header">
            <h3>🔥 Preparing</h3>
            <span className="col-count">{prepOrders.length}</span>
          </div>
          <div className="kitchen-grid">
            {prepOrders.map(order => {
              const orderId = order._id || order.id;
              const isUpdating = updatingOrders.includes(orderId);

              return (
                <div key={orderId} className="kitchen-card">
                  <div className="card-top-bar bg-blue">
                    <h3 className="card-order-id">#{order.id}</h3>
                    <span className="card-status-badge">Cooking</span>
                  </div>
                  <div className="card-body">
                    <div className="card-customer">👤 {order.customer_name}</div>
                    <div className="item-list">
                      {groupIdenticalItems(order.items).map((item, idx) => (
                        <div key={idx} className="item-row">
                          <div className="item-name-col">
                            {item.name}
                            {item.addons && item.addons.length > 0 && (
                              <span className="item-addons">+ {item.addons.map(a => a.name).join(', ')}</span>
                            )}
                          </div>
                          <div className="item-qty">x{item.quantity}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="card-action-box">
                    <button 
                      className="kitchen-btn" 
                      style={{ backgroundColor: isUpdating ? '#94a3b8' : '#22c55e', cursor: isUpdating ? 'not-allowed' : 'pointer' }}
                      disabled={isUpdating}
                      onClick={() => updateStatus(orderId, 'Ready')}
                    >
                      {isUpdating ? '⏳ Updating...' : '✅ Mark as Ready'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================= COLUMN 3: READY TO HANDOVER ================= */}
        <section className="kitchen-column">
          <div className="column-header">
            <h3>✅ Ready to Handover</h3>
            <span className="col-count">{readyOrders.length}</span>
          </div>
          <div className="kitchen-grid">
            {readyOrders.map(order => {
              const orderId = order._id || order.id;
              const isUpdating = updatingOrders.includes(orderId);

              return (
                <div key={orderId} className="kitchen-card">
                  <div className="card-top-bar bg-green">
                    <h3 className="card-order-id">#{order.id}</h3>
                    <span className="card-status-badge">DONE</span>
                  </div>
                  <div className="card-body">
                    <div className="card-customer">👤 {order.customer_name}</div>
                    <div className="item-list">
                      {groupIdenticalItems(order.items).map((item, idx) => (
                        <div key={idx} className="item-row">
                          <div className="item-name-col">
                            {item.name}
                            {item.addons && item.addons.length > 0 && (
                              <span className="item-addons">+ {item.addons.map(a => a.name).join(', ')}</span>
                            )}
                          </div>
                          <div className="item-qty">x{item.quantity}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="card-action-box">
                    <button 
                      className="kitchen-btn" 
                      style={{ backgroundColor: isUpdating ? '#94a3b8' : '#ef4444', cursor: isUpdating ? 'not-allowed' : 'pointer' }}
                      disabled={isUpdating}
                      onClick={() => updateStatus(orderId, 'Completed')} // Backend mein 'Completed' bhejna
                    >
                      {isUpdating ? '⏳ Updating...' : '🤝 Hand Over'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </main>
    </div>
  );
}
