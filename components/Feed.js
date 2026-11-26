"use client";
// NEWS INFO9 – full-screen short-news reader (Way2News / Inshorts style)
// Each story fills the screen: top half photo, bottom half news. Tap the story to show/hide menus.
import { useEffect, useMemo, useRef, useState } from "react";
import { CATS, CAT_COLORS, DISTRICTS, DIST_INDEX } from "@/lib/constants";
import { I18N } from "@/lib/i18n";

const store = {
  get(k, d) { try { const v = localStorage.getItem("ni9_" + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("ni9_" + k, JSON.stringify(v)); } catch {} }
};

const Ico = {
  menu: <svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" /></svg>,
  pin: <svg viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>,
  share: <svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" /></svg>,
  save: <svg viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4-6 4z" /></svg>,
  saved: <svg viewBox="0 0 24 24" className="fill"><path d="M6 3h12v18l-6-4-6 4z" /></svg>,
  wa: <svg viewBox="0 0 24 24" className="fill"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.6 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5.1-4.5-.1-.2-1.2-1.6-1.2-3.1s.8-2.2 1-2.5c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.3.5-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.2.1.6-.1 1.3z" /></svg>,
  home: <svg viewBox="0 0 24 24"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>,
  cog: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 14.9H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>,
  up: <svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6" /></svg>,
  close: <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
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
  const [chrome, setChrome] = useState(true); // header + bottom bar visible
  const [idx, setIdx] = useState(0);
  const [q, setQ] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [installEvt, setInstallEvt] = useState(null);
  const [, tick] = useState(0);
  const feedRef = useRef(null);
  const hideTimer = useRef(null);
  const t = k => I18N[lang][k] || k;

  useEffect(() => {
    setLang(store.get("lang", "te")); setDark(store.get("dark", false)); setFs(store.get("fs", 1));
    setDistrict(store.get("district", "kakinada")); setSaved(store.get("saved", [])); setHinted(store.get("hinted", false));
    const onInstall = e => { e.preventDefault(); setInstallEvt(e); };
    window.addEventListener("beforeinstallprompt", onInstall);
    const iv = setInterval(() => tick(x => x + 1), 60000);
    fetch("/api/news?limit=150", { cache: "no-store" }).then(r => r.json()).then(j => j.news && setNews(j.news)).catch(() => {});
    autoHide();
    return () => { window.removeEventListener("beforeinstallprompt", onInstall); clearInterval(iv); clearTimeout(hideTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark", !!dark);
    document.documentElement.style.setProperty("--fs", fs);
    document.documentElement.lang = lang;
  }, [dark, fs, lang]);

  // Menus hide by themselves after a few seconds so the story gets the full screen
  function autoHide() { clearTimeout(hideTimer.current); hideTimer.current = setTimeout(() => setChrome(false), 3500); }
  function showChrome() { setChrome(true); autoHide(); }
  function toggleChrome() { if (chrome) { clearTimeout(hideTimer.current); setChrome(false); } else showChrome(); }

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

  useEffect(() => {
    const want = new URLSearchParams(location.search).get("n");
    if (want) { const el = feedRef.current?.querySelector(`[data-id="${CSS.escape(want)}"]`); if (el) el.scrollIntoView(); }
  }, [news]);

  useEffect(() => { if (feedRef.current) feedRef.current.scrollTop = 0; setIdx(0); }, [cat, view, district]);

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
  const onScroll = () => {
    const el = feedRef.current; if (!el) return;
    const i = Math.round(el.scrollTop / el.clientHeight);
    if (i !== idx) { setIdx(i); if (chrome) { clearTimeout(hideTimer.current); setChrome(false); } }
    if (!hinted && el.scrollTop > 50) { setHinted(true); store.set("hinted", true); }
  };
  const set = (k, v, fn) => { fn(v); store.set(k, v); };
  const go = (v, c = "all") => { setView(v); setCat(c); setSheet(null); showChrome(); };

  const Photo = ({ n, i }) => {
    const [a, b] = CAT_COLORS[n.cat] || ["#0a8fd6", "#0657a8"];
    return (
      <div className="photo">
        <div className="ph" style={{ background: `linear-gradient(150deg,${a},${b})` }}>
          <img className="ph-logo" src="/logo-round.png" alt="" />
          <span className="ph-cat">{catOf(n.cat)[lang]}</span>
        </div>
        {n.image ? <img className="pic" src={n.image} alt="" loading={i < 2 ? "eager" : "lazy"} onError={e => e.currentTarget.remove()} /> : null}
        <div className="photo-shade" />
        <div className="tags">
          <span className="tag">{catOf(n.cat)[lang]}</span>
          {n.breaking && <span className="tag brk">⚡ {t("breaking")}</span>}
        </div>
      </div>
    );
  };

  return (
    <div id="app" className={chrome ? "chrome-on" : "chrome-off"}>
      {/* Top bar – overlays the photo, hides by itself */}
      <header className="topbar">
        <div className="bar">
          <button className="ib" aria-label="Menu" onClick={() => setSheet("set")}>{Ico.menu}</button>
          <div className="brand"><img src="/logo-round.png" alt="NEWS INFO9" /><span>NEWS INFO<sup>9</sup></span></div>
          <button className="loc" onClick={() => { setQ(""); setSheet("loc"); }}>{Ico.pin}<span>{distName(district) || "Location"}</span></button>
        </div>
        <nav className="cats">
          {CATS.map(c => (
            <button key={c.id} className={`cat ${c.id === cat && view === "home" ? "active" : ""}`}
              onClick={e => { go("home", c.id); e.currentTarget.scrollIntoView({ inline: "center", behavior: "smooth", block: "nearest" }); }}>
              {c[lang]}
            </button>
          ))}
        </nav>
      </header>

      <main className="feed" ref={feedRef} onScroll={onScroll}>
        {!list.length && <div className="empty" onClick={showChrome} dangerouslySetInnerHTML={{ __html: view === "saved" ? t("noSaved") : t("noNews") }} />}
        {list.map((n, i) => {
          const x = L(n), on = saved.includes(n.id);
          const initial = (n.source || "N").trim().charAt(0).toUpperCase();
          return (
            <article className="story" key={n.id} data-id={n.id}>
              <div onClick={toggleChrome}><Photo n={n} i={i} /></div>
              <div className="body" onClick={toggleChrome}>
                <h2 className="title">{x.title}</h2>
                <p className="text">{x.body}</p>
                <div className="meta">
                  <span className="avatar">{initial}</span>
                  <div className="who">
                    <b>{n.source || "NEWS INFO9"}</b>
                    <small>{ago(n.time)}{n.district && n.district !== "all" ? ` · ${distName(n.district)}` : ""}</small>
                  </div>
                  {x.full ? <button className="more" onClick={e => { e.stopPropagation(); setSheet({ story: n }); }}>{t("readMore")}</button> : null}
                </div>
              </div>
              <div className="actions">
                <button className="wa" onClick={() => shareWa(n)}>{Ico.wa}<span>{t("whatsapp")}</span></button>
                <button className="ab" onClick={() => share(n)} aria-label={t("share")}>{Ico.share}</button>
                <button className={`ab ${on ? "on" : ""}`} onClick={() => toggleSave(n)} aria-label={t("save")}>{on ? Ico.saved : Ico.save}</button>
                <span className="count">{i + 1}/{list.length}</span>
              </div>
              {i === 0 && !hinted ? <div className="swipe-hint">{t("swipe")}</div> : null}
            </article>
          );
        })}
      </main>

      {/* Bottom bar – appears with the top bar */}
      <nav className="bottomnav">
        <button className={view === "home" ? "on" : ""} onClick={() => go("home")}>{Ico.home}<small>{t("home")}</small></button>
        <button className={view === "local" ? "on" : ""} onClick={() => go("local")}>{Ico.pin}<small>{t("local")}</small></button>
        <button className={view === "saved" ? "on" : ""} onClick={() => go("saved")}>{Ico.save}<small>{t("saved")}</small></button>
        <button onClick={() => setSheet("set")}>{Ico.cog}<small>{t("settings")}</small></button>
      </nav>

      {sheet === "loc" && (
        <div className="sheet" onClick={e => e.target === e.currentTarget && setSheet(null)}>
          <div className="sheet-card">
            <div className="sheet-head"><b>{t("chooseDistrict")}</b><button className="ib dark" onClick={() => setSheet(null)}>{Ico.close}</button></div>
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
            <div className="sheet-head"><b>{t("settings")}</b><button className="ib dark" onClick={() => setSheet(null)}>{Ico.close}</button></div>
            <div className="set-row"><span>{t("language")}</span>
              <div className="seg">{[["te", "తెలుగు"], ["en", "English"]].map(([k, l]) => <button key={k} className={lang === k ? "on" : ""} onClick={() => set("lang", k, setLang)}>{l}</button>)}</div></div>
            <div className="set-row"><span>{t("darkMode")}</span>
              <label className="switch"><input type="checkbox" checked={dark} onChange={e => set("dark", e.target.checked, setDark)} /><i></i></label></div>
            <div className="set-row"><span>{t("fontSize")}</span>
              <div className="seg">{[[0.92, "A-"], [1, "A"], [1.12, "A+"]].map(([k, l]) => <button key={k} className={fs === k ? "on" : ""} onClick={() => set("fs", k, setFs)}>{l}</button>)}</div></div>
            {installEvt && <button className="wide-btn" onClick={async () => { installEvt.prompt(); try { await installEvt.userChoice; } catch {} setInstallEvt(null); }}>📲 {t("install")}</button>}
            <a className="wide-btn ghost" href="mailto:newsinfo9india@gmail.com?subject=News%20Tip">✍️ {t("sendNews")}</a>
            <a className="wide-btn ghost" href="/admin">🔐 {t("reporterLogin")}</a>
            <p className="legal">NEWS INFO9® is a registered trademark of<br /><b>Exclusive News India Private Limited</b><br />© {new Date().getFullYear()} All rights reserved · v3.0</p>
          </div>
        </div>
      )}

      {sheet && sheet.story && (() => {
        const n = sheet.story, x = L(n);
        return (
          <div className="sheet" onClick={e => e.target === e.currentTarget && setSheet(null)}>
            <div className="sheet-card tall">
              <div className="sheet-head"><b>{catOf(n.cat)[lang]}</b><button className="ib dark" onClick={() => setSheet(null)}>{Ico.close}</button></div>
              <div id="storyBody">
                {n.image ? <img src={n.image} alt="" /> : null}
                <h2>{x.title}</h2><p>{x.body}</p>
                {String(x.full || "").split(/\n+/).map((p, i) => <p key={i}>{p}</p>)}
                <p className="muted small">{ago(n.time)} · {n.source || "NEWS INFO9"}</p>
              </div>
            </div>
          </div>
        );
      })()}

      <div className={`toast ${toastMsg ? "show" : ""}`}>{toastMsg}</div>
    </div>
  );
}
