"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, LayoutDashboard, Radio, Users, Trophy, DollarSign, Activity, 
  Settings, Bell, Shield, Database, Cpu, Terminal, ArrowUpRight, Play 
} from "lucide-react";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import StadiumBackground from "@/components/background/StadiumBackground";
import { getMatches, getTournaments, getTeams } from "@/lib/mockData";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";

// System logs mock database
const INITIAL_LOGS = [
  { id: 1, type: "database", text: "Database migration schema v2.1 applied successfully.", time: "15:28:10" },
  { id: 2, type: "auth", text: "New Scorer authenticated: user scorer_012.", time: "15:29:45" },
  { id: 3, type: "websocket", text: "Realtime WebSocket channel created for live-cup-finals.", time: "15:30:12" },
  { id: 4, type: "cdn", text: "Edge CDN cache invalidated for tournament/crickverse-cup.", time: "15:31:05" },
  { id: 5, type: "pwa", text: "Background push service worker registered.", time: "15:32:00" }
];

export default function AdminDashboardPage() {
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [activePanel, setActivePanel] = useState<"overview" | "matches" | "settings" | "logs">("overview");
  const [rlsPolicy, setRlsPolicy] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  // Auto-ticking visitor/revenue dashboard metrics
  const [visitors, setVisitors] = useState(4820);
  const [revenue, setRevenue] = useState(12850);

  useEffect(() => {
    const timer = setInterval(() => {
      // Simulate live traffic fluctuations
      setVisitors((prev) => prev + Math.floor(Math.random() * 5 - 2));
      // Simulate slow revenue ticks
      if (Math.random() > 0.6) {
        setRevenue((prev) => prev + Math.floor(Math.random() * 15 + 5));
      }

      // Add a simulated live server log
      if (Math.random() > 0.7) {
        const logTypes = ["database", "websocket", "auth", "system", "pwa"];
        const randType = logTypes[Math.floor(Math.random() * logTypes.length)];
        let logText = "";
        
        switch (randType) {
          case "database":
            logText = "Supabase Realtime synced scoreboard payload [102 bytes].";
            break;
          case "websocket":
            logText = `Active viewer count tick resolved: ${visitors} active.`;
            break;
          case "auth":
            logText = "JWT session verified for viewer client.";
            break;
          case "system":
            logText = "Vercel Edge function cold-start optimized [12ms].";
            break;
          case "pwa":
            logText = "Manifest caches checked. All assets up-to-date.";
            break;
        }

        const now = new Date();
        const timeStr = now.toTimeString().split(" ")[0];
        
        setLogs((prev) => [
          { id: Date.now(), type: randType, text: logText, time: timeStr },
          ...prev.slice(0, 14) // Keep last 15 logs
        ]);
      }
    }, 4000);

    return () => clearInterval(timer);
  }, [visitors]);

  const trafficData = [
    { name: "Mon", matches: 4, visitors: 2100 },
    { name: "Tue", matches: 6, visitors: 3400 },
    { name: "Wed", matches: 3, visitors: 2800 },
    { name: "Thu", matches: 8, visitors: 4900 },
    { name: "Fri", matches: 12, visitors: 6200 },
    { name: "Sat", matches: 15, visitors: 8900 },
    { name: "Sun", matches: 10, visitors: 7800 },
  ];

  const totalMatches = getMatches().length;
  const totalTournaments = getTournaments().length;
  const totalPlayersCount = getTeams().reduce((acc, t) => acc + t.players.length, 0);

  return (
    <div className="relative min-h-screen flex flex-col font-inter text-white">
      <StadiumBackground />
      <Navigation />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        {/* Header Action row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs text-text-secondary hover:text-white mb-2 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="font-space text-2xl font-bold tracking-tight">Admin System Console</h1>
              <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-bold bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/10">
                System Healthy
              </span>
            </div>
          </div>

          {/* Navigation Sub-menu */}
          <div className="flex gap-2 bg-[#101010] p-1 rounded-full border border-white/5 text-xs font-mono">
            {[
              { id: "overview", label: "Overview" },
              { id: "matches", label: "Matches Control" },
              { id: "settings", label: "Database Config" },
              { id: "logs", label: "System Logs" }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePanel(p.id as any)}
                className={`px-4 py-1.5 rounded-full uppercase text-[10px] font-bold tracking-wider transition-all cursor-pointer ${
                  activePanel === p.id 
                    ? "bg-gold text-black font-extrabold" 
                    : "text-text-secondary hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Panel 1: OVERVIEW */}
        {activePanel === "overview" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* KPI Metrics Dashboard widgets */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Widget 1 */}
              <div className="glass p-6 rounded-[22px] border border-white/5 flex flex-col justify-between hover:shadow-[0_0_20px_rgba(212,175,55,0.05)] transition-all">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase font-mono text-text-secondary">Simulated Revenue</span>
                  <DollarSign className="h-4.5 w-4.5 text-gold" />
                </div>
                <div className="mt-4">
                  <h3 className="font-sora text-2xl font-bold tracking-tight text-white">${revenue}</h3>
                  <span className="text-[9px] text-emerald-400 font-mono mt-1 block">+12.4% vs last week</span>
                </div>
              </div>

              {/* Widget 2 */}
              <div className="glass p-6 rounded-[22px] border border-white/5 flex flex-col justify-between hover:shadow-[0_0_20px_rgba(0,200,255,0.05)] transition-all">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase font-mono text-text-secondary">Active Viewers</span>
                  <Activity className="h-4.5 w-4.5 text-blue" />
                </div>
                <div className="mt-4">
                  <h3 className="font-sora text-2xl font-bold tracking-tight text-blue">{visitors}</h3>
                  <span className="text-[9px] text-text-secondary font-mono mt-1 block">Live websocket sessions</span>
                </div>
              </div>

              {/* Widget 3 */}
              <div className="glass p-6 rounded-[22px] border border-white/5 flex flex-col justify-between transition-all">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase font-mono text-text-secondary">Total Leagues</span>
                  <Trophy className="h-4.5 w-4.5 text-green" />
                </div>
                <div className="mt-4">
                  <h3 className="font-sora text-2xl font-bold tracking-tight text-white">{totalTournaments}</h3>
                  <span className="text-[9px] text-text-secondary font-mono mt-1 block">Activated structures</span>
                </div>
              </div>

              {/* Widget 4 */}
              <div className="glass p-6 rounded-[22px] border border-white/5 flex flex-col justify-between transition-all">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase font-mono text-text-secondary">Registered Players</span>
                  <Users className="h-4.5 w-4.5 text-white/60" />
                </div>
                <div className="mt-4">
                  <h3 className="font-sora text-2xl font-bold tracking-tight text-white">{totalPlayersCount}</h3>
                  <span className="text-[9px] text-text-secondary font-mono mt-1 block">Rosters indexed</span>
                </div>
              </div>
            </div>

            {/* Layout Split: Charts & Mini-Console */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Traffic Chart */}
              <div className="lg:col-span-2 glass p-6 rounded-[22px] border border-white/5">
                <h3 className="font-space text-sm font-bold text-white mb-6 uppercase tracking-wider">
                  Platform Traffic & Activity
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trafficData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="name" stroke="#A9A9A9" fontSize={10} />
                      <YAxis stroke="#A9A9A9" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: "#171717", border: "1px solid rgba(255,255,255,0.1)" }} />
                      <Line type="monotone" dataKey="visitors" name="Spectator Hits" stroke="#00C8FF" strokeWidth={2.5} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="matches" name="Matches Scored" stroke="#D4AF37" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Mini Logs view */}
              <div className="glass p-6 rounded-[22px] border border-white/5 flex flex-col justify-between">
                <div>
                  <h3 className="font-space text-sm font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="h-4 w-4 text-gold" /> System Console Output
                  </h3>

                  <div className="space-y-3 font-mono text-[10px] leading-relaxed max-h-56 overflow-y-auto pr-1">
                    {logs.slice(0, 5).map((log) => {
                      let typeColor = "text-text-secondary";
                      if (log.type === "database") typeColor = "text-emerald-400";
                      else if (log.type === "websocket") typeColor = "text-blue";
                      else if (log.type === "auth") typeColor = "text-gold";

                      return (
                        <div key={log.id} className="border-b border-white/5 pb-2">
                          <div className="flex justify-between text-[9px] mb-0.5">
                            <span className={`${typeColor} font-bold uppercase`}>[{log.type}]</span>
                            <span className="opacity-55">{log.time}</span>
                          </div>
                          <p className="text-white/80">{log.text}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => setActivePanel("logs")}
                  className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-full py-2 text-xs font-bold mt-4 transition-colors font-space uppercase tracking-wider text-[10px]"
                >
                  Inspect Full System Logs
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Panel 2: MATCHES CONTROL */}
        {activePanel === "matches" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <h3 className="font-space text-sm font-bold text-white mb-4 uppercase tracking-wider">
              Manage Active Match Sessions
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {getMatches().map((m) => (
                <div key={m.matchId} className="glass p-6 rounded-[22px] border border-white/5 flex justify-between items-center gap-6">
                  <div>
                    <span className="text-[9px] uppercase font-mono text-text-secondary block">Match Session ID: {m.matchId}</span>
                    <h4 className="font-space font-bold text-base text-white mt-1">
                      {m.team1Name} vs {m.team2Name}
                    </h4>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`h-2 w-2 rounded-full ${m.status === "live" ? "bg-emerald-400 animate-pulse" : "bg-text-secondary"}`} />
                      <span className="text-[10px] uppercase font-mono text-text-secondary">{m.status}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/scorer?matchId=${m.matchId}`}
                      className="bg-gold text-black font-space font-bold uppercase text-[10px] tracking-wider px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
                    >
                      Control Scorer
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Panel 3: DATABASE CONFIG / SETTINGS */}
        {activePanel === "settings" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Supabase connection checklist */}
            <div className="md:col-span-2 glass p-8 rounded-[22px] border border-white/5 space-y-6">
              <h3 className="font-space text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Database className="h-5 w-5 text-gold" /> Supabase Connection (Edge Settings)
              </h3>

              <div className="space-y-4 text-xs font-light">
                <p className="text-text-secondary leading-relaxed">
                  PransCric utilizes a dual-engine architecture. If local environment configurations (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`) are missing, the server operates on client-side mocks automatically.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div>
                      <span className="font-semibold text-white block">Row-Level Security (RLS) policies</span>
                      <span className="text-[10px] text-text-secondary mt-0.5 block">Enforce user permissions on scoring write operations.</span>
                    </div>
                    <button
                      onClick={() => setRlsPolicy(!rlsPolicy)}
                      className={`h-6 w-11 rounded-full p-1 transition-colors ${rlsPolicy ? "bg-emerald-500" : "bg-white/10"}`}
                    >
                      <div className={`h-4 w-4 rounded-full bg-white transition-transform ${rlsPolicy ? "translate-x-5" : ""}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div>
                      <span className="font-semibold text-white block">Realtime Broadcast Sync Channels</span>
                      <span className="text-[10px] text-text-secondary mt-0.5 block">Enable real-time push streams to active spectator screens.</span>
                    </div>
                    <button
                      onClick={() => setPushNotifications(!pushNotifications)}
                      className={`h-6 w-11 rounded-full p-1 transition-colors ${pushNotifications ? "bg-emerald-500" : "bg-white/10"}`}
                    >
                      <div className={`h-4 w-4 rounded-full bg-white transition-transform ${pushNotifications ? "translate-x-5" : ""}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Server health check gauges */}
            <div className="glass p-6 rounded-[22px] border border-white/5 space-y-6">
              <h3 className="font-space text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Cpu className="h-4.5 w-4.5 text-blue" /> Infrastructure Metrics
              </h3>

              <div className="space-y-4">
                {/* Gauge 1 */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5 font-mono">
                    <span className="text-text-secondary">EDGE FUNCTION CPU</span>
                    <span className="text-white font-bold">14%</span>
                  </div>
                  <div className="w-full bg-[#101010] h-1.5 rounded-full overflow-hidden border border-white/5">
                    <div className="bg-blue h-full w-[14%]" />
                  </div>
                </div>

                {/* Gauge 2 */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5 font-mono">
                    <span className="text-text-secondary">DB CONNS CAPACITY</span>
                    <span className="text-white font-bold">3 / 100</span>
                  </div>
                  <div className="w-full bg-[#101010] h-1.5 rounded-full overflow-hidden border border-white/5">
                    <div className="bg-emerald-500 h-full w-[3%]" />
                  </div>
                </div>

                {/* Gauge 3 */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5 font-mono">
                    <span className="text-text-secondary">EDGE CACHE HIT RATE</span>
                    <span className="text-white font-bold">98.2%</span>
                  </div>
                  <div className="w-full bg-[#101010] h-1.5 rounded-full overflow-hidden border border-white/5">
                    <div className="bg-gold h-full w-[98.2%]" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Panel 4: SYSTEM LOGS */}
        {activePanel === "logs" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass p-8 rounded-[22px] border border-white/10 font-mono text-xs shadow-2xl relative"
          >
            <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
              <span className="text-sm font-bold text-white flex items-center gap-1.5 uppercase font-space">
                <Terminal className="h-4 w-4 text-gold" /> Active System Audit Logs
              </span>
              <span className="text-[10px] text-text-secondary">Autotick frequency: 4.0s</span>
            </div>

            <div className="space-y-3 leading-relaxed max-h-[400px] overflow-y-auto pr-2">
              {logs.map((log) => {
                let badge = "bg-white/5 text-text-secondary";
                if (log.type === "database") badge = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15";
                else if (log.type === "websocket") badge = "bg-blue/10 text-blue border border-blue/15";
                else if (log.type === "auth") badge = "bg-gold/10 text-gold border border-gold/15";
                else if (log.type === "system") badge = "bg-purple-500/10 text-purple-400 border border-purple-500/15";

                return (
                  <div key={log.id} className="p-3 bg-secondary/35 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold font-mono tracking-wider ${badge}`}>
                        {log.type}
                      </span>
                      <p className="text-white/80 font-mono text-[11px]">{log.text}</p>
                    </div>
                    <span className="text-[10px] opacity-45 font-mono">{log.time}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
