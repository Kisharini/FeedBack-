import { useState } from "react";
import logo from "../assets/logo.png";
import { apiRequest } from "../lib/api";
import { navigateTo } from "../lib/navigation";

const roles = [
  { id: "INDIVIDUAL", label: "Individual", icon: "person" },
  { id: "VENDOR", label: "Vendor", icon: "storefront" },
  { id: "RIDER", label: "Rider", icon: "local_shipping" },
  { id: "NGO", label: "NGO", icon: "corporate_fare" },
  { id: "ADMIN", label: "Admin", icon: "shield_person" },
];

const panelClassName =
  "bg-surface-container-lowest rounded-[2rem] border border-surface-container-high shadow-level-2";
const fieldClassName =
  "w-full rounded-xl border-2 border-outline-variant/40 bg-surface px-4 py-4 text-on-surface placeholder-on-surface-variant/60 shadow-inner transition-colors duration-300 focus:border-primary-container focus:ring-0";
const labelClassName =
  "mb-xs block font-label-md text-label-md uppercase text-on-surface";
const helperClassName = "font-caption text-caption text-on-surface-variant";
const successHelperClassName = "font-caption text-caption text-primary";
const errorClassName = "font-caption text-caption text-red-600";
const fileInputClassName =
  "text-body-md text-on-surface-variant file:mr-4 file:rounded-full file:border file:border-transparent file:bg-primary-container file:px-4 file:py-2 file:font-label-md file:text-label-md file:text-on-primary-container hover:file:bg-tertiary-fixed-dim";
const primaryButtonClassName =
  "w-full flex items-center justify-center gap-xs rounded-xl bg-primary-container px-md py-sm font-label-md text-label-md text-on-primary-container border border-transparent border-b-[3px] border-on-primary-container/20 shadow-sm transition-all duration-300 ease-out-back hover:bg-tertiary-fixed-dim hover:-translate-y-[1px] hover:shadow-md active:translate-y-[2px] active:border-b-0 active:mb-[3px]";

const roleHeroContent = {
  INDIVIDUAL: {
    icon: "diversity_3",
    subtitle:
      "Small acts can create real change. Join the community and start sharing today.",
    image:
      "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=800",
    imageAlt: "Community food sharing",
    highlights: [
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
    ],
  },
  VENDOR: {
    icon: "storefront",
    subtitle:
      "Turn surplus into impact with a trusted network built around sustainable giving.",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800",
    imageAlt: "Restaurant team preparing food",
    highlights: [
      {
        icon: "inventory_2",
        title: "Move Surplus Faster",
        desc: "Turn excess stock into meaningful value before it goes to waste.",
      },
      {
        icon: "monitoring",
        title: "Track Impact Clearly",
        desc: "Show your business contribution through visible sustainability outcomes.",
      },
      {
        icon: "volunteer_activism",
        title: "Support Communities",
        desc: "Feed more people while building a stronger local reputation.",
      },
    ],
  },
  RIDER: {
    icon: "local_shipping",
    subtitle:
      "Help move food where it matters most and become part of the delivery mission.",
    image:
      "https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&q=80&w=800",
    imageAlt: "Delivery rider with bicycle",
    highlights: [
      {
        icon: "route",
        title: "Deliver With Purpose",
        desc: "Every route helps useful food reach the right hands on time.",
      },
      {
        icon: "schedule",
        title: "Flexible Coordination",
        desc: "Work with pickup windows and delivery requests more efficiently.",
      },
      {
        icon: "verified",
        title: "Trusted Network",
        desc: "Be part of a verified chain that keeps rescue deliveries reliable.",
      },
    ],
  },
  NGO: {
    icon: "corporate_fare",
    subtitle:
      "Expand your reach, streamline collection, and support more people with every match.",
    image:
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=800",
    imageAlt: "Volunteers organizing donations",
    highlights: [
      {
        icon: "hub",
        title: "Coordinate Better",
        desc: "Manage incoming donations with a smoother and more organized flow.",
      },
      {
        icon: "group",
        title: "Reach More Families",
        desc: "Increase your support capacity through faster food matching.",
      },
      {
        icon: "approval",
        title: "Stay Verified",
        desc: "Build trust with donors through clear identity and document checks.",
      },
    ],
  },
  ADMIN: {
    icon: "shield_person",
    subtitle:
      "Secure internal access for managing approvals and keeping the ecosystem healthy.",
    image:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800",
    imageAlt: "Admin workspace with laptop and notes",
    highlights: [
      {
        icon: "rule",
        title: "Review With Confidence",
        desc: "Approve the right accounts with the right verification context.",
      },
      {
        icon: "security",
        title: "Protect The Platform",
        desc: "Help keep the ecosystem safe, trusted, and well-governed.",
      },
      {
        icon: "tune",
        title: "Keep Things Moving",
        desc: "Support smooth onboarding for every stakeholder entering the system.",
      },
    ],
  },
};

