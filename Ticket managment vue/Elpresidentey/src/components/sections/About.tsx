const About = () => {
  return (
    <section id="about" className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
          About Me
        </h2>
        
        <div className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 leading-relaxed mb-6">
              I'm a frontend engineer passionate about building exceptional digital experiences 
              that combine beautiful design with robust functionality. My approach focuses on 
              creating maintainable, scalable applications that deliver real value to users.
            </p>
            
            <p className="text-gray-700 leading-relaxed mb-6">
              With expertise in modern JavaScript frameworks and responsive design principles, 
              I specialize in transforming complex requirements into clean, efficient code. 
              I believe in writing semantic HTML, accessible interfaces, and CSS that's both 
              performant and easy to maintain.
            </p>
            
            <p className="text-gray-700 leading-relaxed mb-8">
              I thrive in collaborative environments where I can contribute to technical decisions, 
              mentor junior developers, and continuously improve development processes. 
              My goal is always to ship products that users love and that are a joy to maintain.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="text-center">
                <div className="bg-blue-50 rounded-lg p-4 mb-3">
                  <svg className="w-8 h-8 mx-auto text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Clean Code</h3>
                <p className="text-sm text-gray-600">Writing maintainable, scalable code with best practices</p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-50 rounded-lg p-4 mb-3">
                  <svg className="w-8 h-8 mx-auto text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Accessibility</h3>
                <p className="text-sm text-gray-600">Building inclusive experiences for all users</p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-50 rounded-lg p-4 mb-3">
                  <svg className="w-8 h-8 mx-auto text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Performance</h3>
                <p className="text-sm text-gray-600">Optimizing for speed and user experience</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
