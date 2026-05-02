import React from "react";
import { FaWhatsapp } from "react-icons/fa"; // Import WhatsApp icon

const WhatsAppIcon = ({ messageCount = 1 }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="relative">
        <a
          href="https://wa.me/2348033353059" // Replace with your WhatsApp number
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-500 text-white w-12 h-12 sm:w-8 sm:h-8 flex items-center justify-center rounded-full shadow-lg hover:bg-green-600 transition-transform transform hover:scale-105"
        >
          <FaWhatsapp className="text-xl sm:text-3xl" />
        </a>

        {/* Badge for message count */}
        {messageCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs sm:text-sm font-bold h-5 w-5 sm:h-6 sm:w-6 rounded-full flex items-center justify-center shadow-md">
            {messageCount}
          </span>
        )}
      </div>
    </div>
  );
};

export default WhatsAppIcon;
