import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";

const TEXT =
  "A Glass é feita de luz, som e gente. Aqui a noite é transparente: tu vê a pista inteira dançando, e a pista inteira te vê.";
const WORDS = TEXT.split(" ");

function Word({ word, index, progress }: { word: string; index: number; progress: MotionValue<number> }) {
  const start = (index / WORDS.length) * 0.8;
  const end = start + 0.12;
  const opacity = useTransform(progress, [start, end], [0.16, 1]);
  const blur = useTransform(progress, [start, end], ["blur(5px)", "blur(0px)"]);
  return (
    <motion.span style={{ opacity, filter: blur }} className="mr-[0.28em] inline-block">
      {word}
    </motion.span>
  );
}

/** O texto "acende" palavra por palavra, como a luz atravessando o vidro, conforme se rola. */
export function Manifesto() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.55"] });
  return (
    <section ref={ref} className="relative mx-auto max-w-5xl px-5 py-28 md:px-8 md:py-44">
      <p className="mb-8 text-xs font-semibold uppercase tracking-[0.34em] text-ice">Sobre a casa</p>
      <p className="font-display text-[clamp(2.2rem,5.6vw,4.6rem)] font-light leading-[1.08]">
        {WORDS.map((w, i) => (
          <Word key={i} word={w} index={i} progress={scrollYProgress} />
        ))}
      </p>
    </section>
  );
}
