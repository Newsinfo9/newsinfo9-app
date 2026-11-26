"use client";
import { useEffect, useState } from "react";
import { CATS, DISTRICTS, DIST_INDEX } from "@/lib/constants";

const EMPTY = { cat: "local", district: "kakinada", breaking: false, image: "", source: "", status: "published", te: { title: "", body: "", full: "" }, en: { title: "", body: "", full: "" } };
const words = s => (s || "").trim().split(/\s+/).filter(Boolean).length;
const STATUS_LABEL = { pending: "⏳ Pending", published: "✅ Live", rejected: "❌ Rejected", draft: "📝 Draft" };

function DistSelect({ value, onChange, withAll }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}>
      {withAll && <option value="all">All (రాష్ట్రం/దేశం)</option>}
      {Object.entries(DISTRICTS).map(([s, ds]) => <optgroup key={s} label={s}>{ds.map(d => <option key={d[0]} value={d[0]}>{d[2]} – {d[1]}</option>)}</optgroup>)}
    </select>
  );
}
const Count = ({ v, max }) => <div className={`cnt ${words(v) > max ? "over" : ""}`}>{words(v)} / {max} words</div>;

export default function Admin() {
  const [me, setMe] = useState(undefined);
  const [db, setDb] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [setup, setSetup] = useState({ name: "", email: "", password: "" });
  const [users, setUsers] = useState([]);
  const [news, setNews] = useState([]);
  const [pending, setPending] = useState(0);
  const [tab, setTab] = useState("pending");
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [login, setLogin] = useState({ email: "", password: "" });
  const [rep, setRep] = useState({ name: "", email: "", phone: "", password: "", district: "kakinada" });

  async function loadMe() {
    const j = await fetch("/api/auth/me", { cache: "no-store" }).then(r => r.json());
    setMe(j.user); setDb(j.db); setUsers(j.users || []); setNeedsSetup(!!j.needsSetup);
    if (j.user) { if (j.user.role !== "admin") setTab("mine"); loadNews(j.user.role === "admin" ? "pending" : "mine"); }
  }
  async function loadNews(t = tab) {
    const q = t === "mine" ? "mine=1" : t === "pending" ? "all=1&status=pending" : "all=1";
    const j = await fetch(`/api/news?${q}&limit=300`, { cache: "no-store" }).then(r => r.json());
    setNews(j.news || []); if (j.pending != null) setPending(j.pending);
  }
  useEffect(() => { loadMe(); }, []);
  useEffect(() => { if (me && ["pending", "all", "mine"].includes(tab)) loadNews(tab); /* eslint-disable-next-line */ }, [tab]);

  async function doLogin(e) {
    e.preventDefault(); setMsg("");
    const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(login) });
    const j = await r.json(); if (!r.ok) return setMsg(j.error); loadMe();
  }
  async function doSetup(e) {
    e.preventDefault(); setMsg("");
    const r = await fetch("/api/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(setup) });
    const j = await r.json(); if (!r.ok) return setMsg(j.error); loadMe();
  }
  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); setMe(null); }

  const up = (path, v) => setForm(f => { const n = structuredClone(f); const k = path.split("."); let o = n; while (k.length > 1) o = o[k.shift()]; o[k[0]] = v; return n; });

  async function upload(file) {
    if (!file) return; setBusy(true); setMsg("");
    const fd = new FormData(); fd.append("file", file);
    const r = await fetch("/api/upload", { method: "POST", body: fd }); const j = await r.json(); setBusy(false);
    if (!r.ok) return setMsg(j.error); up("image", j.url);
  }
  async function save(e) {
    e.preventDefault(); setMsg("");
    if (!form.te.title && !form.en.title) return setMsg("Telugu leda English title ivvandi");
    setBusy(true);
    const r = await fetch(editId ? `/api/news/${editId}` : "/api/news", { method: editId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const j = await r.json(); setBusy(false);
    if (!r.ok) return setMsg(j.error || "Error");
    setMsg(me.role === "admin" ? (editId ? "✅ Update ayyindi" : "✅ Vartha live ayyindi") : "✅ Admin approval kosam pampam");
    setForm(EMPTY); setEditId(null); setTab(me.role === "admin" ? "all" : "mine");
  }
  async function moderate(id, action) {
    let reason = "";
    if (action === "reject") { reason = prompt("Reject reason (reporter ki kanipistundi):", "Vivaralu sariga levu"); if (reason === null) return; }
    const r = await fetch(`/api/news/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, reason }) });
    if (!r.ok) return setMsg((await r.json()).error);
    setMsg(action === "approve" ? "✅ Approve ayyindi – app lo live" : action === "reject" ? "❌ Reject chesaru" : "Unpublish ayyindi");
    loadNews();
  }
  async function del(id) {
    if (!confirm("Ee vartha delete cheyala? Tirigi raadu.")) return;
    const r = await fetch(`/api/news/${id}`, { method: "DELETE" });
    if (!r.ok) return setMsg((await r.json()).error); loadNews();
  }
  async function addReporter(e) {
    e.preventDefault(); setMsg("");
    const r = await fetch("/api/auth/me", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...rep, role: "reporter" }) });
    const j = await r.json(); if (!r.ok) return setMsg(j.error);
    setMsg(`✅ Reporter add ayyaru. App lo login: ${rep.email} / (meeru ichina password)`); setRep({ name: "", email: "", phone: "", password: "", district: "kakinada" }); loadMe();
  }
  async function toggleUser(u) {
    await fetch("/api/auth/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: u.id, active: !u.active }) }); loadMe();
  }

  if (me === undefined) return <div className="adm">Loading…</div>;

  if (!me) return (
    <div className="adm" style={{ maxWidth: 420 }}>
      <h1><span className="brandrow"><img src="/logo-round.png" alt="" /> NEWS INFO9 Admin</span></h1>
      {needsSetup && (
        <form className="box" onSubmit={doSetup}>
          <b>🛠️ First-time setup – Admin account create cheyandi</b>
          <label>Name</label><input value={setup.name} onChange={e => setSetup({ ...setup, name: e.target.value })} required />
          <label>Admin email</label><input type="email" value={setup.email} onChange={e => setSetup({ ...setup, email: e.target.value })} required />
          <label>Password (min 8)</label><input type="password" value={setup.password} onChange={e => setSetup({ ...setup, password: e.target.value })} required minLength={8} />
          <div style={{ marginTop: 14 }}><button className="btn">Create admin</button></div>
          {msg && <div className="err">{msg}</div>}
        </form>
      )}
      {!db && <div className="note">⚠️ Database inka connect avvaledu. Vercel → Storage → Postgres (Neon) connect chesi, ADMIN_EMAIL / ADMIN_PASSWORD / AUTH_SECRET environment variables add cheyandi.</div>}
      {!needsSetup && <form className="box" onSubmit={doLogin}>
        <label>Email</label><input type="email" value={login.email} onChange={e => setLogin({ ...login, email: e.target.value })} required />
        <label>Password</label><input type="password" value={login.password} onChange={e => setLogin({ ...login, password: e.target.value })} required />
        <div style={{ marginTop: 14 }}><button className="btn">Login</button> <a className="btn g" href="/">← Website</a></div>
        {msg && <div className="err">{msg}</div>}
      </form>}
      <p className="legal">NEWS INFO9® · Exclusive News India Private Limited</p>
    </div>
  );

  const isAdmin = me.role === "admin";
  const tabs = isAdmin
    ? [["pending", <>⏳ Approvals{pending ? <span className="num">{pending}</span> : null}</>], ["all", "📋 All news"], ["new", editId ? "✏️ Edit" : "➕ Add news"], ["reporters", `👥 Reporters (${users.filter(u => u.role === "reporter").length})`]]
    : [["mine", "📋 Naa vartalu"], ["new", editId ? "✏️ Edit" : "➕ Kotha vartha"]];

  return (
    <div className="adm">
      <h1>
        <span className="brandrow"><img src="/logo-round.png" alt="" /> NEWS INFO9 {isAdmin ? "Admin" : "Reporter"}</span>
        <span style={{ fontSize: 13, fontWeight: 400 }}>{me.name} <button className="btn g sm" onClick={logout}>Logout</button> <a className="btn g sm" href="/" target="_blank">App ↗</a></span>
      </h1>
      <div className="tabs">{tabs.map(([k, l]) => <button key={k} className={`tab ${tab === k ? "on" : ""}`} onClick={() => { setMsg(""); setTab(k); }}>{l}</button>)}</div>
      {msg && <div className="note">{msg}</div>}

      {["pending", "all", "mine"].includes(tab) && (
        <div className="box">
          {!news.length && <p className="muted">{tab === "pending" ? "Approval kosam vartalu levu 👍" : "Vartalu levu"}</p>}
          {news.map(n => (
            <div className="pv" key={n.id}>
              {n.image ? <img src={n.image} alt="" /> : null}
              <div className="tx">
                <div><span className="pill">{STATUS_LABEL[n.status] || n.status}</span> <span className="pill">{n.cat}</span> <span className="pill">📍 {DIST_INDEX[n.district]?.[2] || "All"}</span> {n.breaking && <span className="pill">⚡</span>}</div>
                <b>{n.te.title || n.en.title}</b>
                <div className="muted">{n.te.body || n.en.body}</div>
                <small className="muted">✍️ {n.authorName || n.source} · {new Date(n.time).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</small>
                {n.status === "rejected" && n.rejectReason && <div className="err">Reason: {n.rejectReason}</div>}
                <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                  {isAdmin && n.status !== "published" && <button className="btn sm ok" onClick={() => moderate(n.id, "approve")}>✔ Approve</button>}
                  {isAdmin && n.status === "pending" && <button className="btn sm no" onClick={() => moderate(n.id, "reject")}>✖ Reject</button>}
                  {isAdmin && n.status === "published" && <button className="btn g sm" onClick={() => moderate(n.id, "unpublish")}>Unpublish</button>}
                  {(isAdmin || ["pending", "rejected"].includes(n.status)) && <button className="btn g sm" onClick={() => { setEditId(n.id); setForm({ ...EMPTY, ...n }); setTab("new"); }}>Edit</button>}
                  {(isAdmin || n.status !== "published") && <button className="btn g sm" onClick={() => del(n.id)}>Delete</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "new" && (
        <form className="box" onSubmit={save}>
          {!isAdmin && <div className="note">Meeru pampina vartha admin approve chesina tarvate app lo kanipistundi.</div>}
          <div className="row">
            <div><label>Category</label><select value={form.cat} onChange={e => up("cat", e.target.value)}>{CATS.filter(c => c.id !== "all").map(c => <option key={c.id} value={c.id}>{c.icon} {c.en} – {c.te}</option>)}</select></div>
            <div><label>District</label><DistSelect value={form.district} onChange={v => up("district", v)} withAll /></div>
          </div>
          <label>తెలుగు శీర్షిక (Title)</label><input value={form.te.title} onChange={e => up("te.title", e.target.value)} maxLength={150} />
          <label>తెలుగు వార్త (60 పదాలు)</label><textarea value={form.te.body} onChange={e => up("te.body", e.target.value)} /><Count v={form.te.body} max={60} />
          <label>పూర్తి వార్త (optional)</label><textarea value={form.te.full} onChange={e => up("te.full", e.target.value)} />
          <label>English Title (optional)</label><input value={form.en.title} onChange={e => up("en.title", e.target.value)} maxLength={150} />
          <label>English short news (60 words)</label><textarea value={form.en.body} onChange={e => up("en.body", e.target.value)} /><Count v={form.en.body} max={60} />
          <div className="row">
            <div><label>Photo</label><input type="file" accept="image/*" onChange={e => upload(e.target.files[0])} /><input placeholder="leda image URL paste cheyandi" value={form.image} onChange={e => up("image", e.target.value)} style={{ marginTop: 6 }} /></div>
            <div><label>Reporter / Source</label><input value={form.source} onChange={e => up("source", e.target.value)} placeholder={me.name} /></div>
          </div>
          {form.image && <img src={form.image} alt="" style={{ maxWidth: 200, marginTop: 8, borderRadius: 8 }} />}
          {isAdmin && (
            <div className="row" style={{ alignItems: "end" }}>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" style={{ width: "auto" }} checked={form.breaking} onChange={e => up("breaking", e.target.checked)} /> ⚡ Breaking news</label>
              <div><label>Status</label><select value={form.status === "draft" ? "draft" : "published"} onChange={e => up("status", e.target.value)}><option value="published">Publish now</option><option value="draft">Draft</option></select></div>
            </div>
          )}
          <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
            <button className="btn" disabled={busy}>{busy ? "Saving…" : isAdmin ? (editId ? "Update" : "Publish") : "Approval ki pampu"}</button>
            {editId && <button type="button" className="btn g" onClick={() => { setEditId(null); setForm(EMPTY); }}>Cancel</button>}
          </div>
        </form>
      )}

      {tab === "reporters" && isAdmin && (
        <>
          <div className="box">
            {users.map(u => (
              <div className="item" key={u.id}>
                <b>{u.name}</b><small>{u.email}{u.phone ? ` · ${u.phone}` : ""}</small>
                <span className="pill">{u.role}</span><span className="pill">📍 {DIST_INDEX[u.district]?.[2] || "All"}</span><span className="pill">{u.stories} news</span>
                {u.role !== "admin" && <button className={`btn sm ${u.active ? "no" : "ok"}`} onClick={() => toggleUser(u)}>{u.active ? "Block" : "Unblock"}</button>}
              </div>
            ))}
          </div>
          <form className="box" onSubmit={addReporter}>
            <b>➕ Kotha reporter (app login ivvadaniki)</b>
            <div className="row">
              <div><label>Name</label><input value={rep.name} onChange={e => setRep({ ...rep, name: e.target.value })} required /></div>
              <div><label>Phone</label><input value={rep.phone} onChange={e => setRep({ ...rep, phone: e.target.value })} /></div>
              <div><label>Login email</label><input type="email" value={rep.email} onChange={e => setRep({ ...rep, email: e.target.value })} required /></div>
              <div><label>Password (min 6)</label><input type="text" value={rep.password} onChange={e => setRep({ ...rep, password: e.target.value })} required /></div>
              <div><label>District</label><DistSelect value={rep.district} onChange={v => setRep({ ...rep, district: v })} /></div>
            </div>
            <div style={{ marginTop: 14 }}><button className="btn">Add reporter</button></div>
          </form>
        </>
      )}
    </div>
  );
}
