import { useState, useEffect, useRef } from 'react';
import { Globe, TrendingUp, Building2, Layers, Search, X } from 'lucide-react';

// Company data with categories
type Company = {
    name: string;
    logo: string;
    category: 'Tech' | 'Core' | 'Non-Tech' | 'Hybrid';
};

const companies: Company[] = [
    // TECH COMPANIES
    { name: 'Adobe', logo: '/benefits/learnings/logos/Adobe.jpeg', category: 'Tech' },
    { name: 'Aidash', logo: '/benefits/learnings/logos/Aidash.jpeg', category: 'Tech' },
    { name: 'Amantya Technologies', logo: '/benefits/learnings/logos/Amantya Technologies.jpeg', category: 'Tech' },
    { name: 'Ambak', logo: '/benefits/learnings/logos/Ambak.jpeg', category: 'Tech' },
    { name: 'Apple', logo: '/benefits/learnings/logos/Apple.jpeg', category: 'Tech' },
    { name: 'Arcesium', logo: '/benefits/learnings/logos/Arcesium.jpeg', category: 'Tech' },
    { name: 'Armorcode', logo: '/benefits/learnings/logos/Armorcode.jpeg', category: 'Tech' },
    { name: 'Atlassian', logo: '/benefits/learnings/logos/Atlassian.jpeg', category: 'Tech' },
    { name: 'Auxia', logo: '/benefits/learnings/logos/Auxia.jpeg', category: 'Tech' },
    { name: 'Baaz Bikes', logo: '/benefits/learnings/logos/Baaz Bikes.jpeg', category: 'Tech' },
    { name: 'BharatPe', logo: '/benefits/learnings/logos/BharatPe.jpeg', category: 'Tech' },
    { name: 'Black and Green', logo: '/benefits/learnings/logos/Black and Green.jpeg', category: 'Tech' },
    { name: 'Blu Smart', logo: '/benefits/learnings/logos/Blu Smart.jpeg', category: 'Tech' },
    { name: 'Bytical AI', logo: '/benefits/learnings/logos/Bytical AI.jpeg', category: 'Tech' },
    { name: 'Cadence', logo: '/benefits/learnings/logos/Cadence.jpeg', category: 'Tech' },
    { name: 'Cisco', logo: '/benefits/learnings/logos/Cisco.jpeg', category: 'Tech' },
    { name: 'Clear', logo: '/benefits/learnings/logos/Clear.jpeg', category: 'Tech' },
    { name: 'Cloudwick', logo: '/benefits/learnings/logos/Cloudwick.jpeg', category: 'Tech' },
    { name: 'CommerceIQ', logo: '/benefits/learnings/logos/CommerceIQ.jpeg', category: 'Tech' },
    { name: 'COSM Technologies', logo: '/benefits/learnings/logos/COSM Technologies.jpeg', category: 'Tech' },
    { name: 'Cyran', logo: '/benefits/learnings/logos/Cyran.jpeg', category: 'Tech' },
    { name: 'DeShaw', logo: '/benefits/learnings/logos/DeShaw.jpeg', category: 'Tech' },
    { name: 'DigiIQ', logo: '/benefits/learnings/logos/DigiIQ.jpeg', category: 'Hybrid' },
    { name: 'DotPe', logo: '/benefits/learnings/logos/DotPe.jpeg', category: 'Tech' },
    { name: 'E2E Networks', logo: '/benefits/learnings/logos/E2E Networks.jpeg', category: 'Tech' },
    { name: 'Engineersmind Corp', logo: '/benefits/learnings/logos/Engineersmind Corp.jpeg', category: 'Tech' },
    { name: 'Estee Advisor', logo: '/benefits/learnings/logos/Estee Advisor.jpeg', category: 'Tech' },
    { name: 'Expedia Group', logo: '/benefits/learnings/logos/Expedia Group.jpeg', category: 'Hybrid' },
    { name: 'Flipkart', logo: '/benefits/learnings/logos/Flipkart.jpeg', category: 'Tech' },
    { name: 'Flydocs', logo: '/benefits/learnings/logos/Flydocs.jpeg', category: 'Tech' },
    { name: 'Fundwave', logo: '/benefits/learnings/logos/Fundwave.jpeg', category: 'Tech' },
    { name: 'Gartner', logo: '/benefits/learnings/logos/Gartner.jpeg', category: 'Tech' },
    { name: 'GE Healthcare', logo: '/benefits/learnings/logos/GE Healthcare.jpeg', category: 'Tech' },
    { name: 'Godaddy', logo: '/benefits/learnings/logos/Godaddy.jpeg', category: 'Tech' },
    { name: 'Goldman Sachs', logo: '/benefits/learnings/logos/Goldman Sachs.jpeg', category: 'Tech' },
    { name: 'Google', logo: '/benefits/learnings/logos/Google.jpeg', category: 'Tech' },
    { name: 'Headlamp', logo: '/benefits/learnings/logos/Headlamp.jpeg', category: 'Tech' },
    { name: 'Hike', logo: '/benefits/learnings/logos/Hike.jpeg', category: 'Tech' },
    { name: 'Humantic AI', logo: '/benefits/learnings/logos/Humantic AI.jpeg', category: 'Tech' },
    { name: 'IBM', logo: '/benefits/learnings/logos/IBM.jpeg', category: 'Tech' },
    { name: 'Indigo', logo: '/benefits/learnings/logos/Indigo.jpeg', category: 'Tech' },
    { name: 'Innovis', logo: '/benefits/learnings/logos/Innovis.jpeg', category: 'Tech' },
    { name: 'Intuit', logo: '/benefits/learnings/logos/Intuit.jpeg', category: 'Tech' },
    { name: 'JPMC', logo: '/benefits/learnings/logos/JPMC.jpeg', category: 'Tech' },
    { name: 'Kapstan', logo: '/benefits/learnings/logos/Kapstan.jpeg', category: 'Tech' },
    { name: 'Kimbal Technologies', logo: '/benefits/learnings/logos/Kimbal Technologies.jpeg', category: 'Tech' },
    { name: 'Leena AI', logo: '/benefits/learnings/logos/LeenaAi.jpeg', category: 'Hybrid' },
    { name: 'LimeRoad', logo: '/benefits/learnings/logos/limeroad.jpeg', category: 'Tech' },
    { name: 'Macquarie', logo: '/benefits/learnings/logos/Macquarie.jpeg', category: 'Tech' },
    { name: 'MagicPin', logo: '/benefits/learnings/logos/MagicPin.jpeg', category: 'Hybrid' },
    { name: 'Material Plus', logo: '/benefits/learnings/logos/MaterialPlus.jpeg', category: 'Tech' },
    { name: 'Microsoft', logo: '/benefits/learnings/logos/Microsoft.jpeg', category: 'Tech' },
    { name: 'MongoDB', logo: '/benefits/learnings/logos/MongoDB.jpeg', category: 'Tech' },
    { name: 'Monotype Solutions', logo: '/benefits/learnings/logos/Monotype.jpeg', category: 'Tech' },
    { name: 'Morgan Stanley', logo: '/benefits/learnings/logos/MorganStanley.jpeg', category: 'Tech' },
    { name: 'myKaarma', logo: '/benefits/learnings/logos/mykaarma.jpeg', category: 'Tech' },
    { name: 'NatWest', logo: '/benefits/learnings/logos/Natwest.jpeg', category: 'Tech' },
    { name: 'Nexalis International', logo: '/benefits/learnings/logos/NexalisInternational.jpeg', category: 'Tech' },
    { name: 'NVIDIA', logo: '/benefits/learnings/logos/NVIDIA.jpeg', category: 'Tech' },
    { name: 'Nykaa', logo: '/benefits/learnings/logos/Nykaa.jpeg', category: 'Tech' },
    { name: 'OLX', logo: '/benefits/learnings/logos/OLX.jpeg', category: 'Tech' },
    { name: 'OYO', logo: '/benefits/learnings/logos/OYO.jpeg', category: 'Tech' },
    { name: 'PayPal', logo: '/benefits/learnings/logos/PayPal.jpeg', category: 'Tech' },
    { name: 'PharmEasy', logo: '/benefits/learnings/logos/PharmEasy.jpeg', category: 'Tech' },
    { name: 'Quantizer', logo: '/benefits/learnings/logos/Quantizer.jpeg', category: 'Tech' },
    { name: 'Rippling', logo: '/benefits/learnings/logos/Rippling.jpeg', category: 'Tech' },
    { name: 'Salesforce', logo: '/benefits/learnings/logos/Salesforce.jpeg', category: 'Tech' },
    { name: 'Sprinklr', logo: '/benefits/learnings/logos/spinklr.jpeg', category: 'Tech' },
    { name: 'Uber', logo: '/benefits/learnings/logos/Uber.jpeg', category: 'Tech' },
    { name: 'Visa', logo: '/benefits/learnings/logos/Visa.jpeg', category: 'Tech' },
    { name: 'Walmart', logo: '/benefits/learnings/logos/Walmart.jpeg', category: 'Tech' },
    { name: 'Zupee', logo: '/benefits/learnings/logos/Zupee.jpeg', category: 'Tech' },

    // CORE COMPANIES
    { name: 'ARM', logo: '/benefits/learnings/logos/ARM.jpeg', category: 'Core' },
    { name: 'Attero', logo: '/benefits/learnings/logos/Attero.jpeg', category: 'Core' },
    { name: 'Bechtel', logo: '/benefits/learnings/logos/Bechtel.jpeg', category: 'Core' },
    { name: 'CRITICAL INSIGHTS', logo: '/benefits/learnings/logos/CRITICAL INSIGHTS.jpeg', category: 'Core' },
    { name: 'Euler Motors', logo: '/benefits/learnings/logos/Euler Motors.jpeg', category: 'Core' },
    { name: 'GE Vernova', logo: '/benefits/learnings/logos/GE Vernova.jpeg', category: 'Core' },
    { name: 'HLS Asia', logo: '/benefits/learnings/logos/HLS Asia.jpeg', category: 'Core' },
    { name: 'MediaTek', logo: '/benefits/learnings/logos/Mediatel.jpeg', category: 'Core' },
    { name: 'Qualcomm', logo: '/benefits/learnings/logos/Qualcomm.jpeg', category: 'Core' },
    { name: 'Samsung Semiconductor', logo: '/benefits/learnings/logos/SamsungSemiconductor.jpeg', category: 'Core' },
    { name: 'SLB', logo: '/benefits/learnings/logos/SLB.jpeg', category: 'Core' },
    { name: 'Texas Instruments', logo: '/benefits/learnings/logos/TexasInstruments.jpeg', category: 'Core' },

    // NON-TECH COMPANIES
    { name: 'A&M', logo: '/benefits/learnings/logos/A&M.jpeg', category: 'Non-Tech' },
    { name: 'Algouniversity', logo: '/benefits/learnings/logos/Algouniversity.jpeg', category: 'Non-Tech' },
    { name: 'AMEX', logo: '/benefits/learnings/logos/AMEX.jpeg', category: 'Non-Tech' },
    { name: 'Astrovega Aviation', logo: '/benefits/learnings/logos/Astrovega Aviation.jpeg', category: 'Non-Tech' },
    { name: 'Axxella', logo: '/benefits/learnings/logos/Axxella.jpeg', category: 'Non-Tech' },
    { name: 'BCG', logo: '/benefits/learnings/logos/BCG.jpeg', category: 'Non-Tech' },
    { name: 'BCN', logo: '/benefits/learnings/logos/BCN.jpeg', category: 'Non-Tech' },
    { name: 'Coding Blocks', logo: '/benefits/learnings/logos/Coding Blocks.jpeg', category: 'Non-Tech' },
    { name: 'Fast Retailing', logo: '/benefits/learnings/logos/Fast Retailing.jpeg', category: 'Non-Tech' },
    { name: 'Flour Corporations', logo: '/benefits/learnings/logos/Flour Corporations.jpeg', category: 'Non-Tech' },
    { name: 'Future First', logo: '/benefits/learnings/logos/Future First.jpeg', category: 'Non-Tech' },
    { name: 'HELEUM', logo: '/benefits/learnings/logos/HELEUM.jpeg', category: 'Non-Tech' },
    { name: 'Hex Advisory', logo: '/benefits/learnings/logos/Hex Advisory.jpeg', category: 'Non-Tech' },
    { name: 'Idemitsu', logo: '/benefits/learnings/logos/Idemitsu.jpeg', category: 'Non-Tech' },
    { name: 'Infinite Locus', logo: '/benefits/learnings/logos/Infinite Locus.jpeg', category: 'Non-Tech' },
    { name: 'Junglee Games', logo: '/benefits/learnings/logos/Junglee Games.jpeg', category: 'Non-Tech' },
    { name: 'McKinsey & Company', logo: '/benefits/learnings/logos/McKinseynCompany.jpeg', category: 'Non-Tech' },
    { name: 'movidu', logo: '/benefits/learnings/logos/movidu.jpeg', category: 'Non-Tech' },

    // HYBRID COMPANIES
    { name: 'Avtaar Skincare', logo: '/benefits/learnings/logos/Avtaar Skincare.jpeg', category: 'Hybrid' },
    { name: 'Battery Smart', logo: '/benefits/learnings/logos/Battery Smart.jpeg', category: 'Hybrid' },
    { name: 'Blackcat', logo: '/benefits/learnings/logos/Blackcat.jpeg', category: 'Hybrid' },
    { name: 'Care Health', logo: '/benefits/learnings/logos/Care Health.jpeg', category: 'Hybrid' },
    { name: 'Jarvis Consulting', logo: '/benefits/learnings/logos/Jarvis Consulting.jpeg', category: 'Hybrid' },
];

