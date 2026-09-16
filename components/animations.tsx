"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Staggered entrance for hero content.
 * Add `data-hero` to each element that should animate in sequence.
 * Add `data-hero-bg` to a background layer for a subtle parallax.
 */
export function HeroReveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) return;

    const items = el.querySelectorAll<HTMLElement>("[data-hero]");
    const bg = el.querySelector<HTMLElement>("[data-hero-bg]");
    const section = el.closest("section");
    const tweens: gsap.core.Tween[] = [];
    const triggers: ScrollTrigger[] = [];

    if (items.length > 0) {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(
        items,
        { y: 28, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.14 }
      );
      tweens.push(tl as unknown as gsap.core.Tween);
    }

    if (bg && section) {
      const tween = gsap.fromTo(
        bg,
        { yPercent: -8 },
        {
          yPercent: 8,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        }
      );
      tweens.push(tween);
      if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
    }

    return () => {
      tweens.forEach((t) => t.kill());
      triggers.forEach((t) => t.kill());
    };
  }, []);

  return (
    <div ref={ref} className="contents">
      {children}
    </div>
  );
}

/**
 * Single block fade-up when it scrolls into view.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) return;

    const tween = gsap.fromTo(
      el,
      { opacity: 0, y: 32 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "power3.out",
        delay,
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true,
        },
      }
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/**
 * Parent that staggers its children (marked with `data-reveal-item`)
 * as the group scrolls into view.
 */
export function RevealGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) return;

    const items = el.querySelectorAll<HTMLElement>("[data-reveal-item]");
    if (items.length === 0) return;

    gsap.set(items, { opacity: 0, y: 28 });

    const tween = gsap.to(items, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: "power3.out",
      stagger: 0.1,
      scrollTrigger: {
        trigger: el,
        start: "top 82%",
        once: true,
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}