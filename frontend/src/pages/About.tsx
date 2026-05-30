import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Users, Heart, Target, Award, Linkedin, Building2, GraduationCap } from 'lucide-react';
import { useLocation } from 'react-router-dom';

// ============================================
// TEAM MEMBERS CONFIGURATION
// ============================================
// Add team member photos in the public folder at these paths:
// For Faculty: /about/team/faculty/[name].jpg
// For Developers: /about/team/developers/[name].jpg
// For Operations: /about/team/operations/[name].jpg
// For 2026 Team: /about/team/2026/[name].jpg

interface TeamMember {
  name: string;
  branch: string;  // ADD BRANCH HERE (e.g., "Computer Science", "IT", "ECE")
  year: string;    // ADD YEAR HERE (e.g., "2024", "2025")
  designation?: string;  // ADD DESIGNATION HERE (optional, for faculty/core team)
  image: string;
  linkedinUrl: string;  // Add LinkedIn profile URL here
}

// FACULTY TEAM (3 members)
const facultyMembers: TeamMember[] = [
  {
    name: 'Prof. MPS Bhatia',
    branch: '',  // Leave empty for faculty
    year: '',    // Leave empty for faculty
    designation: 'Head, TnP',  // ADD DESIGNATION HERE
    image: '/about/team/faculty/mpsbhatia.webp',  // ADD IMAGE PATH HERE
    linkedinUrl: null  // ADD LINKEDIN URL HERE
  },
  {
    name: 'Prof. Ritu Sibal',
    branch: '',  // Leave empty for faculty
    year: '',    // Leave empty for faculty
    designation: 'Chairperson Alumni Student Affairs',  // ADD DESIGNATION HERE
    image: '/about/team/faculty/ritusibal.webp',  // ADD IMAGE PATH HERE
    linkedinUrl: null  // ADD LINKEDIN URL HERE
  },
  {
    name: 'Mr. Rajesh Rawat',
    branch: '',  // Leave empty for faculty
    year: '',    // Leave empty for faculty
    designation: 'Coordinator, TnP',  // ADD DESIGNATION HERE
    image: '/about/team/faculty/rajeshrawat.webp',  // ADD IMAGE PATH HERE
    linkedinUrl: null  // ADD LINKEDIN URL HERE
  }
];

// CORE TEAM (4 members)
const coreTeamMembers: TeamMember[] = [
  {
    name: 'Manik Gaur',
    branch: 'IT',  // ADD BRANCH HERE
    year: '2027',   // ADD YEAR HERE
    image: '/about/team/core/manikgaur.webp',  // ADD IMAGE PATH HERE
    linkedinUrl: 'https://www.linkedin.com/in/manik-gaur-083922285/'  // ADD LINKEDIN URL HERE
  },
  {
    name: 'Sarthak Verma',
    branch: 'IT',  // ADD BRANCH HERE
    year: '2027',   // ADD YEAR HERE
    image: '/about/team/core/sarthakverma.webp',  // ADD IMAGE PATH HERE
    linkedinUrl: 'https://linkedin.com/in/rn-vrma'  // ADD LINKEDIN URL HERE
  },
  {
    name: 'Vansh Bhardwaj',
    branch: 'ITNS',  // ADD BRANCH HERE
    year: '2027',   // ADD YEAR HERE
    image: '/about/team/core/vanshbhardwaj.webp',  // ADD IMAGE PATH HERE
    linkedinUrl: 'https://www.linkedin.com/in/vansh-bhardwaj-b9734a285/'  // ADD LINKEDIN URL HERE
  },
  {
    name: 'Shabdagya Jha',
    branch: 'ECE',  // ADD BRANCH HERE
    year: '2027',   // ADD YEAR HERE
    image: '/about/team/core/shabdagyajha.webp',  // ADD IMAGE PATH HERE
    linkedinUrl: 'https://www.linkedin.com/in/shabdagya/'  // ADD LINKEDIN URL HERE
  }
];

// DEVELOPERS TEAM (3 members)
const developerMembers: TeamMember[] = [
  {
    name: 'Anant Mathur',
    branch: 'IT',  // ADD BRANCH HERE
    year: '2028',   // ADD YEAR HERE
    image: '/about/team/developers/anantmathur.webp',  // ADD IMAGE PATH HERE
    linkedinUrl: 'https://www.linkedin.com/in/anant-mathur-035519321/'  // ADD LINKEDIN URL HERE
  },
  {
    name: 'Saumy Bhargava',
    branch: 'CSAI',  // ADD BRANCH HERE
    year: '2028',   // ADD YEAR HERE
    image: '/about/team/developers/saumybhargava.webp',  // ADD IMAGE PATH HERE
    linkedinUrl: 'https://www.linkedin.com/in/saumy-bhargava-744883321'  // ADD LINKEDIN URL HERE
  },
  {
    name: 'Nischay Bagari',
    branch: 'ITNS',  // ADD BRANCH HERE
    year: '2028',   // ADD YEAR HERE
    image: '/about/team/developers/nischaybagari.webp',  // ADD IMAGE PATH HERE
    linkedinUrl: 'https://in.linkedin.com/in/nischay-bagari-a56013324'  // ADD LINKEDIN URL HERE
  }
];

