import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { PreloadLink } from "@/components/PreloadLink";
import { navDropdownPaths, preloadPaths } from "@/lib/preloadRoutes";
import { useContributionPopup } from "@/context/ContributionPopupContext";
import { Menu, X } from "lucide-react";
import nsutLogo from "@/assets/nsut-logo.svg";

interface HeaderProps {
  setHeaderHeight: (height: number) => void;
}

const Header = ({ setHeaderHeight }: HeaderProps) => {
  const openContributionPopup = useContributionPopup();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [localHeaderHeight, setLocalHeaderHeight] = useState(0);
  const headerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  // --- Hardcoded Nav Links ---
  const navLinks = {
    "Communities": [
      "Clubs",
      "Industries",
    ],
    Benefits: [
      "Career",
      "Learning",
      "Alumni Directory",
    ],
    Events: [],
    Contribute: [],
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
        id="site-header"
        ref={headerRef}
        className="w-full fixed top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm transition-all duration-300"
      >

        {/* === MAIN NAVBAR === */}
        <div className="container mx-auto px-4 md:px-8 py-3.5 flex justify-between items-center">
          {/* Logo */}
          <PreloadLink
            to="/"
            className="flex items-center gap-3 group transition-transform duration-200 hover:opacity-95"
          >
            <img
              ref={logoRef}
              src={nsutLogo}
              alt="NSUT Official Logo"
              width="50"
              height="50"
              className="h-11 md:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </PreloadLink>

          {/* Nav Links */}
          <div className="hidden md:flex items-center space-x-7 lg:space-x-9">
            {Object.entries(navLinks).map(([title, sublinks]) => (
              (title === "Giving" || title === "Events") ? (
                <PreloadLink
                  key={title}
                  to={`/${title.toLowerCase()}`}
                  className="font-medium text-[15px] lg:text-base text-gray-800 transition-colors duration-200 hover:text-nsut-maroon relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-nsut-maroon after:transition-all after:duration-300 hover:after:w-full"
                >
                  {title}
                </PreloadLink>
              ) : title === "Contribute" ? (
                <button
                  key={title}
                  type="button"
                  onClick={openContributionPopup}
                  className="font-medium text-[15px] lg:text-base text-gray-800 transition-colors duration-200 hover:text-nsut-maroon relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-nsut-maroon after:transition-all after:duration-300 hover:after:w-full"
                >
                  {title}
                </button>
              ) : (
                <div
                  key={title}
                  className="group relative"
                  onMouseEnter={() => {
                    const paths = navDropdownPaths[title];
                    if (paths) preloadPaths(paths);
                  }}
                >
                  <button className="font-medium text-[15px] lg:text-base text-gray-800 transition-colors duration-200 hover:text-nsut-maroon relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-nsut-maroon after:transition-all after:duration-300 hover:after:w-full">
                    {title}
                  </button>
                  <div className={`absolute bg-white shadow-xl rounded-xl mt-2 py-2 w-48 z-[100] border border-gray-100 opacity-0 invisible -translate-y-2 transition-all duration-200 ease-out group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 ${title === "Stories" ? "right-0" : "left-0"}`}>
                    {sublinks.map((link) => (
                      <PreloadLink
                        key={link}
                        to={`/${title
                          .toLowerCase()
                          .replace(/ & /g, "-")}/${link
                            .toLowerCase()
                            .replace(/ /g, "-")}`}
                        className="block px-4 py-2.5 text-sm text-gray-700 transition-all duration-150 hover:bg-rose-50/60 hover:text-nsut-maroon hover:pl-5"
                      >
                        {link}
                      </PreloadLink>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>

          {/* Right side CTA / Mobile Toggle */}
          <div className="flex items-center gap-3">
            <PreloadLink
              to="/login"
              className="hidden md:inline-flex items-center justify-center bg-nsut-maroon hover:bg-[#800000] text-white font-medium px-5 py-2 rounded-full text-sm shadow-sm transition-all duration-200 hover:shadow hover:scale-105 active:scale-95"
            >
              myNSUT Login
            </PreloadLink>

            {/* Mobile Menu Toggle */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                type="button"
                onClick={openContributionPopup}
                className="min-h-10 rounded-md bg-nsut-maroon px-2.5 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#6e0000] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nsut-maroon focus-visible:ring-offset-2 sm:px-3 sm:text-sm"
              >
                Contribute
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="text-gray-700 hover:text-nsut-maroon p-1.5 transition-colors"
                aria-label="Open mobile menu"
              >
                <Menu size={26} />
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
                <PreloadLink
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
                </PreloadLink>
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
                <PreloadLink
                  to="/login"
                  className="flex-1 bg-white text-nsut-maroon font-semibold py-2 px-3 rounded-lg text-sm hover:shadow-lg hover:scale-105 transition-all duration-300 text-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </PreloadLink>
                <button
                  type="button"
                  className="flex-1 bg-nsut-yellow text-nsut-maroon font-semibold py-2 px-3 rounded-lg text-sm hover:shadow-lg hover:scale-105 transition-all duration-300 text-center"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openContributionPopup();
                  }}
                >
                  Contribute
                </button>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="p-4 space-y-1">
              {Object.entries(navLinks).map(([title, sublinks]) => (
                <div key={title} className="mb-4">
                  {title === "Contribute" ? (
                    <button
                      type="button"
                      className="block w-full py-3 px-4 text-left font-serif text-base font-semibold text-nsut-maroon bg-gradient-to-r from-amber-50 to-transparent rounded-lg hover:from-amber-100 transition-all duration-200"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        openContributionPopup();
                      }}
                    >
                      {title}
                    </button>
                  ) : title === "Events" && sublinks.length === 0 ? (
                    <PreloadLink
                      to={`/${title.toLowerCase()}`}
                      className="block py-3 px-4 font-serif text-base font-semibold text-nsut-maroon bg-gradient-to-r from-amber-50 to-transparent rounded-lg hover:from-amber-100 transition-all duration-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {title}
                    </PreloadLink>
                  ) : (
                    <>
                      <h3 className="font-serif text-base font-semibold text-nsut-maroon px-4 py-2 bg-gray-50 rounded-lg mb-2">
                        {title}
                      </h3>
                      <div className="space-y-1 pl-2">
                        {sublinks.map((link) => (
                        <PreloadLink
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
                          </PreloadLink>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}

              {/* About Link */}
              <div className="pt-4 border-t border-gray-200">
                <PreloadLink
                  to="/about"
                  className="block py-3 px-4 text-gray-700 hover:bg-gradient-to-r hover:from-nsut-beige hover:to-transparent hover:text-nsut-maroon font-medium rounded-lg transition-all duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  About
                </PreloadLink>
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
