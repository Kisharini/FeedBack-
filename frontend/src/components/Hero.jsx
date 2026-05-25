import landingPageImage from "../assets/landingPageImage.avif";
import { navigateTo } from "../lib/navigation";

const heroCommunityImages = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80",
];

export default function Hero() {
  const scrollToFeatures = () => {
    document
      .getElementById("features-section")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="mx-auto flex max-w-7xl flex-col items-center gap-14 px-6 py-12 md:flex-row md:py-20">
      <div className="flex-1">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#dce7c9] bg-[#f3f8ea] px-4 py-2 text-xs font-bold tracking-wide text-[#5f7b45]">
          <span className="material-symbols-outlined text-sm text-[#4f9218]">
            favorite
          </span>
          JOIN THE MOVEMENT
        </div>
        <h1 className="font-display text-[48px] font-extrabold leading-[1.06] tracking-[-0.03em] text-[#16351a] md:text-[64px]">
          Don&apos;t Waste Food.
          <br />
          <span className="border-b-4 border-[#FFA02E]/30 text-[#f97316]">
            Share It.
          </span>
        </h1>
        <p className="mt-8 max-w-lg text-[20px] leading-relaxed text-[#556254]">
          Connect surplus food with people who need it most. Our platform makes
          donating easy, efficient, and impactful for communities everywhere.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={() => navigateTo("/register")}
            className="rounded-full bg-[#4f9218] px-8 py-4 font-label-md text-label-md text-white shadow-[0_18px_35px_rgba(79,146,24,0.25)] transition duration-300 hover:-translate-y-[1px] hover:bg-[#447f15]"
          >
            Get Started
          </button>
          <button
            onClick={scrollToFeatures}
            className="rounded-full border border-[#dce7c9] bg-white/80 px-8 py-4 font-label-md text-label-md text-[#415041] shadow-[0_8px_20px_rgba(104,97,59,0.05)] transition duration-300 hover:border-[#b9d48f] hover:bg-[#f7fbf1]"
            type="button"
          >
            Learn More
          </button>
        </div>
        <div className="mt-12 flex items-center gap-3">
          <div className="flex -space-x-2">
            {heroCommunityImages.map((imageUrl, index) => (
              <img
                key={imageUrl}
                src={imageUrl}
                alt={`Community member ${index + 1}`}
                className="h-8 w-8 rounded-full border-2 border-white object-cover shadow-[0_8px_18px_rgba(68,93,39,0.16)]"
              />
            ))}
          </div>
          <p className="text-sm font-medium text-[#687467]">
            <span className="font-bold text-[#16351a]">5,000+</span> meals
            rescued this week
          </p>
        </div>
      </div>
      <div className="relative flex-1">
        <div className="pointer-events-none absolute -inset-6 rounded-[3rem] bg-[radial-gradient(circle_at_20%_20%,rgba(157,210,97,0.22),transparent_42%),radial-gradient(circle_at_84%_72%,rgba(255,175,71,0.18),transparent_44%)]" />
        <img
          src={landingPageImage}
          alt="Food sharing"
          className="relative w-full rounded-[2.5rem] border border-white/80 shadow-[0_28px_60px_rgba(104,97,59,0.16)]"
        />
      </div>
    </section>
  );
}
