"use client";

import { useState, useMemo } from "react";
import Sidebar from "@/components/sidebar";
import Navbar from "@/components/navbar";
import Settings from "@/components/settings";
import AllNotes from "@/components/AllNotes";
import ChatAgent from "@/components/ChatAgent";
import CreateNotes from "@/components/CreateNotes";

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState("All Notes");

  // Memoize content so components don’t get remounted unnecessarily
  const renderedContent = useMemo(() => {
    switch (activePage) {
      case "All Notes":
        return <AllNotes key="notes" />;
      case "Create Notes":
        return <CreateNotes />;
      case "Ai Agent":
        return <ChatAgent />;
      case "Settings":
        return <Settings key="settings" />;
      default:
        return <h1 className="text-2xl font-bold">Welcome</h1>;
    }
  }, [activePage]);

  return (
    <div className="dashboard-layout flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activePage={activePage}
        setActivePage={setActivePage}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main
          className={`flex-1 p-6 transition-all duration-300 overflow-y-auto ${
            isSidebarOpen ? "blur-sm" : ""
          }`}
        >
          {renderedContent}
        </main>
      </div>
    </div>
  );
}
