"use client";

import React from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FaShareAlt, FaPlus, FaMoon, FaSun } from "react-icons/fa";
import { useTheme } from "next-themes";

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <nav className="flex items-center justify-between bg-sidebar border-b border-border px-4 sm:px-6 py-3 shadow-sm">
      {/* Left: Menu Icon */}
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg hover:bg-muted hover:text-foreground transition-colors"
      >
        <Menu size={22} />
      </button>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleTheme}
          className="relative"
        >
          {mounted &&
            (theme === "dark" ? (
              <FaMoon className="h-[1.1rem] w-[1.1rem]" />
            ) : (
              <FaSun className="h-[1.1rem] w-[1.1rem]" />
            ))}
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Share Button */}
        <Button
          className="bg-secondary"
          variant="outline"
          size="sm"
        >
          <FaShareAlt size={14} />
          <span className="hidden sm:inline ml-1">Share Brain</span>
        </Button>

        {/* Add Content Button */}
        <Button size="sm">
          <FaPlus size={14} />
          <span className="hidden sm:inline ml-1">Add Content</span>
        </Button>
      </div>
    </nav>
  );
}
