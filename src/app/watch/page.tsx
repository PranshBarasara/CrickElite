"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, AlertCircle, ArrowLeft, RefreshCw, Send, CheckCircle2, Award, Zap } from "lucide-react";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import StadiumBackground from "@/components/background/StadiumBackground";
import { getMatches, saveMatch, getTeams, MockTeam, getTournaments } from "@/lib/mockData";
import { MatchState, ballsToOvers, calculateCRR, calculateRRR, BallRecord } from "@/lib/scorerEngine";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";

export default function WatchPage() {
  const [matchIdInput, setMatchIdInput] = useState("live-cup-finals");
  const [passwordInput, setPasswordInput] = useState("123456");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [match, setMatch] = useState<MatchState | null>(null);
  const [activeTab, setActiveTab] = useState<"wagon" | "charts" | "commentary" | "teams">("wagon");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const wagonCanvasRef = useRef<HTMLCanvasElement>(null);

  // Audio synthethizer for boundary/wicket cheers
  const triggerCelebrationSound = (type: string) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "six") {
        // High rising cheer
        osc.type = "sine";
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.8);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
        osc.start();
        osc.stop(ctx.currentTime + 1.2);
      } else if (type === "four") {
        // Short double beep
        osc.type = "triangle";
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === "wicket") {
        // Warning low frequency buzzer
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.6);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  // Load match details
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mId = params.get("matchId") || matchIdInput;
    if (params.has("matchId")) {
      setMatchIdInput(mId);
      setIsAuthenticated(true);
    }

    const loadMatch = () => {
      const matches = getMatches();
      const currentMatch = matches.find((m) => m.matchId === mId) || matches[0];
      setMatch(currentMatch || null);
    };

    if (isAuthenticated || params.has("matchId")) {
      loadMatch();
      window.addEventListener("storage", loadMatch);
    }

    return () => window.removeEventListener("storage", loadMatch);
  }, [isAuthenticated, matchIdInput]);


  // Render Wagon Wheel on canvas
  useEffect(() => {
    if (activeTab !== "wagon" || !match) return;
    const canvas = wagonCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = (canvas.width = 300);
    const height = (canvas.height = 300);
    const cx = width / 2;
    const cy = height / 2;
    const radius = 130;

    // Draw Cricket Field
    ctx.clearRect(0, 0, width, height);

    // Green boundary ring
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#0c1f13";
    ctx.strokeStyle = "#00FFB2";
    ctx.lineWidth = 3;
    ctx.fill();
    ctx.stroke();

    // 30 yard circle (dashed)
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.5, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0, 255, 178, 0.2)";
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]); // Reset

    // Pitch in center
    ctx.fillStyle = "#cc9c66";
    ctx.fillRect(cx - 5, cy - 20, 10, 40);

    // Draw all balls from current innings onto wagon wheel
    const innings = match.currentInningsNumber === 1 ? match.firstInnings : match.secondInnings;
    if (innings) {
      innings.balls.forEach((ball: BallRecord) => {
        if (ball.wagonAngle === undefined || ball.runsBatter === 0 || ball.extraType === "wide") return;

        const radAngle = (ball.wagonAngle * Math.PI) / 180;
        const targetX = cx + Math.cos(radAngle) * radius * 0.9;
        const targetY = cy + Math.sin(radAngle) * radius * 0.9;

        // Line Color based on runs
        let lineColor = "#FFFFFF";
        if (ball.runsBatter === 6) lineColor = "#D4AF37"; // Gold for sixes
        else if (ball.runsBatter === 4) lineColor = "#00C8FF"; // Blue for fours
        else if (ball.runsBatter === 1) lineColor = "#00FFB2"; // Green for singles
        else if (ball.runsBatter === 2 || ball.runsBatter === 3) lineColor = "#e2e8f0";

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(targetX, targetY);
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = ball.runsBatter >= 4 ? 2.5 : 1.2;
        ctx.shadowBlur = ball.runsBatter >= 4 ? 6 : 0;
        ctx.shadowColor = lineColor;
        ctx.stroke();

        // Draw point at the end of shot
        ctx.beginPath();
        ctx.arc(targetX, targetY, 3, 0, Math.PI * 2);
        ctx.fillStyle = lineColor;
        ctx.fill();
        ctx.shadowBlur = 0; // Reset
      });
    }
  }, [activeTab, match]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (matchIdInput.trim() !== "" && passwordInput.trim() !== "") {
      setIsAuthenticated(true);
    }
  };

  // Compute stats for Manhattan and Run Worm
  const getManhattanData = () => {
    if (!match) return [];
    const innings = match.currentInningsNumber === 1 ? match.firstInnings : match.secondInnings;
    if (!innings) return [];

    // Group runs by over
    const runsPerOver: Record<number, number> = {};
    innings.balls.forEach((b) => {
      const overNum = b.overNumber + 1;
      const totalRuns = b.runsBatter + b.runsExtras;
      runsPerOver[overNum] = (runsPerOver[overNum] || 0) + totalRuns;
    });

    return Object.keys(runsPerOver).map((over) => ({
      over: `Over ${over}`,
      runs: runsPerOver[parseInt(over)]
    }));
  };

  const getRunWormData = () => {
    if (!match) return [];
    const firstInnings = match.firstInnings;
    const secondInnings = match.secondInnings;
    
    const data: Array<{ over: number; firstInningsRuns?: number; secondInningsRuns?: number }> = [];
    
    // Process first innings
    let cumulative1 = 0;
    const firstOvers: Record<number, number> = {};
    firstInnings.balls.forEach((b) => {
      if (b.extraType === "wide" || b.extraType === "noball") return; // Keep it simple by legal ball
      cumulative1 += (b.runsBatter + b.runsExtras);
      const overDecimal = Math.floor(b.overNumber) + (b.ballNumber / 6);
      firstOvers[overDecimal] = cumulative1;
    });

    // Process second innings
    let cumulative2 = 0;
    const secondOvers: Record<number, number> = {};
    if (secondInnings) {
      secondInnings.balls.forEach((b) => {
        if (b.extraType === "wide" || b.extraType === "noball") return;
        cumulative2 += (b.runsBatter + b.runsExtras);
        const overDecimal = Math.floor(b.overNumber) + (b.ballNumber / 6);
        secondOvers[overDecimal] = cumulative2;
      });
    }

    const totalOvers = match.oversLimit;
    for (let o = 0; o <= totalOvers; o += 1) {
      const entry: any = { over: o };
      
      // Approximate score at the end of each over
      const closest1Key = Object.keys(firstOvers)
        .map(Number)
        .filter((k) => k <= o)
        .sort((a, b) => b - a)[0];
      if (closest1Key !== undefined) {
        entry.firstInningsRuns = firstOvers[closest1Key];
      } else if (o === 0) {
        entry.firstInningsRuns = 0;
      }

      if (secondInnings) {
        const closest2Key = Object.keys(secondOvers)
          .map(Number)
          .filter((k) => k <= o)
          .sort((a, b) => b - a)[0];
        if (closest2Key !== undefined) {
          entry.secondInningsRuns = secondOvers[closest2Key];
        } else if (o === 0) {
          entry.secondInningsRuns = 0;
        }
      }
      data.push(entry);
    }

    return data;
  };

  const getWinProbability = () => {
    if (!match) return { team1: 50, team2: 50 };
    if (match.status === "completed") {
      return match.winnerName === match.team1Name 
        ? { team1: 100, team2: 0 } 
        : { team1: 0, team2: 100 };
    }

    // Dynamic estimation
    if (match.currentInningsNumber === 1) {
      const crr = calculateCRR(match.firstInnings.runs, match.firstInnings.ballsBowled);
      if (crr > 9.0) return { team1: 65, team2: 35 };
      if (crr < 6.0) return { team1: 40, team2: 60 };
      return { team1: 52, team2: 48 };
    } else {
      const target = match.firstInnings.runs + 1;
      const runs = match.secondInnings?.runs || 0;
      const wickets = match.secondInnings?.wickets || 0;
      const ballsBowled = match.secondInnings?.ballsBowled || 0;
      const totalBalls = match.oversLimit * 6;
      const remainingBalls = totalBalls - ballsBowled;

      const rrr = calculateRRR(target, runs, remainingBalls);
      const crr = calculateCRR(runs, ballsBowled);

      // Simple heuristic
      let p2 = 50;
      p2 -= (rrr - crr) * 5; // RRR > CRR lowers chasing team probability
      p2 -= wickets * 6;     // Wickets cost probability
      p2 = Math.max(5, Math.min(95, p2));
      return { team1: Math.round(100 - p2), team2: Math.round(p2) };
    }
  };

  const winProb = getWinProbability();

  return (
    <div className="relative min-h-screen flex flex-col font-inter text-white">
      <StadiumBackground />
      <Navigation />

      {!isAuthenticated ? (
        // Watch Match Gate (Form)
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass max-w-md w-full p-8 rounded-[22px] border border-white/10 shadow-2xl relative"
          >
            {/* Ambient glows inside cards */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gold/10 rounded-full blur-2xl" />

            <div className="text-center mb-8">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-yellow-600 text-black font-space font-extrabold text-2xl shadow-lg mb-4">
                P
              </span>
              <h2 className="font-space text-2xl font-bold tracking-tight">Access Spectator Arena</h2>
              <p className="text-xs text-text-secondary mt-2">
                Enter your unique Match ID and password to tune into the live broadcast stream.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-text-secondary mb-2">
                  Match ID
                </label>
                <input
                  type="text"
                  required
                  value={matchIdInput}
                  onChange={(e) => setMatchIdInput(e.target.value)}
                  className="w-full bg-secondary border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-gold/50 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-text-secondary mb-2">
                  Security Code
                </label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-secondary border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-gold/50 outline-none transition-colors"
                />
              </div>

              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex gap-3 text-xs text-text-secondary">
                <AlertCircle className="h-5 w-5 text-gold flex-shrink-0" />
                <span>
                  Demo defaults are loaded. Simply click the button below to join the live broadcast.
                </span>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-gold to-yellow-600 text-black py-3.5 rounded-[100px] text-xs font-bold font-space uppercase tracking-wider hover:opacity-90 active:scale-98 transition-all shadow-md shadow-gold/10"
              >
                Watch Live Match
              </button>
            </form>
          </motion.div>
        </div>
      ) : (
        // Spectator Broadcast Arena
        <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
          {/* Header Action Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs text-text-secondary hover:text-white mb-2 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
              </Link>
              <div className="flex items-center gap-3">
                <h1 className="font-space text-2xl font-bold tracking-tight">
                  {match?.team1Name} vs {match?.team2Name}
                </h1>
                {match?.status === "completed" ? (
                  <span className="text-[10px] uppercase font-mono tracking-wider text-red-400 font-bold bg-red-400/10 px-2 py-0.5 rounded-full">
                    COMPLETED
                  </span>
                ) : (
                  <>
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-bold bg-emerald-400/10 px-2 py-0.5 rounded-full">
                      LIVE
                    </span>
                  </>
                )}
              </div>
            </div>

          </div>

          {match && match.status === "completed" && (
            <div className="bg-gradient-to-r from-red-500/20 to-gold/20 border border-red-500/30 rounded-[22px] p-6 text-center space-y-3 relative overflow-hidden shadow-lg shadow-red-500/5">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gold/10 rounded-full blur-2xl animate-pulse" />
              <h2 className="font-space text-2xl font-black text-gold uppercase tracking-wider flex items-center justify-center gap-2">
                🏆 Match Completed 🏆
              </h2>
              <p className="font-space text-lg font-bold text-white">
                {match.winnerName === "Tie Match" ? (
                  <span className="text-yellow-400 font-extrabold uppercase">Match ended in a TIE!</span>
                ) : (
                  <>
                    Winner: <span className="text-gold font-extrabold uppercase">{match.winnerName}</span> 🎉
                  </>
                )}
              </p>
              <div className="flex justify-center gap-8 text-xs font-mono text-text-secondary">
                <div>
                  <span>{match.team1Name}:</span> <span className="text-white font-bold ml-1">{match.firstInnings.runs}/{match.firstInnings.wickets}</span> ({ballsToOvers(match.firstInnings.ballsBowled)} overs)
                </div>
                {match.secondInnings && (
                  <div>
                    <span>{match.team2Name}:</span> <span className="text-white font-bold ml-1">{match.secondInnings.runs}/{match.secondInnings.wickets}</span> ({ballsToOvers(match.secondInnings.ballsBowled)} overs)
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Toss & Match Category Details Banner */}
          {match && (
            <div className="flex flex-wrap justify-between items-center gap-3 bg-white/5 border border-white/5 px-6 py-3.5 rounded-[22px] text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-gold bg-gold/10 border border-gold/20 px-2.5 py-0.5 rounded">
                  {match.matchCategory || "League Match"}
                </span>
                <span className="text-text-secondary">Venue:</span>
                <span className="text-white font-bold">{match.ground || "TBD"}</span>
              </div>
              
              {match.isTossCompleted && (
                <div className="flex items-center gap-2">
                  <span className="text-text-secondary">Toss Winner:</span>
                  <span className="text-gold font-bold uppercase">
                    {match.tossWinnerName} won the toss & chose to {match.tossDecision} first
                  </span>
                </div>
              )}

              <div className="flex items-center gap-4">
                <div>
                  <span className="text-text-secondary mr-1">Team A Captain:</span>
                  <span className="text-gold font-bold">{match.team1CaptainName || "TBD"}</span>
                </div>
                <div>
                  <span className="text-text-secondary mr-1">Team B Captain:</span>
                  <span className="text-blue font-bold">{match.team2CaptainName || "TBD"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Large Score Panel */}
          {match && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Broadcast Scoreboard Widget */}
              <div className="lg:col-span-2 glass rounded-[22px] border border-white/10 p-8 relative flex flex-col justify-between overflow-hidden shadow-2xl">
                {/* Glowing neon elements */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-gold/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue/5 rounded-full blur-3xl" />

                {/* Innings details */}
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs uppercase font-mono text-text-secondary tracking-widest">
                    Innings {match.currentInningsNumber} • {match.matchCategory || "League Match"}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-secondary">Sound:</span>
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                        soundEnabled ? "bg-emerald-400/20 text-emerald-400" : "bg-white/10 text-white/50"
                      }`}
                    >
                      {soundEnabled ? "ON" : "OFF"}
                    </button>
                  </div>
                </div>

                {/* Team & Score display */}
                {(() => {
                  const innings = match.currentInningsNumber === 1 ? match.firstInnings : match.secondInnings;
                  if (!innings) return null;

                  return (
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                      <div>
                        <h2 className="font-space text-3xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">
                          {innings.teamName}
                        </h2>
                        {match.currentInningsNumber === 2 && (
                          <div className="text-xs text-gold flex items-center gap-1.5 font-bold uppercase tracking-wider">
                            <Zap className="h-3 w-3" /> Target: {match.firstInnings.runs + 1} runs
                          </div>
                        )}
                      </div>

                      <div className="flex items-baseline gap-4">
                        <span className="ledger-font text-6xl md:text-7xl font-bold text-gold tracking-tighter drop-shadow-[0_0_15px_rgba(212,175,55,0.3)] animate-pulse">
                          {innings.runs}/{innings.wickets}
                        </span>
                        <span className="font-sora text-sm text-text-secondary">
                          ({ballsToOvers(innings.ballsBowled)} / {innings.oversLimit} ov)
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Score stats bar */}
                {(() => {
                  const innings = match.currentInningsNumber === 1 ? match.firstInnings : match.secondInnings;
                  if (!innings) return null;

                  const crr = calculateCRR(innings.runs, innings.ballsBowled);
                  const target = match.firstInnings.runs + 1;
                  const remainingBalls = (match.oversLimit * 6) - innings.ballsBowled;
                  const rrr = match.currentInningsNumber === 2 
                    ? calculateRRR(target, innings.runs, remainingBalls) 
                    : 0;

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/5 pt-6 text-left">
                      <div>
                        <span className="text-[10px] uppercase font-mono text-text-secondary block mb-1">
                          Current Run Rate
                        </span>
                        <span className="font-sora text-lg font-bold text-white">{crr}</span>
                      </div>

                      {match.currentInningsNumber === 2 && (
                        <div>
                          <span className="text-[10px] uppercase font-mono text-text-secondary block mb-1">
                            Req. Run Rate
                          </span>
                          <span className="font-sora text-lg font-bold text-blue">
                            {innings.runs >= target ? "0.00" : rrr}
                          </span>
                        </div>
                      )}

                      <div>
                        <span className="text-[10px] uppercase font-mono text-text-secondary block mb-1">
                          Extras conceded
                        </span>
                        <span className="font-sora text-sm text-white">
                          {innings.extras.wides + innings.extras.noballs + innings.extras.byes + innings.extras.legbyes} 
                          <span className="text-[10px] text-text-secondary ml-1">
                            (w{innings.extras.wides} nb{innings.extras.noballs} b{innings.extras.byes} lb{innings.extras.legbyes})
                          </span>
                        </span>
                      </div>

                      {match.currentInningsNumber === 2 && (
                        <div>
                          <span className="text-[10px] uppercase font-mono text-text-secondary block mb-1">
                            Required Runs
                          </span>
                          <span className="font-sora text-lg font-bold text-emerald-400">
                            {innings.runs >= target ? (
                              <span className="text-emerald-400 font-extrabold uppercase animate-pulse">
                                Match Won! 🎉
                              </span>
                            ) : remainingBalls <= 0 ? (
                              <span className="text-red-400 font-extrabold uppercase">
                                Overs Ended
                              </span>
                            ) : (
                              `${target - innings.runs} runs off ${remainingBalls} balls`
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Striker & Bowler current details */}
                {(() => {
                  const innings = match.currentInningsNumber === 1 ? match.firstInnings : match.secondInnings;
                  if (!innings) return null;

                  const batter1 = innings.battingStats[innings.currentBatter1Id];
                  const batter2 = innings.battingStats[innings.currentBatter2Id];
                  const bowler = innings.bowlingStats[innings.currentBowlerId];

                  return (
                    <div className="mt-8 border-t border-white/5 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 rounded-2xl p-4 border border-white/5">
                      {/* Batters */}
                      <div className="space-y-3">
                        <span className="text-[10px] uppercase font-mono text-gold tracking-wider font-bold">Batting</span>
                        <div className="space-y-2">
                          {batter1 && (
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-white flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                                {batter1.name} *
                              </span>
                              <span className="font-sora font-semibold text-white">
                                {batter1.runs} ({batter1.ballsFaced})
                              </span>
                            </div>
                          )}
                          {batter2 && (
                            <div className="flex justify-between items-center text-xs opacity-60">
                              <span>{batter2.name}</span>
                              <span className="font-sora">
                                {batter2.runs} ({batter2.ballsFaced})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bowler */}
                      <div className="space-y-3 md:border-l md:border-white/5 md:pl-6">
                        <span className="text-[10px] uppercase font-mono text-blue tracking-wider font-bold">Bowling</span>
                        {bowler && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-white">{bowler.name}</span>
                            <span className="font-sora font-semibold text-white">
                              {bowler.wickets} - {bowler.runsConceded} 
                              <span className="text-[10px] text-text-secondary ml-1.5 font-light">
                                ({ballsToOvers(bowler.ballsBowled)} ov)
                              </span>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Current Over balls bar */}
                      <div className="md:col-span-2 border-t border-white/5 pt-4 mt-2 flex items-center gap-3">
                        <span className="text-[9px] uppercase font-mono text-text-secondary tracking-wider">
                          Current Over:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(() => {
                            const currentOverNum = Math.floor(innings.ballsBowled / 6);
                            const overBalls = innings.balls.filter(b => b.overNumber === currentOverNum);
                            if (overBalls.length === 0) {
                              return <span className="text-[10px] text-text-secondary italic">Waiting for first delivery...</span>;
                            }
                            return overBalls.map((ball) => {
                              const isPenalty = ball.ballId.startsWith("penalty-");
                              let badge = "bg-white/5 text-white";
                              if (isPenalty) {
                                badge = ball.runsExtras >= 0 
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" 
                                  : "bg-purple-500/20 text-purple-400 border border-purple-500/30 animate-pulse";
                              } else if (ball.runsBatter === 6) {
                                badge = "bg-gold/20 text-gold border border-gold/30";
                              } else if (ball.runsBatter === 4) {
                                badge = "bg-blue/20 text-blue border border-blue/30";
                              } else if (ball.wicketType) {
                                badge = "bg-red-500/20 text-red-400 border border-red-500/30";
                              }

                              return (
                                <span
                                  key={ball.ballId}
                                  className={`h-6 w-6 rounded-md flex items-center justify-center text-[9px] font-mono font-bold ${badge}`}
                                  title={ball.commentary}
                                >
                                  {ball.wicketType 
                                    ? "W" 
                                    : isPenalty 
                                      ? `${ball.runsExtras >= 0 ? "+" : ""}${ball.runsExtras}`
                                      : ball.runsBatter + (ball.extraType ? "e" : "")
                                  }
                                </span>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Win Probability Widget */}
              <div className="glass rounded-[22px] border border-white/10 p-6 flex flex-col justify-between shadow-2xl">
                <div>
                  <h3 className="font-space font-bold text-lg text-white mb-4">Win Probability</h3>
                  
                  <div className="flex justify-between items-center text-xs font-mono mb-2 uppercase">
                    <span className="text-white font-bold">{match.team1Name}</span>
                    <span className="text-text-secondary">{match.team2Name}</span>
                  </div>

                  {/* Visual Bar */}
                  <div className="w-full bg-secondary h-6 rounded-full overflow-hidden flex border border-white/5">
                    <motion.div
                      animate={{ width: `${winProb.team1}%` }}
                      className="bg-gradient-to-r from-blue to-cyan-500 h-full flex items-center justify-center text-[10px] font-bold text-black"
                    >
                      {winProb.team1 > 15 && `${winProb.team1}%`}
                    </motion.div>
                    <motion.div
                      animate={{ width: `${winProb.team2}%` }}
                      className="bg-gradient-to-l from-gold to-yellow-600 h-full flex items-center justify-center text-[10px] font-bold text-black"
                    >
                      {winProb.team2 > 15 && `${winProb.team2}%`}
                    </motion.div>
                  </div>

                  <p className="text-[10px] text-text-secondary mt-3 leading-relaxed font-light">
                    *Probability calculations are updated instantly based on wickets remaining, target size, and historical run rates.
                  </p>
                </div>

                <div className="border-t border-white/5 pt-6 mt-6">
                  <span className="text-[10px] uppercase font-mono text-gold block mb-2 font-bold">Latest Milestone</span>
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-xs">
                    {(() => {
                      const innings = match.currentInningsNumber === 1 ? match.firstInnings : match.secondInnings;
                      if (!innings || innings.balls.length === 0) {
                        return "Match is starting. Standing by for the first delivery.";
                      }
                      return innings.balls[innings.balls.length - 1].commentary;
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs Section for Wagon Wheel, Charts, Commentary */}
          {match && (
            <div className="w-full mt-4">
            {/* Tab Headers */}
            <div className="flex gap-2 border-b border-white/5 pb-3">
              {[
                { id: "wagon", label: "Live Performance" },
                { id: "charts", label: "Manhattan & Run Worm" },
                { id: "commentary", label: "Ball-By-Ball Timeline" },
                { id: "teams", label: "Squad Details" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs uppercase font-space font-bold tracking-wider transition-all ${
                    activeTab === tab.id
                      ? "bg-gold text-black shadow-md shadow-gold/10"
                      : "text-text-secondary hover:text-white hover:bg-white/5"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="py-6">
               {/* 1. Live Stats Tab (Scorecard Stats) */}
              {activeTab === "wagon" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-8"
                >
                  {(() => {
                    const innings = match.currentInningsNumber === 1 ? match.firstInnings : match.secondInnings;
                    if (!innings) return <p className="text-center text-xs text-text-secondary">No live stats available.</p>;

                    const batters = Object.values(innings.battingStats);
                    const bowlers = Object.values(innings.bowlingStats);

                    // Group runs per completed/active over
                    const runsPerOver: Array<{ over: number; runs: number; wickets: number; balls: BallRecord[] }> = [];
                    const overGroups: Record<number, BallRecord[]> = {};
                    innings.balls.forEach((b) => {
                      if (!overGroups[b.overNumber]) {
                        overGroups[b.overNumber] = [];
                      }
                      overGroups[b.overNumber].push(b);
                    });

                    Object.keys(overGroups).forEach((oKey) => {
                      const overNum = parseInt(oKey);
                      const balls = overGroups[overNum];
                      let overRuns = 0;
                      let overWickets = 0;
                      balls.forEach((b) => {
                        overRuns += b.runsBatter + b.runsExtras;
                        if (b.wicketType) {
                          overWickets++;
                        }
                      });
                      runsPerOver.push({
                        over: overNum + 1,
                        runs: overRuns,
                        wickets: overWickets,
                        balls
                      });
                    });

                    return (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Over-by-Over Runs List */}
                        <div className="glass p-6 rounded-[22px] border border-white/5 space-y-4 lg:col-span-1">
                          <h3 className="font-space font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-2">
                            <span>Runs According to Over</span>
                          </h3>
                          <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                            {runsPerOver.length === 0 ? (
                              <p className="text-xs text-text-secondary italic">No overs bowled yet.</p>
                            ) : (
                              runsPerOver.map((o) => (
                                <div key={o.over} className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-2.5 rounded-xl text-xs font-mono">
                                  <div>
                                    <span className="text-text-secondary font-bold">Over {o.over}</span>
                                    <span className="text-[10px] text-text-secondary/70 ml-2 block sm:inline">
                                      ({o.balls.length} deliveries)
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-white font-bold">{o.runs} runs</span>
                                    {o.wickets > 0 && (
                                      <span className="bg-red-500/20 text-red-400 font-bold px-1.5 py-0.5 rounded text-[10px]">
                                        {o.wickets} Wkt
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Batters details */}
                        <div className="glass p-6 rounded-[22px] border border-white/5 space-y-4 lg:col-span-1">
                          <h3 className="font-space font-bold text-sm text-gold uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-2">
                            <span>Active & Previous Batters</span>
                          </h3>
                          <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                            {batters.length === 0 ? (
                              <p className="text-xs text-text-secondary italic">No batter statistics recorded.</p>
                            ) : (
                              batters.map((b) => {
                                const isActive = b.id === innings.currentBatter1Id || b.id === innings.currentBatter2Id;
                                const sr = b.ballsFaced > 0 ? ((b.runs / b.ballsFaced) * 100).toFixed(1) : "0.0";
                                return (
                                  <div
                                    key={b.id}
                                    className={`flex justify-between items-center px-4 py-2.5 rounded-xl text-xs border transition-colors ${
                                      isActive
                                        ? "bg-gold/10 border-gold/30 text-white font-bold animate-[pulse_6s_infinite]"
                                        : "bg-white/5 border-white/5 text-text-secondary"
                                    }`}
                                  >
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        {isActive && <span className="h-1.5 w-1.5 rounded-full bg-gold animate-ping" />}
                                        <span className={isActive ? "text-white" : "text-text-secondary"}>{b.name}</span>
                                      </div>
                                      <span className="text-[10px] text-text-secondary/70 font-mono">
                                        SR: {sr} • 4s: {b.fours} • 6s: {b.sixes}
                                      </span>
                                    </div>
                                    <span className="font-mono text-white text-sm font-semibold">
                                      {b.runs} <span className="text-[10px] text-text-secondary">({b.ballsFaced})</span>
                                    </span>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {/* Bowlers details */}
                        <div className="glass p-6 rounded-[22px] border border-white/5 space-y-4 lg:col-span-1">
                          <h3 className="font-space font-bold text-sm text-blue uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-2">
                            <span>Active & Previous Bowlers</span>
                          </h3>
                          <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                            {bowlers.length === 0 ? (
                              <p className="text-xs text-text-secondary italic">No bowler statistics recorded.</p>
                            ) : (
                              bowlers.map((bo) => {
                                const isActive = bo.id === innings.currentBowlerId;
                                const econ = bo.ballsBowled > 0 ? ((bo.runsConceded / bo.ballsBowled) * 6).toFixed(2) : "0.00";
                                const widesCount = innings.balls.filter(b => b.bowlerId === bo.id && b.extraType === "wide").length;
                                const noballsCount = innings.balls.filter(b => b.bowlerId === bo.id && b.extraType === "noball").length;

                                return (
                                  <div
                                    key={bo.id}
                                    className={`flex justify-between items-center px-4 py-2.5 rounded-xl text-xs border transition-colors ${
                                      isActive
                                        ? "bg-blue/10 border-blue/30 text-white font-bold animate-[pulse_6s_infinite]"
                                        : "bg-white/5 border-white/5 text-text-secondary"
                                    }`}
                                  >
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        {isActive && <span className="h-1.5 w-1.5 rounded-full bg-blue animate-ping" />}
                                        <span className={isActive ? "text-white" : "text-text-secondary"}>{bo.name}</span>
                                      </div>
                                      <span className="text-[10px] text-text-secondary/70 font-mono">
                                        Overs: {ballsToOvers(bo.ballsBowled)} • Econ: {econ}
                                      </span>
                                      <span className="text-[9px] text-text-secondary/60 block font-mono">
                                        Wides: {widesCount} • No-Balls: {noballsCount}
                                      </span>
                                    </div>
                                    <div className="text-right font-mono">
                                      <span className="text-white text-sm font-semibold">{bo.wickets} - {bo.runsConceded}</span>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </motion.div>
              )}

              {/* 2. Charts */}
              {activeTab === "charts" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-8"
                >
                  {/* Manhattan Bar chart */}
                  <div className="glass p-6 rounded-[22px] border border-white/5">
                    <h3 className="font-space font-bold text-sm text-white mb-6 uppercase tracking-wider">
                      Manhattan Chart (Runs Per Over)
                    </h3>
                    <div className="h-64">
                      {getManhattanData().length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={getManhattanData()}>
                            <XAxis dataKey="over" stroke="#A9A9A9" fontSize={10} />
                            <YAxis stroke="#A9A9A9" fontSize={10} />
                            <Tooltip contentStyle={{ backgroundColor: "#171717", border: "1px solid rgba(255,255,255,0.1)" }} />
                            <Bar dataKey="runs" fill="#00C8FF" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-text-secondary">
                          No over completed yet.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Run Worm comparison line chart */}
                  <div className="glass p-6 rounded-[22px] border border-white/5">
                    <h3 className="font-space font-bold text-sm text-white mb-6 uppercase tracking-wider">
                      Run Worm Progression
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={getRunWormData()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                          <XAxis dataKey="over" stroke="#A9A9A9" fontSize={10} label={{ value: 'Overs', position: 'insideBottomRight', offset: -5 }} />
                          <YAxis stroke="#A9A9A9" fontSize={10} />
                          <Tooltip contentStyle={{ backgroundColor: "#171717", border: "1px solid rgba(255,255,255,0.1)" }} />
                          <Line type="monotone" dataKey="firstInningsRuns" name={match.team1Name} stroke="#00C8FF" strokeWidth={2} dot={false} />
                          {match.secondInnings && (
                            <Line type="monotone" dataKey="secondInningsRuns" name={match.team2Name} stroke="#D4AF37" strokeWidth={2} dot={false} />
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 3. Commentary Feed */}
              {activeTab === "commentary" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass p-6 rounded-[22px] border border-white/5 max-h-[500px] overflow-y-auto"
                >
                  <h3 className="font-space font-bold text-sm text-white mb-6 uppercase tracking-wider">
                    Live Match Stream
                  </h3>
                  <div className="space-y-4">
                    {(() => {
                      const innings = match.currentInningsNumber === 1 ? match.firstInnings : match.secondInnings;
                      if (!innings || innings.balls.length === 0) {
                        return <div className="text-xs text-text-secondary">Standing by. Commentary will show here once scoring commences.</div>;
                      }

                      // Show commentary in reverse chronological order
                      const reverseBalls = [...innings.balls].reverse();
                      return reverseBalls.map((ball: BallRecord) => {
                        let badgeBg = "bg-white/5 text-white";
                        if (ball.runsBatter === 6) badgeBg = "bg-gold/20 text-gold border border-gold/30";
                        else if (ball.runsBatter === 4) badgeBg = "bg-blue/20 text-blue border border-blue/30";
                        else if (ball.wicketType) badgeBg = "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse";

                        return (
                          <div
                            key={ball.ballId}
                            className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors border border-white/5"
                          >
                            <div className={`h-8 w-12 flex items-center justify-center rounded-lg font-mono text-xs font-bold ${badgeBg}`}>
                              {ball.wicketType ? "W" : ball.runsBatter + (ball.extraType ? "E" : "")}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-mono text-text-secondary">
                                  Over {ball.overNumber}.{ball.ballNumber}
                                </span>
                                {ball.extraType && (
                                  <span className="text-[9px] uppercase font-mono bg-blue/10 text-blue px-2 py-0.5 rounded-full">
                                    {ball.extraType}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-white mt-1 leading-relaxed">
                                {ball.commentary}
                              </p>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </motion.div>
              )}

              {/* 4. Squad Details */}
              {activeTab === "teams" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-8"
                >
                  {(() => {
                    const allTeams = getTeams();
                    if (!match) return [];

                    const filteredTeams = allTeams.filter((t) => t.name === match.team1Name || t.name === match.team2Name);

                    return filteredTeams.map((team: MockTeam) => (
                      <div key={team.id} className="glass p-6 rounded-[22px] border border-white/5">
                        <div className="flex items-center gap-3 mb-6">
                          <span className="text-3xl">{team.logo}</span>
                          <div>
                            <h3 className="font-space font-bold text-lg text-white">{team.name}</h3>
                            <p className="text-[10px] text-text-secondary uppercase font-mono">
                              Coach: {team.coach} • Captain: {team.captain}
                            </p>
                          </div>
                        </div>

                        <div className="divide-y divide-white/5 space-y-2">
                          {team.players.map((player) => {
                            const isCaptain = player.name === match?.team1CaptainName || player.name === match?.team2CaptainName;
                            return (
                              <div key={player.id} className="flex justify-between items-center text-xs py-2.5">
                                <div>
                                  <span className="font-semibold text-white">
                                    {player.name}
                                    {isCaptain && <span className="text-gold font-extrabold text-[10px] ml-1.5 font-mono" title="Team Captain"> (C)</span>}
                                  </span>
                                  <span className="text-[10px] text-text-secondary ml-2 font-mono">({player.role})</span>
                                </div>
                                <span className="text-text-secondary text-[10px] font-light">
                                  {player.battingStyle}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ));
                  })()}
                </motion.div>
              )}
            </div>
          </div>
          )}
        </div>
      )}
    </div>
  );
}
