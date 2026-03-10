import { Link } from 'react-router-dom';
import { LogIn, ArrowRight, Sparkles, Users, Network, Briefcase } from 'lucide-react';

const ExploreLoginCta = () => {
  const features = [
    { icon: Network, text: 'Connect with 15,000+ Alumni' },
    { icon: Briefcase, text: 'Access Career Opportunities' },
    { icon: Users, text: 'Join Events & Communities' },
  ];

  return (
    <div className="relative bg-gradient-to-b from-white via-nsut-beige/20 to-white py-16 md:py-24 overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-nsut-maroon/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-nsut-yellow/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Heading */}
          <h2 className="font-serif text-3xl md:text-5xl font-bold mb-4 animation-delay-200 animate-fade-in">
            <span className="bg-gradient-to-r from-nsut-maroon via-[#800000] to-nsut-maroon bg-clip-text text-transparent">
              Start Exploring Today
            </span>
          </h2>

          {/* Subheading */}
          <p className="text-gray-600 text-lg md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed animation-delay-400 animate-fade-in">
            Login to unlock the full NSUT Alumni experience and connect with thousands of fellow NSUTians worldwide
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-10 animation-delay-600 animate-fade-in">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group/pill flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 md:px-6 py-2 md:py-3 shadow-md hover:shadow-lg hover:border-nsut-yellow/50 transition-all duration-300 hover:-translate-y-1"
              >
                <feature.icon className="w-4 h-4 md:w-5 md:h-5 text-nsut-maroon group-hover/pill:scale-110 transition-transform duration-300" />
                <span className="text-sm md:text-base font-medium text-gray-700">
                  {feature.text}
                </span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animation-delay-800 animate-fade-in">
            <Link
              to="/login"
              className="group/btn relative inline-flex items-center gap-2 md:gap-3 bg-gradient-to-r from-nsut-maroon to-[#800000] hover:from-[#800000] hover:to-nsut-maroon text-white px-6 md:px-10 py-3 md:py-5 rounded-xl font-bold text-base md:text-xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden hover:scale-105"
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

              <LogIn className="w-6 h-6 group-hover/btn:rotate-12 transition-transform duration-300" />
              <span className="relative">Login to Explore</span>
              <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-1 transition-transform duration-300" />
            </Link>

            <Link
              to="/signup"
              className="group/btn inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-nsut-maroon border-2 border-nsut-maroon hover:border-[#800000] px-6 md:px-10 py-3 md:py-5 rounded-xl font-bold text-base md:text-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <span>Create Account</span>
              <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>

          {/* Bottom text */}
          <p className="mt-6 text-sm text-gray-500 animation-delay-1000 animate-fade-in">
            Join the network • It's free and takes less than 2 minutes
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExploreLoginCta;