const stats = [
    { label: 'Alumni Worldwide', value: 10000, suffix: '+', icon: Globe },
    { label: 'Countries', value: 50, suffix: '+', icon: TrendingUp },
    { label: 'Top Companies', value: 200, suffix: '+', icon: Building2 },
    { label: 'Industry Domains', value: 15, suffix: '+', icon: Layers },
];

// Divide companies into 4 rows for marquee
const row1Companies = companies.filter((_, i) => i % 4 === 0);
const row2Companies = companies.filter((_, i) => i % 4 === 1);
const row3Companies = companies.filter((_, i) => i % 4 === 2);
const row4Companies = companies.filter((_, i) => i % 4 === 3);

// Counter animation hook
const useCountUp = (end: number, duration: number = 2000) => {
    const [count, setCount] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);

    useEffect(() => {
        if (!hasStarted) return;

        const increment = end / (duration / 16);
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(Math.floor(current));
            }
        }, 16);

        return () => clearInterval(timer);
    }, [end, duration, hasStarted]);

    return { count, startCounting: () => setHasStarted(true) };
};

const CounterCard = ({ label, value, suffix }: { label: string; value: number; suffix: string }) => {
    const { count, startCounting } = useCountUp(value);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    startCounting();
                }
            },
            { threshold: 0.5 }
        );

        if (ref.current) observer.observe(ref.current);

        return () => observer.disconnect();
    }, [startCounting]);

    return (
        <div ref={ref} className="text-center">
            <div className="text-3xl md:text-6xl font-bold text-nsut-maroon mb-2">
                {count.toLocaleString()}{suffix}
            </div>
            <div className="text-sm text-gray-600 font-medium uppercase tracking-wide">{label}</div>
        </div>
    );
};

