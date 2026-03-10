import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';
import { Award } from 'lucide-react';
import { Link } from 'react-router-dom';

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
        description: "Known for his iconic role in TVF Pitchers, Naveen has become a household name in Indian digital entertainment.",
        achievements: ["Lead actor in TVF Pitchers", "Featured in multiple web series", "Theater artist and performer"],
        gradientFrom: "from-[#800000]",
        gradientTo: "to-[#600000]",
    },
    {
        id: 3,
        name: "Ira Singhal",
        folderName: "Ira-Singhal",
        title: "IAS Officer (Rank 1, 2014)",
        description: "First differently-abled woman to top the UPSC Civil Services Examination. Her journey is an inspiration to millions.",
        achievements: ["UPSC Rank 1 (2014)", "First differently-abled woman topper", "Advocate for inclusive policies"],
        gradientFrom: "from-[#800000]",
        gradientTo: "to-[#5A0000]",
    },
    {
        id: 5,
        name: "Prashasti Singh",
        folderName: "Prashasti-Singh",
        title: "Stand-up Comedian",
        description: "One of India's most successful female comedians, known for her witty observations and relatable humor.",
        achievements: ["Netflix special performer", "1M+ social media followers", "Touring internationally"],
        gradientFrom: "from-[#800000]",
        gradientTo: "to-[#650000]",
    },
    {
        id: 7,
        name: "Aman Dhattarwal",
        folderName: "Aman-Dhattarwal",
        title: "YouTuber & Educator",
        description: "Helping millions of students achieve their academic goals through engaging educational content.",
        achievements: ["3M+ YouTube subscribers", "Founded Apni Kaksha", "Impacted 10M+ students"],
        gradientFrom: "from-[#800000]",
        gradientTo: "to-[#6B0000]",
    },
];

const AlumniCard = ({ alumni, index }: { alumni: AlumniProfile; index: number }) => {
    const [imageLoaded, setImageLoaded] = useState(false);

    const getImagePath = () => {
        return `/stories/notableAlumni/${alumni.folderName}/1.webp`;
    };

    const isEven = index % 2 === 0;

    return (
        <>
            {/* Desktop View */}
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className={`hidden lg:flex items-center gap-12 ${isEven ? 'flex-row' : 'flex-row-reverse'} max-w-5xl mx-auto mb-20 relative`}
            >
                {/* Content Side */}
                <div className="flex-1 space-y-4">
                    <div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-1">{alumni.name}</h3>
                        <p className={`text-lg font-semibold bg-gradient-to-r ${alumni.gradientFrom} ${alumni.gradientTo} bg-clip-text text-transparent`}>
                            {alumni.title}
                        </p>
                    </div>
                    <p className="text-gray-600 leading-relaxed">{alumni.description}</p>
                    <div className="space-y-2">
                        {alumni.achievements.slice(0, 2).map((achievement, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                                <Award className={`w-4 h-4 mt-1 ${alumni.gradientFrom.replace('from-', 'text-')}`} />
                                <span className="text-sm text-gray-700">{achievement}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Image Side */}
                <div className="flex-1 relative">
                    <motion.div
                        className="relative w-full rounded-xl overflow-hidden shadow-xl"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.3 }}
                    >
                        {!imageLoaded && (
                            <div className={`absolute inset-0 bg-gradient-to-br ${alumni.gradientFrom} ${alumni.gradientTo} opacity-20 animate-pulse`} />
                        )}
                        <img
                            src={getImagePath()}
                            alt={alumni.name}
                            className="w-full h-auto object-contain"
                            onLoad={() => setImageLoaded(true)}
                            loading={index < 2 ? "eager" : "lazy"}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    </motion.div>
                </div>
            </motion.div>

            {/* Mobile View */}
            <div className="lg:hidden max-w-md mx-auto mb-8 bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="relative w-full bg-gray-50">
                    {!imageLoaded && (
                        <div className={`absolute inset-0 bg-gradient-to-br ${alumni.gradientFrom} ${alumni.gradientTo} opacity-20 animate-pulse`} />
                    )}
                    <img
                        src={getImagePath()}
                        alt={alumni.name}
                        className="w-full h-72 object-contain"
                        onLoad={() => setImageLoaded(true)}
                        loading={index < 2 ? "eager" : "lazy"}
                    />
                </div>
                <div className="p-5 space-y-3">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">{alumni.name}</h3>
                        <p className={`text-sm font-semibold bg-gradient-to-r ${alumni.gradientFrom} ${alumni.gradientTo} bg-clip-text text-transparent`}>
                            {alumni.title}
                        </p>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">{alumni.description}</p>
                </div>
            </div>
        </>
    );
};

const NotableAlumniSection = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start center", "end end"],
    });

    const ropeHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

    return (
        <section className="py-16 bg-gradient-to-b from-white via-gray-50 to-white overflow-hidden">
            {/* Header */}
            <div className="container mx-auto px-4 text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                    Notable <span className="bg-gradient-to-r from-[#800000] to-[#FFD700] bg-clip-text text-transparent">Alumni</span>
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Celebrating the extraordinary achievements of NSUT graduates making a difference worldwide.
                </p>
            </div>

            {/* Desktop Timeline */}
            <div ref={containerRef} className="hidden lg:block relative py-8 px-4">
                {/* Vertical Rope/Timeline */}
                <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2">
                    <div className="absolute inset-0 bg-gradient-to-b from-gray-200 via-gray-300 to-gray-200" />
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-b from-[#800000] via-[#FFD700] to-[#800000] origin-top"
                        style={{ height: ropeHeight }}
                    />
                </div>

                <div className="relative z-10">
                    {alumniData.map((alumni, index) => (
                        <AlumniCard key={alumni.id} alumni={alumni} index={index} />
                    ))}
                </div>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden px-4">
                {alumniData.map((alumni, index) => (
                    <AlumniCard key={alumni.id} alumni={alumni} index={index} />
                ))}
            </div>

            {/* View All Link */}
            <div className="text-center mt-8">
                <Link
                    to="/stories/notable-alumni"
                    className="inline-flex items-center gap-2 text-nsut-maroon font-semibold hover:text-[#600000] transition-colors"
                >
                    View All Notable Alumni
                    <span className="text-xl">→</span>
                </Link>
            </div>
        </section>
    );
};

export default NotableAlumniSection;
