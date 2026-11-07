import Navbar from "./navbar";
import Footer from "./footer";

/** Navbar + content + footer for every public page. The navbar is fixed, so content starts below it. */
export default function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="flex-1 pt-16">{children}</div>
      <Footer />
    </div>
  );
}
