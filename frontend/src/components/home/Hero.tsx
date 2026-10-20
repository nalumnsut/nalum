import { useState, useEffect, useRef } from 'react';
import { PreloadLink } from '@/components/PreloadLink';
import { ArrowRight } from 'lucide-react';
import heroImage from '@/assets/hero.png';

const Hero = () => {
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  // Parallax scroll animation
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const heroBottom = heroRef.current.offsetHeight;
        const currentScroll = window.scrollY;
        if (currentScroll <= heroBottom) {
          setScrollY(currentScroll);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      ref={heroRef}
      className="relative w-full h-[calc(100vh-76px)] min-h-[560px] max-h-[850px] text-white overflow-hidden flex items-center"
      style={{ contain: 'layout' }}
    >
      {/* Background Drone Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="NSUT Campus Aerial Drone View"
          width="1920"
          height="1080"
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover object-center"
          loading="eager"
          decoding="async"
        />
      </div>

      {/* Dark overlay: heavier on the left for text contrast, fading out to reveal campus fountain */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20" />
      <div className="absolute inset-0 bg-black/15" />

      {/* Content Aligned Left as in Figma */}
      <div className="container mx-auto px-6 md:px-12 lg:px-16 relative z-10">
        <div
          className="max-w-2xl text-left"
          style={{
            transform: `translate3d(0, ${Math.min(scrollY * 0.35, 120)}px, 0)`,
            willChange: scrollY > 0 && scrollY < 400 ? 'transform' : 'auto',
          }}
        >
          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1] drop-shadow-md animate-fade-in">
            Continue your <br />
            lifelong <span className="text-[#f59e0b]">journey.</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-4 md:mt-5 text-base sm:text-lg md:text-xl text-white/90 leading-relaxed max-w-xl drop-shadow animate-fade-in animation-delay-200">
            Build connections, explore resources,<br className="hidden sm:inline" />
            {' '}and find new opportunities.
          </p>

          {/* CTA Buttons */}
          <div className="mt-7 md:mt-9 flex flex-wrap items-center gap-3.5 sm:gap-4 animate-fade-in animation-delay-300">
            <PreloadLink
              to="/signup"
              className="inline-flex items-center justify-center bg-[#d99b26] hover:bg-[#c4891b] text-gray-950 font-semibold px-6 sm:px-7 py-2.5 sm:py-3 rounded-full text-sm sm:text-base shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Create Account
            </PreloadLink>

            <PreloadLink
              to="/benefits/alumni-directory"
              className="inline-flex items-center justify-center gap-2 bg-black/40 hover:bg-black/60 text-white font-medium border border-white/40 px-6 sm:px-7 py-2.5 sm:py-3 rounded-full text-sm sm:text-base backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95 group"
            >
              <span>Explore the Network</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </PreloadLink>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
