import { ReactNode } from "react";

interface HeroSectionProps {
  children: ReactNode;
}

export function HeroSection({ children }: HeroSectionProps) {
  return (
    <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-20"></div>

      {/* Content */}
      <div className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          {/* Hero Text */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Find Your Perfect Flight</h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
              Discover amazing deals on flights worldwide. Book with confidence and travel with ease.
            </p>
          </div>

          {/* Search Form Container */}
          <div className="bg-white rounded-lg shadow-xl p-6 md:p-8">{children}</div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="hidden lg:block absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="hidden lg:block absolute top-10 left-10 w-20 h-20 bg-white bg-opacity-10 rounded-full"></div>
        <div className="hidden lg:block absolute top-32 right-15 w-16 h-16 bg-white bg-opacity-10 rounded-full"></div>
        <div className="hidden lg:block absolute bottom-20 left-1/4 w-12 h-12 bg-white bg-opacity-10 rounded-full"></div>
        <div className="hidden lg:block absolute bottom-10 right-10 w-24 h-24 bg-white bg-opacity-10 rounded-full"></div>
      </div>
    </section>
  );
}
