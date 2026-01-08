import React from "react";
import LoadingScreen from "./LoadingScreen";

interface Template {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
}

interface CloneTemplateSectionProps {
  templates: Template[];
  loadingTemplates: boolean;
  onBackClick: () => void;
  onTemplateClick: (template: Template) => void;
}

const CloneTemplateSection: React.FC<CloneTemplateSectionProps> = ({
  templates,
  loadingTemplates,
  onBackClick,
  onTemplateClick,
}) => {
  // Template actions menu items
  const templateActions = [
    {
      id: 'clone',
      title: 'Clone Template',
      description: 'Browse and clone from existing templates',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      action: 'view-templates',
      available: true
    },
    {
      id: 'create',
      title: 'Create Template',
      description: 'Create a new template from scratch',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      action: 'create-template',
      available: false,
      comingSoon: true
    },
    {
      id: 'manage',
      title: 'Manage Templates',
      description: 'Edit and organize your templates',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      action: 'manage-templates',
      available: false,
      comingSoon: true
    },
    {
      id: 'import',
      title: 'Import Template',
      description: 'Import templates from external sources',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      ),
      action: 'import-template',
      available: false,
      comingSoon: true
    }
  ];

  const [showTemplateList, setShowTemplateList] = React.useState(false);

  const handleActionClick = (action: string) => {
    if (action === 'view-templates') {
      setShowTemplateList(true);
    }
    // Add more action handlers here
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                {showTemplateList ? (
                  <>
                    <span className="text-gray-500">Template Center</span>
                    <span className="text-gray-400 mx-2">/</span>
                    <span>Templates</span>
                  </>
                ) : (
                  'Template Center'
                )}
              </h1>
              {!showTemplateList && (
                <p className="text-xs text-gray-500">Everything you need to manage your templates</p>
              )}
            </div>
            <button
              onClick={showTemplateList ? () => setShowTemplateList(false) : onBackClick}
              className="hover:opacity-80 transition-opacity"
            >
              <img 
                src="/icons/back.png" 
                alt="Back" 
                className="w-6 h-6"
              />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showTemplateList ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2">
              {/* Template Actions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {templateActions.map((action) => (
                <div
                  key={action.id}
                  onClick={() => action.available && handleActionClick(action.action)}
                  className={`bg-white border border-gray-200 p-6 transition-all shadow-sm ${
                    action.available 
                      ? 'cursor-pointer hover:bg-gray-50 hover:border-gray-300 hover:shadow-md' 
                      : 'opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-3 rounded-lg ${
                        action.available ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {action.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900">{action.title}</h3>
                          {action.comingSoon && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                              Coming Soon
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mt-1">{action.description}</p>
                      </div>
                    </div>
                    {action.available && (
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
                      <p className="text-gray-600 text-sm">Available Templates</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">0</p>
                      <p className="text-gray-600 text-sm">Recently Used</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">0</p>
                      <p className="text-gray-600 text-sm">Custom Templates</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Integrations */}
            <div className="lg:col-span-1">
              <div className="bg-slate-700 p-6 shadow-xl sticky top-8">
                {/* Integration Icons with dotted lines */}
                <div className="relative">
                  {/* Dotted background pattern */}
                  <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                  }}></div>
                  
                  <div className="relative space-y-3 mb-8">
                    <div className="flex items-center justify-center">
                      <div className="bg-slate-700/50 backdrop-blur-sm rounded-lg px-4 py-2.5 hover:bg-slate-700/70 transition-colors cursor-pointer inline-flex items-center gap-2.5">
                        <div className="w-5 h-5 bg-white rounded flex items-center justify-center flex-shrink-0">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                            <path d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6ZM20 6L12 11L4 6H20ZM20 18H4V8L12 13L20 8V18Z" fill="#EA4335"/>
                          </svg>
                        </div>
                        <span className="text-white text-sm font-medium">Gmail</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end pr-8">
                      <div className="bg-slate-700/50 backdrop-blur-sm rounded-lg px-4 py-2.5 hover:bg-slate-700/70 transition-colors cursor-pointer inline-flex items-center gap-2.5">
                        <div className="w-5 h-5 bg-white rounded flex items-center justify-center flex-shrink-0">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                            <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="#5B6EAE"/>
                          </svg>
                        </div>
                        <span className="text-white text-sm font-medium">Microsoft Team</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-start pl-4">
                      <div className="bg-slate-700/50 backdrop-blur-sm rounded-lg px-4 py-2.5 hover:bg-slate-700/70 transition-colors cursor-pointer inline-flex items-center gap-2.5">
                        <div className="w-5 h-5 bg-white rounded flex items-center justify-center flex-shrink-0">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                            <path d="M19 4H5C3.9 4 3 4.9 3 6V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4ZM19 20H5V9H19V20Z" fill="#4285F4"/>
                          </svg>
                        </div>
                        <span className="text-white text-sm font-medium">Google Calendar</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center pr-12">
                      <div className="bg-slate-700/50 backdrop-blur-sm rounded-lg px-4 py-2.5 hover:bg-slate-700/70 transition-colors cursor-pointer inline-flex items-center gap-2.5">
                        <div className="w-5 h-5 bg-white rounded flex items-center justify-center flex-shrink-0">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" fill="#5865F2"/>
                          </svg>
                        </div>
                        <span className="text-white text-sm font-medium">Discord</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-start pl-12">
                      <div className="bg-slate-700/50 backdrop-blur-sm rounded-lg px-4 py-2.5 hover:bg-slate-700/70 transition-colors cursor-pointer inline-flex items-center gap-2.5">
                        <div className="w-5 h-5 bg-white rounded flex items-center justify-center flex-shrink-0">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                            <path d="M6 15C6 16.66 7.34 18 9 18H15C16.66 18 18 16.66 18 15V9C18 7.34 16.66 6 15 6H9C7.34 6 6 7.34 6 9V15Z" fill="#E01E5A"/>
                          </svg>
                        </div>
                        <span className="text-white text-sm font-medium">Slack</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end pr-4">
                      <div className="bg-slate-700/50 backdrop-blur-sm rounded-lg px-4 py-2.5 hover:bg-slate-700/70 transition-colors cursor-pointer inline-flex items-center gap-2.5">
                        <div className="w-5 h-5 bg-white rounded flex items-center justify-center flex-shrink-0">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" fill="#FF0000"/>
                          </svg>
                        </div>
                        <span className="text-white text-sm font-medium">Adobe Creative Cloud</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Integration Info */}
                <div className="pt-4 border-t border-slate-700/50 bg-white p-4 -mx-6 -mb-6">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Integrations
                  </h3>
                  <h2 className="text-lg font-bold text-gray-900 mb-2">
                    Connect your favorite tools
                  </h2>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    Curabitur auctor, ex quis auctor venenatis, eros arcu rhoncus massa.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Template List View - No separate back button, use header */}
            
            {loadingTemplates ? (
              <LoadingScreen message="Loading Templates" minimal />
            ) : templates.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
                <p className="text-gray-600 text-lg">No templates available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {templates.map((tpl) => (
                  <div
                    key={tpl._id || tpl.id}
                    onClick={() => onTemplateClick(tpl)}
                    className="bg-white border border-gray-200 rounded-xl p-5 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center gap-5">
                      {/* Template Icon */}
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                        </svg>
                      </div>

                      {/* Template Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                          {tpl.name}
                        </h3>
                        {tpl.description && (
                          <p className="text-gray-600 text-sm line-clamp-2">
                            {tpl.description}
                          </p>
                        )}
                      </div>

                      {/* Arrow Icon */}
                      <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CloneTemplateSection;
