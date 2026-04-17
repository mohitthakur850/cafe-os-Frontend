import React, { useState, useEffect } from 'react';

export default function AdminPage() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', category: '', image: '' });

  // Dashboard load hone par data fetch karna
  useEffect(() => {
    fetch('https://cafe-os-backend.onrender.com/orders').then(res => res.json()).then(setOrders);
    fetch('https://cafe-os-backend.onrender.com/products').then(res => res.json()).then(setProducts);
    
    // Auto-refresh orders every 10 seconds
    const interval = setInterval(() => {
      fetch('https://cafe-os-backend.onrender.com/orders').then(res => res.json()).then(setOrders);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Image Upload ko Base64 mein convert karna
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

  // Naya product save karna
  const handleAddProduct = async (e) => {
    e.preventDefault();
    
    if (!newProduct.image) {
      alert("Please upload an image first!");
      return;
    }

    try {
      const res = await fetch('https://cafe-os-backend.onrender.com/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newProduct, price: 0 }) 
      });

      if (!res.ok) throw new Error("Upload failed (File might be too large)");

      const addedProduct = await res.json();
      setProducts([...products, addedProduct]);
      setNewProduct({ name: '', category: '', image: '' }); 
      
      // Reset input visually
      document.getElementById('imageUploadInput').value = '';
      alert("Item added to Menu! 🍔");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to save item. Make sure server limit is increased.");
    }
  };

  // Product delete karna
  const handleDeleteProduct = async (id) => {
    if(window.confirm("Are you sure you want to delete this item?")) {
      await fetch(`https://cafe-os-backend.onrender.com/products/${id}`, { method: 'DELETE' });
      setProducts(products.filter(p => p.id !== id));
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      fontFamily: 'sans-serif',
      padding: '40px 20px',
      backgroundColor: '#e8f0fe' // Clean, plain light blue background
    }}>
      
      {/* Container to keep content centered and readable */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* HEADER SECTION */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '20px 30px', borderRadius: '15px', boxShadow: '0 8px 20px rgba(0,0,0,0.05)' }}>
          <h1 style={{ color: '#2d3436', margin: 0, fontSize: '1.8rem' }}>Cafe OS Admin Dashboard ⚙️</h1>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#636e72', fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Orders Today</div>
            <div style={{ fontSize: '2.5rem', color: '#0984e3', fontWeight: '800', lineHeight: '1' }}>{orders.length}</div>
          </div>
        </div>

        {/* ORDER HISTORY SECTION */}
        <div style={{ background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 8px 20px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.4rem', color: '#2d3436' }}>📜 Order History</h3>
          <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #dfe6e9' }}>
                  <th style={{ padding: '15px', color: '#636e72' }}>Order ID</th>
                  <th style={{ padding: '15px', color: '#636e72' }}>Customer Name</th>
                  <th style={{ padding: '15px', color: '#636e72' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice().reverse().map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #f1f2f6' }}>
                    <td style={{ padding: '15px', fontWeight: 'bold', color: '#ff793f', fontSize: '1.1rem' }}>#{o.id}</td>
                    <td style={{ padding: '15px', fontWeight: '600', fontSize: '1.1rem', color: '#2d3436' }}>{o.customer_name}</td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ 
                        padding: '6px 15px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold',
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
            {orders.length === 0 && <p style={{ textAlign: 'center', color: '#b2bec3', padding: '20px' }}>No orders yet.</p>}
          </div>
        </div>

        {/* ADD NEW MENU ITEM SECTION */}
        <div style={{ background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 8px 20px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.4rem', color: '#2d3436' }}>➕ Add New Menu Item</h3>
          <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <input 
              placeholder="Item Name (e.g. Masala Dosa)" 
              value={newProduct.name} 
              onChange={e => setNewProduct({...newProduct, name: e.target.value})} 
              required 
              style={{ width: '100%', padding: '15px', border: '2px solid #dfe6e9', borderRadius: '10px', fontSize: '1rem', outline: 'none' }} 
            />
            
            <input 
              placeholder="Category (e.g. South Indian)" 
              value={newProduct.category} 
              onChange={e => setNewProduct({...newProduct, category: e.target.value})} 
              required 
              style={{ width: '100%', padding: '15px', border: '2px solid #dfe6e9', borderRadius: '10px', fontSize: '1rem', outline: 'none' }} 
            />
            
            {/* File Upload Box */}
            <div style={{ padding: '20px', border: '2px dashed #b2bec3', borderRadius: '10px', background: '#f8f9fa', textAlign: 'center' }}>
              <label style={{ display: 'block', marginBottom: '10px', color: '#636e72', fontWeight: 'bold' }}>Upload Product Image</label>
              <input 
                id="imageUploadInput"
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                required={!newProduct.image} 
                style={{ width: '100%', maxWidth: '300px', cursor: 'pointer' }} 
              />
              
              {/* Image Preview */}
              {newProduct.image && (
                <div style={{ marginTop: '20px' }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#27ae60', fontWeight: 'bold' }}>Preview:</p>
                  <img src={newProduct.image} alt="Preview" style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '12px', boxShadow: '0 5px 15px rgba(0,0,0,0.2)' }} />
                </div>
              )}
            </div>

            <button type="submit" style={{ 
              width: '100%', padding: '18px', background: '#fd79a8', color: 'white', 
              border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '1.1rem',
              cursor: 'pointer', transition: '0.3s', boxShadow: '0 5px 15px rgba(253, 121, 168, 0.4)' 
            }}>
              Save to Menu
            </button>
          </form>
        </div>

        {/* MANAGE MENU LIST SECTION */}
        <div style={{ background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 8px 20px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.4rem', color: '#2d3436' }}>🗑️ Manage Menu</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {products.map(p => (
              <div key={p.id} style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                padding: '15px', borderBottom: '1px solid #f1f2f6', background: '#fafafa', borderRadius: '10px', marginBottom: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <img src={p.image} alt={p.name} style={{ width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#2d3436' }}>{p.name}</div>
                    <div style={{ fontSize: '0.9rem', color: '#636e72', marginTop: '4px' }}>{p.category}</div>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteProduct(p.id)} 
                  style={{ background: '#ffeef0', color: '#d63031', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', transition: '0.2s' }}
                >
                  Delete
                </button>
              </div>
            ))}
            {products.length === 0 && <p style={{ textAlign: 'center', color: '#b2bec3' }}>Menu is empty.</p>}
          </div>
        </div>

      </div>
    </div>
  );
}