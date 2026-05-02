// src/components/Footer.jsx
import React from "react";
import { Link as ScrollLink } from "react-scroll";
import { FaFacebookF, FaWhatsapp, FaEnvelope, FaPhoneAlt } from "react-icons/fa";

const quickLinks = [
  { label: "Home", to: "home" },
  { label: "News", to: "news" },
  { label: "Gallery", to: "gallery" },
  { label: "Academics", to: "academics" },
  { label: "About Us", to: "about" },
  { label: "FAQs", to: "faqs" },
  { label: "Contact", to: "contact" },
];

const Footer = () => {
  return (
    <footer className="bg-blue-950 text-white">
      <div className="border-t-4 border-yellow-400" />

      <div className="max-w-6xl mx-auto px-4 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-yellow-300 font-semibold">
              Springfield
            </p>
            <h3 className="mt-3 text-2xl font-extrabold leading-snug text-white">
              Golden Tulip Academy
            </h3>
            <p className="mt-4 text-sm leading-7 text-white/80">
              Raising learners in a safe, inspiring, and disciplined
              environment.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-extrabold uppercase tracking-[0.2em] text-yellow-300">
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
                  className="cursor-pointer text-sm text-white/80 hover:text-yellow-300 transition"
                >
                  {item.label}
                </ScrollLink>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-extrabold uppercase tracking-[0.2em] text-yellow-300">
              Contact
            </h4>
            <div className="mt-5 space-y-4 text-sm text-white/80 leading-7">
              <p>
                Yakubu Gowon Way
                <br />
                (off NTA Headquarters),
                <br />
                Jos, Plateau State.
              </p>

              <a
                href="tel:+2348033353059"
                className="flex items-center gap-3 hover:text-yellow-300 transition"
              >
                <FaPhoneAlt className="text-yellow-300" />
                <span>+2348033353059</span>
              </a>

              <a
                href="mailto:Springfieldshools12@gmail.com"
                className="flex items-center gap-3 break-all hover:text-yellow-300 transition"
              >
                <FaEnvelope className="text-yellow-300 shrink-0" />
                <span>Springfieldshools12@gmail.com</span>
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-extrabold uppercase tracking-[0.2em] text-yellow-300">
              Connect With Us
            </h4>

            <div className="mt-5 flex items-center gap-4">
              <a
                href="https://www.facebook.com/share/16xwff6eJo/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="h-11 w-11 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-yellow-400 hover:text-blue-950 transition"
              >
                <FaFacebookF className="text-lg" />
              </a>

              <a
                href="https://wa.me/2348033353059"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="h-11 w-11 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-yellow-400 hover:text-blue-950 transition"
              >
                <FaWhatsapp className="text-xl" />
              </a>

              <a
                href="mailto:Springfieldshools12@gmail.com"
                aria-label="Email"
                className="h-11 w-11 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-yellow-400 hover:text-blue-950 transition"
              >
                <FaEnvelope className="text-lg" />
              </a>
            </div>

            <div className="mt-6">
              <a
                href="https://wa.me/2348033353059?text=Hello%20Springfield%20Golden%20Tulip%20Academy"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-yellow-400 text-blue-950 font-semibold hover:bg-yellow-300 transition shadow-md"
              >
                <FaWhatsapp />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-sm text-white/70 text-center md:text-left">
            © {new Date().getFullYear()} Springfield Golden Tulip Academy. All
            rights reserved.
          </p>

          <p className="text-sm text-white/70 text-center md:text-right">
            Designed with care for excellence.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;