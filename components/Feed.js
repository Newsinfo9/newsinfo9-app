"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { CATS, CAT_COLORS, DISTRICTS, DIST_INDEX } from "@/lib/constants";
import { I18N } from "@/lib/i18n";

const store = {
  get(k, d) { try { const v = localStorage.getItem("ni9_" + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("ni9_" + k, JSON.stringify(v)); } catch {} }
};

export default function Feed({ initialNews }) {
  const [news, setNews] = useState(initialNews || []);
  const [lang, setLang] = useState("te");
  const [dark, setDark] = useState(false);
  const [fs, setFs] = useState(1);
  const [district, setDistrict] = useState("kakinada");
  const [saved, setSaved] = useState([]);
  const [hinted, setHinted] = useState(true);
  const [cat, setCat] = useState("all");
  const [view, setView] = useState("home");
  const [sheet, setSheet] = useState(null); // 'loc' | 'set' | {story}
  const [q, setQ] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [installEvt, setInstallEvt] = useState(null);
  const [, tick] = useState(0);
  const feedRef = useRef(null);
  const t = k => I18N[lang][k] || k;

  // Load saved preferences
  useEffect(() => {
    setLang(store.get("lang", "te")); setDark(store.get("dark", false)); setFs(store.get("fs", 1));
    setDistrict(store.get("district", "kakinada")); setSaved(store.get("saved", [])); setHinted(store.get("hinted", false));
    const onInstall = e => { e.preventDefault(); setInstallEvt(e); };
    window.addEventListener("beforeinstallprompt", onInstall);
    const iv = setInterval(() => tick(x => x + 1), 60000);
    // refresh news from API
    fetch("/api/news?limit=150", { cache: "no-store" }).then(r => r.json()).then(j => j.news && setNews(j.news)).catch(() => {});
    return () => { window.removeEventListener("beforeinstallprompt", onInstall); clearInterval(iv); };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark", !!dark);
    document.documentElement.style.setProperty("--fs", fs);
    document.documentElement.lang = lang;
  }, [dark, fs, lang]);

  const toast = m => { setToastMsg(m); clearTimeout(toast.t); toast.t = setTimeout(() => setToastMsg(""), 1800); };
  const L = n => (n[lang]?.title ? n[lang] : n.te?.title ? n.te : n.en);
  const distName = id => { const d = DIST_INDEX[id]; return d ? (lang === "te" ? d[1] : d[2]) : ""; };
  const catOf = id => CATS.find(c => c.id === id) || CATS[0];
  const ago = iso => {
    const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (m < 1) return t("justNow"); if (m < 60) return `${m} ${t("minAgo")}`;
    if (m < 1440) return `${Math.round(m / 60)} ${t("hrAgo")}`; return `${Math.round(m / 1440)} ${t("dayAgo")}`;
  };

  const list = useMemo(() => {
    let l = news.slice().sort((a, b) => new Date(b.time) - new Date(a.time));
    if (view === "saved") return l.filter(n => saved.includes(n.id));
    if (view === "local") return l.filter(n => n.district === district || (n.cat === "local" && n.district === "all"));
    if (cat !== "all") l = l.filter(n => n.cat === cat);
    if (cat === "local") l = l.filter(n => n.district === district || n.district === "all");
    return l;
  }, [news, view, cat, district, saved]);

  // Deep link ?n=id
  useEffect(() => {
    const want = new URLSearchParams(location.search).get("n");
    if (want) { const el = feedRef.current?.querySelector(`[data-id="${CSS.escape(want)}"]`); if (el) el.scrollIntoView(); }
  }, [news]);

  useEffect(() => { if (feedRef.current) feedRef.current.scrollTop = 0; }, [cat, view]);

  const ticker = useMemo(() => {
    const seen = new Set();
    return news.filter(n => n.breaking).concat(news.slice(0, 3)).filter(n => !seen.has(n.id) && seen.add(n.id)).map(n => "● " + L(n).title).join("     ");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [news, lang]);

  const storyUrl = n => `${location.origin}/?n=${encodeURIComponent(n.id)}`;
  const shareWa = n => { const x = L(n); window.open("https://wa.me/?text=" + encodeURIComponent(`*${x.title}*\n\n${x.body}\n\n📲 NEWS INFO9: ${storyUrl(n)}`), "_blank"); };
  const share = async n => {
    if (navigator.share) { try { await navigator.share({ title: L(n).title, text: L(n).body, url: storyUrl(n) }); } catch {} }
    else { try { await navigator.clipboard.writeText(storyUrl(n)); toast(t("copied")); } catch {} }
  };
  const toggleSave = n => {
    const s = saved.includes(n.id) ? saved.filter(x => x !== n.id) : [...saved, n.id];
    toast(saved.includes(n.id) ? t("removed") : t("savedOk")); setSaved(s); store.set("saved", s);
  };
  const onScroll = () => { if (!hinted && feedRef.current.scrollTop > 50) { setHinted(true); store.set("hinted", true); } };
  const set = (k, v, fn) => { fn(v); store.set(k, v); };

  const Placeholder = ({ n }) => {
    const [a, b] = CAT_COLORS[n.cat] || ["#444", "#111"];
    return <div className="ph" style={{ background: `linear-gradient(135deg,${a},${b})` }}>{catOf(n.cat).icon}</div>;
  };

  return (
    <div id="app">
      <header className="topbar">
        <button className="icon-btn" aria-label="Menu" onClick={() => setSheet("set")}>☰</button>
        <div className="brand"><img src="/logo-round.png" alt="NEWS INFO9" /><span>NEWS INFO<sup>9</sup></span></div>
        <button className="loc-btn" onClick={() => { setQ(""); setSheet("loc"); }}>📍 <span>{distName(district) || "Location"}</span></button>
      </header>

      <div className="ticker"><span className="ticker-tag">{t("breaking")}</span><div className="ticker-track"><div className="ticker-text">{ticker}</div></div></div>

      <nav className="cats">
        {CATS.map(c => (
          <button key={c.id} className={`cat ${c.id === cat && view === "home" ? "active" : ""}`} onClick={e => { setCat(c.id); setView("home"); e.currentTarget.scrollIntoView({ inline: "center", behavior: "smooth", block: "nearest" }); }}>
            {c.icon} {c[lang]}
          </button>
        ))}
      </nav>

      <main className="feed" ref={feedRef} onScroll={onScroll}>
        {!list.length && <div className="empty" dangerouslySetInnerHTML={{ __html: view === "saved" ? t("noSaved") : t("noNews") }} />}
        {list.map((n, i) => {
          const x = L(n), on = saved.includes(n.id);
          return (
            <article className="card" key={n.id} data-id={n.id}>
              <div className="card-img">
                <Placeholder n={n} />
                {n.image ? <img src={n.image} alt="" loading={i < 2 ? "eager" : "lazy"} onError={e => e.currentTarget.remove()} /> : null}
                <span className="badge">{catOf(n.cat)[lang]}</span>
                {n.breaking && <span className="badge brk">⚡ {t("breaking")}</span>}
              </div>
              <div className="card-body">
                <h2 className="card-title">{x.title}</h2>
                <p className="card-text">{x.body}</p>
                {x.full ? <button className="read-more" onClick={() => setSheet({ story: n })}>{t("readMore")}</button> : null}
                <div className="card-meta">
                  <span>🕒 {ago(n.time)}</span>
                  {n.district && n.district !== "all" ? <span>📍 {distName(n.district)}</span> : null}
                  <span>✍️ {n.source || "NEWS INFO9"}</span>
                </div>
              </div>
              <div className="card-actions">
                <button className="act" onClick={() => shareWa(n)}><span>🟢</span>{t("whatsapp")}</button>
                <button className="act" onClick={() => share(n)}><span>📤</span>{t("share")}</button>
                <button className={`act ${on ? "on" : ""}`} onClick={() => toggleSave(n)}><span>{on ? "🔖" : "📑"}</span>{t("save")}</button>
              </div>
              {i === 0 && !hinted ? <div className="swipe-hint">{t("swipe")}</div> : null}
            </article>
          );
        })}
      </main>

      <nav className="bottomnav">
        {[["home", "🏠"], ["local", "📍"], ["saved", "🔖"], ["settings", "⚙️"]].map(([v, ic]) => (
          <button key={v} className={`bn ${view === v ? "active" : ""}`} onClick={() => (v === "settings" ? setSheet("set") : (setView(v), v !== "home" && setCat("all")))}>
            <span>{ic}</span><small>{t(v)}</small>
          </button>
        ))}
      </nav>

      {sheet === "loc" && (
        <div className="sheet" onClick={e => e.target === e.currentTarget && setSheet(null)}>
          <div className="sheet-card">
            <div className="sheet-head"><b>{t("chooseDistrict")}</b><button className="icon-btn" onClick={() => setSheet(null)}>✕</button></div>
            <input className="search" placeholder="Search district…" value={q} onChange={e => setQ(e.target.value)} />
            <div className="dist-list">
              {Object.entries(DISTRICTS).map(([state, ds]) => {
                const items = ds.filter(d => !q || d[1].includes(q) || d[2].toLowerCase().includes(q.toLowerCase()));
                if (!items.length) return null;
                return [<div className="dist-group" key={state}>{state}</div>, ...items.map(d => (
                  <button key={d[0]} className={`dist ${d[0] === district ? "on" : ""}`} onClick={() => { set("district", d[0], setDistrict); setSheet(null); }}>
                    {lang === "te" ? d[1] : d[2]}
                  </button>
                ))];
              })}
            </div>
          </div>
        </div>
      )}

      {sheet === "set" && (
        <div className="sheet" onClick={e => e.target === e.currentTarget && setSheet(null)}>
          <div className="sheet-card">
            <div className="sheet-head"><b>{t("settings")}</b><button className="icon-btn" onClick={() => setSheet(null)}>✕</button></div>
            <div className="set-row"><span>{t("language")}</span>
              <div className="seg">{[["te", "తెలుగు"], ["en", "English"]].map(([k, l]) => <button key={k} className={lang === k ? "on" : ""} onClick={() => set("lang", k, setLang)}>{l}</button>)}</div></div>
            <div className="set-row"><span>{t("darkMode")}</span>
              <label className="switch"><input type="checkbox" checked={dark} onChange={e => set("dark", e.target.checked, setDark)} /><i></i></label></div>
            <div className="set-row"><span>{t("fontSize")}</span>
              <div className="seg">{[[0.92, "A-"], [1, "A"], [1.12, "A+"]].map(([k, l]) => <button key={k} className={fs === k ? "on" : ""} onClick={() => set("fs", k, setFs)}>{l}</button>)}</div></div>
            {installEvt && <button className="wide-btn" onClick={async () => { installEvt.prompt(); try { await installEvt.userChoice; } catch {} setInstallEvt(null); }}>📲 {t("install")}</button>}
            <a className="wide-btn ghost" href="mailto:newsinfo9@gmail.com?subject=News%20Tip">✍️ {t("sendNews")}</a>
            <a className="wide-btn ghost" href="/admin">🔐 {t("reporterLogin")}</a>
            <p className="legal">NEWS INFO9® is a registered trademark of<br/><b>Exclusive News India Private Limited</b><br/>© {new Date().getFullYear()} All rights reserved · v2.0</p>
          </div>
        </div>
      )}

      {sheet && sheet.story && (() => {
        const n = sheet.story, x = L(n);
        return (
          <div className="sheet" onClick={e => e.target === e.currentTarget && setSheet(null)}>
            <div className="sheet-card tall">
              <div className="sheet-head"><b>{catOf(n.cat)[lang]}</b><button className="icon-btn" onClick={() => setSheet(null)}>✕</button></div>
              <div id="storyBody">
                {n.image ? <img src={n.image} alt="" /> : null}
                <h2>{x.title}</h2><p>{x.body}</p>
                {String(x.full || "").split(/\n+/).map((p, i) => <p key={i}>{p}</p>)}
                <p className="muted small">🕒 {ago(n.time)} · ✍️ {n.source || "NEWS INFO9"}</p>
              </div>
            </div>
          </div>
        );
      })()}

      <div className={`toast ${toastMsg ? "show" : ""}`}>{toastMsg}</div>
    </div>
  );
}
