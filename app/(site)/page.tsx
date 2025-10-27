import { Metadata } from "next";
import Hero from "@/components/Hero";
import Integration from "@/components/Integration";
import Pricing from "@/components/Pricing";
import Contact from "@/components/Contact";


export const metadata: Metadata = {
  title: "SightSafe | The Future of Disease Recognition",
  description: "AI Powered",
  // other metadata
};

export default function Home() {
  return (
    <main>
      <Hero />
      <Contact />
    </main>
  );
}
