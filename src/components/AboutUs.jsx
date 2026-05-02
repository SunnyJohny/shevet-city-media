import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BsArrowRight,
  BsShieldCheck,
  BsGlobe2,
  BsHeartPulse,
  BsStars,
  BsCheck2Circle,
  BsMusicNoteBeamed,
  BsCameraVideo,
  BsMic,
  BsCalendarEvent,
  BsBrush,
  BsSearch,
} from "react-icons/bs";
import { Link as ScrollLink } from "react-scroll";

import schoolLogo from "../assets/SheveCity.png";
// Use a gallery image for the hero/owner picture when available
import HardcodedGallery from "../data/HardcodedGallery";

const container = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: "easeOut",
      when: "beforeChildren",
      staggerChildren: 0.08,
    },
  },
};

const itemVar = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

const values = [
  { letter: "I", word: "Integrity" },
  { letter: "P", word: "Professionalism" },
  { letter: "C", word: "Creativity" },
  { letter: "S", word: "Service" },
  { letter: "E", word: "Excellence" },
  { letter: "R", word: "Respect" },
];

const paradigms = [
  { label: "Film & Video", icon: <BsCameraVideo /> },
  { label: "Photography", icon: <BsBrush /> },
  { label: "Podcasts", icon: <BsMic /> },
  { label: "Live Events", icon: <BsCalendarEvent /> },
  { label: "Editorial & Investigations", icon: <BsSearch /> },
  { label: "Music & Performance", icon: <BsMusicNoteBeamed /> },
];

const additionalSections = {
  "Culture & Entertainment": [
    "Sports",
    "Movies",
    "Documentaries",
    "Music",
    "Shows & podcasts",
    "Arts & crafts",
    "Festivals",
  ],
  Lifestyle: ["Travels", "Food & hospitality", "Fashion", "Homes and gardens"],
  Magazine: ["The Legend", "The Mentor", "The Market Place"],
  News: ["Headlines (local and global news updates)", "Archives", "Inspiration"],
  Shop: ["Goods"],
  Partners: [
    "Corporate organizations",
    "Civil societies",
    "Government bodies",
    "Personalities",
  ],
  "Shevet-city Foundation (Charity)": [
    "Leadership",
    "Environment",
    "Wildlife & marine conservation",
    "Education",
    "Health & Nutrition",
  ],
};

