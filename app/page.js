import Feed from "@/components/Feed";
import { listNews } from "@/lib/db";

export const revalidate = 30; // refresh feed every 30 seconds

export default async function Home() {
  let news = [];
  try { news = await listNews({ limit: 150 }); } catch (e) { console.error(e); }
  return <Feed initialNews={news} />;
}
