'use client';

import { useState, useEffect, useRef } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const mousePosition = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
    
    // Initialize particles
    const initialParticles: Particle[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: Math.random() * 4 + 2,
      opacity: Math.random() * 0.6 + 0.3
    }));
    setParticles(initialParticles);

    const handleMouseMove = (e: MouseEvent) => {
      mousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      setParticles(prevParticles => 
        prevParticles.map(particle => {
          const dx = mousePosition.current.x - particle.x;
          const dy = mousePosition.current.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDistance = 300;
          
          let newVx = particle.vx;
          let newVy = particle.vy;
          
          if (distance < maxDistance) {
            const force = (1 - distance / maxDistance) * 0.08;
            newVx += (dx / distance) * force;
            newVy += (dy / distance) * force;
          }
          
          // Apply less friction for more movement
          newVx *= 0.95;
          newVy *= 0.95;
          
          // Add some random movement
          newVx += (Math.random() - 0.5) * 0.1;
          newVy += (Math.random() - 0.5) * 0.1;
          
          // Update position
          let newX = particle.x + newVx;
          let newY = particle.y + newVy;
          
          // Bounce off edges
          if (newX < 0 || newX > window.innerWidth) {
            newVx = -newVx * 0.8;
            newX = Math.max(0, Math.min(window.innerWidth, newX));
          }
          if (newY < 0 || newY > window.innerHeight) {
            newVy = -newVy * 0.8;
            newY = Math.max(0, Math.min(window.innerHeight, newY));
          }
          
          return {
            ...particle,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy
          };
        })
      );
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="home" className="min-h-screen flex items-center justify-center bg-white px-4 sm:px-6 lg:px-8 pt-24 relative overflow-hidden">
      {/* Animated Particles */}
      <div ref={containerRef} className="absolute inset-0 pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-gray-400"
            style={{
              left: `${particle.x}px`,
              top: `${particle.y}px`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              transform: 'translate(-50%, -50%)',
              transition: 'none'
            }}
          />
        ))}
      </div>
      
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className={`space-y-8 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-700 ease-out`}>
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-gray-900 font-cabin">
              Frontend Engineer
              <span className="block text-2xl sm:text-3xl lg:text-4xl mt-4 font-normal text-gray-600 font-cabin">
                crafting digital experiences
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-cabin">
              I'm Iduwe Ekene Leonard, a developer focused on building accessible, 
              performant web applications with clean code and thoughtful design.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <button
              onClick={() => scrollToSection('projects')}
              className="px-8 py-3 bg-gray-900 text-white rounded-lg font-medium text-base hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
            >
              View my work
            </button>
            
            <button
              onClick={() => scrollToSection('contact')}
              className="px-8 py-3 bg-white text-gray-900 rounded-lg font-medium text-base border border-gray-300 hover:border-gray-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
            >
              Get in touch
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
