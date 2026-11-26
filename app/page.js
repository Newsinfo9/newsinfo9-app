import Feed from "@/components/Feed";
import { listNews, getNews } from "@/lib/db";

export const revalidate = 30; // refresh feed every 30 seconds

// Rich WhatsApp / social preview for shared story links (/?n=<id>): story photo + title, NEWS INFO9 branding
export async function generateMetadata({ searchParams }) {
  const sp = await searchParams;
  const id = sp?.n;
  const base = {
    title: "NEWS INFO9 – తాజా తెలుగు షార్ట్ న్యూస్",
    openGraph: { siteName: "NEWS INFO9", title: "NEWS INFO9", description: "తాజా తెలుగు షార్ట్ న్యూస్ – Local news in 60 words", images: [{ url: "/og.png", width: 1200, height: 630 }] }
  };
  if (!id) return base;
  try {
    const n = await getNews(String(id));
    if (!n) return base;
    const x = n.te?.title ? n.te : n.en;
    return {
      title: `${x.title} | NEWS INFO9`,
      description: x.body,
      openGraph: { siteName: "NEWS INFO9", type: "article", title: x.title, description: x.body, images: [{ url: n.image || "/og.png" }] },
      twitter: { card: "summary_large_image", title: x.title, description: x.body, images: [n.image || "/og.png"] }
    };
  } catch { return base; }
}

export default async function Home() {
  let news = [];
  try { news = await listNews({ limit: 150 }); } catch (e) { console.error(e); }
  return <Feed initialNews={news} />;
}
