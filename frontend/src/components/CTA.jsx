// CTASection.jsx

import React from "react";

const CTASection = () => {
  return (
    <section className="bg-black text-white py-20 px-6">
      <div className="max-w-6xl mx-auto text-center">
        
        {/* Heading */}
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Ready to Grow Your Business?
        </h2>

        {/* Subheading */}
        <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10">
          Start building your brand with modern cloud solutions and
          high-quality digital services today.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          
          <button className="bg-white text-black px-8 py-3 rounded-xl font-semibold hover:bg-gray-200 transition">
            Get Started
          </button>

          <button className="border border-white px-8 py-3 rounded-xl font-semibold hover:bg-white hover:text-black transition">
            Learn More
          </button>

        </div>
      </div>
    </section>
  );
};

export default CTASection;