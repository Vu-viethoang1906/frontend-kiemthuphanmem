import React from 'react';

interface SupportCenterProps {
  onClose: () => void;
}

const SupportCenter: React.FC<SupportCenterProps> = ({ onClose }) => {
  const supportCards = [
    {
      image: '/icons/projectcreate.jpg',
      title: 'How to Create Project',
      description: 'Guide to creating a new project, setting up boards, columns, and swimlanes. Manage members and project permissions.',
    },
    {
      image: '/icons/TaskManagement.avif',
      title: 'Task Management Guide',
      description: 'How to create, edit, and move tasks. Use tags, priorities, and assign tasks to team members. Track task progress.',
    },
    {
      image: '/icons/TeamCollaboration.jpeg',
      title: 'Team Collaboration',
      description: 'Work effectively with realtime updates, notifications, and comments. Share files and track team activity.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl mx-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close support center"
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Main Content */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-white">
          {/* Content */}
          <div className="relative px-12 py-16">
            {/* Header */}
            <div className="mb-12">
              <h1 className="text-5xl font-bold text-gray-900 mb-4">Support Center</h1>
              <p className="text-gray-600 text-lg max-w-2xl">
                A quick guide to using the project management system. Learn how to create projects, manage tasks, and collaborate with your team effectively.
              </p>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {supportCards.map((card, index) => (
                <div
                  key={index}
                  className="group relative bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105"
                >
                  {/* Image Header */}
                  <div className="w-full h-48 overflow-hidden">
                    <img 
                      src={card.image} 
                      alt={card.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Title */}
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                      {card.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {card.description}
                    </p>
                  </div>

                  {/* Hover Effect Border */}
                  <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-blue-500 transition-all duration-300" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportCenter;
