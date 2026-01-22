const Projects = () => {
  const projects = [
    {
      name: "Diasporan",
      oneLiner: "A responsive travel exploration and booking app built with modern Next.js UI patterns.",
      blurb: "Diasporan is a travel experience web app built with Next.js, TypeScript, and Tailwind CSS. It features responsive layouts, clear navigation flows, and deploy readiness on Vercel. I architected scalable UI components, focused on cohesive page transitions, and optimized the experience for desktop and mobile users.",
      tech: ["Next.js", "TypeScript", "Tailwind CSS", "Vercel"],
      liveUrl: "https://diasporan.vercel.app/",
      githubUrl: "https://github.com/elpresidentey/DIASPORAN.git"
    },
    {
      name: "Audiophile E-commerce Replica",
      oneLiner: "A full-page e-commerce store replica inspired by Audiophile with component-based design.",
      blurb: "This project is a replica of the Audiophile e-commerce store. Built with Next.js and Tailwind CSS, it focuses on reusable components, responsive grids, and visual hierarchy that feels like a real online store. Highlights include clean layout composition, UI consistency, and mobile-friendly breakpoints.",
      tech: ["Next.js", "React", "Tailwind CSS", "Vercel"],
      liveUrl: "https://hn-gaudiophilereplica.vercel.app/",
      githubUrl: "https://github.com/elpresidentey/HNGaudiophilereplica.git"
    },
    {
      name: "TicketMaster Vue App",
      oneLiner: "An event ticketing interface built with Vue.js to browse and select events.",
      blurb: "The HNG TicketMaster Vue project is an event browsing app built with Vue.js and Tailwind CSS. It allows users to browse, filter, and view event details in a clean, responsive layout. The focus was on component design, structured state, and polished UI flows using Vue's reactive paradigms.",
      tech: ["Vue.js", "Tailwind CSS", "Vercel"],
      liveUrl: "https://hngticketmastervue.vercel.app/",
      githubUrl: "https://github.com/elpresidentey/HNGTICKETMASTERVUE.git"
    }
  ];

  return (
    <section id="projects" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">
          Projects
        </h2>
        
        <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          A selection of my recent work showcasing problem-solving skills and technical expertise
        </p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <div 
              key={project.name}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">{project.name}</h3>
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    {index + 1}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-4 font-medium">{project.oneLiner}</p>
                
                <p className="text-gray-700 text-sm mb-6 leading-relaxed">{project.blurb}</p>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  {project.tech.map((tech) => (
                    <span 
                      key={tech}
                      className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                
                <div className="flex gap-3">
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Live Demo
                  </a>
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors duration-200"
                  >
                    GitHub
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
