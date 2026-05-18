import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client'; // 🔥 WebSocket Import
import './DisplayScreen.css'; 

const API_URL = 'https://cafe-os-backend-production.up.railway.app';

export default function DisplayScreen() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
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

    // Pehli baar load hone par data fetch karo
    fetchLiveOrders();

    // ⚡ WEBSOCKET CONNECTION (Instant Update)
    const socket = io(API_URL);
    socket.on('orderUpdated', () => {
      console.log("🔥 Live TV Update Received!");
      fetchLiveOrders(true); // Silent fetch bina loading screen ke
    });

    // Cleanup
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
      autoScroll(prepRef); 
      autoScroll(collRef); 
    }, 3000);
    return () => clearInterval(scrollTimer);
  }, []);

  // 🛡️ DEDUPLICATION REMOVED: Ab har Order ID separately dikhegi
  // Sirf status ke hisaab se filter aur time ke hisaab se sort kar rahe hain
  const preparingOrders = orders
    .filter(o => o.status === 'Preparing')
    .sort((a, b) => new Date(a.createdAt || a.created_at || Date.now()) - new Date(b.createdAt || b.created_at || Date.now()));

  const readyOrders = orders
    .filter(o => o.status === 'Ready')
    .sort((a, b) => new Date(b.createdAt || b.created_at || Date.now()) - new Date(a.createdAt || a.created_at || Date.now())) // Latest pehle
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
        
        {/* PREPARING PANEL */}
        <div className="panel panel-preparing">
          <h1 className="main-heading heading-prep">Preparing</h1>
          <div className="grid-row list-header header-prep">
            <div>Order ID</div>
            <div>Name</div>
            <div style={{ textAlign: 'right' }}>Time</div>
          </div>
          
          <div className="order-list" ref={prepRef}>
            {preparingOrders.map(o => (
              <div key={o.id || o._id} className="grid-row order-card card-prep">
                <div className="col-id id-prep">#{o.id}</div>
                <div className="col-name name-prep">{o.customer_name}</div>
                <div className="col-time time-prep">{formatOrderTime(o.created_at || o.createdAt || o.date)}</div>
              </div>
            ))}
            {preparingOrders.length === 0 && (
              <p style={{ textAlign: 'center', color: '#b2bec3', marginTop: '20px', fontWeight: 'bold' }}>
                No orders preparing right now.
              </p>
            )}
          </div>
        </div>

        {/* READY TO COLLECT PANEL */}
        <div className="panel panel-collect">
          <h1 className="main-heading heading-coll">Please Collect</h1>
          <div className="grid-row list-header header-coll">
            <div>Order ID</div>
            <div>Name</div>
            <div style={{ textAlign: 'right' }}>Time</div>
          </div>
          
          <div className="order-list" ref={collRef}>
            {readyOrders.map(o => (
              <div key={o.id || o._id} className="grid-row order-card card-coll">
                <div className="col-id id-coll">#{o.id}</div>
                <div className="col-name name-coll">{o.customer_name}</div>
                <div className="col-time time-coll">{formatOrderTime(o.created_at || o.createdAt || o.date)}</div>
              </div>
            ))}
            {readyOrders.length === 0 && (
              <p style={{ textAlign: 'center', color: '#7bdcb5', marginTop: '20px', fontWeight: 'bold' }}>
                All orders collected.
              </p>
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
