import { motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Award, Users, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AlumniProfile {
  id: number;
  name: string;
  folderName: string;
  title: string;
  description: string;
  achievements: string[];
  gradientFrom: string;
  gradientTo: string;
}

const alumniData: AlumniProfile[] = [
  {
    id: 1,
    name: "Naveen Kasturia",
    folderName: "Naveen-Kasturia",
    title: "Actor & Content Creator",
    description: "Known for his iconic role in TVF Pitchers, Naveen has become a household name in Indian digital entertainment. His journey from NSUT to the entertainment industry inspires many.",
    achievements: [
      "Lead actor in TVF Pitchers",
      "Featured in multiple web series",
      "Theater artist and performer",
    ],
    gradientFrom: "from-[#800000]",
    gradientTo: "to-[#600000]",
  },
  {
    id: 3,
    name: "Ira Singhal",
    folderName: "Ira-Singhal",
    title: "IAS Officer (Rank 1, 2014)",
    description: "First differently-abled woman to top the UPSC Civil Services Examination. Her journey is an inspiration to millions, breaking barriers and creating impact.",
    achievements: [
      "UPSC Rank 1 (2014)",
      "First differently-abled woman topper",
      "Advocate for inclusive policies",
    ],
    gradientFrom: "from-[#800000]",
    gradientTo: "to-[#5A0000]",
  },
  {
    id: 5,
    name: "Prashasti Singh",
    folderName: "Prashasti-Singh",
    title: "Stand-up Comedian",
    description: "One of India's most successful female comedians, known for her witty observations and relatable humor. Breaking barriers in the comedy industry.",
    achievements: [
      "Netflix special performer",
      "1M+ social media followers",
      "Touring internationally",
    ],
    gradientFrom: "from-[#800000]",
    gradientTo: "to-[#650000]",
  },
  {
    id: 6,
    name: "Prayag Narula",
    folderName: "Prayag-Narula",
    title: "Founder & CEO",
    description: "Built and scaled multiple tech ventures. Known for his strategic thinking and ability to create products that solve real-world problems.",
    achievements: [
      "Successful exit from startup",
      "Angel investor",
      "Mentored 50+ founders",
    ],
    gradientFrom: "from-[#8B0000]",
    gradientTo: "to-[#600000]",
  },
  {
    id: 7,
    name: "Aman Dhattarwal",
    folderName: "Aman-Dhattarwal",
    title: "YouTuber & Educator",
    description: "Helping millions of students achieve their academic goals through engaging educational content. One of India's most influential edutech creators.",
    achievements: [
      "3M+ YouTube subscribers",
      "Founded Apni Kaksha",
      "Impacted 10M+ students",
    ],
    gradientFrom: "from-[#800000]",
    gradientTo: "to-[#6B0000]",
  },
  {
    id: 8,
    name: "Shradha Khapra",
    folderName: "Shradha-Khapra",
    title: "Co-founder, Apna College",
    description: "Empowering students with quality education through innovative teaching methods. Making computer science education accessible to all.",
    achievements: [
      "1M+ YouTube subscribers",
      "Co-founded Apna College",
      "Trained 5M+ students",
    ],
    gradientFrom: "from-[#900000]",
    gradientTo: "to-[#650000]",
  },
  {
    id: 9,
    name: "Love Babbar",
    folderName: "Love-Babbar",
    title: "Software Engineer & Educator",
    description: "Known for his comprehensive DSA course and helping thousands crack top tech interviews. Making coding education accessible and effective.",
    achievements: [
      "1.5M+ YouTube subscribers",
      "Software Engineer at top firms",
      "Created viral DSA content",
    ],
    gradientFrom: "from-[#800000]",
    gradientTo: "to-[#5B0000]",
  },
];

// Individual Alumni Card Component
const AlumniCard = ({ alumni, index }: { alumni: AlumniProfile; index: number }) => {
  const ref = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  
  // Determine image extensions
  const getImagePath = (imageNum: number) => {
    return `/stories/notableAlumni/${alumni.folderName}/${imageNum}.webp`;
  };

  const isEven = index % 2 === 0;
  
  // Eager load first 2 alumni, lazy load rest
  const shouldEagerLoad = index < 2;

  return (
    <>
      {/* Desktop View - Complex with animations */}
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className={`hidden lg:flex items-center gap-8 lg:gap-16 ${
          isEven ? 'flex-row' : 'flex-row-reverse'
        } max-w-6xl mx-auto mb-32 relative`}
      >
      {/* Content Side */}
      <motion.div
        className="flex-1 space-y-6"
        initial={{ opacity: 0, x: isEven ? -50 : 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        {/* Name & Title */}
        <div>
          <h3 className="text-4xl font-bold text-gray-900 mb-2">{alumni.name}</h3>
          <p className={`text-xl font-semibold bg-gradient-to-r ${alumni.gradientFrom} ${alumni.gradientTo} bg-clip-text text-transparent`}>
            {alumni.title}
          </p>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-lg leading-relaxed">{alumni.description}</p>

        {/* Achievements */}
        <div className="space-y-3">
          {alumni.achievements.map((achievement, idx) => (
            <motion.div
              key={idx}
              className="flex items-start gap-3"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 + idx * 0.1 }}
            >
              <Award className={`w-5 h-5 mt-1 ${alumni.gradientFrom.replace('from-', 'text-')}`} />
              <span className="text-gray-700">{achievement}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Image Side */}
      <motion.div
        className="flex-1 relative"
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        {/* Main Image */}
        <motion.div
          className="relative w-full rounded-2xl overflow-hidden shadow-2xl"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          {!imageLoaded && (
            <div className={`absolute inset-0 bg-gradient-to-br ${alumni.gradientFrom} ${alumni.gradientTo} opacity-20 animate-pulse`} />
          )}
          <img
            src={getImagePath(1)}
            alt={alumni.name}
            className="w-full h-auto object-contain"
            onLoad={() => setImageLoaded(true)}
            loading={shouldEagerLoad ? "eager" : "lazy"}
          />
          <div className={`absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent`} />
        </motion.div>
      </motion.div>
    </motion.div>

      {/* Mobile View - Simple cards */}
      <div className="lg:hidden max-w-2xl mx-auto mb-12 bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Image */}
        <div className="relative w-full">
          {!imageLoaded && (
            <div className={`absolute inset-0 bg-gradient-to-br ${alumni.gradientFrom} ${alumni.gradientTo} opacity-20 animate-pulse`} />
          )}
          <img
            src={getImagePath(1)}
            alt={alumni.name}
            className="w-full h-auto object-contain"
            onLoad={() => setImageLoaded(true)}
            loading={shouldEagerLoad ? "eager" : "lazy"}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Name & Title */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{alumni.name}</h3>
            <p className={`text-base font-semibold bg-gradient-to-r ${alumni.gradientFrom} ${alumni.gradientTo} bg-clip-text text-transparent mt-1`}>
              {alumni.title}
            </p>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-base leading-relaxed">{alumni.description}</p>

          {/* Achievements */}
          <div className="space-y-2 pt-2">
            {alumni.achievements.map((achievement, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Award className={`w-4 h-4 mt-1 flex-shrink-0 ${alumni.gradientFrom.replace('from-', 'text-')}`} />
                <span className="text-sm text-gray-700">{achievement}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

// Main Component
export default function NotableAlumni() {
  const navigate = useNavigate();

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end end"],
  });

  const ropeHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  // Add smooth scroll behavior
  useEffect(() => {
    // Enable smooth scrolling
    document.documentElement.style.scrollBehavior = 'smooth';
    
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      {/* Hero Header */}
      <motion.section
        className="relative py-24 px-4 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Plus Pattern Background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23800000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#800000]/5 via-transparent to-[#FFD700]/5" />
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6">
              Notable <span className="bg-gradient-to-r from-[#800000] to-[#FFD700] bg-clip-text text-transparent">Alumni</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
              Celebrating the extraordinary achievements of NSUT graduates who are making a difference across industries worldwide.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="flex flex-wrap justify-center gap-8 mt-12"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-full shadow-lg">
              <Users className="w-8 h-8 text-[#800000]" />
              <div className="text-left">
                <div className="text-2xl font-bold text-gray-900">{alumniData.length}</div>
                <div className="text-sm text-gray-600">Featured Alumni</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-full shadow-lg">
              <TrendingUp className="w-8 h-8 text-[#FFD700]" />
              <div className="text-left">
                <div className="text-2xl font-bold text-gray-900">6+</div>
                <div className="text-sm text-gray-600">Industries</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-full shadow-lg">
              <Award className="w-8 h-8 text-[#800000]" />
              <div className="text-left">
                <div className="text-2xl font-bold text-gray-900">∞</div>
                <div className="text-sm text-gray-600">Possibilities</div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Timeline Section - Desktop Only */}
      <section ref={containerRef} className="hidden lg:block relative py-20 px-4">
        {/* Plus Pattern Background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23800000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>
        
        {/* Vertical Rope/Timeline */}
        <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2">
          {/* Background line */}
          <div className="absolute inset-0 bg-gradient-to-b from-gray-200 via-gray-300 to-gray-200" />
          
          {/* Animated progress line */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-[#800000] via-[#FFD700] to-[#800000] origin-top"
            style={{ height: ropeHeight }}
          />
        </div>

        {/* Alumni Cards with Timeline Dots */}
        <div className="relative z-10">
          {alumniData.map((alumni, index) => (
            <div key={alumni.id} className="relative mb-32">
              <AlumniCard alumni={alumni} index={index} />
            </div>
          ))}
        </div>
      </section>

      {/* Mobile Alumni Cards - Simple List */}
      <section className="lg:hidden relative py-12 px-4">
        {/* Plus Pattern Background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23800000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>

        <div className="relative z-10">
          {alumniData.map((alumni, index) => (
            <AlumniCard key={alumni.id} alumni={alumni} index={index} />
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <motion.section
        className="py-24 px-4 bg-gradient-to-br from-[#800000] to-[#600000] text-white"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6">Become the Next Success Story</h2>
          <p className="text-xl mb-8 text-gray-200">
            Join the NSUT Alumni Network and connect with thousands of accomplished professionals.
          </p>
          <motion.button
            className="bg-white text-[#800000] px-8 py-4 rounded-full font-semibold text-lg flex items-center gap-2 mx-auto hover:bg-gray-100 transition-colors shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/login")}
          >
            Join Our Network
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.section>
    </div>
  );
}
