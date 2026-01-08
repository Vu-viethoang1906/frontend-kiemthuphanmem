import React, { useEffect, useState } from "react";
import { getUlrLogo } from "../api/logoApi";

interface SplashScreenProps {
  onComplete: () => void;
}

// Helper function to convert logo URL to full URL
const getFullLogoUrl = (url: string | null): string => {
  if (!url) return "/icons/ken.png";
  
  if (url.startsWith("http")) return url;
  
  const baseUrl = process.env.REACT_APP_SOCKET_URL 
    ? process.env.REACT_APP_SOCKET_URL.replace("/api", "")
    : "http://localhost:3005";
  
  if (url.startsWith("/api/uploads")) {
    return `${baseUrl}${url}`;
  } else if (url.startsWith("/uploads")) {
    return `${baseUrl}/api${url}`;
  } else {
    const cleanPath = url.startsWith("/") ? url : `/${url}`;
    return `${baseUrl}/api/uploads${cleanPath}`;
  }
};

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [fadeStarted, setFadeStarted] = useState(false);

  useEffect(() => {
    let fallbackTimer: NodeJS.Timeout;

    const loadLogo = async () => {
      try {
        const res = await getUlrLogo();
        if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
          setLogoUrl(res.data[0].url);
        }
      } catch (error) {
        console.error("Lỗi khi lấy logo:", error);
      } finally {
        // đảm bảo fade out bắt đầu dù API lỗi
        startFadeOut();
      }
    };

    const startFadeOut = () => {
      if (fadeStarted) return;
      setFadeStarted(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onComplete, 500);
      }, 2000); // hiển thị logo ít nhất 2s
      return timer;
    };

    loadLogo();

    // Fallback: nếu API quá lâu, vẫn fade out sau 3s
    fallbackTimer = setTimeout(() => {
      if (!fadeStarted) {
        setLogoUrl(""); // tránh null
        startFadeOut();
      }
    }, 3000);

    return () => clearTimeout(fallbackTimer);
  }, [fadeStarted, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-white transition-opacity duration-500 overflow-hidden ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="flex flex-col items-center">
        {logoUrl ? (
          <img
            src={getFullLogoUrl(logoUrl)}
            alt="Ken Logo"
            className="h-32 w-auto object-contain animate-scale-up"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/icons/ken.png";
            }}
          />
        ) : (
          <div className="h-32 w-32 bg-gray-200 rounded animate-pulse"></div>
        )}
      </div>

      <style>{`
        @keyframes scaleUp {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale-up { animation: scaleUp 1.5s ease-out; }
        .animate-pulse { animation: pulse 1.2s infinite; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
