import { useEffect, useEffectEvent, useRef, useState } from "react";
import logo from "../assets/logo.png";
import { jsonRequest } from "../lib/api";
import { saveAuth } from "../lib/auth";
import { navigateTo } from "../lib/navigation";

const panelClassName =
  "bg-surface-container-lowest rounded-[2rem] border border-surface-container-high shadow-level-2";
const fieldClassName =
  "w-full rounded-xl border-2 border-outline-variant/40 bg-surface px-4 py-4 text-on-surface placeholder-on-surface-variant/60 shadow-inner transition-colors duration-300 focus:border-primary-container focus:ring-0";
const labelClassName =
  "mb-xs block font-label-md text-label-md uppercase text-on-surface";

const heroHighlights = [
  {
    icon: "eco",
    title: "Reduce Food Waste",
    desc: "Rescue surplus food and help the planet.",
  },
  {
    icon: "groups",
    title: "Stronger Community",
    desc: "Connect with people who care.",
  },
  {
    icon: "favorite",
    title: "Create Real Impact",
    desc: "Your actions can bring hope to many.",
  },
];

const heroStats = [
  { value: "12,000+", label: "Active Users" },
  { value: "80,000+", label: "Meals Shared" },
  { value: "850+", label: "NGO Partners" },
];

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [googleReady, setGoogleReady] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const googleButtonRef = useRef(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const finishAuth = (authData, successMessage) => {
    saveAuth(authData);
    setMessage(successMessage);

    if (authData.user.role === "ADMIN") {
      navigateTo("/admin/approvals");
      return;
    }

    navigateTo("/me");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await jsonRequest("/auth/login", {
        method: "POST",
        body: formData,
      });

      finishAuth(response.data, response.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleCredential = useEffectEvent(async (credential) => {
    if (!credential) {
      setError("Google sign-in was cancelled. Please try again.");
      return;
    }

    setGoogleSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await jsonRequest("/auth/google", {
        method: "POST",
        body: { credential },
      });

      finishAuth(response.data, response.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setGoogleSubmitting(false);
    }
  });

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleButtonRef.current) {
      return undefined;
    }

    let cancelled = false;

    const renderGoogleButton = () => {
      if (cancelled || !window.google?.accounts?.id || !googleButtonRef.current) {
        return;
      }

      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: ({ credential }) => {
          handleGoogleCredential(credential);
        },
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "pill",
        width: Math.max(
          240,
          Math.min(googleButtonRef.current.parentElement?.clientWidth ?? 360, 360)
        ),
      });
      setGoogleReady(true);
    };

    const handleLoad = () => {
      renderGoogleButton();
    };

    const handleError = () => {
      if (!cancelled) {
        setGoogleReady(false);
        setError("Google sign-in could not be loaded right now.");
      }
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
      return () => {
        cancelled = true;
      };
    }

    let script = document.querySelector('script[data-google-identity="true"]');

    if (!script) {
      script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.dataset.googleIdentity = "true";
      document.head.appendChild(script);
    }

    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);

    return () => {
      cancelled = true;
      script?.removeEventListener("load", handleLoad);
      script?.removeEventListener("error", handleError);
    };
  }, [handleGoogleCredential]);

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md">
      <header className="sticky top-0 z-50 border-b border-[#e8eddc] bg-[linear-gradient(180deg,rgba(255,252,238,0.98)_0%,rgba(248,249,244,0.96)_100%)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <button
            type="button"
            onClick={() => navigateTo("/")}
            className="group flex items-center gap-3"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,168,57,0.24)_0%,rgba(255,168,57,0)_70%)] blur-md" />
              <img
                src={logo}
                alt="Feedback logo"
                className="relative h-16 w-16 rounded-full border-4 border-surface-container-lowest bg-surface-container-lowest object-cover shadow-[0_14px_30px_rgba(104,97,59,0.14)] transition-transform duration-300 group-hover:scale-[1.03]"
              />
            </div>
            <span className="font-display text-h2 text-primary transition-colors hover:text-[#FFA02E]">
              FeedBack
            </span>
          </button>
          <div className="text-right font-body-md text-body-md text-on-surface-variant">
            New here?
            <button
              type="button"
              onClick={() => navigateTo("/register")}
              className="ml-2 rounded-full bg-[#eef7e3] px-3 py-1 font-label-md text-label-md text-primary transition-all hover:bg-[#fff1d6] hover:text-[#FFA02E]"
            >
              Create account
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-12 px-6 py-12 lg:h-[calc(100vh-89px)] lg:flex-row lg:items-stretch lg:gap-8 lg:overflow-hidden lg:py-8">
        <div className="hidden w-full lg:sticky lg:top-0 lg:flex lg:h-full lg:w-5/12 lg:flex-col">
          <div
            className="relative flex min-h-[640px] flex-col overflow-hidden rounded-[2.5rem] p-10 shadow-level-3 lg:h-full lg:min-h-0 lg:p-8"
            style={{
              background:
                "linear-gradient(160deg, #a8e063 0%, #c8f577 40%, #f0e96a 100%)",
            }}
          >
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2.5rem]">
              <div
                className="absolute -top-16 -right-16 h-56 w-56 rounded-full opacity-30"
                style={{ background: "#fff9a0" }}
              />
              <div
                className="absolute bottom-20 -left-10 h-40 w-40 rounded-full opacity-20"
                style={{ background: "#6dcf3e" }}
              />
            </div>

            <div className="relative z-10 flex h-full flex-col">
              <h1
                className="mb-4 font-display leading-tight lg:mb-3"
                style={{
                  fontSize: "clamp(2rem, 3.5vw, 2.75rem)",
                  color: "#1a3a1a",
                  fontWeight: 800,
                }}
              >
                Share More.
                <br />
                <span style={{ color: "#f97316" }}>Waste Less.</span>
              </h1>

              <p
                className="mb-7 max-w-xs text-sm leading-relaxed lg:mb-4"
                style={{ color: "#2d5a1b" }}
              >
                Sign in to continue building a sustainable community.
              </p>

              <div className="mb-10 space-y-3 lg:mb-7 lg:space-y-2.5">
                {heroHighlights.map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <div
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-base"
                      style={{ background: "rgba(255,255,255,0.45)" }}
                    >
                      <span className="material-symbols-outlined text-lg text-[#1a4a1a]">
                        {item.icon}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#1a3a1a" }}>
                        {item.title}
                      </p>
                      <p className="text-xs" style={{ color: "#3a6b2a" }}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="relative mt-auto h-[185px] w-full max-w-[78%] shrink-0 overflow-hidden rounded-[2rem] lg:ml-3 lg:h-[178px] lg:max-w-[82%]"
                style={{
                  border: "1px solid rgba(255,255,255,0.5)",
                  background: "rgba(255,255,255,0.2)",
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=800"
                  className="absolute inset-0 h-full w-full object-cover"
                  alt="Community food sharing"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(26,58,26,0.3), transparent)",
                  }}
                />
              </div>

              <div
                className="mt-6 grid shrink-0 grid-cols-3 gap-2 rounded-2xl p-4 lg:mt-4 lg:p-3"
                style={{
                  background: "rgba(255,255,255,0.35)",
                  border: "1px solid rgba(255,255,255,0.5)",
                }}
              >
                {heroStats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-base font-bold" style={{ color: "#f97316" }}>
                      {stat.value}
                    </p>
                    <p className="text-xs" style={{ color: "#2d5a1b" }}>
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={`w-full lg:h-full lg:min-h-0 lg:w-7/12 lg:overflow-y-auto lg:pr-2 ${panelClassName}`}>
          <div className="p-8 md:p-12">
          <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-h1 text-h1 text-on-surface">Welcome Back</h2>
              <p className="mt-xs font-body-md text-body-md text-on-surface-variant">
                Sign in to continue building a sustainable community.
              </p>
            </div>
            <div className="rounded-full border border-[#FFA02E]/30 bg-[#FFA02E]/10 px-4 py-2 font-label-md text-label-md text-primary">
              Sign In
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6">
              <div className="flex flex-col gap-2">
                <label className={labelClassName} htmlFor="identifier">
                  Email Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-sm text-on-surface-variant">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <input
                    className={`${fieldClassName} pl-[44px]`}
                    id="identifier"
                    name="email"
                    placeholder="Enter your email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className={labelClassName} htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-sm text-on-surface-variant">
                    <span className="material-symbols-outlined">lock</span>
                  </div>
                  <input
                    className={`${fieldClassName} pl-[44px] pr-12`}
                    id="password"
                    name="password"
                    placeholder="Enter your password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-y-0 right-0 flex items-center pr-sm text-on-surface-variant transition-colors hover:text-primary"
                    type="button"
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {message && (
              <div className="rounded-xl bg-green-50 px-4 py-3 text-green-700">
                {message}
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-red-700">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between pt-xs">
              <div className="flex items-center">
                <input
                  className="h-5 w-5 cursor-pointer rounded border-outline-variant bg-surface text-primary-container transition-colors focus:ring-primary-container"
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                />
                <label
                  className="ml-sm block cursor-pointer font-body-md text-body-md text-on-surface-variant"
                  htmlFor="remember-me"
                >
                  Remember Me
                </label>
              </div>
              <div className="text-sm">
                <a
                  className="font-label-md text-label-md text-primary-container transition-colors duration-300 hover:text-primary"
                  href="#"
                >
                  Forgot Password?
                </a>
              </div>
            </div>

            <button
              className="w-full flex items-center justify-center gap-xs rounded-xl bg-primary-container px-md py-sm font-label-md text-label-md text-on-primary-container border border-transparent border-b-[3px] border-on-primary-container/20 shadow-sm transition-all duration-300 ease-out-back hover:bg-tertiary-fixed-dim hover:-translate-y-[1px] hover:shadow-md active:translate-y-[2px] active:border-b-0 active:mb-[3px]"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Logging in..." : "Login"}
              <span className="material-symbols-outlined text-[18px]">
                arrow_forward
              </span>
            </button>
          </form>

          {GOOGLE_CLIENT_ID && (
            <>
              <div className="relative mb-margin mt-margin">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-outline-variant/40"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-surface-container-lowest px-sm font-caption text-caption uppercase tracking-wider text-on-surface-variant">
                    Or continue with Google
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-sm">
                <div className="flex min-h-[44px] items-center justify-center rounded-lg border border-surface-container-high/70 bg-surface px-sm py-sm">
                  <div ref={googleButtonRef} className="flex w-full justify-center" />
                </div>
                {!googleReady && (
                  <p className="text-center text-xs text-on-surface-variant">
                    {googleSubmitting
                      ? "Finishing Google sign-in..."
                      : "Loading Google sign-in..."}
                  </p>
                )}
              </div>
            </>
          )}

          <div className="mt-margin text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
              Don&apos;t have an account?
              <button
                type="button"
                onClick={() => navigateTo("/register")}
                className="ml-1 font-label-md text-label-md text-primary transition-colors duration-300 hover:text-primary-container"
              >
                Sign Up
              </button>
            </p>
          </div>
          </div>
        </div>
      </main>
    </div>
  );
}
