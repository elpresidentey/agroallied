'use client';

import { useState, useEffect, useRef } from 'react';

interface Project {
  id: string;
  name: string;
  oneLiner: string;
  blurb: string;
  tech: string[];
  liveUrl: string;
  githubUrl: string;
}

const projects: Project[] = [
  {
    id: 'diasporan',
    name: 'Diasporan',
    oneLiner: 'A responsive travel exploration and booking app built with modern Next.js UI patterns.',
    blurb: 'Diasporan is a travel experience web app built with Next.js, TypeScript, and Tailwind CSS. It features responsive layouts, clear navigation flows, and deploy readiness on Vercel. I architected scalable UI components, focused on cohesive page transitions, and optimized the experience for desktop and mobile users.',
    tech: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Vercel'],
    liveUrl: 'https://diasporan.vercel.app/',
    githubUrl: 'https://github.com/elpresidentey/DIASPORAN.git'
  },
  {
    id: 'audiophile',
    name: 'Audiophile E-commerce Replica',
    oneLiner: 'A full-page e-commerce store replica inspired by Audiophile with component-based design.',
    blurb: 'This project is a replica of the Audiophile e-commerce store. Built with Next.js and Tailwind CSS, it focuses on reusable components, responsive grids, and visual hierarchy that feels like a real online store. Highlights include clean layout composition, UI consistency, and mobile-friendly breakpoints.',
    tech: ['Next.js', 'React', 'Tailwind CSS', 'Vercel'],
    liveUrl: 'https://hn-gaudiophilereplica.vercel.app/',
    githubUrl: 'https://github.com/elpresidentey/HNGaudiophilereplica.git'
  },
  {
    id: 'ticketmaster',
    name: 'TicketMaster Vue App',
    oneLiner: 'An event ticketing interface built with Vue.js to browse and select events.',
    blurb: 'The HNG TicketMaster Vue project is an event browsing app built with Vue.js and Tailwind CSS. It allows users to browse, filter, and view event details in a clean, responsive layout. The focus was on component design, structured state, and polished UI flows using Vue\'s reactive paradigms.',
    tech: ['Vue.js', 'Tailwind CSS', 'Vercel'],
    liveUrl: 'https://hngticketmastervue.vercel.app/',
    githubUrl: 'https://github.com/elpresidentey/HNGTICKETMASTERVUE.git'
  }
];

export default function Projects() {
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
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
    <section id="projects" className="py-20 bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div ref={sectionRef} className="max-w-6xl mx-auto">
        <div className={`text-center mb-16 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-700 ease-out`}>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Featured <span className="gradient-text">Projects</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A selection of my recent work showcasing frontend engineering skills and problem-solving abilities
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <div
              key={project.id}
              onMouseEnter={() => setHoveredProject(project.id)}
              onMouseLeave={() => setHoveredProject(null)}
              className={`bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition-all duration-200 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {project.name}
              </h3>

              <p className="text-gray-600 mb-4 leading-relaxed">
                {project.oneLiner}
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                {project.tech.map((tech, techIndex) => (
                  <span
                    key={techIndex}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              <div className="flex gap-4 pt-2">
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Live Demo
                </a>
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:border-gray-400 hover:text-gray-900 transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                  </svg>
                  GitHub
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
