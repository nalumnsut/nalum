import { Heart, Lock, ChevronRight } from 'lucide-react';
import { PreloadLink } from "@/components/PreloadLink";

const GivingStories = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-nsut-maroon via-nsut-maroon/95 to-nsut-maroon/90">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>
        
        <div className="container mx-auto px-4 py-24 relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-6 animate-fade-in-delay-1">
              <Heart className="w-10 h-10 text-nsut-yellow" />
            </div>
            
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-white mb-6 animate-fade-in-delay-2">
              Giving Stories
            </h1>
            
            <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed animate-fade-in-delay-3">
              Stories of generosity, impact, and transformation from alumni who are giving back to NSUT.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto">
          {/* Empty State */}
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center animate-fade-in-delay-4">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-red-100 to-pink-200 rounded-full mb-6">
              <Heart className="w-12 h-12 text-red-500" />
            </div>
            
            <h2 className="text-3xl font-serif font-bold text-gray-800 mb-4">
              No Giving Stories Yet
            </h2>
            
            <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
              We're collecting inspiring stories of alumni contributions and their impact on the NSUT community. Stay tuned for heartwarming stories of generosity.
            </p>

            {/* Login CTA */}
            <div className="bg-gradient-to-r from-nsut-maroon/5 to-nsut-yellow/5 rounded-xl p-8 mb-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Lock className="w-5 h-5 text-nsut-maroon" />
                <p className="text-gray-700 font-medium">
                  Want to share your giving story?
                </p>
              </div>
              <p className="text-gray-600 mb-6">
                Login to tell your story and inspire others to give back
              </p>
              <PreloadLink
                to="/login"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-nsut-maroon to-nsut-maroon/90 text-white px-8 py-3 rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                Login to Continue
                <ChevronRight className="w-4 h-4" />
              </PreloadLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GivingStories;
