import InfoPageLayout from "../components/InfoPageLayout";

export default function TermsOfServicePage() {
  return (
    <InfoPageLayout
      eyebrow="Legal"
      title="Terms of Service"
      intro="These terms outline the basic expectations for using FeedBack responsibly as an individual, NGO, vendor, rider, or administrator."
    >
      <div>
        <h2 className="text-lg font-bold text-[#1d3720]">Using the Platform</h2>
        <p className="mt-2">
          Users are expected to provide accurate information, respect role-based access, and avoid misuse of listings,
          orders, approvals, or delivery workflows.
        </p>
      </div>
      <div>
        <h2 className="text-lg font-bold text-[#1d3720]">Listings and Orders</h2>
        <p className="mt-2">
          Vendors are responsible for the accuracy of listing details. Customers and NGOs are responsible for placing
          orders carefully and following the agreed pickup or delivery process.
        </p>
      </div>
      <div>
        <h2 className="text-lg font-bold text-[#1d3720]">Account Conduct</h2>
        <p className="mt-2">
          We may limit or remove access for accounts that misuse the service, submit false information,
          or interfere with safe food-rescue operations.
        </p>
      </div>
    </InfoPageLayout>
  );
}
