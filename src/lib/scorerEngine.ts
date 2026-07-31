export interface PlayerMatchStats {
  id: string;
  name: string;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  dismissalType?: string;
  bowledBy?: string;
  caughtBy?: string;
  runsConceded: number;
  ballsBowled: number;
  wickets: number;
  maidens: number;
}

export interface BallRecord {
  ballId: string;
  overNumber: number;
  ballNumber: number; // 1-indexed ball in the current over
  batterId: string;
  batterName: string;
  bowlerId: string;
  bowlerName: string;
  runsBatter: number;
  runsExtras: number;
  extraType: "wide" | "noball" | "bye" | "legbye" | null;
  wicketType: "bowled" | "caught" | "lbw" | "stumped" | "runout" | "hitwicket" | "retired_hurt" | null;
  dismissedPlayerId?: string;
  dismissedPlayerName?: string;
  commentary: string;
  wagonAngle?: number; // 0-360 degrees for wagon wheel UI
}

export interface InningsState {
  teamName: string;
  runs: number;
  wickets: number;
  ballsBowled: number; // total legal balls
  oversLimit: number;
  battingStats: Record<string, PlayerMatchStats>; // playerId -> stats
  bowlingStats: Record<string, PlayerMatchStats>; // playerId -> stats
  balls: BallRecord[];
  currentBatter1Id: string; // on strike
  currentBatter2Id: string; // off strike
  currentBowlerId: string;
  extras: {
    wides: number;
    noballs: number;
    byes: number;
    legbyes: number;
  };
}

export interface MatchState {
  matchId: string;
  team1Name: string;
  team2Name: string;
  tossWinner: string;
  tossDecision: "bat" | "bowl";
  oversLimit: number;
  status: "scheduled" | "live" | "completed" | "paused";
  winnerName?: string;
  firstInnings: InningsState;
  secondInnings?: InningsState;
  currentInningsNumber: 1 | 2;
  ground?: string;
  matchDate?: string;
  matchTime?: string;
  team1CaptainName?: string;
  team2CaptainName?: string;
  wicketsLimit?: number;
  matchCategory?: "League Match" | "Semi-Final" | "Final" | "Super Over";
  tossWinnerName?: string;
  isTossCompleted?: boolean;
  history: string[]; // JSON stringified states for undo
}

// Convert balls to formatted overs (e.g. 17 balls -> 2.5 overs)
export function ballsToOvers(balls: number): string {
  const completedOvers = Math.floor(balls / 6);
  const remainingBalls = balls % 6;
  return `${completedOvers}.${remainingBalls}`;
}

// Parse overs to total balls (e.g. "2.5" -> 17)
export function oversToBalls(oversStr: string): number {
  const parts = oversStr.split(".");
  const completedOvers = parseInt(parts[0], 10) || 0;
  const remainingBalls = parseInt(parts[1], 10) || 0;
  return completedOvers * 6 + remainingBalls;
}

// Calculate Current Run Rate (CRR)
export function calculateCRR(runs: number, balls: number): number {
  if (balls === 0) return 0;
  return parseFloat(((runs / balls) * 6).toFixed(2));
}

// Calculate Required Run Rate (RRR)
export function calculateRRR(targetRuns: number, currentRuns: number, ballsRemaining: number): number {
  if (ballsRemaining <= 0) return currentRuns >= targetRuns ? 0 : 99.99;
  const runsNeeded = targetRuns - currentRuns;
  if (runsNeeded <= 0) return 0;
  return parseFloat(((runsNeeded / ballsRemaining) * 6).toFixed(2));
}

