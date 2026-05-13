import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './KitchenScreen.css';

const KitchenScreen = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchOrders = async () => {
    try {
      const res = await axios.get('https://cafe-os-backend-production.up.railway.app/orders');
      setOrders(res.data);
    } catch (err) {
      console.error("Error fetching orders", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(), 3000); 
    return () => clearInterval(interval);
  }, []);

  const updateOrderStatus = async (id, newStatus) => {
    setProcessingId(id); 
    try {
      await axios.put(`https://cafe-os-backend-production.up.railway.app/orders/${id}/status?status=${newStatus}`);
      await fetchOrders(); 
    } catch {
      alert('Error updating status');
    } finally {
      setProcessingId(null); 
    }
  };

  const handleCompleteOrder = async (id) => {
    setProcessingId(id); 
    try {
      await axios.put(`https://cafe-os-backend-production.up.railway.app/orders/${id}/status?status=Completed`);
      await fetchOrders();
    } catch {
      alert('Error completing order');
    } finally {
      setProcessingId(null); 
    }
  };

  const activeOrders = orders.filter(o => o.status === 'Accepted' || o.status === 'Preparing' || o.status === 'Ready');

  // 👇 NAYA: Rendering se pehle orders ko Customer Name aur Status ke hisaab se Group kiya 👇
  const groupedOrders = activeOrders.reduce((acc, currentOrder) => {
    // Check karein agar is bande ka same status wala card pehle se list mein hai
    const existingGroup = acc.find(group => 
      group.customer_name?.toLowerCase().trim() === currentOrder.customer_name?.toLowerCase().trim() &&
      group.status === currentOrder.status
    );

    // Current order ke items nikal lo (agar nested items na ho toh khud current order ko item maan lo)
    const currentItems = currentOrder.items && currentOrder.items.length > 0 
      ? currentOrder.items 
      : [{ 
          name: currentOrder.name || 'Item', 
          quantity: currentOrder.quantity || 1, 
          addons: currentOrder.addons || [],
          itemTotal: currentOrder.itemTotal || currentOrder.price || 0 
        }];

    if (existingGroup) {
      // Agar group exist karta hai, toh naye items usi list mein add kar do
      existingGroup.items = [...existingGroup.items, ...currentItems];
      // Note: Hum button action ke liye primary/first ID hi use karenge
    } else {
      // Naya banda hai toh naya object bana kar push kar do
      acc.push({
        ...currentOrder,
        // Items array safely assign karte hain
        items: [...currentItems],
        // Target ID mapping ke liye
        primaryTargetId: currentOrder._id || currentOrder.id 
      });
    }

    return acc;
  }, []);

  return (
    <div className="kitchen-container">
      
      {isLoading && (
        <div className="kitchen-loading-overlay">
           <div className="kitchen-spinner"></div>
           <h2 className="kitchen-loading-text">Loading Orders... 👨‍🍳</h2>
        </div>
      )}

      <div className="kitchen-header">
        <h1 className="kitchen-title">Kitchen Orders 👨‍🍳</h1>
        <div className="kitchen-active-count">
          {/* Total individual cards count */}
          Active: <span className="kitchen-active-number">{groupedOrders.length}</span>
        </div>
      </div>

      {!isLoading && groupedOrders.length === 0 ? (
        <div className="kitchen-empty-state">
          <svg className="kitchen-empty-icon" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"></path>
            <line x1="6" y1="17" x2="18" y2="17"></line>
          </svg>
          <h2 className="kitchen-empty-title">Kitchen is Clear! ✨</h2>
          <p className="kitchen-empty-subtitle">Waiting for new orders to arrive...</p>
        </div>
      ) : (
        <div className="kitchen-grid">
          {/* 👇 NAYA: Ab 'activeOrders' ki jagah 'groupedOrders.map' chalaya 👇 */}
          {groupedOrders.map((orderGroup) => {
            const isAccepted = orderGroup.status === 'Accepted';
            const isPreparing = orderGroup.status === 'Preparing';
            
            let headerColor, btnColor, btnText, action;
            const targetId = orderGroup.primaryTargetId;
            const isProcessing = processingId === targetId;

            if (isAccepted) { 
              headerColor = '#f5a623'; btnColor = '#0ea5e9'; btnText = '🔥 Start Preparing'; 
              action = () => updateOrderStatus(targetId, 'Preparing'); 
            } else if (isPreparing) { 
              headerColor = '#2196f3'; btnColor = '#22c55e'; btnText = '✓ Mark as Ready'; 
              action = () => updateOrderStatus(targetId, 'Ready'); 
            } else { 
              headerColor = '#22c55e'; btnColor = '#e74c3c'; btnText = '🤝 Hand Over'; 
              action = () => handleCompleteOrder(targetId); 
            }

            return (
              <div key={targetId} className={`kitchen-card ${isProcessing ? 'processing' : ''}`}>
                
                <div className="card-top-bar" style={{ backgroundColor: headerColor }}>
                  <h2 className="card-order-id">#{orderGroup.id}</h2>
                  <span className="card-status-badge">{orderGroup.status}</span>
                </div>
                
                <div className="card-body">
                  <div className="card-customer">👤 {orderGroup.customer_name}</div>
                  <div className="item-list">
                    {/* Combine kiye hue saare items yahan render honge */}
                    {orderGroup.items.map((item, i) => (
                      <div key={i} className="item-row">
                        <div className="item-name-col">
                          {item.name}
                          {item.addons && item.addons.length > 0 && (
                            <div className="item-addons">+ {item.addons.map(a => a.name).join(', ')}</div>
                          )}
                        </div>
                        <span className="item-qty">x{item.quantity || 1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-action-box">
                  <button 
                    className="kitchen-btn"
                    onClick={action}
                    disabled={isProcessing}
                    style={{ 
                      backgroundColor: isProcessing ? '#9ca3af' : btnColor, 
                      boxShadow: isProcessing ? 'none' : `0 4px 10px ${btnColor}40` 
                    }}
                  >
                    {isProcessing ? '⏳ Updating...' : btnText}
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
