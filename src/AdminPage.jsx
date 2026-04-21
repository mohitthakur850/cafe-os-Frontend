import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('ORDERS'); 
  const [orderFilter, setOrderFilter] = useState('Today'); 

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);

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
    const interval = setInterval(() => fetchData(), 10000); 
    return () => clearInterval(interval);
  }, []);

  const handleAddonChange = (index, field, value) => {
    const newAddons = [...addons];
    newAddons[index][field] = value;
    setAddons(newAddons);
  };
  const addAddonRow = () => setAddons([...addons, { name: '', price: '' }]);
  const removeAddonRow = (index) => setAddons(addons.filter((_, i) => i !== index));

  const handleEditClick = (p) => {
    setEditingId(p._id);
    setName(p.name); setCategory(p.category); setSubCategory(p.subCategory);
    setDescription(p.description); setImage(p.image); setPrice(p.price);
    setAddons(p.addons && p.addons.length > 0 ? p.addons : [{ name: '', price: '' }]);
    window.scrollTo(0, 0); 
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const data = { name, category, subCategory, description, image, price: Number(price)||150, addons: addons.filter(a => a.name) };
    try {
      if (editingId) {
        await axios.put(`https://cafe-os-backend.onrender.com/products/${editingId}`, data);
        alert("Item Updated! ✅");
      } else {
        await axios.post('https://cafe-os-backend.onrender.com/products', data);
        alert("Item Added! ➕");
      }
      setEditingId(null); setName(''); setCategory(''); setSubCategory(''); setDescription(''); setImage(''); setPrice(''); setAddons([{ name: '', price: '' }]);
      fetchData();
    } catch (error) { alert('Error saving product'); }
  };

  const handleDeleteProduct = async (id) => {
    if(window.confirm("Delete this from the menu?")) {
      await axios.delete(`https://cafe-os-backend.onrender.com/products/${id}`);
      fetchData();
    }
  };

  const handleAddCategory = async () => {
    if(!newCatName) return;
    await axios.post('https://cafe-os-backend.onrender.com/categories', { name: newCatName, image: newCatImg });
    setNewCatName(''); setNewCatImg('');
    fetchData();
  };

  const getFilteredOrders = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt || Date.now());
      if (orderFilter === 'Today') return orderDate.toDateString() === today.toDateString();
      if (orderFilter === 'Yesterday') return orderDate.toDateString() === yesterday.toDateString();
      return true; 
    });
  };

  const filteredOrders = getFilteredOrders();
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
  const formatDate = (dateString) => new Date(dateString || Date.now()).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f6f8', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* HEADER */}
      <div style={{ backgroundColor: '#333', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', letterSpacing: '1px' }}>RE:FILL Admin</h1>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => setActiveTab('ORDERS')} style={{ padding: '12px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', border: 'none', backgroundColor: activeTab === 'ORDERS' ? '#ffcc00' : '#555', color: activeTab === 'ORDERS' ? '#333' : 'white', transition: '0.3s', display: 'flex', alignItems: 'center', gap: '10px' }}>
            🔔 Order History <span style={{ backgroundColor: '#dc3545', color: 'white', padding: '2px 8px', borderRadius: '15px', fontSize: '0.9rem' }}>{filteredOrders.length}</span>
          </button>
          <button onClick={() => setActiveTab('MENU')} style={{ padding: '12px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', border: 'none', backgroundColor: activeTab === 'MENU' ? '#ffcc00' : '#555', color: activeTab === 'MENU' ? '#333' : 'white', transition: '0.3s' }}>📦 Menu Management</button>
        </div>
      </div>

      {/* TAB 1: ORDER HISTORY */}
      {activeTab === 'ORDERS' && (
        <div style={{ padding: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h2 style={{ fontSize: '2.2rem', margin: 0, color: '#333' }}>Order History & Analytics</h2>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ backgroundColor: 'white', padding: '10px 20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', display: 'flex', gap: '20px' }}>
                <div><span style={{color: '#888'}}>Orders:</span> <strong style={{color: '#333', fontSize: '1.2rem'}}>{filteredOrders.length}</strong></div>
                <div><span style={{color: '#888'}}>Revenue:</span> <strong style={{color: '#28a745', fontSize: '1.2rem'}}>₹{totalRevenue}</strong></div>
              </div>
              <select value={orderFilter} onChange={(e) => setOrderFilter(e.target.value)} style={{ padding: '12px 20px', borderRadius: '8px', border: '1px solid #ccc', backgroundColor: 'white', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
                <option value="Today">Today</option><option value="Yesterday">Yesterday</option><option value="All Time">All Time</option>
              </select>
            </div>
          </div>
          
          {filteredOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#888' }}><h2>No orders found for {orderFilter}.</h2></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
              {filteredOrders.map((order, idx) => (
                <div key={order._id || idx} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', borderTop: '5px solid #ffcc00', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#333' }}>{order.customer_name}</h3>
                      <span style={{ color: '#888', fontSize: '0.9rem' }}>{formatDate(order.createdAt)}</span>
                    </div>
                    <h2 style={{ margin: 0, color: '#28a745' }}>₹{order.total}</h2>
                  </div>
                  <div style={{ flex: 1, marginBottom: '20px' }}>
                    {order.items && order.items.map((item, i) => (
                      <div key={i} style={{ marginBottom: '10px', backgroundColor: '#f9f9f9', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', color: '#333' }}>{item.quantity}x {item.name}</span>
                        <span style={{ fontWeight: 'bold', color: '#555' }}>₹{(Number(item.itemTotal) * Number(item.quantity)) || 0}</span>
                      </div>
                    ))}
                  </div>
                  <button style={{ width: '100%', padding: '15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(40,167,69,0.3)', cursor: 'default' }}>Completed ✅</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MENU MANAGEMENT */}
      {activeTab === 'MENU' && (
        <div style={{ display: 'flex', height: 'calc(100vh - 80px)' }}>
          <div style={{ flex: 1.2, padding: '40px', backgroundColor: 'white', borderRight: '1px solid #ddd', overflowY: 'auto' }}>
            
            {/* Category Manager */}
            <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '2px dashed #eee' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>📁 Manage Categories</h3>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <input placeholder="New Category Name" value={newCatName} onChange={e => setNewCatName(e.target.value)} style={inputStyle} />
                <input placeholder="Image URL" value={newCatImg} onChange={e => setNewCatImg(e.target.value)} style={inputStyle} />
                <button onClick={handleAddCategory} style={btnStyle}>Add</button>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {categories.map(c => (
                  <div key={c._id} style={{ padding: '5px 15px', background: '#f1f5f9', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {c.name} <button onClick={async () => { await axios.delete(`https://cafe-os-backend.onrender.com/categories/${c._id}`); fetchData(); }} style={{ border: 'none', color: 'red', background: 'none', cursor: 'pointer', fontSize: '1rem' }}>×</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Form */}
            <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>{editingId ? "📝 Edit Item" : "➕ Add New Menu Item"}</h2>
            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div><label style={labelStyle}>Item Name *</label><input required value={name} onChange={e => setName(e.target.value)} style={inputStyle} /></div>
                <div>
                  <label style={labelStyle}>Main Category *</label>
                  <select required value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div><label style={labelStyle}>Price (₹) *</label><input required type="number" value={price} onChange={e => setPrice(e.target.value)} style={inputStyle} /></div>
                <div><label style={labelStyle}>Sub Category</label><input value={subCategory} onChange={e => setSubCategory(e.target.value)} style={inputStyle} /></div>
              </div>
              <div><label style={labelStyle}>Image URL</label><input value={image} onChange={e => setImage(e.target.value)} style={inputStyle} /></div>
              <div><label style={labelStyle}>Description</label><textarea rows="2" value={description} onChange={e => setDescription(e.target.value)} style={inputStyle} /></div>

              <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={labelStyle}>Add-ons (Optional)</label>
                  <button type="button" onClick={addAddonRow} style={{...btnStyle, padding: '5px 10px', fontSize: '0.8rem'}}>+ Add Row</button>
                </div>
                {addons.map((addon, index) => (
                  <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <input placeholder="Addon Name" value={addon.name} onChange={e => handleAddonChange(index, 'name', e.target.value)} style={{ ...inputStyle, marginBottom: 0, flex: 2 }} />
                    <input type="number" placeholder="Price" value={addon.price} onChange={e => handleAddonChange(index, 'price', e.target.value)} style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
                    {addons.length > 1 && <button type="button" onClick={() => removeAddonRow(index)} style={{ padding: '0 15px', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>✖</button>}
                  </div>
                ))}
              </div>

              <button type="submit" style={{ padding: '15px', backgroundColor: editingId ? '#0ea5e9' : '#f472b6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
                {editingId ? "Update Item" : "Save to Menu"}
              </button>
              {editingId && <button type="button" onClick={() => {setEditingId(null); setName(''); setCategory(''); setSubCategory(''); setDescription(''); setImage(''); setPrice(''); setAddons([{ name: '', price: '' }]);}} style={{background:'none', border:'none', color:'#888', cursor:'pointer', marginTop:'10px'}}>Cancel Edit</button>}
            </form>
          </div>

          <div style={{ flex: 1.8, padding: '40px', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 30px 0', color: '#333' }}>📦 Live Menu Items ({products.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {products.map(p => (
                <div key={p._id || p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: '1px solid #eee', borderRadius: '12px', backgroundColor: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <img src={p.image || 'https://via.placeholder.com/50'} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', color: '#333', fontSize: '1.1rem' }}>{p.name} <span style={{ color: '#28a745', marginLeft: '10px' }}>₹{p.price}</span></h4>
                      <div style={{ fontSize: '0.85rem', color: '#888' }}><strong>{p.category}</strong> {p.subCategory && `> ${p.subCategory}`}</div>
                    </div>
                  </div>
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
const btnStyle = { padding: '10px 20px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const labelStyle = { fontWeight: 'bold', display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#555' };

export default AdminPage;
