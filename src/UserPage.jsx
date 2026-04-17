import React, { useState, useEffect } from 'react';

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
      title: "Signature Burger",
      desc: "Freshly made with our secret sauce."
    },
    { 
      url: "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=800", 
      title: "Iced Coffee",
      desc: "Cold-brewed for 12 hours with organic beans."
    },
    { 
      url: "https://images.pexels.com/photos/825661/pexels-photo-825661.jpeg?auto=compress&cs=tinysrgb&w=800", 
      title: "Crispy Pizza",
      desc: "Wood-fired to perfection."
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
      <div className="welcome-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '20px', background: '#f8f9fa' }}>
        <div className="welcome-card" style={{ maxWidth: '600px', width: '100%', textAlign: 'center', padding: '40px', background: 'white', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          <h1 style={{ fontSize: '4rem', marginBottom: '10px' }}>👨‍🍳</h1>
          <h1 style={{ color: '#2d3436', marginBottom: '15px', fontSize: '2.5rem' }}>Order Accepted!</h1>
          <p style={{ fontSize: '1.2rem', color: '#636e72', lineHeight: '1.6', marginBottom: '10px' }}>
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
          <button className="btn-checkout" onClick={handleNewOrder} style={{ padding: '18px 40px', fontSize: '1.1rem', borderRadius: '12px' }}>
            Place Another Order
          </button>
        </div>
      </div>
    );
  }

  if (!isNameEntered) {
    // ---------------------------------------------------------
    // CHANGE YOUR BACKGROUND IMAGE LINK HERE
    // ---------------------------------------------------------
    const bgImageUrl = "https://images.pexels.com/photos/320556/pexels-photo-320556.jpeg?auto=compress&cs=tinysrgb&w=1920";

    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh', 
        overflow: 'hidden', 
        // Gradient overlay + Your Image
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.85)), url("${bgImageUrl}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
        {popup.show && (
          <div style={{ position: 'fixed', top: '15px', left: '50%', transform: 'translateX(-50%)', background: '#d63031', color: 'white', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', zIndex: 1000 }}>
            {popup.message}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '20px' }}>
          
          <div style={{ position: 'relative', width: '100%', maxWidth: '650px', height: '320px', borderRadius: '24px', overflow: 'hidden', marginBottom: '25px', boxShadow: '0 12px 30px rgba(0,0,0,0.15)' }}>
            {slides.map((s, i) => (
              <img key={i} src={s.url} alt="Menu item" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: i === currentSlide ? 1 : 0, transition: 'opacity 0.8s ease-in-out' }} />
            ))}
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', color: 'white', padding: '15px', textAlign: 'center', fontWeight: '700', fontSize: '1.2rem' }}>
              {slides[currentSlide].title}
            </div>
          </div>

          <h1 style={{ fontSize: '2.5rem', color: '#2d3436', marginBottom: '5px', fontWeight: '800' }}>Welcome! 🍔</h1>
          <p style={{ color: '#636e72', fontSize: '1.1rem', marginBottom: '25px', textAlign: 'center', fontWeight: '500' }}>Enter your name to browse our delicious menu.</p>
          
          <form onSubmit={handleStartOrdering} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', width: '100%' }}>
            <input 
              placeholder="Your Name..." 
              value={customerName} 
              onChange={e => setCustomerName(e.target.value)} 
              autoFocus 
              style={{ width: '100%', maxWidth: '400px', padding: '15px 20px', border: '2px solid #dfe6e9', borderRadius: '12px', fontSize: '1.1rem', outline: 'none', background: 'white', textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }} 
            />
            <button 
              type="submit" 
              style={{ width: '100%', maxWidth: '400px', padding: '15px', background: '#ff793f', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', transition: '0.3s', boxShadow: '0 4px 15px rgba(255, 121, 63, 0.3)' }}
            >
              Start Ordering
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- 3. MAIN MENU VIEW (SPLIT LAYOUT) ---
  return (
    <div className="split-layout">
      {popup.show && (
        <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', background: popup.type === 'error' ? '#d63031' : '#00b894', color: 'white', padding: '15px 30px', borderRadius: '8px', zIndex: 1000, fontWeight: 'bold' }}>{popup.message}</div>
      )}

      <div className="menu-section" style={{ flex: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.8rem' }}>Welcome, {customerName}! 👋</h2>
            <button onClick={() => setIsNameEntered(false)} style={{ background: 'none', border: 'none', color: '#ff793f', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
              Change Name
            </button>
        </div>

        <div className="category-section">
          {categories.map(category => (
            <button key={category} className={`category-badge ${activeCategory === category ? 'active' : ''}`} onClick={() => setActiveCategory(category)}>
              {category}
            </button>
          ))}
        </div>

        <div className="menu-grid">
          {menuItems.filter(i => activeCategory === "All" || i.category === activeCategory).map(item => {
            const qty = getItemQty(item.id);
            return (
              <div key={item.id} className="menu-card">
                <img src={item.image} alt={item.name} className="menu-image" />
                <div className="menu-info" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
                  <strong style={{ display: 'block', marginBottom: '15px', textAlign: 'center' }}>{item.name}</strong>
                  {qty === 0 ? (
                    <button className="btn-add" onClick={() => addToCart(item)} style={{ width: '100%', padding: '10px', borderRadius: '8px' }}>+ Add</button>
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

      <div className="tray-section" style={{ flex: 1, minWidth: '320px' }}>
        <div className="cart-card">
          <h2 style={{ marginBottom: '15px' }}>Your Tray</h2>
          <div style={{ maxHeight: '450px', overflowY: 'auto', marginBottom: '20px' }}>
            {cart.length === 0 ? (
              <p style={{ color: '#636e72', textAlign: 'center', marginTop: '20px' }}>Your tray is empty. <br/> Add some treats! 🍟</p>
            ) : null}
            {cart.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f2f6' }}>
                <span style={{ fontSize: '0.95rem', flex: 1, paddingRight: '10px' }}>{item.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button onClick={() => decrementQty(item.id)} style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: '#ffeaa7', color: '#d35400', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>-</button>
                  <strong style={{ fontSize: '1rem', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</strong>
                  <button onClick={() => incrementQty(item.id)} style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: '#e8f8f5', color: '#27ae60', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>+</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '2px solid #f1f2f6', paddingTop: '15px' }}>
            <button className="btn-checkout" onClick={placeOrder}>Send Order to Kitchen</button>
          </div>
        </div>
      </div>
    </div>
  );
}