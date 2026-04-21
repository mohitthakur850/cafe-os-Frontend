import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('ORDERS'); 
  const [orderFilter, setOrderFilter] = useState('Today'); 

  // States
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [price, setPrice] = useState('');
  const [addons, setAddons] = useState([{ name: '', price: '' }]);

  // API Calls
  const fetchProducts = () => {
    axios.get('https://cafe-os-backend.onrender.com/products')
      .then(res => setProducts(res.data))
      .catch(err => console.error("Error fetching products", err));
  };

  const fetchOrders = () => {
    axios.get('https://cafe-os-backend.onrender.com/orders')
      .then(res => setOrders(res.data))
      .catch(err => console.error("Error fetching orders", err));
  };

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    const interval = setInterval(() => fetchOrders(), 10000); 
    return () => clearInterval(interval);
  }, []);

  // Menu Management Functions
  const handleAddonChange = (index, field, value) => {
    const newAddons = [...addons];
    newAddons[index][field] = value;
    setAddons(newAddons);
  };
  const addAddonRow = () => setAddons([...addons, { name: '', price: '' }]);
  const removeAddonRow = (index) => setAddons(addons.filter((_, i) => i !== index));

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const validAddons = addons.filter(a => a.name.trim() !== '' && a.price !== '');
    const newProduct = { name, category, subCategory, description, image, price: Number(price) || 150, addons: validAddons };

    try {
      await axios.post('https://cafe-os-backend.onrender.com/products', newProduct);
      alert('✅ Product Added to Menu!');
      setName(''); setCategory(''); setSubCategory(''); setDescription(''); setImage(''); setPrice(''); setAddons([{ name: '', price: '' }]);
      fetchProducts();
    } catch {
      alert('Error adding product');
    }
  };

  const handleDeleteProduct = async (id) => {
    if(window.confirm("Are you sure you want to delete this from the menu?")) {
      try {
        await axios.delete(`https://cafe-os-backend.onrender.com/products/${id}`);
        fetchProducts();
      } catch {
        alert('Delete failed.');
      }
    }
  };

  // Analytics & Filtering
  const getFilteredOrders = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    return orders.filter(order => {
      const orderDate = new Date(order.createdAt || Date.now());
      if (orderFilter === 'Today') {
        return orderDate.toDateString() === today.toDateString();
      } else if (orderFilter === 'Yesterday') {
        return orderDate.toDateString() === yesterday.toDateString();
      }
      return true; 
    });
  };

  const filteredOrders = getFilteredOrders();
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f6f8', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* ========================================== */}
      {/* EXACT SAME DARK HEADER FROM YOUR SCREENSHOT */}
      {/* ========================================== */}
      <div style={{ backgroundColor: '#333', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', letterSpacing: '1px' }}>RE:FILL Admin</h1>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button 
            onClick={() => setActiveTab('ORDERS')}
            style={{ padding: '12px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', border: 'none', backgroundColor: activeTab === 'ORDERS' ? '#ffcc00' : '#555', color: activeTab === 'ORDERS' ? '#333' : 'white', transition: '0.3s', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            🔔 Order History
            <span style={{ backgroundColor: '#dc3545', color: 'white', padding: '2px 8px', borderRadius: '15px', fontSize: '0.9rem' }}>{filteredOrders.length}</span>
          </button>
          <button 
            onClick={() => setActiveTab('MENU')}
            style={{ padding: '12px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', border: 'none', backgroundColor: activeTab === 'MENU' ? '#ffcc00' : '#555', color: activeTab === 'MENU' ? '#333' : 'white', transition: '0.3s' }}
          >
            📦 Menu Management
          </button>
        </div>
      </div>

      {/* =============================================================== */}
      {/* TAB 1: ORDER HISTORY CARDS (Exactly like your screenshot) */}
      {/* =============================================================== */}
      {activeTab === 'ORDERS' && (
        <div style={{ padding: '40px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h2 style={{ fontSize: '2.2rem', margin: 0, color: '#333' }}>Order History & Analytics</h2>
            
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              {/* Quick Stats */}
              <div style={{ backgroundColor: 'white', padding: '10px 20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', display: 'flex', gap: '20px' }}>
                <div><span style={{color: '#888'}}>Total Orders:</span> <strong style={{color: '#333', fontSize: '1.2rem'}}>{filteredOrders.length}</strong></div>
                <div><span style={{color: '#888'}}>Revenue:</span> <strong style={{color: '#28a745', fontSize: '1.2rem'}}>₹{totalRevenue}</strong></div>
              </div>

              <select value={orderFilter} onChange={(e) => setOrderFilter(e.target.value)} style={{ padding: '12px 20px', borderRadius: '8px', border: '1px solid #ccc', backgroundColor: 'white', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
                <option value="Today">Today</option>
                <option value="Yesterday">Yesterday</option>
                <option value="All Time">All Time</option>
              </select>
            </div>
          </div>
          
          {filteredOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#888' }}>
              <h2>No orders found for {orderFilter}.</h2>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
              {filteredOrders.map((order, idx) => (
                <div key={order._id || idx} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', borderTop: '5px solid #ffcc00', display: 'flex', flexDirection: 'column' }}>
                  
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#333' }}>{order.customer_name}</h3>
                      <span style={{ color: '#888', fontSize: '0.9rem' }}>Order ID: #{String(order._id || idx).slice(-4)}</span>
                    </div>
                    <h2 style={{ margin: 0, color: '#28a745' }}>₹{order.total}</h2>
                  </div>
                  
                  {/* Items List (Grey strips like your screenshot) */}
                  <div style={{ flex: 1, marginBottom: '20px' }}>
                    {order.items && order.items.map((item, i) => (
                      <div key={i} style={{ marginBottom: '10px', backgroundColor: '#f9f9f9', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', color: '#333' }}>{item.quantity}x {item.name}</span>
                        <span style={{ fontWeight: 'bold', color: '#555' }}>₹{(Number(item.itemTotal) * Number(item.quantity)) || 0}</span>
                      </div>
                    ))}
                  </div>

                  {/* Green Button */}
                  <button style={{ width: '100%', padding: '15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(40,167,69,0.3)', cursor: 'default' }}>
                    Completed ✅
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =============================================================== */}
      {/* TAB 2: MENU MANAGEMENT VIEW (Side by Side layout) */}
      {/* =============================================================== */}
      {activeTab === 'MENU' && (
        <div style={{ display: 'flex', height: 'calc(100vh - 80px)' }}>
          
          <div style={{ flex: 1.2, padding: '40px', backgroundColor: 'white', borderRight: '1px solid #ddd', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 30px 0', color: '#333' }}>Add New Item</h2>
            
            <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Item Name *</label>
                <input required type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Maharaja Burger" style={inputStyle} />
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Price (₹) *</label>
                  <input required type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 150" style={inputStyle} />
                </div>
                <div style={{ flex: 2 }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Image URL</label>
                  <input type="text" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Main Category *</label>
                  <input required type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Burgers" style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Sub Category</label>
                  <input type="text" value={subCategory} onChange={(e) => setSubCategory(e.target.value)} placeholder="e.g. Veg" style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Description</label>
                <textarea rows="3" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter details about the item..." style={{...inputStyle, resize: 'vertical'}} />
              </div>

              <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '10px', border: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <label style={{ fontWeight: 'bold', margin: 0 }}>Extra Add-ons (Optional)</label>
                  <button type="button" onClick={addAddonRow} style={{ padding: '5px 15px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>+ Add Row</button>
                </div>
                {addons.map((addon, index) => (
                  <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <input type="text" placeholder="Addon Name" value={addon.name} onChange={(e) => handleAddonChange(index, 'name', e.target.value)} style={{ ...inputStyle, flex: 2, margin: 0 }} />
                    <input type="number" placeholder="Price" value={addon.price} onChange={(e) => handleAddonChange(index, 'price', e.target.value)} style={{ ...inputStyle, flex: 1, margin: 0 }} />
                    {addons.length > 1 && <button type="button" onClick={() => removeAddonRow(index)} style={{ padding: '0 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>✖</button>}
                  </div>
                ))}
              </div>

              <button type="submit" style={{ padding: '15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
                💾 SAVE TO MENU
              </button>
            </form>
          </div>

          <div style={{ flex: 1.8, padding: '40px', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 30px 0', color: '#333' }}>📦 Live Menu Items ({products.length})</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {products.map(product => (
                <div key={product._id || product.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', position: 'relative' }}>
                  <button onClick={() => handleDeleteProduct(product._id || product.id)} style={{ position: 'absolute', top: '10px', right: '10px', background: '#ffebee', color: '#d32f2f', border: 'none', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold' }}>🗑</button>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <img src={product.image || 'https://via.placeholder.com/100'} alt={product.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '10px' }} />
                    <div>
                      <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>{product.name}</h3>
                      <span style={{ fontSize: '0.8rem', backgroundColor: '#ffcc00', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold', color: '#333' }}>{product.category}</span>
                      {product.subCategory && <span style={{ fontSize: '0.8rem', backgroundColor: '#eee', padding: '2px 8px', borderRadius: '10px', marginLeft: '5px' }}>{product.subCategory}</span>}
                      <h4 style={{ margin: '5px 0 0 0', color: '#28a745' }}>₹{product.price || 150}</h4>
                    </div>
                  </div>
                  {product.addons && product.addons.length > 0 && (
                    <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px dashed #ddd', fontSize: '0.9rem', color: '#666' }}>
                      <strong>Add-ons:</strong> {product.addons.map(a => `${a.name} (+₹${a.price})`).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

const inputStyle = {
  width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: '8px', boxSizing: 'border-box', fontSize: '1rem', marginBottom: '15px'
};

export default AdminPage;