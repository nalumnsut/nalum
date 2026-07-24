
import { PreloadLink } from "@/components/PreloadLink";
import { Facebook, Instagram, Youtube, Linkedin } from 'lucide-react';

const XLogo = ({ size = 20, className }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className={className}
  >
    <path d="M18.244 2H21l-6.96 7.965L22.23 22h-6.844l-5.35-6.912L3.985 22H1.227l7.448-8.527L1 2h6.97l4.892 6.32L18.244 2Zm-1.2 18h1.92L7.93 3.993H5.873L17.044 20Z" />
  </svg>
);

const Footer = () => {
  const quickNav = [
    { text: "Communities", link: "/communities/explore" }, // UPDATE THIS LINK
    { text: "Events", link: "/events/attend" }, // UPDATE THIS LINK
    { text: "Benefits", link: "/benefits/learning" }, // UPDATE THIS LINK
    { text: "Giving", link: "/giving" }, // ✓ Already configured
    { text: "Stories", link: "/stories/notable-alumni" },
  ];
  const secondaryNav = [
    { text: "myNSUT Login", link: "/login", external: false }, // ✓ Already configured
    { text: "About", link: "/about", external: false }, // ✓ Already configured
    { text: "NALUM TEAM", link: "/about#team", external: false },
    { text: "Contact", link: "/about#contact", external: false }, // ✓ Links to Get in Touch section on About page
    { text: "NSUT.edu", link: "https://www.nsut.ac.in/", external: true }, // ✓ EXAMPLE: External link
  ];

  const socialLinks = [
    { icon: Facebook, href: "https://www.facebook.com/nsutofficial/", label: "Facebook" },
    { icon: XLogo, href: "https://x.com/NSUT_OFFICIAL", label: "X" },
    { icon: Instagram, href: "https://www.instagram.com/nsut.official?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==", label: "Instagram" },
    { icon: Youtube, href: "https://youtube.com/@nsutdelhi?si=GSi2n3m78a3JvbiK", label: "YouTube" },
    { icon: Linkedin, href: "https://www.linkedin.com/company/officialnsut/", label: "LinkedIn" },
  ];

  return (
    <>
      <style>{`
        .footer-link {
          position: relative;
          display: inline-block;
          transition: color 0.3s ease;
        }
        .footer-link::after {
          content: "";
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #FFD700 0%, #C00404 100%);
          transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 1px;
        }
        .footer-link:hover {
          color: #FFD700;
        }
        .footer-link:hover::after {
          width: 100%;
        }
        
        .social-icon {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 215, 0, 0.1);
          transition: all 0.3s ease;
        }
        .social-icon:hover {
          background: #FFD700;
          transform: translateY(-4px) scale(1.1);
          box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
        }
        .social-icon svg {
          transition: all 0.3s ease;
        }
        .social-icon:hover svg {
          color: #C00404;
          transform: rotate(5deg);
        }
        
        .gift-button-footer {
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        .gift-button-footer::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(192, 4, 4, 0.2);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }
        .gift-button-footer:hover::before {
          width: 300px;
          height: 300px;
        }
        .gift-button-footer:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
        }
        
        .footer-heading {
          position: relative;
          display: inline-block;
        }
        .footer-heading::after {
          content: "";
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 40px;
          height: 2px;
          background: linear-gradient(90deg, #FFD700 0%, #C00404 100%);
          border-radius: 1px;
        }
      `}</style>
      <footer className="bg-gradient-to-b from-gray-900 to-[#1a1a1a] text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%">
            <pattern id="footer-plus" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M20 15 L20 25 M15 20 L25 20" stroke="white" strokeWidth="1.5" fill="none"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#footer-plus)"/>
          </svg>
        </div>

        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Quick Nav */}
            <div className="md:col-span-2">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                <div>
                  <h3 className="font-serif text-lg font-semibold mb-4 footer-heading">Quick Navigation</h3>
                  <ul className="space-y-3">
                    {quickNav.map(item => (
                      <li key={item.text}>
                        <PreloadLink 
                          to={item.link} 
                          className="footer-link text-gray-200"
                          onClick={() => window.scrollTo(0, 0)}
                        >
                          {item.text}
                        </PreloadLink>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold mb-4 footer-heading">More</h3>
                  <ul className="space-y-3">
                    {secondaryNav.map(item => (
                      <li key={item.text}>
                        {item.external ? (
                          <a 
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="footer-link text-gray-200"
                          >
                            {item.text}
                          </a>
                        ) : (
                          <PreloadLink 
                            to={item.link} 
                            className="footer-link text-gray-200"
                            onClick={() => {
                              // Only scroll to top if not Contact (which uses anchor link)
                              if (item.text !== "Contact") {
                                window.scrollTo(0, 0);
                              }
                            }}
                          >
                            {item.text}
                          </PreloadLink>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Call to Action & Social */}
            <div className="space-y-6">
              <PreloadLink
                to="/giving"
                className="gift-button-footer block w-full text-center bg-nsut-yellow text-nsut-maroon font-bold py-3 px-6 rounded-lg relative z-10"
              >
                Make a Gift
              </PreloadLink>
              <div>
                <h3 className="font-serif text-lg font-semibold mb-4 text-center footer-heading">Connect With Us</h3>
                <div className="flex justify-center space-x-3">
                  {socialLinks.map((social, index) => (
                    <a 
                      key={index} 
                      href={social.href} 
                      className="social-icon"
                      aria-label={social.label}
                    >
                      <social.icon size={20} className="text-gray-200" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="pt-8 border-t border-white/20">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-300">
              <p className="text-center md:text-left">
                &copy; {new Date().getFullYear()} NSUT University / Netaji Subhas University of Technology
              </p>
              
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
