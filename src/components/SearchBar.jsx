import React from "react";
import { FaSearch } from "react-icons/fa";

function SearchBar({ searchQuery, setSearchQuery }) {
  return (
    <div className="fixed top-0 left-0 w-full bg-white z-50 shadow-md lg:px-24 px-4">
      <div className="w-full px-4 sm:px-4 lg:px-6 py-4 flex justify-center">
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex items-center bg-gray-100 rounded-full p-2 w-full max-w-lg h-12"
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dishes..."
            className="flex-grow bg-transparent border-none outline-none text-gray-700 px-4"
          />
          <button
            type="submit"
            className="bg-transparent border-none outline-none p-2"
            tabIndex={-1}
          >
            <FaSearch className="text-gray-500 w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default SearchBar;