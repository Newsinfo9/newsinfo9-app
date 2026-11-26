import LegalPage, { legalMeta } from "@/components/LegalPage";
export const metadata = legalMeta("about");
export default function Page() { return <LegalPage slug="about" />; }
