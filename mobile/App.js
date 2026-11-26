// NEWS INFO9 – React Native (Expo) app, v3 full-screen reader.
// Same backend as the website (Next.js + PostgreSQL on Vercel).
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, FlatList, Image, TouchableOpacity, TouchableWithoutFeedback, StyleSheet, Share, Linking,
  RefreshControl, Modal, ScrollView, TextInput, StatusBar, ActivityIndicator, Animated, Platform
} from "react-native";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Sharing from "expo-sharing";
import { captureRef } from "react-native-view-shot";
import Reporter from "./Reporter";

const API = Constants.expoConfig?.extra?.apiUrl || "https://newsinfo9.vercel.app";
const SITE = API.replace(/^https?:\/\//, "");
const BLUE = "#0a6cc4";
const GRAD = ["#03cdbf", "#0a8fd6", "#0657a8"];
const WA = "#1fae55";
const LOGO = require("./assets/icon.png");
const VERSION = Constants.expoConfig?.version || "3.0.0";

const CATS = [
  { id: "all", te: "అన్నీ", en: "All" }, { id: "local", te: "లోకల్", en: "Local" },
  { id: "ap", te: "ఆంధ్రప్రదేశ్", en: "Andhra Pradesh" }, { id: "ts", te: "తెలంగాణ", en: "Telangana" },
  { id: "national", te: "జాతీయం", en: "National" }, { id: "sports", te: "క్రీడలు", en: "Sports" },
  { id: "cinema", te: "సినిమా", en: "Cinema" }, { id: "business", te: "బిజినెస్", en: "Business" },
  { id: "jobs", te: "ఉద్యోగాలు", en: "Jobs" }, { id: "devotional", te: "భక్తి", en: "Devotional" }
];
const COLORS = { local: ["#0a8fd6", "#0657a8"], ap: ["#1d4ed8", "#0b2a6b"], ts: ["#db2777", "#6b0f3a"], national: ["#ea580c", "#7a2c05"], sports: ["#16a34a", "#0b4a22"], cinema: ["#7c3aed", "#3a1a75"], business: ["#0891b2", "#063f4d"], jobs: ["#ca8a04", "#5c3f02"], devotional: ["#f59e0b", "#8a3b00"] };
const DISTRICTS = [
  ["kakinada", "కాకినాడ", "Kakinada"], ["eastgodavari", "తూర్పు గోదావరి", "East Godavari"], ["konaseema", "కోనసీమ", "Konaseema"], ["westgodavari", "పశ్చిమ గోదావరి", "West Godavari"], ["eluru", "ఏలూరు", "Eluru"], ["krishna", "కృష్ణా", "Krishna"], ["ntr", "ఎన్టీఆర్", "NTR"], ["guntur", "గుంటూరు", "Guntur"], ["palnadu", "పల్నాడు", "Palnadu"], ["bapatla", "బాపట్ల", "Bapatla"], ["prakasam", "ప్రకాశం", "Prakasam"], ["nellore", "నెల్లూరు", "Nellore"], ["tirupati", "తిరుపతి", "Tirupati"], ["chittoor", "చిత్తూరు", "Chittoor"], ["annamayya", "అన్నమయ్య", "Annamayya"], ["kadapa", "వైఎస్ఆర్ కడప", "YSR Kadapa"], ["kurnool", "కర్నూలు", "Kurnool"], ["nandyal", "నంద్యాల", "Nandyal"], ["anantapur", "అనంతపురం", "Anantapur"], ["sathyasai", "శ్రీ సత్యసాయి", "Sri Sathya Sai"], ["visakhapatnam", "విశాఖపట్నం", "Visakhapatnam"], ["anakapalli", "అనకాపల్లి", "Anakapalli"], ["alluri", "అల్లూరి సీతారామరాజు", "Alluri Sitharama Raju"], ["vizianagaram", "విజయనగరం", "Vizianagaram"], ["manyam", "పార్వతీపురం మన్యం", "Parvathipuram Manyam"], ["srikakulam", "శ్రీకాకుళం", "Srikakulam"],
  ["hyderabad", "హైదరాబాద్", "Hyderabad"], ["rangareddy", "రంగారెడ్డి", "Rangareddy"], ["medchal", "మేడ్చల్", "Medchal"], ["warangal", "వరంగల్", "Warangal"], ["hanamkonda", "హనుమకొండ", "Hanamkonda"], ["karimnagar", "కరీంనగర్", "Karimnagar"], ["khammam", "ఖమ్మం", "Khammam"], ["nalgonda", "నల్గొండ", "Nalgonda"], ["nizamabad", "నిజామాబాద్", "Nizamabad"], ["adilabad", "ఆదిలాబాద్", "Adilabad"], ["mahabubnagar", "మహబూబ్‌నగర్", "Mahabubnagar"], ["sangareddy", "సంగారెడ్డి", "Sangareddy"], ["siddipet", "సిద్దిపేట", "Siddipet"], ["suryapet", "సూర్యాపేట", "Suryapet"]
];
const T = {
  te: { breaking: "బ్రేకింగ్", home: "హోమ్", local: "లోకల్", saved: "సేవ్", settings: "సెట్టింగ్స్", whatsapp: "WhatsApp", more: "పూర్తి వార్త →", empty: "వార్తలు లేవు", district: "మీ జిల్లా", language: "భాష", dark: "డార్క్ మోడ్", swipe: "తర్వాతి వార్త కోసం పైకి స్వైప్ చేయండి", ago: ["ఇప్పుడే", "ని. క్రితం", "గం. క్రితం", "రో. క్రితం"], offline: "ఇంటర్నెట్ లేదు", sendNews: "మీ ఊరి వార్త పంపండి", reporter: "రిపోర్టర్ లాగిన్", appLine: "మరిన్ని వార్తల కోసం NEWS INFO9 యాప్", making: "కార్డ్ తయారవుతోంది…" },
  en: { breaking: "Breaking", home: "Home", local: "Local", saved: "Saved", settings: "Settings", whatsapp: "WhatsApp", more: "Full story →", empty: "No news", district: "Your district", language: "Language", dark: "Dark mode", swipe: "Swipe up for the next story", ago: ["Just now", "m ago", "h ago", "d ago"], offline: "Offline", sendNews: "Send news from your area", reporter: "Reporter login", appLine: "Get more news on the NEWS INFO9 app", making: "Preparing card…" }
};
const LEGAL = [["about", "About & Contact"], ["privacy", "Privacy Policy"], ["terms", "Terms"], ["grievance", "Grievance Officer"]];

function NewsApp() {
  const ins = useSafeAreaInsets();
  const [pageH, setPageH] = useState(0);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);
  const [lang, setLang] = useState("te");
  const [dark, setDark] = useState(false);
  const [district, setDistrict] = useState("kakinada");
  const [saved, setSaved] = useState([]);
  const [cat, setCat] = useState("all");
  const [view, setView] = useState("home");
  const [sheet, setSheet] = useState(null);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const [reporterOpen, setReporterOpen] = useState(false);
  const [card, setCard] = useState(null);     // story being rendered as share card
  const [busy, setBusy] = useState(false);
  const t = T[lang];
  const C = dark
    ? { bg: "#0b0e12", card: "#14181d", ink: "#eef1f5", muted: "#9aa3ae", line: "#262c34" }
    : { bg: "#eef2f6", card: "#ffffff", ink: "#15181d", muted: "#6b7280", line: "#e5e9ef" };

  // ---- auto-hiding top/bottom bars (like the website) ----
  const chrome = useRef(new Animated.Value(1)).current;
  const [chromeOn, setChromeOn] = useState(true);
  const timer = useRef(null);
  const showChrome = useCallback((on) => {
    setChromeOn(on);
    Animated.timing(chrome, { toValue: on ? 1 : 0, duration: 220, useNativeDriver: true }).start();
    clearTimeout(timer.current);
    if (on) timer.current = setTimeout(() => showChrome(false), 3500);
  }, []);
  useEffect(() => { showChrome(true); return () => clearTimeout(timer.current); }, []);

  useEffect(() => {
    (async () => {
      try {
        const [l, d, ds, sv, cache] = await Promise.all(["lang", "dark", "district", "saved", "cache"].map(k => AsyncStorage.getItem("ni9_" + k)));
        if (l) setLang(JSON.parse(l)); if (d) setDark(JSON.parse(d)); if (ds) setDistrict(JSON.parse(ds)); if (sv) setSaved(JSON.parse(sv));
        if (cache) setNews(JSON.parse(cache));
      } catch {}
      load();
    })();
  }, []);

  const persist = (k, v) => AsyncStorage.setItem("ni9_" + k, JSON.stringify(v)).catch(() => {});
  const load = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/news?limit=150`);
      const j = await r.json();
      setNews(j.news || []); persist("cache", j.news || []); setOffline(false);
    } catch {
      setOffline(true);
      
    }
    setLoading(false); setRefreshing(false);
  }, []);

  const L = n => (n[lang]?.title ? n[lang] : n.te?.title ? n.te : n.en);
  const distName = id => { const d = DISTRICTS.find(x => x[0] === id); return d ? (lang === "te" ? d[1] : d[2]) : ""; };
  const catOf = id => CATS.find(c => c.id === id) || CATS[0];
  const ago = iso => { const m = Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000)); return m < 1 ? t.ago[0] : m < 60 ? `${m} ${t.ago[1]}` : m < 1440 ? `${Math.round(m / 60)} ${t.ago[2]}` : `${Math.round(m / 1440)} ${t.ago[3]}`; };

  const list = useMemo(() => {
    let l = news.slice().sort((a, b) => new Date(b.time) - new Date(a.time));
    if (view === "saved") return l.filter(n => saved.includes(n.id));
    if (view === "local") return l.filter(n => n.district === district || (n.cat === "local" && n.district === "all"));
    if (cat !== "all") l = l.filter(n => n.cat === cat);
    if (cat === "local") l = l.filter(n => n.district === district || n.district === "all");
    return l;
  }, [news, view, cat, district, saved]);

  const listRef = useRef(null);
  useEffect(() => { setIdx(0); listRef.current?.scrollToOffset?.({ offset: 0, animated: false }); }, [cat, view, district]);

  const url = n => `${API}/?n=${n.id}`;
  const textOf = n => { const x = L(n); return `*${x.title}*\n\n${x.body}\n\n📲 NEWS INFO9: ${url(n)}`; };
  const shareText = n => Share.share({ message: textOf(n) }).catch(() => {});
  const toggleSave = n => { const s = saved.includes(n.id) ? saved.filter(x => x !== n.id) : [...saved, n.id]; setSaved(s); persist("saved", s); };

  // ---- WhatsApp: share a full branded image card (logo + app name + photo + news + link) ----
  const cardRef = useRef(null);
  const imgDone = useRef(null);
  const shareCard = async n => {
    if (busy) return;
    setBusy(true);
    try {
      const wait = new Promise(res => { imgDone.current = res; });
      setCard(n);
      if (!n.image) setTimeout(() => imgDone.current?.(), 60);
      await Promise.race([wait, new Promise(r => setTimeout(r, 4000))]);
      await new Promise(r => setTimeout(r, 150));
      const uri = await captureRef(cardRef, { format: "png", quality: 1, width: 1080, height: 1350, result: "tmpfile" });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: "NEWS INFO9", UTI: "public.png" });
      } else {
        await shareText(n);
      }
    } catch {
      await shareText(n);
    } finally {
      setBusy(false); setCard(null);
    }
  };

  const renderItem = ({ item: n, index }) => {
    const x = L(n), on = saved.includes(n.id);
    const photoH = Math.round(pageH * 0.46);
    return (
      <TouchableWithoutFeedback onPress={() => showChrome(!chromeOn)}>
        <View style={{ height: pageH, backgroundColor: C.card }}>
          <Photo n={n} h={photoH} label={catOf(n.cat)[lang]} breaking={t.breaking} />
          <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12, overflow: "hidden" }}>
            <Text style={[s.title, { color: C.ink }]} numberOfLines={3}>{x.title}</Text>
            <Text style={[s.body, { color: C.ink }]} numberOfLines={8}>{x.body}</Text>
            {x.full ? <TouchableOpacity onPress={() => setSheet({ story: n })}><Text style={s.more}>{t.more}</Text></TouchableOpacity> : null}
            <View style={s.metaRow}>
              <View style={s.avatar}><Text style={s.avatarT}>{(n.source || "N").trim().charAt(0).toUpperCase()}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={[s.who, { color: C.ink }]} numberOfLines={1}>{n.source || "NEWS INFO9"}</Text>
                <Text style={[s.whoSub, { color: C.muted }]} numberOfLines={1}>{ago(n.time)}{n.district && n.district !== "all" ? ` · ${distName(n.district)}` : ""}</Text>
              </View>
            </View>
            {index === 0 && list.length > 1 ? (
              <View style={s.hint}><Ionicons name="chevron-up" size={13} color={C.muted} /><Text style={[s.hintT, { color: C.muted }]}>{t.swipe}</Text></View>
            ) : null}
          </View>
          <View style={[s.actions, { borderColor: C.line, backgroundColor: C.card, paddingBottom: 8 + ins.bottom }]}>
            <TouchableOpacity style={s.wa} onPress={() => shareCard(n)} activeOpacity={0.85}>
              {busy && card?.id === n.id ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="logo-whatsapp" size={17} color="#fff" />}
              <Text style={s.waT}>{t.whatsapp}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.ab, { backgroundColor: C.bg }]} onPress={() => shareText(n)}><Ionicons name="share-social-outline" size={18} color={C.muted} /></TouchableOpacity>
            <TouchableOpacity style={[s.ab, { backgroundColor: C.bg }]} onPress={() => toggleSave(n)}><Ionicons name={on ? "bookmark" : "bookmark-outline"} size={17} color={on ? BLUE : C.muted} /></TouchableOpacity>
            <Text style={[s.count, { color: C.muted }]}>{index + 1}/{list.length}</Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  const topY = chrome.interpolate({ inputRange: [0, 1], outputRange: [-140, 0] });
  const botY = chrome.interpolate({ inputRange: [0, 1], outputRange: [90, 0] });

  return (
    <View style={{ flex: 1, backgroundColor: C.card }}>
      <StatusBar barStyle="light-content" backgroundColor={GRAD[1]} translucent={false} />

      {/* hidden share card – sits under the feed so it renders but is never seen */}
      {card ? (
        <View style={s.cardHost} pointerEvents="none">
          <ShareCard refEl={cardRef} n={card} x={L(card)} catLabel={catOf(card.cat)[lang]} meta={`${card.source || "NEWS INFO9"} · ${card.district && card.district !== "all" ? distName(card.district) + " · " : ""}${ago(card.time)}`} appLine={t.appLine} onImg={() => imgDone.current?.()} />
        </View>
      ) : null}

      <View style={{ flex: 1, paddingTop: ins.top, backgroundColor: GRAD[1] }}>
        <View style={{ flex: 1, backgroundColor: C.card }} onLayout={e => setPageH(Math.round(e.nativeEvent.layout.height))}>
          {(loading && !news.length) || !pageH ? <ActivityIndicator style={{ marginTop: 120 }} color={BLUE} size="large" /> :
            <FlatList ref={listRef} data={list} keyExtractor={n => String(n.id)} renderItem={renderItem}
              pagingEnabled showsVerticalScrollIndicator={false} decelerationRate="fast"
              snapToInterval={pageH} snapToAlignment="start" disableIntervalMomentum
              getItemLayout={(_, i) => ({ length: pageH, offset: pageH * i, index: i })}
              onMomentumScrollEnd={e => setIdx(Math.round(e.nativeEvent.contentOffset.y / pageH))}
              extraData={[chromeOn, saved, busy, card, lang, dark, pageH]}
              windowSize={5} initialNumToRender={2} maxToRenderPerBatch={3}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[BLUE]} progressViewOffset={90} />}
              ListEmptyComponent={<View style={{ height: pageH, alignItems: "center", justifyContent: "center" }}><Image source={LOGO} style={{ width: 64, height: 64, borderRadius: 16, opacity: .6 }} /><Text style={{ marginTop: 10, color: C.muted }}>{t.empty}</Text></View>} />}

          {/* top bar + categories */}
          <Animated.View style={[s.chromeTop, { transform: [{ translateY: topY }] }]} pointerEvents={chromeOn ? "auto" : "none"}>
            <LinearGradient colors={GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.bar}>
              <TouchableOpacity hitSlop={10} onPress={() => setSheet("set")}><Ionicons name="menu" size={22} color="#fff" /></TouchableOpacity>
              <View style={s.brandRow}>
                <Image source={LOGO} style={s.brandLogo} />
                <Text style={s.brand}>NEWS INFO<Text style={s.nine}>9</Text></Text>
              </View>
              <TouchableOpacity style={s.loc} onPress={() => { setQ(""); setSheet("loc"); }}>
                <Ionicons name="location-outline" size={13} color="#fff" />
                <Text style={s.locT} numberOfLines={1}>{distName(district)}</Text>
              </TouchableOpacity>
            </LinearGradient>
            <View style={[s.cats, { backgroundColor: C.card, borderColor: C.line }]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 10, gap: 6, alignItems: "center" }}>
                {CATS.map(c => { const a = c.id === cat && view === "home"; return (
                  <TouchableOpacity key={c.id} onPress={() => { setCat(c.id); setView("home"); showChrome(true); }} style={[s.cat, { backgroundColor: a ? BLUE : C.bg }]}>
                    <Text style={[s.catT, { color: a ? "#fff" : C.muted, fontWeight: a ? "700" : "500" }]}>{c[lang]}</Text>
                  </TouchableOpacity>); })}
              </ScrollView>
              {offline ? <Text style={s.off}>{t.offline}</Text> : null}
            </View>
          </Animated.View>

          {/* bottom nav */}
          <Animated.View style={[s.nav, { backgroundColor: C.card, borderColor: C.line, paddingBottom: 6 + ins.bottom, transform: [{ translateY: botY }] }]} pointerEvents={chromeOn ? "auto" : "none"}>
            {[["home", "home"], ["local", "location"], ["saved", "bookmark"], ["settings", "settings"]].map(([v, ic]) => {
              const a = view === v;
              return (
                <TouchableOpacity key={v} style={s.bn} onPress={() => (v === "settings" ? setSheet("set") : (setView(v), v !== "home" && setCat("all"), showChrome(true)))}>
                  <Ionicons name={a ? ic : ic + "-outline"} size={20} color={a ? BLUE : C.muted} />
                  <Text style={[s.bnT, { color: a ? BLUE : C.muted }]}>{t[v]}</Text>
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        </View>
      </View>

      <Modal visible={!!sheet} transparent animationType="slide" onRequestClose={() => setSheet(null)}>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => setSheet(null)} />
        <View style={[s.sheet, { backgroundColor: C.card, paddingBottom: 16 + ins.bottom }]}>
          <View style={s.grab} />
          {sheet === "loc" && <>
            <SheetHead title={t.district} C={C} onClose={() => setSheet(null)} />
            <TextInput placeholder="Search…" placeholderTextColor={C.muted} value={q} onChangeText={setQ} style={[s.search, { color: C.ink, borderColor: C.line, backgroundColor: C.bg }]} />
            <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {DISTRICTS.filter(d => !q || d[1].includes(q) || d[2].toLowerCase().includes(q.toLowerCase())).map(d => {
                const a = d[0] === district;
                return (
                  <TouchableOpacity key={d[0]} onPress={() => { setDistrict(d[0]); persist("district", d[0]); setSheet(null); }}
                    style={[s.dist, { borderColor: a ? BLUE : C.line, backgroundColor: a ? "rgba(10,108,196,.08)" : "transparent" }]}>
                    <Text style={{ color: a ? BLUE : C.ink, fontWeight: a ? "700" : "400", fontSize: 13.5 }}>{lang === "te" ? d[1] : d[2]}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView></>}
          {sheet === "set" && <ScrollView>
            <SheetHead title={t.settings} C={C} onClose={() => setSheet(null)} />
            <Row label={t.language} C={C}>{[["te", "తెలుగు"], ["en", "English"]].map(([k, l]) => <Seg key={k} C={C} on={lang === k} label={l} onPress={() => { setLang(k); persist("lang", k); }} />)}</Row>
            <Row label={t.dark} C={C}>{[[false, "Off"], [true, "On"]].map(([k, l]) => <Seg key={l} C={C} on={dark === k} label={l} onPress={() => { setDark(k); persist("dark", k); }} />)}</Row>
            <TouchableOpacity style={[s.wide, { borderColor: C.line }]} onPress={() => Linking.openURL("mailto:newsinfo9india@gmail.com?subject=News%20Tip")}>
              <Ionicons name="create-outline" size={16} color={BLUE} /><Text style={s.wideT}>{t.sendNews}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.wide, { borderColor: BLUE, backgroundColor: BLUE }]} onPress={() => { setSheet(null); setReporterOpen(true); }}>
              <Ionicons name="lock-closed-outline" size={15} color="#fff" /><Text style={[s.wideT, { color: "#fff" }]}>{t.reporter}</Text>
            </TouchableOpacity>
            <View style={s.legalRow}>
              {LEGAL.map(([p, l]) => <TouchableOpacity key={p} onPress={() => Linking.openURL(`${API}/${p}`)}><Text style={s.legalLink}>{l}</Text></TouchableOpacity>)}
            </View>
            <Text style={[s.legal, { color: C.muted }]}>NEWS INFO9® is a registered trademark of{"\n"}Exclusive News India Private Limited{"\n"}© {new Date().getFullYear()} All rights reserved · v{VERSION}</Text>
          </ScrollView>}
          {sheet?.story && (() => { const x = L(sheet.story); return (
            <ScrollView style={{ maxHeight: 560 }}>
              <SheetHead title={catOf(sheet.story.cat)[lang]} C={C} onClose={() => setSheet(null)} />
              {sheet.story.image ? <Image source={{ uri: sheet.story.image }} style={{ width: "100%", height: 200, borderRadius: 12, marginBottom: 12, backgroundColor: C.bg }} resizeMode="contain" /> : null}
              <Text style={[s.title, { color: C.ink }]}>{x.title}</Text>
              <Text style={[s.body, { color: C.ink, marginBottom: 10 }]}>{x.body}</Text>
              <Text style={[s.body, { color: C.ink }]}>{x.full}</Text>
              <Text style={[s.whoSub, { color: C.muted, marginTop: 12 }]}>{sheet.story.source} · {ago(sheet.story.time)}</Text>
            </ScrollView>); })()}
        </View>
      </Modal>

      <Modal visible={reporterOpen} animationType="slide" onRequestClose={() => setReporterOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: BLUE }}>
          <Reporter api={API} C={C} districts={DISTRICTS} onClose={() => { setReporterOpen(false); load(); }} />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

// Photo area: whole photo visible (contain) over a blurred copy; logo watermark always on.
function Photo({ n, h, label, breaking }) {
  const [c1, c2] = COLORS[n.cat] || ["#0a8fd6", "#0657a8"];
  const [failed, setFailed] = useState(false);
  const has = !!n.image && !failed;
  return (
    <View style={{ height: h, backgroundColor: "#0b1a2b", overflow: "hidden" }}>
      {has ? <>
        <Image source={{ uri: n.image }} style={[StyleSheet.absoluteFill, { transform: [{ scale: 1.15 }] }]} resizeMode="cover" blurRadius={Platform.OS === "android" ? 18 : 28} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,.22)" }]} />
        <Image source={{ uri: n.image }} style={StyleSheet.absoluteFill} resizeMode="contain" onError={() => setFailed(true)} />
      </> : (
        <LinearGradient colors={[c1, c2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.ph}>
          <Image source={LOGO} style={s.phLogo} />
          <Text style={s.phT}>{label}</Text>
        </LinearGradient>
      )}
      <View style={s.tags}>
        <Text style={s.tag}>{label}</Text>
        {n.breaking ? <Text style={[s.tag, s.tagB]}>⚡ {breaking}</Text> : null}
      </View>
      <View style={s.mark}>
        <Image source={LOGO} style={s.markLogo} />
        <Text style={s.markT}>NEWS INFO<Text style={{ color: "#ffd600" }}>9</Text></Text>
      </View>
    </View>
  );
}

// 360x450 card → captured at 1080x1350 for WhatsApp / share.
function ShareCard({ refEl, n, x, catLabel, meta, appLine, onImg }) {
  const [c1, c2] = COLORS[n.cat] || ["#0a8fd6", "#0657a8"];
  return (
    <View ref={refEl} collapsable={false} style={s.card}>
      <LinearGradient colors={GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.cardHead}>
        <Image source={LOGO} style={s.cardLogo} />
        <Text style={s.cardBrand}>NEWS INFO<Text style={{ color: "#ffd600" }}>9</Text></Text>
        <Text style={s.cardCat}>{catLabel}</Text>
      </LinearGradient>
      <View style={s.cardPhoto}>
        {n.image ? <>
          <Image source={{ uri: n.image }} style={[StyleSheet.absoluteFill, { transform: [{ scale: 1.15 }] }]} resizeMode="cover" blurRadius={16} />
          <Image source={{ uri: n.image }} style={StyleSheet.absoluteFill} resizeMode="contain" onLoad={onImg} onError={onImg} />
        </> : (
          <LinearGradient colors={[c1, c2]} style={s.ph}><Image source={LOGO} style={{ width: 70, height: 70, borderRadius: 16 }} /></LinearGradient>
        )}
        <View style={[s.mark, { right: 8, bottom: 8 }]}>
          <Image source={LOGO} style={s.markLogo} /><Text style={s.markT}>NEWS INFO<Text style={{ color: "#ffd600" }}>9</Text></Text>
        </View>
      </View>
      <View style={{ flex: 1, paddingHorizontal: 14, paddingTop: 10 }}>
        <Text style={s.cardTitle} numberOfLines={3}>{x.title}</Text>
        <Text style={s.cardBody} numberOfLines={5}>{x.body}</Text>
      </View>
      <View style={s.cardFoot}>
        <Text style={s.cardMeta} numberOfLines={1}>{meta}</Text>
        <Text style={s.cardApp} numberOfLines={1}>{appLine} • {SITE}</Text>
      </View>
    </View>
  );
}

const SheetHead = ({ title, onClose, C }) => (
  <View style={s.sheetHead}>
    <Text style={[s.sheetH, { color: C.ink }]}>{title}</Text>
    <TouchableOpacity hitSlop={10} onPress={onClose} style={[s.ab, { backgroundColor: C.bg }]}><Ionicons name="close" size={17} color={C.muted} /></TouchableOpacity>
  </View>
);
const Row = ({ label, children, C }) => (
  <View style={[s.row, { borderColor: C.line }]}><Text style={{ color: C.ink, fontSize: 14 }}>{label}</Text><View style={[s.seg, { backgroundColor: C.bg }]}>{children}</View></View>
);
const Seg = ({ on, label, onPress, C }) => (
  <TouchableOpacity onPress={onPress} style={[s.segB, on && { backgroundColor: BLUE }]}>
    <Text style={{ color: on ? "#fff" : C.muted, fontSize: 12.5, fontWeight: on ? "700" : "500" }}>{label}</Text>
  </TouchableOpacity>
);

const s = StyleSheet.create({
  chromeTop: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 5, elevation: 5 },
  bar: { height: 50, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  brandLogo: { width: 26, height: 26, borderRadius: 7 },
  brand: { color: "#fff", fontSize: 18, fontWeight: "800", letterSpacing: 0.2 },
  nine: { color: "#ffd600", fontSize: 12, fontWeight: "800" },
  loc: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(255,255,255,.18)", paddingVertical: 5, paddingHorizontal: 9, borderRadius: 14, maxWidth: 130 },
  locT: { color: "#fff", fontWeight: "600", fontSize: 12 },
  cats: { height: 40, borderBottomWidth: StyleSheet.hairlineWidth, justifyContent: "center" },
  cat: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 15 },
  catT: { fontSize: 12.5 },
  off: { position: "absolute", right: 8, top: 44, fontSize: 10.5, color: "#fff", backgroundColor: "#b91c1c", paddingHorizontal: 6, borderRadius: 6, overflow: "hidden" },

  ph: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  phLogo: { width: 78, height: 78, borderRadius: 20, marginBottom: 8 },
  phT: { color: "#fff", fontSize: 15, fontWeight: "700", opacity: 0.95 },
  tags: { position: "absolute", left: 12, bottom: 10, flexDirection: "row", gap: 6 },
  tag: { backgroundColor: BLUE, color: "#fff", fontSize: 11, fontWeight: "700", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: "hidden" },
  tagB: { backgroundColor: "#ffd600", color: "#111" },
  mark: { position: "absolute", right: 10, bottom: 10, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(0,0,0,.45)", paddingVertical: 3, paddingLeft: 3, paddingRight: 7, borderRadius: 12 },
  markLogo: { width: 18, height: 18, borderRadius: 5 },
  markT: { color: "#fff", fontSize: 10.5, fontWeight: "800" },

  title: { fontSize: 18.5, fontWeight: "700", lineHeight: 27, marginBottom: 6 },
  body: { fontSize: 15, lineHeight: 25, opacity: 0.88 },
  more: { color: BLUE, fontWeight: "700", fontSize: 13, marginTop: 6 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: "auto", paddingVertical: 8 },
  avatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: BLUE, alignItems: "center", justifyContent: "center" },
  avatarT: { color: "#fff", fontWeight: "800", fontSize: 12 },
  who: { fontSize: 12.5, fontWeight: "600" },
  whoSub: { fontSize: 11 },
  hint: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingBottom: 4 },
  hintT: { fontSize: 11 },

  actions: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingTop: 7, borderTopWidth: StyleSheet.hairlineWidth },
  wa: { height: 34, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: WA, paddingHorizontal: 14, borderRadius: 17 },
  waT: { color: "#fff", fontSize: 13, fontWeight: "700" },
  ab: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  count: { marginLeft: "auto", fontSize: 11, fontWeight: "500", letterSpacing: 0.3 },

  nav: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 6, zIndex: 5, elevation: 6 },
  bn: { flex: 1, alignItems: "center", gap: 2 },
  bnT: { fontSize: 10.5, fontWeight: "600" },

  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,.45)" },
  sheet: { position: "absolute", bottom: 0, left: 0, right: 0, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 16, paddingTop: 8, maxHeight: "86%" },
  grab: { alignSelf: "center", width: 36, height: 4, borderRadius: 2, backgroundColor: "#c9d1db", marginBottom: 8 },
  sheetHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sheetH: { fontSize: 16, fontWeight: "700" },
  search: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10, fontSize: 14 },
  dist: { width: "48%", paddingVertical: 9, paddingHorizontal: 10, borderWidth: 1, borderRadius: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  seg: { flexDirection: "row", borderRadius: 16, padding: 2 },
  segB: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 14 },
  wide: { marginTop: 12, height: 42, borderRadius: 21, borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  wideT: { color: BLUE, fontWeight: "700", fontSize: 13.5 },
  legalRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", columnGap: 14, rowGap: 6, marginTop: 16 },
  legalLink: { color: BLUE, fontSize: 12 },
  legal: { textAlign: "center", fontSize: 11, marginTop: 12, lineHeight: 17 },

  cardHost: { position: "absolute", top: 0, left: 0, zIndex: -1 },
  card: { width: 360, height: 450, backgroundColor: "#fff" },
  cardHead: { height: 48, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, gap: 7 },
  cardLogo: { width: 30, height: 30, borderRadius: 8 },
  cardBrand: { color: "#fff", fontSize: 19, fontWeight: "800", flex: 1 },
  cardCat: { color: "#fff", fontSize: 11, fontWeight: "700", backgroundColor: "rgba(255,255,255,.22)", paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10, overflow: "hidden" },
  cardPhoto: { height: 188, backgroundColor: "#0b1a2b", overflow: "hidden" },
  cardTitle: { fontSize: 16.5, fontWeight: "700", lineHeight: 24, color: "#15181d", marginBottom: 4 },
  cardBody: { fontSize: 12.5, lineHeight: 19.5, color: "#333a44" },
  cardFoot: { paddingHorizontal: 14, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderColor: "#e5e9ef", backgroundColor: "#f6f9fc" },
  cardMeta: { fontSize: 10.5, color: "#6b7280" },
  cardApp: { fontSize: 11, color: BLUE, fontWeight: "700", marginTop: 2 }
});

export default function App() {
  return <SafeAreaProvider><NewsApp /></SafeAreaProvider>;
}