export default function Register() {
  const [role, setRole] = useState("INDIVIDUAL");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    ngoOrganizationName: "",
    ngoRegistrationNumber: "",
    ngoContactPhone: "",
    ngoAddress: "",
    ngoDescription: "",
    vendorBusinessName: "",
    vendorRegistrationNumber: "",
    vendorPlaceAddress: "",
    vendorContactPhone: "",
    vendorDescription: "",
    riderLicenseNumber: "",
    riderPhoneNumber: "",
    riderVehicleType: "",
    riderVehicleName: "",
    riderVehiclePlateNumber: "",
    riderVehicleColor: "",
    riderAddress: "",
    riderNotes: "",
  });
  const [files, setFiles] = useState({
    ssmDocument: null,
    supportingDocuments: [],
    vendorSsmDocument: null,
    riderLicenseDocument: null,
    riderVehicleGrantDocument: null,
  });

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleFileChange = (event) => {
    const { name, files: selectedFiles } = event.target;
    setFiles((current) => ({
      ...current,
      [name]:
        name === "supportingDocuments"
          ? Array.from(selectedFiles)
          : selectedFiles[0] || null,
    }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  };

  const getFlattenedErrors = (payload) => {
    const responseErrors = payload?.errors;
    if (!responseErrors) return {};
    const combinedErrors = {};
    Object.entries(responseErrors.fieldErrors || {}).forEach(([field, messages]) => {
      if (messages?.length) combinedErrors[field] = messages[0];
    });
    Object.entries(responseErrors.formErrors || {}).forEach(([field, messages]) => {
      if (messages?.length && !combinedErrors[field]) combinedErrors[field] = messages[0];
    });
    return combinedErrors;
  };

  const appendIfPresent = (payload, key, value) => {
    const trimmedValue = typeof value === "string" ? value.trim() : value;
    if (trimmedValue) payload.append(key, trimmedValue);
  };

  const buildPayload = () => {
    const payload = new FormData();
    payload.append("name", formData.name.trim());
    payload.append("email", formData.email.trim());
    payload.append("password", formData.password);
    payload.append("role", role);

    if (role === "NGO") {
      payload.append("ngoOrganizationName", formData.ngoOrganizationName.trim());
      payload.append("ngoRegistrationNumber", formData.ngoRegistrationNumber.trim());
      payload.append("ngoContactPhone", formData.ngoContactPhone.trim());
      payload.append("ngoAddress", formData.ngoAddress.trim());
      payload.append("ngoDescription", formData.ngoDescription.trim());
      if (files.ssmDocument) payload.append("ssmDocument", files.ssmDocument);
      files.supportingDocuments.forEach((file) => payload.append("supportingDocuments", file));
    }

    if (role === "VENDOR") {
      payload.append("vendorBusinessName", formData.vendorBusinessName.trim());
      payload.append("vendorRegistrationNumber", formData.vendorRegistrationNumber.trim());
      payload.append("vendorPlaceAddress", formData.vendorPlaceAddress.trim());
      payload.append("vendorContactPhone", formData.vendorContactPhone.trim());
      appendIfPresent(payload, "vendorDescription", formData.vendorDescription);
      if (files.vendorSsmDocument) payload.append("vendorSsmDocument", files.vendorSsmDocument);
    }

    if (role === "RIDER") {
      payload.append("riderLicenseNumber", formData.riderLicenseNumber.trim());
      payload.append("riderPhoneNumber", formData.riderPhoneNumber.trim());
      payload.append("riderVehicleType", formData.riderVehicleType.trim());
      payload.append("riderVehicleName", formData.riderVehicleName.trim());
      payload.append("riderVehiclePlateNumber", formData.riderVehiclePlateNumber.trim());
      appendIfPresent(payload, "riderVehicleColor", formData.riderVehicleColor);
      payload.append("riderAddress", formData.riderAddress.trim());
      appendIfPresent(payload, "riderNotes", formData.riderNotes);
      if (files.riderLicenseDocument) payload.append("riderLicenseDocument", files.riderLicenseDocument);
      if (files.riderVehicleGrantDocument) payload.append("riderVehicleGrantDocument", files.riderVehicleGrantDocument);
    }

    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      setFieldErrors({ confirmPassword: "Passwords do not match." });
      return;
    }

    setSubmitting(true);
    setError("");
    setMessage("");
    setFieldErrors({});

    try {
      const response = await apiRequest("/auth/register", {
        method: "POST",
        body: buildPayload(),
      });

      setMessage(response.message);

      if (response.data.token) {
        navigateTo("/login");
      }
    } catch (requestError) {
      setError(requestError.message);
      setFieldErrors(getFlattenedErrors(requestError.payload));
    } finally {
      setSubmitting(false);
    }
  };

  const currentHero = roleHeroContent[role];

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
            Already have an account?
            <button
              type="button"
              onClick={() => navigateTo("/login")}
              className="ml-2 rounded-full bg-[#eef7e3] px-3 py-1 font-label-md text-label-md text-primary transition-all hover:bg-[#fff1d6] hover:text-[#FFA02E]"
            >
              Login
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-12 px-6 py-12 lg:h-[calc(100vh-89px)] lg:flex-row lg:items-stretch lg:gap-8 lg:overflow-hidden lg:py-8">

        {/* ── LEFT HERO PANEL ── */}
        <div className="hidden w-full lg:sticky lg:top-0 lg:flex lg:h-full lg:w-5/12 lg:flex-col">
          <div
            className="relative flex min-h-[640px] flex-col overflow-hidden rounded-[2.5rem] p-10 shadow-level-3 lg:h-full lg:min-h-0 lg:p-8"
            style={{
              background: "linear-gradient(160deg, #a8e063 0%, #c8f577 40%, #f0e96a 100%)",
            }}
          >
            {/* Decorative blobs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[2.5rem]">
              <div
                className="absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-30"
                style={{ background: "#fff9a0" }}
              />
              <div
                className="absolute bottom-20 -left-10 w-40 h-40 rounded-full opacity-20"
                style={{ background: "#6dcf3e" }}
              />
            </div>

            <div className="relative z-10 flex flex-col h-full">
              {/* Headline */}
              <h1
                className="font-display leading-tight mb-4 lg:mb-3"
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

              {/* Subtitle — changes per role */}
              <p
                className="max-w-xs text-sm leading-relaxed mb-7 lg:mb-4"
                style={{ color: "#2d5a1b" }}
              >
                {currentHero.subtitle}
              </p>

              {/* Feature bullets */}
              <div className="space-y-3 mb-10 lg:mb-7 lg:space-y-2.5">
                {currentHero.highlights.map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(255,255,255,0.45)" }}
                    >
                      <span className="material-symbols-outlined text-[18px] text-[#1a4a1a]">
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

              {/* Hero image card */}
              <div
                className="relative mt-auto h-[185px] w-full max-w-[78%] shrink-0 overflow-hidden rounded-[2rem] lg:ml-3 lg:h-[178px] lg:max-w-[82%]"
                style={{
                  border: "1px solid rgba(255,255,255,0.5)",
                  background: "rgba(255,255,255,0.2)",
                }}
              >
                <img
                  src={currentHero.image}
                  className="absolute inset-0 h-full w-full object-cover"
                  alt={currentHero.imageAlt}
                />
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(to top, rgba(26,58,26,0.3), transparent)" }}
                />
              </div>

              {/* Stats bar */}
              <div
                className="mt-6 grid shrink-0 grid-cols-3 gap-2 rounded-2xl p-4 lg:mt-4 lg:p-3"
                style={{
                  background: "rgba(255,255,255,0.35)",
                  border: "1px solid rgba(255,255,255,0.5)",
                }}
              >
                {[
                  { value: "12,000+", label: "Active Users" },
                  { value: "80,000+", label: "Meals Shared" },
                  { value: "850+", label: "NGO Partners" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="font-bold text-base" style={{ color: "#f97316" }}>
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

        {/* ── RIGHT FORM PANEL ── */}
        <div className="w-full lg:h-full lg:min-h-0 lg:w-7/12 lg:overflow-y-auto lg:pr-2">
          <div className={`w-full p-8 md:p-12 ${panelClassName}`}>
            <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-h1 text-h1 text-on-surface">Create Account</h2>
              <p className="mt-xs font-body-md text-body-md text-on-surface-variant">
                Seemless registration for every role.
              </p>
            </div>
            <div className="rounded-full border border-[#FFA02E]/30 bg-[#FFA02E]/10 px-4 py-2 font-label-md text-label-md text-primary">
              Registration
            </div>
          </div>

          <div className="mb-10 overflow-x-auto border-b border-surface-container-high pb-6">
            <div className="flex min-w-max flex-nowrap gap-3 lg:min-w-full">
              {roles.map((currentRole) => (
                <button
                  key={currentRole.id}
                  type="button"
                  onClick={() => setRole(currentRole.id)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3 font-label-md text-label-md transition-all ${
                    role === currentRole.id
                      ? "bg-primary-container text-on-primary-container shadow-level-1 ring-2 ring-[#FFA02E]/40"
                      : "border border-surface-container-high bg-surface text-on-surface-variant hover:bg-secondary/10 hover:text-primary"
                  }`}
                >
                  <span className="material-symbols-outlined">{currentRole.icon}</span>
                  {currentRole.label}
                </button>
              ))}
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <FieldLabel label="Full Name" required infoText="2 to 100 characters" />
                <input
                  name="name"
                  onChange={handleInputChange}
                  type="text"
                  value={formData.name}
                  minLength={2}
                  maxLength={100}
                  className={fieldClassName}
                  placeholder="Enter name"
                  required
                />
                <span className={formData.name.length >= 2 ? successHelperClassName : helperClassName}>
                  2 to 100 characters
                </span>
                {fieldErrors.name && <span className={errorClassName}>{fieldErrors.name}</span>}
              </div>
              <div className="flex flex-col gap-2">
                <FieldLabel label="Email Address" required infoText="Enter a valid email address" />
                <input
                  name="email"
                  onChange={handleInputChange}
                  type="email"
                  value={formData.email}
                  className={fieldClassName}
                  placeholder="name@email.com"
                  required
                />
                <span className={helperClassName}>Enter a valid email address</span>
                {fieldErrors.email && <span className={errorClassName}>{fieldErrors.email}</span>}
              </div>
            </div>

            {role === "NGO" && (
              <div className="animate-in space-y-6">
                <NoticeCard
                  icon="shield_person"
                  title="NGO verification required"
                  tone="orange"
                  message="NGO registration requires all fields below. Use PDF, JPG, PNG, or WEBP for uploads. `ngoContactPhone` must be 8 to 30 characters, `ngoAddress` 10 to 300, and `ngoDescription` 20 to 1000."
                />
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <InputField
                    label="Organization Name"
                    name="ngoOrganizationName"
                    value={formData.ngoOrganizationName}
                    onChange={handleInputChange}
                    placeholder="Enter organization name"
                    helperText="2 to 150 characters"
                    required
                    minLength={2}
                    maxLength={150}
                    error={fieldErrors.ngoOrganizationName}
                  />
                  <InputField
                    label="Registration Number"
                    name="ngoRegistrationNumber"
                    value={formData.ngoRegistrationNumber}
                    onChange={handleInputChange}
                    placeholder="SSM / registration number"
                    helperText="3 to 60 characters"
                    required
                    minLength={3}
                    maxLength={60}
                    error={fieldErrors.ngoRegistrationNumber}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <FieldLabel label="Contact Phone" required infoText="8 to 30 characters" />
                  <input
                    name="ngoContactPhone"
                    onChange={handleInputChange}
                    type="text"
                    value={formData.ngoContactPhone}
                    minLength={8}
                    maxLength={30}
                    className={fieldClassName}
                    placeholder="+60..."
                    required
                  />
                  <span className={helperClassName}>8 to 30 characters</span>
                  {fieldErrors.ngoContactPhone && (
                    <span className={errorClassName}>{fieldErrors.ngoContactPhone}</span>
                  )}
                </div>
                <InputField
                  label="Address"
                  name="ngoAddress"
                  value={formData.ngoAddress}
                  onChange={handleInputChange}
                  placeholder="Full address"
                  helperText="10 to 300 characters"
                  required
                  minLength={10}
                  maxLength={300}
                  error={fieldErrors.ngoAddress}
                />
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <FieldLabel label="Org Description" required infoText="20 to 1000 characters" />
                    <textarea
                      rows="4"
                      name="ngoDescription"
                      value={formData.ngoDescription}
                      onChange={handleInputChange}
                      minLength={20}
                      maxLength={1000}
                      className={fieldClassName}
                      placeholder="Mission statement..."
                      required
                    />
                    <span className={helperClassName}>20 to 1000 characters</span>
                    {fieldErrors.ngoDescription && (
                      <span className={errorClassName}>{fieldErrors.ngoDescription}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <FieldLabel label="SSM Document" required infoText="PDF, JPG, PNG, or WEBP" />
                    <input
                      type="file"
                      name="ssmDocument"
                      onChange={handleFileChange}
                      className={fileInputClassName}
                      accept=".pdf,image/png,image/jpeg,image/webp"
                      required
                    />
                    <span className={helperClassName}>PDF, JPG, PNG, or WEBP</span>
                    {fieldErrors.ssmDocument && (
                      <span className={errorClassName}>{fieldErrors.ssmDocument}</span>
                    )}
                    <div className="mt-4">
                      <FieldLabel
                        label="Supporting Documents"
                        infoText="Optional. PDF, JPG, PNG, or WEBP"
                      />
                    </div>
                    <input
                      type="file"
                      name="supportingDocuments"
                      multiple
                      onChange={handleFileChange}
                      className={fileInputClassName}
                    />
                    <span className={helperClassName}>Optional. PDF, JPG, PNG, or WEBP</span>
                  </div>
                </div>
              </div>
            )}

            {role === "VENDOR" && (
              <div className="animate-in grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="md:col-span-2">
                  <NoticeCard
                    icon="storefront"
                    title="Vendor verification required"
                    tone="orange"
                    message="Vendor registration requires business details and a vendor SSM document upload."
                  />
                </div>
                <InputField
                  label="Business Name"
                  name="vendorBusinessName"
                  value={formData.vendorBusinessName}
                  onChange={handleInputChange}
                  placeholder="Business name"
                  helperText="2 to 150 characters"
                  required
                  minLength={2}
                  maxLength={150}
                  error={fieldErrors.vendorBusinessName}
                />
                <InputField
                  label="Registration Number"
                  name="vendorRegistrationNumber"
                  value={formData.vendorRegistrationNumber}
                  onChange={handleInputChange}
                  placeholder="Business registration number"
                  helperText="3 to 60 characters"
                  required
                  minLength={3}
                  maxLength={60}
                  error={fieldErrors.vendorRegistrationNumber}
                />
                <InputField
                  label="Contact Phone"
                  name="vendorContactPhone"
                  value={formData.vendorContactPhone}
                  onChange={handleInputChange}
                  placeholder="+60..."
                  helperText="8 to 30 characters"
                  required
                  minLength={8}
                  maxLength={30}
                  error={fieldErrors.vendorContactPhone}
                />
                <InputField
                  label="Business Address"
                  name="vendorPlaceAddress"
                  value={formData.vendorPlaceAddress}
                  onChange={handleInputChange}
                  placeholder="Full business address"
                  helperText="10 to 300 characters"
                  required
                  minLength={10}
                  maxLength={300}
                  error={fieldErrors.vendorPlaceAddress}
                />
                <div className="flex flex-col gap-2 md:col-span-2">
                  <FieldLabel
                    label="Business Description"
                    infoText="Optional. If filled, use 10 to 1000 characters."
                  />
                  <textarea
                    rows="4"
                    name="vendorDescription"
                    value={formData.vendorDescription}
                    onChange={handleInputChange}
                    className={fieldClassName}
                    placeholder="Describe the business"
                  />
                  <span className={helperClassName}>Optional. If filled, use 10 to 1000 characters.</span>
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <FieldLabel label="Vendor SSM Document" required infoText="PDF, JPG, PNG, or WEBP" />
                  <input
                    type="file"
                    name="vendorSsmDocument"
                    onChange={handleFileChange}
                    accept=".pdf,image/png,image/jpeg,image/webp"
                    className={fileInputClassName}
                    required
                  />
                  <span className={helperClassName}>PDF, JPG, PNG, or WEBP</span>
                  {fieldErrors.vendorSsmDocument && (
                    <span className={errorClassName}>{fieldErrors.vendorSsmDocument}</span>
                  )}
                </div>
              </div>
            )}

            {role === "RIDER" && (
              <div className="animate-in grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="md:col-span-2">
                  <NoticeCard
                    icon="local_shipping"
                    title="Rider verification required"
                    tone="green"
                    message="Rider registration requires vehicle details plus license and vehicle grant uploads."
                  />
                </div>
                <InputField
                  label="License Number"
                  name="riderLicenseNumber"
                  value={formData.riderLicenseNumber}
                  onChange={handleInputChange}
                  placeholder="License number"
                  helperText="3 to 60 characters"
                  required
                  minLength={3}
                  maxLength={60}
                  error={fieldErrors.riderLicenseNumber}
                />
                <InputField
                  label="Phone Number"
                  name="riderPhoneNumber"
                  value={formData.riderPhoneNumber}
                  onChange={handleInputChange}
                  placeholder="+60..."
                  helperText="8 to 30 characters"
                  required
                  minLength={8}
                  maxLength={30}
                  error={fieldErrors.riderPhoneNumber}
                />
                <InputField
                  label="Vehicle Type"
                  name="riderVehicleType"
                  value={formData.riderVehicleType}
                  onChange={handleInputChange}
                  placeholder="Motorcycle, car, van..."
                  helperText="2 to 80 characters"
                  required
                  minLength={2}
                  maxLength={80}
                  error={fieldErrors.riderVehicleType}
                />
                <InputField
                  label="Vehicle Name"
                  name="riderVehicleName"
                  value={formData.riderVehicleName}
                  onChange={handleInputChange}
                  placeholder="Model or brand"
                  helperText="2 to 120 characters"
                  required
                  minLength={2}
                  maxLength={120}
                  error={fieldErrors.riderVehicleName}
                />
                <InputField
                  label="Plate Number"
                  name="riderVehiclePlateNumber"
                  value={formData.riderVehiclePlateNumber}
                  onChange={handleInputChange}
                  placeholder="ABC 1234"
                  helperText="2 to 30 characters"
                  required
                  minLength={2}
                  maxLength={30}
                  error={fieldErrors.riderVehiclePlateNumber}
                />
                <InputField
                  label="Vehicle Color"
                  name="riderVehicleColor"
                  value={formData.riderVehicleColor}
                  onChange={handleInputChange}
                  placeholder="Optional"
                  helperText="Optional. If filled, use 2 to 50 characters."
                />
                <div className="md:col-span-2">
                  <InputField
                    label="Address"
                    name="riderAddress"
                    value={formData.riderAddress}
                    onChange={handleInputChange}
                    placeholder="Home address"
                    helperText="10 to 300 characters"
                    required
                    minLength={10}
                    maxLength={300}
                    error={fieldErrors.riderAddress}
                  />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <FieldLabel
                    label="Notes"
                    infoText="Optional. If filled, use 10 to 1000 characters."
                  />
                  <textarea
                    rows="4"
                    name="riderNotes"
                    value={formData.riderNotes}
                    onChange={handleInputChange}
                    className={fieldClassName}
                    placeholder="Extra notes"
                  />
                  <span className={helperClassName}>Optional. If filled, use 10 to 1000 characters.</span>
                </div>
                <div className="flex flex-col gap-2">
                  <FieldLabel label="Driving License Upload" required infoText="PDF, JPG, PNG, or WEBP" />
                  <input
                    type="file"
                    name="riderLicenseDocument"
                    onChange={handleFileChange}
                    accept=".pdf,image/png,image/jpeg,image/webp"
                    className={fileInputClassName}
                    required
                  />
                  <span className={helperClassName}>PDF, JPG, PNG, or WEBP</span>
                  {fieldErrors.riderLicenseDocument && (
                    <span className={errorClassName}>{fieldErrors.riderLicenseDocument}</span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <FieldLabel label="Vehicle Grant Upload" required infoText="PDF, JPG, PNG, or WEBP" />
                  <input
                    type="file"
                    name="riderVehicleGrantDocument"
                    onChange={handleFileChange}
                    accept=".pdf,image/png,image/jpeg,image/webp"
                    className={fileInputClassName}
                    required
                  />
                  <span className={helperClassName}>PDF, JPG, PNG, or WEBP</span>
                  {fieldErrors.riderVehicleGrantDocument && (
                    <span className={errorClassName}>{fieldErrors.riderVehicleGrantDocument}</span>
                  )}
                </div>
              </div>
            )}

            {message && (
              <div className="rounded-xl bg-green-50 px-4 py-3 text-green-700">{message}</div>
            )}

            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-red-700">{error}</div>
            )}

            <div className="grid grid-cols-1 gap-6 border-t border-surface-container-high pt-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <FieldLabel label="Password" required infoText="8 to 72 characters" />
                <div className="relative">
                  <input
                    name="password"
                    onChange={handleInputChange}
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    minLength={8}
                    maxLength={72}
                    className={`${fieldClassName} pr-12`}
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors hover:text-primary"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
                <span className={formData.password.length >= 8 ? successHelperClassName : helperClassName}>
                  8 to 72 characters
                </span>
                {fieldErrors.password && <span className={errorClassName}>{fieldErrors.password}</span>}
              </div>
              <div className="flex flex-col gap-2">
                <FieldLabel label="Confirm Password" required infoText="Must match the password above" />
                <input
                  name="confirmPassword"
                  onChange={handleInputChange}
                  type="password"
                  value={formData.confirmPassword}
                  className={fieldClassName}
                  placeholder="Repeat password"
                  required
                />
                <span
                  className={
                    formData.confirmPassword && formData.confirmPassword === formData.password
                      ? successHelperClassName
                      : helperClassName
                  }
                >
                  {formData.confirmPassword && formData.confirmPassword !== formData.password
                    ? "Passwords do not match"
                    : "Must match the password above"}
                </span>
                {fieldErrors.confirmPassword && (
                  <span className={errorClassName}>{fieldErrors.confirmPassword}</span>
                )}
              </div>
            </div>

            <button type="submit" disabled={submitting} className={primaryButtonClassName}>
              {submitting ? "Submitting..." : `Register as ${role}`}
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </form>
        </div>
        </div>
      </main>
    </div>
  );
}

function InputField({
  label,
  name,
  value,
  onChange,
  placeholder,
  helperText,
  required,
  minLength,
  maxLength,
  error,
}) {
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel label={label} required={required} infoText={helperText} />
      <input
        name={name}
        value={value}
        onChange={onChange}
        type="text"
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        className={fieldClassName}
        placeholder={placeholder}
      />
      {helperText && <span className={helperClassName}>{helperText}</span>}
      {error && <span className={errorClassName}>{error}</span>}
    </div>
  );
}

function FieldLabel({ label, required = false }) {
  return (
    <div className="flex items-center gap-2">
      <label className={`${labelClassName} mb-0`}>
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
    </div>
  );
}

function NoticeCard({ icon, title, message, tone = "orange" }) {
  const toneClasses =
    tone === "green"
      ? {
          shell:
            "border-[#dce9cf] bg-[linear-gradient(135deg,#f7fbf1_0%,#eef7e6_100%)]",
          iconWrap: "bg-white shadow-[0_10px_24px_rgba(73,102,39,0.14)]",
          icon: "text-[#4f9218]",
          title: "text-[#173a19]",
          text: "text-[#566553]",
        }
      : {
          shell:
            "border-[#f1d8b8] bg-[linear-gradient(135deg,#fff8ef_0%,#fff3e3_100%)]",
          iconWrap: "bg-white shadow-[0_10px_24px_rgba(136,103,44,0.12)]",
          icon: "text-[#f97316]",
          title: "text-[#213321]",
          text: "text-[#5f645d]",
        };

  return (
    <div
      className={`rounded-[1.6rem] border px-5 py-4 shadow-[0_14px_30px_rgba(116,107,59,0.06)] ${toneClasses.shell}`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${toneClasses.iconWrap}`}
        >
          <span className={`material-symbols-outlined text-[24px] ${toneClasses.icon}`}>
            {icon}
          </span>
        </div>
        <div className="min-w-0">
          <p className={`text-[17px] font-semibold ${toneClasses.title}`}>{title}</p>
          <p className={`mt-1 text-[14px] leading-7 ${toneClasses.text}`}>{message}</p>
        </div>
      </div>
    </div>
  );
}
