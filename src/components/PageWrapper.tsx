import React from "react";
import { motion } from "framer-motion";

interface Props {
  children: React.ReactNode;
}

const PageWrapper: React.FC<Props> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4 }}
      style={{ height: "100%" }}
    >
      {children}
    </motion.div>
  );
};

export default PageWrapper;
