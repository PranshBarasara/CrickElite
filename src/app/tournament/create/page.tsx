"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Plus, Calendar, MapPin, Trophy, Shield, CalendarCheck, Share2, Clipboard, ChevronRight, Users, Trash2, UserPlus, FileText, Lock, Edit } from "lucide-react";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import StadiumBackground from "@/components/background/StadiumBackground";
import { MockTournament, getTournaments, saveTournament, getTeams, saveTeam, getMatches, saveMatch, deleteMatch, getActiveUser, MockTeam, MockPlayer, deleteTournament, resetAllData } from "@/lib/mockData";
import { MatchState } from "@/lib/scorerEngine";

export default function CreateTournamentPage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [activeTournament, setActiveTournament] = useState<MockTournament | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Tournament Wizard Form Inputs
  const [orgName, setOrgName] = useState("Vanguard Sports Club");
  const [tournamentName, setTournamentName] = useState("Super 6 T20 Championship");
  const [location, setLocation] = useState("Cape Town, South Africa");
  const [ground, setGround] = useState("Newlands Stadium");
  const [overs, setOvers] = useState(20);
  const [teamsLimit, setTeamsLimit] = useState(6);
  const [rules, setRules] = useState("Standard T20 Rules. 20 Overs per side. Bowler limit 4 overs.");

  // Teams in the active tournament
  const [tournamentTeams, setTournamentTeams] = useState<MockTeam[]>([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamLogo, setNewTeamLogo] = useState("🏏");

  // Player Form state (for selected team)
  const [selectedTeamIdForPlayer, setSelectedTeamIdForPlayer] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [playerRole, setPlayerRole] = useState<"Batsman" | "Bowler" | "All-Rounder" | "Wicketkeeper">("Batsman");
  const [playerPhoto, setPlayerPhoto] = useState("");

  // Fixture Scheduler Input
  const [fixtureTeam1Id, setFixtureTeam1Id] = useState("");
  const [fixtureTeam2Id, setFixtureTeam2Id] = useState("");
  const [fixtureDate, setFixtureDate] = useState("");
  const [fixtureTime, setFixtureTime] = useState("");

  // Custom Fixture options
  const [fixtureCategory, setFixtureCategory] = useState<"League Match" | "Semi-Final" | "Final" | "Super Over">("League Match");
  const [fixtureOvers, setFixtureOvers] = useState("");
  const [fixtureWickets, setFixtureWickets] = useState("");
  const [fixtureTeam1CaptainId, setFixtureTeam1CaptainId] = useState("");
  const [fixtureTeam2CaptainId, setFixtureTeam2CaptainId] = useState("");

  // Fixture Edit State
  const [editingFixtureId, setEditingFixtureId] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");

  // Player Editing States
  const [editingPlayerId, setEditingPlayerId] = useState("");
  const [editingPlayerTeamId, setEditingPlayerTeamId] = useState("");
  const [editPlayerName, setEditPlayerName] = useState("");
  const [editPlayerRole, setEditPlayerRole] = useState<"Batsman" | "Bowler" | "All-Rounder" | "Wicketkeeper">("Batsman");
  const [editPlayerPhoto, setEditPlayerPhoto] = useState("");

  // Team Editing States
  const [editingTeamId, setEditingTeamId] = useState("");
  const [editTeamName, setEditTeamName] = useState("");
  const [editTeamLogo, setEditTeamLogo] = useState("🏏");

  // Helper to get local date string YYYY-MM-DD
  const getLocalDateString = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - (offset * 60 * 1000));
    return local.toISOString().split("T")[0];
  };

  // Check auth
  useEffect(() => {
    const auth = localStorage.getItem("pranscric_auth_token");
    if (auth === "authorized_elite") {
      setIsAuthorized(true);
      // Look for any existing tournaments
      const existing = getTournaments();
      if (existing.length > 0) {
        setStep(0); // Show selector portal
        setActiveTournament(null);
      } else {
        setStep(1); // Go to creator wizard
        setActiveTournament(null);
      }
    }
    setLoading(false);
  }, []);

  // Load tournament-specific teams whenever tournament changes
  useEffect(() => {
    if (activeTournament) {
      const currentUser = getActiveUser();
      const isOwner = (currentUser === "DDUGroundCricket" && activeTournament.organizer === "DDUGroundCricket") ||
                      (currentUser === "CrickElite" && activeTournament.organizer !== "DDUGroundCricket");
      
      if (!isOwner) {
        setActiveTournament(null);
        setStep(0);
        alert("Access Denied: You do not have permission to manage this tournament.");
        return;
      }

      const allTeams = getTeams();
      const filtered = allTeams.filter(t => activeTournament.teams.includes(t.id));
      setTournamentTeams(filtered);
      if (!fixtureOvers) {
        setFixtureOvers(activeTournament.overs.toString());
      }
      if (!fixtureWickets) {
        setFixtureWickets("10");
      }
    }
  }, [activeTournament]);

  if (loading) return null;

  // Authorization Block
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
              Please authenticate using the **Login Console** in the header section with admin credentials (User ID and Security Code) to access tournament builders.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Create Tournament Wizard Submit
  const handleCreateTournament = (e: React.FormEvent) => {
    e.preventDefault();
    const tCode = "PC-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    const tPassword = Math.floor(100000 + Math.random() * 900000).toString();
    const tId = "t-" + Math.random().toString(36).substring(2, 7);

    const newTournament: MockTournament = {
      id: tId,
      name: tournamentName,
      organizer: orgName,
      location,
      ground,
      overs,
      teams: [], // Empty initially, added dynamically!
      fixtures: [], // Scheduled dynamically!
      code: tCode,
      passwordHash: tPassword
    };

    saveTournament(newTournament);
    setActiveTournament(newTournament);
    setStep(3); // Enter dashboard
  };

  // Add Team Handler
  const handleAddTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || !activeTournament) return;

    const tId = "team-" + Math.random().toString(36).substring(2, 7);
    const newTeam: MockTeam = {
      id: tId,
      name: newTeamName,
      logo: newTeamLogo,
      captain: "",
      coach: "",
      players: []
    };

    saveTeam(newTeam);

    // Link team to active tournament
    const updatedTournament = { ...activeTournament };
    updatedTournament.teams.push(tId);
    saveTournament(updatedTournament);
    setActiveTournament(updatedTournament);

    setNewTeamName("");
    setNewTeamLogo("🏏");
  };

  // Add Player Handler
  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !selectedTeamIdForPlayer) return;

    const pId = "p-" + Math.random().toString(36).substring(2, 7);
    const newPlayer: MockPlayer = {
      id: pId,
      name: playerName,
      role: playerRole,
      battingStyle: "Right-hand bat",
      bowlingStyle: playerRole === "Bowler" ? "Right-arm fast" : "None",
      photoUrl: playerPhoto.trim() || "/profile.jpg"
    };

    const team = tournamentTeams.find(t => t.id === selectedTeamIdForPlayer);
    if (team) {
      const updatedTeam = { ...team };
      updatedTeam.players.push(newPlayer);
      saveTeam(updatedTeam);

      // Refresh list
      const allTeams = getTeams();
      const filtered = allTeams.filter(t => activeTournament!.teams.includes(t.id));
      setTournamentTeams(filtered);

      setPlayerName("");
      setPlayerPhoto("");
      setSelectedTeamIdForPlayer("");
    }
  };

  // Schedule Fixture Handler
  const handleScheduleFixture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fixtureTeam1Id || !fixtureTeam2Id || fixtureTeam1Id === fixtureTeam2Id || !activeTournament) return;

    const team1Obj = tournamentTeams.find(t => t.id === fixtureTeam1Id);
    const team2Obj = tournamentTeams.find(t => t.id === fixtureTeam2Id);
    if (!team1Obj || !team2Obj) return;

    const mId = "match-" + Math.random().toString(36).substring(2, 7);

    // Save fixture detail inside tournament list
    const updatedTournament = { ...activeTournament };
    updatedTournament.fixtures.push({
      matchId: mId,
      round: fixtureCategory,
      team1: team1Obj.name,
      team2: team2Obj.name,
      date: fixtureDate,
      time: fixtureTime,
      status: "scheduled"
    });
    saveTournament(updatedTournament);
    setActiveTournament(updatedTournament);

    // Calculate match settings
    const parsedOvers = parseInt(fixtureOvers) || activeTournament.overs;
    
    // Validate custom wickets
    const maxWicketsLimitTeam1 = Math.max(1, team1Obj.players.length - 1);
    const maxWicketsLimitTeam2 = Math.max(1, team2Obj.players.length - 1);
    const calculatedMaxWickets = Math.min(maxWicketsLimitTeam1, maxWicketsLimitTeam2);
    
    let parsedWickets = 10;
    if (fixtureWickets) {
      const inputW = parseInt(fixtureWickets);
      if (!isNaN(inputW) && inputW > 0) {
        parsedWickets = Math.min(inputW, calculatedMaxWickets);
      }
    } else {
      parsedWickets = Math.min(10, calculatedMaxWickets);
    }

    const team1CaptainObj = team1Obj.players.find(p => p.id === fixtureTeam1CaptainId);
    const team2CaptainObj = team2Obj.players.find(p => p.id === fixtureTeam2CaptainId);

    // Create MatchState
    const newMatchState: MatchState = {
      matchId: mId,
      team1Name: team1Obj.name,
      team2Name: team2Obj.name,
      tossWinner: team1Obj.name,
      tossDecision: "bat",
      oversLimit: parsedOvers,
      status: "scheduled",
      currentInningsNumber: 1,
      ground: activeTournament.ground,
      matchDate: fixtureDate,
      matchTime: fixtureTime,
      matchCategory: fixtureCategory,
      team1CaptainName: team1CaptainObj?.name || "TBD",
      team2CaptainName: team2CaptainObj?.name || "TBD",
      wicketsLimit: parsedWickets,
      firstInnings: {
        teamName: team1Obj.name,
        runs: 0,
        wickets: 0,
        ballsBowled: 0,
        oversLimit: parsedOvers,
        currentBatter1Id: team1Obj.players[0]?.id || "p-batter-1",
        currentBatter2Id: team1Obj.players[1]?.id || "p-batter-2",
        currentBowlerId: team2Obj.players.find(p => p.role === "Bowler")?.id || team2Obj.players[0]?.id || "p-bowler-1",
        extras: { wides: 0, noballs: 0, byes: 0, legbyes: 0 },
        battingStats: {},
        bowlingStats: {},
        balls: []
      },
      history: []
    };

    // Prepopulate batting stats keys for MatchState
    team1Obj.players.slice(0, 2).forEach(p => {
      newMatchState.firstInnings.battingStats[p.id] = {
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

    const activeBowlerId = newMatchState.firstInnings.currentBowlerId;
    const bowlerObj = team2Obj.players.find(p => p.id === activeBowlerId);
    if (bowlerObj) {
      newMatchState.firstInnings.bowlingStats[activeBowlerId] = {
        id: activeBowlerId,
        name: bowlerObj.name,
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

    saveMatch(newMatchState);

    // Reset Form
    setFixtureTeam1Id("");
    setFixtureTeam2Id("");
    setFixtureDate("");
    setFixtureTime("");
    setFixtureCategory("League Match");
    setFixtureOvers("");
    setFixtureWickets("");
    setFixtureTeam1CaptainId("");
    setFixtureTeam2CaptainId("");
  };

  // Start scoring match handler
  const handleStartMatch = (matchId: string) => {
    // Set match status to live
    const matches = getMatches();
    const targetMatch = matches.find(m => m.matchId === matchId);
    if (targetMatch) {
      targetMatch.status = "live";
      saveMatch(targetMatch);

      // Update tournament fixture list status to live
      if (activeTournament) {
        const updatedTournament = { ...activeTournament };
        const fixture = updatedTournament.fixtures.find(f => f.matchId === matchId);
        if (fixture) {
          fixture.status = "live";
        }
        saveTournament(updatedTournament);
        setActiveTournament(updatedTournament);
      }
    }
  };

  const handleDeleteFixture = (matchId: string) => {
    if (!activeTournament) return;
    if (confirm("Are you sure you want to delete this match record? This action cannot be undone.")) {
      deleteMatch(matchId);
      
      const updatedT = { ...activeTournament };
      updatedT.fixtures = updatedT.fixtures.filter(f => f.matchId !== matchId);
      setActiveTournament(updatedT);
    }
  };

  const handleSaveEditFixture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTournament || !editingFixtureId) return;

    // 1. Update tournament fixtures
    const updatedT = { ...activeTournament };
    const fx = updatedT.fixtures.find(f => f.matchId === editingFixtureId);
    if (fx) {
      fx.date = editDate;
      fx.time = editTime;
    }
    saveTournament(updatedT);
    setActiveTournament(updatedT);

    // 2. Update global MatchState
    const allMatches = getMatches();
    const matchObj = allMatches.find(m => m.matchId === editingFixtureId);
    if (matchObj) {
      matchObj.matchDate = editDate;
      matchObj.matchTime = editTime;
      saveMatch(matchObj);
    }

  };

  const handleSaveEditPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTournament || !editingPlayerId || !editingPlayerTeamId) return;

    const allTeams = getTeams();
    const team = allTeams.find(t => t.id === editingPlayerTeamId);
    if (team) {
      const updatedTeam = { ...team };
      const targetPlayer = updatedTeam.players.find(p => p.id === editingPlayerId);
      if (targetPlayer) {
        targetPlayer.name = editPlayerName;
        targetPlayer.role = editPlayerRole;
        targetPlayer.photoUrl = editPlayerPhoto;
      }
      saveTeam(updatedTeam);

      // Refresh list
      const updatedAllTeams = getTeams();
      const filtered = updatedAllTeams.filter(t => activeTournament.teams.includes(t.id));
      setTournamentTeams(filtered);
    }

    // Reset edit state
    setEditingPlayerId("");
    setEditingPlayerTeamId("");
    setEditPlayerName("");
    setEditPlayerRole("Batsman");
    setEditPlayerPhoto("");
  };

  const handleDeleteTeam = (teamId: string) => {
    if (!activeTournament) return;
    
    const team = tournamentTeams.find(t => t.id === teamId);
    if (!team) return;
    
    if (confirm(`Are you sure you want to delete "${team.name}"? This will delete all players and any scheduled/completed match fixtures containing this team.`)) {
      // 1. Remove team from tournament teams list
      const updatedT = { ...activeTournament };
      updatedT.teams = updatedT.teams.filter(id => id !== teamId);
      
      // 2. Identify and delete all fixtures containing this team
      const fixturesToDelete = updatedT.fixtures.filter(f => f.team1 === team.name || f.team2 === team.name);
      updatedT.fixtures = updatedT.fixtures.filter(f => f.team1 !== team.name && f.team2 !== team.name);
      
      saveTournament(updatedT);
      setActiveTournament(updatedT);
      
      // Delete corresponding global matches
      fixturesToDelete.forEach(f => {
        deleteMatch(f.matchId);
      });
      
      // 3. Remove team object from global teams database
      const allTeams = getTeams();
      const filteredTeams = allTeams.filter(t => t.id !== teamId);
      const currentUser = getActiveUser() || "CrickElite";
      localStorage.setItem(`${currentUser}_teams`, JSON.stringify(filteredTeams));
      localStorage.removeItem("pranscric_teams"); // clean legacy
      
      // Refresh list
      const filtered = filteredTeams.filter(t => updatedT.teams.includes(t.id));
      setTournamentTeams(filtered);
      window.dispatchEvent(new Event("storage"));
    }
  };

  const handleSaveEditTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTournament || !editingTeamId || !editTeamName.trim()) return;
    
    const allTeams = getTeams();
    const team = allTeams.find(t => t.id === editingTeamId);
    if (team) {
      const oldName = team.name;
      const newName = editTeamName.trim();
      
      // Update team details
      const updatedTeam = { ...team, name: newName, logo: editTeamLogo };
      saveTeam(updatedTeam);
      
      // Cascade name changes inside tournament fixtures and global matches list
      const updatedTournament = { ...activeTournament };
      updatedTournament.fixtures = updatedTournament.fixtures.map(f => {
        let t1 = f.team1;
        let t2 = f.team2;
        if (f.team1 === oldName) t1 = newName;
        if (f.team2 === oldName) t2 = newName;
        return { ...f, team1: t1, team2: t2 };
      });
      saveTournament(updatedTournament);
      setActiveTournament(updatedTournament);
      
      // Rename inside global matches
      const allMatches = getMatches();
      allMatches.forEach(m => {
        let updated = false;
        const nextM = { ...m };
        if (nextM.team1Name === oldName) {
          nextM.team1Name = newName;
          updated = true;
        }
        if (nextM.team2Name === oldName) {
          nextM.team2Name = newName;
          updated = true;
        }
        if (nextM.firstInnings && nextM.firstInnings.teamName === oldName) {
          nextM.firstInnings.teamName = newName;
          updated = true;
        }
        if (nextM.secondInnings && nextM.secondInnings.teamName === oldName) {
          nextM.secondInnings.teamName = newName;
          updated = true;
        }
        if (nextM.winnerName === oldName) {
          nextM.winnerName = newName;
          updated = true;
        }
        if (updated) {
          saveMatch(nextM);
        }
      });
      
      // Refresh list
      const refreshedAllTeams = getTeams();
      const filtered = refreshedAllTeams.filter(t => updatedTournament.teams.includes(t.id));
      setTournamentTeams(filtered);
      window.dispatchEvent(new Event("storage"));
    }
    
    // Reset state
    setEditingTeamId("");
    setEditTeamName("");
    setEditTeamLogo("🏏");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="relative min-h-screen flex flex-col font-inter text-white">
      <StadiumBackground />
      <Navigation />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        {step === 0 ? (
          // Tournament Selection Portal (Admin Home)
          <div className="max-w-4xl mx-auto w-full pt-6 space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-xs text-text-secondary hover:text-white mb-2 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
                </Link>
                <h1 className="font-space text-3xl font-bold tracking-tight">Admin Tournament Console</h1>
                <p className="text-xs text-text-secondary mt-1">
                  Select one of your tournaments to manage matches, squads, and schedules, or create a brand new league.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    if (confirm("WARNING: This will delete ALL tournaments, teams, and match scoreboards from both your browser and the Supabase cloud database. This action CANNOT be undone.\n\nAre you sure you want to proceed?")) {
                      if (confirm("Double Confirmation: Please click OK to confirm that you want to delete all tournaments.")) {
                        resetAllData();
                        setStep(1); // Since all tournaments are deleted, take them to step 1 to create one
                      }
                    }
                  }}
                  className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 px-6 py-2.5 rounded-full text-xs font-bold font-space uppercase tracking-wider hover:text-white transition-all cursor-pointer"
                >
                  Delete All Tournaments
                </button>
                <button
                  onClick={() => {
                    setStep(1);
                    setTournamentName("");
                    setOrgName("");
                    setLocation("");
                    setGround("");
                    setOvers(20);
                    setTeamsLimit(6);
                    setRules("");
                  }}
                  className="bg-gradient-to-r from-gold to-yellow-600 text-black px-6 py-2.5 rounded-full text-xs font-bold font-space uppercase tracking-wider flex items-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-gold/10 cursor-pointer"
                >
                  <Plus className="h-4 w-4 stroke-[3]" /> Create Tournament
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {getTournaments().map((t) => {
                const liveCount = t.fixtures.filter(f => f.status === "live").length;
                const completedCount = t.fixtures.filter(f => f.status === "completed").length;
                const scheduledCount = t.fixtures.filter(f => f.status === "scheduled").length;

                return (
                  <div
                    key={t.id}
                    className="p-6 rounded-[22px] border border-white/5 bg-white/[0.02] flex flex-col justify-between min-h-56 relative overflow-hidden group shadow-lg"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gold/[0.01] rounded-full blur-2xl group-hover:bg-gold/[0.04] transition-colors" />
                    
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <h3 className="font-space font-extrabold text-lg text-white tracking-wide group-hover:text-gold transition-colors font-bold">
                          {t.name}
                        </h3>
                        {liveCount > 0 && (
                          <span className="flex-shrink-0 flex items-center gap-1 bg-red-500/20 border border-red-500/30 px-2 py-0.5 rounded text-[8px] font-bold text-red-400 animate-pulse font-mono uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Live
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5 text-[11px] text-text-secondary font-mono">
                        <p className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5" /> Org: {t.organizer}
                        </p>
                        <p className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5" /> Ground: {t.ground}
                        </p>
                        <div className="mt-3 flex items-center gap-2 bg-white/5 border border-white/5 p-2 rounded-xl text-[9px] tracking-wide">
                          <div className="flex-1">
                            <span className="text-white/50 block text-[8px] uppercase">Access Code:</span>
                            <span className="text-gold font-bold">{t.code}</span>
                          </div>
                          <div className="flex-1">
                            <span className="text-white/50 block text-[8px] uppercase">Security PIN:</span>
                            <span className="text-white font-bold">{t.passwordHash}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-white/5 pt-3.5 flex gap-3 items-center">
                      <button
                        onClick={() => {
                          setActiveTournament(t);
                          setStep(3);
                        }}
                        className="flex-1 bg-gradient-to-r from-gold to-yellow-600 text-black py-2 rounded-full text-[10px] font-bold font-space uppercase tracking-wider text-center hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        Manage Dashboard
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete the tournament "${t.name}" and all its scheduled/completed match scores? This cannot be undone.`)) {
                            deleteTournament(t.id);
                            setStep(0); 
                          }
                        }}
                        className="p-2 border border-white/10 hover:border-red-500/30 hover:bg-red-500/10 text-text-secondary hover:text-red-400 rounded-full transition-colors cursor-pointer"
                        title="Delete Tournament"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : step !== 3 ? (
          // Tournament Wizard form
          <div className="max-w-2xl mx-auto w-full pt-6">
            <div className="mb-6">
              {getTournaments().length > 0 ? (
                <button
                  onClick={() => setStep(0)}
                  className="inline-flex items-center gap-2 text-xs text-text-secondary hover:text-white mb-2 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Tournaments Console
                </button>
              ) : (
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-xs text-text-secondary hover:text-white mb-2 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
                </Link>
              )}
              <h1 className="font-space text-3xl font-bold tracking-tight">Create New Tournament</h1>
              <p className="text-xs text-text-secondary mt-1">
                Configure your league overs, locations, and automatically generate pairings.
              </p>
            </div>

            {/* Stepper progress */}
            <div className="flex items-center gap-4 bg-white/5 border border-white/5 p-4 rounded-2xl mb-8 text-xs font-mono">
              <span className={step >= 1 ? "text-gold font-bold" : "text-text-secondary"}>1. General Config</span>
              <ChevronRight className="h-4 w-4 text-white/20" />
              <span className={step >= 2 ? "text-gold font-bold" : "text-text-secondary"}>2. Format & Rules</span>
            </div>

            <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleCreateTournament} className="glass p-8 rounded-[22px] border border-white/10 shadow-2xl space-y-6 relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full blur-2xl pointer-events-none" />

              {step === 1 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-mono tracking-wider text-text-secondary mb-2">
                        Organization Name
                      </label>
                      <input
                        type="text"
                        required
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        className="w-full bg-secondary border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-gold/50 outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-mono tracking-wider text-text-secondary mb-2">
                        Tournament Title
                      </label>
                      <input
                        type="text"
                        required
                        value={tournamentName}
                        onChange={(e) => setTournamentName(e.target.value)}
                        className="w-full bg-secondary border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-gold/50 outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-mono tracking-wider text-text-secondary mb-2">
                        Location / City
                      </label>
                      <input
                        type="text"
                        required
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full bg-secondary border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-gold/50 outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-mono tracking-wider text-text-secondary mb-2">
                        Ground Name
                      </label>
                      <input
                        type="text"
                        required
                        value={ground}
                        onChange={(e) => setGround(e.target.value)}
                        className="w-full bg-secondary border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-gold/50 outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-gold to-yellow-600 text-black py-3.5 rounded-[100px] text-xs font-bold font-space uppercase tracking-wider hover:opacity-90 active:scale-98 transition-all mt-6"
                  >
                    Next: Format & Rules
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-mono tracking-wider text-text-secondary mb-2">
                        Number of Teams Limit
                      </label>
                      <input
                        type="number"
                        required
                        value={teamsLimit}
                        onChange={(e) => setTeamsLimit(parseInt(e.target.value) || 6)}
                        className="w-full bg-secondary border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-gold/50 outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-mono tracking-wider text-text-secondary mb-2">
                        Overs per Match
                      </label>
                      <input
                        type="number"
                        required
                        value={overs}
                        onChange={(e) => setOvers(parseInt(e.target.value) || 20)}
                        className="w-full bg-secondary border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-gold/50 outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-text-secondary mb-2">
                      Rules Description
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={rules}
                      onChange={(e) => setRules(e.target.value)}
                      className="w-full bg-secondary border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-gold/50 outline-none transition-colors resize-none"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-[100px] py-3.5 text-xs font-bold font-space uppercase tracking-wider hover:bg-white/10"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-gold to-yellow-600 text-black py-3.5 rounded-[100px] text-xs font-bold font-space uppercase tracking-wider hover:opacity-90 active:scale-98 transition-all"
                    >
                      Create Tournament
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        ) : (
          // Tournament Organizer Dashboard
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Header summary widget */}
            <div className="glass rounded-[22px] border border-white/10 p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-2xl relative overflow-hidden bg-white/5">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <span className="flex items-center gap-1.5 text-gold font-mono text-xs uppercase font-bold">
                    <Trophy className="h-4 w-4" /> Active Tournament Organizer Dashboard
                  </span>
                  <button
                    onClick={() => {
                      setActiveTournament(null);
                      setStep(0);
                    }}
                    className="px-2 py-0.5 rounded border border-white/10 hover:border-gold/30 hover:bg-gold/10 text-[9px] uppercase font-mono text-text-secondary hover:text-gold transition-colors cursor-pointer"
                  >
                    Switch Tournament
                  </button>
                </div>
                <h1 className="font-space text-3xl font-bold tracking-tight text-white">
                  {activeTournament?.name}
                </h1>
                <p className="text-xs text-text-secondary mt-1 flex items-center gap-2">
                  <span>Org: {activeTournament?.organizer}</span> • <span>Ground: {activeTournament?.ground}</span> • <span>Overs: {activeTournament?.overs}</span>
                </p>
              </div>

              {/* Share codes */}
              <div className="flex flex-col sm:flex-row gap-4 bg-black/40 p-4 rounded-2xl border border-white/5">
                <div>
                  <span className="block text-[9px] uppercase font-mono text-text-secondary mb-1">Share Code</span>
                  <div className="flex items-center gap-2">
                    <span className="font-sora font-extrabold text-sm text-gold">
                      {activeTournament?.code}
                    </span>
                    <button
                      onClick={() => copyToClipboard(activeTournament?.code || "")}
                      className="p-1 rounded bg-white/5 hover:bg-white/10 text-gold"
                      title="Copy Code"
                    >
                      <Clipboard className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="sm:border-l sm:border-white/10 sm:pl-4">
                  <span className="block text-[9px] uppercase font-mono text-text-secondary mb-1">Security Code</span>
                  <span className="font-sora font-bold text-sm text-white">{activeTournament?.passwordHash}</span>
                </div>
              </div>
            </div>

            {/* Split layout: Team Management & Fixture Scheduling */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Manage Teams (Rosters) */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* 1. Add Team Widget */}
                <div className="glass p-6 rounded-[22px] border border-white/5 space-y-4">
                  <h3 className="font-space font-bold text-base text-white flex items-center gap-2">
                    <Users className="h-5 w-5 text-gold" /> Add Team to Tournament
                  </h3>
                  
                  <form onSubmit={handleAddTeam} className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Enter Team Name (e.g. Cape Town Tigers)"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      className="flex-1 bg-secondary border border-white/10 rounded-xl px-4 py-2 text-xs focus:border-gold/50 outline-none transition-colors"
                    />
                    <select
                      value={newTeamLogo}
                      onChange={(e) => setNewTeamLogo(e.target.value)}
                      className="bg-secondary text-xs border border-white/10 rounded-xl px-3 py-2 outline-none font-sora cursor-pointer"
                    >
                      <option value="🏏">🏏 Cricket Bat</option>
                      <option value="⚡">⚡ Lightning</option>
                      <option value="👑">👑 Crown</option>
                      <option value="🔥">🔥 Fire</option>
                      <option value="🦁">🦁 Lion</option>
                      <option value="🦅">🦅 Eagle</option>
                    </select>
                    <button
                      type="submit"
                      className="bg-gold text-black px-6 py-2.5 rounded-xl text-xs font-bold font-space uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                    >
                      Add Team
                    </button>
                  </form>
                </div>

                {/* 2. Teams Roster Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {tournamentTeams.length === 0 ? (
                    <div className="sm:col-span-2 bg-white/5 border border-dashed border-white/10 p-8 rounded-[22px] text-center text-xs text-text-secondary">
                      No teams registered yet. Use the form above to add teams to your tournament.
                    </div>
                  ) : (
                    tournamentTeams.map((team) => (
                      <div key={team.id} className="glass p-6 rounded-[22px] border border-white/5 space-y-4 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center pb-3 border-b border-white/5">
                            <span className="flex items-center gap-2">
                              <span className="text-2xl">{team.logo}</span>
                              <span className="font-space font-bold text-sm text-white">{team.name}</span>
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-text-secondary mr-1">
                                {team.players.length} Players
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTeamId(team.id);
                                  setEditTeamName(team.name);
                                  setEditTeamLogo(team.logo);
                                }}
                                className="p-1 text-gold hover:text-white rounded hover:bg-white/5 transition-all cursor-pointer"
                                title="Edit Team Name/Logo"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTeam(team.id)}
                                className="p-1 text-red-400 hover:text-white rounded hover:bg-white/5 transition-all cursor-pointer"
                                title="Delete Team"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Players List */}
                          <div className="mt-4 space-y-2 divide-y divide-white/5">
                            {team.players.length === 0 ? (
                              <p className="text-[10px] text-text-secondary italic pt-2">No players added yet.</p>
                            ) : (
                              team.players.map((p) => (
                                <div key={p.id} className="flex justify-between items-center text-xs py-1.5 first:mt-2">
                                  <div className="flex items-center gap-2">
                                    {p.photoUrl && (
                                      <img src={p.photoUrl} alt={p.name} className="h-5 w-5 rounded-full object-cover border border-white/10" />
                                    )}
                                    <div>
                                      <span className="font-medium text-white block">{p.name}</span>
                                      <span className="text-[9px] text-text-secondary font-mono uppercase">{p.role}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingPlayerId(p.id);
                                        setEditingPlayerTeamId(team.id);
                                        setEditPlayerName(p.name);
                                        setEditPlayerRole(p.role as any);
                                        setEditPlayerPhoto(p.photoUrl || "");
                                      }}
                                      className="p-1 hover:bg-white/5 rounded text-gold transition-colors cursor-pointer"
                                      title="Edit Player"
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Add Player trigger button */}
                        <button
                          onClick={() => {
                            setSelectedTeamIdForPlayer(team.id);
                          }}
                          className="mt-6 w-full bg-white/5 hover:bg-white/10 border border-white/10 py-2 rounded-xl text-[10px] font-bold font-space uppercase tracking-wider text-gold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <UserPlus className="h-3.5 w-3.5" /> Add Player
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* 3. Add Player Form Overlay modal */}
                <AnimatePresence>
                  {selectedTeamIdForPlayer && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="glass max-w-sm w-full p-6 rounded-3xl border border-white/10 shadow-2xl"
                      >
                        <h3 className="font-space text-base font-bold text-white mb-4">
                          Add Player to {tournamentTeams.find(t => t.id === selectedTeamIdForPlayer)?.name}
                        </h3>

                        <form onSubmit={handleAddPlayer} className="space-y-4">
                          <div>
                            <label className="block text-[9px] uppercase font-mono tracking-wider text-text-secondary mb-1.5">
                              Player Name
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Enter Player Name"
                              value={playerName}
                              onChange={(e) => setPlayerName(e.target.value)}
                              className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-gold/50 outline-none transition-colors"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] uppercase font-mono tracking-wider text-text-secondary mb-1.5">
                              Player Role
                            </label>
                            <select
                              value={playerRole}
                              onChange={(e) => setPlayerRole(e.target.value as any)}
                              className="w-full bg-secondary text-xs border border-white/10 rounded-xl px-3 py-2.5 outline-none font-sora cursor-pointer"
                            >
                              <option value="Batsman">Batsman</option>
                              <option value="Bowler">Bowler</option>
                              <option value="All-Rounder">All-Rounder</option>
                              <option value="Wicketkeeper">Wicketkeeper</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[9px] uppercase font-mono tracking-wider text-text-secondary mb-1.5">
                              Photo URL (Optional)
                            </label>
                            <input
                              type="text"
                              placeholder="Photo URL Link"
                              value={playerPhoto}
                              onChange={(e) => setPlayerPhoto(e.target.value)}
                              className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-gold/50 outline-none transition-colors"
                            />
                          </div>

                          <div className="flex gap-3 pt-4">
                            <button
                              type="button"
                              onClick={() => setSelectedTeamIdForPlayer("")}
                              className="flex-1 bg-white/5 border border-white/10 rounded-full py-2 text-xs font-bold hover:bg-white/10"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="flex-1 bg-gold text-black rounded-full py-2 text-xs font-bold hover:opacity-90"
                            >
                              Add Player
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    </div>
                  )}
                  {editingPlayerId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="glass max-w-sm w-full p-6 rounded-3xl border border-white/10 shadow-2xl"
                      >
                        <h3 className="font-space text-base font-bold text-white mb-4">
                          Edit Player Profile
                        </h3>

                        <form onSubmit={handleSaveEditPlayer} className="space-y-4">
                          <div>
                            <label className="block text-[9px] uppercase font-mono tracking-wider text-text-secondary mb-1.5">
                              Player Name
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Player Name"
                              value={editPlayerName}
                              onChange={(e) => setEditPlayerName(e.target.value)}
                              className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-gold/50 outline-none transition-colors"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] uppercase font-mono tracking-wider text-text-secondary mb-1.5">
                              Player Role
                            </label>
                            <select
                              value={editPlayerRole}
                              onChange={(e) => setEditPlayerRole(e.target.value as any)}
                              className="w-full bg-secondary text-xs border border-white/10 rounded-xl px-3 py-2.5 outline-none font-sora cursor-pointer"
                            >
                              <option value="Batsman">Batsman</option>
                              <option value="Bowler">Bowler</option>
                              <option value="All-Rounder">All-Rounder</option>
                              <option value="Wicketkeeper">Wicketkeeper</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[9px] uppercase font-mono tracking-wider text-text-secondary mb-1.5">
                              Photo URL (Optional)
                            </label>
                            <input
                              type="text"
                              placeholder="Photo URL Link"
                              value={editPlayerPhoto}
                              onChange={(e) => setEditPlayerPhoto(e.target.value)}
                              className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-gold/50 outline-none transition-colors"
                            />
                          </div>

                          <div className="flex gap-3 pt-4">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPlayerId("");
                                setEditingPlayerTeamId("");
                              }}
                              className="flex-1 bg-white/5 border border-white/10 rounded-full py-2 text-xs font-bold hover:bg-white/10 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="flex-1 bg-gold text-black rounded-full py-2 text-xs font-bold hover:opacity-90 cursor-pointer"
                            >
                              Save Changes
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    </div>
                  )}
                  {editingTeamId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="glass max-w-sm w-full p-6 rounded-3xl border border-white/10 shadow-2xl"
                      >
                        <h3 className="font-space text-base font-bold text-white mb-4">
                          Edit Team Profile
                        </h3>

                        <form onSubmit={handleSaveEditTeam} className="space-y-4">
                          <div>
                            <label className="block text-[9px] uppercase font-mono tracking-wider text-text-secondary mb-1.5">
                              Team Name
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Team Name"
                              value={editTeamName}
                              onChange={(e) => setEditTeamName(e.target.value)}
                              className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-gold/50 outline-none transition-colors"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] uppercase font-mono tracking-wider text-text-secondary mb-1.5">
                              Team Logo / Emblem Symbol
                            </label>
                            <select
                              value={editTeamLogo}
                              onChange={(e) => setEditTeamLogo(e.target.value)}
                              className="w-full bg-secondary text-xs border border-white/10 rounded-xl px-3 py-2 outline-none font-sora cursor-pointer"
                            >
                              <option value="🏏">🏏 Cricket Bat</option>
                              <option value="⚡">⚡ Lightning</option>
                              <option value="👑">👑 Crown</option>
                              <option value="🔥">🔥 Fire</option>
                              <option value="🦁">🦁 Lion</option>
                              <option value="🦅">🦅 Eagle</option>
                            </select>
                          </div>

                          <div className="flex gap-3 pt-4">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTeamId("");
                                setEditTeamName("");
                                setEditTeamLogo("🏏");
                              }}
                              className="flex-1 bg-white/5 border border-white/10 rounded-full py-2 text-xs font-bold hover:bg-white/10 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="flex-1 bg-gold text-black rounded-full py-2 text-xs font-bold hover:opacity-90 cursor-pointer"
                            >
                              Save Changes
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right Column: Fixture Scheduler */}
              <div className="space-y-6">
                
                {/* 1. Schedule Fixture Form */}
                <div className="glass p-6 rounded-[22px] border border-white/5 space-y-4">
                  <h3 className="font-space font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                    <CalendarCheck className="h-4.5 w-4.5 text-blue" /> Schedule Fixture
                  </h3>

                  <form onSubmit={handleScheduleFixture} className="space-y-4">
                    <div>
                      <label className="block text-[9px] uppercase font-mono tracking-wider text-text-secondary mb-1.5">
                        Team 1 (Batting First)
                      </label>
                      <select
                        required
                        value={fixtureTeam1Id}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFixtureTeam1Id(val);
                          const team = tournamentTeams.find(t => t.id === val);
                          if (team && team.players.length > 0) {
                            setFixtureTeam1CaptainId(team.players[0].id);
                          } else {
                            setFixtureTeam1CaptainId("");
                          }
                        }}
                        className="w-full bg-secondary text-xs border border-white/10 rounded-xl px-3 py-2 outline-none cursor-pointer text-white"
                      >
                        <option value="">Select Team 1</option>
                        {tournamentTeams.filter(t => t.players.length > 1 && t.id !== fixtureTeam2Id).map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase font-mono tracking-wider text-text-secondary mb-1.5">
                        Team 2 (Bowling First)
                      </label>
                      <select
                        required
                        value={fixtureTeam2Id}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFixtureTeam2Id(val);
                          const team = tournamentTeams.find(t => t.id === val);
                          if (team && team.players.length > 0) {
                            setFixtureTeam2CaptainId(team.players[0].id);
                          } else {
                            setFixtureTeam2CaptainId("");
                          }
                        }}
                        className="w-full bg-secondary text-xs border border-white/10 rounded-xl px-3 py-2 outline-none cursor-pointer text-white"
                      >
                        <option value="">Select Team 2</option>
                        {tournamentTeams.filter(t => t.players.length > 1 && t.id !== fixtureTeam1Id).map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] uppercase font-mono tracking-wider text-text-secondary mb-1.5">
                          Date
                        </label>
                        <input
                          type="date"
                          required
                          min={getLocalDateString()}
                          value={fixtureDate}
                          onChange={(e) => setFixtureDate(e.target.value)}
                          className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-gold/50 outline-none text-white cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-mono tracking-wider text-text-secondary mb-1.5">
                          Time
                        </label>
                        <input
                          type="time"
                          required
                          value={fixtureTime}
                          onChange={(e) => setFixtureTime(e.target.value)}
                          className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-gold/50 outline-none text-white cursor-pointer"
                        />
                      </div>
                    </div>
                    {/* Custom Match Settings */}
                    <div>
                      <label className="block text-[9px] uppercase font-mono tracking-wider text-text-secondary mb-1.5">
                        Match Category
                      </label>
                      <select
                        value={fixtureCategory}
                        onChange={(e) => setFixtureCategory(e.target.value as any)}
                        className="w-full bg-secondary text-xs border border-white/10 rounded-xl px-3 py-2 outline-none cursor-pointer text-white"
                      >
                        <option value="League Match">League Match</option>
                        <option value="Semi-Final">Semi-Final</option>
                        <option value="Final">Final</option>
                        <option value="Super Over">Super Over</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] uppercase font-mono tracking-wider text-text-secondary mb-1.5">
                          Match Overs
                        </label>
                        <input
                          type="number"
                          required
                          placeholder={`${activeTournament?.overs || 20} (Default)`}
                          value={fixtureOvers}
                          onChange={(e) => setFixtureOvers(e.target.value)}
                          className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-gold/50 outline-none text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-mono tracking-wider text-text-secondary mb-1.5">
                          Wickets Limit
                        </label>
                        <input
                          type="number"
                          required
                          placeholder="e.g. 10 (Default)"
                          value={fixtureWickets}
                          onChange={(e) => setFixtureWickets(e.target.value)}
                          className="w-full bg-secondary border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-gold/50 outline-none text-white"
                        />
                      </div>
                    </div>

                    {fixtureTeam1Id && (
                      <div>
                        <label className="block text-[9px] uppercase font-mono tracking-wider text-text-secondary mb-1.5">
                          Team 1 Captain ({tournamentTeams.find(t => t.id === fixtureTeam1Id)?.name})
                        </label>
                        <select
                          required
                          value={fixtureTeam1CaptainId}
                          onChange={(e) => setFixtureTeam1CaptainId(e.target.value)}
                          className="w-full bg-secondary text-xs border border-white/10 rounded-xl px-3 py-2 outline-none cursor-pointer text-white"
                        >
                          <option value="">Select Captain</option>
                          {tournamentTeams.find(t => t.id === fixtureTeam1Id)?.players.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {fixtureTeam2Id && (
                      <div>
                        <label className="block text-[9px] uppercase font-mono tracking-wider text-text-secondary mb-1.5">
                          Team 2 Captain ({tournamentTeams.find(t => t.id === fixtureTeam2Id)?.name})
                        </label>
                        <select
                          required
                          value={fixtureTeam2CaptainId}
                          onChange={(e) => setFixtureTeam2CaptainId(e.target.value)}
                          className="w-full bg-secondary text-xs border border-white/10 rounded-xl px-3 py-2 outline-none cursor-pointer text-white"
                        >
                          <option value="">Select Captain</option>
                          {tournamentTeams.find(t => t.id === fixtureTeam2Id)?.players.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!fixtureTeam1Id || !fixtureTeam2Id || fixtureTeam1Id === fixtureTeam2Id || tournamentTeams.length < 2}
                      className="w-full bg-gradient-to-r from-gold to-yellow-600 text-black py-2.5 rounded-[100px] text-xs font-bold font-space uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    >
                      Schedule Match
                    </button>
                  </form>
                </div>

                {/* 2. Scheduled Matches Status & Scorer link triggers */}
                <div className="glass p-6 rounded-[22px] border border-white/5 space-y-4">
                  <h3 className="font-space font-bold text-sm text-white uppercase tracking-wider">
                    Scheduled Fixtures
                  </h3>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {!activeTournament || activeTournament.fixtures.filter(f => f.status !== "completed").length === 0 ? (
                      <p className="text-xs text-text-secondary italic">No fixtures scheduled.</p>
                    ) : (
                      activeTournament.fixtures.filter(f => f.status !== "completed").map((f, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-3">
                          <div className="flex justify-between items-center text-[9px] font-mono text-text-secondary">
                            <span>{f.round}</span>
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.25 rounded font-bold uppercase ${
                                f.status === "live" ? "bg-red-500/20 text-red-400 animate-pulse" : "bg-white/5 text-white/50"
                              }`}>
                                {f.status}
                              </span>
                              {f.status === "scheduled" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingFixtureId(f.matchId);
                                    setEditDate(f.date);
                                    setEditTime(f.time || "12:00");
                                  }}
                                  className="p-1 text-gold hover:text-white rounded hover:bg-white/5 transition-all cursor-pointer"
                                  title="Edit Schedule"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {(f.status === "scheduled" || f.status === "completed") && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteFixture(f.matchId)}
                                  className="p-1 text-red-400 hover:text-white rounded hover:bg-white/5 transition-all cursor-pointer"
                                  title="Delete Fixture"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{f.team1} vs {f.team2}</span>
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t border-white/5 text-[9px] text-text-secondary font-mono">
                            <span>{f.date} • {f.time || "12:00"}</span>
                            
                            {f.status === "scheduled" ? (
                              (() => {
                                const todayStr = getLocalDateString();
                                const isStartable = todayStr >= f.date;
                                if (isStartable) {
                                  return (
                                    <Link
                                      href={`/scorer?matchId=${f.matchId}`}
                                      onClick={() => handleStartMatch(f.matchId)}
                                      className="bg-gold text-black font-space font-bold uppercase text-[9px] tracking-wider px-3 py-1.5 rounded-full hover:opacity-90"
                                    >
                                      Start Match
                                    </Link>
                                  );
                                } else {
                                  return (
                                    <span
                                      className="bg-white/5 border border-white/5 text-white/30 font-space font-bold uppercase text-[8px] tracking-wider px-3 py-1.5 rounded-full cursor-not-allowed"
                                      title={`Locked: Can only start on scheduled date (${f.date})`}
                                    >
                                      🔒 Locked
                                    </span>
                                  );
                                }
                              })()
                            ) : f.status === "live" ? (
                              <Link
                                href={`/scorer?matchId=${f.matchId}`}
                                className="bg-red-500 text-white font-space font-bold uppercase text-[9px] tracking-wider px-3 py-1.5 rounded-full hover:opacity-90 animate-pulse"
                              >
                                Score Live
                              </Link>
                            ) : (
                              <span className="text-emerald-400 font-bold uppercase">Completed</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        )}
      </main>

      {/* EDIT FIXTURE MODAL */}
      <AnimatePresence>
        {editingFixtureId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass max-w-sm w-full p-6 rounded-3xl border border-white/10 shadow-2xl"
            >
              <h3 className="font-space text-base font-bold text-gold uppercase tracking-wider mb-4">
                Reschedule Fixture
              </h3>

              <form onSubmit={handleSaveEditFixture} className="space-y-4">
                <div>
                  <label className="block text-[9px] uppercase font-mono tracking-wider text-text-secondary mb-1.5">
                    Match Date
                  </label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-secondary text-xs border border-white/10 rounded-xl px-3 py-2 outline-none text-white focus:border-gold/50"
                  />
                </div>

                <div>
                  <label className="block text-[9px] uppercase font-mono tracking-wider text-text-secondary mb-1.5">
                    Match Time
                  </label>
                  <input
                    type="time"
                    required
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full bg-secondary text-xs border border-white/10 rounded-xl px-3 py-2 outline-none text-white focus:border-gold/50"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingFixtureId("")}
                    className="flex-1 bg-white/5 border border-white/10 rounded-full py-2 text-xs font-bold hover:bg-white/10 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-gold to-yellow-600 text-black rounded-full py-2 text-xs font-bold hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                  >
                    Save Changes
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
