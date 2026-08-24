"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Calendar, History, ArrowRight, Play, Trophy, Users, Shield, Plus, Trash2, MapPin, X, Award } from "lucide-react";
import StadiumBackground from "@/components/background/StadiumBackground";
import Navigation from "@/components/Navigation";
import Loader from "@/components/loader/Loader";
import { getMatches, getTournaments, deleteMatch, MockTournament, getTeams } from "@/lib/mockData";
import { MatchState, ballsToOvers } from "@/lib/scorerEngine";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<MatchState[]>([]);
  const [tournaments, setTournaments] = useState<MockTournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedDetailMatch, setSelectedDetailMatch] = useState<MatchState | null>(null);
  const [detailTab, setDetailTab] = useState<"innings1" | "innings2">("innings1");
  const [showSquadsModal, setShowSquadsModal] = useState(false);
  const [selectedSquadTeamId, setSelectedSquadTeamId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedDetailMatch) {
      setDetailTab("innings1");
    }
  }, [selectedDetailMatch]);

  // Helper to get local date string YYYY-MM-DD
  const getLocalDateString = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - (offset * 60 * 1000));
    return local.toISOString().split("T")[0];
  };

  const loadLocalData = () => {
    setMatches(getMatches());
    const allTournaments = getTournaments();
    setTournaments(allTournaments);
    if (allTournaments.length > 0) {
      setSelectedTournamentId((prev) => prev || allTournaments[0].id);
    }
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

  // Filter matches by selected tournament
  const selectedTournament = tournaments.find((t) => t.id === selectedTournamentId);
  const filteredMatches = selectedTournament
    ? matches.filter((m) => selectedTournament.fixtures.some((f) => f.matchId === m.matchId))
    : [];

  const liveMatches = filteredMatches.filter((m) => m.status === "live");
  const upcomingMatches = filteredMatches.filter((m) => m.status === "scheduled");
  const pastMatches = filteredMatches.filter((m) => m.status === "completed");

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

        {/* TOURNAMENTS SELECTION PORTAL */}
        <div className="w-full mb-12 border-t border-white/5 pt-12">
          <h2 className="font-space text-lg font-bold tracking-wider uppercase text-white flex items-center gap-2 mb-6">
            <Trophy className="h-5 w-5 text-gold" /> Available Tournaments
          </h2>
          
          {tournaments.length === 0 ? (
            <div className="glass p-10 rounded-[22px] border border-white/5 text-center text-sm text-text-secondary">
              No tournaments are currently active or created. Click the button above to create one!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournaments.map((t) => {
                const isSelected = t.id === selectedTournamentId;
                const liveCount = t.fixtures.filter(f => f.status === "live").length;
                const completedCount = t.fixtures.filter(f => f.status === "completed").length;
                const scheduledCount = t.fixtures.filter(f => f.status === "scheduled").length;

                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTournamentId(t.id)}
                    className={`text-left p-6 rounded-[22px] border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between h-48 group ${
                      isSelected
                        ? "bg-white/5 border-gold shadow-lg shadow-gold/5 scale-[1.02]"
                        : "bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.04]"
                    }`}
                  >
                    {/* Glowing highlight for active selection */}
                    {isSelected && (
                      <div className="absolute -top-10 -right-10 w-24 h-24 bg-gold/10 rounded-full blur-2xl" />
                    )}
                    
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h3 className="font-space font-extrabold text-base text-white tracking-wide group-hover:text-gold transition-colors line-clamp-1">
                          {t.name}
                        </h3>
                        {liveCount > 0 && (
                          <span className="flex-shrink-0 flex items-center gap-1 bg-red-500/20 border border-red-500/30 px-2 py-0.5 rounded text-[8px] font-bold text-red-400 animate-pulse font-mono uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Live
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-1 text-[11px] text-text-secondary font-mono">
                        <p className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-text-secondary" /> Org: {t.organizer}
                        </p>
                        <p className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-text-secondary" /> {t.ground}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-white/5 pt-3 flex justify-between items-center text-[10px] text-text-secondary font-mono">
                      <span>Matches: {t.fixtures.length}</span>
                      <div className="flex gap-2">
                        {scheduledCount > 0 && <span className="text-blue">{scheduledCount} Sched</span>}
                        {completedCount > 0 && <span className="text-green">{completedCount} Fin</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Tournament Metadata & View Squads Button */}
        {selectedTournament && (
          <div className="w-full max-w-7xl mt-8 flex flex-col sm:flex-row justify-between items-center bg-white/[0.02] border border-white/5 p-5 rounded-2xl gap-4">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-gold block mb-1">
                Active Tournament Dashboard
              </span>
              <h2 className="font-space font-extrabold text-xl text-white">
                {selectedTournament.name}
              </h2>
            </div>
            <button
              onClick={() => {
                const tournamentTeams = getTeams().filter(t => selectedTournament.teams.includes(t.id));
                if (tournamentTeams.length > 0) {
                  setSelectedSquadTeamId(tournamentTeams[0].id);
                }
                setShowSquadsModal(true);
              }}
              className="bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-gold/20 px-6 py-3 rounded-full text-xs font-bold font-space uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95"
            >
              <Users className="h-4.5 w-4.5 text-gold" />
              View Tournament Squads
            </button>
          </div>
        )}

        {/* MATCHES SECTION GRID */}
        {selectedTournament && (
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
                  <button
                    key={m.matchId}
                    onClick={() => setSelectedDetailMatch(m)}
                    className="w-full text-left glass p-6 rounded-[22px] border border-white/5 hover:border-green/20 hover:bg-white/[0.02] transition-all cursor-pointer block relative overflow-hidden"
                  >
                    <div className="flex justify-between items-center text-[9px] font-mono text-text-secondary mb-3">
                      <span>COMPLETED</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.25 rounded">
                          RESULT
                        </span>
                        {isLoggedIn && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCompletedMatch(m.matchId);
                            }}
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
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
        )}

        {/* MATCH DETAIL SCORECARD MODAL */}
        <AnimatePresence>
          {selectedDetailMatch && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#0B0C10] border border-white/10 shadow-2xl relative max-w-4xl w-full p-6 md:p-8 rounded-[28px] overflow-hidden my-8"
              >
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setSelectedDetailMatch(null)}
                  className="absolute top-4 right-4 p-1.5 text-text-secondary hover:text-white rounded-full hover:bg-white/5 transition-all cursor-pointer z-10"
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 border border-gold/20 text-gold mb-3">
                    <Award className="h-5 w-5" />
                  </span>
                  <h3 className="font-space text-2xl font-bold text-white tracking-tight">
                    {selectedDetailMatch.team1Name} vs {selectedDetailMatch.team2Name}
                  </h3>
                  <p className="text-[10px] text-text-secondary mt-1.5 uppercase tracking-wider font-mono">
                    {selectedDetailMatch.matchCategory || "League Match"} • {selectedDetailMatch.ground} • {selectedDetailMatch.matchDate}
                  </p>
                  {selectedDetailMatch.winnerName && (
                    <div className="mt-3 inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-space font-bold uppercase text-[10px] tracking-wider px-4 py-1.5 rounded-full">
                      🏆 Winner: {selectedDetailMatch.winnerName}
                    </div>
                  )}
                </div>

                {/* Innings Tabs */}
                {selectedDetailMatch.secondInnings && (
                  <div className="flex gap-2 bg-white/5 p-1 rounded-xl mb-6 max-w-xs mx-auto">
                    <button
                      onClick={() => setDetailTab("innings1")}
                      className={`flex-1 text-center py-2 rounded-lg text-xs font-bold font-space uppercase transition-all cursor-pointer ${
                        detailTab === "innings1"
                          ? "bg-gold text-black shadow"
                          : "text-text-secondary hover:text-white"
                      }`}
                    >
                      {selectedDetailMatch.team1Name}
                    </button>
                    <button
                      onClick={() => setDetailTab("innings2")}
                      className={`flex-1 text-center py-2 rounded-lg text-xs font-bold font-space uppercase transition-all cursor-pointer ${
                        detailTab === "innings2"
                          ? "bg-gold text-black shadow"
                          : "text-text-secondary hover:text-white"
                      }`}
                    >
                      {selectedDetailMatch.team2Name}
                    </button>
                  </div>
                )}

                {/* Scorecard Table View */}
                {(() => {
                  const innings = detailTab === "innings1" ? selectedDetailMatch.firstInnings : selectedDetailMatch.secondInnings;
                  if (!innings) return <p className="text-center text-xs text-text-secondary">No innings details recorded.</p>;

                  const battersList = Object.values(innings.battingStats);
                  const bowlersList = Object.values(innings.bowlingStats);

                  return (
                    <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2">
                      {/* Score summary */}
                      {(() => {
                        const customAdjustRuns = innings.balls
                          ? innings.balls
                              .filter(b => b.ballId && b.ballId.startsWith("penalty-"))
                              .reduce((sum, b) => sum + b.runsExtras, 0)
                          : 0;

                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-white/5 border border-white/5 p-4 rounded-2xl text-xs sm:text-sm font-mono">
                            <div className="flex sm:flex-col justify-between sm:justify-start gap-1">
                              <span className="text-text-secondary">Innings Score:</span>
                              <span className="text-white font-bold">{innings.runs}/{innings.wickets}</span>
                            </div>
                            <div className="flex sm:flex-col justify-between sm:justify-start gap-1 sm:border-l sm:border-white/10 sm:pl-4">
                              <span className="text-text-secondary">Overs:</span>
                              <span className="text-white font-bold">{ballsToOvers(innings.ballsBowled)} / {innings.oversLimit}</span>
                            </div>
                            <div className="flex sm:flex-col justify-between sm:justify-start gap-1 sm:border-l sm:border-white/10 sm:pl-4">
                              <span className="text-text-secondary">Extras:</span>
                              <span className="text-white font-bold">
                                {innings.extras.wides + innings.extras.noballs + innings.extras.byes + innings.extras.legbyes}
                                <span className="text-[10px] text-text-secondary ml-1 font-light block sm:inline">
                                  (w{innings.extras.wides} nb{innings.extras.noballs} b{innings.extras.byes} lb{innings.extras.legbyes})
                                </span>
                              </span>
                            </div>
                            <div className="flex sm:flex-col justify-between sm:justify-start gap-1 sm:border-l sm:border-white/10 sm:pl-4">
                              <span className="text-text-secondary">Adjustments:</span>
                              <span className={`font-bold ${customAdjustRuns >= 0 ? "text-amber-400" : "text-purple-400"}`}>
                                {customAdjustRuns >= 0 ? "+" : ""}{customAdjustRuns} runs
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Batting scorecard */}
                      <div className="space-y-2">
                        <h4 className="text-xs uppercase font-mono tracking-wider text-gold font-bold">Batting Scorecard</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-white/10 text-[10px] uppercase font-mono text-text-secondary">
                                <th className="py-2 pr-4">Batter</th>
                                <th className="py-2 px-2 text-center">Status</th>
                                <th className="py-2 px-2 text-right">Runs</th>
                                <th className="py-2 px-2 text-right">Balls</th>
                                <th className="py-2 px-2 text-right">4s</th>
                                <th className="py-2 px-2 text-right">6s</th>
                                <th className="py-2 pl-4 text-right">SR</th>
                              </tr>
                            </thead>
                            <tbody>
                              {battersList.length === 0 ? (
                                <tr>
                                  <td colSpan={7} className="py-3 text-center text-text-secondary italic">No batting stats logged.</td>
                                </tr>
                              ) : (
                                battersList.map((b) => {
                                  const sr = b.ballsFaced > 0 ? ((b.runs / b.ballsFaced) * 100).toFixed(1) : "0.0";
                                  const isCaptain = b.name === selectedDetailMatch.team1CaptainName || b.name === selectedDetailMatch.team2CaptainName;
                                  return (
                                    <tr key={b.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                      <td className="py-2.5 pr-4 font-semibold text-white">
                                        {b.name} {isCaptain && <span className="text-gold text-[9px] font-bold ml-1 font-mono">(C)</span>}
                                      </td>
                                      <td className="py-2.5 px-2 text-center text-text-secondary font-mono text-[10px]">
                                        {b.isOut ? (
                                          <span className="text-red-400 capitalize">
                                            {b.dismissalType?.replace("_", " ") || "Out"}
                                          </span>
                                        ) : (
                                          <span className="text-green-400 font-bold uppercase">Not Out</span>
                                        )}
                                      </td>
                                      <td className="py-2.5 px-2 text-right font-bold text-gold font-mono">{b.runs}</td>
                                      <td className="py-2.5 px-2 text-right text-text-secondary font-mono">{b.ballsFaced}</td>
                                      <td className="py-2.5 px-2 text-right text-text-secondary font-mono">{b.fours}</td>
                                      <td className="py-2.5 px-2 text-right text-text-secondary font-mono">{b.sixes}</td>
                                      <td className="py-2.5 pl-4 text-right text-text-secondary font-mono">{sr}</td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Bowling scorecard */}
                      <div className="space-y-2 pt-2">
                        <h4 className="text-xs uppercase font-mono tracking-wider text-blue font-bold">Bowling Scorecard</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-white/10 text-[10px] uppercase font-mono text-text-secondary">
                                <th className="py-2 pr-4">Bowler</th>
                                <th className="py-2 px-2 text-right">Overs</th>
                                <th className="py-2 px-2 text-right">Maidens</th>
                                <th className="py-2 px-2 text-right">Runs</th>
                                <th className="py-2 px-2 text-right">Wkts</th>
                                <th className="py-2 pl-4 text-right">Econ</th>
                              </tr>
                            </thead>
                            <tbody>
                              {bowlersList.length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="py-3 text-center text-text-secondary italic">No bowling stats logged.</td>
                                </tr>
                              ) : (
                                bowlersList.map((bo) => {
                                  const overs = ballsToOvers(bo.ballsBowled);
                                  const econ = bo.ballsBowled > 0 ? ((bo.runsConceded / bo.ballsBowled) * 6).toFixed(2) : "0.00";
                                  return (
                                    <tr key={bo.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                      <td className="py-2.5 pr-4 font-semibold text-white">{bo.name}</td>
                                      <td className="py-2.5 px-2 text-right text-text-secondary font-mono">{overs}</td>
                                      <td className="py-2.5 px-2 text-right text-text-secondary font-mono">{bo.maidens}</td>
                                      <td className="py-2.5 px-2 text-right font-bold text-red-400 font-mono">{bo.runsConceded}</td>
                                      <td className="py-2.5 px-2 text-right font-bold text-green-400 font-mono">{bo.wickets}</td>
                                      <td className="py-2.5 pl-4 text-right text-text-secondary font-mono">{econ}</td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* TOURNAMENT SQUADS MODAL */}
        <AnimatePresence>
          {showSquadsModal && selectedTournament && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#0B0C10] border border-white/10 shadow-2xl relative max-w-4xl w-full p-6 md:p-8 rounded-[28px] overflow-hidden my-8"
              >
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowSquadsModal(false);
                    setSelectedSquadTeamId(null);
                  }}
                  className="absolute top-4 right-4 p-1.5 text-text-secondary hover:text-white rounded-full hover:bg-white/5 transition-all cursor-pointer z-10"
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 border border-gold/20 text-gold mb-3">
                    <Users className="h-5 w-5" />
                  </span>
                  <h3 className="font-space text-2xl font-bold text-white tracking-tight">
                    {selectedTournament.name} Squads
                  </h3>
                  <p className="text-[10px] text-text-secondary mt-1.5 uppercase tracking-wider font-mono">
                    Browse registered team rosters and player statistics
                  </p>
                </div>

                {/* Team Selector Tabs */}
                {(() => {
                  const tournamentTeams = getTeams().filter(t => selectedTournament.teams.includes(t.id));
                  if (tournamentTeams.length === 0) {
                    return <p className="text-center text-xs text-text-secondary italic">No teams registered in this tournament yet.</p>;
                  }

                  const activeTeam = tournamentTeams.find(t => t.id === selectedSquadTeamId) || tournamentTeams[0];

                  return (
                    <div className="space-y-6">
                      {/* Tabs */}
                      <div className="flex gap-2 border-b border-white/5 pb-3 overflow-x-auto">
                        {tournamentTeams.map((team) => (
                          <button
                            key={team.id}
                            onClick={() => setSelectedSquadTeamId(team.id)}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold font-space uppercase transition-all whitespace-nowrap cursor-pointer ${
                              selectedSquadTeamId === team.id
                                ? "bg-gold text-black shadow"
                                : "text-text-secondary hover:text-white hover:bg-white/5"
                            }`}
                          >
                            <span className="mr-1.5">{team.logo}</span>
                            {team.name}
                          </button>
                        ))}
                      </div>

                      {/* Team Details & Roster */}
                      <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/5 border border-white/5 p-4 rounded-2xl gap-2 font-mono text-xs">
                          <div>
                            <span className="text-text-secondary mr-1.5">Coach:</span>
                            <span className="text-white font-bold">{activeTeam.coach}</span>
                          </div>
                          <div>
                            <span className="text-text-secondary mr-1.5">Captain:</span>
                            <span className="text-white font-bold text-gold">{activeTeam.captain}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-xs uppercase font-mono tracking-wider text-text-secondary font-bold">Roster Ranks</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {activeTeam.players.map((p) => {
                              const isCaptain = p.name === activeTeam.captain;
                              return (
                                <div key={p.id} className="flex justify-between items-center bg-white/[0.02] px-4 py-3 rounded-xl border border-white/5">
                                  <div>
                                    <span className="text-xs font-semibold text-white">
                                      {p.name} {isCaptain && <span className="text-gold text-[9px] font-bold ml-1 font-mono">(C)</span>}
                                    </span>
                                    <span className="text-[10px] text-text-secondary/70 block font-mono">
                                      {p.battingStyle}
                                    </span>
                                  </div>
                                  <span className="text-[9px] text-text-secondary bg-white/5 px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                                    {p.role}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-white/5 py-8 text-center bg-[#050505] z-10 text-[10px] uppercase tracking-widest text-text-secondary font-mono">
        © {new Date().getFullYear()} CrickElite. All Rights Reserved. Created by deepmind.
      </footer>
    </div>
  );
}
