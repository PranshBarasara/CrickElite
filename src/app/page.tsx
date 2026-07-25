"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Calendar, History, ArrowRight, Play, Trophy, Users, Shield, Plus, Trash2 } from "lucide-react";
import StadiumBackground from "@/components/background/StadiumBackground";
import Navigation from "@/components/Navigation";
import Loader from "@/components/loader/Loader";
import { getMatches, getTournaments, deleteMatch } from "@/lib/mockData";
import { MatchState, ballsToOvers } from "@/lib/scorerEngine";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<MatchState[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Helper to get local date string YYYY-MM-DD
  const getLocalDateString = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - (offset * 60 * 1000));
    return local.toISOString().split("T")[0];
  };

  const loadLocalData = () => {
    setMatches(getMatches());
    const auth = localStorage.getItem("pranscric_auth_token");
    setIsLoggedIn(auth === "authorized_elite");
  };

  const handleDeleteCompletedMatch = (matchId: string) => {
    if (confirm("Are you sure you want to delete this completed match record? This action cannot be undone.")) {
      deleteMatch(matchId);
      loadLocalData();
    }
  };

  useEffect(() => {
    loadLocalData();

    // Listen to local storage changes to keep UI synchronized in real-time
    const handleStorage = () => {
      loadLocalData();
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Filter matches by status
  const liveMatches = matches.filter((m) => m.status === "live");
  const upcomingMatches = matches.filter((m) => m.status === "scheduled");
  const pastMatches = matches.filter((m) => m.status === "completed");

  if (loading) {
    return <Loader onComplete={() => setLoading(false)} />;
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden font-inter text-white">
      <StadiumBackground />
      <Navigation />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 md:py-20 flex flex-col items-center">
        {/* HERO HEADER */}
        <div className="text-center max-w-4xl mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-space text-5xl md:text-7xl font-bold tracking-tight leading-none mb-6 text-white"
          >
            Create Tournaments.<br />
            <span className="bg-gradient-to-r from-gold via-blue to-green bg-clip-text text-transparent">
              Manage Live Scores.
            </span><br />
            Broadcast Every Ball.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="text-text-secondary text-sm md:text-lg tracking-wide font-light leading-relaxed max-w-2xl mx-auto"
          >
            The future of digital cricket management. Experience a premium sports-broadcast dashboard combined with automated bracket makers and professional scorer controls.
          </motion.p>

          {isLoggedIn && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-8 flex justify-center"
            >
              <Link
                href="/tournament/create"
                className="bg-gradient-to-r from-gold to-yellow-600 text-black px-6 py-2.5 rounded-full text-xs font-bold font-space uppercase tracking-wider flex items-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-gold/10"
              >
                <Plus className="h-4 w-4 stroke-[3]" /> Create New League / Tournament
              </Link>
            </motion.div>
          )}
        </div>

        {/* MATCHES SECTION GRID */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8 border-t border-white/5 pt-12">
          
          {/* COLUMN 1: LIVE MATCHES */}
          <div className="space-y-6">
            <h2 className="font-space text-lg font-bold tracking-wider uppercase text-red-400 flex items-center gap-2 pb-2 border-b border-white/5">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              Live Broadcasts
            </h2>

            <div className="space-y-4">
              {liveMatches.length === 0 ? (
                <div className="glass p-8 rounded-[22px] border border-white/5 text-center text-xs text-text-secondary">
                  No matches currently live.
                </div>
              ) : (
                liveMatches.map((m) => {
                  const runs = m.currentInningsNumber === 1 ? m.firstInnings.runs : m.secondInnings?.runs || 0;
                  const wickets = m.currentInningsNumber === 1 ? m.firstInnings.wickets : m.secondInnings?.wickets || 0;
                  const balls = m.currentInningsNumber === 1 ? m.firstInnings.ballsBowled : m.secondInnings?.ballsBowled || 0;
                  const teamName = m.currentInningsNumber === 1 ? m.firstInnings.teamName : m.secondInnings?.teamName || "";

                  return (
                    <div
                      key={m.matchId}
                      className="glass p-6 rounded-[22px] border border-red-500/25 hover:border-red-500/40 transition-colors shadow-lg hover:shadow-red-500/5"
                    >
                      <div className="flex justify-between items-center mb-4 text-[9px] font-mono text-text-secondary">
                        <span>LIVE STREAM</span>
                        <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-bold uppercase animate-pulse">
                          Innings {m.currentInningsNumber}
                        </span>
                      </div>

                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h4 className="font-space font-bold text-sm text-white mb-1">{m.team1Name}</h4>
                          <h4 className="font-space font-bold text-sm text-white">{m.team2Name}</h4>
                        </div>
                        <div className="text-right">
                          <span className="font-orbitron font-extrabold text-2xl text-gold tracking-tight">
                            {runs}/{wickets}
                          </span>
                          <span className="block text-[10px] text-text-secondary mt-1 font-mono">
                            {ballsToOvers(balls)} Overs
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link
                          href={`/watch?matchId=${m.matchId}`}
                          className="w-full bg-gradient-to-r from-red-500 to-rose-600 text-white text-center py-2.5 rounded-full text-[10px] font-bold font-space uppercase tracking-wider hover:opacity-95 transition-opacity"
                        >
                          Tune In Live
                        </Link>
                        {isLoggedIn && (
                          <Link
                            href={`/scorer?matchId=${m.matchId}`}
                            className="bg-white/5 border border-white/10 hover:bg-white/10 p-2 rounded-full flex items-center justify-center"
                            title="Open Scorer Console"
                          >
                            <Shield className="h-4.5 w-4.5 text-gold" />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUMN 2: UPCOMING MATCHES */}
          <div className="space-y-6">
            <h2 className="font-space text-lg font-bold tracking-wider uppercase text-blue flex items-center gap-2 pb-2 border-b border-white/5">
              <Calendar className="h-4.5 w-4.5 text-blue" /> Scheduled Fixtures
            </h2>

            <div className="space-y-4">
              {upcomingMatches.length === 0 ? (
                <div className="glass p-8 rounded-[22px] border border-white/5 text-center text-xs text-text-secondary">
                  No fixtures scheduled.
                </div>
              ) : (
                upcomingMatches.map((m) => (
                  <div
                    key={m.matchId}
                    className="glass p-6 rounded-[22px] border border-white/5 hover:border-blue/20 transition-colors"
                  >
                    <div className="text-[9px] font-mono text-text-secondary uppercase mb-3">
                      Match Session: {m.matchId}
                    </div>

                    <h4 className="font-space font-bold text-sm text-white mb-1">
                      {m.team1Name} <span className="text-text-secondary text-xs font-light">vs</span> {m.team2Name}
                    </h4>
                    <p className="text-[10px] text-text-secondary font-mono mt-2">
                      Ground: {m.ground || "TBD"}
                    </p>
                    <p className="text-[10px] text-text-secondary font-mono mt-1">
                      Schedule: {m.matchDate || "TBD"} @ {m.matchTime || "TBD"}
                    </p>

                    {isLoggedIn && (() => {
                      const todayStr = getLocalDateString();
                      const isStartable = todayStr >= (m.matchDate || "");
                      if (isStartable) {
                        return (
                          <Link
                            href={`/scorer?matchId=${m.matchId}`}
                            className="mt-5 w-full bg-blue/10 border border-blue/20 hover:bg-blue/20 text-blue text-center py-2 rounded-full text-[10px] font-bold font-space uppercase tracking-wider block transition-colors"
                          >
                            Start Scoring Console
                          </Link>
                        );
                      } else {
                        return (
                          <span
                            className="mt-5 w-full bg-white/5 border border-white/5 text-white/30 text-center py-2 rounded-full text-[9px] font-bold font-space uppercase tracking-wider block cursor-not-allowed"
                            title={`Locked: Can only start on scheduled date (${m.matchDate})`}
                          >
                            🔒 Locked
                          </span>
                        );
                      }
                    })()}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* COLUMN 3: PAST MATCHES */}
          <div className="space-y-6">
            <h2 className="font-space text-lg font-bold tracking-wider uppercase text-green flex items-center gap-2 pb-2 border-b border-white/5">
              <History className="h-4.5 w-4.5 text-green" /> Completed Results
            </h2>

            <div className="space-y-4">
              {pastMatches.length === 0 ? (
                <div className="glass p-8 rounded-[22px] border border-white/5 text-center text-xs text-text-secondary">
                  No match records logged.
                </div>
              ) : (
                pastMatches.map((m) => (
                  <div
                    key={m.matchId}
                    className="glass p-6 rounded-[22px] border border-white/5 hover:border-green/20 transition-colors"
                  >
                    <div className="flex justify-between items-center text-[9px] font-mono text-text-secondary mb-3">
                      <span>COMPLETED</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.25 rounded">
                          RESULT
                        </span>
                        {isLoggedIn && (
                          <button
                            onClick={() => handleDeleteCompletedMatch(m.matchId)}
                            className="p-1 text-red-400 hover:text-white rounded hover:bg-white/5 transition-all cursor-pointer"
                            title="Delete Completed Match"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-white">{m.team1Name}</span>
                        <span className="font-mono text-gold">{m.firstInnings.runs}/{m.firstInnings.wickets}</span>
                      </div>
                      {m.secondInnings && (
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-white">{m.team2Name}</span>
                          <span className="font-mono text-gold">{m.secondInnings.runs}/{m.secondInnings.wickets}</span>
                        </div>
                      )}
                    </div>

                    {m.winnerName && (
                      <div className="border-t border-white/5 pt-3 mt-3 flex items-center gap-2 text-[10px] text-green font-bold uppercase tracking-wider font-space">
                        <Trophy className="h-3.5 w-3.5" /> Winner: {m.winnerName}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </main>

      <footer className="border-t border-white/5 py-8 text-center bg-[#050505] z-10 text-[10px] uppercase tracking-widest text-text-secondary font-mono">
        © {new Date().getFullYear()} CrickElite. All Rights Reserved. Created by deepmind.
      </footer>
    </div>
  );
}
