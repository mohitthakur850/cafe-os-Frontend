import React, { useState, useEffect } from 'react';
import axios from 'axios';

// --- EMBEDDED CSS ANIMATIONS ---
const uiStyles = `
  @keyframes slideUpFade { 0% { opacity: 0; transform: translateY(30px); } 100% { opacity: 1; transform: translateY(0); } }
  @keyframes popIn { 0% { transform: scale(0.95); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
  @keyframes fadeIn { from { opacity: 0.4; } to { opacity: 1; } }
  .fade-in { animation: fadeIn 0.4s ease-in-out forwards; }
  .animated-grid { animation: slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  .product-card { transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }
  .product-card:hover { transform: translateY(-8px); box-shadow: 0 15px 30px rgba(0,0,0,0.1) !important; }
  .sidebar-btn { transition: all 0.3s ease; }
  .sidebar-btn:hover { transform: translateX(5px); background-color: #f8f9fa; }
  .sidebar-btn.active { background-color: #ffcc00 !important; transform: translateX(8px); box-shadow: 0 5px 15px rgba(255, 204, 0, 0.4) !important; border: none !important; }
  .sub-cat-chip { transition: all 0.2s ease; }
  .sub-cat-chip:active { transform: scale(0.9); }
  .qty-btn { width: 35px; height: 35px; border-radius: 50%; border: none; background-color: white; font-size: 1.2rem; font-weight: bold; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.1); transition: 0.2s; display: flex; justify-content: center; align-items: center; }
  .qty-btn:active { transform: scale(0.9); }
`;

// --- CATEGORY IMAGES DICTIONARY ---
// Agar admin koi nayi category banata hai toh system yahan se photo uthayega
const categoryImages = {
  'Burgers': 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg',
  'Pizzas': 'https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg',
  'Beverages': 'https://images.pexels.com/photos/12108740/pexels-photo-12108740.jpeg',
  'Snacks': 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg',
  'Desserts': 'https://images.pexels.com/photos/45202/brownie-dessert-cake-sweet-45202.jpeg',
  'Momos': 'https://images.pexels.com/photos/5409015/pexels-photo-5409015.jpeg', // Nayi Momos ki photo!
  'Default': 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg' // Koi nayi anjaan category banayi toh yeh photo aayegi
};

const availableAddons = [
  { name: 'Extra Cheese 🧀', price: 30 },
  { name: 'Peri Peri Sprinkle 🌶️', price: 15 },
  { name: 'Extra Mayo Dip 🍯', price: 20 },
  { name: 'Make it a Combo 🍟🥤', price: 99 }
];

