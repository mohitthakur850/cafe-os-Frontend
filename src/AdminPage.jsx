import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('ORDERS'); 
  const [orderFilter, setOrderFilter] = useState('Today'); 

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

  const [newCatName, setNewCatName] = useState('');
  const [newCatImg, setNewCatImg] = useState('');

  const fetchData = async () => {
    try {
      const [pRes, oRes, cRes] = await Promise.all([
        axios.get('https://cafe-os-backend.onrender.com/products'),
        axios.get('https://cafe-os-backend.onrender.com/orders'),
        axios.get('https://cafe-os-backend.onrender.com/categories')
      ]);
      setProducts(pRes.data); setOrders(oRes.data); setCategories(cRes.data);
    } catch (e) { console.error("Error fetching data", e); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 5000); 
    return () => clearInterval(interval);
  }, []);

  // --- STOCK TOGGLE LOGIC ---
  const toggleStock = async (product) => {
    try {
      const newStatus = product.isAvailable === false ? true : false;
      await axios.put(`https://cafe-os-backend.onrender.com/products/${product._id || product.id}`, { isAvailable: newStatus });
      fetchData(); 
    } catch (error) {
      alert('Error updating stock');
    }
  };

  const handleImageUpload = (e, setImageState) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2000000) return alert("File size should be less than 2MB.");
      const reader = new FileReader();
      reader.onloadend = () => setImageState(reader.result); 
      reader.readAsDataURL(file);
    }
  };

  const handleEditCategoryClick = (c) => { setEditingCatId(c._id); setNewCatName(c.name); setNewCatImg(c.image || ''); window.scrollTo(0, 0); };
  const cancelCategoryEdit = () => { setEditingCatId(null); setNewCatName(''); setNewCatImg(''); };
  
  const handleSaveCategory = async () => {
    if(!newCatName) return;
    try {
      if (editingCatId) { await axios.put(`https://cafe-os-backend.onrender.com/categories/${editingCatId}`, { name: newCatName, image: newCatImg }); } 
      else { await axios.post('https://cafe-os-backend.onrender.com/categories', { name: newCatName, image: newCatImg }); }
      setEditingCatId(null); setNewCatName(''); setNewCatImg(''); fetchData();
    } catch (error) { alert("Error saving category."); }
  };

  const handleAddonChange = (index, field, value) => { const newAddons = [...addons]; newAddons[index][field] = value; setAddons(newAddons); };
  const addAddonRow = () => setAddons([...addons, { name: '', price: '' }]);
  const removeAddonRow = (index) => setAddons(addons.filter((_, i) => i !== index));

  const handleEditClick = (p) => {
    setEditingId(p._id); setName(p.name); setCategory(p.category); setSubCategory(p.subCategory || '');
    setDescription(p.description || ''); setImage(p.image || ''); setPrice(p.price);
    setAddons(p.addons && p.addons.length > 0 ? p.addons : [{ name: '', price: '' }]); window.scrollTo(0, 0); 
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const data = { name, category, subCategory, description, image, price: price === '' ? 0 : Number(price), addons: addons.filter(a => a.name) };
    try {
      if (editingId) { await axios.put(`https://cafe-os-backend.onrender.com/products/${editingId}`, data); } 
      else { await axios.post('https://cafe-os-backend.onrender.com/products', data); }
      setEditingId(null); setName(''); setCategory(''); setSubCategory(''); setDescription(''); setImage(''); setPrice(''); setAddons([{ name: '', price: '' }]); fetchData();
    } catch (error) { alert('Error saving product'); }
  };

  const handleDeleteProduct = async (id) => {
    if(window.confirm("Delete this from the menu?")) { await axios.delete(`https://cafe-os-backend.onrender.com/products/${id}`); fetchData(); }
  };

  const getFilteredOrders = () => {
    const today = new Date(); const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt || Date.now());
      if (orderFilter === 'Today') return orderDate.toDateString() === today.toDateString();
      if (orderFilter === 'Yesterday') return orderDate.toDateString() === yesterday.toDateString();
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
        <div>
          <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#333', display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ backgroundColor: '#fef08a', color: '#a16207', padding: '4px 10px', borderRadius: '8px', fontSize: '1.2rem', fontWeight: '900' }}>#{order.id}</span>{order.customer_name}</h3>
          <span style={{ color: '#888', fontSize: '0.9rem', display: 'block', marginTop: '5px' }}>{formatDate(order.createdAt)}</span>
        </div>
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
      <div style={{ width: '100%', padding: '15px', backgroundColor: isLive ? '#eff6ff' : '#f0fdf4', color: isLive ? '#1d4ed8' : '#15803d', border: `1px solid ${isLive ? '#bfdbfe' : '#bbf7d0'}`, borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', textAlign: 'center' }}>
        {isLive ? `⏳ Active in Kitchen (${order.status})` : '✅ Order Completed'}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f6f8', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* HEADER WITH 3 TABS */}
      <div style={{ backgroundColor: '#333', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', letterSpacing: '1px' }}>RE:FILL Admin</h1>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => setActiveTab('ORDERS')} style={{ padding: '12px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', border: 'none', backgroundColor: activeTab === 'ORDERS' ? '#ffcc00' : '#555', color: activeTab === 'ORDERS' ? '#333' : 'white', transition: '0.3s', display: 'flex', alignItems: 'center', gap: '10px' }}>🔔 Orders <span style={{ backgroundColor: '#dc3545', color: 'white', padding: '2px 8px', borderRadius: '15px', fontSize: '0.9rem' }}>{liveOrders.length}</span></button>
          <button onClick={() => setActiveTab('MENU')} style={{ padding: '12px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', border: 'none', backgroundColor: activeTab === 'MENU' ? '#ffcc00' : '#555', color: activeTab === 'MENU' ? '#333' : 'white', transition: '0.3s' }}>📦 Menu Mgt</button>
          <button onClick={() => setActiveTab('STOCK')} style={{ padding: '12px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', border: 'none', backgroundColor: activeTab === 'STOCK' ? '#ffcc00' : '#555', color: activeTab === 'STOCK' ? '#333' : 'white', transition: '0.3s' }}>📊 Stock Mgt</button>
        </div>
      </div>

      {/* TAB 1: ORDER HISTORY */}
      {activeTab === 'ORDERS' && (
        <div style={{ padding: '40px' }}>
          {/* ... (Pichla Orders wala code same) ... */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h2 style={{ fontSize: '2.2rem', margin: 0, color: '#333' }}>Order History & Analytics</h2>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ backgroundColor: 'white', padding: '10px 20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', display: 'flex', gap: '20px' }}>
                <div><span style={{color: '#888'}}>Completed:</span> <strong style={{color: '#333', fontSize: '1.2rem'}}>{completedHistory.length}</strong></div>
                <div><span style={{color: '#888'}}>Revenue:</span> <strong style={{color: '#28a745', fontSize: '1.2rem'}}>₹{totalRevenue}</strong></div>
              </div>
              <select value={orderFilter} onChange={(e) => setOrderFilter(e.target.value)} style={{ padding: '12px 20px', borderRadius: '8px', border: '1px solid #ccc', backgroundColor: 'white', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}><option value="Today">Today</option><option value="Yesterday">Yesterday</option><option value="All Time">All Time</option></select>
            </div>
          </div>
          {liveOrders.length > 0 && (<div style={{ marginBottom: '50px' }}><h2 style={{ color: '#0ea5e9', marginBottom: '20px', borderBottom: '2px solid #e0f2fe', paddingBottom: '10px' }}>🔥 Live Kitchen Orders ({liveOrders.length})</h2><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>{liveOrders.map(order => renderOrderCard(order, true))}</div></div>)}
          <div><h2 style={{ color: '#22c55e', marginBottom: '20px', borderBottom: '2px solid #dcfce7', paddingBottom: '10px' }}>✅ Past Order History ({completedHistory.length})</h2>{completedHistory.length === 0 ? (<p style={{ color: '#888', fontSize: '1.2rem' }}>No completed orders found.</p>) : (<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>{completedHistory.map(order => renderOrderCard(order, false))}</div>)}</div>
        </div>
      )}

      {/* TAB 3: NEW STOCK MANAGEMENT */}
      {activeTab === 'STOCK' && (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.2rem', margin: '0 0 30px 0', color: '#333' }}>📊 Quick Stock Management</h2>
          
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 5px 20px rgba(0,0,0,0.05)' }}>
            {categories.map(cat => {
              const catProducts = products.filter(p => p.category === cat.name);
              if(catProducts.length === 0) return null;
              
              return (
                <div key={cat._id} style={{ marginBottom: '40px' }}>
                  <h3 style={{ borderBottom: '3px solid #f1f5f9', paddingBottom: '10px', color: '#475569', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={cat.image} alt="cat" style={{width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover'}}/> {cat.name}
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px', marginTop: '20px' }}>
                    {catProducts.map(p => (
                      <div key={p._id || p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: p.isAvailable === false ? '#fff1f2' : '#f8fafc', transition: '0.2s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <img src={p.image || 'https://via.placeholder.com/50'} alt="item" style={{ width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover', filter: p.isAvailable === false ? 'grayscale(100%) opacity(60%)' : 'none' }} />
                          <div>
                            <div style={{ fontWeight: 'bold', color: p.isAvailable === false ? '#94a3b8' : '#1e293b', fontSize: '1.1rem' }}>{p.name}</div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>₹{p.price !== undefined ? p.price : 0}</div>
                          </div>
                        </div>
                        <button onClick={() => toggleStock(p)} style={{ backgroundColor: p.isAvailable === false ? '#fecdd3' : '#bbf7d0', color: p.isAvailable === false ? '#e11d48' : '#16a34a', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', transition: '0.2s' }}>
                          {p.isAvailable === false ? 'Out of Stock 🚫' : 'In Stock ✅'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: MENU MANAGEMENT (Purana Form Yahan Hai) */}
      {activeTab === 'MENU' && (
        <div style={{ display: 'flex', height: 'calc(100vh - 80px)' }}>
          {/* Menu Form Wala Code (Same as Before) */}
          <div style={{ flex: 1.2, padding: '40px', backgroundColor: 'white', borderRight: '1px solid #ddd', overflowY: 'auto' }}>
            <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '2px dashed #eee' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>📁 {editingCatId ? "Edit Category" : "Manage Categories"}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                <input placeholder="Category Name" value={newCatName} onChange={e => setNewCatName(e.target.value)} style={inputStyle} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><input placeholder="Image URL" value={newCatImg} onChange={e => setNewCatImg(e.target.value)} style={{...inputStyle, marginBottom: 0, flex: 1}} /><span style={{fontWeight: 'bold', color: '#888'}}>OR</span><input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setNewCatImg)} style={{flex: 1, padding: '10px', fontSize: '0.8rem'}} /></div>
                {newCatImg && <img src={newCatImg} alt="Preview" style={{height: '60px', width: '100px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ccc'}} />}
                <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}><button onClick={handleSaveCategory} style={{...btnStyle, flex: 1, backgroundColor: editingCatId ? '#0ea5e9' : '#333'}}>{editingCatId ? "Update Category" : "Add Category"}</button>{editingCatId && <button onClick={cancelCategoryEdit} style={{...btnStyle, flex: 1, backgroundColor: '#888'}}>Cancel</button>}</div>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>{categories.map(c => (<div key={c._id} style={{ padding: '5px 5px 5px 15px', background: '#f1f5f9', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>{c.name} <button onClick={() => handleEditCategoryClick(c)} style={{ border: 'none', color: '#0ea5e9', background: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>✎ Edit</button><button onClick={async () => { await axios.delete(`https://cafe-os-backend.onrender.com/categories/${c._id}`); fetchData(); }} style={{ border: 'none', color: 'red', background: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 8px' }}>×</button></div>))}</div>
            </div>
            <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>{editingId ? "📝 Edit Menu Item" : "➕ Add New Menu Item"}</h2>
            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div><label style={labelStyle}>Item Name *</label><input required value={name} onChange={e => setName(e.target.value)} style={inputStyle} /></div>
                <div><label style={labelStyle}>Main Category *</label><select required value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}><option value="">Select Category</option>{categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}</select></div>
                <div><label style={labelStyle}>Price (₹) *</label><input required type="number" value={price} onChange={e => setPrice(e.target.value)} style={inputStyle} /></div>
                <div><label style={labelStyle}>Sub Category</label><input value={subCategory} onChange={e => setSubCategory(e.target.value)} style={inputStyle} /></div>
              </div>
              <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #eee' }}><label style={labelStyle}>Item Image</label><div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}><div style={{ flex: 1 }}><input placeholder="Paste Image URL" value={image} onChange={e => setImage(e.target.value)} style={{...inputStyle, marginBottom: '10px'}} /><div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{fontWeight: 'bold', color: '#888'}}>OR</span><input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setImage)} style={{flex: 1, padding: '5px', fontSize: '0.9rem'}} /></div></div>{image ? (<img src={image} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #ccc' }} />) : (<div style={{ width: '80px', height: '80px', backgroundColor: '#eaeaea', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#aaa', fontSize: '0.8rem' }}>No Image</div>)}</div></div>
              <div><label style={labelStyle}>Description</label><textarea rows="2" value={description} onChange={e => setDescription(e.target.value)} style={inputStyle} /></div>
              <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #eee' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}><label style={labelStyle}>Add-ons (Optional)</label><button type="button" onClick={addAddonRow} style={{...btnStyle, padding: '5px 10px', fontSize: '0.8rem', backgroundColor: '#333'}}>+ Add Row</button></div>{addons.map((addon, index) => (<div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}><input placeholder="Addon Name" value={addon.name} onChange={e => handleAddonChange(index, 'name', e.target.value)} style={{ ...inputStyle, marginBottom: 0, flex: 2 }} /><input type="number" placeholder="Price" value={addon.price} onChange={e => handleAddonChange(index, 'price', e.target.value)} style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />{addons.length > 1 && <button type="button" onClick={() => removeAddonRow(index)} style={{ padding: '0 15px', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>✖</button>}</div>))}</div>
              <button type="submit" style={{ padding: '15px', backgroundColor: editingId ? '#0ea5e9' : '#f472b6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>{editingId ? "Update Item" : "Save to Menu"}</button>
              {editingId && <button type="button" onClick={() => {setEditingId(null); setName(''); setCategory(''); setSubCategory(''); setDescription(''); setImage(''); setPrice(''); setAddons([{ name: '', price: '' }]);}} style={{background:'none', border:'none', color:'#888', cursor:'pointer', marginTop:'10px'}}>Cancel Edit</button>}
            </form>
          </div>
          <div style={{ flex: 1.8, padding: '40px', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 30px 0', color: '#333' }}>📦 Live Menu Items ({products.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {products.map(p => (
                <div key={p._id || p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: '1px solid #eee', borderRadius: '12px', backgroundColor: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}><img src={p.image || 'https://via.placeholder.com/50'} alt="Item" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} /><div><h4 style={{ margin: '0 0 5px 0', color: '#333', fontSize: '1.1rem' }}>{p.name} <span style={{ color: '#28a745', marginLeft: '10px' }}>₹{p.price !== undefined ? p.price : 0}</span></h4><div style={{ fontSize: '0.85rem', color: '#888' }}><strong>{p.category}</strong> {p.subCategory && `> ${p.subCategory}`}</div></div></div>
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
