import Header from '@/components/Header';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Projects from '@/components/Projects';
import Skills from '@/components/Skills';
import Contact from '@/components/Contact';
import ClockWeather from '@/components/ClockWeather';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ClockWeather />
      <Header />
      <main>
        <section id="home">
          <Hero />
        </section>
        <About />
        <Projects />
        <Skills />
        <Contact />
      </main>
    </div>
  );
}
