import React, { useState, useEffect, useRef } from 'react';
import './DisplayScreen.css'; 

const API_URL = 'https://cafe-os-backend-production.up.railway.app';

export default function DisplayScreen() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const prepRef = useRef(null);
  const collRef = useRef(null);

  useEffect(() => {
    // 👇 NAYA: Ek function banaya jo orders fetch karega
    const loadOrders = () => {
      fetch(`${API_URL}/orders`)
        .then(res => res.json())
        .then(data => {
          setOrders(data);
          setIsLoading(false); 
        })
        .catch(err => {
          console.error(err);
          setIsLoading(false);
        });
    };

    // Pehli baar turant fetch karo
    loadOrders();

    // 👇 NAYA: Har 3 second baad naye orders fetch karta rahega (LIVE UPDATE)
    const dataInterval = setInterval(loadOrders, 3000);

    return () => clearInterval(dataInterval);
  }, []);

  // Auto-scroll wala hissa (Purana wala hi hai)
  useEffect(() => {
    const autoScroll = (ref) => {
      if (ref.current) {
        const { scrollTop, scrollHeight, clientHeight } = ref.current;
        if (scrollTop + clientHeight >= scrollHeight - 5) ref.current.scrollTo({ top: 0, behavior: 'smooth' });
        else ref.current.scrollBy({ top: 120, behavior: 'smooth' });
      }
    };
    const scrollTimer = setInterval(() => { autoScroll(prepRef); autoScroll(collRef); }, 3000);
    return () => clearInterval(scrollTimer);
  }, []);

  const preparingOrders = orders.filter(o => o.status === 'Preparing');
  const readyOrders = orders.filter(o => o.status === 'Ready').slice(-30); 

  const formatOrderTime = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="display-container">
      
      {isLoading && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: '#1e272e', zIndex: 9999, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
           <div style={{ width: '80px', height: '80px', border: '8px solid #2d3436', borderTopColor: '#00b894', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
           <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
           <h2 style={{ color: 'white', marginTop: '30px', fontSize: '2.5rem', letterSpacing: '2px' }}>Loading Live Screen... 📺</h2>
        </div>
      )}

      <div className="tv-main-content">
        <div className="panel panel-preparing">
          <h1 className="main-heading heading-prep">Preparing</h1>
          <div className="grid-row list-header header-prep"><div>Order ID</div><div>Name</div><div style={{ textAlign: 'right' }}>Time</div></div>
          <div className="order-list" ref={prepRef}>
            {preparingOrders.map(o => (
              <div key={o.id} className="grid-row order-card card-prep">
                <div className="col-id id-prep">#{o.id}</div><div className="col-name name-prep">{o.customer_name}</div><div className="col-time time-prep">{formatOrderTime(o.created_at || o.createdAt || o.date)}</div>
              </div>
            ))}
            {preparingOrders.length === 0 && (<p style={{ textAlign: 'center', color: '#b2bec3', marginTop: '20px', fontWeight: 'bold' }}>No orders preparing right now.</p>)}
          </div>
        </div>

        <div className="panel panel-collect">
          <h1 className="main-heading heading-coll">Please Collect</h1>
          <div className="grid-row list-header header-coll"><div>Order ID</div><div>Name</div><div style={{ textAlign: 'right' }}>Time</div></div>
          <div className="order-list" ref={collRef}>
            {readyOrders.map(o => (
              <div key={o.id} className="grid-row order-card card-coll">
                <div className="col-id id-coll">#{o.id}</div><div className="col-name name-coll">{o.customer_name}</div><div className="col-time time-coll">{formatOrderTime(o.created_at || o.createdAt || o.date)}</div>
              </div>
            ))}
            {readyOrders.length === 0 && (<p style={{ textAlign: 'center', color: '#7bdcb5', marginTop: '20px', fontWeight: 'bold' }}>All orders collected.</p>)}
          </div>
        </div>
      </div>
      <div className="footer-scroller"><div className="marquee">🍔 Welcome to RE:FILL! Freshly prepared, just for you. ☕</div></div>
    </div>
  );
}
