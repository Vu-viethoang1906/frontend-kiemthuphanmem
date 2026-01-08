import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export type ModalVariant = "info" | "success" | "error";

type ModalOptions = {
  title?: string;
  message: string;
  variant?: ModalVariant;
  onClose?: () => void;
};

type ConfirmOptions = Omit<ModalOptions, "onClose"> & {
  confirmText?: string;
  cancelText?: string;
};

type ModalContextValue = {
  show: (opts: ModalOptions) => void;
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
};

const ModalContext = createContext<ModalContextValue | undefined>(undefined);

export const useModal = () => {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used within ModalProvider");
  return ctx;
};

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [open, setOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [title, setTitle] = useState<string | undefined>(undefined);
  const [message, setMessage] = useState<string>("");
  const [variant, setVariant] = useState<ModalVariant>("info");
  const [onClose, setOnClose] = useState<(() => void) | undefined>(undefined);
  const [mode, setMode] = useState<"alert" | "confirm">("alert");
  const [resolver, setResolver] = useState<((v: boolean) => void) | null>(null);
  const [confirmText, setConfirmText] = useState<string | undefined>(undefined);
  const [cancelText, setCancelText] = useState<string | undefined>(undefined);

  const show = useCallback((opts: ModalOptions) => {
    setMode("alert");
    setTitle(opts.title);
    setMessage(opts.message);
    setVariant(opts.variant || "info");
    setOnClose(() => opts.onClose);
    setConfirmText(undefined);
    setCancelText(undefined);
    setOpen(true);
    setIsAnimating(true);
    // Trigger animation after DOM update
    setTimeout(() => {
      setIsAnimating(false);
    }, 10);
  }, []);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setMode("confirm");
      setTitle(opts.title);
      setMessage(opts.message);
      setVariant(opts.variant || "info");
      setConfirmText(
        opts.confirmText || "Confirm"
      );
      setCancelText(opts.cancelText || "Cancel")
      setResolver(() => resolve);
      setOpen(true);
      setIsAnimating(true);
      // Trigger animation after DOM update
      setTimeout(() => {
        setIsAnimating(false);
      }, 10);
    });
  }, []);

  const handleClose = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      if (mode === "confirm") {
        // default close for confirm acts like cancel
        if (resolver) resolver(false);
        setResolver(null);
        setOpen(false);
        setIsAnimating(false);
        return;
      }
      setOpen(false);
      setIsAnimating(false);
      const cb = onClose;
      setOnClose(undefined);
      if (cb) {
        try {
          cb();
        } catch {}
      }
    }, 200);
  }, [onClose, mode, resolver]);

  const handleConfirmOk = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      if (resolver) resolver(true);
      setResolver(null);
      setOpen(false);
      setIsAnimating(false);
    }, 200);
  }, [resolver]);

  const handleConfirmCancel = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      if (resolver) resolver(false);
      setResolver(null);
      setOpen(false);
      setIsAnimating(false);
    }, 200);
  }, [resolver]);

  const value = useMemo(() => ({ show, confirm }), [show, confirm]);

  return (
    <ModalContext.Provider value={value}>
      {children}

      {open && (
        <div 
          className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] transition-opacity duration-300 ease-out ${
            isAnimating ? 'opacity-0' : 'opacity-100'
          }`}
          role="dialog" 
          aria-modal="true"
          onClick={mode === "confirm" ? handleConfirmCancel : handleClose}
        >
          <div 
            className={`bg-white rounded-xl shadow-2xl max-w-md w-[90%] relative p-6 transition-all duration-300 ease-out ${
              isAnimating 
                ? 'opacity-0 scale-95 translate-y-2' 
                : 'opacity-100 scale-100 translate-y-0'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button X */}
            <button
              onClick={mode === "confirm" ? handleConfirmCancel : handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <span className="text-2xl leading-none">×</span>
            </button>

            {/* Header - only for alert mode */}
            {mode === "alert" && (
              <div className={`px-4 py-3 rounded-t-lg mb-4 ${
                variant === "error" 
                  ? "bg-red-600 text-white" 
                  : variant === "success" 
                  ? "bg-green-100 text-green-800" 
                  : "bg-blue-50 text-blue-900"
              }`}>
                <span className="font-bold">
                  {title ||
                    (variant === "error"
                      ? "Error"
                      : variant === "success"
                      ? "Success"
                      : "Notification")}
                </span>
              </div>
            )}

            {/* Body - Content centered */}
            <div className={mode === "confirm" ? "py-6 text-center" : "py-4 text-center"}>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words m-0 max-w-full overflow-wrap-anywhere">
                {message}
              </p>
            </div>

            {/* Footer - Buttons centered */}
            <div className="flex gap-3 justify-center mt-6">
              {mode === "confirm" ? (
                <>
                  <button
                    onClick={handleConfirmCancel}
                    className="flex-1 px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium cursor-pointer transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    {cancelText || "Cancel"}
                  </button>
                  <button
                    onClick={handleConfirmOk}
                    className="flex-1 px-6 py-2.5 rounded-lg text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-purple-300"
                  >
                    {confirmText || "Confirm"}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleClose}
                  className="px-8 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold cursor-pointer transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};

