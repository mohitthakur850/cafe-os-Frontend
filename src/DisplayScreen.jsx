import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client'; 
import './DisplayScreen.css'; 

const API_URL = 'https://cafe-os-backend.onrender.com';

export default function DisplayScreen() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 3 Refs for 3 Columns Auto-Scrolling
  const pendRef = useRef(null);
  const prepRef = useRef(null);
  const collRef = useRef(null);

  // 🔄 Live Fetching Engine with WebSockets
  useEffect(() => {
    const fetchLiveOrders = (isSilent = false) => {
      if (!isSilent) setIsLoading(true);
      fetch(`${API_URL}/orders?t=${Date.now()}`, { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          setOrders(data);
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Live Update Error:", err);
          setIsLoading(false);
        });
    };

    fetchLiveOrders();

    // ⚡ WEBSOCKET CONNECTION
    const socket = io(API_URL, { transports: ['websocket'] });
    socket.on('orderUpdated', () => {
      console.log("🔥 Live TV Update Received!");
      fetchLiveOrders(true); 
    });

    return () => socket.disconnect();
  }, []);

  // 📜 Auto-Scroll Engine for TV Screen
  useEffect(() => {
    const autoScroll = (ref) => {
      if (ref.current) {
        const { scrollTop, scrollHeight, clientHeight } = ref.current;
        if (scrollTop + clientHeight >= scrollHeight - 5) {
          ref.current.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          ref.current.scrollBy({ top: 120, behavior: 'smooth' });
        }
      }
    };
    
    const scrollTimer = setInterval(() => { 
      autoScroll(pendRef);
      autoScroll(prepRef); 
      autoScroll(collRef); 
    }, 3000);
    return () => clearInterval(scrollTimer);
  }, []);

  // 🛡️ FILTERING LOGIC FOR 3 COLUMNS (Added Duplicate ID Remover)
  const pendingOrders = orders
    .filter(o => o.status === 'Accepted')
    .filter((order, index, self) => index === self.findIndex(t => (t.id || t._id) === (order.id || order._id))) // 🔥 Duplicate Fix
    .sort((a, b) => new Date(a.createdAt || a.created_at || Date.now()) - new Date(b.createdAt || b.created_at || Date.now()));

  const preparingOrders = orders
    .filter(o => o.status === 'Preparing')
    .filter((order, index, self) => index === self.findIndex(t => (t.id || t._id) === (order.id || order._id))) // 🔥 Duplicate Fix
    .sort((a, b) => new Date(a.createdAt || a.created_at || Date.now()) - new Date(b.createdAt || b.created_at || Date.now()));

  const readyOrders = orders
    .filter(o => o.status === 'Ready')
    .filter((order, index, self) => index === self.findIndex(t => (t.id || t._id) === (order.id || order._id))) // 🔥 Duplicate Fix
    .sort((a, b) => new Date(b.createdAt || b.created_at || Date.now()) - new Date(a.createdAt || a.created_at || Date.now())) 
    .slice(0, 30); 

  const formatOrderTime = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="display-container">
      
      {isLoading && (
        <div className="tv-loading-overlay">
          <div className="tv-loading-spinner"></div>
          <h2 className="tv-loading-text">Loading Live Screen... 📺</h2>
        </div>
      )}

      <div className="tv-main-content">
        
        {/* 1️⃣ PENDING (IN QUEUE) PANEL */}
        <div className="panel panel-pending">
          <h1 className="main-heading heading-pend">In Queue</h1>
          <div className="grid-row list-header header-pend">
            <div>ID</div>
            <div>Name</div>
            <div style={{ textAlign: 'right' }}>Time</div>
          </div>
          
          <div className="order-list" ref={pendRef}>
            {pendingOrders.map(o => (
              <div key={o.id || o._id} className="grid-row order-card card-pend">
                <div className="col-id id-pend">#{o.id}</div>
                <div className="col-name name-pend">{o.customer_name}</div>
                <div className="col-time time-pend">{formatOrderTime(o.createdAt || o.created_at || o.date)}</div>
              </div>
            ))}
            {pendingOrders.length === 0 && (
              <p className="empty-tv-text">No orders waiting.</p>
            )}
          </div>
        </div>

        {/* 2️⃣ PREPARING PANEL */}
        <div className="panel panel-preparing">
          <h1 className="main-heading heading-prep">Preparing</h1>
          <div className="grid-row list-header header-prep">
            <div>ID</div>
            <div>Name</div>
            <div style={{ textAlign: 'right' }}>Time</div>
          </div>
          
          <div className="order-list" ref={prepRef}>
            {preparingOrders.map(o => (
              <div key={o.id || o._id} className="grid-row order-card card-prep">
                <div className="col-id id-prep">#{o.id}</div>
                <div className="col-name name-prep">{o.customer_name}</div>
                <div className="col-time time-prep">{formatOrderTime(o.createdAt || o.created_at || o.date)}</div>
              </div>
            ))}
            {preparingOrders.length === 0 && (
              <p className="empty-tv-text">No orders preparing right now.</p>
            )}
          </div>
        </div>

        {/* 3️⃣ READY TO COLLECT PANEL */}
        <div className="panel panel-collect">
          <h1 className="main-heading heading-coll">Please Collect</h1>
          <div className="grid-row list-header header-coll">
            <div>ID</div>
            <div>Name</div>
            <div style={{ textAlign: 'right' }}>Time</div>
          </div>
          
          <div className="order-list" ref={collRef}>
            {readyOrders.map(o => (
              <div key={o.id || o._id} className="grid-row order-card card-coll">
                <div className="col-id id-coll">#{o.id}</div>
                <div className="col-name name-coll">{o.customer_name}</div>
                <div className="col-time time-coll">{formatOrderTime(o.createdAt || o.created_at || o.date)}</div>
              </div>
            ))}
            {readyOrders.length === 0 && (
              <p className="empty-tv-text">All orders collected.</p>
            )}
          </div>
        </div>
      </div>
      
      {/* FOOTER MARQUEE */}
      <div className="footer-scroller">
        <div className="marquee">🍔 Welcome to RE:FILL! Freshly prepared, just for you. ☕</div>
      </div>
    </div>
  );
}