const UserPage = () => {
  const [products, setProducts] = useState([]);
  const [dynamicCategories, setDynamicCategories] = useState([]); // NAYA: Categories ab database se banengi
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  
  const [activeScreen, setActiveScreen] = useState('IDLE'); 
  const [activeCategory, setActiveCategory] = useState(''); 
  const [activeSubCategory, setActiveSubCategory] = useState('All');
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);

  useEffect(() => {
    axios.get('https://cafe-os-backend.onrender.com/products')
      .then(res => {
        const fetchedProducts = res.data;
        setProducts(fetchedProducts);

        // --- AUTO-GENERATE CATEGORIES FROM DATABASE ---
        const categoryMap = {};
        
        fetchedProducts.forEach(product => {
          const catName = product.category;
          if (!catName) return; // Agar category khali hai toh skip karo

          if (!categoryMap[catName]) {
            categoryMap[catName] = new Set();
          }
          if (product.subCategory) {
            categoryMap[catName].add(product.subCategory);
          }
        });

        const generatedCategories = Object.keys(categoryMap).map(catName => ({
          main: catName,
          image: categoryImages[catName] || categoryImages['Default'],
          subs: Array.from(categoryMap[catName])
        }));

        setDynamicCategories(generatedCategories);
      })
      .catch(err => console.error("Error fetching products", err));
  }, []);

  const totalAmount = cart.reduce((sum, item) => sum + (item.itemTotal * item.quantity), 0);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleRestart = () => {
    setActiveScreen('IDLE'); setCart([]); setCustomerName(''); setIsCartOpen(false);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return alert("Cart is empty!");
    if (!customerName) return alert("Please enter your name!");
    const newOrder = { customer_name: customerName, items: cart, total: totalAmount };

    try {
      await axios.post('https://cafe-os-backend.onrender.com/orders', newOrder);
      alert(`Order Confirmed! Total: ₹${totalAmount}. ✅`);
      handleRestart();
    } catch (error) {
      alert("Error placing order");
    }
  };

  const openAddonModal = (product) => { setSelectedProduct(product); setSelectedAddons([]); };
  const toggleAddon = (addon) => {
    if (selectedAddons.includes(addon)) { setSelectedAddons(selectedAddons.filter(a => a.name !== addon.name)); } 
    else { setSelectedAddons([...selectedAddons, addon]); }
  };

  const confirmAddToCart = () => {
    const basePrice = selectedProduct.price || 150; // Ab original price use hoga
    const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
    
    const existingIndex = cart.findIndex(item => {
      if (item._id !== selectedProduct._id && item.id !== selectedProduct.id) return false;
      if (item.addons.length !== selectedAddons.length) return false;
      const existingStr = item.addons.map(a => a.name).sort().join(',');
      const newStr = selectedAddons.map(a => a.name).sort().join(',');
      return existingStr === newStr;
    });

    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      const finalItem = {
        ...selectedProduct,
        cartId: Date.now(), 
        addons: selectedAddons,
        itemTotal: basePrice + addonsTotal,
        quantity: 1
      };
      setCart([...cart, finalItem]);
    }
    setSelectedProduct(null); 
  };

  const updateQuantity = (cartId, delta) => {
    let updatedCart = cart.map(item => {
      if (item.cartId === cartId) return { ...item, quantity: item.quantity + delta };
      return item;
    }).filter(item => item.quantity > 0); 
    setCart(updatedCart);
    if (updatedCart.length === 0) setIsCartOpen(false); 
  };

  const getProductTotalQty = (productId) => {
    return cart.filter(item => item._id === productId || item.id === productId).reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleMinusFromMenu = (productId) => {
    const index = [...cart].reverse().findIndex(item => item._id === productId || item.id === productId);
    if (index !== -1) {
      const actualIndex = cart.length - 1 - index;
      const targetCartId = cart[actualIndex].cartId;
      updateQuantity(targetCartId, -1);
    }
  };

  // Filter products for the menu display
  let displayProducts = products.filter(p => p.category && p.category.toLowerCase() === activeCategory.toLowerCase());
  if (activeSubCategory !== 'All') {
    displayProducts = displayProducts.filter(p => (p.subCategory && p.subCategory.toLowerCase() === activeSubCategory.toLowerCase()));
  }
  
  const currentCategoryData = dynamicCategories.find(c => c.main === activeCategory);

  // ==========================================
  // 1. SCREEN: TOUCH TO START
  // ==========================================
  if (activeScreen === 'IDLE') {
    return (
      <div onClick={() => setActiveScreen('HOME')} style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', backgroundColor: '#ffcc00', color: '#333' }}>
        <style>{uiStyles}</style>
        <h1 style={{ fontSize: '6rem', marginBottom: '10px', letterSpacing: '-2px' }}>RE:FILL CAFE</h1>
        <p style={{ fontSize: '2.5rem', animation: 'pulse 1.5s infinite', fontWeight: 'bold', color: '#555' }}>👇 Touch Anywhere to Start 👇</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f9f9f9', height: '100vh', overflow: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style>{uiStyles}</style>

      {/* ========================================== */}
      {/* 2. SCREEN: HOME (CATEGORIES GRID) */}
      {/* ========================================== */}
      {activeScreen === 'HOME' && (
        <div className="animated-grid" style={{ padding: '50px', boxSizing: 'border-box', height: '100%', overflowY: 'auto', paddingBottom: cart.length > 0 ? '120px' : '50px' }}>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h1 style={{ fontSize: '4rem', margin: 0, color: '#222', fontWeight: '800', letterSpacing: '-1px' }}>What are you craving?</h1>
            <p style={{ fontSize: '1.5rem', color: '#666', marginTop: '10px' }}>Tap a category to start your order</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '30px', maxWidth: '1200px', margin: '0 auto' }}>
            {dynamicCategories.length === 0 ? (
              <h3 style={{ textAlign: 'center', color: '#888', gridColumn: '1/-1' }}>Loading Menu...</h3>
            ) : (
              dynamicCategories.map(cat => (
                <div key={cat.main} className="product-card" onClick={() => { setActiveCategory(cat.main); setActiveSubCategory('All'); setActiveScreen('MENU'); }} style={{ height: '200px', borderRadius: '24px', overflow: 'hidden', position: 'relative', cursor: 'pointer', boxShadow: '0 8px 20px rgba(0,0,0,0.06)' }}>
                  <img src={cat.image} alt={cat.main} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', padding: '20px', background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', boxSizing: 'border-box' }}>
                    <h2 style={{ color: 'white', margin: 0, fontSize: '1.8rem', fontWeight: '700' }}>{cat.main}</h2>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 3. SCREEN: MENU (SIDEBAR + ITEMS) */}
      {/* ========================================== */}
      {activeScreen === 'MENU' && (
        <div style={{ display: 'flex', height: '100%', paddingBottom: cart.length > 0 ? '100px' : '0', boxSizing: 'border-box' }}>
          
          <div style={{ width: '280px', backgroundColor: 'white', borderRight: '1px solid #eaeaea', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
            <div style={{ padding: '25px 20px', borderBottom: '1px solid #eaeaea' }}>
              <button className="product-card" onClick={() => setActiveScreen('HOME')} style={{ width: '100%', padding: '15px', backgroundColor: '#f1f3f5', color: '#333', border: 'none', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                🏠 Go Home
              </button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 15px' }}>
              {dynamicCategories.map(cat => {
                const isActive = activeCategory === cat.main;
                return (
                  <div key={cat.main} className={`sidebar-btn ${isActive ? 'active' : ''}`} onClick={() => { setActiveCategory(cat.main); setActiveSubCategory('All'); }} style={{ display: 'flex', alignItems: 'center', padding: '12px', marginBottom: '12px', borderRadius: '18px', cursor: 'pointer', border: '1px solid #eee' }}>
                    <img src={cat.image} alt={cat.main} style={{ width: '45px', height: '45px', borderRadius: '12px', objectFit: 'cover' }} />
                    <span style={{ marginLeft: '15px', fontSize: '1.2rem', fontWeight: 'bold', color: isActive ? '#222' : '#555' }}>{cat.main}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#fcfcfc', display: 'flex', flexDirection: 'column' }}>
            
            {currentCategoryData && (
              <div key={activeCategory + '-banner'} className="fade-in" style={{ width: '100%', height: '240px', position: 'relative', flexShrink: 0 }}>
                <img src={currentCategoryData.image} alt={activeCategory} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.1) 100%)' }}></div>
                <h1 style={{ position: 'absolute', bottom: '25px', left: '40px', margin: 0, fontSize: '4rem', color: 'white', fontWeight: '900', letterSpacing: '-1px' }}>
                  {activeCategory.toUpperCase()}
                </h1>
              </div>
            )}

            <div style={{ padding: '40px' }}>
              {currentCategoryData && currentCategoryData.subs.length > 0 && (
                <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', marginBottom: '40px', paddingBottom: '10px' }}>
                  <div className="sub-cat-chip" onClick={() => setActiveSubCategory('All')} style={{ padding: '10px 25px', borderRadius: '30px', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold', backgroundColor: activeSubCategory === 'All' ? '#333' : 'white', color: activeSubCategory === 'All' ? 'white' : '#555', border: activeSubCategory === 'All' ? '2px solid #333' : '2px solid #eaeaea', boxShadow: activeSubCategory === 'All' ? '0 4px 10px rgba(0,0,0,0.1)' : 'none' }}>All</div>
                  {currentCategoryData.subs.map(sub => (
                    <div key={sub} className="sub-cat-chip" onClick={() => setActiveSubCategory(sub)} style={{ padding: '10px 25px', borderRadius: '30px', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold', backgroundColor: activeSubCategory === sub ? '#333' : 'white', color: activeSubCategory === sub ? 'white' : '#555', border: activeSubCategory === sub ? '2px solid #333' : '2px solid #eaeaea', boxShadow: activeSubCategory === sub ? '0 4px 10px rgba(0,0,0,0.1)' : 'none' }}>{sub}</div>
                  ))}
                </div>
              )}

              <div key={activeCategory + activeSubCategory} className="animated-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' }}>
                {displayProducts.length === 0 ? (
                  <p style={{ color: '#888', fontSize: '1.2rem', marginTop: '20px', gridColumn: '1 / -1' }}>No items found in this category yet.</p>
                ) : (
                  displayProducts.map(product => {
                    const qtyInCart = getProductTotalQty(product._id || product.id);
                    
                    return (
                      <div key={product._id || product.id} className="product-card" style={{ backgroundColor: 'white', borderRadius: '24px', padding: '15px', boxShadow: '0 6px 16px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column' }}>
                        <img src={product.image || "https://via.placeholder.com/150"} alt={product.name} style={{ width: '100%', height: '170px', objectFit: 'cover', borderRadius: '16px' }} />
                        <h3 style={{ margin: '15px 0 5px 0', color: '#222', fontSize: '1.2rem' }}>{product.name}</h3>
                        <p style={{ margin: '0 0 auto 0', color: '#777', fontSize: '0.9rem', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {product.description || "Freshly prepared and packed with flavors to satisfy your cravings."}
                        </p>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                          <span style={{ fontWeight: '800', fontSize: '1.3rem', color: '#222' }}>₹{product.price || 150}</span>
                          
                          {qtyInCart === 0 ? (
                            <button onClick={() => openAddonModal(product)} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px 22px', borderRadius: '30px', fontWeight: '800', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 4px 10px rgba(40, 167, 69, 0.2)' }}>
                              + ADD
                            </button>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#eefaf2', borderRadius: '30px', padding: '5px 8px', border: '2px solid #28a745' }}>
                              <button onClick={() => handleMinusFromMenu(product._id || product.id)} style={{ width: '30px', height: '30px', borderRadius: '50%', border: 'none', backgroundColor: '#28a745', color: 'white', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>-</button>
                              <span style={{ margin: '0 12px', fontWeight: '900', fontSize: '1.1rem', color: '#1e7e34' }}>{qtyInCart}</span>
                              <button onClick={() => openAddonModal(product)} style={{ width: '30px', height: '30px', borderRadius: '50%', border: 'none', backgroundColor: '#28a745', color: 'white', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>+</button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* OVERLAYS & GLOBAL STICKY CART */}
      {/* ========================================== */}

      {selectedProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
          <div style={{ width: '500px', backgroundColor: 'white', borderTopLeftRadius: '35px', borderTopRightRadius: '35px', padding: '40px', boxSizing: 'border-box', animation: 'slideUpFade 0.3s forwards' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#222' }}>Customize</h2>
              <button onClick={() => setSelectedProduct(null)} style={{ border: 'none', background: '#f1f3f5', borderRadius: '50%', width: '40px', height: '40px', fontSize: '1.5rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#555' }}>✕</button>
            </div>
            
            <h3 style={{ margin: '0 0 5px 0', color: '#333' }}>{selectedProduct.name}</h3>
            <h4 style={{ color: '#888', marginBottom: '20px', fontWeight: 'normal' }}>Add Extras (Optional)</h4>
            
            <div style={{ marginBottom: '35px', maxHeight: '250px', overflowY: 'auto' }}>
              {selectedProduct.addons && selectedProduct.addons.length > 0 ? (
                selectedProduct.addons.map(addon => {
                  const isSelected = selectedAddons.includes(addon);
                  return (
                    <div key={addon.name} onClick={() => toggleAddon(addon)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', border: `2px solid ${isSelected ? '#28a745' : '#eaeaea'}`, borderRadius: '16px', marginBottom: '12px', cursor: 'pointer', backgroundColor: isSelected ? '#f2fdf5' : 'white', transition: 'all 0.2s' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: isSelected ? '#1e7e34' : '#444' }}>{addon.name}</span>
                      <span style={{ color: isSelected ? '#1e7e34' : '#666', fontWeight: 'bold' }}>+₹{addon.price}</span>
                    </div>
                  );
                })
              ) : (
                <p style={{ color: '#888' }}>No extra add-ons available for this item.</p>
              )}
            </div>
            <button onClick={confirmAddToCart} className="product-card" style={{ width: '100%', padding: '22px', backgroundColor: '#ffcc00', color: '#222', border: 'none', borderRadius: '20px', fontSize: '1.3rem', cursor: 'pointer', fontWeight: '900', display: 'flex', justifyContent: 'space-between', paddingLeft: '30px', paddingRight: '30px' }}>
              <span>Add to Tray</span>
              <span>₹{(selectedProduct.price || 150) + selectedAddons.reduce((sum, a) => sum + a.price, 0)}</span>
            </button>
          </div>
        </div>
      )}

      {cart.length > 0 && !isCartOpen && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', boxShadow: '0 -10px 30px rgba(0,0,0,0.08)', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box', zIndex: 100, borderTop: '1px solid #eee' }}>
          <button onClick={handleRestart} style={{ padding: '15px 30px', backgroundColor: '#ffebe6', color: '#d9534f', border: 'none', borderRadius: '16px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', transition: 'background 0.2s' }}>Cancel Order</button>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '1.1rem', color: '#888', fontWeight: '500' }}>{totalItemsCount} items added</span>
            <h2 style={{ margin: '2px 0 0 0', fontSize: '2.2rem', color: '#222', fontWeight: '900' }}>₹{totalAmount}</h2>
          </div>
          <button onClick={() => setIsCartOpen(true)} className="product-card" style={{ padding: '15px 40px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '16px', cursor: 'pointer', fontWeight: '800', fontSize: '1.3rem', boxShadow: '0 5px 15px rgba(40,167,69,0.3)' }}>View Tray ➔</button>
        </div>
      )}

      {isCartOpen && (
        <div style={{ position: 'fixed', top: 0, right: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', zIndex: 999, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '450px', backgroundColor: 'white', padding: '30px', display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 40px rgba(0,0,0,0.15)', animation: 'popIn 0.3s forwards', transformOrigin: 'right center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h1 style={{ margin: 0, fontSize: '2.2rem', color: '#222' }}>🛒 Your Tray</h1>
              <button onClick={() => setIsCartOpen(false)} style={{ border: 'none', background: '#f1f3f5', borderRadius: '50%', width: '45px', height: '45px', fontSize: '1.5rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#555' }}>✕</button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px', paddingRight: '10px' }}>
              {cart.map((item) => (
                <div key={item.cartId} style={{ padding: '20px 0', borderBottom: '1px solid #eaeaea' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#333' }}>{item.name}</span>
                      {item.addons && item.addons.length > 0 && (
                        <div style={{ color: '#888', fontSize: '0.9rem', marginTop: '4px' }}>
                          + {item.addons.map(a => a.name).join(', ')}
                        </div>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#222', marginBottom: '10px' }}>
                        ₹{item.itemTotal * item.quantity}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f1f3f5', borderRadius: '30px', padding: '5px' }}>
                        <button className="qty-btn" onClick={() => updateQuantity(item.cartId, -1)}>-</button>
                        <span style={{ margin: '0 15px', fontWeight: '900', fontSize: '1.2rem', color: '#333' }}>{item.quantity}</span>
                        <button className="qty-btn" onClick={() => updateQuantity(item.cartId, 1)}>+</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '2px solid #eaeaea', paddingTop: '30px' }}>
              <h2 style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', fontSize: '1.8rem', color: '#222' }}><span>Total:</span> <span>₹{totalAmount}</span></h2>
              <input type="text" placeholder="Enter Your Name to Order" value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={{ width: '100%', padding: '22px', marginBottom: '20px', borderRadius: '16px', border: '2px solid #ddd', fontSize: '1.2rem', boxSizing: 'border-box', backgroundColor: '#f9f9f9', fontWeight: 'bold' }} />
              <button onClick={handlePlaceOrder} className="product-card" style={{ width: '100%', padding: '25px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '16px', fontSize: '1.4rem', cursor: 'pointer', fontWeight: '900', boxShadow: '0 5px 20px rgba(40,167,69,0.3)' }}>CONFIRM ORDER 🚀</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPage;
