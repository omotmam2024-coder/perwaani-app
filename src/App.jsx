import { useState, useEffect, useCallback } from "react";

// ─── STORAGE HELPERS ───────────────────────────────────────────────────────────
const KEYS = { cargo: "pw_cargo", tickets: "pw_tickets", bookings: "pw_bookings" };

async function loadData(key) {
  try {
    const r = await window.storage.get(key, true);
    return r ? JSON.parse(r.value) : [];
  } catch { return []; }
}
async function saveData(key, arr) {
  try { await window.storage.set(key, JSON.stringify(arr), true); } catch {}
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString("en-US");
const today = () => new Date().toISOString().slice(0, 10);
const uid = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 20 }) => {
  const icons = {
    dashboard: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    cargo: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    ticket: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/><line x1="9" y1="9" x2="9" y2="15"/></svg>,
    booking: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    invoice: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    report: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    plus: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    trash: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
    search: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    close: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    plane: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 4c-2 0-4 2-4 2L7 9.2l-6.8-1.7-.3-.6 3.8-3.5 4.4 1.3-.3-1.2 1.8-1.7 4.6 3.5 4.4-1.3c1-.3 1.9.6 1.6 1.6l-1.3 4.4 3.5 4.6-1.7 1.8-1.2-.3 1.3 4.4-3.5 3.8-.6-.3z"/></svg>,
    money: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    users: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    edit: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    menu: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    print: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  };
  return icons[name] || null;
};

// ─── STYLES ──────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --bg: #0d1117;
    --surface: #161b22;
    --surface2: #1c2230;
    --border: #30363d;
    --accent: #f0a500;
    --accent2: #e05c00;
    --green: #3fb950;
    --blue: #58a6ff;
    --red: #f85149;
    --purple: #a371f7;
    --text: #e6edf3;
    --muted: #8b949e;
    --card-shadow: 0 4px 24px rgba(0,0,0,0.4);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Sora', sans-serif; background: var(--bg); color: var(--text); }

  .app { display: flex; min-height: 100vh; }

  /* SIDEBAR */
  .sidebar {
    width: 240px; min-width: 240px; background: var(--surface); border-right: 1px solid var(--border);
    display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh; overflow-y: auto;
    transition: width 0.3s ease;
  }
  .sidebar.collapsed { width: 64px; min-width: 64px; }
  .sidebar-logo {
    padding: 20px 16px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 10px;
  }
  .logo-icon {
    width: 36px; height: 36px; background: linear-gradient(135deg, var(--accent), var(--accent2));
    border-radius: 10px; display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 14px; color: #000; flex-shrink: 0;
  }
  .logo-text { overflow: hidden; }
  .logo-title { font-weight: 700; font-size: 13px; line-height: 1.3; color: var(--accent); letter-spacing: 0.3px; }
  .logo-sub { font-size: 10px; color: var(--muted); }
  .nav { padding: 12px 8px; flex: 1; }
  .nav-section { font-size: 10px; font-weight: 600; color: var(--muted); letter-spacing: 1px; text-transform: uppercase; padding: 8px 8px 4px; }
  .nav-item {
    display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 8px;
    cursor: pointer; transition: all 0.15s; color: var(--muted); font-size: 13.5px; font-weight: 500;
    white-space: nowrap; overflow: hidden;
  }
  .nav-item:hover { background: var(--surface2); color: var(--text); }
  .nav-item.active { background: rgba(240,165,0,0.12); color: var(--accent); }
  .nav-item .icon { flex-shrink: 0; }
  .nav-label { overflow: hidden; }
  .sidebar-footer { padding: 12px 16px; border-top: 1px solid var(--border); font-size: 11px; color: var(--muted); }
  .sidebar-footer a { color: var(--blue); text-decoration: none; }

  /* MAIN */
  .main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
  .topbar {
    background: var(--surface); border-bottom: 1px solid var(--border); padding: 14px 24px;
    display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 10;
  }
  .topbar-left { display: flex; align-items: center; gap: 12px; }
  .topbar-right { display: flex; align-items: center; gap: 10px; }
  .page-title { font-size: 18px; font-weight: 700; }
  .page-sub { font-size: 12px; color: var(--muted); }
  .btn {
    display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px;
    font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer;
    border: none; transition: all 0.15s; white-space: nowrap;
  }
  .btn-primary { background: var(--accent); color: #000; }
  .btn-primary:hover { background: #f5b800; transform: translateY(-1px); }
  .btn-secondary { background: var(--surface2); color: var(--text); border: 1px solid var(--border); }
  .btn-secondary:hover { background: var(--border); }
  .btn-danger { background: rgba(248,81,73,0.15); color: var(--red); border: 1px solid rgba(248,81,73,0.3); }
  .btn-danger:hover { background: rgba(248,81,73,0.25); }
  .btn-ghost { background: transparent; color: var(--muted); border: 1px solid var(--border); }
  .btn-ghost:hover { color: var(--text); border-color: var(--muted); }
  .btn-sm { padding: 5px 10px; font-size: 12px; }

  /* CONTENT */
  .content { padding: 24px; flex: 1; overflow-x: hidden; }

  /* CARDS */
  .card {
    background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
    padding: 20px; box-shadow: var(--card-shadow);
  }
  .card-title { font-size: 14px; font-weight: 600; color: var(--muted); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
  .card-value { font-size: 28px; font-weight: 700; font-family: 'JetBrains Mono', monospace; }
  .card-sub { font-size: 12px; color: var(--muted); margin-top: 4px; }

  /* GRID */
  .grid-4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
  .grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; }
  .grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }

  /* KPI CARD */
  .kpi { position: relative; overflow: hidden; }
  .kpi::before {
    content: ''; position: absolute; top: -20px; right: -20px;
    width: 80px; height: 80px; border-radius: 50%; opacity: 0.08;
  }
  .kpi.gold::before { background: var(--accent); }
  .kpi.green::before { background: var(--green); }
  .kpi.blue::before { background: var(--blue); }
  .kpi.purple::before { background: var(--purple); }
  .kpi-label { font-size: 12px; font-weight: 600; color: var(--muted); letter-spacing: 0.5px; text-transform: uppercase; }
  .kpi-val { font-size: 26px; font-weight: 700; font-family: 'JetBrains Mono', monospace; margin: 6px 0 4px; }
  .kpi-icon { position: absolute; right: 16px; top: 16px; opacity: 0.25; }
  .kpi.gold .kpi-val { color: var(--accent); }
  .kpi.green .kpi-val { color: var(--green); }
  .kpi.blue .kpi-val { color: var(--blue); }
  .kpi.purple .kpi-val { color: var(--purple); }

  /* TABLE */
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  thead th {
    background: var(--surface2); color: var(--muted); font-weight: 600; font-size: 11px;
    text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 12px; text-align: left;
    border-bottom: 1px solid var(--border); white-space: nowrap;
  }
  tbody tr { border-bottom: 1px solid rgba(48,54,61,0.5); transition: background 0.1s; }
  tbody tr:hover { background: rgba(255,255,255,0.03); }
  tbody td { padding: 10px 12px; color: var(--text); vertical-align: middle; }
  .mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; }

  /* BADGE */
  .badge {
    display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px;
    border-radius: 20px; font-size: 11px; font-weight: 600;
  }
  .badge-green { background: rgba(63,185,80,0.12); color: var(--green); }
  .badge-amber { background: rgba(240,165,0,0.12); color: var(--accent); }
  .badge-red { background: rgba(248,81,73,0.12); color: var(--red); }
  .badge-blue { background: rgba(88,166,255,0.12); color: var(--blue); }
  .badge-purple { background: rgba(163,113,247,0.12); color: var(--purple); }
  .badge-muted { background: rgba(139,148,158,0.12); color: var(--muted); }

  /* FORM */
  .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
  .form-group { display: flex; flex-direction: column; gap: 6px; }
  .form-label { font-size: 12px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; }
  .form-input, .form-select {
    background: var(--surface2); border: 1px solid var(--border); border-radius: 8px;
    color: var(--text); padding: 9px 12px; font-family: 'Sora', sans-serif; font-size: 13.5px;
    transition: border 0.15s; outline: none;
  }
  .form-input:focus, .form-select:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(240,165,0,0.1); }
  .form-select option { background: var(--surface2); }
  .form-actions { display: flex; gap: 10px; justify-content: flex-end; padding-top: 8px; }

  /* MODAL */
  .overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
    z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px;
  }
  .modal {
    background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
    width: 100%; max-width: 760px; max-height: 90vh; overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0,0,0,0.6);
    animation: popIn 0.2s ease;
  }
  @keyframes popIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: none; } }
  .modal-header {
    padding: 20px 24px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
  }
  .modal-title { font-size: 16px; font-weight: 700; }
  .modal-body { padding: 24px; }
  .modal-footer { padding: 16px 24px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 10px; }

  /* SECTION HEADER */
  .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
  .section-title { font-size: 16px; font-weight: 700; }

  /* SEARCH BAR */
  .search-wrap { position: relative; }
  .search-wrap input { padding-left: 36px; }
  .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--muted); pointer-events: none; }

  /* PROGRESS */
  .progress-bar { background: var(--surface2); border-radius: 100px; height: 6px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 100px; background: linear-gradient(90deg, var(--accent), var(--accent2)); transition: width 0.4s; }

  /* TABS */
  .tabs { display: flex; gap: 4px; background: var(--surface2); border-radius: 10px; padding: 4px; margin-bottom: 20px; width: fit-content; }
  .tab {
    padding: 7px 16px; border-radius: 7px; cursor: pointer; font-size: 13px; font-weight: 600;
    color: var(--muted); transition: all 0.15s; border: none; background: transparent; font-family: 'Sora', sans-serif;
  }
  .tab.active { background: var(--surface); color: var(--text); box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
  .tab:hover:not(.active) { color: var(--text); }

  /* DIVIDER */
  .divider { border: none; border-top: 1px solid var(--border); margin: 20px 0; }

  /* ALERT */
  .alert { padding: 12px 16px; border-radius: 8px; font-size: 13px; display: flex; align-items: center; gap: 8px; }
  .alert-info { background: rgba(88,166,255,0.1); border: 1px solid rgba(88,166,255,0.25); color: var(--blue); }
  .alert-success { background: rgba(63,185,80,0.1); border: 1px solid rgba(63,185,80,0.25); color: var(--green); }

  /* INVOICE PRINT */

/* =========================
   PROFESSIONAL A4 INVOICE
========================= */

.invoice-paper {
  width: 210mm;
  min-height: 297mm;
  margin: auto;
  background: #ffffff;
  color: #222;
  padding: 20mm;
  box-sizing: border-box;
  font-family: Arial, sans-serif;
  position: relative;
}

/* HEADER */
.inv-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 2px solid #d9a000;
  padding-bottom: 15px;
  margin-bottom: 25px;
}

