import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import Programs from "@/components/programs";
import Method from "@/components/method";
import WhyMugabe from "@/components/why-mugabe";
import Coach from "@/components/coach";
import HowToStart from "@/components/how-to-start";
import EnquiryForm from "@/components/enquiry-form";
import SiteContentSync from "@/components/site-content-sync";
import SiteFooter from "@/components/site-footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-black">
      <SiteContentSync />
      <Navbar />
      <Hero />
      <Programs />
      <Method />
      <WhyMugabe />
      <Coach />
      <HowToStart />
      <EnquiryForm />
      <SiteFooter />
    </main>
  );
}
