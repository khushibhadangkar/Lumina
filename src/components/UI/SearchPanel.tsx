import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, X, Sparkles } from "lucide-react";

interface SearchPanelProps {
  onSearch: (query: string) => void;
  activeSearch: string;
  storyModeActive: boolean;
  setStoryModeActive: (active: boolean) => void;
  activeStoryId: string | null;
  onSelectStory: (storyId: string | null) => void;
  availableTopics?: string[];
}

const STORIES_LIST = [
  { id: "semiconductors", label: "Semiconductor Flow ✦" },
  { id: "lithium", label: "Lithium Supply Chain ✦" }
];

export const SearchPanel: React.FC<SearchPanelProps> = ({ 
  onSearch, 
  activeSearch,
  storyModeActive,
  setStoryModeActive,
  activeStoryId,
  onSelectStory,
  availableTopics = [
    "AI Engineers",
    "Semiconductors",
    "Lithium",
    "Energy",
    "Startups",
    "Data Centers",
    "Robotics",
    "Coffee",
    "Trade Routes"
  ]
}) => {
  const [inputValue, setInputValue] = useState(activeSearch);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(inputValue);
  };

  const handleSuggestionClick = (tag: string) => {
    setInputValue(tag);
    onSearch(tag);
  };

  const handleStoryClick = (storyId: string) => {
    onSelectStory(storyId);
  };

  const handleClear = () => {
    setInputValue("");
    onSearch("");
    if (activeStoryId) {
      onSelectStory(null);
    }
  };

  return (
    <motion.div
      className="search-wrapper"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      style={{
        position: "absolute",
        top: "40px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: "540px",
        zIndex: 100,
        pointerEvents: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0 16px",
      }}
    >
      {/* Spotlight Search Input */}
      <form
        onSubmit={handleSubmit}
        className="glass-panel"
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          padding: "8px 18px",
          border: isFocused ? "1px solid rgba(255, 255, 255, 0.16)" : "1px solid rgba(255, 255, 255, 0.06)",
          boxShadow: isFocused 
            ? "0 20px 40px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255,255,255,0.05)" 
            : "0 10px 30px rgba(0, 0, 0, 0.3)",
          borderRadius: "30px",
          transition: "all 0.3s ease",
        }}
      >
        <Search
          size={16}
          style={{ 
            marginRight: "10px", 
            color: "var(--text-secondary)",
            opacity: 0.7 
          }}
        />
        
        <input
          type="text"
          value={activeStoryId ? `Story: ${activeStoryId.toUpperCase()}` : inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={!!activeStoryId}
          placeholder="Search global layers..."
          style={{
            flex: 1,
            background: "none",
            border: "none",
            outline: "none",
            color: activeStoryId ? "var(--accent-gold)" : "var(--text-primary)",
            fontFamily: "var(--font-sans)",
            fontSize: "13.5px",
            letterSpacing: "0.02em",
            height: "28px",
          }}
        />

        {/* Story Mode Toggle */}
        <button
          type="button"
          onClick={() => {
            const nextActive = !storyModeActive;
            setStoryModeActive(nextActive);
            if (!nextActive) {
              onSelectStory(null);
            }
          }}
          style={{
            background: storyModeActive ? "rgba(207, 168, 100, 0.18)" : "rgba(255, 255, 255, 0.02)",
            border: storyModeActive ? "1px solid var(--accent-gold)" : "1px solid rgba(255, 255, 255, 0.08)",
            color: storyModeActive ? "var(--accent-gold)" : "var(--text-secondary)",
            borderRadius: "20px",
            padding: "4px 10px",
            fontSize: "10px",
            fontWeight: 500,
            cursor: "pointer",
            marginRight: "8px",
            transition: "all 0.2s ease",
            outline: "none",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}
        >
          <Sparkles size={11} />
          <span>Story Mode</span>
        </button>

        {(inputValue || activeStoryId) && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: "4px",
            }}
          >
            <X size={15} />
          </button>
        )}
      </form>

      {/* Suggestion list (changes based on storyModeActive) */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "6px",
          marginTop: "14px",
          width: "100%",
        }}
      >
        {storyModeActive ? (
          STORIES_LIST.map((story) => {
            const isSelected = activeStoryId === story.id;
            return (
              <motion.button
                key={story.id}
                type="button"
                onClick={() => handleStoryClick(story.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  background: isSelected ? "rgba(207, 168, 100, 0.15)" : "rgba(255, 255, 255, 0.02)",
                  border: isSelected ? "1px solid var(--accent-gold)" : "1px solid rgba(255, 255, 255, 0.04)",
                  color: isSelected ? "var(--accent-gold)" : "var(--text-secondary)",
                  borderRadius: "20px",
                  padding: "5px 12px",
                  fontSize: "10.5px",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  fontWeight: 500,
                  transition: "all 0.2s ease",
                  outline: "none",
                }}
              >
                {story.label}
              </motion.button>
            );
          })
        ) : (
          availableTopics.map((tag) => {
            const isSelected = activeSearch.toLowerCase() === tag.toLowerCase();
            return (
              <motion.button
                key={tag}
                type="button"
                onClick={() => handleSuggestionClick(tag)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  background: isSelected ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.02)",
                  border: isSelected ? "1px solid rgba(255, 255, 255, 0.25)" : "1px solid rgba(255, 255, 255, 0.04)",
                  color: isSelected ? "#ffffff" : "var(--text-secondary)",
                  borderRadius: "20px",
                  padding: "4px 10px",
                  fontSize: "10.5px",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  fontWeight: 400,
                  transition: "all 0.2s ease",
                  outline: "none",
                }}
              >
                {tag}
              </motion.button>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

export default SearchPanel;
