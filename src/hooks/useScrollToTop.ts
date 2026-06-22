import { useState, useEffect } from 'react';

const SCROLL_THRESHOLD = 300;

export function useScrollToTop() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        // Only setState when the boolean actually flips — avoids re-renders on every scroll tick.
        setShowScrollTop((prev) => {
          const next = window.scrollY > SCROLL_THRESHOLD;
          return next === prev ? prev : next;
        });
        ticking = false;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return { showScrollTop, scrollToTop };
}
