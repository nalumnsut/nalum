import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import nsutLogo from "@/assets/nsut-logo.svg";

const Header = ({ setHeaderHeight }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [localHeaderHeight, setLocalHeaderHeight] = useState(0);
  const headerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  // --- Hardcoded Nav Links ---
  const navLinks = {
    "Communities": [
      "Clubs",
      "Recent Grads",
      "Industries",
    ],
    Benefits: [
      "Career",
      "Learning",
      "Alumni Directory",
    ],
    Giving: [],
    Stories: ["Notable Alumni", "Alumni Stories", "Giving Stories", "Campus News"],
  };

  // --- Handle scroll effects and dynamic height ---
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 200); // Increased scroll threshold
    };

    const updateHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        setHeaderHeight(height);
        setLocalHeaderHeight(height);
      }
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", updateHeight);

    // Update height initially and after transitions
    updateHeight();
    const timer = setTimeout(updateHeight, 300); // Allow transition to finish

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateHeight);
      clearTimeout(timer);
    };
  }, [scrolled, setHeaderHeight]);

  return (
    <>
      <header
        ref={headerRef}
        className="w-full fixed top-0 z-50"
        style={{ minHeight: scrolled ? '80px' : '120px' }}
      >
        {/* === TOP BAR === */}
        <div
          className={`hidden md:block bg-nsut-maroon text-white transition-all duration-300 ${scrolled ? "opacity-0 h-0 overflow-hidden" : "opacity-100 py-1"
            }`}
          style={{ willChange: scrolled ? 'auto' : 'height, opacity' }}
        >
          <div className="container mx-auto px-4 flex justify-between items-center border-b border-nsut-yellow/30">
            <a
              href="https://www.nsut.ac.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2"
            >
              <span className="font-serif text-md">
                Netaji Subhas University of Technology
              </span>
            </a>
            <div className="hidden md:flex items-center space-x-4 text-xs">
              <Link to="/about" className="relative transition-colors duration-200 hover:text-nsut-yellow after:content-[''] after:absolute after:-bottom-0.5 after:left-0 after:w-0 after:h-px after:bg-nsut-yellow after:transition-all after:duration-300 hover:after:w-full">
                About
              </Link>
              <Link to="/login" className="relative transition-colors duration-200 hover:text-nsut-yellow after:content-[''] after:absolute after:-bottom-0.5 after:left-0 after:w-0 after:h-px after:bg-nsut-yellow after:transition-all after:duration-300 hover:after:w-full">
                myNSUT Login
              </Link>
              <a
                href="/giving"
                className="bg-nsut-yellow text-nsut-maroon font-bold py-1 px-3 rounded text-xs relative z-10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-nsut-yellow/40"
              >
                Make a Gift
              </a>
            </div>
          </div>
        </div>

        {/* === MAIN NAVBAR === */}
        <div
          className={`bg-white shadow-md transition-all duration-300 overflow-visible ${scrolled ? "py-4" : "py-10"
            }`}
        >
          <div className="container mx-auto px-4 flex justify-between items-center overflow-visible">
            <Link
              to="/"
              className="flex items-center gap-3"
            >
              <img
                ref={logoRef}
                src={nsutLogo}
                alt="Logo"
                width="80"
                height="80"
                className="relative z-20 h-16 md:h-20 w-auto object-contain "
              />
              <div className="flex flex-col items-start">
                <h1 className="text-xl md:text-2xl font-bold leading-none tracking-wide text-gray-800 whitespace-nowrap">
                  <span className="text-red-600">N</span>SUT
                  <span className="text-red-600"> ALUM</span>NI
                </h1>
                <span className="block text-[8px] md:text-xs text-gray-700 font-bold tracking-widest">
                  ASSOCIATION
                </span>
              </div>
            </Link>

            {/* Nav Links */}
            <div className="hidden md:flex items-center space-x-8">
              {Object.entries(navLinks).map(([title, sublinks], index) => (
                title === "Giving" ? (
                  <Link
                    key={title}
                    to="/giving"
                    className="font-serif relative text-gray-800 transition-colors duration-300 hover:text-nsut-maroon after:content-[''] after:absolute after:-bottom-2 after:left-0 after:w-0 after:h-0.5 after:bg-gradient-to-r after:from-nsut-maroon after:to-nsut-yellow after:transition-all after:duration-400 after:ease-out after:rounded-sm hover:after:w-full"
                  >
                    <span className="relative">{title}</span>
                  </Link>
                ) : (
                  <div key={title} className="group relative">
                    <button className="font-serif relative text-gray-800 transition-colors duration-300 hover:text-nsut-maroon after:content-[''] after:absolute after:-bottom-2 after:left-0 after:w-0 after:h-0.5 after:bg-gradient-to-r after:from-nsut-maroon after:to-nsut-yellow after:transition-all after:duration-400 after:ease-out after:rounded-sm hover:after:w-full">
                      <span className="relative">{title}</span>
                    </button>
                    <div className={`absolute bg-white shadow-xl rounded-lg mt-2 py-2 w-48 z-[100] border border-gray-100 opacity-0 invisible -translate-y-2.5 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 ${title === "Stories" ? "right-0 xl:left-0 xl:right-auto" : "left-0"}`}>
                      {sublinks.map((link) => (
                        <Link
                          key={link}
                          to={`/${title
                            .toLowerCase()
                            .replace(/ & /g, "-")}/${link
                              .toLowerCase()
                              .replace(/ /g, "-")}`}
                          className="block px-4 py-2 text-sm text-gray-700 relative overflow-hidden transition-all duration-200 before:content-[''] before:absolute before:left-0 before:top-0 before:h-full before:w-0.5 before:bg-nsut-maroon before:-translate-x-full before:transition-transform before:duration-300 hover:before:translate-x-0 hover:pl-5 hover:bg-gradient-to-r hover:from-amber-50 hover:to-transparent"
                        >
                          {link}
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="text-gray-600 hover:text-nsut-maroon transition-all duration-300 hover:scale-110"
                aria-label="Open mobile menu"
              >
                <Menu />
              </button>
            </div>
          </div>
        </div>

      </header>

      {/* === MOBILE MENU (Portal) === */}
      {isMobileMenuOpen && createPortal(
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-[70] transform transition-transform duration-300 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Logo */}
            <div className="sticky top-0 bg-white border-b-2 border-nsut-maroon p-4 shadow-lg z-10">
              <div className="flex items-center justify-between mb-3">
                <Link
                  to="/"
                  className="flex items-center gap-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <img
                    src={nsutLogo}
                    alt="NSUT Logo"
                    className="h-12 w-12 object-contain"
                  />
                  <div className="flex flex-col items-start">
                    <h1 className="text-base font-bold leading-none tracking-wide whitespace-nowrap">
                      <span className="text-red-600">N</span>SUT
                      <span className="text-red-600"> ALUM</span>NI
                    </h1>
                    <span className="block text-[8px] font-bold tracking-widest text-gray-700">
                      ASSOCIATION
                    </span>
                  </div>
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-gray-600 hover:text-nsut-maroon transition-colors duration-200 p-2 hover:bg-gray-100 rounded-full"
                  aria-label="Close mobile menu"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex gap-2">
                <Link
                  to="/login"
                  className="flex-1 bg-white text-nsut-maroon font-semibold py-2 px-3 rounded-lg text-sm hover:shadow-lg hover:scale-105 transition-all duration-300 text-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/giving"
                  className="flex-1 bg-nsut-yellow text-nsut-maroon font-semibold py-2 px-3 rounded-lg text-sm hover:shadow-lg hover:scale-105 transition-all duration-300 text-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Give
                </Link>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="p-4 space-y-1">
              {Object.entries(navLinks).map(([title, sublinks]) => (
                <div key={title} className="mb-4">
                  {title === "Giving" && sublinks.length === 0 ? (
                    <Link
                      to="/giving"
                      className="block py-3 px-4 font-serif text-base font-semibold text-nsut-maroon bg-gradient-to-r from-amber-50 to-transparent rounded-lg hover:from-amber-100 transition-all duration-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {title}
                    </Link>
                  ) : (
                    <>
                      <h3 className="font-serif text-base font-semibold text-nsut-maroon px-4 py-2 bg-gray-50 rounded-lg mb-2">
                        {title}
                      </h3>
                      <div className="space-y-1 pl-2">
                        {sublinks.map((link) => (
                          <Link
                            key={link}
                            to={`/${title
                              .toLowerCase()
                              .replace(/ & /g, "-")}/${link
                                .toLowerCase()
                                .replace(/ /g, "-")}`}
                            className="block py-2 px-4 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-nsut-beige hover:to-transparent hover:text-nsut-maroon hover:translate-x-1 transition-all duration-200 rounded-lg border-l-2 border-transparent hover:border-nsut-maroon"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            {link}
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}

              {/* About Link */}
              <div className="pt-4 border-t border-gray-200">
                <Link
                  to="/about"
                  className="block py-3 px-4 text-gray-700 hover:bg-gradient-to-r hover:from-nsut-beige hover:to-transparent hover:text-nsut-maroon font-medium rounded-lg transition-all duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  About
                </Link>
              </div>
            </nav>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 p-4 border-t border-gray-200">
              <a
                href="https://www.nsut.ac.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-gray-600 hover:text-nsut-maroon transition-colors text-center"
              >
                Netaji Subhas University of Technology
              </a>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default Header;
