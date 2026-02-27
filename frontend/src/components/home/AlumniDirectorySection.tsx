import { Users, ArrowRight, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

const AlumniDirectorySection = () => {
    const stats = [
        { number: 'Thousands', label: 'Alumni Profiles' },
        { number: 'Worldwide', label: 'Presence' },
        { number: 'Global', label: 'Network' },
        { number: 'Diverse', label: 'Industries' }
    ];

    return (
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

            <div className="container mx-auto max-w-7xl px-4 relative z-10">
                <div className="flex items-center gap-4 mb-6">
                    <Users className="w-12 h-12 text-nsut-yellow" />
                    <h2 className="font-serif text-5xl md:text-6xl font-bold">
                        Alumni Directory
                    </h2>
                </div>
                <p className="text-xl md:text-2xl max-w-5xl leading-relaxed text-white/95">
                    Connect with NSUT Alumni Worldwide
                </p>
                <p className="text-lg max-w-5xl mt-4 leading-relaxed text-white/90">
                    The NSUT Alumni Directory is your gateway to connecting with fellow NSUTians across the globe. Discover alumni working at leading organizations, find mentors, explore career opportunities, and strengthen the bonds of our vibrant community.
                </p>

                {/* Stats Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20 hover:bg-white/15 transition-all duration-300">
                            <div className="text-3xl md:text-4xl font-bold text-nsut-yellow mb-1">{stat.number}</div>
                            <div className="text-sm md:text-base text-white/90">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mt-12">
                    <Link
                        to="/login"
                        className="group bg-nsut-yellow hover:bg-nsut-yellow/90 text-nsut-maroon px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
                    >
                        <Lock className="w-5 h-5" />
                        Login to Access Directory
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                        to="/signup"
                        className="group bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105"
                    >
                        Create Account
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default AlumniDirectorySection;
