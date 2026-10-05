import React, { useState, useEffect } from 'react';
import vitLogo from './assets/vit-logo.png';
import './App.css';

interface User {
  regNo: string;
  email: string;
  password: string;
  phone: string;
}

interface ChatMessage {
  sender: string;
  text: string;
  timestamp: string;
}

interface Item {
  id: number;
  type: 'Lost' | 'Found';
  category: string;
  name: string;
  location: string;
  description: string;
  imageUrl?: string;
  ownerRegNo: string;
  date: string;
  securityQuestion?: string;
}

interface Notification {
  id: number;
  targetRegNo: string;
  senderRegNo: string;
  senderContact: string;
  itemId: number;
  itemName: string;
  itemImage?: string;
  status: 'Pending' | 'Accepted' | 'Declined';
  securityAnswer?: string;
  messages?: ChatMessage[];
  senderResolved?: boolean;
  targetResolved?: boolean;
}

const ACADEMIC_BLOCKS = ['SJT', 'TT', 'PRP', 'SMV', 'MB', 'GDN', 'CDMM'];
const MENS_HOSTELS = ['MH-A', 'MH-B', 'MH-C', 'MH-D', 'MH-E', 'MH-F', 'MH-G', 'MH-H', 'MH-J', 'MH-K', 'MH-L', 'MH-M', 'MH-N', 'MH-P', 'MH-Q', 'MH-R', 'MH-S', 'MH-T'];
const WOMENS_HOSTELS = ['LH-A', 'LH-B', 'LH-C', 'LH-D', 'LH-E', 'LH-F', 'LH-G', 'LH-H', 'LH-J'];
const FOOD_COURTS = ['Gazebo', 'Food Mall', 'DC'];
const OTHERS = ['Central Library', 'Sports Complex'];

const CATEGORIES = ['ID Cards', 'Room Keys', 'Calculators', 'Lab Equipment', 'Earphones', 'Wallets', 'Other'];

