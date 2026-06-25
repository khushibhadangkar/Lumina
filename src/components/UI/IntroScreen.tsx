import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface IntroScreenProps {
  onComplete: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 1200); // Trigger callback when exit animation finishes
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.6, ease: [0.25, 1, 0.5, 1] }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "#000000",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            pointerEvents: "none",
          }}
        >
          <motion.h1
            initial={{ opacity: 0, scale: 0.98, letterSpacing: "0.2em" }}
            animate={{ opacity: 0.65, scale: 1.0, letterSpacing: "0.4em" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.0, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 300,
              fontSize: "18px",
              color: "#ffffff",
              textTransform: "uppercase",
            }}
          >
            LUMINA
          </motion.h1>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IntroScreen;
