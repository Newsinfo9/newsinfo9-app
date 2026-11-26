// Reporter section inside the NEWS INFO9 app.
// Reporters get login from admin (no self sign-up). Their stories go to admin as "pending";
// only after admin approval do they appear in the public feed.
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator, StyleSheet, FlatList } from "react-native";
import * as SS from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
// Secure storage on phones; plain storage on the web preview
const SecureStore = Platform.OS === "web"
  ? { getItemAsync: k => AsyncStorage.getItem(k), setItemAsync: (k, v) => AsyncStorage.setItem(k, v), deleteItemAsync: k => AsyncStorage.removeItem(k) }
  : SS;
import * as ImagePicker from "expo-image-picker";

const BLUE = "#0a6cc4";
const STATUS = { pending: ["⏳ Approval kosam", "#ca8a04"], published: ["✅ Live", "#16a34a"], rejected: ["❌ Reject", "#b91c1c"], draft: ["📝 Draft", "#6b6b6b"] };
const CATS = [["local", "📍 లోకల్"], ["ap", "🏛️ ఆంధ్రప్రదేశ్"], ["ts", "🏙️ తెలంగాణ"], ["national", "🇮🇳 జాతీయం"], ["sports", "🏏 క్రీడలు"], ["cinema", "🎬 సినిమా"], ["business", "💼 బిజినెస్"], ["jobs", "🧑‍💼 ఉద్యోగాలు"], ["devotional", "🛕 భక్తి"]];
const EMPTY = { cat: "local", title: "", body: "", full: "", image: "" };
const words = s => s.trim().split(/\s+/).filter(Boolean).length;

