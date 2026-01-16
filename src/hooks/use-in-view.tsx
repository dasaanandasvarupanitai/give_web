"use client";

import * as React from "react";

type UseInViewOptions = {
  rootMargin?: string;
  threshold?: number;
  once?: boolean;
};

export function useInView<T extends HTMLElement>({
  rootMargin = "0px 0px -10% 0px",
  threshold = 0.1,
  once = true,
}: UseInViewOptions = {}) {
  const ref = React.useRef<T | null>(null);
  const [inView, setInView] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (typeof IntersectionObserver === "undefined") {
      // Fallback: if observer is not supported, just show content
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) {
              observer.disconnect();
            }
          } else if (!once) {
            setInView(false);
          }
        });
      },
      { root: null, rootMargin, threshold }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [rootMargin, threshold, once]);

  return { ref, inView };
}


