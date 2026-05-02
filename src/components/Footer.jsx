// src/components/Footer.jsx
import React from "react";
import { Link as ScrollLink } from "react-scroll";
import { FaFacebookF, FaWhatsapp, FaEnvelope, FaPhoneAlt } from "react-icons/fa";

const quickLinks = [
  { label: "Home", to: "home" },
  { label: "News", to: "news" },
  { label: "Gallery", to: "gallery" },
  { label: "Culture", to: "culture" },
  { label: "Magazine", to: "magazine" },
  { label: "About Us", to: "about" },
  { label: "Contact", to: "contact" },
];

const Footer = () => {
  const primaryColor = "#5A005A"; // Deep Purple
  const primaryDark = "#6A006A";
  const accentColor = "#F29A00"; // Golden Orange
  const accentHover = "#FFA500";

  return (
    <footer className="text-white" style={{ background: primaryColor }}>
      <div style={{ borderTop: `4px solid ${accentColor}` }} />

      <div className="max-w-6xl mx-auto px-4 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p
              className="text-xs uppercase tracking-[0.28em] font-semibold"
              style={{ color: accentColor }}
            >
              SHEVET-CITY
            </p>
            <h3 className="mt-3 text-2xl font-extrabold leading-snug text-white">
              SHEVET-CITY Media
            </h3>
            <p className="mt-4 text-sm leading-7 text-white/80">
              Multimedia storytelling — productions, journalism, events and creative
              projects that engage and inform communities.
            </p>
          </div>

          <div>
            <h4
              className="text-sm font-extrabold uppercase tracking-[0.2em]"
              style={{ color: accentColor }}
            >
              Quick Links
            </h4>
            <div className="mt-5 flex flex-col gap-3">
              {quickLinks.map((item) => (
                <ScrollLink
                  key={item.label}
                  to={item.to}
                  spy={true}
                  smooth={true}
                  offset={-120}
                  duration={500}
                  className="cursor-pointer text-sm text-white/80 transition"
                  onMouseEnter={(e) => (e.currentTarget.style.color = accentColor)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
                >
                  {item.label}
                </ScrollLink>
              ))}
            </div>
          </div>

          <div>
            <h4
              className="text-sm font-extrabold uppercase tracking-[0.2em]"
              style={{ color: accentColor }}
            >
              Contact
            </h4>
            <div className="mt-5 space-y-4 text-sm text-white/80 leading-7">
              <p>
                Gloryville Garden
                <br />
                Opposite Deputy Governor's House,
                <br />
                Rayfield, Jos, Plateau State.
              </p>

              <div className="space-y-1">
                <a
                  href="tel:+2349069060610"
                  className="flex items-center gap-3 transition"
                  style={{ color: "rgba(255,255,255,0.85)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = accentHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.85)")}
                >
                  <FaPhoneAlt style={{ color: accentColor }} />
                  <span>(+234) 90 69060610</span>
                </a>

                <a
                  href="tel:+2347061913298"
                  className="flex items-center gap-3 transition"
                  style={{ color: "rgba(255,255,255,0.85)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = accentHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.85)")}
                >
                  <FaPhoneAlt style={{ color: accentColor }} />
                  <span>(+234) 70 61913298</span>
                </a>
              </div>

              <a
                href="mailto:Shevet-City@gmail.com"
                className="flex items-center gap-3 break-all transition"
                style={{ color: "rgba(255,255,255,0.85)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = accentHover)}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.85)")}
              >
                <FaEnvelope style={{ color: accentColor }} />
                <span>Shevet-City@gmail.com</span>
              </a>
            </div>
          </div>

          <div>
            <h4
              className="text-sm font-extrabold uppercase tracking-[0.2em]"
              style={{ color: accentColor }}
            >
              Connect With Us
            </h4>

            <div className="mt-5 flex items-center gap-4">
              <a
                href="#"
                aria-label="Facebook"
                className="h-11 w-11 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white transition"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = accentColor;
                  e.currentTarget.style.color = primaryColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.color = "white";
                }}
              >
                <FaFacebookF className="text-lg" />
              </a>

              <a
                href="#"
                aria-label="WhatsApp"
                className="h-11 w-11 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white transition"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = accentColor;
                  e.currentTarget.style.color = primaryColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.color = "white";
                }}
              >
                <FaWhatsapp className="text-xl" />
              </a>

              <a
                href="#"
                aria-label="Email"
                className="h-11 w-11 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white transition"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = accentColor;
                  e.currentTarget.style.color = primaryColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.color = "white";
                }}
              >
                <FaEnvelope className="text-lg" />
              </a>
            </div>

            <div className="mt-6">
              <a
                href="#"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full font-semibold transition shadow-md"
                style={{
                  background: accentColor,
                  color: primaryColor,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = accentHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = accentColor)}
              >
                <FaWhatsapp />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-sm text-white/70 text-center md:text-left">
              © {new Date().getFullYear()} SHEVET-CITY Media. All rights reserved.
            </p>

            <p className="text-sm text-white/70 text-center md:text-right">
              Designed with care for excellence.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;