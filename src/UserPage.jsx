import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import './UserPage.css'; 

const MAX_QTY_PER_ITEM = 5; 
const MAX_TOTAL_CART_ITEMS = 15; 
const DEVICE_COOLDOWN_MS = 3 * 60 * 1000; 

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

  // 🔄 LIVE FETCHING ENGINE
  useEffect(() => {
    const loadData = async () => {
      try {
        const [productRes, catRes] = await Promise.all([
          axios.get(`https://cafe-os-backend.onrender.com/products?t=${Date.now()}`),
          axios.get(`https://cafe-os-backend.onrender.com/categories?t=${Date.now()}`)
        ]);
        setProducts(productRes.data);
        let formattedCats = [];
        if (catRes.data.length > 0) {
          formattedCats = catRes.data.map(c => ({ 
            main: c.name, 
            image: c.image || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg', 
            subs: [...new Set(productRes.data.filter(p => p.category === c.name).map(p => p.subCategory).filter(Boolean))] 
          }));
        } else if (productRes.data.length > 0) {
          const categoryMap = {};
          productRes.data.forEach(product => { 
            if (!product.category) return; 
            if (!categoryMap[product.category]) categoryMap[product.category] = new Set(); 
            if (product.subCategory) categoryMap[product.category].add(product.subCategory); 
          });
          formattedCats = Object.keys(categoryMap).map(catName => ({ 
            main: catName, 
            image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg', 
            subs: Array.from(categoryMap[catName]) 
          }));
        }
        setDynamicCategories(formattedCats);
      } catch(e) { 
        console.error(e); 
      } finally { 
        setIsLoading(false); 
      }
    };

    loadData();

    const socket = io('https://cafe-os-backend.onrender.com', { transports: ['websocket'] });
    socket.on('orderUpdated', () => { loadData(); });
    const interval = setInterval(loadData, 60000); 

    return () => { clearInterval(interval); socket.disconnect(); };
  }, []);

  const totalAmount = cart.reduce((sum, item) => sum + (item.itemTotal * item.quantity), 0);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleRestart = () => { 
    setActiveScreen('IDLE'); setCart([]); setCustomerName(''); 
    setIsCartOpen(false); setPlacedOrderId(null); setErrorMessage(''); 
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return setErrorMessage("Your tray is empty! Please add some items. 🛒");
    const cleanName = customerName.trim();
    const nameRegex = /^[A-Za-z\s]{3,30}$/;

    if (!cleanName) return setErrorMessage("Please enter your Name before confirming! 👤");
    if (!nameRegex.test(cleanName)) return setErrorMessage("Invalid Name! Please enter a real name (Only letters, min 3 characters). 🛑");

    const now = Date.now();
    const lastOrderTime = parseInt(localStorage.getItem('deviceLastOrderTime') || '0', 10);
    if (now - lastOrderTime < DEVICE_COOLDOWN_MS) {
      const waitMins = Math.ceil((DEVICE_COOLDOWN_MS - (now - lastOrderTime)) / 60000);
      return setErrorMessage(`You already placed an order! Please wait ${waitMins} minute(s). 🛑`);
    }

    const cleanItems = cart.map(item => ({
      name: item.name, price: item.price !== undefined ? item.price : 0,
      quantity: item.quantity, itemTotal: item.itemTotal, addons: item.addons || []
    }));

    const newOrder = { customer_name: cleanName, items: cleanItems, total: totalAmount, status: 'Accepted' }; 
    setIsCartOpen(false); setActiveScreen('PROCESSING'); 

    try {
      const res = await axios.post('https://cafe-os-backend.onrender.com/orders', newOrder);
      localStorage.setItem('deviceLastOrderTime', Date.now().toString());
      setPlacedOrderId(res.data.id || res.data._id); 
      setActiveScreen('SUCCESS'); 
      setTimeout(() => { handleRestart(); }, 6000);
    } catch { 
      setActiveScreen('HOME'); setErrorMessage("Network issue! Couldn't place your order."); 
    }
  };

  const handleAddToCartClick = (product) => {
    if (totalItemsCount >= MAX_TOTAL_CART_ITEMS) return setErrorMessage(`Maximum ${MAX_TOTAL_CART_ITEMS} items allowed! 🛑`);

    if (product.addons && product.addons.length > 0) {
      setSelectedProduct(product); setSelectedAddons([]);
    } else {
      const basePrice = product.price !== undefined ? product.price : 0;
      const existingIndex = cart.findIndex(item => {
        const isSameProduct = (item._id && product._id && item._id === product._id) || (item.name === product.name);
        return isSameProduct && (!item.addons || item.addons.length === 0);
      });

      if (existingIndex >= 0) {
        if (cart[existingIndex].quantity >= MAX_QTY_PER_ITEM) return setErrorMessage(`Max ${MAX_QTY_PER_ITEM} of ${product.name} allowed! 🛑`);
        const newCart = [...cart]; newCart[existingIndex].quantity += 1; setCart(newCart);
      } else {
        setCart([...cart, { ...product, cartId: Date.now(), addons: [], itemTotal: basePrice, quantity: 1 }]);
      }
    }
  };

  const toggleAddon = (addon) => { 
    if (selectedProduct.selectionType === 'Single') {
      if (selectedAddons.some(a => a.name === addon.name)) setSelectedAddons([]); else setSelectedAddons([addon]); 
    } else {
      if (selectedAddons.some(a => a.name === addon.name)) setSelectedAddons(selectedAddons.filter(a => a.name !== addon.name)); 
      else setSelectedAddons([...selectedAddons, addon]); 
    }
  };

  const confirmAddToCart = () => {
    if (totalItemsCount >= MAX_TOTAL_CART_ITEMS) { setSelectedProduct(null); return setErrorMessage(`Maximum ${MAX_TOTAL_CART_ITEMS} items allowed! 🛑`); }
    const basePrice = selectedProduct.price !== undefined ? selectedProduct.price : 0; 
    const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
    const existingIndex = cart.findIndex(item => {
      const isSameProduct = (item._id && selectedProduct._id && item._id === selectedProduct._id) || (item.name === selectedProduct.name);
      if (!isSameProduct) return false;
      if (item.addons.length !== selectedAddons.length) return false;
      return item.addons.map(a => a.name).sort().join(',') === selectedAddons.map(a => a.name).sort().join(',');
    });

    if (existingIndex >= 0) { 
      if (cart[existingIndex].quantity >= MAX_QTY_PER_ITEM) { setSelectedProduct(null); return setErrorMessage(`Max ${MAX_QTY_PER_ITEM} allowed! 🛑`); }
      const newCart = [...cart]; newCart[existingIndex].quantity += 1; setCart(newCart); 
    } else { 
      setCart([...cart, { ...selectedProduct, cartId: Date.now(), addons: selectedAddons, itemTotal: basePrice + addonsTotal, quantity: 1 }]); 
    }
    setSelectedProduct(null); 
  };

  const updateQuantity = (cartId, delta) => { 
    if (delta > 0 && totalItemsCount >= MAX_TOTAL_CART_ITEMS) return setErrorMessage(`Maximum ${MAX_TOTAL_CART_ITEMS} items allowed! 🛑`);
    let updatedCart = cart.map(item => {
      if (item.cartId === cartId) {
        const newQty = item.quantity + delta;
        if (newQty > MAX_QTY_PER_ITEM) { setErrorMessage(`Max ${MAX_QTY_PER_ITEM} allowed per item! 🛑`); return item; }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0);
    setCart(updatedCart); 
    if (updatedCart.length === 0) setIsCartOpen(false); 
  };

  const getProductTotalQty = (product) => cart.filter(item => (item._id && item._id === product._id) || item.name === product.name).reduce((sum, item) => sum + item.quantity, 0);
  const handleMinusFromMenu = (product) => { 
    const index = [...cart].reverse().findIndex(item => (item._id && item._id === product._id) || item.name === product.name); 
    if (index !== -1) updateQuantity(cart[cart.length - 1 - index].cartId, -1); 
  };

  let displayProducts = products.filter(p => p.category && p.category.toLowerCase() === activeCategory.toLowerCase());
  if (activeSubCategory !== 'All') displayProducts = displayProducts.filter(p => (p.subCategory && p.subCategory.toLowerCase() === activeSubCategory.toLowerCase()));
  const currentCategoryData = dynamicCategories.find(c => c.main === activeCategory);

  // --- SCREENS ---

  if (activeScreen === 'IDLE') {
    return (
      <div onClick={() => setActiveScreen('HOME')} className="idle-screen">
        <img src="/cafe.png" alt="Cafe Background" className="idle-bg" onError={(e) => { e.target.style.display = 'none'; }} />
        <div className="idle-overlay"></div>
        <h1 className="idle-title">Re-Fill<span style={{ color: '#ffcc00' }}> Cafe</span></h1>
        <div className="idle-subtitle-btn">🍔 TOUCH ANYWHERE TO START</div>
      </div>
    );
  }

  if (activeScreen === 'PROCESSING') {
    return (
      <div style={{ height: '100vh', backgroundColor: '#0f172a', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '20px' }}>
        <div className="tv-loading-spinner" style={{ marginBottom: '30px', borderColor: '#22c55e', borderRightColor: 'transparent', width: '80px', height: '80px' }}></div>
        <h1 style={{ fontSize: '3.5rem', color: '#fff', fontWeight: '900', margin: 0 }}>Sending to Kitchen... 🔥</h1>
      </div>
    );
  }

  if (activeScreen === 'SUCCESS') {
    return (
      <div style={{ height: '100vh', backgroundColor: '#f0fdfa', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '20px' }}>
        <div className="pop-in" style={{ maxWidth: '800px', width: '100%' }}>
          <div style={{ fontSize: '7rem', marginBottom: '20px', animation: 'pulseHeart 2s infinite' }}>✅</div>
          <h1 style={{ fontSize: '4.5rem', margin: '0 0 10px 0', color: '#16a34a', fontWeight: '900' }}>Order Placed!</h1>
          <p style={{ fontSize: '2.2rem', color: '#4b5563', margin: '0 0 40px 0' }}>Thank you, <span>{customerName}</span></p>
          <div style={{ backgroundColor: 'white', padding: '40px 60px', borderRadius: '30px', boxShadow: '0 20px 50px rgba(0,0,0,0.08)', border: '3px dashed #22c55e' }}>
            <p style={{ fontSize: '1.6rem', color: '#6b7280', margin: '0 0 10px 0', fontWeight: 'bold' }}>Your Order Number</p>
            <h2 style={{ fontSize: '6rem', margin: 0, color: '#111827', fontWeight: '900' }}>#{placedOrderId}</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-container">
      {isLoading && (
        <div className="modal-overlay modal-center" style={{ zIndex: 99999 }}>
          <div style={{ textAlign: 'center', background: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: '4rem', animation: 'pulseHeart 1.5s infinite' }}>☕</div>
            <h2 style={{ color: '#333', marginTop: '20px' }}>Preparing Menu...</h2>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="modal-overlay modal-center" style={{ zIndex: 99999 }}>
          <div className="modal-box shake-animation" style={{ borderRadius: '24px', maxWidth: '500px', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '15px' }}>⚠️</div>
            <h2 style={{ color: '#222', fontSize: '2rem', margin: '0 0 15px 0' }}>Oops!</h2>
            <p style={{ color: '#555', fontSize: '1.3rem', margin: '0 0 30px 0' }}>{errorMessage}</p>
            <button onClick={() => setErrorMessage('')} style={{ padding: '15px 40px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '50px', fontSize: '1.3rem', fontWeight: 'bold', cursor: 'pointer' }}>Okay</button>
          </div>
        </div>
      )}

      <div className="user-header">
        <div className="header-logo" onClick={() => setActiveScreen('HOME')}>
          <span>🍽️</span><h2>RE:<span>FILL</span></h2>
        </div>
        <button className="reset-btn" onClick={handleRestart}>🔄 Start Over</button>
      </div>

      {activeScreen === 'HOME' && (
        <div className="animated-grid home-wrapper">
          <div className="home-title"><h1>What are you craving?</h1></div>
          <div className="home-grid">
            {!isLoading && dynamicCategories.length === 0 ? (
              <h2 style={{ textAlign: 'center', gridColumn: '1/-1' }}>Menu is empty!</h2>
            ) : (
              dynamicCategories.map(cat => (
                <div key={cat.main} className="category-card-home" onClick={() => { setActiveCategory(cat.main); setActiveSubCategory('All'); setActiveScreen('MENU'); }}>
                  <img src={cat.image || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'} alt={cat.main} />
                  <div className="cat-overlay"><h2>{cat.main}</h2></div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeScreen === 'MENU' && (
        <div className="menu-layout animated-grid">
          <div className="sidebar">
            <div className="category-list-container">
              {dynamicCategories.map(cat => (
                <div key={cat.main} className={`sidebar-btn ${activeCategory === cat.main ? 'active' : ''}`} onClick={() => { setActiveCategory(cat.main); setActiveSubCategory('All'); }}>
                  <img src={cat.image || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'} alt={cat.main} />
                  <span>{cat.main}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="menu-content">
            <div className="fade-in category-banner">
              <img src={currentCategoryData?.image || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'} alt={activeCategory} />
              <div className="banner-overlay"></div>
              <h1>{activeCategory.toUpperCase()}</h1>
            </div>
            
            <div className="product-section">
              {currentCategoryData && currentCategoryData.subs.length > 0 && (
                <div className="subcat-scroll">
                  <div className={`sub-cat-chip ${activeSubCategory === 'All' ? 'active' : ''}`} onClick={() => setActiveSubCategory('All')}>All</div>
                  {currentCategoryData.subs.map(sub => (
                    <div key={sub} className={`sub-cat-chip ${activeSubCategory === sub ? 'active' : ''}`} onClick={() => setActiveSubCategory(sub)}>{sub}</div>
                  ))}
                </div>
              )}
              
              <div className="product-grid">
                {displayProducts.map(product => {
                  const qtyInCart = getProductTotalQty(product); 
                  const isAvailable = product.isAvailable !== false;
                  return (
                    <div key={product._id || product.id} className="product-card" style={{ opacity: isAvailable ? 1 : 0.6, pointerEvents: isAvailable ? 'auto' : 'none' }}>
                      <div className="card-inner">
                        <img src={product.image || "https://via.placeholder.com/150"} alt={product.name} className="prod-img" style={{ filter: isAvailable ? 'none' : 'grayscale(100%)' }} />
                        <h3 className="prod-title">{product.name}</h3>
                        <p className="prod-desc">{product.description || "Freshly prepared."}</p>
                        <div className="prod-bottom">
                          <span className="prod-price">₹{product.price || 0}</span>
                          {!isAvailable ? (
                            <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.8rem' }}>Sold Out 🚫</span>
                          ) : qtyInCart === 0 ? (
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

      {/* CUSTOMIZE MODAL */}
      {selectedProduct && (
        <div className="modal-overlay modal-center">
          <div className="modal-box customize-modal pop-in">
            <div className="modal-header">
              <h2>Customize</h2>
              <button onClick={() => setSelectedProduct(null)}>✕</button>
            </div>
            <h3>{selectedProduct.name}</h3>
            <h4>{selectedProduct.selectionType === 'Single' ? 'Select One Option (Required)' : 'Add Extras (Optional)'}</h4>
            <div className="addons-list">
              {selectedProduct.addons && selectedProduct.addons.length > 0 ? (
                selectedProduct.addons.map(addon => { 
                  const isSelected = selectedAddons.includes(addon); 
                  return (
                    <div key={addon.name} onClick={() => toggleAddon(addon)} className={`addon-item ${isSelected ? 'selected' : ''}`}>
                      <span>{addon.name}</span>
                      <span>+₹{addon.price}</span>
                    </div>
                  ); 
                })
              ) : (<p>No add-ons available.</p>)}
            </div>
            <button onClick={confirmAddToCart} className="add-to-tray-btn">
              <span>Add to Tray</span><span>₹{(selectedProduct.price || 0) + selectedAddons.reduce((sum, a) => sum + a.price, 0)}</span>
            </button>
          </div>
        </div>
      )}

      {/* BOTTOM NOTIFICATION BAR */}
      {cart.length > 0 && !isCartOpen && (
        <div className="bottom-bar">
          <div className="bottom-bar-info">
            <span>{totalItemsCount} items</span>
            <h2>₹{totalAmount}</h2>
          </div>
          <button className="view-tray-btn" onClick={() => setIsCartOpen(true)}>View Tray ➔</button>
        </div>
      )}

      {/* RIGHT SIDE CART DRAWER */}
      {isCartOpen && (
        <>
          <div className="cart-overlay" onClick={() => setIsCartOpen(false)}></div>
          <div className="cart-drawer slide-in-right">
            
            <div className="cart-header">
              <h2>🛒 Your Tray Review</h2>
              <button onClick={() => setIsCartOpen(false)}>✕</button>
            </div>

            <div className="cart-items-list">
              {cart.map((item) => (
                <div key={item.cartId} className="cart-item">
                  <div className="cart-item-info">
                    <h3>{item.name}</h3>
                    {item.addons && item.addons.length > 0 && (<span>+ {item.addons.map(a => a.name).join(', ')}</span>)}
                  </div>
                  <div className="cart-item-actions">
                    <h3>₹{item.itemTotal * item.quantity}</h3>
                    <div className="prod-qty-box cart-qty-box">
                      <button className="prod-qty-btn" onClick={() => updateQuantity(item.cartId, -1)}>-</button>
                      <span className="prod-qty-num">{item.quantity}</span>
                      <button className="prod-qty-btn" onClick={() => updateQuantity(item.cartId, 1)}>+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-footer">
              <div className="cart-total-row">
                <span>Total Amount:</span>
                <h2>₹{totalAmount}</h2>
              </div>
              <input type="text" placeholder="Enter Your Name (e.g. Mohit)" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="name-input" />
              <button onClick={handlePlaceOrder} className="confirm-order-btn">CONFIRM ORDER 🚀</button>
            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default UserPage;