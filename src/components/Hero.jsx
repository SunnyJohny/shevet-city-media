import React, { useEffect, useMemo, useState, useRef } from "react";
import { BsList, BsX } from "react-icons/bs";
import { Link as ScrollLink } from "react-scroll";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { getAuth, signOut } from "firebase/auth";
import "swiper/css";
import "swiper/css/autoplay";

import AuthModal from "./AuthModal";
import { useMyContext } from "../Context/MyContext";
// Import the hardcoded gallery from your project data file
import HardcodedGallery from "../data/HardcodedGallery";

// Logo file in public/images
const LOGO_SRC = "/images/SheveCity.png";

// Use SHEVET-CITY brand in WhatsApp message
const WHATSAPP_NUMBER = "2348033353059";
const WHATSAPP_MESSAGE =
  "Hello SHEVET-CITY, I would like to make an enquiry about your services.";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  WHATSAPP_MESSAGE
)}`;

// Default fallback slide (only used if HardcodedGallery missing/empty)
const DEFAULT_FALLBACK = [
  { image: "/images/SheveCity.png", title: "SHEVET-CITY", subtitle: "Storytelling that moves people" },
];

// Hardcoded news for the hero ticker (SHEVET-CITY Media)
const HARDCODED_NEWS = [
  {
    id: "hc-1",
    title: "SHEVET-CITY Launches New Podcast Series",
    highlight: "Weekly conversations with local creators — new episodes every Monday.",
  },
  {
    id: "hc-2",
    title: "Community Arts Day: Photo Roundup",
    highlight: "Murals, live performances and collaborative installations — see highlights in Gallery.",
  },
  {
    id: "hc-3",
    title: "Call for Editorials",
    highlight: "Submit opinion and features to editorial@shevecitymedia.com — share your voice.",
  },
  {
    id: "hc-4",
    title: "New Residency: Media × Tech",
    highlight: "Residency pairing media makers with technologists to explore interactive storytelling.",
  },
];

// Navigation with dropdown children according to your specification
const NAV_DATA = [
  { label: "Home", to: "home" },

  {
    label: "Culture & Entertainment",
    to: "culture",
    children: [
      { label: "Sports", to: "culture-sports" },
      { label: "Movies", to: "culture-movies" },
      { label: "Documentaries", to: "culture-documentaries" },
      { label: "Music", to: "culture-music" },
      { label: "Shows & podcasts", to: "culture-shows-podcasts" },
      { label: "Arts & crafts", to: "culture-arts-crafts" },
      { label: "Festivals", to: "culture-festivals" },
    ],
  },

  {
    label: "Lifestyle",
    to: "lifestyle",
    children: [
      { label: "Travels", to: "lifestyle-travels" },
      { label: "Food & hospitality", to: "lifestyle-food" },
      { label: "Fashion", to: "lifestyle-fashion" },
      { label: "Homes and gardens", to: "lifestyle-homes" },
    ],
  },

  {
    label: "Magazine",
    to: "magazine",
    children: [
      { label: "The Legend", to: "magazine-legend" },
      { label: "The Mentor", to: "magazine-mentor" },
      { label: "The Market Place", to: "magazine-marketplace" },
    ],
  },

  {
    label: "News",
    to: "news",
    children: [
      { label: "Headlines", to: "news-headlines" },
      { label: "Archives", to: "news-archives" },
      { label: "Inspiration", to: "news-inspiration" },
    ],
  },

  { label: "Shop", to: "shop", children: [{ label: "Goods", to: "shop-goods" }] },

  { label: "Gallery", to: "gallery" },
  { label: "About", to: "about" },
  { label: "Contact", to: "contact" },
];

const Hero = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [mode, setMode] = useState("signin");
  const [loggingOut, setLoggingOut] = useState(false);

  // track which desktop dropdown is open (by label) for keyboard/ARIA support
  const [openDropdown, setOpenDropdown] = useState(null);
  // track expanded parents in mobile menu
  const [mobileExpanded, setMobileExpanded] = useState({});
  const desktopNavRef = useRef(null);

  const closeMobile = () => setMobileOpen(false);

  const openAuth = (which = "signin") => {
    setMode(which);
    setAuthOpen(true);
  };

  const closeAuth = () => setAuthOpen(false);

  // Still use context for user/auth info, but use hardcoded news for now
  const { currentUser } = useMyContext();

  // overriding news with HARDCODED_NEWS for hero ticker
  const news = HARDCODED_NEWS;
  const newsLoading = false;
  const newsError = null;

  useEffect(() => {
    const onScroll = () => setIsSticky(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // close open dropdowns on esc / outside click
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setOpenDropdown(null);
    };
    const onClick = (e) => {
      if (!desktopNavRef.current) return;
      if (!desktopNavRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClick);
    };
  }, []);

  const swiperPointerEvents = authOpen ? "none" : "auto";

  // Use HardcodedGallery (from src/data/HardcodedGallery.jsx) as the hero slides source.
  // The file should export the array as default. We filter entries that have an image and map to the slide shape.
  const heroSlides = useMemo(() => {
    if (Array.isArray(HardcodedGallery) && HardcodedGallery.length > 0) {
      // normalize images to leading slash if necessary
      const normalize = (raw) => {
        if (!raw) return "/images/SheveCity.png";
        if (/^https?:\/\//i.test(raw)) return raw;
        return raw.startsWith("/") ? raw : `/${raw}`;
      };

      return HardcodedGallery
        .filter((it) => !!it?.image)
        .slice(0, 24) // limit to first 24 if you have more
        .map((it) => ({
          image: normalize(it.image),
          title: it.name || "SHEVET-CITY",
          subtitle: it.category || "Storytelling that moves people",
        }));
    }
    return DEFAULT_FALLBACK;
  }, []);

  const newsPairs = useMemo(() => {
    const items = Array.isArray(news) ? news : [];
    return items
      .map((n) => {
        const t = (n?.title || "").trim();
        const h = (n?.highlight || "").trim();
        if (!t && !h) return null;
        return { title: t, highlight: h };
      })
      .filter(Boolean)
      .slice(0, 10);
  }, [news]);

  const tickerText = useMemo(() => {
    if (newsPairs.length === 0) return "";
    const singleRun = newsPairs
      .map((x) => {
        if (x.title && x.highlight) return `${x.title} — ${x.highlight}`;
        if (x.title) return x.title;
        return x.highlight;
      })
      .join("   •   ");

    return `${singleRun}   •   ${singleRun}`;
  }, [newsPairs]);

  const autoplayConfig = authOpen
    ? false
    : {
        delay: 4500,
        disableOnInteraction: false,
      };

  const loggedInName = useMemo(() => {
    if (!currentUser) return "";
    return (
      currentUser.displayName ||
      currentUser.email ||
      currentUser.phoneNumber ||
      "User"
    );
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      closeMobile();
      closeAuth();
      const auth = getAuth();
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Logout failed. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  const toggleMobileParent = (label) =>
    setMobileExpanded((p) => ({ ...p, [label]: !p[label] }));

  return (
    <header id="home" className="relative">
      <style>{`
        @keyframes heroMarquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      <div className={isSticky ? "h-[118px] md:h-[110px]" : "h-0"} />

      <div
        className={[
          "w-full z-50",
          isSticky ? "fixed top-0 left-0 right-0" : "relative",
        ].join(" ")}
      >
        <div className="w-full bg-[#5A005A] text-white text-xs md:text-sm shadow-sm">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-2 py-2 px-4">
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <span className="font-semibold tracking-wide uppercase">
                Questions?
              </span>
             <span>(+234) 906 906 0610</span>
              <span>www.shevecitymedia.com</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {currentUser ? (
                <>
                  <span className="inline-flex items-center gap-2 bg-white/15 border border-white/20 text-white px-3 py-1 rounded-full text-[11px] md:text-xs font-semibold">
                    <span className="h-2 w-2 rounded-full bg-green-400 inline-block" />
                    Logged in
                  </span>

                  <span className="bg-white/10 px-3 py-1 rounded-full text-[11px] md:text-xs font-medium max-w-[220px] truncate">
                    {loggedInName}
                  </span>

                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="bg-red-500 text-white text-xs font-semibold tracking-wide px-4 py-1 rounded-sm uppercase hover:bg-red-600 transition disabled:opacity-70"
                    type="button"
                  >
                    {loggingOut ? "Logging out..." : "Logout"}
                  </button>
                </>
              ) : (
                <>

                  <span className="bg-white/10 px-3 py-1 rounded-full text-[11px] md:text-xs font-medium">
                    Not logged in
                  </span>

                  <button
                    onClick={() => openAuth("signin")}
                    className="bg-[#F29A00] text-[#5A005A] text-xs font-semibold tracking-wide px-4 py-1 rounded-sm uppercase hover:bg-[#FFA500] transition"
                    type="button"
                  >
                    Get Started / Login
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="w-full bg-white shadow-sm">
          <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={LOGO_SRC}
                alt="SHEVET-CITY Logo"
                className="h-14 w-14 md:h-16 md:w-16 object-contain rounded-full shadow-lg border-2 border-white"
              />
              {/* Keep accessible site name for screen readers only */}
              <span className="sr-only">SHEVET-CITY</span>
            </div>

            {/* Desktop nav with dropdowns */}
            <nav
              ref={desktopNavRef}
              className="hidden md:flex items-center gap-6 text-sm font-semibold text-[#5A005A] relative"
              aria-label="Primary"
            >
              {NAV_DATA.map((item) => {
                const hasChildren = Array.isArray(item.children) && item.children.length > 0;
                if (!hasChildren) {
                  return (
                    <ScrollLink
                      key={item.label}
                      to={item.to}
                      spy={true}
                      smooth={true}
                      offset={-120}
                      duration={500}
                      className="cursor-pointer hover:text-[#F29A00]"
                    >
                      {item.label}
                    </ScrollLink>
                  );
                }

                // Dropdown item
                return (
                  <div
                    key={item.label}
                    className="relative group"
                    onMouseEnter={() => setOpenDropdown(item.label)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <button
                      type="button"
                      aria-haspopup="true"
                      aria-expanded={openDropdown === item.label}
                      onClick={() =>
                        setOpenDropdown((p) => (p === item.label ? null : item.label))
                      }
                      className="flex items-center gap-2 cursor-pointer hover:text-[#F29A00]"
                    >
                      <span>{item.label}</span>
                      <svg
                        className="w-3 h-3 text-current"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.25 8.27a.75.75 0 01-.02-1.06z" clipRule="evenodd" />
                      </svg>
                    </button>

                    <div
                      role="menu"
                      aria-label={`${item.label} submenu`}
                      className={[
                        "absolute left-0 mt-2 w-56 bg-white border border-[#f1e0f1] shadow-lg rounded-md overflow-hidden z-50",
                        openDropdown === item.label ? "block" : "hidden",
                      ].join(" ")}
                    >
                      <ul className="flex flex-col">
                        {item.children.map((c) => (
                          <li key={c.label}>
                            <ScrollLink
                              to={c.to}
                              spy={true}
                              smooth={true}
                              offset={-120}
                              duration={500}
                              className="block px-4 py-2 text-sm text-slate-700 hover:bg-[#F3E6F3] hover:text-[#5A005A] cursor-pointer"
                              onClick={() => setOpenDropdown(null)}
                            >
                              {c.label}
                            </ScrollLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              {currentUser ? (
                <>
                  <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-3 py-2 rounded-full">
                    Signed in
                  </span>
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="text-sm font-semibold text-red-600 hover:text-red-700 transition disabled:opacity-70"
                    type="button"
                  >
                    {loggingOut ? "Logging out..." : "Logout"}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => openAuth("signin")}
                  className="text-sm font-semibold text-[#5A005A] hover:text-[#F29A00] transition"
                  type="button"
                >
                  Sign in
                </button>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              className="md:hidden text-[#5A005A] text-2xl"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label="Toggle navigation"
              type="button"
            >
              {mobileOpen ? <BsX /> : <BsList />}
            </button>
          </div>

          {/* Mobile menu (full width) */}
          {mobileOpen && (
            <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg z-50 border-t border-gray-100">
              <nav className="flex flex-col py-3 px-4 text-sm font-semibold text-[#5A005A]">
                {NAV_DATA.map((item) => {
                  const hasChildren = Array.isArray(item.children) && item.children.length > 0;
                  if (!hasChildren) {
                    return (
                      <ScrollLink
                        key={item.label}
                        to={item.to}
                        spy={true}
                        smooth={true}
                        offset={-120}
                        duration={500}
                        onClick={closeMobile}
                        className="py-2 border-b border-gray-100 cursor-pointer hover:text-[#F29A00]"
                      >
                        {item.label}
                      </ScrollLink>
                    );
                  }

                  return (
                    <div key={item.label} className="border-b border-gray-100">
                      <button
                        type="button"
                        onClick={() => toggleMobileParent(item.label)}
                        className="w-full text-left py-2 flex items-center justify-between gap-2 hover:text-[#F29A00]"
                        aria-expanded={!!mobileExpanded[item.label]}
                        aria-controls={`mobile-${item.label}`}
                      >
                        <span>{item.label}</span>
                        <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.25 8.27a.75.75 0 01-.02-1.06z" clipRule="evenodd" />
                        </svg>
                      </button>

                      {mobileExpanded[item.label] && (
                        <div id={`mobile-${item.label}`} className="pl-4 pb-2">
                          {item.children.map((c) => (
                            <ScrollLink
                              key={c.label}
                              to={c.to}
                              spy={true}
                              smooth={true}
                              offset={-120}
                              duration={500}
                              onClick={closeMobile}
                              className="block py-2 text-sm text-slate-700 hover:text-[#5A005A] cursor-pointer"
                            >
                              {c.label}
                            </ScrollLink>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="mt-3 mb-2">
                  {currentUser ? (
                    <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
                      <span className="font-semibold">Logged in:</span>
                      <span className="truncate">{loggedInName}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                      Not logged in
                    </div>
                  )}
                </div>

                {currentUser ? (
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="mt-2 w-full bg-red-500 text-white py-2 rounded text-xs font-semibold uppercase hover:bg-red-600 transition disabled:opacity-70"
                    type="button"
                  >
                    {loggingOut ? "Logging out..." : "Logout"}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      openAuth("signin");
                      closeMobile();
                    }}
                    className="mt-2 w-full bg-[#F29A00] text-[#5A005A] py-2 rounded text-xs font-semibold uppercase hover:bg-[#FFA500] transition"
                    type="button"
                  >
                    Get Started / Login
                  </button>
                )}
              </nav>
            </div>
          )}
        </div>
      </div>

      <section className="relative">
        <Swiper
          modules={[Autoplay]}
          spaceBetween={0}
          slidesPerView={1}
          breakpoints={{
            768: { slidesPerView: 2 },
          }}
          autoplay={autoplayConfig}
          allowTouchMove={!authOpen}
          style={{ pointerEvents: swiperPointerEvents }}
          speed={1200}
          loop={true}
          className="h-[85vh] min-h-[520px]"
        >
          {heroSlides.map((slide, index) => (
            <SwiperSlide key={index} className="relative">
              <img
                src={slide.image}
                alt={slide.title || "SHEVET-CITY hero"}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/55" />
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="absolute inset-0 z-10 flex items-start justify-center px-4 pt-10 md:pt-8 lg:pt-6 pointer-events-none">
          <div className="max-w-2xl text-center pointer-events-auto">
            <div className="inline-flex flex-col items-center mb-5">
              <div className="bg-white/90 rounded-full p-4 shadow-xl">
                <img
                  src={LOGO_SRC}
                  alt="SHEVET-CITY Crest"
                  className="h-28 w-28 md:h-32 md:w-32 object-contain rounded-full shadow-2xl border-4 border-white"
                />
                <span className="sr-only">SHEVET-CITY</span>
              </div>

              {/* Hero writeup with brand (SHEVET-CITY) */}
              <h1 className="mt-4 text-white text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight drop-shadow-lg">
                SHEVET-CITY
              </h1>

              <p className="mt-2 text-[#F29A00] text-base md:text-xl font-semibold italic tracking-wide">
                Storytelling that moves people
              </p>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <button
                  className="px-6 py-3 bg-[#F29A00] text-[#5A005A] font-semibold rounded-full hover:bg-[#FFA500] transition shadow-lg"
                  type="button"
                >
                  Enquire
                </button>
              </a>
            </div>
          </div>
        </div>

        <div className="absolute left-0 right-0 bottom-0 z-20">
          <div className="max-w-6xl mx-auto px-4 pb-8 md:pb-10">
            <div className="bg-white/90 backdrop-blur rounded-xl border border-white/60 shadow-lg overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="text-[11px] font-extrabold tracking-[0.25em] uppercase text-[#5A005A]">
                  Latest
                </span>

                {newsLoading && (
                  <span className="text-[11px] font-semibold text-slate-500">
                    Loading news…
                  </span>
                )}

                {newsError && !newsLoading && (
                  <span className="text-[11px] font-semibold text-red-600">
                    News load failed
                  </span>
                )}

                {!newsLoading && !newsError && tickerText && (
                  <div className="relative flex-1 overflow-hidden">
                    <div
                      className="whitespace-nowrap text-sm text-slate-700 font-semibold"
                      style={{
                        display: "inline-block",
                        paddingLeft: "100%",
                        animation: "heroMarquee 38s linear infinite",
                      }}
                      title="News highlights"
                    >
                      {tickerText}
                    </div>
                  </div>
                )}

                {!newsLoading && !newsError && !tickerText && (
                  <span className="text-[11px] font-semibold text-slate-500">
                    No news yet.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <AuthModal
        open={authOpen}
        mode={mode}
        setMode={setMode}
        onClose={closeAuth}
        onOpenChange={() => {}}
      />
    </header>
  );
};

export default Hero;