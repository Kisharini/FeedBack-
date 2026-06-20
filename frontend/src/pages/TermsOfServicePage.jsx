import { useState, useMemo } from "react";
import InfoPageLayout from "../components/InfoPageLayout";

export default function TermsOfServicePage() {
  // Client-Side Search and Navigation Filter Engine
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("all");

  const termsSections = [
    {
      id: "using-platform",
      title: "USING THE PLATFORM",
      icon: "devices",
      content: "Users are expected to provide accurate information, respect role-based access, and avoid misuse of listings, orders, approvals, or delivery workflows."
    },
    {
      id: "listings-orders",
      title: "LISTINGS AND ORDERS",
      icon: "shopping_bag",
      content: "Vendors are responsible for the accuracy of listing details. Customers and NGOs are responsible for placing orders carefully and following the agreed pickup or delivery process."
    },
    {
      id: "account-conduct",
      title: "ACCOUNT CONDUCT",
      icon: "gavel",
      content: "We may limit or remove access for accounts that misuse the service, submit false information, or interfere with safe food-rescue operations."
    }
  ];

  // Live filter computation based on side selection or search matches
  const filteredSections = useMemo(() => {
    return termsSections.filter((section) => {
      const matchesSearch = 
        section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.content.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesNav = activeSection === "all" || activeSection === section.id;
      
      return matchesSearch && matchesNav;
    });
  }, [searchQuery, activeSection]);

  return (
    <InfoPageLayout
      eyebrow="LEGAL"
      title="Terms of Service"
      intro="These terms outline the basic expectations for using FeedBack responsibly as an individual, NGO, vendor, rider, or administrator."
    >
      <div className="grid gap-8 lg:grid-cols-4 items-start mt-4">
        
        {/* Navigation Sidebar Index Panel (Client-Side Interface Extra) */}
        <aside className="lg:col-span-1 space-y-2 hidden md:block">
          <p className="text-[10px] font-bold text-gray-400 tracking-wider uppercase px-2">Document Index</p>
          <button
            onClick={() => setActiveSection("all")}
            className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-xl transition flex items-center gap-2 ${
              activeSection === "all" ? "bg-[#eef7df] text-[#1d3720]" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">menu_book</span>
            All Articles
          </button>
          {termsSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full text-left px-3 py-2 text-xs font-bold transition rounded-xl flex items-center gap-2 tracking-wide ${
                activeSection === section.id ? "bg-[#eef7df] text-[#1d3720]" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <span className="material-symbols-outlined text-[16px] text-gray-400">{section.icon}</span>
              <span className="truncate">{section.title}</span>
            </button>
          ))}
        </aside>

        {/* Main Document Content Column */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Micro Search Tool for Usability Enhancement */}
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">search</span>
            <input
              type="text"
              placeholder="Filter clauses, key phrases or terms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#dce3d5] bg-white py-1.5 pl-9 pr-4 text-xs outline-none transition focus:border-[#a3b899] focus:ring-2 focus:ring-[#eef7df]"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                close
              </button>
            )}
          </div>

          {/* Render Streamed Legal Panels */}
          <div className="space-y-6">
            {filteredSections.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 border border-dashed rounded-2xl">
                No matching legal provisions match your filter query.
              </div>
            ) : (
              filteredSections.map((section) => (
                <div 
                  key={section.id} 
                  className="p-5 border border-[#e7eddc] bg-white rounded-2xl transition hover:shadow-sm"
                >
                  <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-3">
                    <span className="material-symbols-outlined text-md text-[#4b6549]">{section.icon}</span>
                    <h2 className="text-sm font-bold tracking-wider text-[#1d3720] uppercase">
                      {section.title}
                    </h2>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[#425040]">
                    {section.content}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Standard Platform Disclaimer Stamp */}
          <div className="rounded-xl bg-gray-50/80 p-4 border border-gray-100 text-[11px] text-gray-400 leading-relaxed flex gap-2 items-start">
            <span className="material-symbols-outlined text-sm text-gray-400 mt-0.5">info</span>
            <p>
              By accessing or logging into the FeedBack network, you acknowledge compliance with the standard role operational procedures active for your distribution workspace.
            </p>
          </div>

        </div>
      </div>
    </InfoPageLayout>
  );
}