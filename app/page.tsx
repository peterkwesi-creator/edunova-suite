import Hero from "@/components/sections/Hero";
import Features from "@/components/sections/Features";
import Programs from "@/components/sections/Programs";
import Stats from "@/components/sections/Stats";
import News from "@/components/sections/News";

export default function Home() {
  return (
    <main>
      <Hero />
      <Features />
      <Programs />
      <Stats />
      <News />
    </main>
  );
}