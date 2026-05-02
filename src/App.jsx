import React from "react";
import "./App.css";

import AboutUs from "./components/AboutUs";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import WhatsAppIcon from "./components/watsappComponent";
import NewsSection from "./components/NewsSection";

// ✅ Gallery
import GallerySection from "./components/GallerySection";

// ✅ Academics (Curriculum + Admissions)
// import AcademicSection from "./components/Academics";

// ✅ FAQs
// import Faqs from "./components/Faqs";

function App() {
  return (
    <>
      <div>
        <Hero />


        <GallerySection />
        <NewsSection />


        {/* <AcademicSection /> */}

        <AboutUs />

        {/* <Faqs /> */}

        <Contact />

        <WhatsAppIcon />

        <Footer />
      </div>
    </>
  );
}

export default App;