import Footer from "./Footer";
import Navbar from "./Navbar";

export default function InfoPageLayout({ eyebrow, title, intro, children }) {
  return (
    <div className="min-h-screen bg-background text-on-background font-body-md flex flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <section className="overflow-hidden rounded-[2.5rem] border border-[#e6ebda] bg-[linear-gradient(135deg,#fff9ef_0%,#f5fbe9_48%,#eef7ff_100%)] p-8 shadow-level-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6c7d69]">
            {eyebrow}
          </p>
          <h1 className="mt-2 font-display text-[clamp(2rem,3vw,2.9rem)] leading-tight text-[#1d3720]">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#53604a]">
            {intro}
          </p>
        </section>

        <section className="mt-8 rounded-[2rem] border border-[#e7eddc] bg-white p-8 shadow-level-1">
          <div className="space-y-6 text-sm leading-7 text-[#4f5d4b]">
            {children}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
