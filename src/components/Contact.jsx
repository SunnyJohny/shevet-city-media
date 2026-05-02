// src/components/Contact.jsx
import React from "react";

const Contact = () => {
  return (
    <section
      id="contact"
      className="relative bg-gradient-to-b from-white via-blue-50 to-white py-16 md:py-20"
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <p className="text-sm md:text-base font-semibold uppercase tracking-[0.25em] text-blue-600">
            Contact Us
          </p>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-blue-900">
            SHEVET-CITY Media
          </h2>
          <div className="mt-4 w-24 h-1 bg-yellow-400 mx-auto rounded-full" />
          <p className="mt-5 text-slate-600 text-sm md:text-base leading-relaxed">
            We are here to help with enquiries about our productions, partnerships,
            editorial submissions and other services. Reach out and we’ll get back to you.
          </p>
        </div>

        <div className="bg-white border border-blue-100 shadow-xl rounded-3xl overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="bg-blue-900 text-white p-8 md:p-10">
              <p className="text-xs md:text-sm uppercase tracking-[0.25em] text-yellow-300 font-semibold">
                Our Details
              </p>

              <h3 className="mt-3 text-2xl md:text-3xl font-extrabold leading-snug">
                SHEVET-CITY MEDIA
              </h3>

              <div className="mt-8 space-y-6">
                <div>
                  <p className="text-yellow-300 text-xs uppercase tracking-[0.2em] font-semibold">
                    Address
                  </p>
                  <p className="mt-2 text-sm md:text-base leading-relaxed text-white/90">
                    Gloryville Garden, Opposite Deputy Governor's House, Rayfield, Jos, Plateau State.
                  </p>
                </div>

                <div>
                  <p className="text-yellow-300 text-xs uppercase tracking-[0.2em] font-semibold">
                    Contact
                  </p>
                  <div className="mt-2 space-y-1">
                    <a
                      href="tel:09069060610"
                      className="block text-sm md:text-base text-white/90 hover:text-yellow-300 transition"
                    >
                      09069060610
                    </a>
                    <a
                      href="tel:+2347061913298"
                      className="block text-sm md:text-base text-white/90 hover:text-yellow-300 transition"
                    >
                      +2347061913298
                    </a>
                  </div>
                </div>

                <div>
                  <p className="text-yellow-300 text-xs uppercase tracking-[0.2em] font-semibold">
                    Email
                  </p>
                  <a
                    href="mailto:Shevet-City@gmail.com"
                    className="mt-2 block text-sm md:text-base text-white/90 break-all hover:text-yellow-300 transition"
                  >
                    Shevet-City@gmail.com
                  </a>
                </div>
              </div>
            </div>

            <div className="p-8 md:p-10 flex items-center">
              <div className="w-full">
                <div className="inline-flex items-center gap-2 bg-yellow-100 text-blue-900 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-[0.2em]">
                  Reach Out Anytime
                </div>

                <h3 className="mt-5 text-2xl md:text-3xl font-extrabold text-blue-900 leading-snug">
                  We would love to hear from you
                </h3>

                <p className="mt-4 text-slate-600 text-sm md:text-base leading-relaxed">
                  For enquiries about productions, editorial contributions, partnerships
                  or general information, please contact SHEVET-CITY Media using the phone
                  numbers or email address below. We aim to respond as quickly as possible.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <a
                    href="tel:09069060610"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-yellow-400 text-blue-900 font-semibold hover:bg-yellow-300 transition shadow-md"
                  >
                    Call: 09069060610
                  </a>

                  <a
                    href="mailto:Shevet-City@gmail.com"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-full border-2 border-blue-900 text-blue-900 font-semibold hover:bg-blue-900 hover:text-white transition"
                  >
                    Send Email
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> 
    </section>
  );
};

export default Contact;