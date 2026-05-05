import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Activity, 
  AlertTriangle, 
  BarChart3, 
  Car, 
  LayoutDashboard, 
  Moon, 
  Sun, 
  TrafficCone,
  Zap,
  Clock,
  Upload,
  FileVideo,
  Play,
  ChevronRight,
  ShieldAlert,
  Settings,
  Bell,
  Search,
  Map as MapIcon,
  Cpu,
  Globe,
  Radio,
  Menu,
  X
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080';
console.log("Initializing Neural Link with:", API_BASE_URL);

const WS_URL = import.meta.env.VITE_WS_URL || 
  (API_BASE_URL.startsWith('https') 
    ? API_BASE_URL.replace('https', 'wss') + '/ws'
    : API_BASE_URL.replace('http', 'ws') + '/ws');

// Premium Sidebar Item Component
const SidebarItem = ({ icon: Icon, label, active, onClick, color = "blue" }) => {
  const colorMap = {
    blue: "text-blue-400 group-hover:text-blue-300",
    purple: "text-purple-400 group-hover:text-purple-300",
    emerald: "text-emerald-400 group-hover:text-emerald-300",
    rose: "text-rose-400 group-hover:text-rose-300"
  };

  return (
    <motion.button
      whileHover={{ x: 10 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-500 group border-2 ${
        active 
          ? 'bg-white/10 border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.05)]' 
          : 'border-transparent hover:bg-white/5'
      }`}
    >
      <div className={`p-2 rounded-xl transition-colors ${active ? 'bg-white/10' : 'bg-transparent'}`}>
        <Icon className={`w-6 h-6 ${active ? 'text-white' : colorMap[color]}`} />
      </div>
      <span className={`font-bold uppercase tracking-[0.2em] text-[10px] ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
        {label}
      </span>
      {active && (
        <motion.div 
          layoutId="active-indicator" 
          className="ml-auto w-1 h-6 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]" 
        />
      )}
    </motion.button>
  );
};

// Premium Loading Screen
const LoadingScreen = () => (
  <motion.div 
    exit={{ opacity: 0, scale: 1.1 }}
    className="fixed inset-0 z-[100] bg-vibrant flex flex-col items-center justify-center overflow-hidden"
  >
    <div className="absolute inset-0 cyber-grid opacity-30" />
    
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative z-10 flex flex-col items-center"
    >
      <div className="relative mb-8">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
          className="w-48 h-48 rounded-full border-2 border-dashed border-blue-500/30 absolute -inset-6"
        />
        <div className="w-36 h-36 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-900 rounded-[2.5rem] flex items-center justify-center shadow-[0_0_100px_rgba(37,99,235,0.4)] border-2 border-white/20 relative overflow-hidden">
          <TrafficCone className="text-white w-16 h-16 relative z-10 drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]" />
          <div className="scanline" />
        </div>
      </div>
      
      <motion.h1 className="text-4xl font-black tracking-tighter text-white mb-4 text-center">
        TRAFFIC<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">AI</span>
      </motion.h1>
      
      <div className="flex flex-col items-center gap-4">
        <div className="w-64 h-2 bg-white/5 rounded-full relative overflow-hidden border border-white/10">
          <motion.div 
            animate={{ x: ['-100%', '200%'] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
          />
        </div>
        <p className="text-blue-400 font-bold uppercase tracking-[0.4em] text-[10px]">INITIALIZING_NEURAL_LINK</p>
      </div>
    </motion.div>
  </motion.div>
);

const VideoUpload = ({ onUploadSuccess }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);

  const handleFile = async (selectedFile) => {
    if (!selectedFile.type.startsWith('video/')) {
      alert("Invalid format. Video source required.");
      return;
    }
    setFile(selectedFile);
    setUploading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFile(null);
      onUploadSuccess();
    } catch (error) {
      console.error("Upload error details:", error);
      const errorMsg = error.response 
        ? `Server Error: ${error.response.status}` 
        : "Network Error: Cannot reach backend";
      alert(`${errorMsg}. Please ensure the backend is active at ${API_BASE_URL} and try again.`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative h-full min-h-[400px] p-8 rounded-[3rem] border-4 border-dashed transition-all duration-700 flex flex-col items-center justify-center group overflow-hidden ${
        dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 bg-white/5 hover:border-blue-500/30'
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files[0]); }}
    >
      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} accept="video/*" />
      
      <div className="relative mb-8">
        <motion.div 
          animate={uploading ? { rotate: 360, scale: [1, 1.1, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
          className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center transition-all duration-500 ${
            uploading ? 'bg-blue-600 shadow-[0_0_50px_rgba(37,99,235,0.6)]' : 'bg-white/10 group-hover:bg-blue-500/20'
          }`}
        >
          {uploading ? <Activity className="w-14 h-14 text-white" /> : <Upload className="w-12 h-12 text-slate-400 group-hover:text-blue-400 transition-colors" />}
        </motion.div>
      </div>

      <h3 className="text-3xl font-black text-white mb-4 tracking-tighter uppercase">{uploading ? "Analyzing" : "Upload"}</h3>
      <p className="text-blue-400 font-bold text-[10px] uppercase tracking-[0.3em] text-center max-w-[240px]">
        {file ? file.name : "Select Video Source"}
      </p>
      
      {uploading && (
        <div className="w-full max-w-[240px] mt-8 bg-white/5 h-2 rounded-full overflow-hidden border border-white/10">
          <motion.div 
            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 3 }}
          />
        </div>
      )}
    </motion.div>
  );
};

function App() {
  const [trafficData, setTrafficData] = useState({
    road1: { count: 0, car: 0, bike: 0, truck: 0, signal: 'RED', emergency: false },
    road2: { count: 0, car: 0, bike: 0, truck: 0, signal: 'RED', emergency: false },
    road3: { count: 0, car: 0, bike: 0, truck: 0, signal: 'RED', emergency: false },
    uploaded: { count: 0, car: 0, bike: 0, truck: 0, signal: 'NONE', emergency: false, filename: null }
  });
  const [historyData, setHistoryData] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [uploadKey, setUploadKey] = useState(Date.now());
  const ws = useRef(null);

  useEffect(() => {
    // Ping test
    axios.get(`${API_BASE_URL}/health`)
      .then(r => console.log("Neural Link Established:", r.data))
      .catch(e => console.error("Neural Link Failed! Check API_BASE_URL:", API_BASE_URL, e));

    // Reset upload state on refresh
    axios.post(`${API_BASE_URL}/reset-upload`).catch(e => console.error(e));

    connectWebSocket();
    fetchHistory();
    const historyInterval = setInterval(fetchHistory, 10000);
    const timer = setTimeout(() => setIsLoading(false), 2500);
    
    return () => {
      if (ws.current) ws.current.close();
      clearInterval(historyInterval);
      clearTimeout(timer);
    };
  }, []);

  const connectWebSocket = () => {
    try {
      ws.current = new WebSocket(WS_URL);
      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setTrafficData(data);
      };
      ws.current.onclose = () => {
        setTimeout(connectWebSocket, 3000);
      };
      ws.current.onerror = () => {
        ws.current.close();
      };
    } catch (e) {
      setTimeout(connectWebSocket, 3000);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/history`);
      const formattedHistory = [];
      const { road1, road2, road3 } = response.data;
      const length = Math.max(road1?.length || 0, road2?.length || 0, road3?.length || 0);

      for (let i = 0; i < length; i++) {
        formattedHistory.push({
          time: road1?.[i]?.time || road2?.[i]?.time || road3?.[i]?.time || '',
          Road1: road1?.[i]?.count || 0,
          Road2: road2?.[i]?.count || 0,
          Road3: road3?.[i]?.count || 0,
        });
      }
      setHistoryData(formattedHistory);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  const roadColors = {
    road1: { base: "blue", hex: "#3b82f6", bg: "bg-blue-600/20", border: "border-blue-500/30", text: "text-blue-400" },
    road2: { base: "purple", hex: "#8b5cf6", bg: "bg-purple-600/20", border: "border-purple-500/30", text: "text-purple-400" },
    road3: { base: "emerald", hex: "#10b981", bg: "bg-emerald-600/20", border: "border-emerald-500/30", text: "text-emerald-400" },
    uploaded: { base: "rose", hex: "#f43f5e", bg: "bg-rose-600/20", border: "border-rose-500/30", text: "text-rose-400" }
  };

  return (
    <div className="min-h-screen bg-vibrant selection:bg-blue-500/30 relative">
      <AnimatePresence>
        {isLoading && <LoadingScreen key="loader" />}
      </AnimatePresence>

      <div className="fixed inset-0 cyber-grid pointer-events-none opacity-20" />
      
      {/* Premium Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-64 sm:w-72 flex flex-col p-4 sm:p-6 glass-card border-r border-white/10 z-[80] transition-transform duration-500 xl:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} xl:flex`}>
        <button 
          onClick={() => setIsSidebarOpen(false)}
          className="xl:hidden absolute top-4 right-4 p-2 rounded-lg bg-white/5 border border-white/10 text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-8 px-2 group cursor-pointer">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-800 p-2.5 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] group-hover:scale-110 transition-all duration-500 border border-white/20">
            <TrafficCone className="text-white w-4 h-4" />
          </div>
          <div>
            <h2 className="font-black text-base tracking-tighter text-white leading-none">TRAFFIC<span className="text-blue-400">AI</span></h2>
            <p className="text-[6px] font-black tracking-[0.2em] text-blue-500/60 uppercase mt-1">CORE_COMMAND_V5.0</p>
          </div>
        </div>

        <nav className="flex-1 space-y-4">
          <SidebarItem icon={LayoutDashboard} label="Neural Deck" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); window.scrollTo({top: 0, behavior: 'smooth'}); }} color="blue" />
          <SidebarItem icon={MapIcon} label="City Grid" active={activeTab === 'map'} onClick={() => { setActiveTab('map'); setIsSidebarOpen(false); window.scrollTo({top: 0, behavior: 'smooth'}); }} color="purple" />
          <SidebarItem icon={BarChart3} label="Analytics" active={activeTab === 'analytics'} onClick={() => { setActiveTab('analytics'); setIsSidebarOpen(false); window.scrollTo({top: 0, behavior: 'smooth'}); }} color="emerald" />
          <SidebarItem icon={ShieldAlert} label="Incident Log" active={activeTab === 'incidents'} onClick={() => { setActiveTab('incidents'); setIsSidebarOpen(false); window.scrollTo({top: 0, behavior: 'smooth'}); }} color="rose" />
        </nav>

        <div className="mt-auto space-y-6">
          <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 relative overflow-hidden group">
            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-4">Core Integrity</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-pulse" />
                <span className="text-sm font-black text-white">99.9% SYNC</span>
              </div>
            </div>
          </div>
          <SidebarItem icon={Settings} label="System Config" color="blue" onClick={() => setConfigOpen(true)} />
        </div>
      </aside>

      {/* System Config Modal */}
      <AnimatePresence>
        {configOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
            onClick={() => setConfigOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="glass-card w-full max-w-lg p-10 rounded-[2.5rem] border-2 border-white/10 relative"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-4">
                <Settings className="text-blue-400" /> SYSTEM_CONFIG
              </h2>
              <div className="space-y-6">
                {[
                  { label: 'Neural Confidence', val: '0.45' },
                  { label: 'Hardware Acceleration', val: 'ENABLED' },
                  { label: 'Cloud Reporting', val: '250ms' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-xs font-black text-white uppercase">{item.label}</p>
                    <span className="text-blue-400 text-xs font-black">{item.val}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setConfigOpen(false)} className="w-full mt-8 bg-blue-600 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs">Save Settings</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="xl:ml-72 min-h-screen p-3 sm:p-6 transition-all duration-500 relative">
        
        {/* Sticky Header */}
        <header className="flex flex-col md:flex-row items-center justify-between mb-4 sm:mb-6 glass-card rounded-xl sm:rounded-3xl p-2.5 sm:p-4 border border-white/10 sticky top-0 z-40 shadow-2xl gap-3 sm:gap-4 bg-[#02040a]/80 backdrop-blur-3xl">
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <button onClick={() => setIsSidebarOpen(true)} className="xl:hidden p-2 rounded-lg glass-card text-white border border-white/10 shadow-lg"><Menu className="w-4 h-4" /></button>
            <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-lg w-full max-w-xl border border-white/10 group shadow-inner">
              <Search className="w-3 h-3 text-slate-500 group-focus-within:text-blue-400" />
              <input type="text" placeholder="SEARCH_NODE..." className="bg-transparent border-none outline-none text-[9px] w-full font-bold text-white placeholder:text-slate-600 uppercase tracking-widest" />
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="flex gap-1.5">
              <button className="p-2 rounded-lg glass-card text-slate-400 border border-white/10 btn-premium relative"><Bell className="w-4 h-4" /><span className="absolute top-2 right-2 w-1 h-1 bg-rose-500 rounded-full" /></button>
              <button className="p-2 rounded-lg glass-card text-emerald-400 border border-white/10 btn-premium"><Radio className="w-4 h-4" /></button>
            </div>
            <div className="h-8 w-px bg-white/10 mx-1 hidden md:block" />
            <div className="flex items-center gap-2.5 group cursor-pointer">
              <div className="text-right">
                <p className="text-[9px] font-black text-white tracking-tight leading-none uppercase">Admin</p>
                <p className="text-[6px] font-black text-blue-500 uppercase tracking-widest mt-1">Chief</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-800 border border-white/20 shadow-lg flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4 text-white/80" />
              </div>
            </div>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-10">
            <div className="xl:col-span-8 space-y-6 lg:space-y-8">
              
              {/* Hero */}
              <motion.div className="relative overflow-hidden bg-gradient-to-br from-indigo-900/40 via-blue-900/20 to-transparent rounded-2xl lg:rounded-[2.5rem] p-5 sm:p-6 lg:p-10 border-2 border-white/10 shadow-2xl group">
                <div className="absolute inset-0 cyber-grid opacity-30" />
                <div className="absolute -right-10 -bottom-10 opacity-10 transform group-hover:rotate-12 transition-all duration-1000"><TrafficCone className="w-32 h-32 sm:w-48 sm:h-48 text-blue-500" /></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3 sm:mb-4">
                    <div className="px-2.5 py-1 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 text-[6px] sm:text-[9px] font-black uppercase tracking-widest">AI_INFRA_ACTIVE</div>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <h2 className="text-xl sm:text-4xl lg:text-5xl font-black text-white mb-2 sm:mb-3 tracking-tighter leading-none">Neural <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Infrastructure</span></h2>
                  <p className="text-slate-300 text-[8px] sm:text-xs lg:text-sm font-bold max-w-lg leading-relaxed mb-4 sm:mb-6 uppercase tracking-widest opacity-80">Autonomous traffic orchestration processing <span className="text-white border-b-2 border-blue-500/50">120FPS</span> telemetry.</p>
                  <div className="flex flex-wrap gap-3 sm:gap-5">
                    {[{ icon: Zap, label: 'Engine', val: 'YOLOv8_N', color: 'blue' }, { icon: Activity, label: 'Latency', val: '0.002ms', color: 'purple' }].map((stat, i) => (
                      <div key={i} className="flex items-center gap-2.5 glass-card px-4 py-2.5 rounded-xl border border-white/10 flex-1 min-w-[130px] sm:min-w-[150px]">
                        <div className={`p-1.5 bg-${stat.color}-500/20 rounded-lg`}><stat.icon className={`w-3.5 h-3.5 text-${stat.color}-400`} /></div>
                        <div><p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{stat.label}</p><p className="text-[10px] sm:text-base font-black text-white uppercase">{stat.val}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
                <VideoUpload onUploadSuccess={() => setUploadKey(Date.now())} />
                {trafficData.uploaded.filename ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card rounded-2xl sm:rounded-[2.5rem] overflow-hidden border-2 border-rose-500/40 shadow-xl group">
                    <div className="p-4 sm:p-6 flex justify-between items-center bg-rose-600/10 border-b border-white/10">
                      <div className="flex items-center gap-3 sm:gap-4"><div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-rose-600 flex items-center justify-center"><Play className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-current" /></div>
                      <div><h3 className="font-black text-sm sm:text-lg text-white uppercase">Neural Stream</h3><p className="text-[6px] sm:text-[8px] text-rose-400 font-black truncate max-w-[100px] sm:max-w-[150px]">{trafficData.uploaded.filename}</p></div></div>
                    </div>
                    <div className="aspect-video bg-black relative"><img src={`${API_BASE_URL}/video-feed/uploaded?t=${uploadKey}`} className="w-full h-full object-contain" alt="Feed" key={`${trafficData.uploaded.filename}-${uploadKey}`} /><div className="scanline" /></div>
                    <div className="p-4 sm:p-6 bg-white/5 flex flex-col gap-4">
                       <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-black/60 flex items-center justify-center border border-white/10">
                              <Car className="w-5 h-5 sm:w-7 sm:h-7 text-rose-400" />
                            </div>
                            <div>
                              <span className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tabular-nums">{trafficData.uploaded.count}</span>
                              <span className="text-[6px] sm:text-[8px] font-black text-rose-500 uppercase block mt-1">TOTAL_UNITS</span>
                            </div>
                          </div>
                          <button className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-rose-600 text-white shadow-lg btn-premium shrink-0">
                            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 mx-auto" />
                          </button>
                       </div>
                       
                       <div className="grid grid-cols-3 gap-2 sm:gap-4">
                          {[
                            { label: 'CARS', value: trafficData.uploaded.car, color: 'blue' },
                            { label: 'BIKES', value: trafficData.uploaded.bike, color: 'purple' },
                            { label: 'TRUCKS', value: trafficData.uploaded.truck, color: 'emerald' }
                          ].map((item, idx) => (
                            <div key={idx} className="bg-black/40 p-2 sm:p-4 rounded-xl border border-white/10 text-center">
                              <p className={`text-[6px] sm:text-[8px] font-black text-${item.color}-400 uppercase mb-1`}>{item.label}</p>
                              <p className="text-sm sm:text-xl font-black text-white">{item.value}</p>
                            </div>
                          ))}
                       </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="glass-card rounded-2xl sm:rounded-[2.5rem] flex flex-col items-center justify-center p-8 sm:p-12 border-2 border-white/5 border-dashed"><FileVideo className="w-10 h-10 text-slate-700 mb-4 sm:mb-6" /><p className="text-[8px] sm:text-[10px] font-black text-slate-600 uppercase tracking-widest">Awaiting Ingest</p></div>
                )}
              </div>

              {/* Continuous Video Feeds */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
                {['road1', 'road2', 'road3'].map((road, idx) => {
                  const nodeColors = { road1: 'blue', road2: 'purple', road3: 'emerald' };
                  const color = nodeColors[road];
                  const data = trafficData[road];
                  return (
                    <motion.div key={road} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }} className={`glass-card rounded-2xl sm:rounded-[2.5rem] overflow-hidden border-2 border-${color}-500/40 shadow-xl group`}>
                      <div className={`p-4 sm:p-6 flex justify-between items-center bg-${color}-600/10 border-b border-white/10`}>
                        <div className="flex items-center gap-3 sm:gap-4"><div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-${color}-600 flex items-center justify-center`}><Play className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-current" /></div>
                        <div><h3 className="font-black text-sm sm:text-lg text-white uppercase">Stream {idx + 1}</h3><p className={`text-[6px] sm:text-[8px] text-${color}-400 font-black truncate max-w-[100px] sm:max-w-[150px]`}>{road.toUpperCase()}</p></div></div>
                      </div>
                      <div className="aspect-video bg-black relative"><img src={`${API_BASE_URL}/video-feed/${road}`} className="w-full h-full object-contain" alt={`${road} feed`} /><div className="scanline" /></div>
                      <div className="p-4 sm:p-6 bg-white/5 flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3 sm:gap-4">
                              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-black/60 flex items-center justify-center border border-white/10">
                                <Car className={`w-5 h-5 sm:w-7 sm:h-7 text-${color}-400`} />
                              </div>
                              <div>
                                <span className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tabular-nums">{data.count}</span>
                                <span className={`text-[6px] sm:text-[8px] font-black text-${color}-500 uppercase block mt-1`}>TOTAL_UNITS</span>
                              </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 sm:gap-4">
                            {[
                              { label: 'CARS', value: data.car },
                              { label: 'BIKES', value: data.bike },
                              { label: 'TRUCKS', value: data.truck }
                            ].map((item, i) => (
                              <div key={i} className="bg-black/40 p-2 sm:p-4 rounded-xl border border-white/10 text-center">
                                <p className={`text-[6px] sm:text-[8px] font-black text-${color}-400 uppercase mb-1`}>{item.label}</p>
                                <p className="text-sm sm:text-xl font-black text-white">{item.value}</p>
                              </div>
                            ))}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Analytics */}
              <div className="glass-card rounded-2xl lg:rounded-[2.5rem] p-5 sm:p-10 border border-white/10 relative overflow-hidden shadow-2xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4 relative z-10">
                  <h3 className="font-black text-lg sm:text-2xl tracking-tighter flex items-center gap-2.5 sm:gap-3 text-white uppercase"><div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-indigo-600/20 flex items-center justify-center border border-indigo-500/40"><BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" /></div> DATA_STREAM</h3>
                  <div className="flex gap-1 p-1 glass-card rounded-lg border border-white/10 shadow-inner w-full sm:w-auto overflow-x-auto">
                    {['1H', '24H', '7D'].map(t => (<button key={t} className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-md sm:rounded-lg text-[8px] sm:text-[9px] font-black transition-all ${t === '1H' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>{t}</button>))}
                  </div>
                </div>
                <div className="h-[180px] sm:h-[300px] w-full relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historyData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                        <linearGradient id="colorPurple" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient>
                        <linearGradient id="colorEmerald" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="time" stroke="#64748b" fontSize={6} fontWeight="900" tickLine={false} axisLine={false} dy={5} />
                      <YAxis stroke="#64748b" fontSize={6} fontWeight="900" tickLine={false} axisLine={false} dx={0} />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(13, 17, 23, 0.95)', borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '8px', fontSize: '7px', fontWeight: '900', color: '#fff' }} />
                      <Area type="monotone" dataKey="Road1" stroke="#3b82f6" strokeWidth={1.5} fillOpacity={1} fill="url(#colorBlue)" />
                      <Area type="monotone" dataKey="Road2" stroke="#8b5cf6" strokeWidth={1.5} fillOpacity={1} fill="url(#colorPurple)" />
                      <Area type="monotone" dataKey="Road3" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#colorEmerald)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Right Deck */}
            <div className="xl:col-span-4 space-y-6 lg:space-y-8">
              <div className="glass-card rounded-2xl lg:rounded-[2.5rem] p-5 sm:p-8 border border-white/10 shadow-2xl">
                <div className="flex items-center justify-between mb-4 sm:mb-6"><h3 className="font-black text-[9px] uppercase tracking-widest text-white">Neural Status</h3><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /></div>
                <div className="space-y-2.5 sm:space-y-3">
                  {trafficData.uploaded.filename && (
                    <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 transition-all shadow-inner overflow-hidden">
                      <div className="flex items-center gap-2.5 sm:gap-3 overflow-hidden">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-black/60 flex items-center justify-center border-2 border-rose-500/30 shrink-0">
                          <FileVideo className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
                        </div>
                        <div className="truncate">
                          <p className="text-[9px] sm:text-[10px] font-black text-white truncate uppercase">UPLOADED_STREAM</p>
                          <p className="text-[5px] sm:text-[6px] text-slate-500 font-black uppercase mt-0.5 sm:mt-1">Active</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg sm:text-xl font-black tabular-nums leading-none text-rose-400">{trafficData.uploaded.count}</p>
                        <p className="text-[5px] sm:text-[6px] text-slate-600 font-black uppercase mt-0.5 sm:mt-1">UNITS</p>
                      </div>
                    </div>
                  )}
                  {!trafficData.uploaded.filename && (
                    <div className="text-center py-8 opacity-20">
                      <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Awaiting Data</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="glass-card rounded-2xl lg:rounded-[2.5rem] p-5 sm:p-8 border-2 border-rose-500/20 shadow-xl h-[350px] sm:h-[400px] flex flex-col">
                <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-6 shrink-0"><div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-rose-600/20 flex items-center justify-center border border-rose-500/40"><AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" /></div><div><h3 className="font-black text-[9px] sm:text-[10px] uppercase text-white">System Alerts</h3><p className="text-[6px] sm:text-[7px] text-rose-500/60 font-black uppercase mt-0.5 sm:mt-1">Priority_Monitoring</p></div></div>
                <div className="space-y-2.5 sm:space-y-3 overflow-y-auto pr-1.5 custom-scrollbar flex-1">
                  <AnimatePresence mode="popLayout">
                    {trafficData.uploaded.count > 10 && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.8 }} className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-rose-600/10 border-2 border-rose-500/30 flex gap-2.5 sm:gap-3 items-start shadow-lg group">
                        <div className="p-2 sm:p-2.5 rounded-lg bg-rose-500/20 text-rose-400 group-hover:scale-110 transition-transform shrink-0"><Zap className="w-3.5 h-3.5 sm:w-4 h-4" /></div>
                        <div className="overflow-hidden">
                          <p className="text-[10px] sm:text-[11px] font-black text-rose-400 uppercase tracking-tighter mb-1 sm:mb-1.5">Congestion</p>
                          <p className="text-[6px] sm:text-[8px] text-slate-300 font-bold uppercase tracking-widest opacity-80 line-clamp-1">Uploaded Stream Alert.</p>
                          <div className="mt-2.5 sm:mt-3"><span className="px-2 py-0.5 rounded-full bg-rose-500/30 text-[6px] sm:text-[7px] font-black text-rose-400 uppercase border border-rose-500/40">CRITICAL</span></div>
                        </div>
                      </motion.div>
                    )}
                    {trafficData.uploaded.count <= 10 && (
                      <div className="text-center py-12 sm:py-16 opacity-20 flex flex-col items-center">
                        <ShieldAlert className="w-8 h-8 sm:w-10 sm:h-10 text-slate-600 mb-3 sm:mb-4" />
                        <p className="text-[8px] sm:text-[9px] font-black text-slate-600 uppercase tracking-widest">System_Clear</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} className="glass-card rounded-[2rem] lg:rounded-[3rem] p-8 lg:p-10 border border-white/10 h-64 relative overflow-hidden group cursor-pointer shadow-xl btn-premium" onClick={() => setActiveTab('map')}>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-transparent group-hover:opacity-100 opacity-50 transition-opacity" /><div className="absolute inset-0 cyber-grid opacity-40 group-hover:opacity-60 transition-opacity" />
                <div className="relative z-10 flex flex-col h-full"><div className="flex items-center gap-4 mb-4"><div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center border border-blue-500/40"><MapIcon className="w-6 h-6 text-blue-400" /></div><div><h3 className="font-black text-xl text-white">City Grid</h3><p className="text-[8px] text-blue-400 font-black uppercase mt-1">Active_Mapping</p></div></div>
                <div className="mt-auto"><button className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg border border-white/20">INITIALIZE_MAP</button></div></div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {activeTab === 'map' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card rounded-[2rem] lg:rounded-[3rem] p-4 sm:p-8 lg:p-12 flex flex-col items-center justify-center text-center min-h-[80vh] border-2 border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-vibrant opacity-50" /><div className="absolute inset-0 cyber-grid opacity-30" />
            <div className="relative z-10 w-full h-[50vh] sm:h-[60vh] rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl mb-8">
              <iframe width="100%" height="100%" frameBorder="0" style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(0.9) contrast(1.2)' }} src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d56070.83515431693!2d77.478816!3d28.468233!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cc10631317283%3A0x86134f5536a04e95!2sGreater%20Noida%2C%20Uttar%20Pradesh!5e0!3m2!1sen!2sin!4v1714930000000!5m2!1sen!2sin&layer=t" allowFullScreen />
              <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-blue-500/40 shadow-lg"><p className="text-[8px] font-black text-blue-400 uppercase flex items-center gap-2"><Radio className="w-2.5 h-2.5 animate-pulse" /> LIVE: NOIDA_GRID</p></div>
            </div>
            <h2 className="text-3xl lg:text-5xl font-black mb-3 text-white relative z-10 uppercase tracking-tighter">City Grid Sync</h2>
            <p className="text-slate-300 text-[10px] lg:text-sm font-bold max-w-lg mx-auto leading-relaxed mb-8 uppercase tracking-widest relative z-10">Integrating <span className="text-blue-400">METROPOLITAN_TELEMETRY</span>.</p>
            <button onClick={() => setActiveTab('dashboard')} className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg hover:scale-105 transition-all flex items-center gap-3 border border-white/20 btn-premium relative z-10">RETURN_TO_DECK <ChevronRight className="w-4 h-4" /></button>
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8"><div className="glass-card rounded-[2.5rem] lg:rounded-[4rem] p-8 lg:p-16 border-2 border-emerald-500/20 relative overflow-hidden"><div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" /><div className="flex items-center gap-6 mb-12"><div className="w-16 h-16 rounded-[1.5rem] bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40 shadow-lg"><BarChart3 className="w-8 h-8 text-emerald-400" /></div><div><h2 className="text-4xl lg:text-6xl font-black text-white uppercase leading-none">Vibrant Analytics</h2><p className="text-emerald-400 font-black uppercase tracking-widest mt-3 text-xs">Deep Neural Insights</p></div></div><div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">{[{ label: 'Avg Density', value: '42%', icon: Car, color: 'blue' }, { label: 'Efficiency', value: '94.2%', icon: Zap, color: 'emerald' }, { label: 'Uptime', value: '99.9%', icon: Cpu, color: 'purple' }].map((stat, i) => (<div key={i} className="bg-black/40 p-8 rounded-[2rem] border border-white/5 group"><stat.icon className={`w-8 h-8 text-${stat.color}-400 mb-6 group-hover:scale-110 transition-transform`} /><p className="text-slate-500 text-[10px] font-black uppercase mb-2">{stat.label}</p><p className="text-3xl font-black text-white">{stat.value}</p></div>))}</div><div className="h-[400px] lg:h-[500px] glass-card rounded-[2.5rem] p-8 border border-white/5"><ResponsiveContainer width="100%" height="100%"><AreaChart data={historyData}><CartesianGrid strokeDasharray="10 10" vertical={false} stroke="rgba(255,255,255,0.05)" /><XAxis dataKey="time" stroke="#64748b" fontSize={10} fontWeight="900" /><YAxis stroke="#64748b" fontSize={10} fontWeight="900" /><Tooltip contentStyle={{ backgroundColor: '#0d1117', borderRadius: '16px', border: 'none' }} /><Area type="monotone" dataKey="Road1" stroke="#3b82f6" strokeWidth={4} fill="transparent" /><Area type="monotone" dataKey="Road2" stroke="#8b5cf6" strokeWidth={4} fill="transparent" /><Area type="monotone" dataKey="Road3" stroke="#10b981" strokeWidth={4} fill="transparent" /></AreaChart></ResponsiveContainer></div></div></motion.div>
        )}

        {activeTab === 'incidents' && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8"><div className="glass-card rounded-[2.5rem] lg:rounded-[4rem] p-8 lg:p-16 border-2 border-rose-500/20 relative overflow-hidden"><div className="absolute inset-0 bg-rose-500/5 pointer-events-none" /><div className="flex items-center gap-6 mb-12"><div className="w-16 h-16 rounded-[1.5rem] bg-rose-500/20 flex items-center justify-center border border-rose-500/40 shadow-lg"><ShieldAlert className="w-8 h-8 text-rose-400" /></div><div><h2 className="text-4xl lg:text-6xl font-black text-white uppercase leading-none">Incident Log</h2><p className="text-rose-400 font-black uppercase tracking-widest mt-3 text-xs">Critical System Events</p></div></div><div className="space-y-4">{[{ type: 'CONGESTION', node: 'NODE_01', status: 'CRITICAL', time: '14:02', desc: 'Heavy density Intersection Alpha.' }, { type: 'EMERGENCY', node: 'NODE_03', status: 'RESOLVED', time: '13:45', desc: 'Emergency vehicle prioritized.' }, { type: 'MAINTENANCE', node: 'SYSTEM', status: 'ONGOING', time: '12:00', desc: 'Calibration metropolitan sector 4.' }, { type: 'STALL', node: 'NODE_02', status: 'PENDING', time: '15:10', desc: 'Stationary vehicle detected.' }].map((inc, i) => (<div key={i} className="bg-black/40 p-6 rounded-[1.5rem] border border-white/5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 group"><div className="flex items-center gap-6"><div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${inc.type === 'EMERGENCY' ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : inc.type === 'CONGESTION' ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-blue-500/20 border-blue-500/40 text-blue-400'}`}><Zap className="w-6 h-6" /></div><div><p className="text-lg font-black text-white uppercase">{inc.type}</p><p className="text-[8px] text-slate-500 font-black uppercase mt-1">{inc.node} • {inc.time}</p></div></div><p className="text-slate-400 font-bold max-w-xl uppercase tracking-wider text-[10px]">{inc.desc}</p><div className={`px-5 py-2 rounded-xl text-[8px] font-black border uppercase ${inc.status === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse' : inc.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-blue-500/20 text-blue-400 border-blue-500/40'}`}>{inc.status}</div></div>))}</div></div></motion.div>
        )}
      </main>
    </div>
  );
}

export default App;
