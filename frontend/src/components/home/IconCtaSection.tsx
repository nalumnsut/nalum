import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const IconCtaSection = () => {
  const ctaItems = [
    {
      text: "Attend an Event",
      description: "Join upcoming reunions, workshops, and campus celebrations designed to reconnect alumni and inspire students.",
      link: "/events/attend",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAP44Rre0Bvf4TVu2s1qNcTFyXwjNOCfnTglA0qGluSCEn4vE1teJn6LccEH1Ono_w3i1ei-TKcj4GpCVWvCjZqVXZygUn7UBG3Zy6YFV9QuMkCiTD8MUQjpAbniRVuR_JlxzA6FJq_hAGLe558ybOUt-rNmZA_kZiuOxPtNe7qQuUmaaNVd6hLmhKXUuR-c94I50DX2OOHJDY8QtETDCm7tZrb2o3E9CrghBClCcu25N7oTbxwH0XIW2v4Q6NGffFC3HWhcvW-_m3b",
      overlayColor: "bg-nsut-maroon/10"
    },
    {
      text: "Explore Communities",
      description: "Connect with fellow alumni who share your interests through exclusive professional networks and social clubs.",
      link: "/communities/explore",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBWmF5t4TWzBg2ul-4Z2X5Pq_TstQmMVJ8wlYkV7Ep_jsleFgltI99MxhffPgLZjK_4bAX8bsIQo62szdA4Y0xJajYcWQo59ce86qJUPBU_9q4IByE3IP6qhxNt4oGozbhZ-ho4uW-fNjPSOIIHj0qzlv9Eg3HfykPsqYKAy1cnPPXldz9abW9WSuhgd_Sug-Er9SOMi7l_7PDJkDE8V9CV21Qm5ln_xuoSbVmBFCf73jAxiZE6Zaj8MLVaX7b6ssc3wKV5eGGW8VrA",
      overlayColor: "bg-yellow-500/10"
    },
  ];

  return (
    <div className="relative bg-gradient-to-b from-white via-gray-50 to-white py-12 md:py-20">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23800000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl md:text-5xl font-serif font-bold text-gray-900 mb-4 tracking-tight">
            Get Involved
          </h2>
          <p className="text-lg md:text-xl text-gray-600 font-medium max-w-2xl mx-auto">
            Stay connected and make an impact in the NSUT community
          </p>
        </div>

        {/* CTA Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-7xl mx-auto">
          {ctaItems.map((item, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col sm:flex-row border border-gray-100 h-full"
            >
              {/* Image Container */}
              <div className="w-full sm:w-2/5 h-64 sm:h-auto relative overflow-hidden">
                <img
                  src={item.image}
                  alt={item.text}
                  className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
                <div className={`absolute inset-0 ${item.overlayColor} group-hover:bg-transparent transition-colors duration-300`} />
              </div>

              {/* Content Container */}
              <div className="w-full sm:w-3/5 p-5 md:p-8 flex flex-col justify-center relative">
                <h3 className="font-serif text-2xl font-bold text-gray-900 mb-3">
                  {item.text}
                </h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  {item.description}
                </p>
                <Link
                  to={item.link}
                  className="inline-flex items-center text-nsut-maroon font-semibold hover:text-red-700 transition-colors group/link"
                >
                  Learn more
                  <ArrowRight className="ml-1 h-5 w-5 transform group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IconCtaSection;
