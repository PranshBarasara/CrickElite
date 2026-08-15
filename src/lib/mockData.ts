import { MatchState, InningsState, PlayerMatchStats, BallRecord, addBallToInnings } from "./scorerEngine";
import { supabase } from "./supabaseClient";

export interface MockPlayer {
  id: string;
  name: string;
  role: "Batsman" | "Bowler" | "All-Rounder" | "Wicketkeeper";
  battingStyle: string;
  bowlingStyle: string;
  photoUrl: string;
}

export interface MockTeam {
  id: string;
  name: string;
  logo: string;
  captain: string;
  coach: string;
  players: MockPlayer[];
}

export interface MockTournament {
  id: string;
  name: string;
  organizer: string;
  location: string;
  ground: string;
  overs: number;
  teams: string[]; // Team IDs
  fixtures: {
    matchId: string;
    round: string;
    team1: string;
    team2: string;
    date: string;
    time?: string;
    status: "scheduled" | "live" | "completed";
  }[];
  code: string;
  passwordHash: string;
}

// Helper to check logged-in account
export function getActiveUser(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("pranscric_auth_token");
  if (token === "authorized_elite") {
    return localStorage.getItem("pranscric_active_user") || "CrickElite";
  }
  return null;
}

// LocalStorage helpers to simulate database operations locally
export function getTeams(): MockTeam[] {
  if (typeof window === "undefined") return [];
  initSupabaseSync();
  const currentUser = getActiveUser();
  if (currentUser) {
    const stored = localStorage.getItem(`${currentUser}_teams`) || (currentUser === "CrickElite" ? localStorage.getItem("pranscric_teams") : null);
    return stored ? JSON.parse(stored) : [];
  } else {
    const all: MockTeam[] = [];
    ["CrickElite", "DDUGroundCricket"].forEach(user => {
      const stored = localStorage.getItem(`${user}_teams`) || (user === "CrickElite" ? localStorage.getItem("pranscric_teams") : null);
      if (stored) {
        all.push(...JSON.parse(stored));
      }
    });
    return all;
  }
}

export function saveTeam(team: MockTeam) {
  if (typeof window === "undefined") return;
  let targetUser = getActiveUser();
  if (!targetUser) {
    targetUser = ["CrickElite", "DDUGroundCricket"].find(user => {
      const stored = localStorage.getItem(`${user}_teams`) || (user === "CrickElite" ? localStorage.getItem("pranscric_teams") : null);
      if (stored) {
        const arr: MockTeam[] = JSON.parse(stored);
        return arr.some(t => t.id === team.id);
      }
      return false;
    }) || "CrickElite";
  }

  const stored = localStorage.getItem(`${targetUser}_teams`) || (targetUser === "CrickElite" ? localStorage.getItem("pranscric_teams") : null);
  const current: MockTeam[] = stored ? JSON.parse(stored) : [];
  
  const index = current.findIndex((t) => t.id === team.id);
  if (index !== -1) {
    current[index] = team;
  } else {
    current.push(team);
  }
  localStorage.removeItem("pranscric_teams");
  localStorage.setItem(`${targetUser}_teams`, JSON.stringify(current));
  syncTeamToSupabase(team);
  window.dispatchEvent(new Event("storage")); // Trigger cross-tab sync
}

export function getMatches(): MatchState[] {
  if (typeof window === "undefined") return [];
  initSupabaseSync();
  const currentUser = getActiveUser();
  if (currentUser) {
    const stored = localStorage.getItem(`${currentUser}_matches`) || (currentUser === "CrickElite" ? localStorage.getItem("pranscric_matches") : null);
    return stored ? JSON.parse(stored) : [];
  } else {
    const all: MatchState[] = [];
    ["CrickElite", "DDUGroundCricket"].forEach(user => {
      const stored = localStorage.getItem(`${user}_matches`) || (user === "CrickElite" ? localStorage.getItem("pranscric_matches") : null);
      if (stored) {
        all.push(...JSON.parse(stored));
      }
    });
    return all;
  }
}

