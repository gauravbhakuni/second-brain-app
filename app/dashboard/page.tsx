"use client";

import { useState } from "react";
import Sidebar from "@/components/sidebar";
import Navbar from "@/components/navbar";

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState("All Notes");

  // Simple mock content for each menu option
  const renderContent = () => {
    switch (activePage) {
      case "All Notes":
        return (
          <>
            <h1 className="text-2xl font-bold mb-6">All Notes</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 bg-card text-card-foreground rounded-xl shadow border border-border">
                Note 1
              </div>
              <div className="p-6 bg-card text-card-foreground rounded-xl shadow border border-border">
                Note 2
              </div>
              <div className="p-6 bg-card text-card-foreground rounded-xl shadow border border-border">
                Note 3
              </div>
            </div>
          </>
        );
      case "Tweets":
        return <h1 className="text-2xl font-bold">Tweets Section</h1>;
      case "Videos":
        return <h1 className="text-2xl font-bold">Videos Section</h1>;
      case "Documents":
        return <h1 className="text-2xl font-bold">Documents Section</h1>;
      case "Links":
        return <h1 className="text-2xl font-bold">Links Section</h1>;
      case "Tags":
        return <h1 className="text-2xl font-bold">Tags Section</h1>;
      default:
        return <h1 className="text-2xl font-bold">Welcome</h1>;
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
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
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
