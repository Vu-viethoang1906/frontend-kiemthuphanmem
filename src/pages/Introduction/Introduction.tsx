import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Introduction: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  
  const handleGetStarted = () => {
    setShowModal(true);
  };

  const handleContinue = () => {
    setShowModal(false);
    const isAdmin = location.pathname.startsWith('/admin');
    const projectsPath = isAdmin ? '/admin/projects?action=clone-template' : '/dashboard/projects?action=clone-template';
    navigate(projectsPath);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 px-6 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              We're changing the way people connect
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Cupidatat minim id magna ipsum sint dolor qui. Sunt sit in quis cupidatat mollit 
              qute velit. Et labore commodo nulla aliqua proident mollit ullamco exercitation 
              tempor. Sint aliqua anim nulla sunt mollit id pariatur in voluptate cillum. 
              Eu voluptate tempor esse minim amet fugiat veniam occaecat aliqua.
            </p>
            
            {/* Stats or Features */}
            <div className="grid grid-cols-2 gap-6 pt-8">
              <div className="space-y-2">
                <h3 className="text-4xl font-bold text-indigo-600">10K+</h3>
                <p className="text-gray-600">Active Users</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-4xl font-bold text-indigo-600">50+</h3>
                <p className="text-gray-600">Team Members</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-4xl font-bold text-indigo-600">99%</h3>
                <p className="text-gray-600">Satisfaction</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-4xl font-bold text-indigo-600">24/7</h3>
                <p className="text-gray-600">Support</p>
              </div>
            </div>

            {/* Get Started Button - Below Stats */}
            <div className="pt-6">
              <button 
                onClick={handleGetStarted}
                className="px-8 py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Get Started Today
              </button>
            </div>
          </div>

          {/* Right Image Grid - Masonry Layout */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-4 auto-rows-auto">
              {/* Column 1 */}
              <div className="space-y-4">
                {/* Image 1 - Tall */}
                <div className="overflow-hidden rounded-2xl shadow-lg">
                  <img
                    src="/icons/team.jpg"
                    alt="Team collaboration"
                    className="w-full h-80 object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                
                {/* Image 4 - Medium */}
                <div className="overflow-hidden rounded-2xl shadow-lg">
                  <img
                    src="/icons/g3.jpg"
                    alt="Office environment"
                    className="w-full h-56 object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-4">
                {/* Image 2 - Small */}
                <div className="overflow-hidden rounded-2xl shadow-lg">
                  <img
                    src="/icons/g1.jpg"
                    alt="Working together"
                    className="w-full h-40 object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                
                {/* Image 3 - Tall */}
                <div className="overflow-hidden rounded-2xl shadow-lg">
                  <img
                    src="/icons/g2.jpg"
                    alt="Creative workspace"
                    className="w-full h-72 object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                
                {/* Image 5 - Medium */}
                <div className="overflow-hidden rounded-2xl shadow-lg">
                  <img
                    src="/icons/g4.jpg"
                    alt="Team meeting"
                    className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Section - Our Mission */}
        <div className="mt-24 bg-white rounded-3xl shadow-xl p-12">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-4xl font-bold text-gray-900">Our Mission</h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              We believe in creating tools that empower teams to collaborate seamlessly, 
              innovate fearlessly, and achieve their goals together. Our platform is designed 
              to bring people closer, streamline workflows, and make project management 
              a delightful experience.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Fast & Efficient</h3>
                <p className="text-gray-600">
                  Lightning-fast performance to keep your team productive
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Secure & Private</h3>
                <p className="text-gray-600">
                  Your data is protected with enterprise-grade security
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Team Collaboration</h3>
                <p className="text-gray-600">
                  Built for teams of all sizes to work together
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="text-center py-8 px-6 border-b">
              <p className="text-indigo-600 font-semibold mb-2">Deploy faster</p>
              <h2 className="text-4xl font-bold text-gray-900">
                Everything you need<br />to deploy your app
              </h2>
            </div>

            {/* 3 Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8">
              {/* Card 1: Mobile friendly */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Mobile friendly</h3>
                <p className="text-gray-600 text-sm mb-6">
                  Anim aute id magna aliqua ad ad non deserunt sunt. Qui irure qui lorem cupidatat commodo.
                </p>
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 h-64 flex items-center justify-center">
                  <div className="bg-gray-700 rounded-lg w-48 h-56 shadow-xl flex flex-col">
                    <div className="bg-gray-800 p-3 rounded-t-lg flex items-center justify-between">
                      <span className="text-gray-400 text-xs">9:41</span>
                      <div className="flex gap-1">
                        <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                        <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                        <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex-1 bg-gray-700 p-3 text-xs text-gray-300">
                      <div className="text-indigo-400 mb-2">📱 Mobile App</div>
                      <div className="space-y-1">
                        <div className="bg-gray-600 h-2 w-full rounded"></div>
                        <div className="bg-gray-600 h-2 w-3/4 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Performance */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Performance</h3>
                <p className="text-gray-600 text-sm mb-6">
                  Lorem ipsum, dolor sit amet consectetur adipisicing elit maiores impedit.
                </p>
                <div className="space-y-4">
                  <div className="flex items-end justify-between">
                    <span className="text-4xl font-bold text-indigo-600">1.04<span className="text-sm">s</span></span>
                    <span className="text-indigo-600 font-semibold">-22%</span>
                  </div>
                  <div className="flex items-end gap-1 h-32">
                    {[...Array(30)].map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-indigo-400 rounded-t"
                        style={{ height: `${Math.random() * 100}%` }}
                      ></div>
                    ))}
                  </div>
                </div>
                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 mb-2">Security</h4>
                  <p className="text-gray-600 text-sm">
                    Morbi viverra dui mi arcu sed. Tellus semper adipiscing suspendisse semper morbi.
                  </p>
                </div>
              </div>

              {/* Card 3: Powerful APIs */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Powerful APIs</h3>
                <p className="text-gray-600 text-sm mb-6">
                  Sit quis amet rutrum tellus ullamcorper ultricies libero dolor eget sem sodales gravida.
                </p>
                <div className="bg-gray-900 rounded-lg p-4 text-xs font-mono text-green-400 h-64 overflow-hidden">
                  <div className="flex gap-2 mb-3 border-b border-gray-700 pb-2">
                    <span className="text-gray-400">NotificationSetting.jsx</span>
                    <span className="text-gray-500">App.jsx</span>
                  </div>
                  <div className="space-y-1">
                    <div><span className="text-purple-400">import</span> {'{ useState }'} <span className="text-purple-400">from</span> <span className="text-yellow-400">"react"</span></div>
                    <div><span className="text-purple-400">import</span> {'{ Switch }'} <span className="text-purple-400">from</span> <span className="text-yellow-400">"@headlessui/react"</span></div>
                    <div className="mt-3"></div>
                    <div><span className="text-purple-400">function</span> <span className="text-blue-400">Example</span>() {'{'}</div>
                    <div className="pl-4"><span className="text-purple-400">const</span> [enabled, setEnabled] = <span className="text-blue-400">useState</span>(<span className="text-orange-400">true</span>)</div>
                    <div className="mt-2 pl-4"><span className="text-purple-400">return</span> (</div>
                    <div className="pl-8">{'<form action="/notification-settings" method="post">'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-center gap-4 p-6 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleContinue}
                className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Introduction;
