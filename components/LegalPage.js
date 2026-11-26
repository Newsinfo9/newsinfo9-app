import { PAGES, COMPANY } from "@/lib/legal";

const LINKS = [["about", "About & Contact"], ["privacy", "Privacy Policy"], ["terms", "Terms of Use"], ["grievance", "Grievance Officer"]];

export function legalMeta(slug) {
  const p = PAGES[slug];
  return { title: `${p.title} – NEWS INFO9`, description: `${p.title} for NEWS INFO9 by ${COMPANY.name}` };
}

export default function LegalPage({ slug }) {
  const p = PAGES[slug];
  return (
    <main className="lp">
      <header className="lp-top">
        <a href="/" className="lp-brand"><img src="/logo-round.png" alt="" /><span>NEWS INFO<sup>9</sup></span></a>
      </header>
      <article className="lp-body">
        <h1>{p.title}</h1>
        <p className="lp-te">{p.te}</p>
        {p.sections.map(([h, lines]) => (
          <section key={h}>
            <h2>{h}</h2>
            {lines.map((l, i) => <p key={i}>{l}</p>)}
          </section>
        ))}
        <nav className="lp-nav">
          {LINKS.filter(([s]) => s !== slug).map(([s, l]) => <a key={s} href={`/${s}`}>{l}</a>)}
          <a href="/">← Back to news</a>
        </nav>
        <p className="lp-foot">NEWS INFO9® is a registered trademark of {COMPANY.name} · CIN {COMPANY.cin}</p>
      </article>
    </main>
  );
}
