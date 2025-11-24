import { FC } from "react";

const Navbar: FC = () => (
  <header className="flex items-center justify-between px-8 h-16 bg-white shadow-sm rounded-b-xl">
    {/* Left: Search */}
    <div className="flex items-center gap-4">
      <div className="relative">
        <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 pointer-events-none">
          {/* Search Icon SVG */}
          <svg width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx={11} cy={11} r={8} />
            <line x1={21} y1={21} x2={16.65} y2={16.65} />
          </svg>
        </span>
        <input
          type="text"
          placeholder="Search"
          className="w-xl pl-10 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all bg-gray-50"
        />
      </div>
    </div>

    {/* Right: Actions */}
    <div className="flex items-center gap-6">
      <a
        href="/about"
        className="text-gray-500 hover:text-blue-600 font-medium transition"
      >
        About
      </a>
      <a
        href="/contact"
        className="text-gray-500 hover:text-blue-600 font-medium transition"
      >
        Contact
      </a>
      {/* Notification placeholder */}
      <button className="relative focus:outline-none">
        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full absolute top-0 right-0"></span>
        <svg
          className="w-6 h-6 text-gray-400 hover:text-blue-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 7.165 6 9.388 6 12v2.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      </button>
      {/* Avatar/profile */}
      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-400 to-blue-700 flex items-center justify-center text-white font-semibold shadow-lg">
        {/* Optionally replace with user image */}
        A
      </div>
    </div>
  </header>
);

export default Navbar;
