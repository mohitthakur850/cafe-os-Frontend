import React, { useState, useEffect } from 'react';

const API_URL = 'https://cafe-os-backend.onrender.com';

export default function AdminPage() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', category: '', image: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/orders`).then(res => res.json()).then(setOrders);
    fetch(`${API_URL}/products`).then(res => res.json()).then(setProducts);
    
    const interval = setInterval(() => {
      fetch(`${API_URL}/orders`).then(res => res.json()).then(setOrders);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct({ ...newProduct, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newProduct.image) return alert("Please upload an image first!");

    try {
      if (editingId) {
        const res = await fetch(`${API_URL}/products/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...newProduct, price: 0 }) 
        });
        if (!res.ok) throw new Error("Update failed");
        alert("Item Updated Successfully! ✅");
      } else {
        const res = await fetch(`${API_URL}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...newProduct, price: 0 }) 
        });
        if (!res.ok) throw new Error("Upload failed");
        alert("Item added to Menu! 🍔");
      }
      window.location.reload(); 
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to save item. Make sure server limit is increased.");
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

  return (
    <div style={{ 
      minHeight: '100vh', 
      fontFamily: 'sans-serif',
      padding: '20px', // Reduced from 40px
      backgroundColor: '#e8f0fe',
      boxSizing: 'border-box'
    }}>
      
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}> {/* Gap reduced from 30px to 20px */}
        
        {/* HEADER SECTION */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '15px 25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', flexWrap: 'wrap', gap: '10px' }}>
          <h1 style={{ color: '#2d3436', margin: 0, fontSize: '1.4rem' }}>Cafe OS Admin Dashboard ⚙️</h1>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#636e72', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Orders Today</div>
            <div style={{ fontSize: '2rem', color: '#0984e3', fontWeight: '800', lineHeight: '1', marginTop: '4px' }}>{orders.length}</div>
          </div>
        </div>

        {/* ORDER HISTORY SECTION */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.2rem', color: '#2d3436' }}>📜 Order History</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
              <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #dfe6e9' }}>
                  <th style={{ padding: '10px', color: '#636e72', fontSize: '0.9rem' }}>Order ID</th>
                  <th style={{ padding: '10px', color: '#636e72', fontSize: '0.9rem' }}>Customer Name</th>
                  <th style={{ padding: '10px', color: '#636e72', fontSize: '0.9rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice().reverse().map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #f1f2f6' }}>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#ff793f', fontSize: '1rem' }}>#{o.id}</td>
                    <td style={{ padding: '10px', fontWeight: '600', fontSize: '1rem', color: '#2d3436' }}>{o.customer_name}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ 
                        padding: '4px 12px', borderRadius: '15px', fontSize: '0.8rem', fontWeight: 'bold',
                        background: o.status === 'Completed' ? '#e8f8f5' : o.status === 'Preparing' ? '#fff4e5' : '#e3f2fd',
                        color: o.status === 'Completed' ? '#27ae60' : o.status === 'Preparing' ? '#d35400' : '#0984e3'
                      }}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && <p style={{ textAlign: 'center', color: '#b2bec3', padding: '15px', fontSize: '0.9rem' }}>No orders yet.</p>}
          </div>
        </div>

        {/* ADD/EDIT MENU ITEM SECTION */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.2rem', color: editingId ? '#0984e3' : '#2d3436' }}>
            {editingId ? '✏️ Modify Menu Item' : '➕ Add New Menu Item'}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <div style={{ display: 'flex', gap: '15px', flexDirection: window.innerWidth < 600 ? 'column' : 'row' }}>
              <input 
                placeholder="Item Name (e.g. Masala Dosa)" 
                value={newProduct.name} 
                onChange={e => setNewProduct({...newProduct, name: e.target.value})} 
                required 
                style={{ flex: 1, padding: '12px', border: '1px solid #dfe6e9', borderRadius: '8px', fontSize: '0.95rem', outline: 'none' }} 
              />
              <input 
                placeholder="Category (e.g. South Indian)" 
                value={newProduct.category} 
                onChange={e => setNewProduct({...newProduct, category: e.target.value})} 
                required 
                style={{ flex: 1, padding: '12px', border: '1px solid #dfe6e9', borderRadius: '8px', fontSize: '0.95rem', outline: 'none' }} 
              />
            </div>
            
            <div style={{ padding: '15px', border: '1px dashed #b2bec3', borderRadius: '8px', background: '#f8f9fa', textAlign: 'center' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#636e72', fontWeight: 'bold', fontSize: '0.9rem' }}>
                {editingId ? 'Update Image (Optional)' : 'Upload Product Image'}
              </label>
              <input 
                id="imageUploadInput"
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                required={!editingId && !newProduct.image} 
                style={{ width: '100%', maxWidth: '250px', cursor: 'pointer', fontSize: '0.85rem' }} 
              />
              
              {newProduct.image && (
                <div style={{ marginTop: '15px' }}>
                  <img src={newProduct.image} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button type="submit" style={{ 
                flex: 1, padding: '12px', background: editingId ? '#0984e3' : '#fd79a8', color: 'white', 
                border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem',
                cursor: 'pointer', transition: '0.3s', minWidth: '150px'
              }}>
                {editingId ? 'Update Item' : 'Save to Menu'}
              </button>
              
              {editingId && (
                <button type="button" onClick={handleCancelEdit} style={{ 
                  flex: 1, padding: '12px', background: '#f1f2f6', color: '#636e72', 
                  border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem',
                  cursor: 'pointer', minWidth: '100px'
                }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* MANAGE MENU LIST SECTION */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.2rem', color: '#2d3436' }}>🗑️ Manage Menu</h3>
          <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {products.map(p => (
              <div key={p.id} style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                padding: '12px', borderBottom: '1px solid #f1f2f6', background: '#fafafa', borderRadius: '8px', marginBottom: '8px', flexWrap: 'wrap', gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={p.image} alt={p.name} style={{ width: '45px', height: '45px', borderRadius: '8px', objectFit: 'cover', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }} />
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#2d3436' }}>{p.name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#636e72', marginTop: '2px' }}>{p.category}</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => handleEditClick(p)} 
                    style={{ background: '#e3f2fd', color: '#0984e3', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                  >
                    Modify
                  </button>
                  <button 
                    onClick={() => handleDeleteProduct(p.id)} 
                    style={{ background: '#ffeef0', color: '#d63031', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {products.length === 0 && <p style={{ textAlign: 'center', color: '#b2bec3', fontSize: '0.9rem' }}>Menu is empty.</p>}
          </div>
        </div>

      </div>
    </div>
  );
}