export default function App() {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('vtop_users_db');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('vtop_active_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'campus_feed' | 'my_listings' | 'match_center'>('campus_feed');
  const [feedMode, setFeedMode] = useState<'Lost' | 'Found'>('Lost');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [authForm, setAuthForm] = useState({
    regNo: '',
    email: '',
    password: '',
    phone: ''
  });

  const [items, setItems] = useState<Item[]>(() => {
    const saved = localStorage.getItem('vtop_items_clean');
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('vtop_notifications_v2');
    return saved ? JSON.parse(saved) : [];
  });

  const [search, setSearch] = useState('');
  
  const [activeMatchItem, setActiveMatchItem] = useState<Item | null>(null);
  const [matchAnswer, setMatchAnswer] = useState(''); 
  const [chatInputs, setChatInputs] = useState<Record<number, string>>({});

  const [formData, setFormData] = useState({
    type: 'Lost' as 'Lost' | 'Found',
    category: '',
    name: '',
    location: '',
    description: '',
    imageUrl: '',
    securityQuestion: ''
  });

  useEffect(() => {
    localStorage.setItem('vtop_users_db', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('vtop_active_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('vtop_items_clean', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('vtop_notifications_v2', JSON.stringify(notifications));
  }, [notifications]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanReg = authForm.regNo.trim().toUpperCase();

    if (authMode === 'signup') {
      if (!authForm.email.endsWith('@vitstudent.ac.in')) {
        alert('Please use a valid VIT student email address (@vitstudent.ac.in)');
        return;
      }
      if (users.some(u => u.regNo === cleanReg)) {
        alert('An account with this Registration Number already exists.');
        return;
      }

      const newUser: User = {
        regNo: cleanReg,
        email: authForm.email.trim(),
        password: authForm.password,
        phone: authForm.phone.trim()
      };

      setUsers([...users, newUser]);
      setCurrentUser(newUser);
    } else {
      const existingUser = users.find(u => u.regNo === cleanReg && u.password === authForm.password);
      if (!existingUser) {
        alert('Invalid Username / Registration Number or Password!');
        return;
      }
      setCurrentUser(existingUser);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('vtop_active_user');
  };

  const handlePostItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (formData.type === 'Found' && formData.securityQuestion.trim() === '') {
      alert("Found items MUST have a Verification Challenge to verify the true owner.");
      return;
    }

    const newItem: Item = {
      id: Date.now(),
      type: formData.type,
      category: formData.category,
      name: formData.name,
      location: formData.location,
      description: formData.description,
      imageUrl: formData.imageUrl,
      ownerRegNo: currentUser.regNo,
      date: new Date().toISOString().split('T')[0],
      securityQuestion: formData.type === 'Found' ? formData.securityQuestion : undefined
    };

    setItems([newItem, ...items]);
    setFormData({ type: 'Lost', category: '', name: '', location: '', description: '', imageUrl: '', securityQuestion: '' });
    alert('Listing published successfully!');
  };

  const handleDeleteItem = (itemId: number) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      setItems(items.filter(i => i.id !== itemId));
      setNotifications(notifications.filter(n => n.itemId !== itemId));
    }
  };

  const handleSendMatchRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMatchItem || !currentUser) return;

    if (activeMatchItem.securityQuestion && matchAnswer.trim() === '') {
      alert("Please answer the claim verification challenge.");
      return;
    }

    const userAlreadyRequested = notifications.some(
      n => n.itemId === activeMatchItem.id && n.senderRegNo === currentUser.regNo && n.status !== 'Declined'
    );

    if (userAlreadyRequested) {
      alert('You have already sent a claim request for this item!');
      setActiveMatchItem(null);
      return;
    }

    const newNotif: Notification = {
      id: Date.now(),
      targetRegNo: activeMatchItem.ownerRegNo,
      senderRegNo: currentUser.regNo,
      senderContact: `Phone: ${currentUser.phone} | Email: ${currentUser.email}`,
      itemId: activeMatchItem.id,
      itemName: activeMatchItem.name,
      itemImage: activeMatchItem.imageUrl,
      status: 'Pending',
      securityAnswer: activeMatchItem.securityQuestion ? matchAnswer : undefined,
      messages: [],
      senderResolved: false,
      targetResolved: false
    };

    setNotifications([newNotif, ...notifications]);
    setActiveMatchItem(null);
    setMatchAnswer(''); 
    alert(`Claim Request Sent! Awaiting approval.`);
  };

  const handleAcceptMatch = (notifId: number) => {
    if (window.confirm("Approve this claim? You and the claimant will be able to coordinate the handoff in the chat thread.")) {
      setNotifications(notifications.map(n => n.id === notifId ? { ...n, status: 'Accepted', messages: [] } : n));
    }
  };

  const handleDeclineMatch = (notifId: number) => {
    setNotifications(notifications.map(n => n.id === notifId ? { ...n, status: 'Declined' } : n));
  };

  const handleDeleteNotification = (notifId: number) => {
    setNotifications(notifications.filter(n => n.id !== notifId));
  };

  // Two-party resolution logic
  const handleMarkResolved = (notifId: number, role: 'sender' | 'target') => {
    const notif = notifications.find(n => n.id === notifId);
    if (!notif) return;

    const newSenderResolved = role === 'sender' ? true : notif.senderResolved;
    const newTargetResolved = role === 'target' ? true : notif.targetResolved;

    if (newSenderResolved && newTargetResolved) {
      alert('Both parties have confirmed the handoff! The item has been safely resolved and removed from the portal.');
      setItems(items.filter(i => i.id !== notif.itemId));
      setNotifications(notifications.filter(n => n.itemId !== notif.itemId));
    } else {
      setNotifications(notifications.map(n => 
        n.id === notifId 
          ? { ...n, senderResolved: newSenderResolved, targetResolved: newTargetResolved } 
          : n
      ));
    }
  };

  const handleSendMessage = (notifId: number, e: React.FormEvent) => {
    e.preventDefault();
    const text = chatInputs[notifId];
    if (!text || !text.trim() || !currentUser) return;

    const newMessage: ChatMessage = {
      sender: currentUser.regNo,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setNotifications(notifications.map(n => {
      if (n.id === notifId) {
        return { ...n, messages: [...(n.messages || []), newMessage] };
      }
      return n;
    }));

    setChatInputs(prev => ({ ...prev, [notifId]: '' }));
  };

  const hasUserRequestedItem = (itemId: number) => {
    return notifications.some(
      n => n.itemId === itemId && n.senderRegNo === currentUser?.regNo && n.status !== 'Declined'
    );
  };

  const myReceivedNotifications = notifications.filter(
    n => n.targetRegNo === currentUser?.regNo && n.status !== 'Declined'
  );

  const mySentNotifications = notifications.filter(
    n => n.senderRegNo === currentUser?.regNo
  );
  
  const myItems = items.filter(i => i.ownerRegNo === currentUser?.regNo);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                          item.description.toLowerCase().includes(search.toLowerCase()) ||
                          item.location.toLowerCase().includes(search.toLowerCase()) ||
                          item.category.toLowerCase().includes(search.toLowerCase());
    return item.type === feedMode && matchesSearch;
  });

  if (!currentUser) {
    return (
      <div className="vtop-auth-shell">
        <header className="vtop-top-bar">
          <div className="vtop-logo-area">
            <img src={vitLogo} alt="VIT Logo" className="vtop-header-logo" />
            <span className="vtop-vit-title">VIT</span>
            <span className="vtop-campus-title">(Vellore Campus)</span>
          </div>
        </header>

        <div className="vtop-login-wrapper">
          <div className="vtop-login-card">
            <div className="vtop-card-header">
              <h3>VTOP Lost & Found Login</h3>
            </div>

            <div className="vtop-auth-toggle">
              <button type="button" className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>Login</button>
              <button type="button" className={authMode === 'signup' ? 'active' : ''} onClick={() => setAuthMode('signup')}>New Registration</button>
            </div>

            <form onSubmit={handleAuthSubmit} className="vtop-form">
              <div className="vtop-input-field">
                <input type="text" placeholder="Username / Reg No" value={authForm.regNo} onChange={e => setAuthForm({ ...authForm, regNo: e.target.value })} required />
                <span className="field-icon">👤</span>
              </div>

              {authMode === 'signup' && (
                <>
                  <div className="vtop-input-field">
                    <input type="email" placeholder="Student Email (@vitstudent.ac.in)" value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} required />
                    <span className="field-icon">✉️</span>
                  </div>

                  <div className="vtop-input-field">
                    <input type="tel" placeholder="Mobile Number" value={authForm.phone} onChange={e => setAuthForm({ ...authForm, phone: e.target.value })} required />
                    <span className="field-icon">📱</span>
                  </div>
                </>
              )}

              <div className="vtop-input-field">
                <input type={showPassword ? "text" : "password"} placeholder="Password" value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} required />
                <button type="button" className="eye-toggle-btn" onClick={() => setShowPassword(!showPassword)} title={showPassword ? "Hide password" : "Show password"}>{showPassword ? "🙈" : "👁️"}</button>
              </div>

              <button type="submit" className="vtop-submit-btn">{authMode === 'login' ? 'Sign In' : 'Register Account'}</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vtop-app">
      <header className="vtop-top-bar">
        <div className="vtop-header-left">
          <img src={vitLogo} alt="VIT Logo" className="vtop-header-logo" />
          <span className="vtop-vit-title">VIT</span>
          <span className="vtop-campus-title">(Vellore Campus)</span>
        </div>
        <div className="vtop-header-right">
          <div className="vtop-user-chip">
            <span className="vtop-username">{currentUser.regNo}</span>
            <button className="vtop-logout-link" onClick={handleLogout}>[Signout]</button>
          </div>
        </div>
      </header>

      <nav className="vtop-sub-navbar">
        <span className={`nav-item ${activeTab === 'campus_feed' ? 'active' : ''}`} onClick={() => setActiveTab('campus_feed')}>
          🌐 1. Campus Feed
        </span>
        <span className={`nav-item ${activeTab === 'my_listings' ? 'active' : ''}`} onClick={() => setActiveTab('my_listings')}>
          📝 2. Report & My Listings ({myItems.length})
        </span>
        <span className={`nav-item ${activeTab === 'match_center' ? 'active' : ''}`} onClick={() => setActiveTab('match_center')}>
          🔥 3. Match Center ({myReceivedNotifications.filter(n => n.status === 'Pending').length})
        </span>
      </nav>

      <main className="vtop-container">
        {/* PAGE 1: CAMPUS FEED */}
        {activeTab === 'campus_feed' && (
          <>
            <div className="feed-mode-toggle">
              <button className={`feed-btn lost ${feedMode === 'Lost' ? 'active' : ''}`} onClick={() => setFeedMode('Lost')}>
                🔴 LOST ITEMS FEED
              </button>
              <button className={`feed-btn found ${feedMode === 'Found' ? 'active' : ''}`} onClick={() => setFeedMode('Found')}>
                🟢 FOUND ITEMS FEED
              </button>
            </div>

            <div className="vtop-widget">
              <div className="vtop-widget-header">
                <h4>SEARCH {feedMode.toUpperCase()} ITEMS</h4>
              </div>
              <div className="vtop-widget-body flex-controls">
                <input type="text" className="search-input" placeholder="Search item, category, or official campus location..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>

            <div className="vtop-widget">
              <div className="vtop-widget-header">
                <h4>CAMPUS {feedMode.toUpperCase()} LISTINGS</h4>
              </div>
              <div className="vtop-widget-body">
                {filteredItems.length === 0 ? (
                  <p className="vtop-muted-text">&lt; &lt; &lt; No {feedMode.toLowerCase()} items found matching your criteria &gt; &gt; &gt;</p>
                ) : (
                  <div className="item-cards-grid">
                    {filteredItems.map(item => {
                      const requested = hasUserRequestedItem(item.id);
                      return (
                        <div key={item.id} className="feed-card">
                          {item.imageUrl ? (
                            <div className="img-container" onClick={() => setPreviewImage(item.imageUrl || null)}>
                              <img src={item.imageUrl} alt={item.name} className="feed-img" />
                              <span className="click-hint">🔍 View Full Image</span>
                            </div>
                          ) : (
                            <div className="no-img-placeholder">📷 No Photo</div>
                          )}
                          <div className="card-content">
                            <div className="card-header-row">
                              <span className={`vtop-tag category-tag`}>{item.category}</span>
                              <span className="item-date">{item.date}</span>
                            </div>
                            <h3 className="item-title">{item.name}</h3>
                            <p className="item-detail">📍 <strong>Venue:</strong> {item.location}</p>
                            
                            {/* Privacy Feature: Masking exact Registration Number */}
                            <p className="item-detail">
                              👤 <strong>Reported By:</strong> {item.ownerRegNo === currentUser.regNo ? 'You' : 'Masked Student 🔒'}
                            </p>
                            
                            <p className="item-desc">{item.description}</p>

                            {item.securityQuestion && (
                              <p className="security-notice">🔒 Verification Challenge Required</p>
                            )}
                            
                            {item.ownerRegNo !== currentUser.regNo ? (
                              <button 
                                className={`vtop-btn-match-card ${requested ? 'disabled' : ''}`} 
                                onClick={() => {
                                  if (!requested) {
                                    setActiveMatchItem(item);
                                    setMatchAnswer('');
                                  }
                                }}
                                disabled={requested}
                              >
                                {requested ? '✅ Claim Request Sent' : '🛡️ Claim Item'}
                              </button>
                            ) : (
                              <span className="vtop-self-tag" style={{display: 'block', marginTop: '10px', fontSize: '0.85rem', fontWeight: 'bold', color: '#64748b'}}>[Your Public Record]</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* PAGE 2: REPORT AN ITEM & MY LISTINGS */}
        {activeTab === 'my_listings' && (
          <>
            <div className="vtop-widget">
              <div className="vtop-widget-header">
                <h4>REPORT A LOST OR FOUND ITEM</h4>
              </div>
              <div className="vtop-widget-body">
                <form onSubmit={handlePostItem} className="vtop-form-grid">
                  <div className="vtop-form-group">
                    <label>Status Type:</label>
                    <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as 'Lost' | 'Found' })}>
                      <option value="Lost">I Lost an Item</option>
                      <option value="Found">I Found an Item</option>
                    </select>
                  </div>

                  <div className="vtop-form-group">
                    <label>Category Tag:</label>
                    <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} required>
                      <option value="">-- Select Category --</option>
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>

                  <div className="vtop-form-group">
                    <label>Item Name / Brief Title:</label>
                    <input type="text" placeholder="e.g. Blue Boat Earbuds" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                  </div>

                  <div className="vtop-form-group">
                    <label>VIT Campus Venue:</label>
                    <select value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} required>
                      <option value="">-- Select Official Location --</option>
                      <optgroup label="Academic Blocks">
                        {ACADEMIC_BLOCKS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                      </optgroup>
                      <optgroup label="Men's Hostels">
                        {MENS_HOSTELS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                      </optgroup>
                      <optgroup label="Women's Hostels">
                        {WOMENS_HOSTELS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                      </optgroup>
                      <optgroup label="Food Courts">
                        {FOOD_COURTS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                      </optgroup>
                      <optgroup label="Other Locations">
                        {OTHERS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                      </optgroup>
                    </select>
                  </div>

                  <div className="vtop-form-group">
                    <label>Upload Item Photo:</label>
                    <input type="file" accept="image/*" onChange={handleImageChange} />
                  </div>

                  <div className="vtop-form-group full-width">
                    <label>Description Details:</label>
                    <textarea placeholder="Provide detailed physical description..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} required />
                  </div>

                  {formData.type === 'Found' && (
                    <div className="vtop-form-group full-width verification-box">
                      <label className="verification-label">🛡️ Claim Verification Challenge (Required for Found Items):</label>
                      <p className="verification-desc">
                        Set a custom challenge only the real owner can answer. (e.g., "What name/branch is on the ID tag?", "What is the wallpaper of the phone?")
                      </p>
                      <input type="text" placeholder="Type your security question here..." value={formData.securityQuestion} onChange={e => setFormData({ ...formData, securityQuestion: e.target.value })} required={formData.type === 'Found'}/>
                    </div>
                  )}

                  {formData.imageUrl && (
                    <div className="full-width image-preview-wrapper">
                      <p style={{fontSize: '0.85rem', fontWeight: 'bold'}}>Photo Preview:</p>
                      <img src={formData.imageUrl} alt="Preview" className="upload-preview-img" onClick={() => setPreviewImage(formData.imageUrl)} style={{ marginTop: '5px' }} />
                    </div>
                  )}

                  <button type="submit" className="vtop-btn-primary full-width">Publish Record</button>
                </form>
              </div>
            </div>

            <div className="vtop-widget">
              <div className="vtop-widget-header">
                <h4>MY ACTIVE LISTINGS ({myItems.length})</h4>
              </div>
              <div className="vtop-widget-body">
                {myItems.length === 0 ? (
                  <p className="vtop-muted-text">You have no active listings.</p>
                ) : (
                  <table className="vtop-table">
                    <thead>
                      <tr>
                        <th>Photo</th>
                        <th>Type</th>
                        <th>Category</th>
                        <th>Item Name</th>
                        <th>Location</th>
                        <th>Verification Challenge</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myItems.map(item => (
                        <tr key={item.id}>
                          <td>
                            {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="table-thumb clickable" onClick={() => setPreviewImage(item.imageUrl || null)} /> : <span>No Photo</span>}
                          </td>
                          <td><span className={`vtop-tag ${item.type.toLowerCase()}`}>{item.type}</span></td>
                          <td>{item.category}</td>
                          <td><strong>{item.name}</strong></td>
                          <td>{item.location}</td>
                          <td>{item.securityQuestion ? item.securityQuestion : 'N/A'}</td>
                          <td>
                            <button className="btn-decline" style={{ padding: '4px 8px', fontSize: '0.78rem' }} onClick={() => handleDeleteItem(item.id)}>
                              🗑️ Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}

        {/* PAGE 3: MATCH CENTER */}
        {activeTab === 'match_center' && (
          <>
            {/* SECTION 1: RECEIVED REQUESTS (You evaluating claims) */}
            <div className="vtop-widget">
              <div className="vtop-widget-header danger-header">
                <h4>📥 RECEIVED CLAIM REQUESTS ({myReceivedNotifications.length})</h4>
              </div>
              <div className="vtop-widget-body">
                {myReceivedNotifications.length === 0 ? (
                  <p className="vtop-muted-text">&lt; &lt; &lt; No pending claim requests received &gt; &gt; &gt;</p>
                ) : (
                  <div className="tinder-match-cards-grid">
                    {myReceivedNotifications.map(n => {
                      return (
                        <div key={n.id} className={`tinder-card ${n.status.toLowerCase()}`}>
                          {n.itemImage && (
                            <img src={n.itemImage} alt={n.itemName} className="tinder-card-img clickable" onClick={() => setPreviewImage(n.itemImage || null)} />
                          )}
                          <div className="tinder-card-info">
                            <h3>Claim on: {n.itemName}</h3>
                            <p>👤 <strong>Claimant Registration:</strong> {n.senderRegNo}</p>
                            
                            {n.securityAnswer && n.status === 'Pending' && (
                              <div className="security-answer-box">
                                <p className="sa-label">THEIR VERIFICATION ANSWER:</p>
                                <p className="sa-text">"{n.securityAnswer}"</p>
                              </div>
                            )}

                            {n.status === 'Pending' && (
                              <div className="tinder-actions">
                                <button className="btn-decline" onClick={() => handleDeclineMatch(n.id)}>✖ Reject</button>
                                <button className="btn-accept-tinder" onClick={() => handleAcceptMatch(n.id)}>🛡️ Approve & Coordinate</button>
                              </div>
                            )}

                            {n.status === 'Accepted' && (
                              <div className="tinder-status accepted">
                                <p>🎉 <strong>CLAIM APPROVED</strong></p>
                                
                                <div className="chat-container">
                                  <div className="chat-messages">
                                    {(n.messages || []).length === 0 ? (
                                      <p className="vtop-muted-text" style={{fontSize: '0.8rem', textAlign: 'center', marginTop: '20px'}}>Send a message to coordinate a meetup spot & time.</p>
                                    ) : (
                                      (n.messages || []).map((msg, idx) => (
                                        <div key={idx} className={`chat-bubble ${msg.sender === currentUser.regNo ? 'me' : 'them'}`}>
                                          <span className="chat-sender">{msg.sender === currentUser.regNo ? 'You' : msg.sender}</span>
                                          <span className="chat-text">{msg.text}</span>
                                          <span className="chat-time">{msg.timestamp}</span>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                  <form className="chat-input-form" onSubmit={(e) => handleSendMessage(n.id, e)}>
                                    <input
                                      type="text"
                                      placeholder="Message to coordinate..."
                                      value={chatInputs[n.id] || ''}
                                      onChange={(e) => setChatInputs({ ...chatInputs, [n.id]: e.target.value })}
                                    />
                                    <button type="submit">Send</button>
                                  </form>
                                </div>
                                
                                {n.targetResolved ? (
                                  <div className="waiting-badge">✅ You confirmed. Waiting for claimant...</div>
                                ) : (
                                  <button className="btn-resolve" onClick={() => handleMarkResolved(n.id, 'target')}>
                                    ✅ Confirm Handoff Complete
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 2: SENT REQUESTS (Claims you initiated) */}
            <div className="vtop-widget" style={{ marginTop: '20px' }}>
              <div className="vtop-widget-header" style={{backgroundColor: '#e0e7ff', color: '#3730a3'}}>
                <h4>📤 MY SENT CLAIMS ({mySentNotifications.length})</h4>
              </div>
              <div className="vtop-widget-body">
                {mySentNotifications.length === 0 ? (
                  <p className="vtop-muted-text">&lt; &lt; &lt; You have not submitted any claims &gt; &gt; &gt;</p>
                ) : (
                  <div className="tinder-match-cards-grid">
                    {mySentNotifications.map(n => {
                      return (
                        <div key={n.id} className="tinder-card" style={n.status === 'Declined' ? {opacity: 0.7, border: '2px solid #ef4444'} : {}}>
                          {n.itemImage && (
                            <img src={n.itemImage} alt={n.itemName} className="tinder-card-img clickable" onClick={() => setPreviewImage(n.itemImage || null)} />
                          )}
                          <div className="tinder-card-info">
                            <h3>Requested: {n.itemName}</h3>
                            
                            {n.status === 'Pending' && (
                              <div style={{ marginTop: '10px' }}>
                                <span className="status-badge pending">⏳ Awaiting Approval...</span>
                                <button className="btn-decline" style={{ width: '100%', marginTop: '10px' }} onClick={() => handleDeleteNotification(n.id)}>
                                  Cancel Request
                                </button>
                              </div>
                            )}

                            {n.status === 'Declined' && (
                              <div style={{ marginTop: '10px' }}>
                                <span className="status-badge declined">❌ Claim Rejected</span>
                                <button className="btn-decline" style={{ width: '100%', marginTop: '10px', background: '#64748b' }} onClick={() => handleDeleteNotification(n.id)}>
                                  Dismiss Notification
                                </button>
                              </div>
                            )}

                            {n.status === 'Accepted' && (
                              <div className="tinder-status accepted">
                                <p>🎉 <strong>CLAIM APPROVED!</strong></p>

                                <div className="chat-container">
                                  <div className="chat-messages">
                                    {(n.messages || []).length === 0 ? (
                                      <p className="vtop-muted-text" style={{fontSize: '0.8rem', textAlign: 'center', marginTop: '20px'}}>Send a message to coordinate a meetup spot & time.</p>
                                    ) : (
                                      (n.messages || []).map((msg, idx) => (
                                        <div key={idx} className={`chat-bubble ${msg.sender === currentUser.regNo ? 'me' : 'them'}`}>
                                          <span className="chat-sender">{msg.sender === currentUser.regNo ? 'You' : msg.sender}</span>
                                          <span className="chat-text">{msg.text}</span>
                                          <span className="chat-time">{msg.timestamp}</span>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                  <form className="chat-input-form" onSubmit={(e) => handleSendMessage(n.id, e)}>
                                    <input
                                      type="text"
                                      placeholder="Message to coordinate..."
                                      value={chatInputs[n.id] || ''}
                                      onChange={(e) => setChatInputs({ ...chatInputs, [n.id]: e.target.value })}
                                    />
                                    <button type="submit">Send</button>
                                  </form>
                                </div>

                                {n.senderResolved ? (
                                  <div className="waiting-badge">✅ You confirmed. Waiting for poster...</div>
                                ) : (
                                  <button className="btn-resolve" onClick={() => handleMarkResolved(n.id, 'sender')}>
                                    ✅ Confirm Item Received
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* CLAIM REQUEST VERIFICATION MODAL */}
      {activeMatchItem && (
        <div className="vtop-modal-backdrop">
          <div className="vtop-modal-card">
            <div className="vtop-widget-header danger-header">
              <h4>CLAIM VERIFICATION REQUEST</h4>
            </div>
            <div className="vtop-widget-body" style={{ padding: '20px' }}>
              <p>You are filing a claim for: <strong>{activeMatchItem.name}</strong></p>
              
              {activeMatchItem.securityQuestion && (
                <div className="verification-box" style={{ marginTop: '15px' }}>
                  <p className="verification-label">🛡️ Verification Challenge:</p>
                  <p style={{ margin: '6px 0', fontSize: '0.95rem' }}>{activeMatchItem.securityQuestion}</p>
                  <input
                    type="text"
                    placeholder="Answer the challenge to prove ownership..."
                    value={matchAnswer}
                    onChange={(e) => setMatchAnswer(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', marginTop: '5px' }}
                    required
                  />
                </div>
              )}

              <p className="vtop-muted-text" style={{ margin: '15px 0', fontSize: '0.8rem' }}>
                🔒 Your identity and contact info will only be shared if the poster approves your claim.
              </p>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button className="vtop-btn-primary" onClick={handleSendMatchRequest} style={{flex: 1}}>Submit Claim</button>
                <button className="vtop-btn-cancel" onClick={() => { setActiveMatchItem(null); setMatchAnswer(''); }} style={{flex: 1}}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULL-IMAGE LIGHTBOX MODAL */}
      {previewImage && (
        <div className="image-modal-backdrop" onClick={() => setPreviewImage(null)}>
          <div className="image-modal-content" onClick={e => e.stopPropagation()}>
            <button className="image-modal-close" onClick={() => setPreviewImage(null)}>✕ Close</button>
            <img src={previewImage} alt="Full Size Item" className="full-lightbox-img" />
          </div>
        </div>
      )}
    </div>
  );
}