import { useEffect, useState } from "react";
import PageTransition from "../components/PageTransition";
import { getDemandSummary, getLatestPredictions, getAdminPredictionAlerts } from "../services/api";
import { motion } from "framer-motion";
import { Link } from "react-router";

export default function AdminAnalytics() {
  const [demand, setDemand] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const LOCATIONS = ["ALL", "NORTH", "SOUTH", "EAST", "WEST", "ONLINE"];
  const [selectedLocation, setSelectedLocation] = useState("ALL");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [demandData, predData, alertData] = await Promise.all([
          getDemandSummary(), 
          getLatestPredictions(),
          getAdminPredictionAlerts()
        ]);
        setDemand(demandData);
        setPredictions(predData);
        setAlerts(alertData);
      } catch (err) {
        setError(err.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredDemand = selectedLocation === "ALL" ? demand : demand.filter(d => d.location === selectedLocation);
  const filteredPredictions = selectedLocation === "ALL" ? predictions : predictions.filter(p => p.location === selectedLocation);

  const totalDemand = filteredDemand.reduce((sum, d) => sum + d.totalQuantityKg, 0);

  if (loading) {
    return (
      <PageTransition>
        <div className="flex justify-center items-center mt-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6f4e37]/20 border-t-[#6f4e37]"></div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="p-8 max-w-7xl mx-auto mt-6 backdrop-blur-xl bg-white/30 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/50 relative overflow-hidden">
        <div className="flex justify-between items-center mb-8 border-b border-[#6f4e37]/10 pb-4">
          <h2 className="text-3xl font-extrabold text-[#4a3525]">Analytics Dashboard</h2>
          <Link to="/admin/analytics/help" className="bg-white/40 hover:bg-white/60 transition px-4 py-2 rounded-xl text-sm font-semibold border border-white/50 text-[#4a3525] flex items-center gap-2">
            ℹ️ How it works
          </Link>
        </div>

        {error && <p className="text-red-600 bg-red-100/50 p-3 rounded-xl border border-red-200 mb-6 text-sm font-medium">{error}</p>}

        {/* Top Summary Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <motion.div initial={{ y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} className="bg-white/60 p-6 rounded-2xl shadow-sm border border-white/80 relative overflow-hidden">
            <div className="text-sm font-bold text-[#4a3525]/60 mb-2">Total Demand (Last 30 Days)</div>
            <div className="text-4xl font-black text-[#6f4e37]">{totalDemand.toFixed(1)} <span className="text-lg">kg</span></div>
          </motion.div>
          <motion.div initial={{ y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} transition={{delay: 0.1}} className="bg-white/60 p-6 rounded-2xl shadow-sm border border-white/80">
            <div className="text-sm font-bold text-[#4a3525]/60 mb-2">Active Predictions</div>
            <div className="text-4xl font-black text-[#6f4e37]">{predictions.length}</div>
          </motion.div>
          <motion.div initial={{ y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} transition={{delay: 0.2}} className={`p-6 rounded-2xl shadow-sm border ${alerts.length > 0 ? 'bg-red-400/20 border-red-400/30' : 'bg-green-400/20 border-green-400/30'}`}>
            <div className="text-sm font-bold text-[#4a3525]/60 mb-2">Urgent Restock Alerts</div>
            <div className="text-4xl font-black text-[#6f4e37]">{alerts.length}</div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <select 
             className="bg-white/50 border border-white/60 rounded-xl px-4 py-2 text-[#4a3525] font-bold outline-none"
             value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)}
          >
            {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc === "ALL" ? "All Locations" : loc}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Demand Column */}
          <div className="bg-white/40 border border-white/50 p-6 rounded-2xl shadow-sm">
            <h3 className="text-xl font-bold text-[#4a3525] mb-4">Demand Summary</h3>
            {filteredDemand.length === 0 ? (
              <p className="text-[#4a3525]/60 py-4 text-center">No demand records found for this period.</p>
            ) : (
              <div className="space-y-3">
                {filteredDemand.map((d, i) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-lg hover:bg-white/40 transition">
                    <div>
                      <div className="font-bold text-[#6f4e37]">{d.beanName}</div>
                      <div className="text-xs text-[#4a3525]/60 bg-[#4a3525]/5 inline-block px-2 py-0.5 rounded-md mt-1">{d.location}</div>
                    </div>
                    <div className="font-extrabold text-[#4a3525]">{d.totalQuantityKg.toFixed(2)} kg</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Predictions Column */}
          <div className="bg-white/40 border border-white/50 p-6 rounded-2xl shadow-sm">
            <h3 className="text-xl font-bold text-[#4a3525] mb-4 flex items-center gap-2">
              Latest Predictions
            </h3>
            {filteredPredictions.length === 0 ? (
              <p className="text-[#4a3525]/60 py-4 text-center">Predictions are not available yet. The analytics service may still be training on recent order data.</p>
            ) : (
              <div className="space-y-3">
                {filteredPredictions.map((p, i) => (
                  <div key={i} className={`flex justify-between items-center p-3 rounded-lg transition border ${p.restockNeeded ? 'bg-amber-100/50 border-amber-200 shadow-inner' : 'hover:bg-white/40 border-transparent'}`}>
                    <div>
                      <div className="font-bold text-[#6f4e37] flex items-center gap-2">
                        {p.beanName}
                        {p.restockNeeded && <span className="bg-amber-500 text-white text-[10px] uppercase font-black px-1.5 py-0.5 rounded-md">Restock Needed</span>}
                      </div>
                      <div className="text-xs text-[#4a3525]/60 bg-[#4a3525]/5 inline-block px-2 py-0.5 rounded-md mt-1">{p.location}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-[#4a3525]/60">Rec. Restock</div>
                      <div className="font-extrabold text-[#4a3525]">{p.recommendedRestockAmount.toFixed(2)} kg</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
