import { useState, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';
import './App.css';

import contractArtifact from './artifacts/LandRegistry.json';
import addressArtifact   from './artifacts/contract-address.json';

const CONTRACT_ADDRESS = addressArtifact.address;

/* ──────────────────────────────────────────────
   Small reusable components
────────────────────────────────────────────── */

function Toast({ message, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);

  const icons = { success: '✅', error: '❌', info: '⏳' };
  return (
    <div className={`toast ${type}`}>
      <span style={{ fontSize: '1.2rem' }}>{icons[type]}</span>
      <span>{message}</span>
    </div>
  );
}

/* Transfer Ownership Modal */
function TransferModal({ land, onConfirm, onClose }) {
  const [newAddr, setNewAddr] = useState('');
  const [newName, setNewName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(land.id, newAddr, newName);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">⇄ Transfer Ownership — Land #{land.id.toString()}</div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">New Owner Wallet Address</label>
            <input
              className="form-input mono"
              required
              type="text"
              placeholder="0x..."
              value={newAddr}
              onChange={e => setNewAddr(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">New Owner Name</label>
            <input
              className="form-input"
              required
              type="text"
              placeholder="e.g. Priya Patel"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-confirm">Confirm Transfer</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* Land Card */
function LandCard({ land, isAdmin, onTransfer }) {
  const eth = ethers.formatEther(land.price);
  const types = ['Residential','Commercial','Agricultural','Industrial'];
  const badgeClass = types.includes(land.landType) ? `badge-${land.landType}` : 'badge-default';
  const ts = Number(land.timestamp);
  const date = ts ? new Date(ts * 1000).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';

  return (
    <div className="land-card card-enter">
      <div className="card-header">
        <div>
          <div className="card-id">LAND ID · #{land.id.toString().padStart(4,'0')}</div>
          <div className="card-title">{land.landType} Property</div>
        </div>
        <span className={`badge-type ${badgeClass}`}>{land.landType}</span>
      </div>

      <div style={{ display:'flex', alignItems:'baseline', gap:'0.3rem', margin:'0.5rem 0 0.8rem' }}>
        <div className="price-display">{eth}</div>
        <span style={{ fontSize:'0.75rem', color:'var(--neon-green)', opacity:0.7 }}>ETH</span>
      </div>

      <div className="card-divider" />

      <div className="card-detail">
        <span className="card-detail-icon">👤</span>
        <div>
          <div className="card-detail-label">Owner</div>
          <div className="card-detail-value">{land.ownerName}</div>
        </div>
      </div>

      <div className="card-detail">
        <span className="card-detail-icon">📍</span>
        <div>
          <div className="card-detail-label">Location</div>
          <div className="card-detail-value">{land.location}</div>
        </div>
      </div>

      <div className="card-detail">
        <span className="card-detail-icon">🗓</span>
        <div>
          <div className="card-detail-label">Registered</div>
          <div className="card-detail-value">{date}</div>
        </div>
      </div>

      <div className="card-wallet" title={land.ownerWallet}>
        {land.ownerWallet.slice(0,12)}...{land.ownerWallet.slice(-10)}
      </div>

      {isAdmin && (
        <button className="btn-transfer" onClick={() => onTransfer(land)}>
          ⇄ Transfer Ownership
        </button>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Main App
────────────────────────────────────────────── */
export default function App() {
  const [account,  setAccount]  = useState('');
  const [contract, setContract] = useState(null);
  const [isAdmin,  setIsAdmin]  = useState(false);
  const [lands,    setLands]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [toast,    setToast]    = useState(null);       // { message, type }
  const [txPending, setTxPending] = useState(false);
  const [transferTarget, setTransferTarget] = useState(null); // land obj for modal

  // Add-land form
  const [form, setForm] = useState({ ownerName:'', ownerWallet:'', location:'', landType:'', price:'' });

  /* ── Connect Wallet ─────────────────────────── */
  const connectWallet = async () => {
    if (!window.ethereum) { showToast('Please install MetaMask!', 'error'); return; }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const current  = accounts[0];
      setAccount(current);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer   = await provider.getSigner();
      const landContract = new ethers.Contract(CONTRACT_ADDRESS, contractArtifact.abi, signer);

      setContract(landContract);

      const adminAddr = await landContract.admin();
      setIsAdmin(adminAddr.toLowerCase() === current.toLowerCase());

      await fetchLands(landContract);

      window.ethereum.on('accountsChanged', () => window.location.reload());
    } catch (err) {
      console.error(err);
      showToast('Wallet connection failed.', 'error');
    }
  };

  useEffect(() => { connectWallet(); }, []);

  /* ── Fetch Lands ────────────────────────────── */
  const fetchLands = async (c) => {
    setLoading(true);
    try {
      const all = await c.getAllLands(0, 100);
      setLands(all.filter(l => l.exists));
    } catch (err) {
      console.error(err);
      showToast('Could not fetch land records.', 'error');
    }
    setLoading(false);
  };

  /* ── Toast Helper ───────────────────────────── */
  const showToast = (message, type = 'info') => setToast({ message, type });

  /* ── Add Land ───────────────────────────────── */
  const addLand = async (e) => {
    e.preventDefault();
    if (!contract || !isAdmin) return;
    try {
      setTxPending(true);
      showToast('Sending transaction to blockchain…', 'info');
      const tx = await contract.addLand(
        form.ownerName, form.ownerWallet,
        form.location, form.landType,
        ethers.parseEther(form.price)
      );
      showToast('Transaction submitted. Waiting for block…', 'info');
      await tx.wait();
      showToast('Land registered successfully on-chain! 🎉', 'success');
      setForm({ ownerName:'', ownerWallet:'', location:'', landType:'', price:'' });
      await fetchLands(contract);
    } catch (err) {
      console.error(err);
      showToast(err?.reason || 'Transaction failed.', 'error');
    } finally {
      setTxPending(false);
    }
  };

  /* ── Transfer Ownership ─────────────────────── */
  const doTransfer = async (landId, newOwner, newOwnerName) => {
    setTransferTarget(null);
    try {
      setTxPending(true);
      showToast('Sending transfer transaction…', 'info');
      const tx = await contract.transferOwnership(landId, newOwner, newOwnerName);
      await tx.wait();
      showToast('Ownership transferred successfully!', 'success');
      await fetchLands(contract);
    } catch (err) {
      console.error(err);
      showToast(err?.reason || 'Transfer failed.', 'error');
    } finally {
      setTxPending(false);
    }
  };

  /* ── Search / Filter ────────────────────────── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return lands;
    return lands.filter(l =>
      l.ownerName.toLowerCase().includes(q) ||
      l.location.toLowerCase().includes(q)  ||
      l.landType.toLowerCase().includes(q)  ||
      l.ownerWallet.toLowerCase().includes(q)
    );
  }, [lands, search]);

  /* ── Stats ──────────────────────────────────── */
  const totalEth = useMemo(
    () => lands.reduce((s, l) => s + parseFloat(ethers.formatEther(l.price)), 0).toFixed(2),
    [lands]
  );

  const types = useMemo(() => [...new Set(lands.map(l => l.landType))].length, [lands]);

  /* ── Ticker chunks ──────────────────────────── */
  const tickerItems = [
    `⬡ Network: Localhost`,
    `⬡ Contract: ${CONTRACT_ADDRESS.slice(0,10)}…`,
    `⬡ Records: ${lands.length}`,
    `⬡ Total Value: ${totalEth} ETH`,
    `⬡ Block: LIVE`,
  ];

  /* ───────────────────────────────────────────── */
  return (
    <>
      {/* Animated BG */}
      <div className="bg-grid" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="app-wrapper">

        {/* ── Header ── */}
        <header className="header">
          <div className="header-logo">
            <div className="logo-icon">⬡</div>
            <div>
              <div className="logo-text">LandChain Registry</div>
              <div className="logo-sub">Decentralized | Immutable | Transparent</div>
            </div>
          </div>

          <div className="wallet-pill">
            {account ? (
              <>
                {isAdmin && <div className="admin-badge">⚡ Gov Admin</div>}
                <div className="wallet-address">
                  {account.slice(0,6)}…{account.slice(-4)}
                </div>
              </>
            ) : (
              <button className="btn-connect" onClick={connectWallet}>
                ⬡ Connect MetaMask
              </button>
            )}
          </div>
        </header>

        {/* ── Live Ticker ── */}
        <div className="ticker">
          <div className="ticker-dot" />
          {tickerItems.map((item, i) => (
            <div key={i} className="ticker-item">
              {item}
              {i < tickerItems.length - 1 && (
                <span style={{ margin:'0 0.3rem', opacity:0.25 }}>|</span>
              )}
            </div>
          ))}
        </div>

        {/* ── Stats ── */}
        <div className="stats-bar">
          {[
            { icon:'⬡', value: lands.length,   label:'Total Parcels' },
            { icon:'◉', value: `${totalEth}`,   label:'Total ETH Value' },
            { icon:'▣', value: types,            label:'Land Types' },
            { icon:'◈', value: isAdmin ? 'ADMIN' : 'CITIZEN', label:'Your Role' },
          ].map((s, i) => (
            <div className="stat-card" key={i}>
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Main Grid ── */}
        <div className={`main-grid ${isAdmin ? 'has-admin' : ''}`}>

          {/* ── Admin Form Panel ── */}
          {isAdmin && (
            <div className="panel">
              <div className="panel-title">⬡ Register New Land</div>

              <form onSubmit={addLand}>
                <div className="form-group">
                  <label className="form-label">Owner Name</label>
                  <input className="form-input" required type="text" placeholder="Rahul Sharma"
                    value={form.ownerName} onChange={e => setForm({...form, ownerName: e.target.value})} />
                </div>

                <div className="form-group">
                  <label className="form-label">Owner Wallet Address</label>
                  <input className="form-input mono" required type="text" placeholder="0x..."
                    value={form.ownerWallet} onChange={e => setForm({...form, ownerWallet: e.target.value})} />
                </div>

                <div className="form-group">
                  <label className="form-label">Location (Lat,Long or Address)</label>
                  <input className="form-input" required type="text" placeholder="28.6139, 77.2090"
                    value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
                </div>

                <div className="form-group">
                  <label className="form-label">Land Type</label>
                  <select className="form-select"
                    value={form.landType} onChange={e => setForm({...form, landType: e.target.value})}>
                    <option value="">Select type…</option>
                    <option>Residential</option>
                    <option>Commercial</option>
                    <option>Agricultural</option>
                    <option>Industrial</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Price (ETH)</label>
                  <input className="form-input" required type="number" step="0.0001" min="0" placeholder="2.5"
                    value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                </div>

                <button className="btn-submit" type="submit" disabled={txPending}>
                  {txPending ? '⏳ Processing…' : '⬡ Register on Blockchain'}
                </button>
              </form>
            </div>
          )}

          {/* ── Land Records Panel ── */}
          <div className="panel">
            <div className="panel-title">
              ▣ Land Registry
              <span style={{ marginLeft:'auto', fontSize:'0.7rem', color:'var(--text-muted)', fontFamily:'JetBrains Mono' }}>
                {filtered.length} / {lands.length} records
              </span>
            </div>

            {/* Search */}
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input className="search-input"
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, location, type or wallet…" />
            </div>

            {loading ? (
              <div className="loading-wrap">
                <div className="spinner" />
                <div className="loading-text">Syncing with blockchain…</div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">⬡</div>
                <div className="empty-text">
                  {search ? `No results for "${search}"` : 'No land records on-chain yet.'}
                </div>
              </div>
            ) : (
              <div className="lands-grid">
                {filtered.map((land, i) => (
                  <LandCard
                    key={i}
                    land={land}
                    isAdmin={isAdmin}
                    onTransfer={setTransferTarget}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Transfer Modal ── */}
      {transferTarget && (
        <TransferModal
          land={transferTarget}
          onConfirm={doTransfer}
          onClose={() => setTransferTarget(null)}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </>
  );
}
