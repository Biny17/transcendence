import { useEffect, useState } from "react";

export default function OrientationGuard({ children }) {
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    const check = () => {
      const ua = navigator.userAgent;

      const isTablet = /iPad|Tablet|Android(?!.*Mobile)/i.test(ua);
      const isMobile = /Mobi|iPhone|Android/i.test(ua) && !isTablet;

      const isLandscape = window.innerWidth > window.innerHeight;

      setIsBlocked(isMobile && isLandscape);
    };

    check();

    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);

    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  if (isBlocked) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black text-white z-[9999] text-center">
        📱 Passe en mode portrait
      </div>
    );
  }

  return children;
}