import React, { useState, useEffect } from 'react';
import './AdminPage.css';

const API_URL = 'https://cafe-os-backend.onrender.com';

export default function AdminPage() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', category: '', image: '' });
  const [editingId, setEditingId] = useState(null);
  const [dateFilter, setDateFilter] = useState('today'); 
  const [customDate, setCustomDate] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/orders`).then(res => res.json()).then(setOrders);
    fetch(`${API_URL}/products`).then(res => res.json()).then(setProducts);
    const interval = setInterval(() => fetch(`${API_URL}/orders`).then(res => res.json()).then(setOrders), 10000);
    return () => clearInterval(interval);
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewProduct({ ...newProduct, image: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newProduct.image) return alert("Please upload an image first!");
    try {
      if (editingId) {
        const res = await fetch(`${API_URL}/products/${editingId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newProduct, price: 0 }) 
        });
        if (!res.ok) throw new Error("Update failed");
        alert("Item Updated Successfully! ✅");
      } else {
        const res = await fetch(`${API_URL}/products`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newProduct, price: 0 }) 
        });
        if (!res.ok) throw new Error("Upload failed");
        alert("Item added to Menu! 🍔");
      }
      window.location.reload(); 
    } catch {
      alert("Failed to save item.");
    }
  };

  const handleEditClick = (product) => {
    setEditingId(product.id);
    setNewProduct({ name: product.name, category: product.category, image: product.image });
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewProduct({ name: '', category: '', image: '' });
    const fileInput = document.getElementById('imageUploadInput');
    if(fileInput) fileInput.value = '';
  };

  const handleDeleteProduct = async (id) => {
    if(window.confirm("Are you sure you want to delete this item?")) {
      await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const filteredOrders = orders.filter(o => {
    if (dateFilter === 'all') return true;
    const orderDateStr = o.created_at || o.createdAt || o.date; 
    if (!orderDateStr) return true; 
    const orderDate = new Date(orderDateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (dateFilter === 'today') return orderDate.toDateString() === today.toDateString();
    if (dateFilter === 'yesterday') return orderDate.toDateString() === yesterday.toDateString();
    if (dateFilter === 'last7') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);
      return orderDate >= sevenDaysAgo;
    }
    if (dateFilter === 'custom' && customDate) {
      const selectedDate = new Date(customDate);
      return orderDate.toDateString() === selectedDate.toDateString();
    }
    return true;
  });

  const formatOrderTime = (dateString) => {
    if (!dateString) return "N/A";
    const d = new Date(dateString);
    return d.toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
  };

  const getFilterTitle = () => {
    if (dateFilter === 'today') return 'Today';
    if (dateFilter === 'yesterday') return 'Yesterday';
    if (dateFilter === 'last7') return 'Last 7 Days';
    if (dateFilter === 'custom') return customDate || 'Selected Day';
    return 'All Time';
  };

  return (
    <div className="admin-container">
      <div className="admin-wrapper">
        
        {/* HEADER SECTION */}
        <div className="admin-header">
          <h1 className="admin-title">Cafe OS Admin Dashboard ⚙️</h1>
          <div className="admin-stat-box">
            <div className="admin-stat-label">Orders ({getFilterTitle()})</div>
            <div className="admin-stat-value">{filteredOrders.length}</div>
          </div>
        </div>

        {/* ORDER HISTORY SECTION */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">📜 Order History</h3>
            <div className="admin-filter-group">
              {dateFilter === 'custom' && (
                <input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} className="admin-input" />
              )}
              <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="admin-select">
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7">Last 7 Days</option>
                <option value="custom">Specific Date</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Time</th>
                  <th>Customer Name</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.slice().reverse().map(o => (
                  <tr key={o.id}>
                    <td className="td-id">#{o.id}</td>
                    <td className="td-time">{formatOrderTime(o.created_at || o.createdAt || o.date)}</td>
                    <td className="td-name">{o.customer_name}</td>
                    <td>
                      <span className="status-badge" style={{ 
                        background: o.status === 'Completed' ? '#e8f8f5' : o.status === 'Preparing' ? '#fff4e5' : o.status === 'Delivered' ? '#f1f2f6' : '#e3f2fd',
                        color: o.status === 'Completed' ? '#27ae60' : o.status === 'Preparing' ? '#d35400' : o.status === 'Delivered' ? '#b2bec3' : '#0984e3'
                      }}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredOrders.length === 0 && <p className="empty-msg">No orders found for this filter.</p>}
          </div>
        </div>

        {/* ADD/EDIT MENU ITEM SECTION */}
        <div className="admin-card">
          <h3 className="admin-card-title" style={{ color: editingId ? '#0984e3' : '#2d3436', marginBottom: '15px' }}>
            {editingId ? '✏️ Modify Menu Item' : '➕ Add New Menu Item'}
          </h3>
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="admin-form-row">
              <input placeholder="Item Name (e.g. Masala Dosa)" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} required className="admin-form-input" />
              <input placeholder="Category (e.g. South Indian)" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} required className="admin-form-input" />
            </div>
            
            <div className="admin-upload-box">
              <label className="admin-upload-label">{editingId ? 'Update Image (Optional)' : 'Upload Product Image'}</label>
              <input id="imageUploadInput" type="file" accept="image/*" onChange={handleImageUpload} required={!editingId && !newProduct.image} className="admin-upload-input" />
              {newProduct.image && (
                <div className="admin-img-preview-box">
                  <img src={newProduct.image} alt="Preview" className="admin-img-preview" />
                </div>
              )}
            </div>

            <div className="admin-form-actions">
              <button type="submit" className="btn-submit" style={{ background: editingId ? '#0984e3' : '#fd79a8' }}>
                {editingId ? 'Update Item' : 'Save to Menu'}
              </button>
              {editingId && (
                <button type="button" onClick={handleCancelEdit} className="btn-cancel">Cancel</button>
              )}
            </div>
          </form>
        </div>

        {/* MANAGE MENU LIST SECTION */}
        <div className="admin-card">
          <h3 className="admin-card-title" style={{ marginBottom: '15px' }}>🗑️ Manage Menu</h3>
          <div className="menu-list-wrapper">
            {products.map(p => (
              <div key={p.id} className="menu-list-item">
                <div className="menu-item-info">
                  <img src={p.image} alt={p.name} className="menu-item-img" />
                  <div>
                    <div className="menu-item-name">{p.name}</div>
                    <div className="menu-item-cat">{p.category}</div>
                  </div>
                </div>
                <div className="menu-item-actions">
                  <button onClick={() => handleEditClick(p)} className="btn-modify">Modify</button>
                  <button onClick={() => handleDeleteProduct(p.id)} className="btn-delete">Delete</button>
                </div>
              </div>
            ))}
            {products.length === 0 && <p className="empty-msg">Menu is empty.</p>}
          </div>
        </div>

      </div>
    </div>
  );
}