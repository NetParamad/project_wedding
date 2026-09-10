"use client";

import { useRef, useEffect, type ReactNode } from "react";

export function Marquee({ children, speed = 1 }: { children: ReactNode; speed?: number }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    let raf: number;
    let isPaused = false;
    let x = 0;

    const pause = () => { isPaused = true; };
    const resume = () => { isPaused = false; };

    outer.addEventListener("mouseenter", pause);
    outer.addEventListener("mouseleave", resume);
    outer.addEventListener("touchstart", pause);
    outer.addEventListener("touchend", resume);

    let last = performance.now();
    function tick(now: number) {
      if (!inner) return;
      if (!isPaused) {
        x += (now - last) * 0.05 * speed;
        const half = inner.scrollWidth / 2;
        if (x >= half) x = 0;
        inner.style.transform = `translateX(${-x}px)`;
      }
      last = now;
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      outer.removeEventListener("mouseenter", pause);
      outer.removeEventListener("mouseleave", resume);
      outer.removeEventListener("touchstart", pause);
      outer.removeEventListener("touchend", resume);
    };
  }, [speed]);

  return (
    <div ref={outerRef} className="overflow-hidden">
      <div ref={innerRef} className="flex gap-6" style={{ willChange: 'transform' }}>
        {children}
      </div>
    </div>
  );
}
