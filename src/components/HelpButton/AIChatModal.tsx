import React, { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User } from "lucide-react";
import geminiService from "../../services/geminiService";
import { useAuth } from "../../auth/useKeycloak";
import "../../styles/AIChatModal.css";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIChatModal: React.FC<AIChatModalProps> = ({ isOpen, onClose }) => {
  const { userInfo } = useAuth();
  const [currentUserId, setCurrentUserId] = useState<string>("");
    const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello — I'm your AI assistant for the project management app. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Track current userId and reload chat when it changes
  useEffect(() => {
    const userId = localStorage.getItem("userId") || userInfo?.id || "guest";

    // Only reload if userId actually changed
    if (userId !== currentUserId) {
      setCurrentUserId(userId);

      const storageKey = `ai_chat_history_${userId}`;
      const savedHistory = localStorage.getItem(storageKey);

          if (savedHistory) {
        try {
          const parsed = JSON.parse(savedHistory);
          const messagesWithDates = parsed.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }));
          setMessages(messagesWithDates);
        } catch (error) {
          console.warn("Error loading chat history:", error);
        }
      } else {
        // Get user name for personalized greeting
        const userInfoData = localStorage.getItem("userInfo");
        let userName = "bạn";
          if (userInfoData) {
          try {
            const parsed = JSON.parse(userInfoData);
            userName =
              parsed.username ||
              parsed.name ||
              parsed.email?.split("@")[0] ||
              "bạn";
          } catch (e) {
            console.warn("Error parsing userInfo:", e);
          }
        }

        // Reset to initial message with personalized greeting
        setMessages([
          {
            id: "1",
            role: "assistant",
            content: `Hello — I'm your AI assistant for the project management app. How can I help you today?`,
            timestamp: new Date(),
          },
        ]);
      }
    }
  }, [userInfo, currentUserId, isOpen]);

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    if (currentUserId) {
      const storageKey = `ai_chat_history_${currentUserId}`;
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, currentUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

      try {
      // Call Gemini AI service
      const aiResponse = await geminiService.chat(
        input.trim(),
        messages.map((m) => ({ role: m.role, content: m.content }))
      );

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.warn("Error sending message:", error);
      console.warn("Full error object:", JSON.stringify(error, null, 2));
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          error?.message || "Sorry, an error occurred. Please try again later.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`ai-chat-overlay ${isOpen ? "open" : ""}`}>
      <div className="ai-chat-modal">
        {/* Header */}
        <div className="ai-chat-header">
          <div className="ai-chat-header-content">
            <img
              src="/icons/g2.jpg"
              alt="AI"
              style={{ width: "40px", height: "40px", borderRadius: "50%" }}
            />
            <div>
              <h3>AI Assistant</h3>
                <p>Project Assistant</p>
            </div>
          </div>
          <button onClick={onClose} className="ai-chat-close-btn">
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="ai-chat-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`ai-chat-message ${
                message.role === "user" ? "user-message" : "assistant-message"
              }`}
            >
              <div className="message-avatar">
                {message.role === "user" ? (
                  <User size={20} />
                ) : (
                  <img
                    src="/icons/g2.jpg"
                    alt="AI"
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                    }}
                  />
                )}
              </div>
              <div className="message-content">
                <p>{message.content}</p>
                <span className="message-time">
                  {message.timestamp.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="ai-chat-message assistant-message">
              <div className="message-avatar">
                <img
                  src="/icons/g2.png"
                  alt="AI"
                  style={{ width: "40px", height: "40px", borderRadius: "50%" }}
                />
              </div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="ai-chat-input-container">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your question..."
            className="ai-chat-input"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="ai-chat-send-btn"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatModal;
