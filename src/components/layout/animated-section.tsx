"use client";

import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";
import * as React from "react";

type Direction = "up" | "down" | "left" | "right";
type Variant = "slide" | "fade";

type AnimatedSectionProps = {
  children: React.ReactNode;
  className?: string;
  as?: "section" | "div";
  direction?: Direction;
  delay?: number;
  variant?: Variant;
  rootMargin?: string;
  threshold?: number;
};

export function AnimatedSection({
  children,
  className,
  as: Tag = "section",
  direction = "up",
  delay = 0,
  variant = "slide",
  rootMargin = "0px 0px -10% 0px",
  threshold = 0.15,
}: AnimatedSectionProps) {
  const { ref, inView } = useInView<HTMLDivElement>({
    rootMargin,
    threshold,
    once: true,
  });

  let transformClass: string;

  if (variant === "fade") {
    transformClass = inView ? "opacity-100" : "opacity-0";
  } else {
    const initialTransform =
      direction === "up"
        ? "translate-y-8"
        : direction === "down"
          ? "-translate-y-8"
          : direction === "left"
            ? "translate-x-8"
            : " -translate-x-8";

    transformClass = inView
      ? "opacity-100 translate-x-0 translate-y-0"
      : `opacity-0 ${initialTransform}`;
  }

  return (
    <Tag
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out will-change-transform",
        transformClass,
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}


