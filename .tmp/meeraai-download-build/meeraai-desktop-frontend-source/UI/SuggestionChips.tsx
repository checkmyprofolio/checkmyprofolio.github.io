import React from "react";
import { motion } from "framer-motion";

export const SuggestionChips = ({ suggestions, onSelect }: { suggestions: string[]; onSelect: (s: string) => void }) => (
  <div className="copilot-suggestion-row">
    {suggestions.map((suggestion, index) => (
      <motion.button
        key={suggestion}
        className="copilot-suggestion-chip"
        type="button"
        initial={{ y: 6, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        whileHover={{ y: -1 }}
        onClick={() => onSelect(suggestion)}
      >
        {suggestion}
      </motion.button>
    ))}
  </div>
);
