import React, { useState, useEffect } from 'react';
import './DisplayScreen.css'; 

const API_URL = 'https://cafe-os-backend.onrender.com';
const WS_URL = 'wss://cafe-os-backend.onrender.com';

export default function DisplayScreen() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/orders`).then(res => res.json()).then(setOrders);
    
    const socket = new WebSocket(WS_URL);
    socket.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if(msg.type === "STATUS_UPDATE" || msg.type === "NEW_ORDER") {
         fetch(`${API_URL}/orders`).then(res => res.json()).then(setOrders);
      }
    };
    return () => socket.close();
  }, []);

  const preparingOrders = orders.filter(o => o.status === 'Preparing');
  const completedOrders = orders.filter(o => o.status === 'Completed').slice(-15); 

  const formatOrderTime = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="display-container">
      
      {/* Naya Class Name Yahan Apply Kiya Gaya Hai */}
      <div className="tv-main-content">
        
        {/* ================= LEFT PANEL: PREPARING ================= */}
        <div className="panel panel-preparing">
          <h1 className="main-heading heading-prep">
            Preparing
          </h1>
          
          <div className="grid-row list-header header-prep">
            <div>Order ID</div>
            <div>Name</div>
            <div style={{ textAlign: 'right' }}>Time</div>
          </div>

          <div className="order-list">
            {preparingOrders.map(o => (
              <div key={o.id} className="grid-row order-card card-prep">
                <div className="col-id id-prep">
                  #{o.id}
                </div>
                <div className="col-name name-prep">
                  {o.customer_name}
                </div>
                <div className="col-time time-prep">
                  {formatOrderTime(o.created_at || o.createdAt || o.date)}
                </div>
              </div>
            ))}
            {preparingOrders.length === 0 && (
              <p style={{ textAlign: 'center', color: '#b2bec3', marginTop: '20px', fontWeight: 'bold' }}>
                No orders preparing right now.
              </p>
            )}
          </div>
        </div>

        {/* ================= RIGHT PANEL: PLEASE COLLECT ================= */}
        <div className="panel panel-collect">
          <h1 className="main-heading heading-coll">
            Please Collect
          </h1>
          
          <div className="grid-row list-header header-coll">
            <div>Order ID</div>
            <div>Name</div>
            <div style={{ textAlign: 'right' }}>Time</div>
          </div>

          <div className="order-list">
            {completedOrders.map(o => (
              <div key={o.id} className="grid-row order-card card-coll">
                <div className="col-id id-coll">
                  #{o.id}
                </div>
                <div className="col-name name-coll">
                  {o.customer_name}
                </div>
                <div className="col-time time-coll">
                  {formatOrderTime(o.created_at || o.createdAt || o.date)}
                </div>
              </div>
            ))}
            {completedOrders.length === 0 && (
              <p style={{ textAlign: 'center', color: '#7bdcb5', marginTop: '20px', fontWeight: 'bold' }}>
                All orders collected.
              </p>
            )}
          </div>
        </div>

      </div>

      {/* ================= ANIMATED FOOTER SCROLLER ================= */}
      <div className="footer-scroller">
         <div className="marquee">
            🍔 Welcome to RE:FILL! Freshly prepared, just for you. ☕
         </div>
      </div>

    </div>
  );
}