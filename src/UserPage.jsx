import React, { useState, useEffect } from 'react';

// --- PIXEL-PERFECT RE:FILL LOGO ---
const RefillLogo = () => (
  <svg width="160" height="50" viewBox="0 0 220 70" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <text y="48" fontFamily="'Arial Black', Arial, Helvetica, sans-serif" fontSize="38" fontWeight="900" fill="#7A776D">
      <tspan x="40">R</tspan>
      <tspan x="68">E</tspan>
      <tspan x="94">:</tspan>
      <tspan x="120">F</tspan>
      <tspan x="144">I</tspan>
      <tspan x="156">L</tspan>
      <tspan x="178">L</tspan>
    </text>
    <path d="M 68 14 L 102 14 A 10 10 0 0 1 112 24 L 112 40" stroke="#36707E" strokeWidth="4.5" strokeLinecap="round" fill="none" />
    <path d="M 104 56 L 32 56 A 10 10 0 0 1 22 46 L 22 28" stroke="#36707E" strokeWidth="4.5" strokeLinecap="round" fill="none" />
  </svg>
);

export default function UserPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [isNameEntered, setIsNameEntered] = useState(false);
  const [isOrderSuccess, setIsOrderSuccess] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [popup, setPopup] = useState({ show: false, message: "", type: "" });
  const [orderId, setOrderId] = useState(null);

  const slides = [
    { 
      url: "https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=800", 
      title: "Signature Burger"
    },
    { 
      url: "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=800", 
      title: "Iced Coffee"
    },
    { 
      url: "https://images.pexels.com/photos/825661/pexels-photo-825661.jpeg?auto=compress&cs=tinysrgb&w=800", 
      title: "Crispy Pizza"
    }
  ];

  useEffect(() => {
    fetch('https://cafe-os-backend.onrender.com/products')
      .then(res => res.json())
      .then(data => setMenuItems(data));
  }, []);

  useEffect(() => {
    if (!isNameEntered && !isOrderSuccess) {
      const timer = setInterval(() => {
        setCurrentSlide(s => (s === slides.length - 1 ? 0 : s + 1));
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [isNameEntered, isOrderSuccess, slides.length]); 

  const categories = ["All", ...new Set(menuItems.map(item => item.category))];

  const addToCart = (item) => setCart([...cart, { ...item, quantity: 1 }]);

  const incrementQty = (id) => {
    setCart(cart.map(item => item.id === id ? { ...item, quantity: item.quantity + 1 } : item));
  };

  const decrementQty = (id) => {
    setCart(cart.map(item => {
      if (item.id === id) return { ...item, quantity: item.quantity - 1 };
      return item;
    }).filter(item => item.quantity > 0)); 
  };

  const getItemQty = (id) => {
    const foundItem = cart.find(item => item.id === id);
    return foundItem ? foundItem.quantity : 0;
  };

  const showPopup = (message, type) => {
    setPopup({ show: true, message, type });
    setTimeout(() => setPopup({ show: false, message: "", type: "" }), 3000);
  };

  const handleStartOrdering = (e) => {
    e.preventDefault();
    if (customerName.trim().length < 2) {
      return showPopup("Please enter a valid name! 👤", "error");
    }
    setIsNameEntered(true);
  };

  const placeOrder = async () => {
    if (cart.length === 0) return showPopup("Your tray is empty! 🍔", "error");
    
    const res = await fetch('https://cafe-os-backend.onrender.com/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_name: customerName, items: cart, total: 0 }) 
    });
    
    const data = await res.json();
    setOrderId(data.id);
    setCart([]);
    setIsOrderSuccess(true);
  };

  const handleNewOrder = () => {
    setIsOrderSuccess(false);
    setOrderId(null);
    setIsNameEntered(false);
    setCustomerName("");
    setActiveCategory("All");
    setCurrentSlide(0); 
  };

  if (isOrderSuccess) {
    return (
      <div className="welcome-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px', background: '#f8f9fa' }}>
        <div className="welcome-card" style={{ maxWidth: '600px', width: '100%', textAlign: 'center', padding: '40px 20px', background: 'white', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', boxSizing: 'border-box' }}>
          <h1 style={{ fontSize: '4rem', marginBottom: '10px' }}>👨‍🍳</h1>
          <h1 style={{ color: '#2d3436', marginBottom: '15px', fontSize: 'clamp(2rem, 5vw, 2.5rem)' }}>Order Accepted!</h1>
          <p style={{ fontSize: '1.1rem', color: '#636e72', lineHeight: '1.6', marginBottom: '10px' }}>
            Hang tight, <strong>{customerName}</strong>! <br/>
            Our chef is currently in a "deep meditation" with your order.
          </p>
          <div style={{ border: '2px dashed #ff793f', borderRadius: '15px', padding: '15px 30px', margin: '20px auto', display: 'inline-block' }}>
            <span style={{ fontSize: '1rem', color: '#636e72', fontWeight: 'bold' }}>Your Order ID:</span>
            <h2 style={{ fontSize: '2.8rem', color: '#ff793f', margin: '5px 0' }}>#{orderId}</h2>
          </div>
          <p style={{ color: '#ff793f', fontWeight: 'bold', marginBottom: '30px', fontSize: '1.1rem' }}>
            Check Order ID on the TV Screen to collect!
          </p>
          <button className="btn-checkout" onClick={handleNewOrder} style={{ padding: '15px 30px', fontSize: '1.1rem', borderRadius: '12px', background: '#ff793f', color: 'white', border: 'none', cursor: 'pointer', width: '100%', maxWidth: '300px' }}>
            Place Another Order
          </button>
        </div>
      </div>
    );
  }

  // --- WELCOME VIEW (FIXED SLIDER & TASKBAR CUTOFF) ---
  if (!isNameEntered) {
    const bgImageUrl = "https://images.pexels.com/photos/320556/pexels-photo-320556.jpeg?auto=compress&cs=tinysrgb&w=1920";

    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh',
        overflowY: 'auto', // Fix: Allows scrolling if screen is too small, prevents cutoff
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.85)), url("${bgImageUrl}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        fontFamily: 'sans-serif'
      }}>
        {popup.show && (
          <div style={{ position: 'fixed', top: '15px', left: '50%', transform: 'translateX(-50%)', background: '#d63031', color: 'white', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', zIndex: 1000 }}>
            {popup.message}
          </div>
        )}

        <div style={{ width: '100%', padding: '10px 20px', display: 'flex', alignItems: 'center', boxSizing: 'border-box' }}>
          <RefillLogo />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '10px 20px', gap: '15px', boxSizing: 'border-box' }}>
          
          <div style={{ 
            position: 'relative', 
            width: '100%', 
            maxWidth: '500px', // Shrinked width to keep it compact
            maxHeight: '35vh', // Strictly limits height so button stays above taskbar
            aspectRatio: '16/9', // Standard ratio, no longer horizontal/squished
            borderRadius: '24px', 
            overflow: 'hidden', 
            boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
            flexShrink: 1
          }}>
            {slides.map((s, i) => (
              <img key={i} src={s.url} alt="Menu item" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: i === currentSlide ? 1 : 0, transition: 'opacity 0.8s ease-in-out' }} />
            ))}
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', color: 'white', padding: '12px', textAlign: 'center', fontWeight: '700', fontSize: '1.1rem' }}>
              {slides[currentSlide].title}
            </div>
          </div>

          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', color: '#2d3436', margin: '0', fontWeight: '800' }}>Welcome! 🍔</h1>
            <p style={{ color: '#636e72', fontSize: '0.95rem', margin: '5px 0 10px 0', fontWeight: '500' }}>Enter your name to browse our delicious menu.</p>
          </div>
          
          <form onSubmit={handleStartOrdering} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '100%', maxWidth: '320px', flexShrink: 0, paddingBottom: '20px' }}>
            <input 
              placeholder="Your Name..." 
              value={customerName} 
              onChange={e => setCustomerName(e.target.value)} 
              autoFocus 
              style={{ width: '100%', padding: '12px 15px', border: '2px solid #dfe6e9', borderRadius: '12px', fontSize: '1rem', outline: 'none', background: 'white', textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', boxSizing: 'border-box' }} 
            />
            <button 
              type="submit" 
              style={{ width: '100%', padding: '12px', background: '#ff793f', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', transition: '0.3s', boxShadow: '0 4px 15px rgba(255, 121, 63, 0.3)' }}
            >
              Start Ordering
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- MAIN MENU VIEW ---
  return (
    <div className="split-layout" style={{ 
      display: 'flex', 
      flexDirection: window.innerWidth < 800 ? 'column' : 'row', 
      padding: '20px', 
      gap: '20px', 
      maxWidth: '1400px', 
      margin: '0 auto',
      minHeight: '100vh',
      boxSizing: 'border-box',
      fontFamily: 'sans-serif'
    }}>
      {popup.show && (
        <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', background: popup.type === 'error' ? '#d63031' : '#00b894', color: 'white', padding: '15px 30px', borderRadius: '8px', zIndex: 1000, fontWeight: 'bold', width: 'max-content', maxWidth: '90%', textAlign: 'center' }}>{popup.message}</div>
      )}

      <div style={{ flex: 2, display: 'flex', flexDirection: 'column', width: '100%' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px', paddingBottom: '15px', borderBottom: '2px solid #f1f2f6' }}>
            <RefillLogo />
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <h2 style={{ fontSize: 'clamp(1.1rem, 3vw, 1.3rem)', margin: 0, color: '#636e72', fontWeight: '600' }}>Hi, {customerName}! 👋</h2>
              <button onClick={() => setIsNameEntered(false)} style={{ background: '#fdfcfb', border: '1px solid #ddd', color: '#ff793f', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', padding: '8px 16px', borderRadius: '10px' }}>
                Change Name
              </button>
            </div>
        </div>

        <div style={{ display: 'flex', flexDirection: window.innerWidth < 800 ? 'column' : 'row', gap: '20px', alignItems: 'flex-start' }}>
          
          <div className="category-section" style={{ 
            display: 'flex', 
            flexDirection: window.innerWidth < 800 ? 'row' : 'column', 
            gap: '10px', 
            width: window.innerWidth < 800 ? '100%' : '140px',
            minWidth: window.innerWidth < 800 ? 'auto' : '140px',
            overflowX: window.innerWidth < 800 ? 'auto' : 'visible', 
            paddingBottom: window.innerWidth < 800 ? '10px' : '0', 
            position: window.innerWidth < 800 ? 'relative' : 'sticky',
            top: '20px',
            WebkitOverflowScrolling: 'touch' 
          }}>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '1rem', color: '#636e72', display: window.innerWidth < 800 ? 'none' : 'block' }}>Categories</h3>
            {categories.map(category => (
              <button 
                key={category} 
                onClick={() => setActiveCategory(category)}
                style={{
                  padding: '10px 15px', 
                  borderRadius: '12px', 
                  border: activeCategory === category ? 'none' : '1px solid #ddd', 
                  background: activeCategory === category ? '#ff793f' : 'white', 
                  color: activeCategory === category ? 'white' : 'black',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  fontWeight: activeCategory === category ? 'bold' : 'normal',
                  textAlign: window.innerWidth < 800 ? 'center' : 'left',
                  width: '100%',
                  transition: 'all 0.2s ease'
                }}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="menu-grid" style={{ 
            flex: 1, 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', 
            gap: '15px',
            width: '100%'
          }}>
            {menuItems.filter(i => activeCategory === "All" || i.category === activeCategory).map(item => {
              const qty = getItemQty(item.id);
              return (
                <div key={item.id} className="menu-card" style={{ background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                  <img src={item.image} alt={item.name} className="menu-image" style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                  <div className="menu-info" style={{ padding: '15px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
                    <strong style={{ display: 'block', marginBottom: '15px', textAlign: 'center', fontSize: '1rem' }}>{item.name}</strong>
                    {qty === 0 ? (
                      <button className="btn-add" onClick={() => addToCart(item)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', background: '#f1f2f6', fontWeight: 'bold', cursor: 'pointer' }}>+ Add</button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8f9fa', borderRadius: '8px', padding: '5px 10px', border: '1px solid #dfe6e9' }}>
                        <button onClick={() => decrementQty(item.id)} style={{ width: '30px', height: '30px', borderRadius: '6px', border: 'none', background: '#ffeaa7', color: '#d35400', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>-</button>
                        <strong style={{ fontSize: '1.1rem' }}>{qty}</strong>
                        <button onClick={() => incrementQty(item.id)} style={{ width: '30px', height: '30px', borderRadius: '6px', border: 'none', background: '#e8f8f5', color: '#27ae60', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>+</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="tray-section" style={{ 
        flex: 1, 
        width: window.innerWidth < 800 ? '100%' : '350px',
        maxWidth: window.innerWidth < 800 ? '100%' : '400px'
      }}>
        <div className="cart-card" style={{ background: 'white', padding: '25px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', position: window.innerWidth < 800 ? 'relative' : 'sticky', top: '20px' }}>
          <h2 style={{ marginBottom: '15px', margin: 0 }}>Your Tray</h2>
          <div style={{ maxHeight: window.innerWidth < 800 ? 'auto' : '450px', overflowY: window.innerWidth < 800 ? 'visible' : 'auto', marginBottom: '20px', minHeight: '100px' }}>
            {cart.length === 0 ? (
              <p style={{ color: '#636e72', textAlign: 'center', marginTop: '20px' }}>Your tray is empty. <br/> Add some treats! 🍟</p>
            ) : null}
            {cart.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f2f6' }}>
                <span style={{ fontSize: '0.95rem', flex: 1, paddingRight: '10px' }}>{item.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={() => decrementQty(item.id)} style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: '#ffeaa7', color: '#d35400', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>-</button>
                  <strong style={{ fontSize: '1rem', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</strong>
                  <button onClick={() => incrementQty(item.id)} style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: '#e8f8f5', color: '#27ae60', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>+</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '2px solid #f1f2f6', paddingTop: '15px' }}>
            <button 
              className="btn-checkout" 
              onClick={placeOrder}
              style={{ width: '100%', padding: '18px', background: '#ff793f', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 5px 15px rgba(255, 121, 63, 0.3)' }}
            >
              Place Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
