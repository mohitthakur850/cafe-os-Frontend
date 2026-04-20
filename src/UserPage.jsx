import React, { useState, useEffect } from 'react';
import './UserPage.css';

const RefillLogo = () => (
  <svg width="160" height="50" viewBox="0 0 220 70" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <text y="48" fontFamily="'Arial Black', Arial, Helvetica, sans-serif" fontSize="38" fontWeight="900" fill="#7A776D">
      <tspan x="40">R</tspan><tspan x="68">E</tspan><tspan x="94">:</tspan><tspan x="120">F</tspan><tspan x="144">I</tspan><tspan x="156">L</tspan><tspan x="178">L</tspan>
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
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const slides = [
    { url: "https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=800", title: "Signature Burger" },
    { url: "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=800", title: "Iced Coffee" },
    { url: "https://images.pexels.com/photos/825661/pexels-photo-825661.jpeg?auto=compress&cs=tinysrgb&w=800", title: "Crispy Pizza" }
  ];

  useEffect(() => {
    fetch('https://cafe-os-backend.onrender.com/products')
      .then(res => res.json())
      .then(data => setMenuItems(data));
  }, []);

  useEffect(() => {
    if (!isNameEntered && !isOrderSuccess) {
      const slideTimer = setInterval(() => setCurrentSlide(s => (s === slides.length - 1 ? 0 : s + 1)), 3000);
      return () => clearInterval(slideTimer);
    }
  }, [isNameEntered, isOrderSuccess, slides.length]); 

  const categories = ["All", ...new Set(menuItems.map(item => item.category))];

  const addToCart = (item) => setCart([...cart, { ...item, quantity: 1 }]);
  const incrementQty = (id) => setCart(cart.map(item => item.id === id ? { ...item, quantity: item.quantity + 1 } : item));
  const decrementQty = (id) => setCart(cart.map(item => item.id === id ? { ...item, quantity: item.quantity - 1 } : item).filter(item => item.quantity > 0)); 
  const getItemQty = (id) => { const foundItem = cart.find(item => item.id === id); return foundItem ? foundItem.quantity : 0; };

  const showPopup = (message, type) => {
    setPopup({ show: true, message, type });
    setTimeout(() => setPopup({ show: false, message: "", type: "" }), 3000);
  };

  const handleStartOrdering = (e) => {
    e.preventDefault();
    if (customerName.trim().length < 2) return showPopup("Please enter a valid name! 👤", "error");
    setIsNameEntered(true);
  };

  const placeOrder = async () => {
    if (cart.length === 0) return showPopup("Your tray is empty! 🍔", "error");
    const res = await fetch('https://cafe-os-backend.onrender.com/orders', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customer_name: customerName, items: cart, total: 0 }) 
    });
    const data = await res.json();
    setOrderId(data.id); setCart([]); setIsOrderSuccess(true);
  };

  const handleNewOrder = () => { setIsOrderSuccess(false); setOrderId(null); setIsNameEntered(false); setCustomerName(""); setActiveCategory("All"); setCurrentSlide(0); };

  if (isOrderSuccess) {
    return (
      <div className="success-screen">
        <div className="success-card">
          <h1 className="success-emoji">👨‍🍳</h1>
          <h1 className="success-title">Order Accepted!</h1>
          <p className="success-desc">Hang tight, <strong>{customerName}</strong>! <br/>Our chef is currently preparing your order.</p>
          <div className="success-order-box">
            <span className="success-order-label">Your Order ID:</span>
            <h2 className="success-order-val">#{orderId}</h2>
          </div>
          <p className="success-instruction">Check Order ID on the TV Screen to collect!</p>
          <button onClick={handleNewOrder} className="btn-place-another">Place Another Order</button>
        </div>
      </div>
    );
  }

  if (!isNameEntered) {
    const bgImageUrl = "https://images.pexels.com/photos/320556/pexels-photo-320556.jpeg?auto=compress&cs=tinysrgb&w=1920";
    return (
      <div className="welcome-screen" style={{ backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.85)), url("${bgImageUrl}")` }}>
        {popup.show && <div className="popup-alert" style={{ background: '#d63031' }}>{popup.message}</div>}

        <div className="welcome-header-bar">
          <div className="logo-container"><RefillLogo /></div>
          <div className="time-tracker-box">
            <span className="time-date-text">{currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            <span className="time-clock-text">{currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        <div className="welcome-body">
          <div className="slider-box">
            {slides.map((s, i) => (
              <img key={i} src={s.url} alt="Menu item" className="slider-image" style={{ opacity: i === currentSlide ? 1 : 0 }} />
            ))}
            <div className="slider-caption">{slides[currentSlide].title}</div>
          </div>

          <div className="welcome-text-area">
            <h1 className="welcome-main-title">Welcome! 🍔</h1>
            <p className="welcome-sub-title">Enter your name to browse our menu.</p>
          </div>
          
          <form onSubmit={handleStartOrdering} className="welcome-form-box">
            <input placeholder="Your Name..." value={customerName} onChange={e => setCustomerName(e.target.value)} autoFocus className="welcome-name-input" />
            <button type="submit" className="btn-start-order">Start Ordering</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="user-container">
      <div className="split-layout-base">
        
        {popup.show && <div className="popup-alert" style={{ background: popup.type === 'error' ? '#d63031' : '#00b894' }}>{popup.message}</div>}

        <div className="left-section">
          <div className="top-header-bar">
              <div className="logo-container"><RefillLogo /></div>
              <div className="user-greeting-box">
                <h2 className="user-greeting-text">Hi, {customerName}! 👋</h2>
                <button onClick={() => setIsNameEntered(false)} className="btn-change-user">Change</button>
              </div>
          </div>

          <div className="menu-content-wrapper">
            <div className="categories-sidebar hide-scroll">
              <h3 className="categories-title">Categories</h3>
              {categories.map(category => (
                <button key={category} onClick={() => setActiveCategory(category)} className="category-btn" style={{
                    border: activeCategory === category ? 'none' : '1px solid #ddd', 
                    background: activeCategory === category ? '#ff793f' : 'white', 
                    color: activeCategory === category ? 'white' : '#2d3436',
                    fontWeight: activeCategory === category ? 'bold' : 'normal',
                    boxShadow: activeCategory === category ? '0 4px 10px rgba(255,121,63,0.2)' : 'none'
                  }}>
                  {category}
                </button>
              ))}
            </div>

            <div className="menu-grid">
              {menuItems.filter(i => activeCategory === "All" || i.category === activeCategory).map(item => {
                const qty = getItemQty(item.id);
                return (
                  <div key={item.id} className="menu-card">
                    <img src={item.image} alt={item.name} className="menu-card-img" />
                    <div className="menu-card-body">
                      <strong className="menu-card-title">{item.name}</strong>
                      {qty === 0 ? (
                        <button onClick={() => addToCart(item)} className="btn-add-primary">+ Add</button>
                      ) : (
                        <div className="qty-control-bar">
                          <button onClick={() => decrementQty(item.id)} className="btn-qty btn-dec">-</button>
                          <strong className="qty-text">{qty}</strong>
                          <button onClick={() => incrementQty(item.id)} className="btn-qty btn-inc">+</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="cart-section">
          <div className="cart-box">
            <h2 className="cart-title">Your Tray {cart.length > 0 && `(${cart.length})`}</h2>
            <div className="cart-items-scroll hide-scroll">
              {cart.length === 0 ? (
                <p className="cart-empty-text">Tray is empty 🍟</p>
              ) : null}
              {cart.map((item) => (
                <div key={item.id} className="cart-item-row">
                  <span className="cart-item-name">{item.name}</span>
                  <div className="cart-item-controls">
                    <button onClick={() => decrementQty(item.id)} className="cart-qty-btn" style={{ background: '#ffeaa7', color: '#d35400' }}>-</button>
                    <strong className="cart-qty-val">{item.quantity}</strong>
                    <button onClick={() => incrementQty(item.id)} className="cart-qty-btn" style={{ background: '#e8f8f5', color: '#27ae60' }}>+</button>
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="cart-footer">
                <button onClick={placeOrder} className="btn-place-order">Place Order</button>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}