export function saveMatch(match: MatchState) {
  if (typeof window === "undefined") return;
  let targetUser = getActiveUser();
  if (!targetUser) {
    targetUser = ["CrickElite", "DDUGroundCricket"].find(user => {
      const stored = localStorage.getItem(`${user}_matches`) || (user === "CrickElite" ? localStorage.getItem("pranscric_matches") : null);
      if (stored) {
        const arr: MatchState[] = JSON.parse(stored);
        return arr.some(m => m.matchId === match.matchId);
      }
      return false;
    }) || "CrickElite";
  }

  const stored = localStorage.getItem(`${targetUser}_matches`) || (targetUser === "CrickElite" ? localStorage.getItem("pranscric_matches") : null);
  const current: MatchState[] = stored ? JSON.parse(stored) : [];

  const index = current.findIndex((m) => m.matchId === match.matchId);
  if (index !== -1) {
    current[index] = match;
  } else {
    current.push(match);
  }
  localStorage.removeItem("pranscric_matches");
  localStorage.setItem(`${targetUser}_matches`, JSON.stringify(current));
  syncMatchToSupabase(match);
  window.dispatchEvent(new Event("storage")); // Trigger cross-tab sync
}

export function getTournaments(): MockTournament[] {
  if (typeof window === "undefined") return [];
  initSupabaseSync();
  const currentUser = getActiveUser();
  if (currentUser) {
    const stored = localStorage.getItem(`${currentUser}_tournaments`) || (currentUser === "CrickElite" ? localStorage.getItem("pranscric_tournaments") : null);
    return stored ? JSON.parse(stored) : [];
  } else {
    const all: MockTournament[] = [];
    ["CrickElite", "DDUGroundCricket"].forEach(user => {
      const stored = localStorage.getItem(`${user}_tournaments`) || (user === "CrickElite" ? localStorage.getItem("pranscric_tournaments") : null);
      if (stored) {
        all.push(...JSON.parse(stored));
      }
    });
    return all;
  }
}

export function saveTournament(tournament: MockTournament) {
  if (typeof window === "undefined") return;
  let targetUser = getActiveUser();
  if (!targetUser) {
    targetUser = ["CrickElite", "DDUGroundCricket"].find(user => {
      const stored = localStorage.getItem(`${user}_tournaments`) || (user === "CrickElite" ? localStorage.getItem("pranscric_tournaments") : null);
      if (stored) {
        const arr: MockTournament[] = JSON.parse(stored);
        return arr.some(t => t.id === tournament.id);
      }
      return false;
    }) || "CrickElite";
  }

  const stored = localStorage.getItem(`${targetUser}_tournaments`) || (targetUser === "CrickElite" ? localStorage.getItem("pranscric_tournaments") : null);
  const current: MockTournament[] = stored ? JSON.parse(stored) : [];

  const index = current.findIndex((t) => t.id === tournament.id);
  if (index !== -1) {
    current[index] = tournament;
  } else {
    current.push(tournament);
  }
  localStorage.removeItem("pranscric_tournaments");
  localStorage.setItem(`${targetUser}_tournaments`, JSON.stringify(current));
  syncTournamentToSupabase(tournament);
  window.dispatchEvent(new Event("storage")); // Trigger cross-tab sync
}