const LogoMarqueeRow = ({ rowCompanies, duration, onClick }: { rowCompanies: Company[]; duration: number; onClick: () => void }) => {
    // Duplicate array 2 times for seamless infinite loop (need exactly 2 copies for -50% translateX)
    const duplicatedCompanies = [...rowCompanies, ...rowCompanies];

    return (
        <div className="relative flex overflow-hidden py-3 group">
            <div
                className="flex gap-5 items-center animate-marquee whitespace-nowrap will-change-transform"
                style={{
                    animationDuration: `${duration}s`,
                }}
            >
                {duplicatedCompanies.map((company, idx) => (
                    <div
                        key={`${company.name}-${idx}`}
                        onClick={onClick}
                        className="flex-shrink-0 h-12 w-32 flex items-center justify-center transition-transform duration-300 cursor-pointer hover:scale-110"
                    >
                        <img
                            src={company.logo}
                            alt={company.name}
                            className="max-h-full max-w-full object-contain"
                            loading="lazy"
                            title={company.name}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

const WhereWeWorkSection = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<'All' | 'Tech' | 'Core' | 'Non-Tech' | 'Hybrid'>('All');

    const filteredCompanies = companies.filter((company) => {
        const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || company.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <>
            {/* Hero Section */}
            <section className="relative py-16 md:py-24 bg-gradient-to-br from-nsut-maroon via-red-900 to-nsut-maroon text-white overflow-hidden">
                {/* Background pattern - lighter opacity for dark background */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFD700' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }} />
                </div>

                {/* Decorative gradient accents */}
                <div className="absolute top-0 left-0 w-96 h-96 bg-nsut-yellow/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-nsut-yellow/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

                <div className="container mx-auto max-w-4xl px-4 relative z-10 text-center">
                    <div className="inline-block px-4 py-1.5 bg-white/10 rounded-full text-sm font-medium mb-6 backdrop-blur-sm border border-white/20">
                        NSUT Alumni Network
                    </div>
                    <h2 className="font-serif text-2xl md:text-6xl font-bold mb-6 leading-tight">
                        A Global Community of<br />
                        <span className="text-nsut-yellow">Innovators & Leaders</span>
                    </h2>
                    <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
                        From Silicon Valley to global innovation hubs, NSUT alumni are shaping the future of technology, business, and society.
                    </p>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 bg-white">
                <div className="container mx-auto max-w-6xl px-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {stats.map((stat) => (
                            <CounterCard
                                key={stat.label}
                                label={stat.label}
                                value={stat.value}
                                suffix={stat.suffix}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Infinite Marquee Section */}
            <section className="py-20 bg-gray-50 border-y border-gray-200 overflow-hidden">
                <div className="container mx-auto px-4 mb-12 text-center">
                    <h2 className="font-serif text-3xl md:text-4xl font-bold text-nsut-maroon mb-4">
                        Where We Work
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        NSUT alumni are powering the world's most influential companies.
                    </p>
                </div>

                {/* Marquee Container with Fade Edges */}
                <div className="relative max-w-[100vw] mx-auto">
                    {/* Gradient Masks */}
                    <div className="absolute inset-y-0 left-0 w-20 md:w-40 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none"></div>
                    <div className="absolute inset-y-0 right-0 w-20 md:w-40 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none"></div>

                    <div className="flex flex-col gap-4">
                        <LogoMarqueeRow rowCompanies={row1Companies} duration={80} onClick={() => setIsModalOpen(true)} />
                        <LogoMarqueeRow rowCompanies={row2Companies} duration={90} onClick={() => setIsModalOpen(true)} />
                        <LogoMarqueeRow rowCompanies={row3Companies} duration={85} onClick={() => setIsModalOpen(true)} />
                        <LogoMarqueeRow rowCompanies={row4Companies} duration={95} onClick={() => setIsModalOpen(true)} />
                    </div>
                </div>
            </section>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-start justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-6xl my-8 h-[85vh] flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex-none bg-white border-b border-gray-200 p-6 z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-nsut-maroon font-serif">Company Directory</h3>
                                    <p className="text-sm text-gray-500 mt-1">Browse all companies where our alumni work</p>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                                    aria-label="Close modal"
                                >
                                    <X size={28} />
                                </button>
                            </div>

                            <div className="flex flex-col md:flex-row gap-4">
                                {/* Search Bar */}
                                <div className="relative flex-grow">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Search by company name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-nsut-maroon focus:border-transparent transition-all"
                                    />
                                </div>

                                {/* Filter Chips */}
                                <div className="flex gap-2 flex-wrap items-center">
                                    {(['All', 'Tech', 'Core', 'Non-Tech', 'Hybrid'] as const).map((category) => (
                                        <button
                                            key={category}
                                            onClick={() => setSelectedCategory(category)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${selectedCategory === category
                                                ? 'bg-nsut-maroon text-white border-nsut-maroon'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                                        >
                                            {category}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-grow p-6 overflow-y-auto bg-gray-50/50">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {filteredCompanies.map((company, idx) => (
                                    <div
                                        key={`${company.name}-${idx}`}
                                        className="group bg-white border border-gray-200 rounded-xl p-4 hover:border-nsut-maroon/50 hover:shadow-md transition-all duration-300 flex flex-col items-center justify-center aspect-square"
                                    >
                                        <div className="w-full h-2/3 flex items-center justify-center p-2 mb-2">
                                            <img
                                                src={company.logo}
                                                alt={company.name}
                                                className="max-h-full max-w-full object-contain transition-all duration-300"
                                                loading="lazy"
                                            />
                                        </div>
                                        <div className="text-center w-full">
                                            <p className="text-xs font-semibold text-gray-800 line-clamp-1 group-hover:text-nsut-maroon transition-colors">
                                                {company.name}
                                            </p>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">
                                                {company.category}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {filteredCompanies.length === 0 && (
                                <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                                    <Search size={48} className="mb-4 opacity-20" />
                                    <p className="text-lg font-medium text-gray-500">No matches found</p>
                                    <p className="text-sm">Try adjusting your search or filters</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-white border-t border-gray-200 text-center text-xs text-gray-400">
                            Showing {filteredCompanies.length} companies
                        </div>
                    </div>
                </div>
            )}

            {/* Global CSS for Marquee Animation */}
            <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-marquee {
          animation: marquee linear infinite;
        }
      `}</style>
        </>
    );
};

export default WhereWeWorkSection;
