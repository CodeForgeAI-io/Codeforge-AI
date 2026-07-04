"use client";

/**
 * Shared ReactBits building blocks used across the marketing/public pages so
 * the whole site shares one animated, glassy language. Heavy WebGL pieces are
 * lazy + WebGL-gated with a CSS fallback, so they never break a page.
 */

import { useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

import ShinyText from "@/components/reactbits/ShinyText";
import GradientText from "@/components/reactbits/GradientText";

const Aurora = dynamic(() => import("@/components/reactbits/Aurora"), { ssr: false });
const Particles = dynamic(() => import("@/components/reactbits/Particles"), { ssr: false });

export const RB_ACCENT = "#006bff";
export const RB_ACCENT_L = "#4d9bff";

/** True once we know the browser can create a WebGL context. */
export function useWebGL(): boolean {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      setOk(!!(c.getContext("webgl2") || c.getContext("webgl")));
    } catch {
      setOk(false);
    }
  }, []);
  return ok;
}

/** Animated aurora + particle backdrop for page headers. Absolutely
 *  positioned; drop it as the first child of a `relative` container. */
export function PageAura({ className, height = 460 }: { className?: string; height?: number }) {
  const webgl = useWebGL();
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-x-0 top-0 overflow-hidden", className)} style={{ height }}>
      <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(0,107,255,0.12),transparent)] dark:bg-[radial-gradient(60%_60%_at_50%_0%,rgba(0,107,255,0.20),transparent)]" />
      {webgl && (
        <>
          <div className="absolute inset-x-0 top-0 h-full opacity-40 dark:opacity-70">
            <Aurora colorStops={["#00224d", "#006bff", "#7cc4ff"]} amplitude={1.0} blend={0.55} speed={0.6} />
          </div>
          <div className="absolute inset-0">
            <Particles particleColors={[RB_ACCENT_L, "#ffffff"]} particleCount={90} particleSpread={12} speed={0.05} particleBaseSize={64} moveParticlesOnHover={false} alphaParticles disableRotation />
          </div>
        </>
      )}
    </div>
  );
}

/** Scroll-reveal wrapper (fade + rise). */
export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: [0.175, 0.885, 0.32, 1.1] }}
    >
      {children}
    </motion.div>
  );
}

/** A pill eyebrow with shimmering text. */
export function Eyebrow({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white/70 px-3.5 py-1 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05]">
      <span className="size-1.5 rounded-full" style={{ background: RB_ACCENT_L }} />
      <ShinyText text={children} speed={3.5} className="text-[12px] font-medium tracking-wide" />
    </span>
  );
}

/** A page hero: animated backdrop + eyebrow + gradient title + subtitle. */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative overflow-hidden", className)}>
      <PageAura />
      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-4 pt-16 text-center sm:pt-20">
        {eyebrow && (
          <Reveal>
            <Eyebrow>{eyebrow}</Eyebrow>
          </Reveal>
        )}
        <Reveal delay={0.05}>
          <h1 className="mt-5 text-balance text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">
            <GradientText colors={[RB_ACCENT_L, "#7cc4ff", "#9dbdf5", RB_ACCENT_L]} animationSpeed={7}>
              {title}
            </GradientText>
          </h1>
        </Reveal>
        {subtitle && (
          <Reveal delay={0.1}>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">{subtitle}</p>
          </Reveal>
        )}
        {children && <Reveal delay={0.15} className="mt-7">{children}</Reveal>}
      </div>
    </section>
  );
}
