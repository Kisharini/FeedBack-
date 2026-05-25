import trackingImage from "../assets/transationTracking.png";

const featureCards = [
  {
    title: "For Food Donors",
    icon: "storefront",
    description:
      "Restaurants and grocers can instantly list surplus food. Reduce losses by selling at a discount to individuals or donating to verified organizations while tracking ESG impact.",
  },
  {
    title: "For Recipients & NGOs",
    icon: "volunteer_activism",
    description:
      "Individuals can buy quality food at budget-friendly prices. Verified NGOs can request food for free while coordinating delivery through the rider network.",
  },
  {
    title: "Real-Time Carbon Tracking",
    icon: "eco",
    description:
      "Every meal rescued is a win for the planet. The platform estimates avoided emissions for each successful rescue so impact stays visible.",
  },
];

export default function Features() {
  return (
    <section
      id="features-section"
      className="mx-auto max-w-7xl rounded-[2.5rem] border border-[#edf1e8] bg-white/92 px-6 py-16 shadow-[0_24px_60px_rgba(68,84,48,0.08)]"
    >
      <div className="mx-auto mb-16 max-w-2xl text-center">
        <h2 className="font-display text-[42px] font-extrabold tracking-[-0.02em] text-[#16351a]">
          How FeedBack Works
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-[#5b675a]">
          A service-oriented ecosystem designed to reduce food wastage through
          efficient, location-based matching and real-time coordination.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {featureCards.map((card, index) => {
          const isOrangeCard = index === 0;

          return (
            <div
              key={card.title}
              className={`rounded-[2.2rem] p-10 transition-transform hover:-translate-y-1 ${
                isOrangeCard
                  ? "border border-[#f2dfc5] bg-[linear-gradient(150deg,#fff8ef_0%,#fff6ea_46%,#f3faea_100%)] shadow-[0_18px_40px_rgba(136,103,44,0.12)]"
                  : "border border-[#e1ebd8] bg-[linear-gradient(160deg,#f6fbee_0%,#eef6e5_100%)] shadow-[0_18px_40px_rgba(91,122,58,0.09)]"
              }`}
            >
              <div
                className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white ${
                  isOrangeCard
                    ? "shadow-[0_10px_24px_rgba(136,103,44,0.12)]"
                    : "shadow-[0_10px_24px_rgba(73,102,39,0.16)]"
                }`}
              >
                <span
                  className={`material-symbols-outlined text-3xl ${
                    isOrangeCard ? "text-[#f97316]" : "text-[#4f9218]"
                  }`}
                >
                  {card.icon}
                </span>
              </div>
              <h3 className="mb-4 font-display text-2xl font-bold text-[#16351a]">
                {card.title}
              </h3>
              <p className="leading-relaxed text-[#4f5b4e]">{card.description}</p>
            </div>
          );
        })}

        <div className="flex flex-col items-center gap-8 rounded-[2.2rem] border border-[#f2dfc5] bg-[linear-gradient(150deg,#fff8ef_0%,#fff6ea_46%,#f3faea_100%)] p-10 shadow-[0_18px_40px_rgba(136,103,44,0.12)] transition-transform hover:-translate-y-1 lg:flex-row">
          <div className="flex-1">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-[0_10px_24px_rgba(136,103,44,0.12)]">
              <span className="material-symbols-outlined text-3xl text-[#f97316]">
                local_shipping
              </span>
            </div>
            <h3 className="mb-4 font-display text-2xl font-bold text-[#16351a]">
              End-to-End Delivery
            </h3>
            <p className="mb-6 leading-relaxed text-[#4f5b4e]">
              From payment to pickup, track the full lifecycle. Integrated rider
              support helps food reach the right hands quickly, safely, and
              transparently.
            </p>
            <a
              href="#"
              className="border-b-2 border-[#f97316]/30 font-bold text-[#263425] transition hover:border-[#f97316] hover:text-[#f97316]"
            >
              Read Community Stories -&gt;
            </a>
          </div>

          <div className="h-48 w-full flex-shrink-0 lg:w-48">
            <img
              src={trackingImage}
              alt="Transaction tracking status"
              className="h-full w-full rounded-3xl border border-white/70 bg-white/75 p-2 object-contain shadow-inner"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
