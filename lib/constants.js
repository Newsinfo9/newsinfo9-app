// Shared data used by website, admin and API
export const CATS = [
  { id: "all", te: "అన్నీ", en: "All", icon: "📰" },
  { id: "local", te: "లోకల్", en: "Local", icon: "📍" },
  { id: "ap", te: "ఆంధ్రప్రదేశ్", en: "Andhra Pradesh", icon: "🏛️" },
  { id: "ts", te: "తెలంగాణ", en: "Telangana", icon: "🏙️" },
  { id: "national", te: "జాతీయం", en: "National", icon: "🇮🇳" },
  { id: "sports", te: "క్రీడలు", en: "Sports", icon: "🏏" },
  { id: "cinema", te: "సినిమా", en: "Cinema", icon: "🎬" },
  { id: "business", te: "బిజినెస్", en: "Business", icon: "💼" },
  { id: "jobs", te: "ఉద్యోగాలు", en: "Jobs", icon: "🧑‍💼" },
  { id: "devotional", te: "భక్తి", en: "Devotional", icon: "🛕" }
];

export const CAT_COLORS = {
  local: ["#0a8fd6", "#0657a8"], ap: ["#1d4ed8", "#0b2a6b"], ts: ["#db2777", "#6b0f3a"],
  national: ["#ea580c", "#7a2c05"], sports: ["#16a34a", "#0b4a22"], cinema: ["#7c3aed", "#3a1a75"],
  business: ["#0891b2", "#063f4d"], jobs: ["#ca8a04", "#5c3f02"], devotional: ["#f59e0b", "#8a3b00"]
};

export const DISTRICTS = {
  "Andhra Pradesh": [
    ["kakinada", "కాకినాడ", "Kakinada"], ["eastgodavari", "తూర్పు గోదావరి", "East Godavari"], ["konaseema", "కోనసీమ", "Konaseema"],
    ["westgodavari", "పశ్చిమ గోదావరి", "West Godavari"], ["eluru", "ఏలూరు", "Eluru"], ["krishna", "కృష్ణా", "Krishna"],
    ["ntr", "ఎన్టీఆర్", "NTR"], ["guntur", "గుంటూరు", "Guntur"], ["palnadu", "పల్నాడు", "Palnadu"], ["bapatla", "బాపట్ల", "Bapatla"],
    ["prakasam", "ప్రకాశం", "Prakasam"], ["nellore", "నెల్లూరు", "Nellore"], ["tirupati", "తిరుపతి", "Tirupati"],
    ["chittoor", "చిత్తూరు", "Chittoor"], ["annamayya", "అన్నమయ్య", "Annamayya"], ["kadapa", "వైఎస్ఆర్ కడప", "YSR Kadapa"],
    ["kurnool", "కర్నూలు", "Kurnool"], ["nandyal", "నంద్యాల", "Nandyal"], ["anantapur", "అనంతపురం", "Anantapur"],
    ["sathyasai", "శ్రీ సత్యసాయి", "Sri Sathya Sai"], ["visakhapatnam", "విశాఖపట్నం", "Visakhapatnam"], ["anakapalli", "అనకాపల్లి", "Anakapalli"],
    ["alluri", "అల్లూరి సీతారామరాజు", "Alluri Sitharama Raju"], ["vizianagaram", "విజయనగరం", "Vizianagaram"],
    ["manyam", "పార్వతీపురం మన్యం", "Parvathipuram Manyam"], ["srikakulam", "శ్రీకాకుళం", "Srikakulam"]
  ],
  "Telangana": [
    ["hyderabad", "హైదరాబాద్", "Hyderabad"], ["rangareddy", "రంగారెడ్డి", "Rangareddy"], ["medchal", "మేడ్చల్", "Medchal"],
    ["warangal", "వరంగల్", "Warangal"], ["hanamkonda", "హనుమకొండ", "Hanamkonda"], ["karimnagar", "కరీంనగర్", "Karimnagar"],
    ["khammam", "ఖమ్మం", "Khammam"], ["nalgonda", "నల్గొండ", "Nalgonda"], ["nizamabad", "నిజామాబాద్", "Nizamabad"],
    ["adilabad", "ఆదిలాబాద్", "Adilabad"], ["mahabubnagar", "మహబూబ్‌నగర్", "Mahabubnagar"], ["sangareddy", "సంగారెడ్డి", "Sangareddy"],
    ["siddipet", "సిద్దిపేట", "Siddipet"], ["suryapet", "సూర్యాపేట", "Suryapet"]
  ]
};

export const DIST_INDEX = Object.fromEntries(Object.values(DISTRICTS).flat().map(d => [d[0], d]));
export const CAT_IDS = CATS.map(c => c.id).filter(id => id !== "all");
