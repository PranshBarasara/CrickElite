"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Plus, RefreshCw, Trash2, Undo, Zap, UserPlus, ShieldAlert, Award, Lock, Coins, Sparkles, PlusCircle, Trophy } from "lucide-react";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import StadiumBackground from "@/components/background/StadiumBackground";
import { getMatches, saveMatch, getTeams, MockTeam } from "@/lib/mockData";
import { MatchState, InningsState, addBallToInnings, ballsToOvers, calculateCRR, calculateRRR } from "@/lib/scorerEngine";

export default function ScorerPage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [matchId, setMatchId] = useState("");
  const [match, setMatch] = useState<MatchState | null>(null);
  const [permissionError, setPermissionError] = useState(false);
  const [history, setHistory] = useState<MatchState[]>([]);

  // Modals state
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [showBowlerModal, setShowBowlerModal] = useState(false);
  const [showBatterModal, setShowBatterModal] = useState(false);
  const [showCustomRunsModal, setShowCustomRunsModal] = useState(false);

  // Toss Selector Form State
  const [tossWinnerName, setTossWinnerName] = useState("");
  const [tossDecision, setTossDecision] = useState<"bat" | "bowl">("bat");

  // Wicket Form State
  const [wicketType, setWicketType] = useState<any>("bowled");
  const [dismissedPlayerId, setDismissedPlayerId] = useState("");

  // Extras Run Modifier state
  const [extraRunsModifier, setExtraRunsModifier] = useState(0);

  // Custom Runs adjust
  const [customRunsValue, setCustomRunsValue] = useState("");
  const [customRunsComment, setCustomRunsComment] = useState("Penalty Runs");
  const [isCustomRunsNegative, setIsCustomRunsNegative] = useState(false);

  // Batter select target
  const [batterTarget, setBatterTarget] = useState<"batter1" | "batter2">("batter1");

  // Audio haptics click
  const playClickSound = (pitch = 440, type: OscillatorType = "sine") => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(pitch, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {}
  };

  // Auth gate & load match
  useEffect(() => {
    const auth = localStorage.getItem("pranscric_auth_token");
    if (auth === "authorized_elite") {
      setIsAuthorized(true);
    }

    const params = new URLSearchParams(window.location.search);
    const mId = params.get("matchId") || "";
    setMatchId(mId);

    const loadMatch = () => {
      const matches = getMatches();
      if (mId) {
        const current = matches.find((m) => m.matchId === mId);
        if (!current) {
          setPermissionError(true);
          setMatch(null);
          return;
        }
        setPermissionError(false);
        setMatch(current);
      } else {
        setPermissionError(false);
        setMatch(matches[0] || null);
      }
    };

    loadMatch();
    window.addEventListener("storage", loadMatch);

    setLoading(false);
    return () => window.removeEventListener("storage", loadMatch);
  }, [matchId]);

  if (loading) return null;

  if (!isAuthorized) {
    return (
      <div className="relative min-h-screen flex flex-col font-inter text-white">
        <StadiumBackground />
        <Navigation />
        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass max-w-md w-full p-8 rounded-3xl border border-red-500/20 text-center shadow-2xl"
          >
            <Lock className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="font-space text-2xl font-bold tracking-tight text-white mb-2">Access Denied</h2>
            <p className="text-xs text-text-secondary leading-relaxed mb-6">
              Please authenticate using the **Login Console** in the header section with admin credentials to access live scoring.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (permissionError) {
    return (
      <div className="relative min-h-screen flex flex-col font-inter text-white">
        <StadiumBackground />
        <Navigation />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="glass max-w-md w-full p-8 rounded-3xl border border-red-500/20 text-center shadow-2xl space-y-4">
            <ShieldAlert className="h-12 w-12 text-red-400 mx-auto" />
            <h2 className="font-space text-xl font-bold text-white">Access Denied</h2>
            <p className="text-xs text-text-secondary leading-relaxed">
              You do not have permission to score this match session. The selected match belongs to a different league organizer.
            </p>
            <Link
              href="/tournament/create"
              className="inline-block bg-gradient-to-r from-gold to-yellow-600 text-black px-6 py-2.5 rounded-full text-xs font-bold font-space uppercase tracking-wider hover:opacity-90 transition-opacity"
            >
              Go to Tournament Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="relative min-h-screen flex flex-col font-inter text-white">
        <StadiumBackground />
        <Navigation />
        <div className="flex-1 flex items-center justify-center p-4 text-center">
          <div className="glass max-w-md w-full p-6 rounded-3xl border border-white/5 text-xs text-text-secondary">
            No active match session selected. Please schedule and start a match from the League Organizer dashboard.
          </div>
        </div>
      </div>
    );
  }

  // TOSS SUBMIT
  const handleTossSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tossWinnerName) return;

    playClickSound(580, "triangle");

    const team1Name = match.team1Name;
    const team2Name = match.team2Name;

    // Determine batting/bowling orders
    let battingTeamName = "";
    let bowlingTeamName = "";

    if (tossWinnerName === team1Name) {
      if (tossDecision === "bat") {
        battingTeamName = team1Name;
        bowlingTeamName = team2Name;
      } else {
        battingTeamName = team2Name;
        bowlingTeamName = team1Name;
      }
    } else {
      if (tossDecision === "bat") {
        battingTeamName = team2Name;
        bowlingTeamName = team1Name;
      } else {
        battingTeamName = team1Name;
        bowlingTeamName = team2Name;
      }
    }

    const allTeams = getTeams();
    const battingTeamObj = allTeams.find(t => t.name === battingTeamName);
    const bowlingTeamObj = allTeams.find(t => t.name === bowlingTeamName);

    const b1Id = battingTeamObj?.players[0]?.id || "p-batter-1";
    const b2Id = battingTeamObj?.players[1]?.id || "p-batter-2";
    const bowlId = bowlingTeamObj?.players.find(p => p.role === "Bowler")?.id || bowlingTeamObj?.players[0]?.id || "p-bowler-1";

    const nextMatch = { ...match };
    nextMatch.isTossCompleted = true;
    nextMatch.tossWinnerName = tossWinnerName;
    nextMatch.tossDecision = tossDecision;
    nextMatch.status = "live";
    nextMatch.currentInningsNumber = 1;

    nextMatch.firstInnings = {
      teamName: battingTeamName,
      runs: 0,
      wickets: 0,
      ballsBowled: 0,
      oversLimit: match.oversLimit,
      currentBatter1Id: b1Id,
      currentBatter2Id: b2Id,
      currentBowlerId: bowlId,
      extras: { wides: 0, noballs: 0, byes: 0, legbyes: 0 },
      battingStats: {},
      bowlingStats: {},
      balls: []
    };

    // Prepopulate batting stats records
    if (battingTeamObj) {
      battingTeamObj.players.slice(0, 2).forEach(p => {
        nextMatch.firstInnings.battingStats[p.id] = {
          id: p.id,
          name: p.name,
          runs: 0,
          ballsFaced: 0,
          fours: 0,
          sixes: 0,
          isOut: false,
          runsConceded: 0,
          ballsBowled: 0,
          wickets: 0,
          maidens: 0
        };
      });
    }

    // Prepopulate bowler stats record
    if (bowlingTeamObj) {
      const pObj = bowlingTeamObj.players.find(p => p.id === bowlId);
      nextMatch.firstInnings.bowlingStats[bowlId] = {
        id: bowlId,
        name: pObj?.name || "Bowler",
        runs: 0,
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
        isOut: false,
        runsConceded: 0,
        ballsBowled: 0,
        wickets: 0,
        maidens: 0
      };
    }

    setMatch(nextMatch);
    saveMatch(nextMatch);
  };

  const currentInnings = match.currentInningsNumber === 1 ? match.firstInnings : match.secondInnings;
  const isFreeHit = currentInnings && currentInnings.balls.length > 0 && currentInnings.balls[currentInnings.balls.length - 1].extraType === "noball";

  if (!match.isTossCompleted || !currentInnings) {
    return (
      <div className="relative min-h-screen flex flex-col font-inter text-white">
        <StadiumBackground />
        <Navigation />
        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass max-w-md w-full p-8 rounded-3xl border border-white/10 shadow-2xl relative"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full blur-2xl pointer-events-none" />

            <div className="text-center mb-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold mb-3">
                <Coins className="h-5 w-5" />
              </span>
              <h3 className="font-space text-lg font-bold text-white">Toss Configuration</h3>
              <p className="text-[10px] text-text-secondary mt-1 uppercase tracking-wide">
                Start match play and active score sheets
              </p>
            </div>

            <form onSubmit={handleTossSubmit} className="space-y-5">
              <div>
                <label className="block text-[9px] uppercase font-mono tracking-wider text-text-secondary mb-2">
                  Toss Winner
                </label>
                <select
                  required
                  value={tossWinnerName}
                  onChange={(e) => setTossWinnerName(e.target.value)}
                  className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-gold/50 cursor-pointer"
                >
                  <option value="">Select Winner Team</option>
                  <option value={match.team1Name}>{match.team1Name}</option>
                  <option value={match.team2Name}>{match.team2Name}</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] uppercase font-mono tracking-wider text-text-secondary mb-2">
                  Toss Choice
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setTossDecision("bat")}
                    className={`py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${
                      tossDecision === "bat"
                        ? "bg-gold/10 border-gold/40 text-gold"
                        : "bg-secondary border-white/10 text-text-secondary hover:border-white/20"
                    }`}
                  >
                    Choose Bat First
                  </button>
                  <button
                    type="button"
                    onClick={() => setTossDecision("bowl")}
                    className={`py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${
                      tossDecision === "bowl"
                        ? "bg-gold/10 border-gold/40 text-gold"
                        : "bg-secondary border-white/10 text-text-secondary hover:border-white/20"
                    }`}
                  >
                    Choose Bowl First
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Link
                  href="/tournament/create"
                  className="flex-1 bg-white/5 border border-white/10 rounded-full py-2.5 text-xs font-bold text-center hover:bg-white/10 block"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={!tossWinnerName}
                  className="flex-1 bg-gradient-to-r from-gold to-yellow-600 text-black rounded-full py-2.5 text-xs font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
                >
                  Start Match
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    );
  }

  const allTeams = getTeams();
  const battingTeam = allTeams.find(t => t.name === currentInnings.teamName);
  const bowlingTeam = allTeams.find(t => t.name === (match.team1Name === currentInnings.teamName ? match.team2Name : match.team1Name));

  const maxWickets = match.wicketsLimit || (battingTeam && battingTeam.players.length > 0
    ? Math.max(1, battingTeam.players.length - 1)
    : 10);

  // Process next state transitions (overs complete, wickets complete, or target reached)
  const processMatchTransitions = (state: MatchState) => {
    const innings = state.currentInningsNumber === 1 ? state.firstInnings : state.secondInnings;
    if (!innings) return;

    const bTeam = allTeams.find(t => t.name === innings.teamName);
    const wicketsMax = state.wicketsLimit || (bTeam && bTeam.players.length > 0 ? Math.max(1, bTeam.players.length - 1) : 10);

    const inningsIsOver = innings.wickets >= wicketsMax || innings.ballsBowled >= match.oversLimit * 6;

    if (state.currentInningsNumber === 1) {
      if (inningsIsOver) {
        // Switch to Innings 2
        state.currentInningsNumber = 2;
        const chaseTeamName = state.team1Name === innings.teamName ? state.team2Name : state.team1Name;
        const chaseTeamObj = allTeams.find(t => t.name === chaseTeamName);
        const defendTeamObj = allTeams.find(t => t.name === innings.teamName);

        const b1Id = chaseTeamObj?.players[0]?.id || "p-chase-1";
        const b2Id = chaseTeamObj?.players[1]?.id || "p-chase-2";
        const bowlId = defendTeamObj?.players.find(p => p.role === "Bowler")?.id || defendTeamObj?.players[0]?.id || "p-defend-bowler-1";

        state.secondInnings = {
          teamName: chaseTeamName,
          runs: 0,
          wickets: 0,
          ballsBowled: 0,
          oversLimit: state.oversLimit,
          currentBatter1Id: b1Id,
          currentBatter2Id: b2Id,
          currentBowlerId: bowlId,
          extras: { wides: 0, noballs: 0, byes: 0, legbyes: 0 },
          battingStats: {},
          bowlingStats: {},
          balls: []
        };

        // Seed batting statistics records
        if (chaseTeamObj) {
          chaseTeamObj.players.slice(0, 2).forEach(p => {
            state.secondInnings!.battingStats[p.id] = {
              id: p.id,
              name: p.name,
              runs: 0,
              ballsFaced: 0,
              fours: 0,
              sixes: 0,
              isOut: false,
              runsConceded: 0,
              ballsBowled: 0,
              wickets: 0,
              maidens: 0
            };
          });
        }

        // Seed bowler stats record
        if (defendTeamObj) {
          const pObj = defendTeamObj.players.find(p => p.id === bowlId);
          state.secondInnings!.bowlingStats[bowlId] = {
            id: bowlId,
            name: pObj?.name || "Bowler",
            runs: 0,
            ballsFaced: 0,
            fours: 0,
            sixes: 0,
            isOut: false,
            runsConceded: 0,
            ballsBowled: 0,
            wickets: 0,
            maidens: 0
          };
        }
      }
    } else {
      // Innings 2 checking
      const target = state.firstInnings.runs + 1;
      const runs = innings.runs;

      if (runs >= target) {
        // Chasing team won
        state.status = "completed";
        state.winnerName = innings.teamName;
        updateTournamentFixtureStatus(state.matchId, "completed");
      } else if (inningsIsOver) {
        // Completed without passing target
        state.status = "completed";
        if (runs === target - 1) {
          state.winnerName = "Tie Match";
        } else {
          state.winnerName = state.firstInnings.teamName;
        }
        updateTournamentFixtureStatus(state.matchId, "completed");
      }
    }
  };

  const updateTournamentFixtureStatus = (mId: string, status: "scheduled" | "live" | "completed") => {
    const tournaments = localStorage.getItem("pranscric_tournaments");
    if (tournaments) {
      const parsed = JSON.parse(tournaments);
      parsed.forEach((t: any) => {
        const fx = t.fixtures.find((f: any) => f.matchId === mId);
        if (fx) fx.status = status;
      });
      localStorage.setItem("pranscric_tournaments", JSON.stringify(parsed));
    }
  };

  // Apply Score Event
  const applyScoreEvent = (runs: number, extraType: any = null) => {
    playClickSound(520, "triangle");
    
    // Save history for undo
    setHistory((prev) => [...prev, JSON.parse(JSON.stringify(match))]);

    // Build default names if stats mapping not yet completed
    if (battingTeam && (!currentInnings.currentBatter1Id || currentInnings.currentBatter1Id === "p-batter-1")) {
      if (battingTeam.players.length > 0) currentInnings.currentBatter1Id = battingTeam.players[0].id;
    }
    if (battingTeam && (!currentInnings.currentBatter2Id || currentInnings.currentBatter2Id === "p-batter-2")) {
      if (battingTeam.players.length > 1) currentInnings.currentBatter2Id = battingTeam.players[1].id;
    }
    if (bowlingTeam && (!currentInnings.currentBowlerId || currentInnings.currentBowlerId === "p-bowler-1")) {
      if (bowlingTeam.players.length > 0) currentInnings.currentBowlerId = bowlingTeam.players[0].id;
    }

    const updatedInnings = addBallToInnings(currentInnings, {
      runsBatter: runs,
      extraType,
      wicketType: null,
    });

    const nextMatch = { ...match };
    if (match.currentInningsNumber === 1) {
      nextMatch.firstInnings = updatedInnings;
    } else {
      nextMatch.secondInnings = updatedInnings;
    }

    processMatchTransitions(nextMatch);
    setMatch(nextMatch);
    saveMatch(nextMatch);
    setExtraRunsModifier(0); // Reset
  };

  // Log Wicket Action
  const handleWicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound(300, "sawtooth");
    
    setHistory((prev) => [...prev, JSON.parse(JSON.stringify(match))]);

    const victimId = dismissedPlayerId || currentInnings.currentBatter1Id;

    const updatedInnings = addBallToInnings(currentInnings, {
      runsBatter: 0,
      extraType: null,
      wicketType,
      dismissedPlayerId: victimId,
    });

    // Check if new batsman is available from dynamic team profile
    const activeBatters = Object.keys(updatedInnings.battingStats);
    const wicketsMax = match.wicketsLimit || (battingTeam && battingTeam.players.length > 0 ? Math.max(1, battingTeam.players.length - 1) : 10);
    
    if (updatedInnings.wickets < wicketsMax && battingTeam) {
      const nextAvailable = battingTeam.players.find((p) => !activeBatters.includes(p.id));
      if (nextAvailable) {
        if (victimId === updatedInnings.currentBatter1Id) {
          updatedInnings.currentBatter1Id = nextAvailable.id;
        } else {
          updatedInnings.currentBatter2Id = nextAvailable.id;
        }
        updatedInnings.battingStats[nextAvailable.id] = {
          id: nextAvailable.id,
          name: nextAvailable.name,
          runs: 0,
          ballsFaced: 0,
          fours: 0,
          sixes: 0,
          isOut: false,
          runsConceded: 0,
          ballsBowled: 0,
          wickets: 0,
          maidens: 0,
        };
      }
    }

    const nextMatch = { ...match };
    if (match.currentInningsNumber === 1) {
      nextMatch.firstInnings = updatedInnings;
    } else {
      nextMatch.secondInnings = updatedInnings;
    }

    processMatchTransitions(nextMatch);
    setMatch(nextMatch);
    saveMatch(nextMatch);
    setShowWicketModal(false);
  };

  // Undo scorer logs
  const handleUndo = () => {
    if (history.length === 0) return;
    playClickSound(400, "sine");
    const prevState = history[history.length - 1];
    setMatch(prevState);
    saveMatch(prevState);
    setHistory((prev) => prev.slice(0, -1));
  };

  // Complete/Finish match manually
  const handleFinishMatch = () => {
    if (confirm("Are you sure you want to finish this match and log the final scores?")) {
      playClickSound(580, "sine");
      const nextMatch = { ...match };
      nextMatch.status = "completed";

      const runs1 = nextMatch.firstInnings.runs;
      const runs2 = nextMatch.secondInnings?.runs || 0;
      if (runs2 > runs1) {
        nextMatch.winnerName = nextMatch.secondInnings?.teamName;
      } else {
        nextMatch.winnerName = nextMatch.firstInnings.teamName;
      }

      setMatch(nextMatch);
      saveMatch(nextMatch);
      updateTournamentFixtureStatus(match.matchId, "completed");
      window.location.href = "/";
    }
  };

  // Custom penalty runs adjust submit
  const handleCustomRunsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let parsedRuns = parseInt(customRunsValue);
    if (isNaN(parsedRuns) || !match) return;

    if (isCustomRunsNegative) {
      parsedRuns = -Math.abs(parsedRuns);
    } else {
      parsedRuns = Math.abs(parsedRuns);
    }

    playClickSound(500, "sine");
    setHistory((prev) => [...prev, JSON.parse(JSON.stringify(match))]);

    const updated = { ...currentInnings };
    updated.runs += parsedRuns;

    // Log penalty ball record
    const pId = "penalty-" + Math.random().toString(36).substring(2, 6);
    updated.balls.push({
      ballId: pId,
      overNumber: Math.floor(updated.ballsBowled / 6),
      ballNumber: (updated.ballsBowled % 6) + 1,
      batterId: updated.currentBatter1Id,
      batterName: "Team Adjustment",
      bowlerId: updated.currentBowlerId,
      bowlerName: "Official Adjustment",
      runsBatter: 0,
      runsExtras: parsedRuns,
      extraType: null,
      wicketType: null,
      commentary: `Platform Adjust: ${parsedRuns >= 0 ? "+" : ""}${parsedRuns} runs added. (${customRunsComment})`
    });

    const nextMatch = { ...match };
    if (match.currentInningsNumber === 1) {
      nextMatch.firstInnings = updated;
    } else {
      nextMatch.secondInnings = updated;
    }

    processMatchTransitions(nextMatch);
    setMatch(nextMatch);
    saveMatch(nextMatch);
    
    setCustomRunsValue("");
    setIsCustomRunsNegative(false);
    setShowCustomRunsModal(false);
  };

  // Select Bowlers / Batter rosters
  const selectBowler = (bowlerId: string) => {
    playClickSound(480, "sine");
    const updated = { ...currentInnings };
    updated.currentBowlerId = bowlerId;

    if (!updated.bowlingStats[bowlerId]) {
      const pObj = bowlingTeam?.players.find(p => p.id === bowlerId);
      updated.bowlingStats[bowlerId] = {
        id: bowlerId,
        name: pObj?.name || "Bowler",
        runs: 0,
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
        isOut: false,
        runsConceded: 0,
        ballsBowled: 0,
        wickets: 0,
        maidens: 0,
      };
    }

    const nextMatch = { ...match };
    if (match.currentInningsNumber === 1) {
      nextMatch.firstInnings = updated;
    } else {
      nextMatch.secondInnings = updated;
    }

    setMatch(nextMatch);
    saveMatch(nextMatch);
    setShowBowlerModal(false);
  };

  const selectBatter = (playerId: string) => {
    playClickSound(480, "sine");
    const updated = { ...currentInnings };
    if (batterTarget === "batter1") {
      updated.currentBatter1Id = playerId;
    } else {
      updated.currentBatter2Id = playerId;
    }

    if (updated.battingStats[playerId]) {
      // Clear retired hurt status since they are returning to bat
      updated.battingStats[playerId].isOut = false;
      delete updated.battingStats[playerId].dismissalType;
    } else {
      const pObj = battingTeam?.players.find(p => p.id === playerId);
      updated.battingStats[playerId] = {
        id: playerId,
        name: pObj?.name || "Batter",
        runs: 0,
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
        isOut: false,
        runsConceded: 0,
        ballsBowled: 0,
        wickets: 0,
        maidens: 0,
      };
    }

    const nextMatch = { ...match };
    if (match.currentInningsNumber === 1) {
      nextMatch.firstInnings = updated;
    } else {
      nextMatch.secondInnings = updated;
    }

    setMatch(nextMatch);
    saveMatch(nextMatch);
    setShowBatterModal(false);
  };

  const handleSwapBatter = () => {
    playClickSound(440, "sine");
    const updated = { ...currentInnings };
    const temp = updated.currentBatter1Id;
    updated.currentBatter1Id = updated.currentBatter2Id;
    updated.currentBatter2Id = temp;

    const nextMatch = { ...match };
    if (match.currentInningsNumber === 1) {
      nextMatch.firstInnings = updated;
    } else {
      nextMatch.secondInnings = updated;
    }
    setMatch(nextMatch);
    saveMatch(nextMatch);
  };

  const getRecentBalls = () => {
    const currentOverNum = Math.floor(currentInnings.ballsBowled / 6);
    return currentInnings.balls.filter(b => b.overNumber === currentOverNum);
  };

  const currentStriker = currentInnings.battingStats[currentInnings.currentBatter1Id] || 
    (battingTeam?.players.find(p => p.id === currentInnings.currentBatter1Id) 
      ? { id: currentInnings.currentBatter1Id, name: battingTeam.players.find(p => p.id === currentInnings.currentBatter1Id)?.name, runs: 0, ballsFaced: 0, fours: 0, sixes: 0 }
      : null);

  const currentNonStriker = currentInnings.battingStats[currentInnings.currentBatter2Id] || 
    (battingTeam?.players.find(p => p.id === currentInnings.currentBatter2Id) 
      ? { id: currentInnings.currentBatter2Id, name: battingTeam.players.find(p => p.id === currentInnings.currentBatter2Id)?.name, runs: 0, ballsFaced: 0, fours: 0, sixes: 0 }
      : null);

  const currentBowler = currentInnings.bowlingStats[currentInnings.currentBowlerId] || 
    (bowlingTeam?.players.find(p => p.id === currentInnings.currentBowlerId) 
      ? { id: currentInnings.currentBowlerId, name: bowlingTeam.players.find(p => p.id === currentInnings.currentBowlerId)?.name, wickets: 0, runsConceded: 0, ballsBowled: 0 }
      : null);

  return (
    <div className="relative min-h-screen flex flex-col font-inter text-white">
      <StadiumBackground />
      <Navigation />

      {match.status === "completed" ? (
        // Match Finished Congratulations view
        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass max-w-md w-full p-8 rounded-3xl border border-emerald-500/20 text-center shadow-2xl bg-emerald-500/5 relative overflow-hidden"
          >
            <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
            <Trophy className="h-14 w-14 text-gold mx-auto mb-4 animate-bounce" />
            
            <h2 className="font-space text-2xl font-bold tracking-tight text-white mb-2">Match Finished!</h2>
            <div className="my-4 py-2 border-y border-white/5 font-space text-lg font-bold text-emerald-400 uppercase tracking-widest">
              Winner: {match.winnerName || "Tie"}
            </div>

            <div className="space-y-2 mb-6 text-xs text-text-secondary font-mono">
              <div className="flex justify-between">
                <span>{match.firstInnings.teamName}</span>
                <span className="text-white font-bold">{match.firstInnings.runs}/{match.firstInnings.wickets}</span>
              </div>
              {match.secondInnings && (
                <div className="flex justify-between">
                  <span>{match.secondInnings.teamName}</span>
                  <span className="text-white font-bold">{match.secondInnings.runs}/{match.secondInnings.wickets}</span>
                </div>
              )}
            </div>

            <Link
              href="/"
              className="bg-gradient-to-r from-gold to-yellow-600 text-black px-6 py-2.5 rounded-full text-xs font-bold font-space uppercase tracking-wider block hover:opacity-90"
            >
              Back to Homepage
            </Link>
          </motion.div>
        </div>
      ) : (
        // Active scoring console
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs text-text-secondary hover:text-white mb-2 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
              </Link>
              <div className="flex items-center gap-3">
                <h1 className="font-space text-2xl font-bold tracking-tight">Scorer Console</h1>
                <span className="text-[10px] uppercase font-mono tracking-wider text-gold font-bold bg-gold/10 px-2 py-0.5 rounded-full border border-gold/10">
                  Live scoring
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleUndo}
                disabled={history.length === 0}
                className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
              >
                <Undo className="h-3.5 w-3.5" /> Undo Ball
              </button>
              <button
                onClick={handleFinishMatch}
                className="flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full px-5 py-2 text-xs font-bold hover:opacity-90 transition-all cursor-pointer shadow-md shadow-emerald-500/10"
              >
                Finish Match
              </button>
            </div>
          </div>

          {/* Warning banner */}
          {(!battingTeam || battingTeam.players.length < 2 || !bowlingTeam || bowlingTeam.players.length === 0) && (
            <div className="bg-red-500/10 border border-red-500/25 p-5 rounded-[22px] flex items-start gap-4 text-xs text-red-300">
              <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-sm mb-1">Roster Requirements Incomplete!</span>
                <p className="leading-relaxed">
                  Please make sure both teams in this fixture have players added in the tournament manager. 
                  Batting team requires at least **2 players** and bowling team requires at least **1 bowler** to begin scoring.
                </p>
                <Link
                  href="/tournament/create"
                  className="mt-3 inline-block bg-red-500/20 hover:bg-red-500/35 border border-red-500/30 text-white font-bold px-4 py-1.5 rounded-xl transition-colors"
                >
                  Go to Tournament Dashboard
                </Link>
              </div>
            </div>
          )}

          {/* Toss & Match Category Details Banner */}
          <div className="flex flex-wrap justify-between items-center gap-3 bg-white/5 border border-white/5 px-6 py-3.5 rounded-[22px] text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-gold bg-gold/10 border border-gold/20 px-2 py-0.5 rounded">
                {match.matchCategory || "League Match"}
              </span>
              <span className="text-text-secondary">Venue:</span>
              <span className="text-white font-bold">{match.ground || "TBD"}</span>
            </div>
            
            {match.isTossCompleted && (
              <div className="flex items-center gap-2">
                <span className="text-text-secondary">Toss Winner:</span>
                <span className="text-gold font-bold uppercase">
                  {match.tossWinnerName} elected to {match.tossDecision} first
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

          {/* Scores summary bar */}
          <div className="glass rounded-[22px] border border-white/10 p-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
            <div className="flex items-center gap-4">
              <span className="text-sm font-mono text-text-secondary uppercase">Live Scorecard:</span>
              <div className="flex items-baseline gap-2">
                <span className="font-space text-xl font-bold">{currentInnings.teamName}</span>
                <span className="ledger-font text-2xl font-bold text-gold">
                  {currentInnings.runs}/{currentInnings.wickets}
                </span>
                <span className="text-xs text-text-secondary font-mono">
                  ({ballsToOvers(currentInnings.ballsBowled)} / {currentInnings.oversLimit} ov)
                </span>
              </div>
            </div>

            {/* Target and RRR info */}
            {match.currentInningsNumber === 2 && (
              <div className="text-xs text-gold font-bold uppercase tracking-wider font-space">
                Target: {match.firstInnings.runs + 1} | Needs {match.firstInnings.runs + 1 - currentInnings.runs} runs off {(match.oversLimit * 6) - currentInnings.ballsBowled} balls
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono text-text-secondary">Current Over:</span>
              <div className="flex flex-wrap gap-1.5">
                {getRecentBalls().length === 0 ? (
                  <span className="text-xs text-text-secondary">Waiting for first delivery...</span>
                ) : (
                  getRecentBalls().map((ball) => {
                    const isPenalty = ball.ballId.startsWith("penalty-");
                    let badge = "bg-white/5 text-white";
                    if (isPenalty) {
                      badge = ball.runsExtras >= 0 
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 font-extrabold" 
                        : "bg-purple-500/20 text-purple-400 border border-purple-500/30 font-extrabold animate-pulse";
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
                        className={`h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold ${badge}`}
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
                  })
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 space-y-6">
              
              {/* 1. Runs off bat */}
              <div className="glass p-6 rounded-[22px] border border-white/5">
                <h3 className="font-space text-sm font-bold text-white mb-4 uppercase tracking-wider">
                  Runs Off Bat (Legal deliveries)
                </h3>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                  {[
                    { label: "Dot", val: 0 },
                    { label: "1 Run", val: 1 },
                    { label: "2 Runs", val: 2 },
                    { label: "3 Runs", val: 3 },
                    { label: "4 Run (Four)", val: 4 },
                    { label: "5 Runs", val: 5 },
                    { label: "6 Run (Six)", val: 6 },
                  ].map((run) => (
                    <button
                      key={run.val}
                      onClick={() => applyScoreEvent(run.val)}
                      className="h-14 rounded-2xl bg-secondary border border-white/5 hover:border-gold/30 text-white flex flex-col justify-center items-center hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
                    >
                      <span className="font-sora text-lg font-bold">{run.val}</span>
                      <span className="text-[9px] text-text-secondary mt-0.5">{run.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Extras Modifiers Panel */}
              <div className="glass p-6 rounded-[22px] border border-white/5 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="font-space text-sm font-bold text-white uppercase tracking-wider">
                    Extras & Boundary Modifiers
                  </h3>
                  
                  {/* Additional runs selector */}
                  <div className="flex items-center gap-2 bg-[#171717] p-1.5 rounded-full border border-white/5 text-xs font-mono">
                    <span className="text-[10px] text-text-secondary px-2.5">Additional Runs:</span>
                    <select
                      value={extraRunsModifier}
                      onChange={(e) => setExtraRunsModifier(parseInt(e.target.value) || 0)}
                      className="bg-secondary text-xs text-white border border-white/10 rounded-full px-3 py-1 outline-none font-sora cursor-pointer hover:border-gold/50"
                    >
                      <option value="0">+0 runs</option>
                      <option value="1">+1 run</option>
                      <option value="2">+2 runs</option>
                      <option value="3">+3 runs</option>
                      <option value="4">+4 runs (Boundary)</option>
                      <option value="5">+5 runs</option>
                      <option value="6">+6 runs (Maximum)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Wide Ball", type: "wide" },
                    { label: "No Ball (Free Hit)", type: "noball" },
                    { label: "Byes", type: "bye" },
                    { label: "Leg Byes", type: "legbye" },
                  ].map((extra) => {
                    const totalRunsValue = extra.type === "wide" || extra.type === "noball" 
                      ? extraRunsModifier 
                      : extraRunsModifier; // modifier sets runsBatter
                    
                    return (
                      <button
                        key={extra.type}
                        onClick={() => applyScoreEvent(totalRunsValue, extra.type as any)}
                        className="h-16 rounded-2xl bg-secondary border border-white/5 hover:border-blue/30 text-white flex flex-col justify-center items-center hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
                      >
                        <span className="font-space text-xs font-bold uppercase tracking-wider text-blue mb-1">
                          {extra.type}
                        </span>
                        <span className="text-[9px] text-text-secondary">
                          {extra.label} {extraRunsModifier > 0 ? `(+${extraRunsModifier})` : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Wicket, Strike rotation, Custom Penalty */}
              <div className="glass p-6 rounded-[22px] border border-white/5 flex flex-wrap gap-4 items-center">                <button
                  onClick={() => {
                    playClickSound(330, "sawtooth");
                    setDismissedPlayerId(currentInnings.currentBatter1Id);
                    if (isFreeHit) {
                      setWicketType("runout");
                    } else {
                      setWicketType("bowled");
                    }
                    setShowWicketModal(true);
                  }}
                  className="flex-1 min-w-[150px] h-14 rounded-2xl bg-red-500/10 border border-red-500/25 hover:bg-red-500/20 text-red-400 font-space font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  <ShieldAlert className="h-5 w-5" /> Dismiss Wicket ({currentInnings.wickets}/{maxWickets})
                </button>

                <button
                  onClick={handleSwapBatter}
                  className="flex-1 min-w-[120px] h-14 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-space font-bold uppercase tracking-wider text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  Rotate Strike
                </button>

                <button
                  onClick={() => {
                    playClickSound(480, "sine");
                    setShowCustomRunsModal(true);
                  }}
                  className="flex-1 min-w-[150px] h-14 rounded-2xl bg-gold/10 border border-gold/25 hover:bg-gold/20 text-gold font-space font-bold uppercase tracking-wider text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  <PlusCircle className="h-5 w-5" /> Custom Adjust / Penalty
                </button>
              </div>

            </div>

            <div className="space-y-6">
              
              {/* Batters */}
              <div className="glass p-6 rounded-[22px] border border-white/5">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-space text-sm font-bold text-gold uppercase tracking-wider">
                    Batting Roster
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Striker */}
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex justify-between items-center relative">
                    <div className="absolute top-2 left-2 text-[8px] font-mono uppercase bg-gold text-black font-extrabold px-1.5 py-0.25 rounded">
                      Striker
                    </div>
                    <div className="pt-2">
                      <span className="font-semibold text-white block text-sm">
                        {currentStriker?.name || "Unselected Batter"}
                      </span>
                      <button
                        onClick={() => {
                          setBatterTarget("batter1");
                          setShowBatterModal(true);
                        }}
                        className="text-[10px] text-gold font-mono mt-1 hover:underline"
                      >
                        Change Striker
                      </button>
                    </div>
                    <div className="text-right pt-2">
                      <span className="font-sora font-extrabold text-white text-lg block">
                        {currentStriker?.runs || 0}
                      </span>
                      <span className="text-[10px] text-text-secondary block">
                        {currentStriker?.ballsFaced || 0} balls
                      </span>
                    </div>
                  </div>

                  {/* Non-Striker */}
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex justify-between items-center relative opacity-70">
                    <div className="absolute top-2 left-2 text-[8px] font-mono uppercase bg-white/10 text-white px-1.5 py-0.25 rounded">
                      Non-Striker
                    </div>
                    <div className="pt-2">
                      <span className="font-semibold text-white block text-sm">
                        {currentNonStriker?.name || "Unselected Batter"}
                      </span>
                      <button
                        onClick={() => {
                          setBatterTarget("batter2");
                          setShowBatterModal(true);
                        }}
                        className="text-[10px] text-gold font-mono mt-1 hover:underline"
                      >
                        Change Non-Striker
                      </button>
                    </div>
                    <div className="text-right pt-2">
                      <span className="font-sora font-semibold text-white text-base block">
                        {currentNonStriker?.runs || 0}
                      </span>
                      <span className="text-[10px] text-text-secondary block">
                        {currentNonStriker?.ballsFaced || 0} balls
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bowler */}
              <div className="glass p-6 rounded-[22px] border border-white/5">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-space text-sm font-bold text-blue uppercase tracking-wider">
                    Active Bowler
                  </h3>
                  <button
                    onClick={() => setShowBowlerModal(true)}
                    className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white"
                    title="Change Bowler"
                  >
                    <UserPlus className="h-4 w-4" />
                  </button>
                </div>

                <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-white block text-sm">
                      {currentBowler?.name || "Unselected Bowler"}
                    </span>
                    <button
                      onClick={() => setShowBowlerModal(true)}
                      className="text-[10px] text-blue font-mono mt-1 hover:underline"
                    >
                      Change Bowler
                  </button>
                </div>
                <div className="text-right">
                  <span className="font-sora font-extrabold text-white text-lg block">
                    {currentBowler?.wickets || 0} - {currentBowler?.runsConceded || 0}
                  </span>
                  <span className="text-[10px] text-text-secondary block">
                    {ballsToOvers(currentBowler?.ballsBowled || 0)} overs
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
      )}

      {/* WICKET MODAL */}
      <AnimatePresence>
        {showWicketModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass max-w-sm w-full p-6 rounded-3xl border border-white/10 shadow-2xl relative"
             >
              <h3 className="font-space text-lg font-bold text-red-400 mb-2">Record Dismissal</h3>
              
              {isFreeHit && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mb-4 text-yellow-300 text-xs font-semibold flex items-center gap-2">
                  <span className="animate-pulse w-2 h-2 rounded-full bg-yellow-400"></span>
                  Free Hit! Only Run Out & Retired Hurt are allowed.
                </div>
              )}

              <form onSubmit={handleWicketSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-text-secondary mb-2">
                    Dismissed Player
                  </label>
                  <select
                    value={dismissedPlayerId}
                    onChange={(e) => setDismissedPlayerId(e.target.value)}
                    className="w-full bg-secondary text-sm border border-white/10 rounded-xl px-3 py-2.5 outline-none focus:border-red-400 cursor-pointer text-white"
                  >
                    {currentStriker && <option value={currentStriker.id}>{currentStriker.name} (Striker)</option>}
                    {currentNonStriker && <option value={currentNonStriker.id}>{currentNonStriker.name} (Non-Striker)</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-text-secondary mb-2">
                    Dismissal Type
                  </label>
                  <select
                    value={wicketType}
                    onChange={(e) => setWicketType(e.target.value as any)}
                    className="w-full bg-secondary text-sm border border-white/10 rounded-xl px-3 py-2.5 outline-none focus:border-red-400 cursor-pointer text-white"
                  >
                    <option value="bowled" disabled={isFreeHit}>Bowled {isFreeHit && "(Disabled - Free Hit)"}</option>
                    <option value="caught" disabled={isFreeHit}>Caught {isFreeHit && "(Disabled - Free Hit)"}</option>
                    <option value="lbw" disabled={isFreeHit}>LBW {isFreeHit && "(Disabled - Free Hit)"}</option>
                    <option value="runout">Run Out</option>
                    <option value="stumped" disabled={isFreeHit}>Stumped {isFreeHit && "(Disabled - Free Hit)"}</option>
                    <option value="hitwicket" disabled={isFreeHit}>Hit Wicket {isFreeHit && "(Disabled - Free Hit)"}</option>
                    <option value="retired_hurt">Retired Hurt</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowWicketModal(false)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-full py-2.5 text-xs font-bold hover:bg-white/10 text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-red-500 text-white rounded-full py-2.5 text-xs font-bold hover:opacity-90"
                  >
                    Confirm
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BOWLER SELECTION MODAL */}
      <AnimatePresence>
        {showBowlerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass max-w-sm w-full p-6 rounded-3xl border border-white/10 shadow-2xl"
            >
              <h3 className="font-space text-lg font-bold text-white mb-4">Choose Bowler</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {bowlingTeam?.players.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => selectBowler(player.id)}
                    className="w-full text-left bg-white/5 hover:bg-white/10 p-3 rounded-xl border border-white/5 flex justify-between items-center text-xs"
                  >
                    <div>
                      <span className="font-semibold text-white block">{player.name}</span>
                      <span className="text-[10px] text-text-secondary font-mono">{player.role}</span>
                    </div>
                  </button>
                ))}
                {(!bowlingTeam || bowlingTeam.players.length === 0) && (
                  <p className="text-xs text-text-secondary">No players in bowling team squad.</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowBowlerModal(false)}
                className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 text-xs font-bold mt-4 hover:bg-white/10"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BATTER SELECTION MODAL */}
      <AnimatePresence>
        {showBatterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass max-w-sm w-full p-6 rounded-3xl border border-white/10 shadow-2xl"
            >
              <h3 className="font-space text-lg font-bold text-white mb-4">Choose Batter</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {battingTeam?.players
                  .filter((player) => {
                    const stats = currentInnings.battingStats[player.id];
                    if (stats && stats.isOut) {
                      return false;
                    }
                    if (batterTarget === "batter1") {
                      return player.id !== currentInnings.currentBatter2Id;
                    } else if (batterTarget === "batter2") {
                      return player.id !== currentInnings.currentBatter1Id;
                    }
                    return true;
                  })
                  .map((player) => (
                    <button
                      key={player.id}
                      onClick={() => selectBatter(player.id)}
                      className="w-full text-left bg-white/5 hover:bg-white/10 p-3 rounded-xl border border-white/5 flex justify-between items-center text-xs"
                    >
                      <div>
                        <span className="font-semibold text-white block">{player.name}</span>
                        <span className="text-[10px] text-text-secondary font-mono">{player.role}</span>
                      </div>
                    </button>
                  ))}
                {(!battingTeam || battingTeam.players.length === 0) && (
                  <p className="text-xs text-text-secondary">No players in batting team squad.</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowBatterModal(false)}
                className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 text-xs font-bold mt-4 hover:bg-white/10"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM RUNS / PENALTY ADJUST MODAL */}
      <AnimatePresence>
        {showCustomRunsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass max-w-sm w-full p-6 rounded-3xl border border-white/10 shadow-2xl relative"
            >
              <h3 className="font-space text-lg font-bold text-gold mb-4">Custom Score Adjust</h3>

              <form onSubmit={handleCustomRunsSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-text-secondary mb-2">
                    Runs to Adjust
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCustomRunsNegative((prev) => !prev)}
                      className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
                        isCustomRunsNegative
                          ? "bg-red-500/20 text-red-400 border-red-500/30"
                          : "bg-green-500/20 text-green-400 border-green-500/30"
                      }`}
                      title="Click to toggle Add (+) vs Deduct (-)"
                    >
                      {isCustomRunsNegative ? "Deduct (-)" : "Add (+)"}
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                      placeholder="e.g. 5"
                      value={customRunsValue}
                      onChange={(e) => {
                        let val = e.target.value;
                        val = val.replace(/[.,\-]/g, "");
                        if (/^\d*$/.test(val)) {
                          setCustomRunsValue(val);
                        }
                      }}
                      className="flex-1 bg-secondary border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-gold/50 outline-none text-white text-center font-bold font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-text-secondary mb-2">
                    Adjustment Reason / Comment
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Penalty Runs"
                    value={customRunsComment}
                    onChange={(e) => setCustomRunsComment(e.target.value)}
                    className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-gold/50 outline-none text-white"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCustomRunsModal(false)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-full py-2.5 text-xs font-bold hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gold text-black rounded-full py-2.5 text-xs font-bold hover:opacity-90"
                  >
                    Apply Adjustment
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