export default function Reporter({ api, onClose, C, districts }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("new");
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [mine, setMine] = useState([]);
  const [busy, setBusy] = useState(false);
  const [login, setLogin] = useState({ email: "", password: "" });

  useEffect(() => {
    (async () => {
      const t = await SecureStore.getItemAsync("ni9_token");
      const u = await SecureStore.getItemAsync("ni9_user");
      if (t && u) { setToken(t); setUser(JSON.parse(u)); }
    })();
  }, []);
  useEffect(() => { if (token && tab === "mine") loadMine(); }, [token, tab]);

  const call = async (path, opts = {}) => {
    const r = await fetch(api + path, { ...opts, headers: { ...(opts.headers || {}), Authorization: `Bearer ${token}` } });
    const j = await r.json().catch(() => ({}));
    if (r.status === 401) { await logout(); throw new Error("Session ayipoyindi, malli login avvandi"); }
    if (!r.ok) throw new Error(j.error || "Error");
    return j;
  };

  async function doLogin() {
    setBusy(true);
    try {
      const r = await fetch(api + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(login) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      await SecureStore.setItemAsync("ni9_token", j.token);
      await SecureStore.setItemAsync("ni9_user", JSON.stringify(j.user));
      setToken(j.token); setUser(j.user); setLogin({ email: "", password: "" });
    } catch (e) { Alert.alert("Login", e.message); }
    setBusy(false);
  }
  async function logout() {
    await SecureStore.deleteItemAsync("ni9_token"); await SecureStore.deleteItemAsync("ni9_user");
    setToken(null); setUser(null);
  }
  async function loadMine() {
    try { const j = await call("/api/news?mine=1"); setMine(j.news || []); } catch (e) { Alert.alert("", e.message); }
  }
  async function pickPhoto(fromCamera) {
    const perm = fromCamera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert("", "Permission ivvandi");
    const res = await (fromCamera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync)({ quality: 0.7, allowsEditing: true, aspect: [16, 10] });
    if (res.canceled) return;
    const a = res.assets[0];
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", { uri: a.uri, name: a.fileName || "photo.jpg", type: a.mimeType || "image/jpeg" });
      const j = await call("/api/upload", { method: "POST", body: fd });
      setForm(f => ({ ...f, image: j.url }));
    } catch (e) { Alert.alert("Photo", e.message); }
    setBusy(false);
  }
  async function submit() {
    if (!form.title.trim() || !form.body.trim()) return Alert.alert("", "Title & vartha ivvandi");
    if (words(form.body) > 70) return Alert.alert("", "Vartha 60 padalalo undali");
    setBusy(true);
    try {
      const body = JSON.stringify({ cat: form.cat, district: user.district || "all", image: form.image, source: user.name, te: { title: form.title, body: form.body, full: form.full } });
      await call(editId ? `/api/news/${editId}` : "/api/news", { method: editId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body });
      Alert.alert("✅", "Vartha admin approval kosam pampam. Approve ayyaka app lo kanipistundi.");
      setForm(EMPTY); setEditId(null); setTab("mine");
    } catch (e) { Alert.alert("", e.message); }
    setBusy(false);
  }

  const Head = ({ title }) => (
    <View style={st.head}>
      <TouchableOpacity onPress={onClose}><Text style={{ color: "#fff", fontSize: 22 }}>←</Text></TouchableOpacity>
      <Text style={st.headT}>{title}</Text>
      {user ? <TouchableOpacity onPress={logout}><Text style={{ color: "#fff" }}>Logout</Text></TouchableOpacity> : <View style={{ width: 40 }} />}
    </View>
  );

  if (!token) return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Head title="రిపోర్టర్ లాగిన్" />
      <View style={{ padding: 20 }}>
        <Image source={require("./assets/icon.png")} style={{ width: 90, height: 90, borderRadius: 20, alignSelf: "center", marginBottom: 16 }} />
        <Text style={{ color: C.muted, textAlign: "center", marginBottom: 16 }}>NEWS INFO9 reporters matrame. Login details admin istaru.</Text>
        <TextInput placeholder="Email" placeholderTextColor={C.muted} autoCapitalize="none" keyboardType="email-address" value={login.email} onChangeText={v => setLogin({ ...login, email: v })} style={[st.in, { color: C.ink, borderColor: C.line, backgroundColor: C.card }]} />
        <TextInput placeholder="Password" placeholderTextColor={C.muted} secureTextEntry value={login.password} onChangeText={v => setLogin({ ...login, password: v })} style={[st.in, { color: C.ink, borderColor: C.line, backgroundColor: C.card }]} />
        <TouchableOpacity style={st.btn} onPress={doLogin} disabled={busy}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={st.btnT}>Login</Text>}</TouchableOpacity>
      </View>
    </View>
  );

  const distName = id => (districts.find(d => d[0] === id) || [, "All"])[1];
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Head title={`👤 ${user.name}`} />
      <View style={{ flexDirection: "row", backgroundColor: C.card }}>
        {[["new", editId ? "✏️ Edit" : "➕ కొత్త వార్త"], ["mine", "📋 నా వార్తలు"]].map(([k, l]) => (
          <TouchableOpacity key={k} onPress={() => setTab(k)} style={[st.tab, tab === k && { borderColor: BLUE }]}><Text style={{ color: tab === k ? BLUE : C.muted, fontWeight: "700" }}>{l}</Text></TouchableOpacity>
        ))}
      </View>

      {tab === "new" ? (
        <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          <Text style={[st.lb, { color: C.muted }]}>📍 District: {distName(user.district)}</Text>
          <Text style={[st.lb, { color: C.muted }]}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {CATS.map(([id, l]) => <TouchableOpacity key={id} onPress={() => setForm({ ...form, cat: id })} style={[st.chip, { borderColor: form.cat === id ? BLUE : C.line, backgroundColor: form.cat === id ? BLUE : C.card }]}><Text style={{ color: form.cat === id ? "#fff" : C.ink }}>{l}</Text></TouchableOpacity>)}
          </ScrollView>
          <Text style={[st.lb, { color: C.muted }]}>శీర్షిక (Title)</Text>
          <TextInput value={form.title} onChangeText={v => setForm({ ...form, title: v })} maxLength={150} style={[st.in, { color: C.ink, borderColor: C.line, backgroundColor: C.card }]} />
          <Text style={[st.lb, { color: C.muted }]}>వార్త (60 పదాలు) — {words(form.body)}/60</Text>
          <TextInput value={form.body} onChangeText={v => setForm({ ...form, body: v })} multiline style={[st.in, st.ta, { color: C.ink, borderColor: words(form.body) > 60 ? "#b91c1c" : C.line, backgroundColor: C.card }]} />
          <Text style={[st.lb, { color: C.muted }]}>పూర్తి వార్త (optional)</Text>
          <TextInput value={form.full} onChangeText={v => setForm({ ...form, full: v })} multiline style={[st.in, st.ta, { color: C.ink, borderColor: C.line, backgroundColor: C.card }]} />
          <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
            <TouchableOpacity style={[st.btn2, { borderColor: BLUE }]} onPress={() => pickPhoto(true)}><Text style={{ color: BLUE, fontWeight: "700" }}>📷 Camera</Text></TouchableOpacity>
            <TouchableOpacity style={[st.btn2, { borderColor: BLUE }]} onPress={() => pickPhoto(false)}><Text style={{ color: BLUE, fontWeight: "700" }}>🖼️ Gallery</Text></TouchableOpacity>
          </View>
          {form.image ? <Image source={{ uri: form.image }} style={{ width: "100%", height: 180, borderRadius: 10, marginTop: 10 }} /> : null}
          <TouchableOpacity style={[st.btn, { marginTop: 18 }]} onPress={submit} disabled={busy}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={st.btnT}>Approval ki pampu</Text>}</TouchableOpacity>
          {editId ? <TouchableOpacity onPress={() => { setEditId(null); setForm(EMPTY); }}><Text style={{ textAlign: "center", color: C.muted, marginTop: 12 }}>Cancel edit</Text></TouchableOpacity> : null}
        </ScrollView>
      ) : (
        <FlatList data={mine} keyExtractor={n => n.id} onRefresh={loadMine} refreshing={false} contentContainerStyle={{ padding: 12 }}
          ListEmptyComponent={<Text style={{ textAlign: "center", color: C.muted, marginTop: 40 }}>Inka vartalu pampaledu</Text>}
          renderItem={({ item: n }) => {
            const [label, color] = STATUS[n.status] || [n.status, "#666"];
            return (
              <View style={[st.card, { backgroundColor: C.card, borderColor: C.line }]}>
                <Text style={{ color, fontWeight: "700", marginBottom: 4 }}>{label}</Text>
                <Text style={{ color: C.ink, fontWeight: "700", fontSize: 16 }}>{n.te.title || n.en.title}</Text>
                <Text style={{ color: C.muted, marginTop: 4 }} numberOfLines={3}>{n.te.body || n.en.body}</Text>
                {n.status === "rejected" && n.rejectReason ? <Text style={{ color: "#b91c1c", marginTop: 6 }}>Reason: {n.rejectReason}</Text> : null}
                {["pending", "rejected"].includes(n.status) ? (
                  <TouchableOpacity onPress={() => { setEditId(n.id); setForm({ cat: n.cat, title: n.te.title, body: n.te.body, full: n.te.full, image: n.image }); setTab("new"); }}>
                    <Text style={{ color: BLUE, fontWeight: "700", marginTop: 8 }}>✏️ Edit & resend</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          }} />
      )}
    </View>
  );
}

const st = StyleSheet.create({
  head: { height: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, backgroundColor: BLUE },
  headT: { color: "#fff", fontSize: 17, fontWeight: "700" },
  tab: { flex: 1, alignItems: "center", paddingVertical: 12, borderBottomWidth: 3, borderColor: "transparent" },
  lb: { fontSize: 13, fontWeight: "600", marginTop: 12, marginBottom: 6 },
  in: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 4 },
  ta: { minHeight: 110, textAlignVertical: "top" },
  chip: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1 },
  btn: { backgroundColor: BLUE, padding: 14, borderRadius: 10, alignItems: "center", marginTop: 10 },
  btnT: { color: "#fff", fontWeight: "700", fontSize: 16 },
  btn2: { flex: 1, borderWidth: 1.5, borderRadius: 10, padding: 12, alignItems: "center" },
  card: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 10 }
});
