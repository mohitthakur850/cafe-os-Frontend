import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client'; // ⚡ Live Sync Import
import './AdminPage.css';

const API_URL = 'https://cafe-os-backend.onrender.com';

const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const [isLoading, setIsLoading] = useState(true); 

  const [activeTab, setActiveTab] = useState('ORDERS'); 
  const [orderFilter, setOrderFilter] = useState('Today'); 
  
  // Custom Date Range States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingCatId, setEditingCatId] = useState(null); 

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [price, setPrice] = useState('');
  const [addons, setAddons] = useState([{ name: '', price: '' }]);
  const [selectionType, setSelectionType] = useState('Multiple'); // Naya Feature

  const [newCatName, setNewCatName] = useState('');
  const [newCatImg, setNewCatImg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/admin/login`, { username: usernameInput, password: passwordInput });
      if (res.data.success) { setIsAuthenticated(true); setLoginError(''); localStorage.setItem('isAdmin', 'true'); setIsLoading(true); }
    } catch { setLoginError('Invalid Username or Password! 🚫'); setPasswordInput(''); }
  };
  const handleLogout = () => { setIsAuthenticated(false); setUsernameInput(''); setPasswordInput(''); };

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return; 
    try {
      const [pRes, oRes, cRes] = await Promise.all([ axios.get(`${API_URL}/products`), axios.get(`${API_URL}/orders`), axios.get(`${API_URL}/categories`) ]);
      setProducts(pRes.data); setOrders(oRes.data); setCategories(cRes.data);
    } catch (e) { console.error("Error fetching data", e); }
    finally { setIsLoading(false); }
  }, [isAuthenticated]);

  // ⚡ Live WebSocket Engine (No more setInterval)
  useEffect(() => { 
    fetchData(); 
    
    const socket = io(API_URL, { transports: ['websocket'] });
    socket.on('orderUpdated', () => {
      console.log("🔥 Admin Live Update!");
      if (isAuthenticated) fetchData(); 
    });

    return () => socket.disconnect(); 
  }, [fetchData, isAuthenticated]);

  const toggleStock = async (product) => { try { await axios.put(`${API_URL}/products/${product._id || product.id}`, { isAvailable: !product.isAvailable }); fetchData(); } catch { alert('Error updating stock'); } };
  const handleImageUpload = (e, setImageState) => { const file = e.target.files[0]; if (file) { if (file.size > 2000000) return alert("File size should be less than 2MB."); const reader = new FileReader(); reader.onloadend = () => setImageState(reader.result); reader.readAsDataURL(file); } };
  const handleEditCategoryClick = (c) => { setEditingCatId(c._id); setNewCatName(c.name); setNewCatImg(c.image || ''); window.scrollTo(0, 0); };
  const cancelCategoryEdit = () => { setEditingCatId(null); setNewCatName(''); setNewCatImg(''); };
  const handleSaveCategory = async () => { if(!newCatName) return; try { if (editingCatId) { await axios.put(`${API_URL}/categories/${editingCatId}`, { name: newCatName, image: newCatImg }); } else { await axios.post(`${API_URL}/categories`, { name: newCatName, image: newCatImg }); } setEditingCatId(null); setNewCatName(''); setNewCatImg(''); fetchData(); } catch { alert("Error saving category."); } };
  
  const handleAddonChange = (index, field, value) => { const newAddons = [...addons]; newAddons[index][field] = value; setAddons(newAddons); };
  const addAddonRow = () => setAddons([...addons, { name: '', price: '' }]);
  const removeAddonRow = (index) => setAddons(addons.filter((_, i) => i !== index));
  
  const handleEditClick = (p) => { 
    setEditingId(p._id); 
    setName(p.name); 
    setCategory(p.category); 
    setSubCategory(p.subCategory || ''); 
    setDescription(p.description || ''); 
    setImage(p.image || ''); 
    setPrice(p.price); 
    setAddons(p.addons && p.addons.length > 0 ? p.addons : [{ name: '', price: '' }]); 
    setSelectionType(p.selectionType || 'Multiple');
    window.scrollTo(0, 0); 
  };
  
  const handleSaveProduct = async (e) => { 
    e.preventDefault(); 
    const data = { name, category, subCategory, description, image, price: price === '' ? 0 : Number(price), addons: addons.filter(a => a.name), selectionType }; 
    try { 
      if (editingId) { await axios.put(`${API_URL}/products/${editingId}`, data); } 
      else { await axios.post(`${API_URL}/products`, data); } 
      setEditingId(null); setName(''); setCategory(''); setSubCategory(''); setDescription(''); setImage(''); setPrice(''); setAddons([{ name: '', price: '' }]); setSelectionType('Multiple'); fetchData(); 
    } catch { alert('Error saving product'); } 
  };
  
  const handleDeleteProduct = async (id) => { if(window.confirm("Delete this from the menu?")) { await axios.delete(`${API_URL}/products/${id}`); fetchData(); } };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(
        `${API_URL}/orders/${orderId}/status`,
        { status: newStatus }
      );
      fetchData();
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Error updating order status');
    }
  };

  const getFilteredOrders = () => { 
    const today = new Date(); 
    
    const yesterday = new Date(today); 
    yesterday.setDate(yesterday.getDate() - 1); 

    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 30);
    
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    endOfLastMonth.setHours(23, 59, 59, 999);

    return orders.filter(order => { 
      const orderDate = new Date(order.createdAt || Date.now()); 
      
      if (orderFilter === 'Today') return orderDate.toDateString() === today.toDateString(); 
      if (orderFilter === 'Yesterday') return orderDate.toDateString() === yesterday.toDateString(); 
      if (orderFilter === 'Last 30 Days') return orderDate >= last30Days && orderDate <= today;
      if (orderFilter === 'Last Month') return orderDate >= startOfLastMonth && orderDate <= endOfLastMonth;
      
      if (orderFilter === 'Custom Range') {
        if (!startDate || !endDate) return true; 
        const sDate = new Date(startDate); sDate.setHours(0, 0, 0, 0);
        const eDate = new Date(endDate); eDate.setHours(23, 59, 59, 999);
        return orderDate >= sDate && orderDate <= eDate;
      }
      return true; 
    }); 
  };

  const allFilteredOrders = getFilteredOrders();
  const liveOrders = allFilteredOrders.filter(o => o.status !== 'Completed');
  const completedHistory = allFilteredOrders.filter(o => o.status === 'Completed');
  const totalRevenue = completedHistory.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
  const formatDate = (dateString) => new Date(dateString || Date.now()).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  const renderOrderCard = (order, isLive) => (
    <div key={order._id || order.id} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', borderTop: `5px solid ${isLive ? '#0ea5e9' : '#22c55e'}`, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
        <div><h3 style={{ margin: 0, fontSize: '1.4rem', color: '#333', display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ backgroundColor: '#fef08a', color: '#a16207', padding: '4px 10px', borderRadius: '8px', fontSize: '1.2rem', fontWeight: '900' }}>#{order.id}</span>{order.customer_name}</h3><span style={{ color: '#888', fontSize: '0.9rem', display: 'block', marginTop: '5px' }}>{formatDate(order.createdAt)}</span></div>
        <h2 style={{ margin: 0, color: '#28a745' }}>₹{order.total}</h2>
      </div>
      <div style={{ flex: 1, marginBottom: '20px' }}>
        {order.items && order.items.map((item, i) => (
          <div key={i} style={{ marginBottom: '10px', backgroundColor: '#f9f9f9', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}><span style={{ fontWeight: 'bold', color: '#333' }}>{item.quantity}x {item.name}</span>{item.addons && item.addons.length > 0 && (<div style={{ color: '#888', fontSize: '0.85rem', marginTop: '4px' }}>+ {item.addons.map(a => a.name).join(', ')}</div>)}</div>
            <span style={{ fontWeight: 'bold', color: '#555' }}>₹{(Number(item.itemTotal) * Number(item.quantity)) || 0}</span>
          </div>
        ))}
      </div>
      {isLive ? (
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
           {order.status === 'Preparing' ? (
             <button onClick={() => updateOrderStatus(order._id || order.id, 'Ready')} style={{ flex: 1, padding: '12px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>Mark as Ready</button>
           ) : (
             <button onClick={() => updateOrderStatus(order._id || order.id, 'Completed')} style={{ flex: 1, padding: '12px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>Hand Over</button>
           )}
        </div>
      ) : (<div style={{ width: '100%', padding: '15px', backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', textAlign: 'center' }}>✅ Order Completed</div>)}
    </div>
  );

  if (!isAuthenticated) return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <div className="login-card" style={{ backgroundColor: 'white', padding: '50px 40px', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', width: '100%', maxWidth: '450px', textAlign: 'center', borderTop: '8px solid #333' }}>
        <div style={{ backgroundColor: '#f1f5f9', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '2.5rem', margin: '0 auto 20px auto' }}>🔒</div>
        <h1 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '2.2rem', letterSpacing: '-1px' }}>Admin Access</h1><p style={{ color: '#64748b', marginBottom: '35px', fontSize: '1.1rem' }}>Please verify your credentials.</p>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <input type="text" placeholder="Username" value={usernameInput} onChange={e => setUsernameInput(e.target.value)} style={{ padding: '18px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '1.1rem', backgroundColor: '#f8fafc', outline: 'none' }} required />
          <input type="password" placeholder="Password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} style={{ padding: '18px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '1.1rem', backgroundColor: '#f8fafc', outline: 'none' }} required />
          {loginError && <div style={{ color: '#ef4444', backgroundColor: '#fef2f2', padding: '10px', borderRadius: '8px', fontWeight: 'bold' }}>{loginError}</div>}
          <button type="submit" style={{ padding: '18px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1.2rem', fontWeight: '800', cursor: 'pointer', marginTop: '10px' }}>Secure Login ➔</button>
        </form>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f6f8', fontFamily: 'system-ui, sans-serif' }}>
      
      {isLoading && isAuthenticated && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: '#f4f6f8', zIndex: 9999, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
           <div style={{ width: '60px', height: '60px', border: '6px solid #e2e8f0', borderTopColor: '#333', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
           <h2 style={{ color: '#333', marginTop: '20px', letterSpacing: '1px' }}>Loading Dashboard...</h2>
        </div>
      )}

      <div className="admin-navbar">
        <h1 style={{ margin: 0, fontSize: '2rem', letterSpacing: '1px' }}>RE:FILL Admin</h1>
        <div className="admin-nav-right">
          <button className="nav-btn" onClick={() => setActiveTab('ORDERS')} style={{ backgroundColor: activeTab === 'ORDERS' ? '#ffcc00' : '#555', color: activeTab === 'ORDERS' ? '#333' : 'white' }}>🔔 Orders <span style={{ backgroundColor: '#dc3545', color: 'white', padding: '2px 8px', borderRadius: '15px', fontSize: '0.9rem' }}>{liveOrders.length}</span></button>
          <button className="nav-btn" onClick={() => setActiveTab('MENU')} style={{ backgroundColor: activeTab === 'MENU' ? '#ffcc00' : '#555', color: activeTab === 'MENU' ? '#333' : 'white' }}>📦 Menu Mgt</button>
          <button className="nav-btn" onClick={() => setActiveTab('STOCK')} style={{ backgroundColor: activeTab === 'STOCK' ? '#ffcc00' : '#555', color: activeTab === 'STOCK' ? '#333' : 'white' }}>📊 Stock Mgt</button>
          <button className="nav-btn" onClick={handleLogout} style={{ border: '2px solid #ef4444', backgroundColor: 'transparent', color: '#ef4444' }}>Logout 🚪</button>
        </div>
      </div>

      {activeTab === 'ORDERS' && (
        <div className="admin-wrapper">
          <div className="analytics-header">
            <h2 style={{ fontSize: '2.2rem', margin: 0, color: '#333' }}>Order History & Analytics</h2>
            
            <div className="analytics-stats">
              <div style={{ backgroundColor: 'white', padding: '10px 20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', display: 'flex', gap: '20px' }}><div><span style={{color: '#888'}}>Completed:</span> <strong style={{color: '#333', fontSize: '1.2rem'}}>{completedHistory.length}</strong></div><div><span style={{color: '#888'}}>Revenue:</span> <strong style={{color: '#28a745', fontSize: '1.2rem'}}>₹{totalRevenue}</strong></div></div>
              
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select value={orderFilter} onChange={(e) => setOrderFilter(e.target.value)} style={{ padding: '12px 20px', borderRadius: '8px', border: '1px solid #ccc', backgroundColor: 'white', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
                  <option value="Today">Today</option>
                  <option value="Yesterday">Yesterday</option>
                  <option value="Last 30 Days">Last 30 Days</option>
                  <option value="Last Month">Last Month</option>
                  <option value="Custom Range">Custom Range</option>
                </select>

                {orderFilter === 'Custom Range' && (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc', outline: 'none' }} />
                    <span style={{fontWeight: 'bold', color: '#555'}}>To</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc', outline: 'none' }} />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {liveOrders.length > 0 && (<div style={{ marginBottom: '50px' }}><h2 style={{ color: '#0ea5e9', marginBottom: '20px', borderBottom: '2px solid #e0f2fe', paddingBottom: '10px' }}>🔥 Live Kitchen Orders ({liveOrders.length})</h2><div className="auto-grid">{liveOrders.map(order => renderOrderCard(order, true))}</div></div>)}
          <div><h2 style={{ color: '#22c55e', marginBottom: '20px', borderBottom: '2px solid #dcfce7', paddingBottom: '10px' }}>✅ Past Order History ({completedHistory.length})</h2>{completedHistory.length === 0 ? (<p style={{ color: '#888', fontSize: '1.2rem' }}>No completed orders found.</p>) : (<div className="auto-grid">{completedHistory.map(order => renderOrderCard(order, false))}</div>)}</div>
        </div>
      )}

      {activeTab === 'STOCK' && (
        <div className="admin-wrapper">
          <h2 style={{ fontSize: '2.2rem', margin: '0 0 30px 0', color: '#333' }}>📊 Quick Stock Management</h2>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 5px 20px rgba(0,0,0,0.05)' }}>
            {categories.map(cat => {
              const catProducts = products.filter(p => p.category === cat.name);
              if(catProducts.length === 0) return null;
              return (
                <div key={cat._id} style={{ marginBottom: '40px' }}>
                  <h3 style={{ borderBottom: '3px solid #f1f5f9', paddingBottom: '10px', color: '#475569', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px' }}><img src={cat.image} alt="cat" style={{width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover'}}/> {cat.name}</h3>
                  <div className="auto-grid" style={{ marginTop: '20px' }}>
                    {catProducts.map(p => (
                      <div key={p._id || p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: p.isAvailable === false ? '#fff1f2' : '#f8fafc', transition: '0.2s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', overflow: 'hidden' }}><img src={p.image || 'https://via.placeholder.com/50'} alt="item" style={{ width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover', filter: p.isAvailable === false ? 'grayscale(100%) opacity(60%)' : 'none', flexShrink: 0 }} /><div style={{ overflow: 'hidden' }}><div style={{ fontWeight: 'bold', color: p.isAvailable === false ? '#94a3b8' : '#1e293b', fontSize: '1.1rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{p.name}</div><div style={{ fontSize: '0.85rem', color: '#64748b' }}>₹{p.price !== undefined ? p.price : 0}</div></div></div>
                        <button onClick={() => toggleStock(p)} style={{ backgroundColor: p.isAvailable === false ? '#fecdd3' : '#bbf7d0', color: p.isAvailable === false ? '#e11d48' : '#16a34a', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem' }}>{p.isAvailable === false ? 'Out 🚫' : 'In Stock ✅'}</button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'MENU' && (
        <div className="menu-layout">
          <div className="menu-form-section">
            <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '2px dashed #eee' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>📁 {editingCatId ? "Edit Category" : "Manage Categories"}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                <input placeholder="Category Name" value={newCatName} onChange={e => setNewCatName(e.target.value)} style={inputStyle} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><input placeholder="Image URL" value={newCatImg} onChange={e => setNewCatImg(e.target.value)} style={{...inputStyle, marginBottom: 0, flex: 1}} /><span style={{fontWeight: 'bold', color: '#888'}}>OR</span><input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setNewCatImg)} style={{flex: 1, padding: '10px', fontSize: '0.8rem'}} /></div>
                {newCatImg && <img src={newCatImg} alt="Preview" style={{height: '60px', width: '100px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ccc'}} />}
                <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}><button onClick={handleSaveCategory} style={{...btnStyle, flex: 1, backgroundColor: editingCatId ? '#0ea5e9' : '#333'}}>{editingCatId ? "Update Category" : "Add Category"}</button>{editingCatId && <button onClick={cancelCategoryEdit} style={{...btnStyle, flex: 1, backgroundColor: '#888'}}>Cancel</button>}</div>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>{categories.map(c => (<div key={c._id} style={{ padding: '5px 5px 5px 15px', background: '#f1f5f9', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>{c.name} <button onClick={() => handleEditCategoryClick(c)} style={{ border: 'none', color: '#0ea5e9', background: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>✎ Edit</button><button onClick={async () => { await axios.delete(`${API_URL}/categories/${c._id}`); fetchData(); }} style={{ border: 'none', color: 'red', background: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 8px' }}>×</button></div>))}</div>
            </div>
            <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>{editingId ? "📝 Edit Menu Item" : "➕ Add New Menu Item"}</h2>
            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div><label style={labelStyle}>Item Name *</label><input required value={name} onChange={e => setName(e.target.value)} style={inputStyle} /></div><div><label style={labelStyle}>Main Category *</label><select required value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}><option value="">Select Category</option>{categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}</select></div>
                <div><label style={labelStyle}>Price (₹) *</label><input required type="number" value={price} onChange={e => setPrice(e.target.value)} style={inputStyle} /></div><div><label style={labelStyle}>Sub Category</label><input value={subCategory} onChange={e => setSubCategory(e.target.value)} style={inputStyle} /></div>
                
                <div>
                  <label style={labelStyle}>Add-on Selection</label>
                  <select value={selectionType} onChange={e => setSelectionType(e.target.value)} style={inputStyle}>
                    <option value="Multiple">Multiple (Checkboxes)</option>
                    <option value="Single">Single (Radio Button)</option>
                  </select>
                </div>
              </div>
              <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #eee' }}><label style={labelStyle}>Item Image</label><div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}><div style={{ flex: 1, minWidth: '200px' }}><input placeholder="Paste Image URL" value={image} onChange={e => setImage(e.target.value)} style={{...inputStyle, marginBottom: '10px'}} /><div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{fontWeight: 'bold', color: '#888'}}>OR</span><input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setImage)} style={{flex: 1, padding: '5px', fontSize: '0.9rem'}} /></div></div>{image ? (<img src={image} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #ccc' }} />) : (<div style={{ width: '80px', height: '80px', backgroundColor: '#eaeaea', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#aaa', fontSize: '0.8rem' }}>No Image</div>)}</div></div>
              <div><label style={labelStyle}>Description</label><textarea rows="2" value={description} onChange={e => setDescription(e.target.value)} style={inputStyle} /></div>
              <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #eee' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}><label style={labelStyle}>Add-ons (Optional)</label><button type="button" onClick={addAddonRow} style={{...btnStyle, padding: '5px 10px', fontSize: '0.8rem', backgroundColor: '#333'}}>+ Add Row</button></div>{addons.map((addon, index) => (<div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}><input placeholder="Addon Name" value={addon.name} onChange={e => handleAddonChange(index, 'name', e.target.value)} style={{ ...inputStyle, marginBottom: 0, flex: 2 }} /><input type="number" placeholder="Price" value={addon.price} onChange={e => handleAddonChange(index, 'price', e.target.value)} style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />{addons.length > 1 && <button type="button" onClick={() => removeAddonRow(index)} style={{ padding: '0 15px', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>✖</button>}</div>))}</div>
              <button type="submit" style={{ padding: '15px', backgroundColor: editingId ? '#0ea5e9' : '#f472b6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>{editingId ? "Update Item" : "Save to Menu"}</button>
              {editingId && <button type="button" onClick={() => {setEditingId(null); setName(''); setCategory(''); setSubCategory(''); setDescription(''); setImage(''); setPrice(''); setAddons([{ name: '', price: '' }]); setSelectionType('Multiple');}} style={{background:'none', border:'none', color:'#888', cursor:'pointer', marginTop:'10px'}}>Cancel Edit</button>}
            </form>
          </div>
          <div className="menu-list-section">
            <h2 style={{ margin: '0 0 30px 0', color: '#333' }}>📦 Live Menu Items ({products.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {products.map(p => (
                <div key={p._id || p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: '1px solid #eee', borderRadius: '12px', backgroundColor: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.02)', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}><img src={p.image || 'https://via.placeholder.com/50'} alt="Item" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} /><div><h4 style={{ margin: '0 0 5px 0', color: '#333', fontSize: '1.1rem' }}>{p.name} <span style={{ color: '#28a745', marginLeft: '10px' }}>₹{p.price !== undefined ? p.price : 0}</span></h4><div style={{ fontSize: '0.85rem', color: '#888' }}><strong>{p.category}</strong> {p.subCategory && `> ${p.subCategory}`} {p.selectionType === 'Single' && <span style={{backgroundColor: '#e0f2fe', color: '#0284c7', padding: '2px 6px', borderRadius: '4px', marginLeft: '5px', fontSize: '0.75rem'}}>Single Select</span>}</div></div></div>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <button onClick={() => handleEditClick(p)} style={{ background: 'none', border: 'none', color: '#0ea5e9', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>Modify</button>
                    <button onClick={() => handleDeleteProduct(p._id || p.id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const inputStyle = { width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: '8px', boxSizing: 'border-box', fontSize: '1rem', marginBottom: '10px' };
const btnStyle = { padding: '10px 20px', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const labelStyle = { fontWeight: 'bold', display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#555' };

export default AdminPage;