.inv-company-name {
  font-size: 28px;
  font-weight: bold;
  color: #c48b00;
  margin-bottom: 6px;
}

.inv-address {
  font-size: 13px;
  line-height: 1.5;
  color: #555;
}

.inv-no {
  font-size: 34px;
  font-weight: bold;
  color: #c48b00;
  text-align: right;
}

.inv-label {
  font-size: 11px;
  font-weight: bold;
  color: #777;
  margin-bottom: 3px;
}

.inv-val {
  font-size: 14px;
  font-weight: 600;
}

/* CUSTOMER + PAYMENT */
.inv-info {
  display: flex;
  justify-content: space-between;
  gap: 40px;
  margin-bottom: 25px;
}

.inv-box {
  flex: 1;
}

/* TABLE */
.inv-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
  table-layout: fixed;
}

.inv-table th {
  background: #f4f4f4;
  padding: 10px;
  font-size: 12px;
  text-transform: uppercase;
  border-bottom: 2px solid #ddd;
  text-align: left;
}

.inv-table td {
  padding: 10px;
  font-size: 13px;
  border-bottom: 1px solid #eee;
  vertical-align: top;
  word-break: break-word;
}

/* COLUMN WIDTHS */
.inv-table th:nth-child(1),
.inv-table td:nth-child(1) {
  width: 5%;
}

.inv-table th:nth-child(2),
.inv-table td:nth-child(2) {
  width: 40%;
}

.inv-table th:nth-child(3),
.inv-table td:nth-child(3) {
  width: 15%;
}

.inv-table th:nth-child(4),
.inv-table td:nth-child(4) {
  width: 15%;
}

.inv-table th:nth-child(5),
.inv-table td:nth-child(5) {
  width: 10%;
}

.inv-table th:nth-child(6),
.inv-table td:nth-child(6) {
  width: 15%;
  text-align: right;
}

/* TOTALS */
.inv-total-wrap {
  margin-top: 25px;
  margin-left: auto;
  width: 320px;
}

.inv-total-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
}

.inv-grand-total {
  border-top: 2px solid #222;
  margin-top: 8px;
  padding-top: 12px;
  font-size: 22px;
  font-weight: bold;
  color: #c48b00;
}

/* FOOTER */
.inv-footer {
  margin-top: 50px;
  text-align: center;
  font-size: 12px;
  color: #777;
  border-top: 1px solid #ddd;
  padding-top: 15px;
  line-height: 1.6;
}

/* PRINT SETTINGS */
@media print {

  body {
    background: white !important;
  }

  .sidebar,
  .topbar,
  .btn,
  .modal-header,
  .form-section,
  .invoice-generator-form {
    display: none !important;
  }

  .invoice-paper {
    width: 100%;
    min-height: auto;
    padding: 10mm;
    box-shadow: none;
    border: none;
  }

  @page {
    size: A4;
    margin: 10mm;
  }
}
```
  /* CHART */
  .bar-chart { display: flex; align-items: flex-end; gap: 8px; height: 100px; padding: 8px 0; }
  .bar { flex: 1; border-radius: 4px 4px 0 0; transition: all 0.3s; cursor: pointer; position: relative; min-width: 20px; }
  .bar:hover { opacity: 0.8; }
  .bar-label { text-align: center; font-size: 10px; color: var(--muted); margin-top: 4px; }

  /* MOBILE */
  @media (max-width: 768px) {
    .sidebar { position: fixed; z-index: 50; height: 100vh; }
    .sidebar:not(.open) { transform: translateX(-100%); }
    .main { margin-left: 0 !important; }
    .grid-4, .grid-3 { grid-template-columns: 1fr 1fr; }
    .content { padding: 16px; }
  }
  @media (max-width: 480px) {
    .grid-4, .grid-3, .grid-2 { grid-template-columns: 1fr; }
  }

  /* SCROLLBAR */
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }

  /* GLOW ACCENT */
  .glow { box-shadow: 0 0 20px rgba(240,165,0,0.15); }

  /* TOAST */
  .toast {
    position: fixed; bottom: 24px; right: 24px; z-index: 999;
    background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
    padding: 12px 18px; font-size: 13px; font-weight: 500;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    display: flex; align-items: center; gap: 8px;
    animation: slideUp 0.3s ease;
  }
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
  .toast.success { border-color: var(--green); color: var(--green); }
  .toast.error { border-color: var(--red); color: var(--red); }

  /* EMPTY STATE */
  .empty { text-align: center; padding: 60px 20px; color: var(--muted); }
  .empty svg { margin-bottom: 12px; opacity: 0.3; }
  .empty h3 { font-size: 15px; font-weight: 600; margin-bottom: 6px; color: var(--text); }
  .empty p { font-size: 13px; }

  .payment-pill {
    display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600;
  }
  .pill-cash { background: rgba(63,185,80,0.15); color: var(--green); }
  .pill-mobile { background: rgba(88,166,255,0.15); color: var(--blue); }
  .pill-bank { background: rgba(163,113,247,0.15); color: var(--purple); }
  .pill-credit { background: rgba(240,165,0,0.15); color: var(--accent); }
  .pill-birr { background: rgba(248,81,73,0.15); color: var(--red); }

  .tag { display: inline-flex; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; background: rgba(240,165,0,0.12); color: var(--accent); }

  /* GOOGLE SHEETS CTA */
  .sheets-banner {
    background: linear-gradient(135deg, rgba(63,185,80,0.08), rgba(88,166,255,0.08));
    border: 1px solid rgba(63,185,80,0.25); border-radius: 12px; padding: 16px 20px;
    display: flex; align-items: center; gap: 14px; margin-bottom: 20px;
  }
  .sheets-icon { width: 40px; height: 40px; background: rgba(63,185,80,0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

  .stat-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(48,54,61,0.4); }
  .stat-row:last-child { border-bottom: none; }
  .stat-name { font-size: 13px; color: var(--muted); }
  .stat-num { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 600; }
`;

