import { useEffect, useState } from "react";
import PageTransition from "../components/PageTransition";
import { getBeans, createBean, addStock } from "../services/api";
import { motion } from "framer-motion";

export default function AdminInventory() {
  const [beans, setBeans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newBean, setNewBean] = useState({ name: "", description: "", currentStockKg: 0, basePricePerKg: 0, isAvailable: true });
  const [addingBean, setAddingBean] = useState(false);
  const [stockAddAmount, setStockAddAmount] = useState({});

  async function loadBeans() {
    setLoading(true);
    try {
      const data = await getBeans();
      setBeans(data);
    } catch (err) {
      setError(err.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBeans();
  }, []);

  async function handleCreateBean(e) {
    e.preventDefault();
    setAddingBean(true);
    try {
      await createBean(newBean);
      setNewBean({ name: "", description: "", currentStockKg: 0, basePricePerKg: 0, isAvailable: true });
      await loadBeans();
    } catch (err) {
      setError(err.message || "Failed to create bean.");
    } finally {
      setAddingBean(false);
    }
  }

  async function handleAddStock(beanId) {
    const amount = stockAddAmount[beanId] || 0;
    if (amount <= 0) return;
    try {
      await addStock(beanId, amount);
      setStockAddAmount({ ...stockAddAmount, [beanId]: "" });
      await loadBeans();
    } catch (err) {
      setError(err.message || "Failed to add stock.");
    }
  }

  return (
    <PageTransition>
      <div className="p-8 max-w-6xl mx-auto mt-6 backdrop-blur-md bg-white/40 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/50">
        <h2 className="text-3xl font-extrabold text-[#4a3525] mb-6 border-b border-[#6f4e37]/10 pb-4">Inventory Management</h2>
        
        {error && <p className="text-red-600 bg-red-100/50 p-3 rounded-xl border border-red-200 mb-6 text-sm font-medium">{error}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h3 className="text-xl font-bold text-[#4a3525] mb-4">Current Stock</h3>
            {loading ? (
               <div className="flex justify-center p-10">
                 <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#6f4e37]/20 border-t-[#6f4e37]"></div>
               </div>
            ) : (
              <div className="space-y-4">
                {beans.map((bean) => (
                  <motion.div initial={{opacity: 0}} animate={{opacity: 1}} key={bean.id} className="bg-white/50 p-5 rounded-xl shadow-sm border border-white/60 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="font-bold text-[#4a3525] text-lg flex items-center gap-2">
                        {bean.name} 
                        {!bean.isAvailable && <span className="bg-red-500/10 text-red-700 text-xs px-2 py-1 rounded-md">Unavailable</span>}
                      </div>
                      <div className="text-sm text-[#4a3525]/70">{bean.description}</div>
                      <div className="mt-2 text-[#4a3525]/80 font-medium whitespace-nowrap">Rs. {bean.basePricePerKg} / kg</div>
                    </div>
                    
                    <div className="flex items-center gap-4 border-l border-white/50 pl-4">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-bold uppercase text-[#4a3525]/60">Stock</span>
                        <span className={`text-2xl font-black ${bean.currentStockKg < 10 ? 'text-red-500' : 'text-[#6f4e37]'}`}>
                          {bean.currentStockKg} <span className="text-sm font-medium">kg</span>
                        </span>
                      </div>
                      <div className="flex flex-col min-w-[120px] gap-2">
                        <input 
                          type="number" 
                          min="0"
                          placeholder="Amount" 
                          className="w-full text-sm bg-white/70 border border-white/80 rounded-lg px-2 py-1 outline-none focus:ring-2 ring-[#6f4e37]/30 text-[#4a3525]"
                          value={stockAddAmount[bean.id] || ""}
                          onChange={(e) => setStockAddAmount({ ...stockAddAmount, [bean.id]: Number(e.target.value) })}
                        />
                        <button 
                          disabled={!stockAddAmount[bean.id]}
                          onClick={() => handleAddStock(bean.id)}
                          className="text-white bg-[#6f4e37] hover:bg-[#5a3f2c] disabled:bg-[#6f4e37]/40 px-3 py-1 rounded-lg text-xs font-bold transition">
                          Add Stock
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-xl font-bold text-[#4a3525] mb-4">Add New Bean</h3>
            <form onSubmit={handleCreateBean} className="bg-white/40 p-6 rounded-xl border border-white/60 shadow-sm flex flex-col gap-4">
              <div>
                <label className="text-sm font-bold text-[#4a3525] block mb-1">Name</label>
                <input required type="text" className="w-full bg-white/60 border border-white/60 rounded-lg px-3 py-2 text-[#4a3525] focus:outline-none focus:ring-2 focus:ring-[#6f4e37]/40" value={newBean.name} onChange={e => setNewBean({...newBean, name: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-bold text-[#4a3525] block mb-1">Description (ops)</label>
                <input type="text" className="w-full bg-white/60 border border-white/60 rounded-lg px-3 py-2 text-[#4a3525] focus:outline-none focus:ring-2 focus:ring-[#6f4e37]/40" value={newBean.description} onChange={e => setNewBean({...newBean, description: e.target.value})} />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-bold text-[#4a3525] block mb-1">Initial Stock (kg)</label>
                  <input required type="number" step="0.1" className="w-full bg-white/60 border border-white/60 rounded-lg px-3 py-2 text-[#4a3525] focus:outline-none focus:ring-2 focus:ring-[#6f4e37]/40" value={newBean.currentStockKg} onChange={e => setNewBean({...newBean, currentStockKg: Number(e.target.value)})} />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-bold text-[#4a3525] block mb-1">Price / Kg</label>
                  <input required type="number" step="0.5" className="w-full bg-white/60 border border-white/60 rounded-lg px-3 py-2 text-[#4a3525] focus:outline-none focus:ring-2 focus:ring-[#6f4e37]/40" value={newBean.basePricePerKg} onChange={e => setNewBean({...newBean, basePricePerKg: Number(e.target.value)})} />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" id="avail" checked={newBean.isAvailable} onChange={e => setNewBean({...newBean, isAvailable: e.target.checked})} />
                <label htmlFor="avail" className="text-sm font-bold text-[#4a3525]">Is Available</label>
              </div>
              
              <button disabled={addingBean} className="w-full mt-4 bg-[#6f4e37]/90 text-white font-bold px-4 py-3 rounded-xl shadow-sm border border-[#6f4e37]/20 hover:bg-[#5a3f2c] transition-all disabled:opacity-50">
                {addingBean ? "Creating..." : "Create Bean"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
