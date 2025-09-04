"use client";

import { motion } from "framer-motion";
import { BsYoutube } from "react-icons/bs";
import { FaTwitter } from "react-icons/fa";
import {
  IoCloseSharp,
  IoDocumentTextSharp,
  IoLinkSharp,
  IoSettingsSharp,
} from "react-icons/io5";
import { FiHash } from "react-icons/fi";
import { BiSolidDashboard } from "react-icons/bi";
import { Logo } from "./logo";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activePage: string;
  setActivePage: (page: string) => void;
}

export default function Sidebar({
  isOpen,
  onClose,
  activePage,
  setActivePage,
}: SidebarProps) {
  const router = useRouter();
  const menuItems = [
    { label: "All Notes", icon: <BiSolidDashboard size={18} /> },
    { label: "Tweets", icon: <FaTwitter size={18} /> },
    { label: "Videos", icon: <BsYoutube size={18} /> },
    { label: "Documents", icon: <IoDocumentTextSharp size={18} /> },
    { label: "Links", icon: <IoLinkSharp size={18} /> },
    { label: "Tags", icon: <FiHash size={18} /> },
    { label: "Settings", icon: <IoSettingsSharp size={18} /> },
  ];

  const { data: session } = useSession();
  const avatarUrl = session?.user?.image || "https://www.gravatar.com/avatar/?d=mp";
  const name = session?.user?.name;

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fadeIn"
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 h-full w-64 
          bg-sidebar text-sidebar-foreground 
          border-r border-sidebar-border 
          z-50 p-6 shadow-lg"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition"
        >
          <IoCloseSharp size={20} />
        </button>

        <div className="mb-6 flex flex-col items-center">
          <Logo />
          {avatarUrl && (
            <Image
              width={16}
              height={16}
              src={avatarUrl}
              alt="User Avatar"
              className="w-16 h-16 rounded-full mt-6 border border-gray-300 object-cover"
              unoptimized
            />
          )}
          {name && (
            <div className="mt-2 text-base font-medium text-center truncate max-w-[10rem]">{name}</div>
          )}
        </div>

        <ul className="space-y-4">
          {menuItems.map((item) => (
            <li
              key={item.label}
              onClick={() => {
                setActivePage(item.label);
                onClose(); // Auto-close after click
              }}
              className={`flex items-center gap-3 cursor-pointer transition relative px-2 py-1 rounded-md
                ${
                  activePage === item.label
                    ? "text-sidebar-accent-foreground bg-sidebar-accent"
                    : "hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50"
                }`}
            >
              {item.icon} {item.label}
            </li>
          ))}
        </ul>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="mt-10 w-full py-2 rounded-md bg-red-500 text-white font-semibold hover:bg-red-600 transition"
        >
          Logout
        </button>
      </motion.aside>
    </>
  );
}
