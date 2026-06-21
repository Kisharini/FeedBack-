import { navigateTo } from "../lib/navigation";
export default function Footer() {
  return (
    <footer className="relative z-10 mt-10 border-t border-[#e8eddc] bg-[linear-gradient(180deg,#fafbf7_0%,#f5f7f1_100%)] py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-6 md:flex-row">
        <div className="flex flex-col items-center gap-4 md:flex-row">
          <h2 className="font-display text-h2 text-[#16351a]">FeedBack</h2>
          <span className="hidden h-4 w-px bg-[#d9dfd1] md:block"></span>
          <p className="font-body-md text-body-md italic text-[#647064]">
            Start rescuing. Share your surplus.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-8 text-sm font-semibold text-[#5d685d]">
          <a href="#" className="transition-colors duration-300 hover:text-[#4f9218]">
            Privacy Policy
          </a>
          <a href="#" className="transition-colors duration-300 hover:text-[#4f9218]">
            Terms of Service
          </a>
          <a href="#" className="transition-colors duration-300 hover:text-[#4f9218]">
            Contact Us
          </a>
          <a href="#" className="transition-colors duration-300 hover:text-[#4f9218]">
            Partner With Us
          </a>

          <button type="button" onClick={() => navigateTo("/privacy-policy")} className="transition-colors duration-300 hover:text-[#4f9218]">
            Privacy Policy
          </button>
          <button type="button" onClick={() => navigateTo("/terms-of-service")} className="transition-colors duration-300 hover:text-[#4f9218]">
            Terms of Service
          </button>
          <button type="button" onClick={() => navigateTo("/contact-us")} className="transition-colors duration-300 hover:text-[#4f9218]">
            Contact Us
          </button>
          <button type="button" onClick={() => navigateTo("/partner-with-us")} className="transition-colors duration-300 hover:text-[#4f9218]">
            Partner With Us
          </button>
        </div>
      </div>
    </footer>
  );
}
