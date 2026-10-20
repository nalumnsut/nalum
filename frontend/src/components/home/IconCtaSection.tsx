import { PreloadLink } from "@/components/PreloadLink";
import { ArrowRight, ChevronRight, Users, CheckCircle2 } from 'lucide-react';

interface CtaItem {
  title: string;
  description: string;
  link: string;
  linkText: string;
  highlights: string[];
  filled: boolean;
  badgeBg: string;
  badgeTextColor: string;
  checkColor: string;
}

const IconCtaSection = () => {
  const ctaItems: CtaItem[] = [
    {
      title: "Attend an Event",
      description: "Reunions, workshops, and campus celebrations across chapters.",
      link: "/events/attend",
      linkText: "See Upcoming Events",
      highlights: [
        "Annual Global Alumni Meet & Silver Jubilees",
        "Industry Roundtables & Tech Keynotes",
      ],
      filled: true,
      badgeBg: "bg-red-50",
      badgeTextColor: "text-[#b91c1c]",
      checkColor: "text-slate-400",
    },
    {
      title: "Explore Communities",
      description: "Interest-based groups and professional circles built by alumni.",
      link: "/communities/explore",
      linkText: "Browse Communities",
      highlights: [
        "Silicon Valley & Bay Area Founders Circle",
        "Civil Services & Public Policy Guild",
      ],
      filled: false,
      badgeBg: "bg-slate-100",
      badgeTextColor: "text-slate-600",
      checkColor: "text-red-400",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50/80 via-white to-gray-50/50 overflow-hidden">
      {/* Background subtle pattern matching WhereWeWork & NotableAlumni */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23800000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        {/* Section Header — matches typography & spacing of WhereOurAlumniWork */}
        <div className="mb-10 md:mb-14">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-500 mb-2">
            COMMUNITY PATHWAYS
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#b91c1c] mb-3">
            Get Involved
          </h2>
          <p className="text-gray-700 text-sm sm:text-base md:text-lg max-w-xl leading-relaxed">
            Ways to stay connected, give back, and grow with the NSUT community.
          </p>
        </div>

        {/* CTA Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {ctaItems.map((item, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl border border-gray-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 p-6 md:p-8 flex flex-col justify-between"
            >
              {/* Card Content */}
              <div>
                {/* Icon Badge */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${item.badgeBg} ${item.badgeTextColor}`}
                >
                  <Users className="w-6 h-6" />
                </div>

                {/* Title */}
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 tracking-tight">
                  {item.title}
                </h3>

                {/* Short, punchy description */}
                <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                  {item.description}
                </p>

                {/* Divider Line from Figma */}
                <div className="border-t border-gray-100 my-6" />

                {/* Highlights List */}
                <div className="space-y-3 mb-8">
                  {item.highlights.map((highlight, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2
                        className={`w-[18px] h-[18px] mt-0.5 flex-shrink-0 ${item.checkColor}`}
                      />
                      <span className="text-sm text-gray-700 font-medium leading-snug">
                        {highlight}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Full-width CTA Button */}
              <PreloadLink
                to={item.link}
                className={`w-full flex items-center justify-between px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 group/btn ${
                  item.filled
                    ? 'bg-gradient-to-r from-[#b91c1c] via-[#b41b1b] to-[#991b1b] text-white shadow-md shadow-red-900/10 hover:shadow-lg hover:from-[#a81919] hover:to-[#881313]'
                    : 'bg-white text-gray-900 border border-gray-200 shadow-sm hover:border-gray-300 hover:bg-gray-50/80'
                }`}
              >
                <span>{item.linkText}</span>
                {item.filled ? (
                  <ArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-600 transform group-hover/btn:translate-x-1 transition-transform" />
                )}
              </PreloadLink>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IconCtaSection;
