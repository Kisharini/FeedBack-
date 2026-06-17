import InfoPageLayout from "../components/InfoPageLayout";

export default function ContactUsPage() {
  return (
    <InfoPageLayout
      eyebrow="Support"
      title="Contact Us"
      intro="Need help with an account, listing, order, or partnership discussion? This page gives people a simple place to reach out."
    >
      <div>
        <h2 className="text-lg font-bold text-[#1d3720]">General Support</h2>
        <p className="mt-2">
          For help with login issues, listings, orders, or delivery coordination, reach out to the FeedBack support team.
        </p>
        <p className="mt-2 font-semibold text-[#1d3720]">support@feedback.local</p>
      </div>
      <div>
        <h2 className="text-lg font-bold text-[#1d3720]">Response Window</h2>
        <p className="mt-2">
          We aim to respond to general platform questions within one to two business days, depending on queue volume.
        </p>
      </div>
      <div>
        <h2 className="text-lg font-bold text-[#1d3720]">For Operational Issues</h2>
        <p className="mt-2">
          If your issue affects a live order or pickup, include the order id or listing title so the team can trace it faster.
        </p>
      </div>
    </InfoPageLayout>
  );
}