// Add a ball event to the innings state
export function addBallToInnings(
  state: InningsState,
  event: {
    runsBatter: number;
    extraType: "wide" | "noball" | "bye" | "legbye" | null;
    wicketType: "bowled" | "caught" | "lbw" | "stumped" | "runout" | "hitwicket" | "retired_hurt" | null;
    dismissedPlayerId?: string;
    wagonAngle?: number;
  }
): InningsState {
  const newState = JSON.parse(JSON.stringify(state)) as InningsState;
  
  const { runsBatter, extraType, wicketType, dismissedPlayerId, wagonAngle } = event;
  const batterId = newState.currentBatter1Id;
  const bowlerId = newState.currentBowlerId;
  
  if (!batterId || !bowlerId) return newState;

  // Initialize stats if not present
  if (!newState.battingStats[batterId]) {
    newState.battingStats[batterId] = createEmptyPlayerStats(batterId, "Batter");
  }
  if (!newState.bowlingStats[bowlerId]) {
    newState.bowlingStats[bowlerId] = createEmptyPlayerStats(bowlerId, "Bowler");
  }

  let ballIsLegal = true;
  let runsAdded = 0;
  let extraRunsAdded = 0;

  // Handle extras calculation
  if (extraType === "wide") {
    ballIsLegal = false;
    extraRunsAdded = 1; // Wide penalty is 1 extra run
    runsAdded = runsBatter; // Batter gets runs run from wide ball
    newState.extras.wides += extraRunsAdded;
    newState.battingStats[batterId].runs += runsAdded;
    if (runsAdded === 4) newState.battingStats[batterId].fours += 1;
    if (runsAdded === 6) newState.battingStats[batterId].sixes += 1;
    newState.bowlingStats[bowlerId].runsConceded += (runsAdded + extraRunsAdded);
  } else if (extraType === "noball") {
    ballIsLegal = false;
    extraRunsAdded = 1; 
    runsAdded = runsBatter; // runs scored off noball go to batter
    newState.extras.noballs += extraRunsAdded;
    newState.battingStats[batterId].runs += runsAdded;
    newState.battingStats[batterId].ballsFaced += 1; // batter faced the no ball
    if (runsAdded === 4) newState.battingStats[batterId].fours += 1;
    if (runsAdded === 6) newState.battingStats[batterId].sixes += 1;
    newState.bowlingStats[bowlerId].runsConceded += (runsAdded + extraRunsAdded);
  } else if (extraType === "bye") {
    ballIsLegal = true;
    extraRunsAdded = runsBatter; // runs ran counted as extras
    newState.extras.byes += extraRunsAdded;
    newState.battingStats[batterId].ballsFaced += 1;
    // Bowler is NOT charged for byes
  } else if (extraType === "legbye") {
    ballIsLegal = true;
    extraRunsAdded = runsBatter; // runs ran counted as extras
    newState.extras.legbyes += extraRunsAdded;
    newState.battingStats[batterId].ballsFaced += 1;
    // Bowler is NOT charged for legbyes
  } else {
    // Normal ball
    ballIsLegal = true;
    runsAdded = runsBatter;
    newState.battingStats[batterId].runs += runsAdded;
    newState.battingStats[batterId].ballsFaced += 1;
    if (runsAdded === 4) newState.battingStats[batterId].fours += 1;
    if (runsAdded === 6) newState.battingStats[batterId].sixes += 1;
    newState.bowlingStats[bowlerId].runsConceded += runsAdded;
  }

  // Calculate final additions to team score
  const totalBallScore = runsAdded + extraRunsAdded;
  newState.runs += totalBallScore;

  if (ballIsLegal) {
    newState.ballsBowled += 1;
    newState.bowlingStats[bowlerId].ballsBowled += 1;
  }

  // Wicket logic
  let dismissedPlayerName = "";
  if (wicketType) {
    if (wicketType !== "retired_hurt") {
      newState.wickets += 1;
    }
    const victimId = dismissedPlayerId || (wicketType === "runout" ? newState.currentBatter1Id : newState.currentBatter1Id); // Default to striker unless runout specified

    if (newState.battingStats[victimId]) {
      newState.battingStats[victimId].isOut = wicketType !== "retired_hurt";
      newState.battingStats[victimId].dismissalType = wicketType;
      dismissedPlayerName = newState.battingStats[victimId].name;
    }

    // Bowler gets credit for wicket unless it's a runout or retired hurt
    if (wicketType !== "runout" && wicketType !== "retired_hurt") {
      newState.bowlingStats[bowlerId].wickets += 1;
      if (newState.battingStats[victimId]) {
        newState.battingStats[victimId].bowledBy = newState.bowlingStats[bowlerId].name;
      }
    } else if (wicketType === "runout") {
      if (newState.battingStats[victimId]) {
        newState.battingStats[victimId].dismissalType = "Run Out";
      }
    }
  }

  // Generate ball-by-ball commentary snippet
  const batterName = newState.battingStats[batterId]?.name || "Striker";
  const bowlerName = newState.bowlingStats[bowlerId]?.name || "Bowler";
  const currentOverNum = Math.floor((newState.ballsBowled - (ballIsLegal ? 1 : 0)) / 6);
  const currentBallInOver = ((newState.ballsBowled - (ballIsLegal ? 1 : 0)) % 6) + 1;
  
  let commentaryText = `${bowlerName} to ${batterName}: `;
  if (wicketType) {
    commentaryText += `OUT! ${dismissedPlayerName} has been ${wicketType.replace("_", " ")}!`;
  } else if (extraType === "wide") {
    commentaryText += `Wide ball! (+1 run) ${runsBatter > 0 ? `Batters run ${runsBatter} extra(s).` : ""}`;
  } else if (extraType === "noball") {
    commentaryText += `No ball! (+1 run) ${runsBatter > 0 ? `Batter hits it for ${runsBatter} runs.` : ""}`;
  } else if (extraType === "bye") {
    commentaryText += `${runsBatter} Bye(s) taken.`;
  } else if (extraType === "legbye") {
    commentaryText += `${runsBatter} Leg bye(s) taken.`;
  } else {
    if (runsBatter === 0) commentaryText += "No run.";
    else if (runsBatter === 4) commentaryText += "FOUR! Splendid shot to the boundary!";
    else if (runsBatter === 6) commentaryText += "SIX! Dispatched over the stadium roof!";
    else commentaryText += `${runsBatter} run(s).`;
  }

  // Add ball record
  const newBallRecord: BallRecord = {
    ballId: Math.random().toString(36).substring(2, 9),
    overNumber: currentOverNum,
    ballNumber: currentBallInOver,
    batterId,
    batterName,
    bowlerId,
    bowlerName,
    runsBatter,
    runsExtras: extraRunsAdded,
    extraType,
    wicketType,
    dismissedPlayerId,
    dismissedPlayerName,
    commentary: commentaryText,
    wagonAngle
  };

  newState.balls.push(newBallRecord);

  // Switch Strike on 1, 3, 5 runs scored (runs off bat or run extras like byes)
  const runsRunning = extraType === "bye" || extraType === "legbye" ? extraRunsAdded : runsAdded;
  if (runsRunning % 2 !== 0 && wicketType !== "runout") {
    // Switch batter 1 and batter 2
    const temp = newState.currentBatter1Id;
    newState.currentBatter1Id = newState.currentBatter2Id;
    newState.currentBatter2Id = temp;
  }

  // End of Over check (6 legal balls)
  if (ballIsLegal && newState.ballsBowled % 6 === 0) {
    // Switch strike at the end of the over
    const temp = newState.currentBatter1Id;
    newState.currentBatter1Id = newState.currentBatter2Id;
    newState.currentBatter2Id = temp;
  }

  return newState;
}

function createEmptyPlayerStats(id: string, name: string): PlayerMatchStats {
  return {
    id,
    name,
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
