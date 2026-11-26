export default function manifest() {
  return {
    name: "NEWS INFO9 – Telugu Short News",
    short_name: "NEWS INFO9",
    description: "మీ ఊరు, జిల్లా, రాష్ట్ర తాజా వార్తలు 60 పదాల్లో",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a6cc4",
    theme_color: "#0a6cc4",
    lang: "te",
    categories: ["news"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  };
}
