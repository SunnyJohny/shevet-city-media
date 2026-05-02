import { useEffect, useState } from "react";
import { FaBarsStaggered } from "react-icons/fa6";
import { FaXmark } from "react-icons/fa6";
import schoolLogo from "../assets/SheveCity.png";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);

  // Toggle mobile menu
  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  // Sticky navbar on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Smooth scroll to section
  const handleScrollAdjust = (e, path) => {
    e.preventDefault();

    const target = document.getElementById(path);
    if (target) {
      const offset = 100; // adjust for fixed navbar
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }

    if (isMenuOpen) setIsMenuOpen(false);
  };

  // Sheve City Media nav items (media / news focused)
  const navItems = [
    { link: "Home", path: "home" },
    { link: "News", path: "news" },
    { link: "Live", path: "live" },
    { link: "Shows", path: "shows" },
    { link: "Podcasts", path: "podcasts" },
    { link: "Editorials", path: "editorials" },
    { link: "Gallery", path: "gallery" },
    { link: "About", path: "about" },
    { link: "Contact", path: "contact" },
  ];

  return (
    <>
      <header className="fixed w-full z-50 transition-all duration-300">
        <nav
          className={`py-4 lg:px-24 px-4 transition-all duration-300 ${
            isSticky ? "bg-white shadow-lg" : "bg-white"
          }`}
        >
          <div className="flex justify-between items-center text-base relative">
            {/* Logo + Site Name */}
            <a href="/" className="flex items-center gap-3">
              <img src={schoolLogo} alt="Sheve City Media Logo" className="h-12 w-auto" />
              <div className="leading-tight">
                <h1 className="text-sm md:text-base font-bold text-gray-800 uppercase">
                  Sheve City Media
                </h1>
                <p className="text-xs text-yellow-600 italic">
                  News • Live • Storytelling
                </p>
              </div>
            </a>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <ul className="flex space-x-8 items-center">
                {navItems.map(({ link, path }) => (
                  <a
                    key={link}
                    href={`#${path}`}
                    onClick={(e) => handleScrollAdjust(e, path)}
                    className="text-sm lg:text-base uppercase text-[#181818] hover:text-blue-700 cursor-pointer font-medium transition"
                  >
                    {link}
                  </a>
                ))}
              </ul>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden gap-3">
              <button
                onClick={toggleMenu}
                className="p-2 border border-gray-400 rounded-full"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <FaXmark className="h-6 w-6 text-gray-800" />
                ) : (
                  <FaBarsStaggered className="h-6 w-6 text-gray-800" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Fullscreen Menu */}
          <div
            className={`md:hidden fixed top-0 left-0 w-full h-screen bg-slate-900 transition-transform duration-300 transform ${
              isMenuOpen ? "translate-y-0" : "-translate-y-full"
            } px-4`}
          >
            {/* Mobile Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <a href="/" className="flex items-center gap-2">
                <img src={schoolLogo} alt="Sheve City Media Logo" className="h-10 w-auto" />
                <span className="text-white text-sm font-semibold">
                  Sheve City Media
                </span>
              </a>

              <button
                onClick={toggleMenu}
                className="text-white p-2 border border-gray-500 rounded-full"
                aria-label="Close menu"
              >
                <FaXmark className="h-6 w-6" />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <ul className="flex flex-col items-center justify-center mt-12 space-y-6">
              {navItems.map(({ link, path }) => (
                <a
                  key={link}
                  href={`#${path}`}
                  onClick={(e) => handleScrollAdjust(e, path)}
                  className="text-base uppercase text-white hover:text-yellow-400 cursor-pointer font-semibold transition"
                >
                  {link}
                </a>
              ))}
            </ul>
          </div>
        </nav>
      </header>
    </>
  );
};

export default Navbar;