// OPERATIONS TEAM (0 members)
const operationsMembers: TeamMember[] = [];

// 2026 TEAM (4 members)
const team2026Members: TeamMember[] = [
  {
    name: 'Aditi Gupta',
    branch: 'Mech',  // ADD BRANCH HERE
    year: '2026',   // ADD YEAR HERE
    image: '/about/team/2026/aditigupta.webp',  // ADD IMAGE PATH HERE
    linkedinUrl: 'https://www.linkedin.com/mwlite/profile/me?trk=p_mwlite_profile_view-secondary_nav'  // ADD LINKEDIN URL HERE
  },
  {
    name: 'Shivam Narula',
    branch: 'Mech',  // ADD BRANCH HERE
    year: '2026',   // ADD YEAR HERE
    image: '/about/team/2026/shivamnarula.webp',  // ADD IMAGE PATH HERE
    linkedinUrl: 'https://www.linkedin.com/in/shivam-narula-b37b5b256?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app'  // ADD LINKEDIN URL HERE
  },
  {
    name: 'Vatsal Maskara',
    branch: 'Mech',  // ADD BRANCH HERE
    year: '2026',   // ADD YEAR HERE
    image: '/about/team/2026/vatsalmaskara.webp',  // ADD IMAGE PATH HERE
    linkedinUrl: 'https://www.linkedin.com/in/vatsal-maskara?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app'  // ADD LINKEDIN URL HERE
  },
  {
    name: 'Ahaan Singh',
    branch: 'Mech',  // ADD BRANCH HERE
    year: '2026',   // ADD YEAR HERE
    image: '/about/team/2026/ahaansingh.webp',  // ADD IMAGE PATH HERE
    linkedinUrl: 'https://www.linkedin.com/in/ahaan-singh-07b7a9255'  // ADD LINKEDIN URL HERE
  }
];
// ============================================

