import React, { useState, useEffect } from 'react';

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
  const completedOrders = orders.filter(o => o.status === 'Completed').slice(-12);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100vh', 
      background: '#1a1c1e',
      color: 'white',
      fontFamily: 'sans-serif',
      overflow: 'hidden' 
    }}>
      
      {/* CSS Animation for the Footer Marquee */}
      <style>
        {`
          @keyframes marqueeText {
            0% { transform: translateX(100vw); }
            100% { transform: translateX(-100%); }
          }
        `}
      </style>

      {/* Main Content Area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* LEFT PANEL: PREPARING */}
        <div style={{ 
          flex: 1, 
          borderRight: '2px solid #2d3436', 
          display: 'flex', 
          flexDirection: 'column' 
        }}>
          <h1 style={{ textAlign: 'center', color: '#ff9f43', padding: '20px', margin: 0, fontSize: '3rem', borderBottom: '1px solid #2d3436' }}>
            Preparing
          </h1>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', paddingBottom: '40px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
              {preparingOrders.map(o => (
                <div key={o.id} style={{ 
                  background: 'transparent', 
                  border: '2px solid #ff9f43', 
                  borderRadius: '15px', 
                  padding: '20px 10px', 
                  textAlign: 'center',
                  boxShadow: '0 4px 15px rgba(255, 159, 67, 0.1)'
                }}>
                  <div style={{ fontSize: '1.2rem', color: '#ff9f43', marginBottom: '5px' }}>ID: {o.id}</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {o.customer_name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: PLEASE COLLECT */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column' 
        }}>
          <h1 style={{ textAlign: 'center', color: '#2ecc71', padding: '20px', margin: 0, fontSize: '3rem', borderBottom: '1px solid #2d3436' }}>
            Please Collect
          </h1>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', paddingBottom: '40px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
              {completedOrders.map(o => (
                <div key={o.id} style={{ 
                  background: '#2ecc71', 
                  borderRadius: '15px', 
                  padding: '20px 10px', 
                  textAlign: 'center',
                  boxShadow: '0 4px 15px rgba(46, 204, 113, 0.3)'
                }}>
                  <div style={{ fontSize: '1.2rem', color: '#145c32', marginBottom: '5px', fontWeight: 'bold' }}>ID: {o.id}</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {o.customer_name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ANIMATED FOOTER SCROLLER */}
      <div style={{ 
        height: '60px', 
        background: '#ff793f', 
        display: 'flex', 
        alignItems: 'center', 
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: 'white',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        zIndex: 10,
        flexShrink: 0 // Yeh footer ko dabne (squish hone) se rokega
      }}>
         <div style={{ animation: 'marqueeText 20s linear infinite', display: 'inline-block', width: '100%' }}>
            🍔 Welcome to RE:FILL! Freshly prepared, just for you. ☕
         </div>
      </div>

    </div>
  );
}
