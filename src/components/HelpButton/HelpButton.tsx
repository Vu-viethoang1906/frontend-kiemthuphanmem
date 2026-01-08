import React, { useState } from "react";
import { HelpCircle, X } from "lucide-react";
import GuideModal from "./GuideModal";
import AIChatModal from "./AIChatModal";
import "../../styles/HelpButton.css";

const HelpButton: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  const menuItems = [
    { label: "Trợ lý AI", action: () => setIsAIChatOpen(true) },
    { label: "Hướng dẫn", action: () => setIsGuideModalOpen(true) },
  ];

  return (
    <>
      {/* Help Button */}
      <div className="help-button-container">
        {/* Menu Popup */}
        {isMenuOpen && (
          <div className="help-menu animate-slideUp">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  item.action();
                  setIsMenuOpen(false);
                }}
                className="help-menu-item"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        {/* Main Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="help-button"
          aria-label="Help"
        >
          {isMenuOpen ? <X /> : <HelpCircle />}
        </button>
      </div>

      {/* Guide Modal */}
      <GuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />

      {/* AI Chat Modal */}
      <AIChatModal
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
      />
    </>
  );
};

export default HelpButton;
