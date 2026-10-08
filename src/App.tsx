import { MotionConfig, motion, useScroll, useSpring } from "motion/react";
import { IconContext } from "@phosphor-icons/react";
import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { Marquee } from "./components/Marquee";
import { Manifesto } from "./components/Manifesto";
import { Events } from "./components/Events";
import { MapSection } from "./components/MapSection";
import { Space } from "./components/Space";
import { Footer } from "./components/Footer";
import { Intro, IntroProvider } from "./components/Intro";
import { FloatingTicket } from "./components/FloatingTicket";
import { GlassCursor } from "./components/GlassCursor";

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28 });
  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 h-[3px] origin-left bg-[linear-gradient(90deg,#7fe3ff,#b79cff,#ff7ad9,#ffcf7a)]"
      style={{ scaleX, zIndex: "var(--z-progress)" }}
    />
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <IconContext.Provider value={{ weight: "bold" }}>
        <IntroProvider>
          <Intro />
          <ScrollProgress />
          <Nav />
          <GlassCursor />
          <FloatingTicket />
          <main>
            <Hero />
            <Marquee />
            <Manifesto />
            <Events />
            <MapSection />
            <Space />
          </main>
          <Footer />
        </IntroProvider>
      </IconContext.Provider>
    </MotionConfig>
  );
}
