import React from "react";

interface LoadingScreenProps {
  message?: string;
  minimal?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = "Loading...",
  minimal = false,
}) => {
  return (
    <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-lg">
      <div className="text-center">
        {/* Spinner with blue gradient */}
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-indigo-600 rounded-full animate-spin"></div>
        </div>

        {/* Loading Text */}
        <div className="text-gray-700 text-lg font-semibold">
          {message}
        </div>
        <div className="text-gray-500 text-sm mt-2">
          Please wait...
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