const AboutPage = () => {
  const [activeTab, setActiveTab] = useState<'about' | 'team'>('about');
  const [show2026Team, setShow2026Team] = useState(false);
  const location = useLocation();

  // Scroll to hash anchor when component mounts or hash changes
  useEffect(() => {
    if (location.hash) {
      const element = document.querySelector(location.hash);
      if (element) {
        const yOffset = -100; // Offset for fixed header
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  }, [location]);

  const values = [
    {
      icon: Heart,
      title: 'Community Building',
      description: 'Fostering lifelong connections among NSUT alumni across generations and geographies.'
    },
    {
      icon: Target,
      title: 'Professional Growth',
      description: 'Supporting career development through mentorship, networking, and industry collaboration.'
    },
    {
      icon: Award,
      title: 'Excellence',
      description: 'Maintaining the highest standards in alumni engagement and institutional support.'
    },
    {
      icon: Users,
      title: 'Inclusivity',
      description: 'Creating an inclusive environment that welcomes all alumni regardless of batch or background.'
    }
  ];

  const initiatives = [
    'Alumni networking events and reunions',
    'Mentorship programs connecting students with alumni',
    'Career guidance and placement support',
    'Industry-academia collaboration initiatives',
    'Alumni database and directory management',
    'Regular newsletters and communication',
    'Support for entrepreneurship and startups',
    'Recognition of notable alumni achievements'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-nsut-beige/30">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-nsut-maroon to-[#800000] text-white py-20 px-4 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-nsut-yellow/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-nsut-yellow/10 rounded-full blur-3xl"></div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="flex items-center gap-4 mb-6 animate-fade-in">
            <Building2 className="w-12 h-12 text-nsut-yellow" />
            <h1 className="font-serif text-5xl md:text-6xl font-bold">
              About NALUM
            </h1>
          </div>
          <p className="text-xl md:text-2xl max-w-5xl leading-relaxed opacity-95 animation-delay-300 animate-fade-in">
            NSUT Alumni Affairs Team
          </p>
          <p className="text-lg max-w-5xl mt-4 leading-relaxed opacity-90 animation-delay-500 animate-fade-in">
            Connecting generations, fostering excellence, and building a vibrant global community of NSUT alumni
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-16">
        {/* Tabs */}
        <div className="mb-12">
          <div className="flex justify-center gap-4 border-b-2 border-gray-200">
            <button
              onClick={() => setActiveTab('about')}
              className={`px-8 py-4 font-serif text-xl font-bold transition-all duration-300 relative ${activeTab === 'about'
                  ? 'text-nsut-maroon'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              About Us
              {activeTab === 'about' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-nsut-maroon to-nsut-yellow"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`px-8 py-4 font-serif text-xl font-bold transition-all duration-300 relative ${activeTab === 'team'
                  ? 'text-nsut-maroon'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Our Team
              {activeTab === 'team' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-nsut-maroon to-nsut-yellow"></div>
              )}
            </button>
          </div>
        </div>

        {/* About Us Tab */}
        {activeTab === 'about' && (
          <div className="animate-fade-in">
            {/* Mission Statement */}
            <div className="mb-16">
              <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100">
                <h2 className="font-serif text-4xl font-bold text-nsut-maroon mb-6 text-center">
                  Who We Are
                </h2>
                <div className="max-w-4xl mx-auto space-y-6 text-gray-700 leading-relaxed text-lg">
                  <p>
                    The NSUT Alumni Affairs Team (NALUM) serves as the official bridge connecting past, present, and future generations of Netaji Subhas University of Technology. We are dedicated to fostering a vibrant, engaged, and supportive community of alumni who continue to contribute to the university's legacy and each other's success.
                  </p>
                  <p>
                    Established to strengthen the bond between the university and its graduates, NALUM works tirelessly to create opportunities for networking, mentorship, professional development, and lifelong learning. We believe that the relationship between NSUT and its alumni extends far beyond graduation—it's a lifelong partnership built on shared values, memories, and aspirations.
                  </p>
                  <p className="font-semibold text-nsut-maroon">
                    Our mission is to cultivate meaningful connections, facilitate professional growth, and celebrate the achievements of NSUT alumni while supporting current students in their academic and career journeys.
                  </p>
                </div>
              </div>
            </div>

            {/* Core Values */}
            <div className="mb-16">
              <h2 className="font-serif text-4xl font-bold text-nsut-maroon mb-12 text-center">
                Our Core Values
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {values.map((value, index) => (
                  <div
                    key={index}
                    className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-500 p-6 border border-gray-100 hover:border-nsut-yellow/50 animate-fade-in hover:-translate-y-2"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-nsut-maroon to-nsut-yellow rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <value.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-serif text-xl font-bold text-nsut-maroon mb-3 group-hover:text-[#800000] transition-colors">
                      {value.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed text-sm">
                      {value.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* What We Do */}
            <div className="mb-16">
              <div className="bg-gradient-to-br from-nsut-maroon to-[#800000] rounded-2xl p-8 md:p-12 text-white shadow-xl">
                <h2 className="font-serif text-4xl font-bold mb-6 flex items-center gap-3">
                  <Target className="w-10 h-10 text-nsut-yellow" />
                  What We Do
                </h2>
                <p className="text-lg mb-8 opacity-95 leading-relaxed">
                  NALUM coordinates a wide range of initiatives designed to keep alumni connected, engaged, and supported throughout their professional journeys.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {initiatives.map((initiative, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-5 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-all duration-300 animate-fade-in border border-white/10"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="w-2 h-2 bg-nsut-yellow rounded-full mt-2 flex-shrink-0"></div>
                      <span className="leading-relaxed">{initiative}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="mb-8" id="contact">
              <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100">
                <h2 className="font-serif text-4xl font-bold text-nsut-maroon mb-8 text-center">
                  Get in Touch
                </h2>
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Email */}
                  <div className="group flex items-start gap-4 p-6 rounded-xl bg-gradient-to-r from-nsut-beige/30 to-white hover:from-nsut-beige/50 hover:to-white transition-all duration-300 border border-gray-100 hover:border-nsut-yellow/50 hover:-translate-y-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-nsut-maroon to-nsut-yellow rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-bold text-nsut-maroon mb-2">Email Us</h3>
                      <a href="mailto:alumni@nsut.ac.in" className="text-gray-700 hover:text-nsut-maroon transition-colors">
                        alumni@nsut.ac.in
                      </a>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="group flex items-start gap-4 p-6 rounded-xl bg-gradient-to-r from-nsut-beige/30 to-white hover:from-nsut-beige/50 hover:to-white transition-all duration-300 border border-gray-100 hover:border-nsut-yellow/50 hover:-translate-y-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-nsut-maroon to-nsut-yellow rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-bold text-nsut-maroon mb-2">Call Us</h3>
                      <a href="tel:+919034064575" className="text-gray-700 hover:text-nsut-maroon transition-colors">
                        +91 90340 64575
                      </a>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="group flex items-start gap-4 p-6 rounded-xl bg-gradient-to-r from-nsut-beige/30 to-white hover:from-nsut-beige/50 hover:to-white transition-all duration-300 border border-gray-100 hover:border-nsut-yellow/50 hover:-translate-y-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-nsut-maroon to-nsut-yellow rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-bold text-nsut-maroon mb-2">Visit Us</h3>
                      <p className="text-gray-700">
                        Netaji Subhas University of Technology<br />
                        Azad Hind Fauj Marg, Sector 3<br />
                        Dwarka, New Delhi - 110078
                      </p>
                    </div>
                  </div>

                  {/* Social Media */}
                  <div className="group flex items-start gap-4 p-6 rounded-xl bg-gradient-to-r from-nsut-beige/30 to-white hover:from-nsut-beige/50 hover:to-white transition-all duration-300 border border-gray-100 hover:border-nsut-yellow/50 hover:-translate-y-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-nsut-maroon to-nsut-yellow rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Linkedin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-bold text-nsut-maroon mb-2">Connect on LinkedIn</h3>
                      <a
                        href="https://www.linkedin.com/school/nsut-delhi"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-700 hover:text-nsut-maroon transition-colors"
                      >
                        NSUT Alumni Network
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Our Team Tab */}
        {activeTab === 'team' && (
          <div className="animate-fade-in">
            <h2 className="font-serif text-4xl font-bold text-nsut-maroon mb-12 text-center">
              Meet Our Team
            </h2>

            {/* Faculty Section */}
            <div className="mb-16">
              <div className="mb-8 text-center">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-nsut-maroon to-[#800000] text-white rounded-full shadow-lg">
                  <GraduationCap className="w-6 h-6" />
                  <h3 className="font-serif text-2xl font-bold">Faculty</h3>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-8 max-w-6xl mx-auto">
                {facultyMembers.map((member, index) => (
                  <div
                    key={index}
                    className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-500 p-6 border border-gray-100 hover:border-nsut-yellow/50 animate-fade-in hover:-translate-y-2 flex flex-col items-center w-44"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Profile Picture */}
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-nsut-maroon to-nsut-yellow flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300 border-4 border-white mb-4">
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white text-2xl font-bold bg-gradient-to-br from-nsut-maroon to-nsut-yellow">${member.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</div>`;
                        }}
                      />
                    </div>

                    {/* Member Name */}
                    <h4 className="font-serif text-lg font-bold text-nsut-maroon mb-1 text-center group-hover:text-[#800000] transition-colors">
                      {member.name}
                    </h4>

                    {/* Designation */}
                    {member.designation && (
                      <p className="text-gray-600 text-sm text-center">
                        {member.designation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Core Team Section */}
            <div className="mb-16">
              <div className="mb-8 text-center">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-full shadow-lg">
                  <Users className="w-6 h-6" />
                  <h3 className="font-serif text-2xl font-bold">Core Team</h3>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-8 max-w-6xl mx-auto">
                {coreTeamMembers.map((member, index) => (
                  <div
                    key={index}
                    className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-500 p-6 border border-gray-100 hover:border-emerald-300 animate-fade-in hover:-translate-y-2 flex flex-col items-center w-44"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Profile Picture */}
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-700 flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300 border-4 border-white mb-4">
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white text-2xl font-bold bg-gradient-to-br from-emerald-500 to-emerald-700">${member.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</div>`;
                        }}
                      />
                    </div>

                    {/* Member Name */}
                    <h4 className="font-serif text-lg font-bold text-nsut-maroon mb-1 text-center group-hover:text-emerald-700 transition-colors">
                      {member.name}
                    </h4>

                    {/* Designation */}
                    {member.designation && (
                      <p className="text-emerald-700 text-xs font-semibold mb-1 text-center">
                        {member.designation}
                      </p>
                    )}

                    {/* Branch - Year */}
                    <p className="text-gray-600 text-sm mb-3 text-center">
                      {member.branch} - {member.year}
                    </p>

                    {/* LinkedIn Icon */}
                    <a
                      href={member.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto w-10 h-10 rounded-full bg-[#0077B5] hover:bg-[#005582] flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-md"
                      aria-label={`LinkedIn profile of ${member.name}`}
                    >
                      <Linkedin className="w-5 h-5 text-white" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Developers Section */}
            <div className="mb-16">
              <div className="mb-8 text-center">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-lg">
                  <Users className="w-6 h-6" />
                  <h3 className="font-serif text-2xl font-bold">Developers Team</h3>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-8 max-w-6xl mx-auto">
                {developerMembers.map((member, index) => (
                  <div
                    key={index}
                    className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-500 p-6 border border-gray-100 hover:border-blue-300 animate-fade-in hover:-translate-y-2 flex flex-col items-center w-44"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Profile Picture */}
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700 flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300 border-4 border-white mb-4">
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white text-2xl font-bold bg-gradient-to-br from-blue-500 to-blue-700">${member.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</div>`;
                        }}
                      />
                    </div>

                    {/* Member Name */}
                    <h4 className="font-serif text-lg font-bold text-nsut-maroon mb-1 text-center group-hover:text-blue-700 transition-colors">
                      {member.name}
                    </h4>

                    {/* Branch - Year */}
                    <p className="text-gray-600 text-sm mb-3 text-center">
                      {member.branch} - {member.year}
                    </p>

                    {/* LinkedIn Icon */}
                    <a
                      href={member.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto w-10 h-10 rounded-full bg-[#0077B5] hover:bg-[#005582] flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-md"
                      aria-label={`LinkedIn profile of ${member.name}`}
                    >
                      <Linkedin className="w-5 h-5 text-white" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Operations Section (disabled for now) */}
            {false && (
            <div className="mb-16">
              <div className="mb-8 text-center">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-full shadow-lg">
                  <Users className="w-6 h-6" />
                  <h3 className="font-serif text-2xl font-bold">Operations Team</h3>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-8 max-w-6xl mx-auto">
                {operationsMembers.map((member, index) => (
                  <div
                    key={index}
                    className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-500 p-6 border border-gray-100 hover:border-purple-300 animate-fade-in hover:-translate-y-2 flex flex-col items-center w-44"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Profile Picture */}
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-purple-700 flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300 border-4 border-white mb-4">
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white text-2xl font-bold bg-gradient-to-br from-purple-500 to-purple-700">${member.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</div>`;
                        }}
                      />
                    </div>

                    {/* Member Name */}
                    <h4 className="font-serif text-lg font-bold text-nsut-maroon mb-1 text-center group-hover:text-purple-700 transition-colors">
                      {member.name}
                    </h4>

                    {/* Branch - Year */}
                    <p className="text-gray-600 text-sm mb-3 text-center">
                      {member.branch} - {member.year}
                    </p>

                    {/* LinkedIn Icon */}
                    <a
                      href={member.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto w-10 h-10 rounded-full bg-[#0077B5] hover:bg-[#005582] flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-md"
                      aria-label={`LinkedIn profile of ${member.name}`}
                    >
                      <Linkedin className="w-5 h-5 text-white" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
            )}

            {/* 2026 Team Section */}
            <div className="mb-16">
              <div className="mb-8 text-center">
                <button
                  type="button"
                  onClick={() => setShow2026Team((prev) => !prev)}
                  className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-full shadow-lg"
                  aria-expanded={show2026Team}
                >
                  <Users className="w-6 h-6" />
                  <h3 className="font-serif text-2xl font-bold">2026 Team</h3>
                </button>
              </div>

              {show2026Team && (
                <div className="flex flex-wrap justify-center gap-8 max-w-6xl mx-auto">
                  {team2026Members.map((member, index) => (
                    <div
                      key={index}
                      className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-500 p-6 border border-gray-100 hover:border-amber-300 animate-fade-in hover:-translate-y-2 flex flex-col items-center w-44"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {/* Profile Picture */}
                      <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-amber-500 to-amber-700 flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300 border-4 border-white mb-4">
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white text-2xl font-bold bg-gradient-to-br from-amber-500 to-amber-700">${member.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</div>`;
                          }}
                        />
                      </div>

                      {/* Member Name */}
                      <h4 className="font-serif text-lg font-bold text-nsut-maroon mb-1 text-center group-hover:text-amber-700 transition-colors">
                        {member.name}
                      </h4>

                      {/* Branch - Year */}
                      <p className="text-gray-600 text-sm mb-3 text-center">
                        {member.branch} - {member.year}
                      </p>

                      {/* LinkedIn Icon */}
                      <a
                        href={member.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-auto w-10 h-10 rounded-full bg-[#0077B5] hover:bg-[#005582] flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-md"
                        aria-label={`LinkedIn profile of ${member.name}`}
                      >
                        <Linkedin className="w-5 h-5 text-white" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }

        .animation-delay-300 {
          animation-delay: 300ms;
        }

        .animation-delay-500 {
          animation-delay: 500ms;
        }
      `}</style>
    </div>
  );
};

export default AboutPage;
