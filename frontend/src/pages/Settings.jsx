import React, { useState, useEffect } from "react";
import api from "../api/axios";
import "./settings.css";

const SECTIONS      = ["Profile", "Password", "Currency & Tax"];
const SECTION_ICONS = {
  "Profile": "👤", "Password": "🔒", "Currency & Tax": "💰",
};
const CURRENCIES = [
  { code: "USD", label: "US Dollar ($)" },     { code: "EUR", label: "Euro (€)" },
  { code: "GBP", label: "British Pound (£)" },  { code: "PKR", label: "Pakistani Rupee (₨)" },
  { code: "AED", label: "UAE Dirham (د.إ)" },   { code: "SAR", label: "Saudi Riyal (﷼)" },
  { code: "INR", label: "Indian Rupee (₹)" },   { code: "CAD", label: "Canadian Dollar (CA$)" },
  { code: "AUD", label: "Australian Dollar (A$)" },
];

export default function Settings() {
  const [active, setActive]   = useState("Profile");
  const [saved, setSaved]     = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState({ name: "", email: "", phone: "", bio: "" });
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [showPw, setShowPw]   = useState({ current: false, newPass: false, confirm: false });
  const [prefs, setPrefs]     = useState({ currency: "USD", tax_label: "Tax", tax_rate: "0" });

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [pRes, sRes] = await Promise.all([
          api.get("/settings/profile"),
          api.get("/settings/preferences"),
        ]);
        const p = pRes.data;
        setProfile({ name: p.full_name||"", email: p.email||"", phone: p.phone||"", bio: p.bio||"" });
        const s = sRes.data;
        setPrefs({
          currency:  s.currency  || "USD",
          tax_label: s.tax_label || "Tax",
          tax_rate:  String(s.tax_rate || "0"),
        });
      } catch(err) { console.error(err); }
      finally { setLoading(false); }
    };
    loadAll();
  }, []);

  const showSaved = (s) => { setSaved(s); setError(""); setTimeout(() => setSaved(""), 2500); };
  const showError = (m) => { setError(m); setSaved(""); setTimeout(() => setError(""), 3000); };

  const handleSaveProfile = async () => {
    try {
      await api.patch("/settings/profile", {
        full_name: profile.name,
        email:     profile.email,
        phone:     profile.phone,
        bio:       profile.bio,
      });
      showSaved("Profile");
    } catch { showError("Failed to save profile."); }
  };

  const handleSavePassword = async () => {
    if (passwords.newPass !== passwords.confirm) { showError("Passwords do not match!"); return; }
    if (passwords.newPass.length < 6) { showError("Password must be at least 6 characters."); return; }
    try {
      await api.post("/settings/change-password", {
        current_password: passwords.current,
        new_password:     passwords.newPass,
        confirm_password: passwords.confirm,
      });
      setPasswords({ current: "", newPass: "", confirm: "" });
      showSaved("Password");
    } catch(err) { showError(err?.response?.data?.detail || "Failed to update password."); }
  };

  const handleSavePrefs = async () => {
    try {
      await api.patch("/settings/preferences", {
        currency:  prefs.currency,
        tax_label: prefs.tax_label,
        tax_rate:  parseFloat(prefs.tax_rate) || 0,
      });
      showSaved("Currency & Tax");
    } catch { showError("Failed to save preferences."); }
  };

  const SaveRow = ({ section, onSave }) => (
    <div className="st-save-row">
      {saved === section && <span className="st-saved-msg">✅ Saved successfully!</span>}
      {error && active === section && <span className="st-error-msg">❌ {error}</span>}
      <button className="st-save-btn" onClick={onSave}>Save {section}</button>
    </div>
  );

  if (loading) return (
    <div className="st-loading"><div className="st-spinner"/><p>Loading settings…</p></div>
  );

  return (
    <div className="st-wrap">
      <div className="st-page-header">
        <span className="st-eyebrow">⚙️ Preferences</span>
        <h1 className="st-title">Settings</h1>
        <p className="st-sub">Manage your account and billing preferences.</p>
      </div>

      <div className="st-layout">
        <nav className="st-nav">
          {SECTIONS.map(s => (
            <button key={s} className={`st-nav-item ${active === s ? "active" : ""}`} onClick={() => setActive(s)}>
              <span className="st-nav-icon">{SECTION_ICONS[s]}</span>
              <span>{s}</span>
              {active === s && <span className="st-nav-arrow">›</span>}
            </button>
          ))}
        </nav>

        <div className="st-panel">

          {/* Profile */}
          {active === "Profile" && (
            <div className="st-section">
              <div className="st-section-head">
                <h2>👤 Profile Information</h2>
                <p>Update your personal details.</p>
              </div>
              <div className="st-avatar-row">
                <div className="st-avatar">{profile.name ? profile.name.charAt(0).toUpperCase() : "?"}</div>
                <div>
                  <div className="st-avatar-name">{profile.name || "Your Name"}</div>
                  <div className="st-avatar-email">{profile.email || "your@email.com"}</div>
                </div>
              </div>
              <div className="st-form-grid">
                <div className="st-field">
                  <label>Full Name</label>
                  <input type="text" placeholder="John Smith" value={profile.name}
                    onChange={e => setProfile({...profile, name: e.target.value})} />
                </div>
                <div className="st-field">
                  <label>Email Address</label>
                  <input type="email" placeholder="john@example.com" value={profile.email}
                    onChange={e => setProfile({...profile, email: e.target.value})} />
                </div>
                <div className="st-field">
                  <label>Phone Number</label>
                  <input type="tel" placeholder="+1 234 567 8900" value={profile.phone}
                    onChange={e => setProfile({...profile, phone: e.target.value})} />
                </div>
                <div className="st-field full">
                  <label>Bio</label>
                  <textarea placeholder="Tell clients about yourself…" rows={3} value={profile.bio}
                    onChange={e => setProfile({...profile, bio: e.target.value})} />
                </div>
              </div>
              <SaveRow section="Profile" onSave={handleSaveProfile} />
            </div>
          )}

          {/* Password */}
          {active === "Password" && (
            <div className="st-section">
              <div className="st-section-head">
                <h2>🔒 Change Password</h2>
                <p>Keep your account secure with a strong password.</p>
              </div>
              <div className="st-form-grid single">
                {[
                  { key:"current", label:"Current Password" },
                  { key:"newPass", label:"New Password" },
                  { key:"confirm", label:"Confirm Password" },
                ].map(({ key, label }) => (
                  <div className="st-field" key={key}>
                    <label>{label}</label>
                    <div className="st-pw-wrap">
                      <input
                        type={showPw[key] ? "text" : "password"} autoComplete="new-password"
                        placeholder={`Enter ${label.toLowerCase()}`}
                        value={passwords[key]}
                        onChange={e => setPasswords({...passwords, [key]: e.target.value})}
                      />
                      <button type="button" className="st-pw-eye"
                        onClick={() => setShowPw({...showPw, [key]: !showPw[key]})}>
                        {showPw[key] ? "🙈" : "👁"}
                      </button>
                    </div>
                  </div>
                ))}
                {passwords.newPass && (
                  <div className="st-pw-strength">
                    <div className="st-pw-bars">
                      {[1,2,3,4].map(n => (
                        <div key={n} className={`st-pw-bar ${passwords.newPass.length >= n*3 ? "filled" : ""}`} />
                      ))}
                    </div>
                    <span className="st-pw-hint">
                      {passwords.newPass.length < 4 ? "Weak" : passwords.newPass.length < 8 ? "Fair" :
                       passwords.newPass.length < 12 ? "Good" : "Strong"}
                    </span>
                  </div>
                )}
              </div>
              <SaveRow section="Password" onSave={handleSavePassword} />
            </div>
          )}

          {/* Currency & Tax */}
          {active === "Currency & Tax" && (
            <div className="st-section">
              <div className="st-section-head">
                <h2>💰 Currency & Tax</h2>
                <p>Configure billing settings for invoices.</p>
              </div>
              <div className="st-form-grid">
                <div className="st-field full">
                  <label>Default Currency</label>
                  <select value={prefs.currency} onChange={e => setPrefs({...prefs, currency: e.target.value})}>
                    {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                  </select>
                </div>
                <div className="st-field">
                  <label>Tax Label</label>
                  <input type="text" placeholder="VAT, GST, Tax" value={prefs.tax_label}
                    onChange={e => setPrefs({...prefs, tax_label: e.target.value})} />
                </div>
                <div className="st-field">
                  <label>Tax Rate (%)</label>
                  <input type="number" min="0" max="100" step="0.1" value={prefs.tax_rate}
                    onChange={e => setPrefs({...prefs, tax_rate: e.target.value})} />
                </div>
              </div>
              <div className="st-preview-card">
                <div className="st-preview-label">Invoice Preview</div>
                <div className="st-preview-row"><span>Subtotal</span><span>100.00</span></div>
                <div className="st-preview-row">
                  <span>{prefs.tax_label} ({prefs.tax_rate}%)</span>
                  <span>{(100 * parseFloat(prefs.tax_rate||0) / 100).toFixed(2)}</span>
                </div>
                <div className="st-preview-total">
                  <span>Total</span>
                  <span>{(100 + 100 * parseFloat(prefs.tax_rate||0) / 100).toFixed(2)}</span>
                </div>
              </div>
              <SaveRow section="Currency & Tax" onSave={handleSavePrefs} />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}