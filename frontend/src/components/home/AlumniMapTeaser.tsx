import { PreloadLink } from "@/components/PreloadLink";
import { MapPin } from "lucide-react";

const bgPattern = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFD700' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

const AlumniMapTeaser = () => {
  return (
    <div className="relative bg-gradient-to-br from-nsut-maroon via-red-900 to-nsut-maroon text-white py-[72px] md:py-[120px] overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{ backgroundImage: bgPattern }}
        />
      </div>
      {/* Decorative gradient accents */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-nsut-yellow/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-nsut-yellow/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      {/* World map image layer */}
      <div
        className="absolute inset-0 bg-center bg-cover opacity-20"
        style={{ backgroundImage: "url('/world-map-simple.png')" }}
      />

      <div className="container mx-auto px-4 relative z-10 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-nsut-yellow" />
          </div>
        </div>
        <h2 className="text-2xl md:text-5xl font-serif font-bold text-white mb-4 tracking-tight">
          Alumni Network Map
        </h2>
        <p className="text-lg md:text-xl text-white/80 font-medium max-w-2xl mx-auto mb-10">
          Discover where our alumni are located around the world
        </p>
        <PreloadLink
          to="/map"
          className="inline-block px-8 py-3 border-2 border-white text-white font-semibold rounded-md hover:bg-white hover:text-nsut-maroon transition-colors duration-200"
        >
          Explore on map
        </PreloadLink>
      </div>
    </div>
  );
};

export default AlumniMapTeaser;
