'use client';

import { useState, useEffect, useRef } from 'react';

export default function About() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section id="about" className="py-20 bg-white px-4 sm:px-6 lg:px-8">
      <div ref={sectionRef} className="max-w-4xl mx-auto">
        <div className={`text-center mb-16 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-700 ease-out`}>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 font-cabin">
            About Me
          </h2>
        </div>

        <div className={`space-y-8 max-w-3xl mx-auto ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-700 ease-out`}>
          <p className="text-lg text-gray-600 leading-relaxed font-cabin">
            I'm Iduwe Ekene Leonard, a developer focused on building accessible, 
            performant web applications with clean code and thoughtful design.
          </p>
          
          <p className="text-lg text-gray-600 leading-relaxed font-cabin">
            I specialize in building responsive, modern web applications using React, 
            Next.js, and TypeScript. My focus is on writing clean, maintainable code 
            while ensuring excellent user experiences across all devices and browsers.
          </p>
          
          <p className="text-lg text-gray-600 leading-relaxed font-cabin">
            The intersection of design and engineering is where I thrive. I believe 
            the best digital products come from understanding both technical constraints 
            and the human needs they serve.
          </p>

          <div className="grid grid-cols-3 gap-6 pt-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 font-cabin">Clean</div>
              <div className="text-sm text-gray-600 font-cabin">Code</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 font-cabin">User</div>
              <div className="text-sm text-gray-600 font-cabin">First</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 font-cabin">Growth</div>
              <div className="text-sm text-gray-600 font-cabin">Mindset</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
