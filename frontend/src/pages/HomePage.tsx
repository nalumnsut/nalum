import Hero from '@/components/home/Hero';
import IconCtaSection from '@/components/home/IconCtaSection';
import ExploreLoginCta from '@/components/home/ExploreLoginCta';
import NewsSection from '@/components/home/NewsSection';
import GivingSection from '@/components/home/GivingSection';
import WhereWeWorkSection from '@/components/home/WhereWeWorkSection';
import AlumniDirectorySection from '@/components/home/AlumniDirectorySection';
import NotableAlumniSection from '@/components/home/NotableAlumniSection';
import AlumniMap from "@/components/home/AlumniMap";


const HomePage = () => {
  return (
    <main>
      <Hero />
      <ExploreLoginCta />
      <IconCtaSection />
      <WhereWeWorkSection />
      <NotableAlumniSection />
      <AlumniDirectorySection />
      <NewsSection />
      <AlumniMap />

      <GivingSection />
    </main>
  );
};

export default HomePage;
