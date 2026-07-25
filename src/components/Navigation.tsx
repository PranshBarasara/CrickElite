"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Key, LogOut, LayoutDashboard, Menu, X, Check, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navigation() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Form states
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [activeUser, setActiveUser] = useState("Admin");

  useEffect(() => {
    const auth = localStorage.getItem("pranscric_auth_token");
    if (auth === "authorized_elite") {
      setIsLoggedIn(true);
      setActiveUser(localStorage.getItem("pranscric_active_user") || "Admin");
    }
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      (userId === "CrickElite" && password === "180726") ||
      (userId === "DDUGroundCricket" && password === "DDIT@2026")
    ) {
      localStorage.setItem("pranscric_auth_token", "authorized_elite");
      localStorage.setItem("pranscric_active_user", userId);
      setIsLoggedIn(true);
      setActiveUser(userId);
      setShowLoginModal(false);
      setErrorMsg("");
      setUserId("");
      setPassword("");
      // Force reload to update active views
      window.dispatchEvent(new Event("storage"));
      window.location.reload();
    } else {
      setErrorMsg("Invalid credentials. Please check details.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("pranscric_auth_token");
    localStorage.removeItem("pranscric_active_user");
    setIsLoggedIn(false);
    // Redirect to home
    window.location.href = "/";
  };

  const loggedInLinks = [
    { href: "/", label: "Home" },
    { href: "/scorer", label: "Live Scorer" },
    { href: "/tournament/create", label: "Create League" }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#050505]/75 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-yellow-600 text-black font-space font-extrabold text-lg shadow-[0_0_15px_rgba(212,175,55,0.3)] group-hover:scale-105 transition-all duration-300">
              C
            </span>
            <span className="font-space text-lg font-bold tracking-tight text-white group-hover:text-gold transition-colors duration-300">
              CRICK<span className="text-gold font-light">ELITE</span>
            </span>
          </Link>

          {/* Center Links (Authenticated Only) */}
          <div className="hidden md:flex items-center gap-6">
            {isLoggedIn && loggedInLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all duration-300 ${
                    isActive
                      ? "bg-gold text-black shadow-[0_0_15px_rgba(212,175,55,0.25)] font-bold"
                      : "text-text-secondary hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right Action buttons */}
          <div className="hidden md:flex items-center gap-4">
            {!isLoggedIn ? (
              <button
                onClick={() => setShowLoginModal(true)}
                className="bg-gradient-to-r from-gold to-yellow-600 text-black px-6 py-2 rounded-[100px] text-xs font-bold font-space uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-gold/5"
              >
                <Key className="h-3.5 w-3.5" /> Login Console
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase font-mono bg-gold/10 text-gold border border-gold/10 px-2.5 py-0.5 rounded-full">
                  {activeUser} Active
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-white/5 border border-white/10 text-xs px-4 py-2 rounded-full hover:bg-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" /> Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-2">
            {isLoggedIn ? (
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-text-secondary hover:text-white focus:outline-none"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="bg-gold text-black px-4 py-1.5 rounded-full text-xs font-bold font-space uppercase tracking-wider active:scale-95"
              >
                Login
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Mobile Drawer (Authenticated Only) */}
      {isOpen && isLoggedIn && (
        <div className="md:hidden border-t border-white/5 bg-[#050505] px-4 py-4 space-y-4">
          <div className="flex flex-col gap-2">
            {loggedInLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 block ${
                    isActive
                      ? "bg-gold text-black shadow-md"
                      : "text-text-secondary hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="border-t border-white/5 pt-4">
            <button
              onClick={() => {
                setIsOpen(false);
                handleLogout();
              }}
              className="w-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-2xl py-2.5 font-bold uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      )}

      {/* LOGIN MODAL */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0B0C10] border border-white/10 shadow-2xl relative max-w-[360px] w-full p-6 md:p-8 rounded-[28px] overflow-hidden"
            >
              {/* Top-right close button */}
              <button
                type="button"
                onClick={() => {
                  setShowLoginModal(false);
                  setErrorMsg("");
                }}
                className="absolute top-4 right-4 p-1.5 text-text-secondary hover:text-white rounded-full hover:bg-white/5 transition-all cursor-pointer z-10"
                aria-label="Close login console"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              {/* Decorative accent */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full blur-2xl pointer-events-none" />

              <div className="text-center mb-6 pt-2">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/10 border border-gold/10 text-gold mb-3">
                  <Shield className="h-5.5 w-5.5" />
                </span>
                <h3 className="font-space text-lg font-bold text-white tracking-wide">Console Authorization</h3>
                <p className="text-[10px] text-text-secondary mt-1.5 uppercase tracking-wider">
                  Access live scoring & organizer panels
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl p-3 flex gap-2 items-center">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[9px] uppercase font-mono tracking-wider text-text-secondary mb-1.5">
                    User ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter User ID"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/20 focus:border-gold/50 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[9px] uppercase font-mono tracking-wider text-text-secondary mb-1.5">
                    Security Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter Security Code"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/20 focus:border-gold/50 outline-none transition-colors"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLoginModal(false);
                      setErrorMsg("");
                    }}
                    className="flex-1 bg-white/5 border border-white/10 rounded-full py-2.5 text-xs font-bold hover:bg-white/10 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-gold to-yellow-600 text-black rounded-full py-2.5 text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-md shadow-gold/5 cursor-pointer"
                  >
                    Authenticate
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}
