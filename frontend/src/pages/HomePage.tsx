import Hero from '@/components/home/Hero';
import IconCtaSection from '@/components/home/IconCtaSection';
import ExploreLoginCta from '@/components/home/ExploreLoginCta';
import NewsSection from '@/components/home/NewsSection';
import GivingSection from '@/components/home/GivingSection';
import WhereWeWorkSection from '@/components/home/WhereWeWorkSection';
import NotableAlumniSection from '@/components/home/NotableAlumniSection';
import AlumniMapTeaser from "@/components/home/AlumniMapTeaser";

const HomePage = () => {
  return (
    <main>
      <Hero />
      <ExploreLoginCta />
      <WhereWeWorkSection />
      <NotableAlumniSection />
      <AlumniMapTeaser />
      <IconCtaSection />
      <NewsSection />
      <GivingSection />
    </main>
  );
};

export default HomePage;
