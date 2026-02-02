'use client';

import { useState, useEffect, useRef } from 'react';

interface SkillCategory {
  title: string;
  icon: string;
  skills: {
    name: string;
    level: 'Advanced' | 'Proficient' | 'Experienced';
  }[];
}

const skillCategories: SkillCategory[] = [
  {
    title: 'Frontend',
    icon: '🎨',
    skills: [
      { name: 'React', level: 'Advanced' },
      { name: 'Next.js', level: 'Advanced' },
      { name: 'TypeScript', level: 'Proficient' },
      { name: 'Vue.js', level: 'Experienced' }
    ]
  },
  {
    title: 'Styling',
    icon: '✨',
    skills: [
      { name: 'Tailwind CSS', level: 'Advanced' },
      { name: 'Responsive Design', level: 'Advanced' },
      { name: 'CSS3/Sass', level: 'Proficient' }
    ]
  },
  {
    title: 'Tools',
    icon: '🛠️',
    skills: [
      { name: 'Git', level: 'Advanced' },
      { name: 'GitHub', level: 'Advanced' },
      { name: 'Vercel', level: 'Proficient' },
      { name: 'Figma', level: 'Experienced' }
    ]
  }
];

const getLevelColor = (level: string) => {
  switch (level) {
    case 'Advanced':
      return 'bg-gradient-to-r from-gray-700 to-gray-900 text-white';
    case 'Proficient':
      return 'bg-gradient-to-r from-gray-600 to-gray-800 text-white';
    case 'Experienced':
      return 'bg-gradient-to-r from-gray-500 to-gray-700 text-white';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getLevelWidth = (level: string) => {
  switch (level) {
    case 'Advanced':
      return 'w-full';
    case 'Proficient':
      return 'w-4/5';
    case 'Experienced':
      return 'w-3/5';
    default:
      return 'w-1/2';
  }
};

export default function Skills() {
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
    <section className="py-20 bg-gradient-to-b from-white to-gray-50 px-4 sm:px-6 lg:px-8">
      <div ref={sectionRef} className="max-w-6xl mx-auto">
        <div className={`text-center mb-16 ${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Skills & <span className="gradient-text">Tools</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Technologies and tools I work with to build exceptional digital experiences
          </p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-3">
          {skillCategories.map((category, categoryIndex) => (
            <div
              key={category.title}
              className={`card-hover bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-100 ${
                isVisible ? 'animate-scaleIn' : 'opacity-0'
              }`}
              style={{
                animationDelay: `${categoryIndex * 150}ms`
              }}
            >
              {/* Category header */}
              <div className="flex items-center gap-3 mb-8">
                <div className="text-3xl">{category.icon}</div>
                <h3 className="text-xl font-bold text-gray-900">
                  {category.title}
                </h3>
              </div>
              
              {/* Skills list */}
              <div className="space-y-6">
                {category.skills.map((skill, skillIndex) => (
                  <div
                    key={skill.name}
                    className={`space-y-2 ${
                      isVisible ? 'animate-fadeInLeft' : 'opacity-0'
                    }`}
                    style={{
                      animationDelay: `${categoryIndex * 150 + skillIndex * 100}ms`
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-gray-800 font-medium">
                        {skill.name}
                      </span>
                      <span
                        className={`px-3 py-1 text-xs rounded-full font-medium ${getLevelColor(
                          skill.level
                        )}`}
                      >
                        {skill.level}
                      </span>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r from-gray-600 to-gray-800 rounded-full transition-all duration-1000 ease-out ${
                          isVisible ? getLevelWidth(skill.level) : 'w-0'
                        }`}
                        style={{
                          transitionDelay: `${categoryIndex * 150 + skillIndex * 100 + 500}ms`
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Additional info */}
        <div className={`mt-16 text-center ${isVisible ? 'animate-fadeInUp animate-delay-500' : 'opacity-0'}`}>
          <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-8 shadow-md border border-gray-100">
            <p className="text-gray-700 leading-relaxed max-w-3xl mx-auto">
              I'm continuously learning and adapting to new technologies. My focus is on creating 
              scalable, maintainable solutions that provide exceptional user experiences while 
              following best practices and industry standards.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
