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

  // 👇 NAYA: Ek se zyada IDs ko ek saath update karne ke liye Promise.all lagaya 👇
  const updateOrderStatus = async (ids, newStatus) => {
    // Check karte hain ki single ID hai ya array, fir sabko array bana lete hain
    const idArray = Array.isArray(ids) ? ids : [ids];
    setProcessingId(idArray[0]); 
    try {
      // Saare grouped orders ko backend me ek saath parallel update karega
      await Promise.all(
        idArray.map(id => 
          axios.put(`https://cafe-os-backend-production.up.railway.app/orders/${id}/status?status=${newStatus}`)
        )
      );
      await fetchOrders(); 
    } catch {
      alert('Error updating status');
    } finally {
      setProcessingId(null); 
    }
  };

  // 👇 NAYA: Hand Over button ke liye bhi same multi-ID logic 👇
  const handleCompleteOrder = async (ids) => {
    const idArray = Array.isArray(ids) ? ids : [ids];
    setProcessingId(idArray[0]); 
    try {
      await Promise.all(
        idArray.map(id => 
          axios.put(`https://cafe-os-backend-production.up.railway.app/orders/${id}/status?status=Completed`)
        )
      );
      await fetchOrders();
    } catch {
      alert('Error completing order');
    } finally {
      setProcessingId(null); 
    }
  };

  const activeOrders = orders.filter(o => o.status === 'Accepted' || o.status === 'Preparing' || o.status === 'Ready');

  // 👇 NAYA: Grouping me hum saare merged order IDs ko ek array (allTargetIds) me store kar lete hain 👇
  const groupedOrders = activeOrders.reduce((acc, currentOrder) => {
    const existingGroup = acc.find(group => 
      group.customer_name?.toLowerCase().trim() === currentOrder.customer_name?.toLowerCase().trim() &&
      group.status === currentOrder.status
    );

    const currentItems = currentOrder.items && currentOrder.items.length > 0 
      ? currentOrder.items 
      : [{ 
          name: currentOrder.name || 'Item', 
          quantity: currentOrder.quantity || 1, 
          addons: currentOrder.addons || [],
          itemTotal: currentOrder.itemTotal || currentOrder.price || 0 
        }];

    const currentOrderId = currentOrder._id || currentOrder.id;

    if (existingGroup) {
      existingGroup.items = [...existingGroup.items, ...currentItems];
      // Agar naya ID hai toh use bhi allTargetIds me daal dete hain
      if (currentOrderId && !existingGroup.allTargetIds.includes(currentOrderId)) {
        existingGroup.allTargetIds.push(currentOrderId);
      }
    } else {
      acc.push({
        ...currentOrder,
        items: [...currentItems],
        primaryTargetId: currentOrderId,
        // Shuruat me pehli ID ko array me save kiya
        allTargetIds: currentOrderId ? [currentOrderId] : []
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
          {groupedOrders.map((orderGroup) => {
            const isAccepted = orderGroup.status === 'Accepted';
            const isPreparing = orderGroup.status === 'Preparing';
            
            let headerColor, btnColor, btnText, action;
            // Hum is group ke saare IDs pass karenge action me
            const targetIds = orderGroup.allTargetIds;
            const isProcessing = processingId === orderGroup.primaryTargetId;

            if (isAccepted) { 
              headerColor = '#f5a623'; btnColor = '#0ea5e9'; btnText = '🔥 Start Preparing'; 
              action = () => updateOrderStatus(targetIds, 'Preparing'); 
            } else if (isPreparing) { 
              headerColor = '#2196f3'; btnColor = '#22c55e'; btnText = '✓ Mark as Ready'; 
              action = () => updateOrderStatus(targetIds, 'Ready'); 
            } else { 
              headerColor = '#22c55e'; btnColor = '#e74c3c'; btnText = '🤝 Hand Over'; 
              action = () => handleCompleteOrder(targetIds); 
            }

            return (
              <div key={orderGroup.primaryTargetId} className={`kitchen-card ${isProcessing ? 'processing' : ''}`}>
                
                <div className="card-top-bar" style={{ backgroundColor: headerColor }}>
                  <h2 className="card-order-id">#{orderGroup.id}</h2>
                  <span className="card-status-badge">{orderGroup.status}</span>
                </div>
                
                <div className="card-body">
                  <div className="card-customer">👤 {orderGroup.customer_name}</div>
                  <div className="item-list">
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
