import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { PreloadLink } from "@/components/PreloadLink";

interface AlumniProfile {
    id: number;
    name: string;
    folderName: string;
    title: string;
}

const alumniData: AlumniProfile[] = [
    {
        id: 1,
        name: "Naveen Kasturia",
        folderName: "Naveen-Kasturia",
        title: "Actor & Content Creator",
    },
    {
        id: 2,
        name: "Ira Singhal",
        folderName: "Ira-Singhal",
        title: "IAS Officer (Rank 1, 2014)",
    },
    {
        id: 3,
        name: "Prashasti Singh",
        folderName: "Prashasti-Singh",
        title: "Stand-Up Comedian",
    },
    {
        id: 4,
        name: "Aman Dhattarwal",
        folderName: "Aman-Dhattarwal",
        title: "YouTuber & Educator",
    },
];

const AlumniCard = ({ alumni, index }: { alumni: AlumniProfile; index: number }) => {
    const [imageLoaded, setImageLoaded] = useState(false);

    const getImagePath = () => {
        return `/stories/notableAlumni/${alumni.folderName}/1.webp`;
    };

    return (
        <div className="group relative rounded-2xl overflow-hidden cursor-pointer aspect-[3/4] bg-gradient-to-br from-orange-400 via-red-500 to-amber-500">
            {/* Loading placeholder */}
            {!imageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-red-500 to-amber-500 animate-pulse" />
            )}

            {/* Alumni Photo */}
            <img
                src={getImagePath()}
                alt={alumni.name}
                className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                onLoad={() => setImageLoaded(true)}
                loading={index < 2 ? "eager" : "lazy"}
            />

            {/* Bottom gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* Name & Title */}
            <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                <h3 className="text-white font-bold text-lg md:text-xl leading-tight mb-1">
                    {alumni.name}
                </h3>
                <p className="text-white/80 text-sm md:text-base font-medium">
                    {alumni.title}
                </p>
            </div>
        </div>
    );
};

const NotableAlumniSection = () => {
    return (
        <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50/80 via-white to-gray-50/50 overflow-hidden">
            {/* Background subtle pattern */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(135deg, #667eea 25%, transparent 25%), linear-gradient(225deg, #667eea 25%, transparent 25%), linear-gradient(45deg, #667eea 25%, transparent 25%), linear-gradient(315deg, #667eea 25%, transparent 25%)`,
                    backgroundSize: '20px 20px',
                    backgroundPosition: '10px 0, 10px 0, 0 0, 0 0',
                }}
            />

            <div className="container mx-auto px-4 max-w-7xl relative z-10">
                {/* Header Row */}
                <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10 md:mb-14 gap-4">
                    {/* Left: Label + Heading + Subtitle */}
                    <div>
                        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-500 mb-2">
                            ALUMNI SPOTLIGHT
                        </p>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#b91c1c] mb-3">
                            Alumni Making Headlines
                        </h2>
                        <p className="text-gray-700 text-sm sm:text-base md:text-lg max-w-xl leading-relaxed">
                            A few of the NSUT graduates redefining what's possible in their fields.
                        </p>
                    </div>

                    {/* Right: View All Link */}
                    <PreloadLink
                        to="/stories/notable-alumni"
                        className="inline-flex items-center gap-2 text-[#b91c1c] font-semibold hover:text-[#991b1b] transition-colors group whitespace-nowrap"
                    >
                        View All Notable Alumni
                        <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </PreloadLink>
                </div>

                {/* Alumni Cards Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {alumniData.map((alumni, index) => (
                        <AlumniCard key={alumni.id} alumni={alumni} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default NotableAlumniSection;
