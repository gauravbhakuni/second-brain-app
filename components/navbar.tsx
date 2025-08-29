"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FaShareAlt, FaPlus } from "react-icons/fa";

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  return (
    <nav className="flex items-center justify-between bg-sidebar border-b border-border px-6 py-3 shadow-sm">
      {/* Left: Menu Icon */}
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg hover:bg-muted hover:text-foreground transition-colors"
      >
        <Menu size={22} />
      </button>

      {/* Right: Actions */}
      <div className="flex gap-3">
        <Button
        className="bg-secondary"
          variant="outline"
        >
          <FaShareAlt size={14} />
          <span>Share Brain</span>
        </Button>

        <Button>
          <FaPlus size={14} />
          <span>Add Content</span>
        </Button>
      </div>
    </nav>
  );
}
