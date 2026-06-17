import InfoPageLayout from "../components/InfoPageLayout";

export default function PartnerWithUsPage() {
  return (
    <InfoPageLayout
      eyebrow="Partnerships"
      title="Partner With Us"
      intro="FeedBack works best when vendors, NGOs, delivery partners, and community organizations collaborate to reduce waste and improve access."
    >
      <div>
        <h2 className="text-lg font-bold text-[#1d3720]">Who Can Partner</h2>
        <p className="mt-2">
          We welcome food businesses, nonprofit groups, rider networks, universities, and community programs that want to support food rescue operations.
        </p>
      </div>
      <div>
        <h2 className="text-lg font-bold text-[#1d3720]">What Partnership Can Look Like</h2>
        <p className="mt-2">
          Partnerships may include listing supply, donation coordination, delivery support, awareness campaigns,
          or regional rollout collaboration.
        </p>
      </div>
      <div>
        <h2 className="text-lg font-bold text-[#1d3720]">Start a Conversation</h2>
        <p className="mt-2">
          If your organization wants to explore collaboration, reach out with a short summary of your goals and operating area.
        </p>
        <p className="mt-2 font-semibold text-[#1d3720]">partners@feedback.local</p>
      </div>
    </InfoPageLayout>
  );
}
