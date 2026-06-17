import InfoPageLayout from "../components/InfoPageLayout";

export default function PrivacyPolicyPage() {
  return (
    <InfoPageLayout
      eyebrow="Legal"
      title="Privacy Policy"
      intro="This page explains, in simple terms, how FeedBack handles account details, listing activity, and order-related information across the platform."
    >
      <div>
        <h2 className="text-lg font-bold text-[#1d3720]">Information We Collect</h2>
        <p className="mt-2">
          We collect the information you provide when you register, publish listings, place orders, or contact the team.
          This may include your name, email, account role, listing details, and order activity.
        </p>
      </div>
      <div>
        <h2 className="text-lg font-bold text-[#1d3720]">How It Is Used</h2>
        <p className="mt-2">
          The platform uses your information to authenticate your account, show relevant listings, process orders,
          coordinate pickups or deliveries, and improve overall platform reliability.
        </p>
      </div>
      <div>
        <h2 className="text-lg font-bold text-[#1d3720]">Storage and Security</h2>
        <p className="mt-2">
          We take reasonable steps to protect account and order data. Uploaded documents and images may be stored
          through approved third-party services that support the product workflow.
        </p>
      </div>
    </InfoPageLayout>
  );
}
