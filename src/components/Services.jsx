import React from "react";
import { motion } from "framer-motion";
import {
  FaTruck,
  FaUtensils,
  FaCalendarAlt,
  FaConciergeBell,
  FaPizzaSlice,
  FaShoppingBasket
} from "react-icons/fa";
const { comments } = useMyContext();
const servicesData = [
  {
    icon: FaTruck,
    title: "Fast Food Delivery",
    description: "Quick and reliable food delivery to your doorstep."
  },
  {
    icon: FaCalendarAlt,
    title: "Event Catering",
    description: "Catering for weddings, birthdays, and corporate events."
  },
  {
    icon: FaConciergeBell,
    title: "Personal Chef",
    description: "Hire professional chefs for private dinners and parties."
  },
  {
    icon: FaPizzaSlice,
    title: "Custom Meal Plans",
    description: "Tailored meal plans to fit your dietary needs and preferences."
  },
  {
    icon: FaShoppingBasket,
    title: "Grocery Assistance",
    description: "Get groceries delivered with your meal orders."
  },
  {
    icon: FaUtensils,
    title: "Table Reservation",
    description: "Reserve tables at our partner restaurants with ease."
  }
];

const iconAnimations = [
  {
    animate: {
      x: [0, -10, 10, -10, 10, 0],
      transition: { repeat: Infinity, duration: 2, ease: "easeInOut" }
    }
  },
  {
    animate: {
      y: [0, -10, 0],
      transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
    }
  },
  {
    animate: {
      scale: [1, 1.2, 1],
      transition: { repeat: Infinity, duration: 1.8, ease: "easeInOut" }
    }
  },
  {
    animate: {
      rotate: [0, 10, -10, 10, -10, 0],
      transition: { repeat: Infinity, duration: 2.5, ease: "easeInOut" }
    }
  },
  {
    animate: {
      y: [0, 8, 0],
      transition: { repeat: Infinity, duration: 2, ease: "easeInOut" }
    }
  },
  {
    animate: {
      opacity: [0.8, 1, 0.8],
      y: [0, -5, 0],
      transition: { repeat: Infinity, duration: 2.2, ease: "easeInOut" }
    }
  }
];

const AboutUs = () => {
  return (
    <section id="about" className="bg-gray-100 py-10 px-4 sm:px-8 lg:px-16 scroll-mt-24">
      <div className="container mx-auto max-w-7xl">
        {/* Title Section */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-extrabold text-gray-800 mb-4 tracking-tight">
            About Us
          </h2>
          <p className="text-sm text-gray-500">
            Home &gt; <span className="text-indigo-600 font-bold">About Us</span>
          </p>
        </div>

        {/* Main Section */}
        <div className="grid lg:grid-cols-2 gap-8 items-center mb-12">
          <div>
            <img
              src="/images/construction1.jpg"
              alt="Solar Solutions"
              className="w-full h-auto rounded-lg shadow-lg object-cover"
            />
          </div>
          <div>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              <strong className="text-blue-500">PARITE CONSULTS NIG</strong> is a company with regional scope and national recognition...
            </p>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              <strong>PARITE CONSULTS NIG</strong> is a leader in providing value-added construction services...
            </p>
          </div>
        </div>

        {/* Replaced Core Services Section */}
        <h3 id="services" className="text-2xl font-bold text-gray-800 text-center uppercase tracking-wide mb-8">
          Our Core Services
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {servicesData.map((service, index) => {
            const Icon = service.icon;
            return (
              <div
                key={index}
                className="bg-white shadow-md rounded-lg p-6 text-center space-y-4"
              >
                <motion.div
                  className="flex justify-center"
                  animate={iconAnimations[index].animate}
                >
                  <Icon size={40} className="text-brightColor" />
                </motion.div>
                <h2 className="text-xl font-bold">{service.title}</h2>
                <p className="text-gray-600">{service.description}</p>
              </div>
            );
          })}
        </div>

        {/* Commitment Section */}
        <h3 className="text-2xl font-bold text-gray-800 text-center uppercase mb-8">
          Our Commitment to Safety
        </h3>
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h4 className="text-xl font-semibold text-gray-800 mb-4">People First</h4>
            <p className="text-gray-700">
              People are our greatest resource and most valuable asset...
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h4 className="text-xl font-semibold text-gray-800 mb-4">Safety is Everyone’s Job</h4>
            <p className="text-gray-700">
              Safety is everyone's job...
            </p>
          </div>
        </div>

        {/* Vision & Mission Section */}
        <h3 className="text-3xl font-bold text-gray-900 text-center uppercase tracking-wide mb-8">
          Our Vision & Mission
        </h3>
        <div>
          <h4 className="text-2xl font-semibold text-gray-800 mb-4">Vision</h4>
          <p className="text-lg text-gray-700 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 p-4 border-l-4 border-gray-800 rounded-lg shadow-md mb-8">
            To be a leading force in the architecture and building construction industry...
          </p>

          <h4 className="text-2xl font-semibold text-gray-800 mb-4">Mission</h4>
          <p className="text-lg text-gray-700 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 p-4 border-l-4 border-gray-800 rounded-lg shadow-md">
            Dedication to providing quality design, construction, technical, and management services...
          </p>
        </div>

        {/* Testimonials Section */}
       {/* Testimonials Section */}
<div id="testimonials">
  <h3 className="text-2xl font-bold text-gray-800 text-center uppercase tracking-wide m-8">
    What Our Clients Say
  </h3>

  {comments.length === 0 ? (
    <p className="text-center text-gray-500">No testimonials yet.</p>
  ) : (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
      {comments.map((comment, index) => (
        <div
          key={index}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <img
            src={comment.photoURL || "/images/default-user.jpg"} // fallback if no image
            alt={comment.name || "Anonymous"}
            className="w-16 h-16 rounded-full object-cover mb-4"
          />
          <p className="text-gray-700 italic mb-4">“{comment.text}”</p>
          <h4 className="text-lg font-semibold text-gray-800">
            {comment.name || "Anonymous"}
          </h4>
          {comment.phone && (
            <p className="text-sm text-gray-600">📞 {comment.phone}</p>
          )}
        </div>
      ))}
    </div>
  )}
</div>


      </div>
    </section>
  );
};

export default AboutUs;
