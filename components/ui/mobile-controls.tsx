"use client";

import { useEffect, useState } from "react";

/**
 * Mobile Controls Component
 * Provides mobile-specific utilities and controls
 */

// Hook to detect if user is on mobile
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

// Hook to detect if running in a mobile webview
export function useIsWebView() {
  const [isWebView] = useState(() => {
    if (typeof window === "undefined") return false;
    const ua = navigator.userAgent.toLowerCase();
    return (
      ua.includes("wv") ||
      ua.includes("webview") ||
      (ua.includes("iphone") && !ua.includes("safari")) ||
      (ua.includes("android") && ua.includes("version"))
    );
  });

  return isWebView;
}

// Hook to handle safe area insets for notched devices
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    const updateSafeArea = () => {
      const style = getComputedStyle(document.documentElement);
      setSafeArea({
        top: parseInt(
          style.getPropertyValue("env(safe-area-inset-top)") || "0"
        ),
        right: parseInt(
          style.getPropertyValue("env(safe-area-inset-right)") || "0"
        ),
        bottom: parseInt(
          style.getPropertyValue("env(safe-area-inset-bottom)") || "0"
        ),
        left: parseInt(
          style.getPropertyValue("env(safe-area-inset-left)") || "0"
        ),
      });
    };

    updateSafeArea();
    window.addEventListener("resize", updateSafeArea);
    window.addEventListener("orientationchange", updateSafeArea);

    return () => {
      window.removeEventListener("resize", updateSafeArea);
      window.removeEventListener("orientationchange", updateSafeArea);
    };
  }, []);

  return safeArea;
}

// Component for haptic feedback on mobile
export function HapticButton({
  children,
  onClick,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Trigger haptic feedback if available
    if ("vibrate" in navigator) {
      navigator.vibrate(10); // 10ms vibration
    }

    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`active:scale-95 transition-transform ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// Pull to refresh component
export function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}) {
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const current = e.touches[0].clientY;
    setCurrentY(current);
  };

  const handleTouchEnd = async () => {
    const pullDistance = currentY - startY;

    if (pullDistance > 100 && !isRefreshing) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }

    setStartY(0);
    setCurrentY(0);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {isRefreshing && (
        <div className="absolute top-0 left-0 right-0 flex justify-center py-2 bg-primary/10">
          <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )}
      {children}
    </div>
  );
}

// Mobile-optimized scrollable container
export function MobileScrollContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-x-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent -webkit-overflow-scrolling-touch ${className}`}
    >
      {children}
    </div>
  );
}

// Bottom sheet component for mobile
export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom">
        <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-accent"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto max-h-[calc(90vh-4rem)] p-4">
          {children}
        </div>
      </div>
    </>
  );
}

// Floating action button for mobile
export function FloatingActionButton({
  onClick,
  icon,
  label,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center z-40"
      aria-label={label}
    >
      {icon}
    </button>
  );
}
