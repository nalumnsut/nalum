import { PreloadLink } from "@/components/PreloadLink";
import { MapPin, ChevronRight, Lock } from "lucide-react";

const AlumniMapTeaser = () => {
  return (
    <section className="py-12 md:py-16 bg-white overflow-hidden">
      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        {/* Top Auth Unlock Bar */}
        <div className="flex flex-wrap items-center gap-3.5 mb-8 sm:mb-10">
          <PreloadLink
            to="/signup"
            className="inline-flex items-center justify-center bg-gradient-to-b from-[#bd3f45] to-[#a61c22] hover:from-[#ab353b] hover:to-[#91141a] text-white font-semibold text-sm px-6 py-2.5 rounded-xl border border-[#b84248]/50 shadow-[0_4px_12px_rgba(166,28,34,0.35)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Create Free Account
          </PreloadLink>

          <PreloadLink
            to="/login"
            className="inline-flex items-center justify-center bg-white border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-800 font-semibold text-sm px-6 py-2.5 rounded-xl shadow-xs transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Login
          </PreloadLink>

          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
            <Lock className="w-4 h-4 text-gray-500 stroke-[2] flex-shrink-0" />
            <span>Full profiles, contact details and filters unlock with a free account.</span>
          </div>
        </div>

        {/* Maroon Map Teaser Card */}
        <div className="relative bg-[#731e2b] rounded-[28px] sm:rounded-[32px] md:rounded-[36px] p-3 sm:p-5 md:p-6 shadow-2xl overflow-hidden border border-[#5c1722]">
          {/* Blurred World Map Layer */}
          <div
            className="absolute inset-0 bg-center bg-cover bg-no-repeat opacity-25 filter blur-[1.5px] pointer-events-none"
            style={{ backgroundImage: "url('/world-map-simple.png')" }}
          />

          {/* Inner Dashed Border Box */}
          <div className="border border-dashed border-[#b85c5c]/45 rounded-[20px] sm:rounded-[24px] md:rounded-[28px] py-12 sm:py-16 md:py-20 px-6 sm:px-10 flex flex-col items-center justify-center text-center relative z-10">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight mb-2.5 sm:mb-3">
              Alumni Network Map
            </h2>
            <p className="text-white/90 text-sm sm:text-base md:text-lg max-w-xl mx-auto mb-7 sm:mb-8 font-normal">
              Discover where our alumni are located around the world
            </p>
            <PreloadLink
              to="/map"
              className="inline-flex items-center gap-2 bg-[#c99738] hover:bg-[#b88628] text-white font-medium text-sm sm:text-base px-6 py-2.5 sm:px-7 sm:py-3 rounded-full shadow-lg shadow-black/20 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <MapPin className="w-4 h-4 text-white stroke-[2.2]" />
              <span>Explore On Map</span>
              <ChevronRight className="w-4 h-4 text-white stroke-[2.2]" />
            </PreloadLink>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AlumniMapTeaser;