// ─── PAYMENT PILL ─────────────────────────────────────────────────────────────
const PayPill = ({ method }) => {
  const m = (method || "").toLowerCase();
  const cls = m.includes("cash") ? "pill-cash" : m.includes("mobile") ? "pill-mobile" : m.includes("bank") ? "pill-bank" : m.includes("credit") ? "pill-credit" : m.includes("birr") ? "pill-birr" : "pill-cash";
  return <span className={`payment-pill ${cls}`}>{method || "—"}</span>;
};

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const s = (status || "").toLowerCase();
  const cls = s === "paid" || s === "confirmed" || s === "delivered" ? "badge-green" :
              s === "pending" ? "badge-amber" : s === "cancelled" ? "badge-red" : s === "booked" ? "badge-blue" : "badge-muted";
  return <span className={`badge ${cls}`}>{status || "—"}</span>;
};

// ─── TOAST COMPONENT ─────────────────────────────────────────────────────────
const Toast = ({ msg, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return <div className={`toast ${type}`}><Icon name="check" size={16} />{msg}</div>;
};

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ cargo, tickets, bookings }) {
  const totalCargoRev = cargo.reduce((s, r) => s + Number(r.amount || 0), 0);
  const totalTicketRev = tickets.reduce((s, r) => s + Number(r.fees || 0), 0);
  const totalBookingRev = bookings.reduce((s, r) => s + Number(r.total || 0), 0);
  const combined = totalCargoRev + totalTicketRev + totalBookingRev;
  const payBreakdown = {};
  cargo.forEach(r => { const p = r.paymentMethod || "Other"; payBreakdown[p] = (payBreakdown[p] || 0) + Number(r.amount || 0); });
  tickets.forEach(r => { const p = r.paymentStatus || "Other"; payBreakdown[p] = (payBreakdown[p] || 0) + Number(r.fees || 0); });

  const itemBreakdown = {};
  cargo.forEach(r => { const d = r.description || "Other"; itemBreakdown[d] = (itemBreakdown[d] || 0) + 1; });

  const target = 20000000;
  const pct = Math.min(100, (combined / target) * 100);

  const recentAll = [
    ...cargo.map(r => ({ type: "Cargo", id: r.id, name: r.senderName || "—", amount: r.amount, date: r.receivingDate, color: "accent" })),
    ...tickets.map(r => ({ type: "Ticket", id: r.ticketNo, name: r.passengerName || "—", amount: r.fees, date: r.date, color: "blue" })),
    ...bookings.map(r => ({ type: "Booking", id: r.bookingId, name: r.passengerName || "—", amount: r.total, date: r.bookingDate, color: "purple" })),
  ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 8);

  const barMax = Math.max(totalCargoRev, totalTicketRev, totalBookingRev, 1);
  const bars = [
    { label: "Cargo", val: totalCargoRev, color: "#f0a500" },
    { label: "Tickets", val: totalTicketRev, color: "#58a6ff" },
    { label: "Bookings", val: totalBookingRev, color: "#a371f7" },
  ];

  return (
    <div>
      <div className="sheets-banner">
        <div className="sheets-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#3fb950"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>Connected to Google Sheets · perwaani2023@gmail.com</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>All data entered below is synced across all 10 users in real time via shared storage. Open your Google Sheet to export data anytime.</div>
        </div>
        <span className="badge badge-green"><Icon name="check" size={12} />Live</span>
      </div>

      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="card kpi gold glow">
          <div className="kpi-icon"><Icon name="money" size={40} /></div>
          <div className="kpi-label">Combined Revenue</div>
          <div className="kpi-val">SSP {fmt(combined)}</div>
          <div className="card-sub">Cargo + Tickets + Bookings</div>
        </div>
        <div className="card kpi green">
          <div className="kpi-icon"><Icon name="cargo" size={40} /></div>
          <div className="kpi-label">Cargo Revenue</div>
          <div className="kpi-val">SSP {fmt(totalCargoRev)}</div>
          <div className="card-sub">{cargo.length} shipments</div>
        </div>
        <div className="card kpi blue">
          <div className="kpi-icon"><Icon name="plane" size={40} /></div>
          <div className="kpi-label">Ticket Revenue</div>
          <div className="kpi-val">SSP {fmt(totalTicketRev)}</div>
          <div className="card-sub">{tickets.length} passengers</div>
        </div>
        <div className="card kpi purple">
          <div className="kpi-icon"><Icon name="booking" size={40} /></div>
          <div className="kpi-label">Booking Revenue</div>
          <div className="kpi-val">SSP {fmt(totalBookingRev)}</div>
          <div className="card-sub">{bookings.length} bookings</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="section-header">
            <div className="section-title">Revenue vs Target</div>
            <span className="badge badge-amber">Target: SSP 20,000,000</span>
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
              <span>SSP {fmt(combined)}</span><span>{pct.toFixed(1)}%</span>
            </div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
          </div>
          <div className="bar-chart" style={{ marginTop: 16 }}>
            {bars.map(b => (
              <div key={b.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div className="bar" style={{ background: b.color, height: `${Math.max(4, (b.val / barMax) * 90)}px`, width: "100%" }} title={`SSP ${fmt(b.val)}`} />
                <div className="bar-label">{b.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
            {bars.map(b => (
              <span key={b.label} style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: b.color, display: "inline-block" }} />
                <span style={{ color: "var(--muted)" }}>{b.label}: </span>
                <span style={{ fontFamily: "JetBrains Mono", fontWeight: 600 }}>SSP {fmt(b.val)}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="section-title" style={{ marginBottom: 12 }}>Payment Breakdown</div>
          {Object.keys(payBreakdown).length === 0 ? <div style={{ color: "var(--muted)", fontSize: 13 }}>No payment data yet.</div> : (
            Object.entries(payBreakdown).map(([k, v]) => (
              <div className="stat-row" key={k}>
                <PayPill method={k} />
                <span className="stat-num">SSP {fmt(v)}</span>
              </div>
            ))
          )}
          <hr className="divider" />
          <div className="section-title" style={{ marginBottom: 12, marginTop: 8 }}>Cargo Item Types</div>
          {Object.keys(itemBreakdown).length === 0 ? <div style={{ color: "var(--muted)", fontSize: 13 }}>No cargo data yet.</div> : (
            Object.entries(itemBreakdown).slice(0, 5).map(([k, v]) => (
              <div className="stat-row" key={k}>
                <span className="stat-name">{k}</span>
                <span className="stat-num">{v} shipment{v > 1 ? "s" : ""}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card">
        <div className="section-title" style={{ marginBottom: 14 }}>Recent Activity</div>
        {recentAll.length === 0 ? (
          <div className="empty">
            <Icon name="dashboard" size={40} />
            <h3>No activity yet</h3>
            <p>Start by adding cargo, tickets, or bookings.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Type</th><th>ID / No.</th><th>Name</th><th>Date</th><th>Amount (SSP)</th></tr></thead>
              <tbody>
                {recentAll.map((r, i) => (
                  <tr key={i}>
                    <td><span className={`badge ${r.color === "accent" ? "badge-amber" : r.color === "blue" ? "badge-blue" : "badge-purple"}`}>{r.type}</span></td>
                    <td className="mono">{r.id || "—"}</td>
                    <td>{r.name}</td>
                    <td style={{ color: "var(--muted)", fontSize: 12 }}>{r.date || "—"}</td>
                    <td className="mono" style={{ color: "var(--accent)" }}>{fmt(r.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CARGO REGISTER ───────────────────────────────────────────────────────────
function CargoRegister({ data, setData, toast }) {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const emptyForm = { receivingDate: today(), description: "", unitKg: "", unitPrice: "", qty: "", spec: "", senderName: "", senderLocation: "", senderContact: "", receiverName: "", receiverLocation: "", receiverContact: "", paymentMethod: "Cash", amount: "" };
  const [form, setForm] = useState(emptyForm);

  const set = (k, v) => {
    setForm(f => {
      const nf = { ...f, [k]: v };
      if (k === "unitPrice" || k === "qty") {
        const price = parseFloat(k === "unitPrice" ? v : nf.unitPrice) || 0;
        const qty = parseFloat(k === "qty" ? v : nf.qty) || 0;
        nf.amount = price * qty || "";
      }
      return nf;
    });
  };

  const submit = async () => {
    if (!form.senderName || !form.receiverName || !form.description) { toast("Fill in required fields", "error"); return; }
    let updated;
    if (editing) {
      updated = data.map(r => r.id === editing ? { ...form, id: editing } : r);
      toast("Cargo record updated ✓", "success");
    } else {
      const sn = data.length + 1;
      updated = [...data, { ...form, id: `CRG-${String(sn).padStart(3, "0")}` }];
      toast("Cargo record saved ✓", "success");
    }
    setData(updated);
    await saveData(KEYS.cargo, updated);
    setShowForm(false); setEditing(null); setForm(emptyForm);
  };

  const del = async (id) => {
    const updated = data.filter(r => r.id !== id);
    setData(updated); await saveData(KEYS.cargo, updated);
    toast("Record deleted", "error");
  };

  const openEdit = (r) => { setForm(r); setEditing(r.id); setShowForm(true); };

  const filtered = data.filter(r =>
    (r.senderName || "").toLowerCase().includes(search.toLowerCase()) ||
    (r.receiverName || "").toLowerCase().includes(search.toLowerCase()) ||
    (r.description || "").toLowerCase().includes(search.toLowerCase()) ||
    (r.id || "").toLowerCase().includes(search.toLowerCase())
  );
  const total = data.reduce((s, r) => s + Number(r.amount || 0), 0);

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title">Customer Receiving Register</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>Cargo & shipment intake — {data.length} entries · Total: SSP {fmt(total)}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div className="search-wrap">
            <span className="search-icon"><Icon name="search" size={15} /></span>
            <input className="form-input" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36, width: 200 }} />
          </div>
          <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setEditing(null); setShowForm(true); }}>
            <Icon name="plus" size={15} />New Entry
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card"><div className="empty"><Icon name="cargo" size={40} /><h3>No cargo entries yet</h3><p>Click "New Entry" to add the first cargo record.</p></div></div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>S/N</th><th>Date</th><th>Description</th><th>Spec</th><th>Qty</th><th>Unit Price</th><th>Sender</th><th>Receiver</th><th>Payment</th><th>Amount (SSP)</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id}>
                    <td className="mono" style={{ color: "var(--muted)" }}>{i + 1}</td>
                    <td style={{ fontSize: 12 }}>{r.receivingDate || "—"}</td>
                    <td><span className="tag">{r.description || "—"}</span></td>
                    <td style={{ color: "var(--muted)", fontSize: 12 }}>{r.spec || "—"}</td>
                    <td className="mono">{r.qty || "—"}</td>
                    <td className="mono">{fmt(r.unitPrice)}</td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{r.senderName || "—"}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>{r.senderLocation || ""}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{r.receiverName || "—"}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>{r.receiverLocation || ""}</div>
                    </td>
                    <td><PayPill method={r.paymentMethod} /></td>
                    <td className="mono" style={{ color: "var(--accent)", fontWeight: 700 }}>{fmt(r.amount)}</td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}><Icon name="edit" size={13} /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => del(r.id)}><Icon name="trash" size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr style={{ background: "rgba(240,165,0,0.04)" }}>
                  <td colSpan={9} style={{ fontWeight: 700, textAlign: "right", fontSize: 13 }}>TOTAL AMOUNT</td>
                  <td className="mono" style={{ color: "var(--accent)", fontWeight: 800 }}>{fmt(total)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div className="modal-header">
              <div>
                <div className="modal-title">{editing ? "Edit Cargo Entry" : "New Cargo Entry"}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>Customer Receiving Register</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}><Icon name="close" size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Receiving Date *</label>
                  <input type="date" className="form-input" value={form.receivingDate} onChange={e => set("receivingDate", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Description / Item *</label>
                  <select className="form-select" value={form.description} onChange={e => set("description", e.target.value)}>
                    <option value="">Select type…</option>
                    {["Clothes", "M-items", "Starlink", "P-solar", "S-battery", "Electronics", "Food Items", "Documents", "Other"].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Unit / kg</label>
                  <input className="form-input" placeholder="e.g. kg" value={form.unitKg} onChange={e => set("unitKg", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit Price (SSP)</label>
                  <input type="number" className="form-input" value={form.unitPrice} onChange={e => set("unitPrice", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Qty</label>
                  <input type="number" className="form-input" value={form.qty} onChange={e => set("qty", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Spec</label>
                  <input className="form-input" placeholder="e.g. kg, pcs" value={form.spec} onChange={e => set("spec", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Sender Name *</label>
                  <input className="form-input" value={form.senderName} onChange={e => set("senderName", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Sender Location</label>
                  <input className="form-input" value={form.senderLocation} onChange={e => set("senderLocation", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Sender Contact</label>
                  <input className="form-input" value={form.senderContact} onChange={e => set("senderContact", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Receiver Name *</label>
                  <input className="form-input" value={form.receiverName} onChange={e => set("receiverName", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Receiver Location</label>
                  <input className="form-input" value={form.receiverLocation} onChange={e => set("receiverLocation", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Receiver Contact</label>
                  <input className="form-input" value={form.receiverContact} onChange={e => set("receiverContact", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select className="form-select" value={form.paymentMethod} onChange={e => set("paymentMethod", e.target.value)}>
                    {["Cash", "Mobile Money", "Bank Transfer", "Credit", "Ethiopia Birr"].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (SSP) <span style={{ color: "var(--green)", fontSize: 10 }}>Auto-calculated</span></label>
                  <input type="number" className="form-input" value={form.amount} onChange={e => set("amount", e.target.value)} style={{ borderColor: "var(--green)", opacity: 0.9 }} />
                </div>
              </div>
              {form.unitPrice && form.qty && (
                <div className="alert alert-info" style={{ marginTop: 12 }}>
                  <Icon name="check" size={14} />
                  Auto-calculated: {form.qty} × SSP {fmt(form.unitPrice)} = <strong>SSP {fmt(form.amount)}</strong>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submit}><Icon name="check" size={15} />{editing ? "Update" : "Save Entry"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TICKETING ────────────────────────────────────────────────────────────────
function Ticketing({ data, setData, toast }) {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const nextTicket = 117 + data.length;
  const emptyForm = { ticketNo: nextTicket, date: today(), passengerName: "", phone: "", fees: "", weightKg: "", checkInTime: "", departureTime: "", arrivalTime: "", from: "", to: "", flightNo: "", paymentStatus: "Paid", remarks: "" };
  const [form, setForm] = useState(emptyForm);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.passengerName || !form.from || !form.to) { toast("Fill required fields", "error"); return; }
    let updated;
    if (editing) {
      updated = data.map(r => r.id === editing ? { ...form, id: editing } : r);
      toast("Ticket updated ✓", "success");
    } else {
      updated = [...data, { ...form, id: uid("TKT") }];
      toast("Ticket saved ✓", "success");
    }
    setData(updated); await saveData(KEYS.tickets, updated);
    setShowForm(false); setEditing(null); setForm({ ...emptyForm, ticketNo: nextTicket + 1 });
  };
  const del = async (id) => { const u = data.filter(r => r.id !== id); setData(u); await saveData(KEYS.tickets, u); toast("Deleted", "error"); };
  const openEdit = (r) => { setForm(r); setEditing(r.id); setShowForm(true); };
  const filtered = data.filter(r => (r.passengerName || "").toLowerCase().includes(search.toLowerCase()) || (r.ticketNo + "").includes(search) || (r.from || "").toLowerCase().includes(search.toLowerCase()) || (r.to || "").toLowerCase().includes(search.toLowerCase()));
  const totalFees = data.reduce((s, r) => s + Number(r.fees || 0), 0);

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title">Travel Ticket Register</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>Juba Airport · {data.length} passengers · SSP {fmt(totalFees)} collected</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div className="search-wrap">
            <span className="search-icon"><Icon name="search" size={15} /></span>
            <input className="form-input" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36, width: 180 }} />
          </div>
          <button className="btn btn-primary" onClick={() => { setForm({ ...emptyForm, ticketNo: nextTicket }); setEditing(null); setShowForm(true); }}>
            <Icon name="plus" size={15} />New Ticket
          </button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="card"><div className="empty"><Icon name="ticket" size={40} /><h3>No tickets yet</h3><p>Issue the first travel ticket.</p></div></div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Ticket No.</th><th>Date</th><th>Passenger</th><th>Phone</th><th>Route</th><th>Flight</th><th>Departure</th><th>Fees (SSP)</th><th>Weight</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td className="mono" style={{ color: "var(--accent)", fontWeight: 700 }}>{r.ticketNo}</td>
                    <td style={{ fontSize: 12 }}>{r.date || "—"}</td>
                    <td style={{ fontWeight: 600 }}>{r.passengerName || "—"}</td>
                    <td style={{ fontSize: 12, color: "var(--muted)" }}>{r.phone || "—"}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                        <span style={{ color: "var(--blue)" }}>{r.from || "—"}</span>
                        <span style={{ color: "var(--muted)" }}>→</span>
                        <span style={{ color: "var(--purple)" }}>{r.to || "—"}</span>
                      </div>
                    </td>
                    <td className="mono" style={{ fontSize: 12 }}>{r.flightNo || "—"}</td>
                    <td style={{ fontSize: 12 }}>{r.departureTime || "—"}</td>
                    <td className="mono" style={{ color: "var(--green)", fontWeight: 700 }}>{fmt(r.fees)}</td>
                    <td style={{ fontSize: 12, color: "var(--muted)" }}>{r.weightKg ? `${r.weightKg} kg` : "—"}</td>
                    <td><StatusBadge status={r.paymentStatus} /></td>
                    <td><div style={{ display: "flex", gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}><Icon name="edit" size={13} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => del(r.id)}><Icon name="trash" size={13} /></button>
                    </div></td>
                  </tr>
                ))}
                <tr style={{ background: "rgba(88,166,255,0.04)" }}>
                  <td colSpan={7} style={{ fontWeight: 700, textAlign: "right" }}>TOTAL FEES COLLECTED</td>
                  <td className="mono" style={{ color: "var(--blue)", fontWeight: 800 }}>{fmt(totalFees)}</td>
                  <td colSpan={3} />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      {showForm && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div className="modal-header">
              <div><div className="modal-title">{editing ? "Edit Ticket" : "Issue New Ticket"}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>Ticket No: <strong style={{ color: "var(--accent)" }}>{form.ticketNo}</strong></div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}><Icon name="close" size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                {[
                  { k: "ticketNo", l: "Ticket No.", type: "number" },
                  { k: "date", l: "Date", type: "date" },
                  { k: "passengerName", l: "Passenger Name *" },
                  { k: "phone", l: "Phone" },
                  { k: "fees", l: "Fees (SSP)", type: "number" },
                  { k: "weightKg", l: "Weight (kg)", type: "number" },
                  { k: "from", l: "From *" },
                  { k: "to", l: "To *" },
                  { k: "flightNo", l: "Flight No." },
                  { k: "checkInTime", l: "Check-in Time" },
                  { k: "departureTime", l: "Departure Time" },
                  { k: "arrivalTime", l: "Arrival Time" },
                ].map(({ k, l, type }) => (
                  <div className="form-group" key={k}>
                    <label className="form-label">{l}</label>
                    <input type={type || "text"} className="form-input" value={form[k] || ""} onChange={e => set(k, e.target.value)} />
                  </div>
                ))}
                <div className="form-group">
                  <label className="form-label">Payment Status</label>
                  <select className="form-select" value={form.paymentStatus} onChange={e => set("paymentStatus", e.target.value)}>
                    {["Paid", "Pending", "Partial", "Cancelled"].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Remarks</label>
                  <input className="form-input" value={form.remarks || ""} onChange={e => set("remarks", e.target.value)} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submit}><Icon name="check" size={15} />{editing ? "Update" : "Issue Ticket"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── BOOKINGS ─────────────────────────────────────────────────────────────────
function Bookings({ data, setData, toast }) {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const emptyForm = { bookingDate: today(), passengerName: "", phone: "", idPassport: "", from: "", to: "", flightNo: "", departureDate: "", departureTime: "", seatClass: "Economy", luggageKg: "", fare: "", taxes: "", status: "Booked" };
  const [form, setForm] = useState(emptyForm);
  const set = (k, v) => setForm(f => {
    const nf = { ...f, [k]: v };
    if (k === "fare" || k === "taxes") nf.total = (parseFloat(k === "fare" ? v : nf.fare) || 0) + (parseFloat(k === "taxes" ? v : nf.taxes) || 0);
    return nf;
  });

  const submit = async () => {
    if (!form.passengerName || !form.from || !form.to) { toast("Fill required fields", "error"); return; }
    let updated;
    if (editing) {
      updated = data.map(r => r.id === editing ? { ...form, id: editing } : r);
      toast("Booking updated ✓", "success");
    } else {
      const bId = `BKG-${String(data.length + 1).padStart(4, "0")}`;
      updated = [...data, { ...form, id: uid("B"), bookingId: bId, total: (parseFloat(form.fare) || 0) + (parseFloat(form.taxes) || 0) }];
      toast("Booking confirmed ✓", "success");
    }
    setData(updated); await saveData(KEYS.bookings, updated);
    setShowForm(false); setEditing(null); setForm(emptyForm);
  };
  const del = async (id) => { const u = data.filter(r => r.id !== id); setData(u); await saveData(KEYS.bookings, u); toast("Deleted", "error"); };
  const openEdit = (r) => { setForm(r); setEditing(r.id); setShowForm(true); };
  const filtered = data.filter(r => (r.passengerName || "").toLowerCase().includes(search.toLowerCase()) || (r.bookingId || "").includes(search) || (r.from || "").toLowerCase().includes(search.toLowerCase()));
  const totalRev = data.reduce((s, r) => s + Number(r.total || 0), 0);

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title">Flight Booking Register</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>Juba Airport · {data.length} bookings · SSP {fmt(totalRev)}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div className="search-wrap">
            <span className="search-icon"><Icon name="search" size={15} /></span>
            <input className="form-input" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36, width: 180 }} />
          </div>
          <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setEditing(null); setShowForm(true); }}>
            <Icon name="plus" size={15} />New Booking
          </button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="card"><div className="empty"><Icon name="booking" size={40} /><h3>No bookings yet</h3><p>Create the first flight booking.</p></div></div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Booking ID</th><th>Date</th><th>Passenger</th><th>Phone</th><th>Route</th><th>Flight</th><th>Departure</th><th>Class</th><th>Fare (SSP)</th><th>Taxes</th><th>Total (SSP)</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td className="mono" style={{ color: "var(--purple)", fontWeight: 700 }}>{r.bookingId || "—"}</td>
                    <td style={{ fontSize: 12 }}>{r.bookingDate || "—"}</td>
                    <td style={{ fontWeight: 600 }}>{r.passengerName || "—"}</td>
                    <td style={{ fontSize: 12, color: "var(--muted)" }}>{r.phone || "—"}</td>
                    <td><div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                      <span style={{ color: "var(--blue)" }}>{r.from || "—"}</span>
                      <span style={{ color: "var(--muted)" }}>→</span>
                      <span style={{ color: "var(--purple)" }}>{r.to || "—"}</span>
                    </div></td>
                    <td className="mono" style={{ fontSize: 12 }}>{r.flightNo || "—"}</td>
                    <td style={{ fontSize: 12 }}>{r.departureDate ? `${r.departureDate} ${r.departureTime || ""}` : "—"}</td>
                    <td><span className="badge badge-blue">{r.seatClass || "—"}</span></td>
                    <td className="mono">{fmt(r.fare)}</td>
                    <td className="mono" style={{ color: "var(--muted)" }}>{fmt(r.taxes)}</td>
                    <td className="mono" style={{ color: "var(--purple)", fontWeight: 700 }}>{fmt(r.total)}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td><div style={{ display: "flex", gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}><Icon name="edit" size={13} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => del(r.id)}><Icon name="trash" size={13} /></button>
                    </div></td>
                  </tr>
                ))}
                <tr style={{ background: "rgba(163,113,247,0.04)" }}>
                  <td colSpan={10} style={{ fontWeight: 700, textAlign: "right" }}>TOTAL BOOKING REVENUE</td>
                  <td className="mono" style={{ color: "var(--purple)", fontWeight: 800 }}>{fmt(totalRev)}</td>
                  <td colSpan={2} />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      {showForm && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div className="modal-header">
              <div><div className="modal-title">{editing ? "Edit Booking" : "New Flight Booking"}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>Booking policy: cancellations ≥6 hrs before departure</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}><Icon name="close" size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group"><label className="form-label">Booking Date</label><input type="date" className="form-input" value={form.bookingDate} onChange={e => set("bookingDate", e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Passenger Name *</label><input className="form-input" value={form.passengerName || ""} onChange={e => set("passengerName", e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone || ""} onChange={e => set("phone", e.target.value)} /></div>
                <div className="form-group"><label className="form-label">ID / Passport</label><input className="form-input" value={form.idPassport || ""} onChange={e => set("idPassport", e.target.value)} /></div>
                <div className="form-group"><label className="form-label">From *</label><input className="form-input" value={form.from || ""} onChange={e => set("from", e.target.value)} /></div>
                <div className="form-group"><label className="form-label">To *</label><input className="form-input" value={form.to || ""} onChange={e => set("to", e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Flight No.</label><input className="form-input" value={form.flightNo || ""} onChange={e => set("flightNo", e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Departure Date</label><input type="date" className="form-input" value={form.departureDate || ""} onChange={e => set("departureDate", e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Departure Time</label><input type="time" className="form-input" value={form.departureTime || ""} onChange={e => set("departureTime", e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Seat Class</label>
                  <select className="form-select" value={form.seatClass || "Economy"} onChange={e => set("seatClass", e.target.value)}>
                    {["Economy", "Business", "First Class"].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Luggage (kg)</label><input type="number" className="form-input" value={form.luggageKg || ""} onChange={e => set("luggageKg", e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Fare (SSP)</label><input type="number" className="form-input" value={form.fare || ""} onChange={e => set("fare", e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Taxes (SSP)</label><input type="number" className="form-input" value={form.taxes || ""} onChange={e => set("taxes", e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Total (SSP) <span style={{ color: "var(--green)", fontSize: 10 }}>Auto</span></label>
                  <input type="number" className="form-input" value={form.total || ""} readOnly style={{ borderColor: "var(--green)" }} />
                </div>
                <div className="form-group"><label className="form-label">Status</label>
                  <select className="form-select" value={form.status || "Booked"} onChange={e => set("status", e.target.value)}>
                    {["Booked", "Confirmed", "Cancelled", "Pending"].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              {form.fare && <div className="alert alert-info" style={{ marginTop: 12 }}>
                <Icon name="check" size={14} />Total = Fare SSP {fmt(form.fare)} + Taxes SSP {fmt(form.taxes)} = <strong>SSP {fmt(form.total)}</strong>
              </div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submit}><Icon name="check" size={15} />{editing ? "Update" : "Confirm Booking"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── INVOICE ──────────────────────────────────────────────────────────────────
function Invoice({ cargo, tickets, bookings, toast }) {
  const [form, setForm] = useState({ type: "cargo", refId: "", invNo: `INV-${String(Date.now()).slice(-4)}`, invDate: today(), dueDate: "", taxPct: 0 });
  const [preview, setPreview] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const allRecords = { cargo, tickets, bookings };
  const refs = {
    cargo: cargo.map(r => ({ id: r.id, label: `${r.id} – ${r.senderName} → ${r.receiverName}` })),
    tickets: tickets.map(r => ({ id: r.id, label: `Ticket #${r.ticketNo} – ${r.passengerName}` })),
    bookings: bookings.map(r => ({ id: r.id, label: `${r.bookingId} – ${r.passengerName}` })),
  };

  const generate = () => {
    const rec = allRecords[form.type].find(r => r.id === form.refId);
    if (!rec) { toast("Select a valid record", "error"); return; }
    let lines = [], bill = {}, amount = 0;
    if (form.type === "cargo") {
      bill = { name: rec.senderName, phone: rec.senderContact, id: "—", route: `${rec.senderLocation} → ${rec.receiverLocation}` };
      lines = [{ desc: rec.description, date: rec.receivingDate, wt: rec.unitKg, unitPrice: rec.unitPrice, qty: rec.qty, discount: 0, amount: rec.amount }];
      amount = Number(rec.amount || 0);
    } else if (form.type === "tickets") {
      bill = { name: rec.passengerName, phone: rec.phone, id: "—", route: `${rec.from} → ${rec.to}` };
      lines = [{ desc: `Flight Ticket – ${rec.from} → ${rec.to}`, date: rec.date, wt: rec.weightKg, unitPrice: rec.fees, qty: 1, discount: 0, amount: rec.fees }];
      amount = Number(rec.fees || 0);
    } else {
      bill = { name: rec.passengerName, phone: rec.phone, id: rec.idPassport, route: `${rec.from} → ${rec.to}` };
      lines = [
        { desc: `Flight Fare – ${rec.seatClass}`, date: rec.bookingDate, wt: rec.luggageKg, unitPrice: rec.fare, qty: 1, discount: 0, amount: rec.fare },
        { desc: "Taxes & Fees", date: rec.bookingDate, wt: "—", unitPrice: rec.taxes, qty: 1, discount: 0, amount: rec.taxes },
      ];
      amount = Number(rec.total || 0);
    }
    const tax = amount * (parseFloat(form.taxPct) / 100 || 0);
    setPreview({ ...form, bill, lines, subtotal: amount, tax, grand: amount + tax, rec });
    toast("Invoice generated ✓", "success");
  };

  return (
    <div>
      <div className="section-header"><div className="section-title">Invoice Generator</div></div>
      <div className="grid-2">
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 14 }}>Generate Invoice</div>
          <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="form-group">
              <label className="form-label">Invoice No.</label>
              <input className="form-input" value={form.invNo} onChange={e => set("invNo", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Invoice Date</label>
              <input type="date" className="form-input" value={form.invDate} onChange={e => set("invDate", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input type="date" className="form-input" value={form.dueDate} onChange={e => set("dueDate", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Tax (%)</label>
              <input type="number" className="form-input" value={form.taxPct} onChange={e => set("taxPct", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Record Type</label>
              <select className="form-select" value={form.type} onChange={e => { set("type", e.target.value); set("refId", ""); }}>
                <option value="cargo">Cargo</option>
                <option value="tickets">Ticket</option>
                <option value="bookings">Booking</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Select Record</label>
              <select className="form-select" value={form.refId} onChange={e => set("refId", e.target.value)}>
                <option value="">— Choose —</option>
                {refs[form.type].map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-primary" onClick={generate} style={{ width: "100%" }}><Icon name="invoice" size={15} />Generate Invoice</button>
          </div>
          {refs[form.type].length === 0 && <div className="alert alert-info" style={{ marginTop: 12 }}><Icon name="check" size={14} />No {form.type} records yet. Add some data first.</div>}
        </div>

        {preview && (
          <div style={{ overflowY: "auto", maxHeight: 600 }}>
            <div className="invoice-paper">
              <div className="inv-header">
                <div>
                  <div className="inv-company-name">PER WAANI</div>
                  <div style={{ fontWeight: 700, fontSize: 13, marginTop: 2 }}>General Trading & Investment Co. Ltd</div>
                  <div className="inv-address">Juba Airport Road, South Sudan<br />perwaani2023@gmail.com<br />+211 (0) 920 000 149 · +211 (0) 985 719 999</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1 }}>Invoice</div>
                  <div className="inv-no">{preview.invNo}</div>
                  <div className="inv-label" style={{ marginTop: 8 }}>Date</div>
                  <div className="inv-val">{preview.invDate}</div>
                  {preview.dueDate && <><div className="inv-label">Due</div><div className="inv-val">{preview.dueDate}</div></>}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24, padding: "16px 0", borderTop: "2px solid #eee", borderBottom: "1px solid #eee" }}>
                <div>
                  <div className="inv-label">Bill To</div>
                  <div className="inv-val" style={{ fontSize: 15, marginTop: 4 }}>{preview.bill.name}</div>
                  <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{preview.bill.phone}</div>
                  <div style={{ fontSize: 12, color: "#555" }}>{preview.bill.route}</div>
                </div>
                <div>
                  <div className="inv-label">Payment Details</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}><span style={{ color: "#888" }}>Method: </span>Cash / Mobile Money</div>
                  <div style={{ fontSize: 12 }}><span style={{ color: "#888" }}>Ref: </span>{preview.invNo}</div>
                  <div style={{ fontSize: 12 }}><span style={{ color: "#888" }}>Type: </span>{form.type.charAt(0).toUpperCase() + form.type.slice(1)}</div>
                </div>
              </div>

              <table className="inv-table">
                <thead><tr><th>#</th><th>Description</th><th>Date</th><th>Wt/kg</th><th>Unit Price (SSP)</th><th>Qty</th><th>Amount (SSP)</th></tr></thead>
                <tbody>
                  {preview.lines.map((l, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{l.desc || "—"}</td>
                      <td>{l.date || "—"}</td>
                      <td>{l.wt || "—"}</td>
                      <td style={{ textAlign: "right" }}>{fmt(l.unitPrice)}</td>
                      <td style={{ textAlign: "center" }}>{l.qty || 1}</td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>{fmt(l.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr><td colSpan={6} style={{ textAlign: "right", fontSize: 12, color: "#555", paddingTop: 8 }}>Subtotal</td><td style={{ textAlign: "right", paddingTop: 8 }}>{fmt(preview.subtotal)}</td></tr>
                  <tr><td colSpan={6} style={{ textAlign: "right", fontSize: 12, color: "#555" }}>Tax ({preview.taxPct}%)</td><td style={{ textAlign: "right" }}>{fmt(preview.tax)}</td></tr>
                  <tr className="inv-total-row"><td colSpan={6} style={{ textAlign: "right" }}>GRAND TOTAL (SSP)</td><td style={{ textAlign: "right" }}>{fmt(preview.grand)}</td></tr>
                </tfoot>
              </table>
              <div className="inv-footer">Thank you for choosing Per Waani General Trading & Investment Co. Ltd.<br />This invoice is official proof of payment — please retain for your records.<br />Payment is due within 30 days. Queries: perwaani2023@gmail.com · +211 (0) 985 719 999</div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
              <button className="btn btn-primary" onClick={() => window.print()}><Icon name="print" size={15} />Print Invoice</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────
function Reports({ cargo, tickets, bookings }) {
  const cargoRev = cargo.reduce((s, r) => s + Number(r.amount || 0), 0);
  const ticketRev = tickets.reduce((s, r) => s + Number(r.fees || 0), 0);
  const bookingRev = bookings.reduce((s, r) => s + Number(r.total || 0), 0);
  const total = cargoRev + ticketRev + bookingRev;
  const txns = cargo.length + tickets.length + bookings.length;

  const target = 20000000;
  const kpis = [
    { name: "Cargo Revenue (SSP)", actual: cargoRev, target: 15000000, owner: "Operations" },
    { name: "Ticket Revenue (SSP)", actual: ticketRev, target: 5000000, owner: "Ticketing" },
    { name: "Booking Revenue (SSP)", actual: bookingRev, target: 3000000, owner: "Booking" },
    { name: "Total Transactions", actual: txns, target: 80, owner: "All Depts" },
    { name: "Combined Revenue (SSP)", actual: total, target, owner: "Finance" },
  ];

  const payBreak = {};
  cargo.forEach(r => { const p = r.paymentMethod || "Other"; if (!payBreak[p]) payBreak[p] = { txns: 0, amount: 0 }; payBreak[p].txns++; payBreak[p].amount += Number(r.amount || 0); });

  const itemBreak = {};
  cargo.forEach(r => { const d = r.description || "Other"; if (!itemBreak[d]) itemBreak[d] = { count: 0, amount: 0, wt: 0 }; itemBreak[d].count++; itemBreak[d].amount += Number(r.amount || 0); itemBreak[d].wt += Number(r.unitKg || 0); });

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title">Monthly Operations Report</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>Auto-linked from all source sheets · Generated {new Date().toLocaleDateString()}</div>
        </div>
        <button className="btn btn-secondary" onClick={() => window.print()}><Icon name="print" size={15} />Print Report</button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14, letterSpacing: 0.5 }}>A · REVENUE SUMMARY</div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Metric</th><th>Customers/Cargo</th><th>Ticketing</th><th>Booking</th><th>Total</th><th>Target (SSP)</th><th>Variance</th><th>% Achieved</th><th>Status</th></tr></thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>Total Revenue (SSP)</td>
                <td className="mono">{fmt(cargoRev)}</td>
                <td className="mono">{fmt(ticketRev)}</td>
                <td className="mono">{fmt(bookingRev)}</td>
                <td className="mono" style={{ fontWeight: 700, color: "var(--accent)" }}>{fmt(total)}</td>
                <td className="mono">{fmt(target)}</td>
                <td className="mono" style={{ color: total >= target ? "var(--green)" : "var(--red)" }}>{fmt(total - target)}</td>
                <td className="mono">{((total / target) * 100).toFixed(1)}%</td>
                <td><StatusBadge status={total >= target ? "Confirmed" : "Pending"} /></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>No. of Transactions</td>
                <td className="mono">{cargo.length}</td>
                <td className="mono">{tickets.length}</td>
                <td className="mono">{bookings.length}</td>
                <td className="mono" style={{ fontWeight: 700 }}>{txns}</td>
                <td className="mono">50</td>
                <td className="mono" style={{ color: txns >= 50 ? "var(--green)" : "var(--red)" }}>{txns - 50}</td>
                <td className="mono">{((txns / 50) * 100).toFixed(1)}%</td>
                <td><StatusBadge status={txns >= 50 ? "Confirmed" : "Pending"} /></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Avg Transaction (SSP)</td>
                <td className="mono">{fmt(txns > 0 ? total / txns : 0)}</td>
                <td colSpan={7} style={{ color: "var(--muted)", fontSize: 12 }}>Average across all modules</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>B · PAYMENT METHOD BREAKDOWN</div>
          {Object.keys(payBreak).length === 0 ? <div style={{ color: "var(--muted)", fontSize: 13 }}>No payment data yet.</div> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Method</th><th>Transactions</th><th>Amount (SSP)</th><th>% Share</th><th>Avg/Txn (SSP)</th></tr></thead>
                <tbody>
                  {Object.entries(payBreak).map(([k, v]) => (
                    <tr key={k}>
                      <td><PayPill method={k} /></td>
                      <td className="mono">{v.txns}</td>
                      <td className="mono" style={{ color: "var(--accent)" }}>{fmt(v.amount)}</td>
                      <td className="mono">{total > 0 ? ((v.amount / total) * 100).toFixed(1) : 0}%</td>
                      <td className="mono">{fmt(v.txns > 0 ? v.amount / v.txns : 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>C · CARGO ITEM BREAKDOWN</div>
          {Object.keys(itemBreak).length === 0 ? <div style={{ color: "var(--muted)", fontSize: 13 }}>No cargo data yet.</div> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Item Type</th><th>Shipments</th><th>Revenue (SSP)</th><th>Weight (kg)</th><th>% Revenue</th></tr></thead>
                <tbody>
                  {Object.entries(itemBreak).map(([k, v]) => (
                    <tr key={k}>
                      <td><span className="tag">{k}</span></td>
                      <td className="mono">{v.count}</td>
                      <td className="mono" style={{ color: "var(--accent)" }}>{fmt(v.amount)}</td>
                      <td className="mono">{fmt(v.wt)}</td>
                      <td className="mono">{cargoRev > 0 ? ((v.amount / cargoRev) * 100).toFixed(1) : 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>D · KPI SCOREBOARD</div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>KPI</th><th>Actual</th><th>Target</th><th>Variance</th><th>% Achieved</th><th>Rating</th><th>Owner</th><th>Status</th></tr></thead>
            <tbody>
              {kpis.map(k => {
                const pct = k.target > 0 ? (k.actual / k.target) : 0;
                const rating = pct >= 0.9 ? "★★★" : pct >= 0.5 ? "★★☆" : "★☆☆";
                const status = pct >= 1 ? "Confirmed" : pct >= 0.5 ? "Pending" : "Cancelled";
                return (
                  <tr key={k.name}>
                    <td style={{ fontWeight: 600 }}>{k.name}</td>
                    <td className="mono" style={{ color: "var(--accent)" }}>{fmt(k.actual)}</td>
                    <td className="mono">{fmt(k.target)}</td>
                    <td className="mono" style={{ color: k.actual >= k.target ? "var(--green)" : "var(--red)" }}>{fmt(k.actual - k.target)}</td>
                    <td className="mono">{(pct * 100).toFixed(1)}%</td>
                    <td style={{ fontSize: 16 }}>{rating}</td>
                    <td style={{ color: "var(--muted)", fontSize: 12 }}>{k.owner}</td>
                    <td><StatusBadge status={status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ textAlign: "right", marginTop: 12, fontSize: 12, color: "var(--muted)" }}>
          Per Waani General Trading & Investment Co. Ltd · perwaani2023@gmail.com · Report: {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [sideOpen, setSideOpen] = useState(true);
  const [cargo, setCargo] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    Promise.all([loadData(KEYS.cargo), loadData(KEYS.tickets), loadData(KEYS.bookings)])
      .then(([c, t, b]) => { setCargo(c); setTickets(t); setBookings(b); setLoading(false); });
  }, []);

  const showToast = useCallback((msg, type = "success") => setToast({ msg, type }), []);

  const nav = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "cargo", label: "Cargo Register", icon: "cargo" },
    { id: "ticketing", label: "Ticketing", icon: "ticket" },
    { id: "bookings", label: "Bookings", icon: "booking" },
    { id: "invoice", label: "Invoice", icon: "invoice" },
    { id: "reports", label: "Reports", icon: "report" },
  ];

  const titles = { dashboard: "Operations Dashboard", cargo: "Cargo Register", ticketing: "Ticketing", bookings: "Bookings", invoice: "Invoice", reports: "Monthly Reports" };

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <div className={`sidebar ${sideOpen ? "open" : "collapsed"}`}>
          <div className="sidebar-logo">
            <div className="logo-icon">PW</div>
            {sideOpen && <div className="logo-text">
              <div className="logo-title">Per Waani</div>
              <div className="logo-sub">Trading & Investment Co.</div>
            </div>}
          </div>
          <nav className="nav">
            <div className="nav-section" style={{ display: sideOpen ? "block" : "none" }}>Main Menu</div>
            {nav.map(n => (
              <div key={n.id} className={`nav-item ${page === n.id ? "active" : ""}`} onClick={() => { setPage(n.id); if (window.innerWidth < 768) setSideOpen(false); }}>
                <span className="icon"><Icon name={n.icon} size={18} /></span>
                {sideOpen && <span className="nav-label">{n.label}</span>}
              </div>
            ))}
          </nav>
          {sideOpen && <div className="sidebar-footer">
            <div style={{ marginBottom: 4 }}>10 Users · Shared Storage</div>
            <div><a href="mailto:omotmam2024@gmail.com">omotmam2024@gmail.com</a></div>
            <div style={{ marginTop: 4, fontSize: 10 }}>Juba Airport Road, South Sudan</div>
          </div>}
        </div>

        <div className="main" style={{ marginLeft: 0 }}>
          <div className="topbar">
            <div className="topbar-left">
              <button className="btn btn-ghost btn-sm" onClick={() => setSideOpen(p => !p)} style={{ padding: "6px 8px" }}><Icon name="menu" size={18} /></button>
              <div>
                <div className="page-title">{titles[page]}</div>
                <div className="page-sub">Per Waani General Trading & Investment Co. Ltd · Juba, South Sudan</div>
              </div>
            </div>
            <div className="topbar-right">
              <span className="badge badge-green"><Icon name="check" size={12} />Synced</span>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>{new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
            </div>
          </div>

          <div className="content">
            {loading ? (
              <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--muted)" }}>
                <div style={{ fontSize: 14 }}>Loading data…</div>
              </div>
            ) : (
              <>
                {page === "dashboard" && <Dashboard cargo={cargo} tickets={tickets} bookings={bookings} />}
                {page === "cargo" && <CargoRegister data={cargo} setData={setCargo} toast={showToast} />}
                {page === "ticketing" && <Ticketing data={tickets} setData={setTickets} toast={showToast} />}
                {page === "bookings" && <Bookings data={bookings} setData={setBookings} toast={showToast} />}
                {page === "invoice" && <Invoice cargo={cargo} tickets={tickets} bookings={bookings} toast={showToast} />}
                {page === "reports" && <Reports cargo={cargo} tickets={tickets} bookings={bookings} />}
              </>
            )}
          </div>
        </div>
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
