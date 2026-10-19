import { PreloadLink } from "@/components/PreloadLink";
import { ArrowRight, Users, Briefcase, Calendar } from 'lucide-react';

const ExploreLoginCta = () => {
  const features = [
    {
      icon: Users,
      title: 'Connect with 15,000+ Alumni',
    },
    {
      icon: Briefcase,
      title: 'Access Career Opportunities',
    },
    {
      icon: Calendar,
      title: 'Join Events & Communities',
    },
  ];

  return (
    <section className="relative bg-gradient-to-b from-white via-slate-50/50 to-white py-16 md:py-24 overflow-hidden">
      {/* Subtle background grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #cbd5e1 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Section Heading */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#b91c1c] animate-fade-in">
            Start Exploring Today
          </h2>

          {/* Subheading */}
          <p className="text-gray-700 text-sm sm:text-base md:text-lg max-w-xl mx-auto mt-3.5 leading-relaxed animate-fade-in animation-delay-200">
            Login to unlock the full NSUT Alumni experience and connect with thousands of fellow NSUTians worldwide
          </p>

          {/* 3 Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-4xl lg:max-w-5xl mx-auto mt-10 md:mt-12 animate-fade-in animation-delay-300">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-8 border border-gray-100 shadow-[0_4px_25px_rgb(0,0,0,0.06)] hover:shadow-[0_12px_35px_rgb(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-1.5 flex flex-col items-center justify-center text-center group"
                >
                  <div className="w-14 h-14 rounded-full bg-rose-100/80 text-[#b91c1c] flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110">
                    <Icon className="w-6 h-6 stroke-[2]" />
                  </div>
                  <h3 className="font-semibold text-gray-800 text-base md:text-lg leading-snug">
                    {feature.title}
                  </h3>
                </div>
              );
            })}
          </div>

          {/* Bottom Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 md:mt-12 animate-fade-in animation-delay-400">
            <PreloadLink
              to="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center bg-[#b91c1c] hover:bg-[#991b1b] text-white font-semibold px-8 py-3 rounded-full text-base shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Create Account
            </PreloadLink>

            <PreloadLink
              to="/benefits/alumni-directory"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-800 font-semibold border border-gray-400 hover:border-gray-600 px-8 py-3 rounded-full text-base shadow-sm hover:shadow transition-all duration-200 hover:scale-105 active:scale-95 group"
            >
              <span>Explore the Network</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </PreloadLink>
          </div>

          {/* === BY THE NUMBERS BANNER CARD === */}
          <div className="relative bg-[#551419] rounded-[26px] md:rounded-[32px] p-2.5 sm:p-3.5 shadow-2xl overflow-hidden mt-16 md:mt-20 max-w-5xl mx-auto border border-[#420f13] text-white">
            {/* 3D Perspective Grid Background */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
              preserveAspectRatio="none"
              viewBox="0 0 800 400"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line x1="0" y1="0" x2="330" y2="160" stroke="#000000" strokeWidth="1.2" />
              <line x1="800" y1="0" x2="470" y2="160" stroke="#000000" strokeWidth="1.2" />
              <line x1="0" y1="400" x2="330" y2="240" stroke="#000000" strokeWidth="1.2" />
              <line x1="800" y1="400" x2="470" y2="240" stroke="#000000" strokeWidth="1.2" />
              <line x1="160" y1="0" x2="360" y2="160" stroke="#000000" strokeWidth="1.2" />
              <line x1="320" y1="0" x2="390" y2="160" stroke="#000000" strokeWidth="1.2" />
              <line x1="480" y1="0" x2="410" y2="160" stroke="#000000" strokeWidth="1.2" />
              <line x1="640" y1="0" x2="440" y2="160" stroke="#000000" strokeWidth="1.2" />
              <line x1="160" y1="400" x2="360" y2="240" stroke="#000000" strokeWidth="1.2" />
              <line x1="320" y1="400" x2="390" y2="240" stroke="#000000" strokeWidth="1.2" />
              <line x1="480" y1="400" x2="410" y2="240" stroke="#000000" strokeWidth="1.2" />
              <line x1="640" y1="400" x2="440" y2="240" stroke="#000000" strokeWidth="1.2" />
              <line x1="0" y1="130" x2="330" y2="185" stroke="#000000" strokeWidth="1.2" />
              <line x1="0" y1="270" x2="330" y2="215" stroke="#000000" strokeWidth="1.2" />
              <line x1="800" y1="130" x2="470" y2="185" stroke="#000000" strokeWidth="1.2" />
              <line x1="800" y1="270" x2="470" y2="215" stroke="#000000" strokeWidth="1.2" />
              <rect x="70" y="35" width="660" height="330" fill="none" stroke="#000000" strokeWidth="1.2" />
              <rect x="160" y="80" width="480" height="240" fill="none" stroke="#000000" strokeWidth="1.2" />
              <rect x="250" y="125" width="300" height="150" fill="none" stroke="#000000" strokeWidth="1.2" />
              <rect x="330" y="160" width="140" height="80" fill="none" stroke="#000000" strokeWidth="1.2" />
            </svg>

            {/* Inner Dashed Border Box */}
            <div className="border border-dashed border-[#d99b26]/40 rounded-[20px] md:rounded-[26px] py-8 sm:py-10 md:py-12 px-4 sm:px-8 relative z-10">
              {/* Header */}
              <div className="text-center mb-7 sm:mb-9">
                <span className="text-[#d99b26] font-semibold tracking-[0.2em] text-xs sm:text-sm uppercase block mb-2">
                  BY THE NUMBERS
                </span>
                <h3 className="text-white text-base sm:text-xl md:text-2xl font-normal max-w-2xl mx-auto leading-relaxed px-2">
                  A global network spanning six continents and every major industry.
                </h3>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 md:gap-4 text-center">
                {/* Stat 1 */}
                <div className="flex flex-col items-center">
                  <div className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight flex items-baseline justify-center">
                    <span>10,000</span>
                    <span className="text-[#d99b26] ml-0.5 font-sans font-semibold">+</span>
                  </div>
                  <p className="mt-2 text-[11px] sm:text-xs md:text-sm font-semibold tracking-wider text-gray-300 uppercase">
                    ALUMNI WORLDWIDE
                  </p>
                </div>

                {/* Stat 2 */}
                <div className="flex flex-col items-center">
                  <div className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight flex items-baseline justify-center">
                    <span>50</span>
                    <span className="text-[#d99b26] ml-0.5 font-sans font-semibold">+</span>
                  </div>
                  <p className="mt-2 text-[11px] sm:text-xs md:text-sm font-semibold tracking-wider text-gray-300 uppercase">
                    COUNTRIES
                  </p>
                </div>

                {/* Stat 3 */}
                <div className="flex flex-col items-center">
                  <div className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight flex items-baseline justify-center">
                    <span>200</span>
                    <span className="text-[#d99b26] ml-0.5 font-sans font-semibold">+</span>
                  </div>
                  <p className="mt-2 text-[11px] sm:text-xs md:text-sm font-semibold tracking-wider text-gray-300 uppercase">
                    TOP COMPANIES
                  </p>
                </div>

                {/* Stat 4 */}
                <div className="flex flex-col items-center">
                  <div className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight flex items-baseline justify-center">
                    <span>15</span>
                    <span className="text-[#d99b26] ml-0.5 font-sans font-semibold">+</span>
                  </div>
                  <p className="mt-2 text-[11px] sm:text-xs md:text-sm font-semibold tracking-wider text-gray-300 uppercase">
                    INDUSTRY DOMAIN
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExploreLoginCta;