const AboutUs = ({
  organizationName = "SHEVET-CITY Communications",
  tagline = "Amplifying stories & ideas",
  ownerName = "Madam Semira",
  ownerRole = "Founder / CEO",
}) => {
  const breadcrumbs = useMemo(() => ["Home", "About us"], []);

  // Select a gallery image (first valid image) to use in the about hero / owner card.
  const ownerPic = useMemo(() => {
    const normalize = (raw) => {
      if (!raw) return null;
      if (/^https?:\/\//i.test(raw)) return raw;
      return raw.startsWith("/") ? raw : `/${raw}`;
    };

    if (Array.isArray(HardcodedGallery) && HardcodedGallery.length > 0) {
      const found = HardcodedGallery.find((h) => !!h?.image);
      if (found) return normalize(found.image);
    }
    return null;
  }, []);

  // Branding colours (consistent across site)
  const primaryColor = "#5A005A"; // Deep Purple
  const primaryDark = "#6A006A";
  const accentColor = "#F29A00"; // Golden Orange
  const accentHover = "#FFA500";

  // small helper styles
  const pillLightBg = "#F7EEF7";
  const pillLightBorder = "#EAD9EA";

  return (
    <section id="about" className="bg-white py-16 md:py-20 px-4 md:px-8 lg:px-16">
      <div className="max-w-6xl mx-auto">
        {/* Top title + breadcrumb */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mb-10"
        >
          <p
            className="text-xs font-semibold tracking-[0.3em] uppercase mb-2"
            style={{ color: primaryColor }}
          >
            About us
          </p>

          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            {breadcrumbs.map((b, i) => (
              <span key={b} className="inline-flex items-center gap-2">
                <span
                  className={i === breadcrumbs.length - 1 ? "font-semibold" : ""}
                  style={i === breadcrumbs.length - 1 ? { color: primaryColor } : undefined}
                >
                  {b}
                </span>
                {i !== breadcrumbs.length - 1 && <span className="text-slate-300">/</span>}
              </span>
            ))}
          </div>

          <h2
            className="mt-4 text-3xl md:text-4xl font-extrabold leading-tight"
            style={{ color: primaryColor }}
          >
            Who we are
          </h2>
        </motion.div>

        {/* SIDE-BY-SIDE: Owner picture + write-up */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid gap-6 md:grid-cols-5 items-start mb-10"
        >
          {/* Left: Image (2/5) */}
          <motion.div
            variants={itemVar}
            className="md:col-span-2 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
          >
            <div className="relative">
              {ownerPic ? (
                <img
                  src={ownerPic}
                  alt={`${ownerName} - ${ownerRole}`}
                  className="w-full h-[380px] md:h-[520px] object-cover object-top"
                  onError={(e) => {
                    console.error("Owner image failed to load:", ownerPic);
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <img
                  src={schoolLogo}
                  alt={`${organizationName}`}
                  className="w-full h-[380px] md:h-[520px] object-cover object-top"
                />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-white text-sm md:text-base font-extrabold drop-shadow">{ownerName}</p>
                <p className="text-white/90 text-xs md:text-sm drop-shadow mt-1">
                  {ownerRole} • Building a culture of thoughtful media and public value.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right: Write-up (3/5) */}
          <motion.div
            variants={itemVar}
            className="md:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center border"
                style={{ background: pillLightBg, color: primaryColor, borderColor: pillLightBorder }}
              >
                <BsStars className="text-xl" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-extrabold" style={{ color: primaryColor }}>
                  About {organizationName}
                </h3>
                <p className="text-sm text-slate-600 mt-1">{tagline}</p>
              </div>
            </div>

            <p className="mt-4 text-sm md:text-base text-slate-600 leading-relaxed">
              {organizationName} is a multimedia organisation that is poised to promote values and ideas through all forms of relevant media, cutting across arts and entertainment, news, programmes and events, research, and development reportage or expose.
            </p>

            <p className="mt-3 text-sm md:text-base text-slate-600 leading-relaxed">
              We produce content and run initiatives that inform, inspire and engage communities — from documentary films and podcasts to investigative features, live events and creative productions. Our work places emphasis on integrity, rigorous research, creative storytelling and measurable public impact.
            </p>

            <p className="mt-3 text-sm md:text-base text-slate-600 leading-relaxed">
              Through partnerships, capacity building and community-focused projects, we seek to strengthen local media ecosystems and amplify voices that matter.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span
                className="px-4 py-2 rounded-full text-xs md:text-sm font-semibold border"
                style={{ background: pillLightBg, color: primaryColor, borderColor: pillLightBorder }}
              >
                Multimedia Production
              </span>
              <span
                className="px-4 py-2 rounded-full text-xs md:text-sm font-semibold border"
                style={{ background: "#FFF6E6", color: accentColor, borderColor: "#FFEDD5" }}
              >
                Investigative Reporting
              </span>
              <span
                className="px-4 py-2 rounded-full text-xs md:text-sm font-semibold border"
                style={{ background: "#F3F5F7", color: "#374151", borderColor: "#E6E9EE" }}
              >
                Community Engagement
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* 3-column layout: logo + core values / mission / vision */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Logo card */}
          <motion.div
            variants={itemVar}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="bg-slate-50 rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col items-center text-center"
          >
            <div className="w-24 h-24 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center p-3">
              <img src={schoolLogo} alt="Shevet-city logo" className="w-full h-full object-contain" />
            </div>

            <h3 className="mt-4 text-lg font-extrabold" style={{ color: primaryColor }}>
              {organizationName}
            </h3>
            <p className="mt-1 text-sm font-semibold" style={{ color: accentColor, fontStyle: "italic" }}>
              {tagline}
            </p>

            <div className="mt-5 w-full rounded-xl bg-white border border-slate-200 p-4">
              <div className="flex items-center justify-center gap-2" style={{ color: primaryColor, fontWeight: 800 }}>
                <BsStars />
                <span>Core Values</span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {values.map((v) => (
                  <div key={v.letter} className="rounded-xl border border-slate-100 bg-slate-50 p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-extrabold" style={{ background: primaryColor, color: "#fff" }}>
                      {v.letter}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-extrabold" style={{ color: primaryColor }}>
                        {v.word}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Mission + Vision + Why us */}
          <div className="lg:col-span-2 grid gap-6">
            {/* Mission & Vision */}
            <motion.div
              variants={itemVar}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="grid gap-6 md:grid-cols-2"
            >
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl border" style={{ background: pillLightBg, color: primaryColor, borderColor: pillLightBorder }}>
                    <BsShieldCheck />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold" style={{ color: primaryColor }}>
                      Our Mission
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">What we exist to achieve.</p>
                  </div>
                </div>

                <p className="mt-4 text-sm md:text-base text-slate-700 leading-relaxed">
                  To promote values and ideas through high-quality, ethical multimedia storytelling that educates, engages and drives positive change.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl border" style={{ background: "#FFF6E6", color: accentColor, borderColor: "#FFEDD5" }}>
                    <BsGlobe2 />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold" style={{ color: primaryColor }}>
                      Our Vision
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">Where we are headed.</p>
                  </div>
                </div>

                <p className="mt-4 text-sm md:text-base text-slate-700 leading-relaxed">
                  To be a leading multimedia organisation recognized for integrity, creativity and measurable impact across arts, journalism and public-interest media.
                </p>
              </div>
            </motion.div>

            {/* Why us */}
            <motion.div
              variants={itemVar}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border" style={{ background: pillLightBg, color: primaryColor, borderColor: pillLightBorder }}>
                  <BsHeartPulse />
                </div>

                <div className="min-w-0">
                  <h3 className="text-xl md:text-2xl font-extrabold" style={{ color: primaryColor }}>
                    Why {organizationName}?
                  </h3>

                  <p className="mt-2 text-sm md:text-base text-slate-600 leading-relaxed">
                    We combine creative production, investigative rigor and community focus to produce media that matters — delivered across platforms for maximum reach and effect.
                  </p>

                  <p className="mt-3 text-sm md:text-base text-slate-600 leading-relaxed">
                    Our team blends editorial expertise, production capabilities and event experience to support storytelling, public accountability and cultural expression.
                  </p>

                  <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                    {[
                      "Multimedia storytelling & production",
                      "Investigative and research-driven reporting",
                      "Cross-platform distribution (web, audio, video, events)",
                      "Creative partnerships & community collaborations",
                      "Capacity building and training for local media",
                      "Audience-focused, impact-driven campaigns",
                    ].map((p) => (
                      <li key={p} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="mt-1" style={{ color: accentColor }}>
                          <BsCheck2Circle />
                        </span>
                        <span className="leading-relaxed">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Our Focus Areas (media framing of the previous 'teaching paradigm') */}
            <motion.div
              variants={itemVar}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="bg-slate-50 rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8"
            >
              <h3 className="text-xl md:text-2xl font-extrabold" style={{ color: primaryColor }}>
                Our Focus Areas
              </h3>
              <p className="mt-2 text-sm md:text-base text-slate-600 max-w-3xl">
                We work across production, journalism, events, research and training to create content and initiatives that educate, inform and entertain.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {paradigms.map((x) => (
                  <div key={x.label} className="rounded-2xl bg-white border border-slate-200 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: primaryColor, color: "#fff" }}>
                      {x.icon}
                    </div>
                    <p className="text-sm font-extrabold" style={{ color: primaryColor }}>{x.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* New: Expanded Editorial Sections */}
            <motion.div
              variants={itemVar}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8"
            >
              <h3 className="text-xl md:text-2xl font-extrabold" style={{ color: primaryColor }}>
                Editorial & Content Sections
              </h3>
              <p className="mt-2 text-sm md:text-base text-slate-600">
                Our editorial and content verticals span culture, lifestyle, magazine features, news and more:
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(additionalSections).map(([section, items]) => (
                  <div key={section} className="rounded-xl border border-slate-100 p-4 bg-slate-50">
                    <h4 className="font-extrabold" style={{ color: primaryColor }}>{section}</h4>
                    <ul className="mt-2 text-sm text-slate-700 space-y-1">
                      {items.map((it) => (
                        <li key={it} className="flex items-start gap-2">
                          <span className="mt-1" style={{ color: accentColor }}><BsArrowRight /></span>
                          <span>{it}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              variants={itemVar}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="rounded-2xl overflow-hidden border shadow-sm"
              style={{
                background: `linear-gradient(90deg, ${primaryColor}, ${primaryDark} 60%, ${accentColor})`,
                borderColor: "rgba(90,0,90,0.08)",
              }}
            >
              <div className="p-6 md:p-8 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="max-w-2xl">
                  <p className="text-xs font-semibold tracking-[0.35em] uppercase text-white/90">Collaborate</p>
                  <h3 className="mt-2 text-2xl md:text-3xl font-extrabold leading-tight">Partner with us to tell better stories</h3>
                  <p className="mt-2 text-sm md:text-base text-white/90">Work with SHEVET-CITY Communications on productions, reporting projects, events or training programs.</p>
                </div>

                <div className="flex gap-3 flex-wrap">
                  <ScrollLink to="services" smooth offset={-90} duration={500} className="cursor-pointer">
                    <button type="button" className="px-6 py-3 rounded-full bg-white text-[#5A005A] font-extrabold hover:bg-slate-100 transition inline-flex items-center gap-2">
                      Our Services <BsArrowRight />
                    </button>
                  </ScrollLink>

                  <ScrollLink to="contact" smooth offset={-90} duration={500} className="cursor-pointer">
                    <button type="button" className="px-6 py-3 rounded-full border-2 border-white text-white font-extrabold hover:bg-white hover:text-[#5A005A] transition">
                      Contact Us
                    </button>
                  </ScrollLink>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;