// Background Simulated Scoring Engine (dynamically simulates user created team rosters)
export function runMatchSimulationStep(match: MatchState): MatchState {
  if (match.status !== "live") return match;

  const currentInnings = match.currentInningsNumber === 1 ? match.firstInnings : match.secondInnings;
  if (!currentInnings) return match;

  const allTeams = getTeams();
  const battingTeamObj = allTeams.find(t => t.name === currentInnings.teamName);
  const bowlingTeamObj = allTeams.find(t => t.name === (match.team1Name === currentInnings.teamName ? match.team2Name : match.team1Name));

  // Stop if overs completed
  if (currentInnings.ballsBowled >= currentInnings.oversLimit * 6 || currentInnings.wickets >= 10) {
    if (match.currentInningsNumber === 1) {
      // Switch to second innings
      match.currentInningsNumber = 2;
      
      // Select first two players from bowling team (chasing team)
      let b1Id = "p-chase-1";
      let b2Id = "p-chase-2";
      if (bowlingTeamObj && bowlingTeamObj.players.length >= 2) {
        b1Id = bowlingTeamObj.players[0].id;
        b2Id = bowlingTeamObj.players[1].id;
      }

      let bowlId = "p-bowl-1";
      if (battingTeamObj && battingTeamObj.players.length > 0) {
        // Pick a bowler from the first innings batting team
        const bowlerPlayer = battingTeamObj.players.find(p => p.role === "Bowler" || p.role === "All-Rounder") || battingTeamObj.players[0];
        bowlId = bowlerPlayer.id;
      }

      match.secondInnings = {
        teamName: match.team1Name === currentInnings.teamName ? match.team2Name : match.team1Name,
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

      // Seed batting statistics records
      if (bowlingTeamObj) {
        bowlingTeamObj.players.forEach(p => {
          if (p.id === b1Id || p.id === b2Id) {
            match.secondInnings!.battingStats[p.id] = {
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
          }
        });
      }

      // Seed bowler stats record
      if (battingTeamObj) {
        const pObj = battingTeamObj.players.find(p => p.id === bowlId);
        match.secondInnings!.bowlingStats[bowlId] = {
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

    } else {
      // Complete Match
      match.status = "completed";
      const target = match.firstInnings.runs + 1;
      const secondRuns = match.secondInnings?.runs || 0;
      if (secondRuns >= target) {
        match.winnerName = match.secondInnings?.teamName;
      } else {
        match.winnerName = match.firstInnings.teamName;
      }

      // Update tournament fixture status
      const tournaments = getTournaments();
      tournaments.forEach((t) => {
        const fixture = t.fixtures.find((f) => f.matchId === match.matchId);
        if (fixture) {
          fixture.status = "completed";
        }
      });
      localStorage.setItem("pranscric_tournaments", JSON.stringify(tournaments));
    }
    
    saveMatch(match);
    return match;
  }

  // Generate random ball event
  const events: Array<{
    runsBatter: number;
    extraType: "wide" | "noball" | "bye" | "legbye" | null;
    wicketType: "bowled" | "caught" | "lbw" | "stumped" | "runout" | null;
  }> = [
    { runsBatter: 0, extraType: null, wicketType: null }, // Dot
    { runsBatter: 0, extraType: null, wicketType: null }, // Dot
    { runsBatter: 1, extraType: null, wicketType: null }, // 1 run
    { runsBatter: 1, extraType: null, wicketType: null }, // 1 run
    { runsBatter: 2, extraType: null, wicketType: null }, // 2 runs
    { runsBatter: 4, extraType: null, wicketType: null }, // FOUR!
    { runsBatter: 6, extraType: null, wicketType: null }, // SIX!
    { runsBatter: 0, extraType: "wide", wicketType: null }, // Wide
    { runsBatter: 1, extraType: "noball", wicketType: null }, // No ball
    { runsBatter: 0, extraType: null, wicketType: "caught" }, // Wicket
  ];

  const randomEvent = events[Math.floor(Math.random() * events.length)];
  const angle = Math.floor(Math.random() * 360);

  const targetInnings = match.currentInningsNumber === 1 ? match.firstInnings : match.secondInnings;
  if (!targetInnings) return match;

  const updatedInnings = addBallToInnings(targetInnings, {
    ...randomEvent,
    wagonAngle: angle,
  });

  // Handle batsman swap if out
  if (randomEvent.wicketType && updatedInnings.wickets < 10 && battingTeamObj) {
    const activeBatterIds = Object.keys(updatedInnings.battingStats);
    const nextBatter = battingTeamObj.players.find((p) => !activeBatterIds.includes(p.id));
    if (nextBatter) {
      const victimId = updatedInnings.currentBatter1Id;
      updatedInnings.currentBatter1Id = nextBatter.id;
      updatedInnings.battingStats[nextBatter.id] = {
        id: nextBatter.id,
        name: nextBatter.name,
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

  // Handle bowler change at the end of the over
  if (updatedInnings.ballsBowled % 6 === 0 && updatedInnings.ballsBowled > 0 && bowlingTeamObj) {
    const eligibleBowlers = bowlingTeamObj.players.filter((b) => b.id !== updatedInnings.currentBowlerId);
    if (eligibleBowlers.length > 0) {
      const nextBowler = eligibleBowlers[Math.floor(Math.random() * eligibleBowlers.length)];
      updatedInnings.currentBowlerId = nextBowler.id;
      if (!updatedInnings.bowlingStats[nextBowler.id]) {
        updatedInnings.bowlingStats[nextBowler.id] = {
          id: nextBowler.id,
          name: nextBowler.name,
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
  }

  if (match.currentInningsNumber === 1) {
    match.firstInnings = updatedInnings;
  } else {
    match.secondInnings = updatedInnings;
  }

  saveMatch(match);
  return match;
}

export function deleteMatch(matchId: string) {
  if (typeof window === "undefined") return;
  
  // 1. Remove from global matches (checking both users keys and legacy key)
  const targetUser = ["CrickElite", "DDUGroundCricket"].find(user => {
    const stored = localStorage.getItem(`${user}_matches`) || (user === "CrickElite" ? localStorage.getItem("pranscric_matches") : null);
    if (stored) {
      const arr: MatchState[] = JSON.parse(stored);
      return arr.some(m => m.matchId === matchId);
    }
    return false;
  }) || "CrickElite";

  const stored = localStorage.getItem(`${targetUser}_matches`) || (targetUser === "CrickElite" ? localStorage.getItem("pranscric_matches") : null);
  if (stored) {
    const current: MatchState[] = JSON.parse(stored);
    const filtered = current.filter(m => m.matchId !== matchId);
    localStorage.setItem(`${targetUser}_matches`, JSON.stringify(filtered));
  }
  localStorage.removeItem("pranscric_matches"); // clean legacy

  // 2. Remove from all tournaments' fixtures lists
  ["CrickElite", "DDUGroundCricket"].forEach(user => {
    const storedT = localStorage.getItem(`${user}_tournaments`) || (user === "CrickElite" ? localStorage.getItem("pranscric_tournaments") : null);
    if (storedT) {
      const currentT: MockTournament[] = JSON.parse(storedT);
      const filteredT = currentT.map(t => {
        const matchesFixtures = t.fixtures.filter(f => f.matchId !== matchId);
        return { ...t, fixtures: matchesFixtures };
      });
      localStorage.setItem(`${user}_tournaments`, JSON.stringify(filteredT));
    }
  });
  localStorage.removeItem("pranscric_tournaments"); // clean legacy
  deleteMatchFromSupabase(matchId);

  window.dispatchEvent(new Event("storage"));
}

let isSyncInitialized = false;

export function initSupabaseSync() {
  if (typeof window === "undefined" || !supabase || isSyncInitialized) return;
  const client = supabase;
  isSyncInitialized = true;

  // 1. Initial Pull - Tournaments
  client.from("crickelite_tournaments").select("*").then(({ data }) => {
    if (data && data.length > 0) {
      data.forEach(row => {
        const t = row.data as MockTournament;
        const owner = t.organizer === "DDUGroundCricket" ? "DDUGroundCricket" : "CrickElite";
        
        const stored = localStorage.getItem(`${owner}_tournaments`);
        const list: MockTournament[] = stored ? JSON.parse(stored) : [];
        const idx = list.findIndex(item => item.id === t.id);
        if (idx !== -1) list[idx] = t; else list.push(t);
        localStorage.setItem(`${owner}_tournaments`, JSON.stringify(list));
      });
      window.dispatchEvent(new Event("storage"));
    } else {
      ["CrickElite", "DDUGroundCricket"].forEach(owner => {
        const stored = localStorage.getItem(`${owner}_tournaments`);
        if (stored) {
          const list: MockTournament[] = JSON.parse(stored);
          list.forEach(t => {
            client.from("crickelite_tournaments").upsert({ id: t.id, data: t, updated_at: new Date().toISOString() }).then(({ error }) => {
              if (error) console.error("Error bootstrapping tournament:", error);
            });
          });
        }
      });
    }
  });

  // 2. Initial Pull - Teams
  client.from("crickelite_teams").select("*").then(({ data }) => {
    if (data && data.length > 0) {
      data.forEach(row => {
        const team = row.data as MockTeam;
        const owner = findTeamOwner(team.id);
        const stored = localStorage.getItem(`${owner}_teams`);
        const list: MockTeam[] = stored ? JSON.parse(stored) : [];
        const idx = list.findIndex(item => item.id === team.id);
        if (idx !== -1) list[idx] = team; else list.push(team);
        localStorage.setItem(`${owner}_teams`, JSON.stringify(list));
      });
      window.dispatchEvent(new Event("storage"));
    } else {
      ["CrickElite", "DDUGroundCricket"].forEach(owner => {
        const stored = localStorage.getItem(`${owner}_teams`);
        if (stored) {
          const list: MockTeam[] = JSON.parse(stored);
          list.forEach(team => {
            client.from("crickelite_teams").upsert({ id: team.id, data: team, updated_at: new Date().toISOString() }).then(({ error }) => {
              if (error) console.error("Error bootstrapping team:", error);
            });
          });
        }
      });
    }
  });

  // 3. Initial Pull - Matches
  client.from("crickelite_matches").select("*").then(({ data }) => {
    if (data && data.length > 0) {
      data.forEach(row => {
        const m = row.data as MatchState;
        const owner = findMatchOwner(m.matchId);
        const stored = localStorage.getItem(`${owner}_matches`);
        const list: MatchState[] = stored ? JSON.parse(stored) : [];
        const idx = list.findIndex(item => item.matchId === m.matchId);
        if (idx !== -1) list[idx] = m; else list.push(m);
        localStorage.setItem(`${owner}_matches`, JSON.stringify(list));
      });
      window.dispatchEvent(new Event("storage"));
    } else {
      ["CrickElite", "DDUGroundCricket"].forEach(owner => {
        const stored = localStorage.getItem(`${owner}_matches`);
        if (stored) {
          const list: MatchState[] = JSON.parse(stored);
          list.forEach(m => {
            client.from("crickelite_matches").upsert({ id: m.matchId, data: m, updated_at: new Date().toISOString() }).then(({ error }) => {
              if (error) console.error("Error bootstrapping match:", error);
            });
          });
        }
      });
    }
  });

  // Realtime Subscriptions
  client
    .channel("crickelite-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "crickelite_matches" },
      (payload) => {
        if (payload.eventType === "DELETE") {
          const oldId = payload.old.id;
          ["CrickElite", "DDUGroundCricket"].forEach(user => {
            const stored = localStorage.getItem(`${user}_matches`);
            if (stored) {
              const list: MatchState[] = JSON.parse(stored);
              const filtered = list.filter(m => m.matchId !== oldId);
              localStorage.setItem(`${user}_matches`, JSON.stringify(filtered));
            }
          });
        } else {
          const m = payload.new.data as MatchState;
          const owner = findMatchOwner(m.matchId);
          const stored = localStorage.getItem(`${owner}_matches`);
          const list: MatchState[] = stored ? JSON.parse(stored) : [];
          const idx = list.findIndex(item => item.matchId === m.matchId);
          if (idx !== -1) list[idx] = m; else list.push(m);
          localStorage.setItem(`${owner}_matches`, JSON.stringify(list));
        }
        window.dispatchEvent(new Event("storage"));
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "crickelite_teams" },
      (payload) => {
        if (payload.eventType === "DELETE") {
          const oldId = payload.old.id;
          ["CrickElite", "DDUGroundCricket"].forEach(user => {
            const stored = localStorage.getItem(`${user}_teams`);
            if (stored) {
              const list: MockTeam[] = JSON.parse(stored);
              const filtered = list.filter(t => t.id !== oldId);
              localStorage.setItem(`${user}_teams`, JSON.stringify(filtered));
            }
          });
        } else {
          const team = payload.new.data as MockTeam;
          const owner = findTeamOwner(team.id);
          const stored = localStorage.getItem(`${owner}_teams`);
          const list: MockTeam[] = stored ? JSON.parse(stored) : [];
          const idx = list.findIndex(item => item.id === team.id);
          if (idx !== -1) list[idx] = team; else list.push(team);
          localStorage.setItem(`${owner}_teams`, JSON.stringify(list));
        }
        window.dispatchEvent(new Event("storage"));
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "crickelite_tournaments" },
      (payload) => {
        if (payload.eventType === "DELETE") {
          const oldId = payload.old.id;
          ["CrickElite", "DDUGroundCricket"].forEach(user => {
            const stored = localStorage.getItem(`${user}_tournaments`);
            if (stored) {
              const list: MockTournament[] = JSON.parse(stored);
              const filtered = list.filter(t => t.id !== oldId);
              localStorage.setItem(`${user}_tournaments`, JSON.stringify(filtered));
            }
          });
        } else {
          const t = payload.new.data as MockTournament;
          const owner = t.organizer === "DDUGroundCricket" ? "DDUGroundCricket" : "CrickElite";
          const stored = localStorage.getItem(`${owner}_tournaments`);
          const list: MockTournament[] = stored ? JSON.parse(stored) : [];
          const idx = list.findIndex(item => item.id === t.id);
          if (idx !== -1) list[idx] = t; else list.push(t);
          localStorage.setItem(`${owner}_tournaments`, JSON.stringify(list));
        }
        window.dispatchEvent(new Event("storage"));
      }
    )
    .subscribe();
}

function findTeamOwner(teamId: string): string {
  for (const user of ["CrickElite", "DDUGroundCricket"]) {
    const storedT = localStorage.getItem(`${user}_tournaments`);
    if (storedT) {
      const listT: MockTournament[] = JSON.parse(storedT);
      if (listT.some(t => t.teams.includes(teamId))) {
        return user;
      }
    }
  }
  return getActiveUser() || "CrickElite";
}

function findMatchOwner(matchId: string): string {
  for (const user of ["CrickElite", "DDUGroundCricket"]) {
    const storedT = localStorage.getItem(`${user}_tournaments`);
    if (storedT) {
      const listT: MockTournament[] = JSON.parse(storedT);
      if (listT.some(t => t.fixtures.some(f => f.matchId === matchId))) {
        return user;
      }
    }
  }
  return getActiveUser() || "CrickElite";
}

function syncMatchToSupabase(match: MatchState) {
  if (!supabase) return;
  supabase
    .from("crickelite_matches")
    .upsert({ id: match.matchId, data: match, updated_at: new Date().toISOString() })
    .then(({ error }) => {
      if (error) console.error("Error syncing match:", error);
    });
}

function syncTeamToSupabase(team: MockTeam) {
  if (!supabase) return;
  supabase
    .from("crickelite_teams")
    .upsert({ id: team.id, data: team, updated_at: new Date().toISOString() })
    .then(({ error }) => {
      if (error) console.error("Error syncing team:", error);
    });
}

function syncTournamentToSupabase(tournament: MockTournament) {
  if (!supabase) return;
  supabase
    .from("crickelite_tournaments")
    .upsert({ id: tournament.id, data: tournament, updated_at: new Date().toISOString() })
    .then(({ error }) => {
      if (error) console.error("Error syncing tournament:", error);
    });
}

function deleteMatchFromSupabase(matchId: string) {
  if (!supabase) return;
  supabase
    .from("crickelite_matches")
    .delete()
    .eq("id", matchId)
    .then(({ error }) => {
      if (error) console.error("Error deleting match:", error);
    });
}

export function deleteTournament(tournamentId: string) {
  if (typeof window === "undefined") return;
  let targetUser = getActiveUser();
  if (!targetUser) {
    targetUser = ["CrickElite", "DDUGroundCricket"].find(user => {
      const stored = localStorage.getItem(`${user}_tournaments`) || (user === "CrickElite" ? localStorage.getItem("pranscric_tournaments") : null);
      if (stored) {
        const arr: MockTournament[] = JSON.parse(stored);
        return arr.some(t => t.id === tournamentId);
      }
      return false;
    }) || "CrickElite";
  }

  const stored = localStorage.getItem(`${targetUser}_tournaments`) || (targetUser === "CrickElite" ? localStorage.getItem("pranscric_tournaments") : null);
  const current: MockTournament[] = stored ? JSON.parse(stored) : [];
  const updated = current.filter((t) => t.id !== tournamentId);
  localStorage.setItem(`${targetUser}_tournaments`, JSON.stringify(updated));
  localStorage.removeItem("pranscric_tournaments"); // clean legacy

  // Delete matches belonging to this tournament from local storage
  const tournamentObj = current.find(t => t.id === tournamentId);
  if (tournamentObj) {
    const matchIds = tournamentObj.fixtures.map(f => f.matchId);
    const matchesStored = localStorage.getItem(`${targetUser}_matches`) || (targetUser === "CrickElite" ? localStorage.getItem("pranscric_matches") : null);
    if (matchesStored) {
      const matchesArr: MatchState[] = JSON.parse(matchesStored);
      const filteredMatches = matchesArr.filter(m => !matchIds.includes(m.matchId));
      localStorage.setItem(`${targetUser}_matches`, JSON.stringify(filteredMatches));
      localStorage.removeItem("pranscric_matches"); // clean legacy
      
      // Delete matches from Supabase too
      matchIds.forEach(mId => {
        deleteMatchFromSupabase(mId);
      });
    }
  }

  // Delete tournament from Supabase
  if (supabase) {
    supabase
      .from("crickelite_tournaments")
      .delete()
      .eq("id", tournamentId)
      .then(({ error }) => {
        if (error) console.error("Error deleting tournament:", error);
      });
  }

  window.dispatchEvent(new Event("storage"));
}
