import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UserPage.css'; 

const UserPage = () => {
  const [products, setProducts] = useState([]);
  const [dynamicCategories, setDynamicCategories] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [activeScreen, setActiveScreen] = useState('IDLE'); 
  const [placedOrderId, setPlacedOrderId] = useState(null);
  const [activeCategory, setActiveCategory] = useState(''); 
  const [activeSubCategory, setActiveSubCategory] = useState('All');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productRes, catRes] = await Promise.all([
          axios.get(`https://cafe-os-backend-production.up.railway.app/products?t=${Date.now()}`),
          axios.get(`https://cafe-os-backend-production.up.railway.app/categories?t=${Date.now()}`)
        ]);
        setProducts(productRes.data);
        let formattedCats = [];
        if (catRes.data.length > 0) {
          formattedCats = catRes.data.map(c => ({ main: c.name, image: c.image || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg', subs: [...new Set(productRes.data.filter(p => p.category === c.name).map(p => p.subCategory).filter(Boolean))] }));
        } else if (productRes.data.length > 0) {
          const categoryMap = {};
          productRes.data.forEach(product => { if (!product.category) return; if (!categoryMap[product.category]) categoryMap[product.category] = new Set(); if (product.subCategory) categoryMap[product.category].add(product.subCategory); });
          formattedCats = Object.keys(categoryMap).map(catName => ({ main: catName, image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg', subs: Array.from(categoryMap[catName]) }));
        }
        setDynamicCategories(formattedCats);
      } catch(e) { console.error(e); } finally { setIsLoading(false); }
    };
    loadData();
    const interval = setInterval(loadData, 10000); 
    return () => clearInterval(interval);
  }, []);

  const totalAmount = cart.reduce((sum, item) => sum + (item.itemTotal * item.quantity), 0);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleRestart = () => { setActiveScreen('IDLE'); setCart([]); setCustomerName(''); setIsCartOpen(false); setPlacedOrderId(null); setErrorMessage(''); };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return setErrorMessage("Your tray is empty! Please add some items. 🛒");
    if (!customerName.trim()) return setErrorMessage("Please enter your Name before confirming! 👤");

    const newOrder = { customer_name: customerName, items: cart, total: totalAmount, status: 'Accepted' }; 
    try {
      const res = await axios.post('https://cafe-os-backend-production.up.railway.app/orders', newOrder);
      setPlacedOrderId(res.data.id); setIsCartOpen(false); setActiveScreen('SUCCESS');
      setTimeout(() => { handleRestart(); }, 6000);
    } catch { setErrorMessage("Network issue! Couldn't place your order."); }
  };

  const handleAddToCartClick = (product) => {
    if (product.addons && product.addons.length > 0) {
      setSelectedProduct(product);
      setSelectedAddons([]);
    } else {
      const basePrice = product.price !== undefined ? product.price : 0;
      const existingIndex = cart.findIndex(item => {
        const isSameProduct = (item._id && product._id && item._id === product._id) || (item.name === product.name);
        if (!isSameProduct) return false;
        if (item.addons && item.addons.length > 0) return false;
        return true;
      });

      if (existingIndex >= 0) {
        const newCart = [...cart]; 
        newCart[existingIndex].quantity += 1; 
        setCart(newCart);
      } else {
        setCart([...cart, { ...product, cartId: Date.now(), addons: [], itemTotal: basePrice, quantity: 1 }]);
      }
    }
  };

  const toggleAddon = (addon) => { if (selectedAddons.includes(addon)) setSelectedAddons(selectedAddons.filter(a => a.name !== addon.name)); else setSelectedAddons([...selectedAddons, addon]); };

  const confirmAddToCart = () => {
    const basePrice = selectedProduct.price !== undefined ? selectedProduct.price : 0; 
    const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
    const existingIndex = cart.findIndex(item => {
      const isSameProduct = (item._id && selectedProduct._id && item._id === selectedProduct._id) || (item.name === selectedProduct.name);
      if (!isSameProduct) return false;
      if (item.addons.length !== selectedAddons.length) return false;
      return item.addons.map(a => a.name).sort().join(',') === selectedAddons.map(a => a.name).sort().join(',');
    });
    if (existingIndex >= 0) { const newCart = [...cart]; newCart[existingIndex].quantity += 1; setCart(newCart); } 
    else { setCart([...cart, { ...selectedProduct, cartId: Date.now(), addons: selectedAddons, itemTotal: basePrice + addonsTotal, quantity: 1 }]); }
    setSelectedProduct(null); 
  };

  const updateQuantity = (cartId, delta) => { let updatedCart = cart.map(item => item.cartId === cartId ? { ...item, quantity: item.quantity + delta } : item).filter(item => item.quantity > 0); setCart(updatedCart); if (updatedCart.length === 0) setIsCartOpen(false); };
  const getProductTotalQty = (product) => cart.filter(item => (item._id && item._id === product._id) || item.name === product.name).reduce((sum, item) => sum + item.quantity, 0);
  const handleMinusFromMenu = (product) => { const index = [...cart].reverse().findIndex(item => (item._id && item._id === product._id) || item.name === product.name); if (index !== -1) updateQuantity(cart[cart.length - 1 - index].cartId, -1); };

  let displayProducts = products.filter(p => p.category && p.category.toLowerCase() === activeCategory.toLowerCase());
  if (activeSubCategory !== 'All') displayProducts = displayProducts.filter(p => (p.subCategory && p.subCategory.toLowerCase() === activeSubCategory.toLowerCase()));
  const currentCategoryData = dynamicCategories.find(c => c.main === activeCategory);

  if (activeScreen === 'IDLE') return (
    <div onClick={() => setActiveScreen('HOME')} className="idle-screen">
     <img src="https://drive.google.com/uc?export=view&id=1pCIAhibzy9H_aWZd89aBbDCm8SN0Wjw_" alt="Cafe" className="idle-bg" />
      <div className="idle-overlay"></div>
      <h1 className="idle-title">Vendiman<span style={{ color: '#ffcc00' }}> Cafe</span></h1>
      <p className="idle-subtitle">🍔 Touch Anywhere to Start</p>
    </div>
  );

  if (activeScreen === 'SUCCESS') return (
    <div style={{ height: '100vh', backgroundColor: '#f0fdfa', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '20px' }}>
      <div className="pop-in" style={{ maxWidth: '800px', width: '100%' }}>
        <div style={{ fontSize: '7rem', marginBottom: '20px', animation: 'pulseHeart 2s infinite' }}>✅</div>
        <h1 style={{ fontSize: '4.5rem', margin: '0 0 10px 0', color: '#16a34a', fontWeight: '900', letterSpacing: '-1px' }}>Order Placed!</h1>
        <p style={{ fontSize: '2.2rem', color: '#4b5563', margin: '0 0 40px 0' }}>Thank you, <span style={{ color: '#1f2937', fontWeight: '800' }}>{customerName}</span></p>
        <div style={{ backgroundColor: 'white', padding: '40px 60px', borderRadius: '30px', boxShadow: '0 20px 50px rgba(0,0,0,0.08)', display: 'inline-block', marginBottom: '50px', border: '3px dashed #22c55e' }}>
          <p style={{ fontSize: '1.6rem', color: '#6b7280', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>Your Order Number</p>
          <h2 style={{ fontSize: '6rem', margin: 0, color: '#111827', fontWeight: '900' }}>#{placedOrderId}</h2>
        </div>
      </div>
    </div>
  );

  return (
    <div className="user-container">

      {isLoading && (
        <div className="modal-overlay modal-center" style={{ animation: 'fadeIn 0.3s', backgroundColor: 'rgba(255,255,255,0.95)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '6rem', animation: 'pulseHeart 1.5s infinite' }}>☕</div>
            <h2 style={{ color: '#333', fontSize: '2.5rem', marginTop: '20px', fontWeight: '800' }}>Preparing Menu...</h2>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="modal-overlay modal-center">
          <div className="modal-box shake-animation" style={{ borderRadius: '24px', maxWidth: '500px', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '15px' }}>⚠️</div>
            <h2 style={{ color: '#222', fontSize: '2rem', margin: '0 0 15px 0' }}>Oops!</h2>
            <p style={{ color: '#555', fontSize: '1.3rem', margin: '0 0 30px 0' }}>{errorMessage}</p>
            <button onClick={() => setErrorMessage('')} style={{ padding: '15px 40px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '50px', fontSize: '1.3rem', fontWeight: 'bold', cursor: 'pointer' }}>Okay</button>
          </div>
        </div>
      )}

      {activeScreen === 'HOME' && (
        <div className="animated-grid" style={{ padding: '50px 20px', height: '100%', overflowY: 'auto', paddingBottom: cart.length > 0 ? '120px' : '50px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}><h1 style={{ fontSize: '3.5rem', margin: 0, color: '#222', fontWeight: '800' }}>What are you craving?</h1></div>
          <div className="home-grid">
            {!isLoading && dynamicCategories.length === 0 ? (<h2 style={{textAlign: 'center', gridColumn: '1/-1'}}>Menu is empty!</h2>) : (
              dynamicCategories.map(cat => (
                <div key={cat.main} className="product-card" onClick={() => { setActiveCategory(cat.main); setActiveSubCategory('All'); setActiveScreen('MENU'); }} style={{ height: '180px', position: 'relative', cursor: 'pointer', boxShadow: '0 8px 20px rgba(0,0,0,0.06)' }}>
                  <img src={cat.image} alt={cat.main} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', padding: '20px', background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}>
                    <h2 style={{ color: 'white', margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>{cat.main}</h2>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeScreen === 'MENU' && (
        <div className="menu-layout" style={{ paddingBottom: cart.length > 0 ? '100px' : '0' }}>
          <div className="sidebar">
            <div className="sidebar-home-wrapper" style={{ padding: '15px' }}><button className="product-card" onClick={() => setActiveScreen('HOME')} style={{ width: '100%', padding: '15px', backgroundColor: '#f1f3f5', border: 'none', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer' }}>🏠 Go Home</button></div>
            <div className="category-list-container" style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
              {dynamicCategories.map(cat => (
                <div key={cat.main} className={`sidebar-btn ${activeCategory === cat.main ? 'active' : ''}`} onClick={() => { setActiveCategory(cat.main); setActiveSubCategory('All'); }}>
                  <img src={cat.image} alt={cat.main} style={{ width: '45px', height: '45px', borderRadius: '12px', objectFit: 'cover' }} />
                  <span style={{ marginLeft: '15px', fontSize: '1.1rem', fontWeight: 'bold' }}>{cat.main}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="menu-content">
            {currentCategoryData && (<div className="fade-in category-banner" style={{ width: '100%', height: '180px', position: 'relative', flexShrink: 0 }}><img src={currentCategoryData.image} alt={activeCategory} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /><div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}></div><h1 style={{ position: 'absolute', bottom: '20px', left: '30px', margin: 0, fontSize: '2.5rem', color: 'white', fontWeight: '900' }}>{activeCategory.toUpperCase()}</h1></div>)}
            <div style={{ padding: '20px' }}>
              {currentCategoryData && currentCategoryData.subs.length > 0 && (
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '20px', paddingBottom: '5px' }}>
                  <div className="sub-cat-chip" onClick={() => setActiveSubCategory('All')} style={{ padding: '8px 20px', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: activeSubCategory === 'All' ? '#333' : 'white', color: activeSubCategory === 'All' ? 'white' : '#555', border: '2px solid #333' }}>All</div>
                  {currentCategoryData.subs.map(sub => (<div key={sub} className="sub-cat-chip" onClick={() => setActiveSubCategory(sub)} style={{ padding: '8px 20px', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: activeSubCategory === sub ? '#333' : 'white', color: activeSubCategory === sub ? 'white' : '#555', border: '2px solid #333' }}>{sub}</div>))}
                </div>
              )}
              
              <div className="product-grid animated-grid">
                {displayProducts.map(product => {
                  const qtyInCart = getProductTotalQty(product); const isAvailable = product.isAvailable !== false;
                  return (
                    <div key={product._id || product.id} className="product-card" style={{ opacity: isAvailable ? 1 : 0.6, pointerEvents: isAvailable ? 'auto' : 'none' }}>
                      <div className="card-inner">
                        <img src={product.image || "https://via.placeholder.com/150"} alt={product.name} className="prod-img" style={{ filter: isAvailable ? 'none' : 'grayscale(100%)' }} />
                        <h3 className="prod-title">{product.name}</h3>
                        <p className="prod-desc">{product.description || "Freshly prepared."}</p>
                        <div className="prod-bottom">
                          <span className="prod-price">₹{product.price || 0}</span>
                          {!isAvailable ? (<span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.8rem' }}>Sold Out 🚫</span>) : qtyInCart === 0 ? (
                            <button onClick={() => handleAddToCartClick(product)} className="prod-add-btn">+ ADD</button>
                          ) : (
                            <div className="prod-qty-box">
                              <button onClick={() => handleMinusFromMenu(product)} className="prod-qty-btn">-</button>
                              <span className="prod-qty-num">{qtyInCart}</span>
                              <button onClick={() => handleAddToCartClick(product)} className="prod-qty-btn">+</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedProduct && (
        <div className="modal-overlay modal-bottom">
          <div className="modal-box" style={{ width: '500px', borderTopLeftRadius: '35px', borderTopRightRadius: '35px', animation: 'slideUpFade 0.3s forwards' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.8rem' }}>Customize</h2>
              <button onClick={() => setSelectedProduct(null)} style={{ border: 'none', background: '#f1f3f5', borderRadius: '50%', width: '40px', height: '40px', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>
            <h3 style={{ margin: '0 0 5px 0' }}>{selectedProduct.name}</h3>
            <h4 style={{ color: '#888', marginBottom: '15px', fontWeight: 'normal' }}>Add Extras (Optional)</h4>
            <div style={{ marginBottom: '25px', maxHeight: '250px', overflowY: 'auto' }}>
              {selectedProduct.addons && selectedProduct.addons.length > 0 ? (selectedProduct.addons.map(addon => { const isSelected = selectedAddons.includes(addon); return (<div key={addon.name} onClick={() => toggleAddon(addon)} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', border: `2px solid ${isSelected ? '#28a745' : '#eaeaea'}`, borderRadius: '12px', marginBottom: '10px', cursor: 'pointer', backgroundColor: isSelected ? '#f2fdf5' : 'white' }}><span style={{ fontWeight: 'bold', color: isSelected ? '#1e7e34' : '#444' }}>{addon.name}</span><span style={{ color: isSelected ? '#1e7e34' : '#666', fontWeight: 'bold' }}>+₹{addon.price}</span></div>); })) : (<p style={{ color: '#888' }}>No add-ons available.</p>)}
            </div>
            <button onClick={confirmAddToCart} className="product-card" style={{ width: '100%', padding: '20px', backgroundColor: '#ffcc00', border: 'none', borderRadius: '15px', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}><span>Add to Tray</span><span>₹{(selectedProduct.price || 0) + selectedAddons.reduce((sum, a) => sum + a.price, 0)}</span></button>
          </div>
        </div>
      )}

      {cart.length > 0 && !isCartOpen && (
        <div className="bottom-bar" style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', backgroundColor: 'rgba(255,255,255,0.95)', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100, borderTop: '1px solid #eee' }}>
          <button onClick={handleRestart} style={{ padding: '12px 25px', backgroundColor: '#ffebe6', color: '#d9534f', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>Cancel</button>
          <div style={{ textAlign: 'center' }}><span style={{ color: '#888' }}>{totalItemsCount} items</span><h2 style={{ margin: 0, fontSize: '2rem', color: '#222' }}>₹{totalAmount}</h2></div>
          <button onClick={() => setIsCartOpen(true)} style={{ padding: '12px 30px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem' }}>View Tray ➔</button>
        </div>
      )}

      {isCartOpen && (
        <div className="modal-overlay modal-right">
          <div className="modal-box cart-drawer" style={{ width: '450px', height: '100%', display: 'flex', flexDirection: 'column', animation: 'popIn 0.3s forwards' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}><h1 style={{ margin: 0 }}>🛒 Tray</h1><button onClick={() => setIsCartOpen(false)} style={{ border: 'none', background: '#f1f3f5', borderRadius: '50%', width: '45px', height: '45px', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button></div>
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
              {cart.map((item) => (
                <div key={item.cartId} style={{ padding: '15px 0', borderBottom: '1px solid #eaeaea', display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}><span style={{ fontWeight: 'bold' }}>{item.name}</span>{item.addons && item.addons.length > 0 && (<div style={{ color: '#888', fontSize: '0.85rem' }}>+ {item.addons.map(a => a.name).join(', ')}</div>)}</div>
                  <div style={{ textAlign: 'right' }}><div style={{ fontWeight: 'bold', marginBottom: '10px' }}>₹{item.itemTotal * item.quantity}</div><div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f1f3f5', borderRadius: '30px', padding: '5px' }}><button className="qty-btn" onClick={() => updateQuantity(item.cartId, -1)}>-</button><span style={{ margin: '0 12px', fontWeight: 'bold' }}>{item.quantity}</span><button className="qty-btn" onClick={() => updateQuantity(item.cartId, 1)}>+</button></div></div>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '2px solid #eaeaea', paddingTop: '20px' }}>
              <h2 style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}><span>Total:</span><span>₹{totalAmount}</span></h2>
              <input type="text" placeholder="Enter Name to Order" value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={{ width: '100%', padding: '15px', marginBottom: '15px', borderRadius: '12px', border: '2px solid #ddd', fontSize: '1.1rem', fontWeight: 'bold' }} />
              <button onClick={handlePlaceOrder} style={{ width: '100%', padding: '18px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1.3rem', cursor: 'pointer', fontWeight: 'bold' }}>CONFIRM ORDER 🚀</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPage;
