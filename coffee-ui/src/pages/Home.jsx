import { motion } from "framer-motion"
import CoffeeList from "../components/CoffeeList"
import PageTransition from "../components/PageTransition"

export default function Home() {
  return (
    <PageTransition>
      <div className="relative min-h-screen">
        {/* Floating background elements */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <motion.div
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[10%] left-[5%] w-64 h-64 bg-[#d4a373]/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              y: [0, 30, 0],
              x: [0, -20, 0],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[20%] right-[10%] w-80 h-80 bg-[#faedcd]/40 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              y: [0, -40, 0],
              x: [0, 30, 0],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute top-[40%] right-[30%] w-48 h-48 bg-[#e9edc9]/30 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto pt-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="text-center mb-12 backdrop-blur-md bg-white/40 p-10 md:p-14 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/60 mx-auto max-w-4xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#d4a373]/30 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#faedcd]/50 rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none" />

            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-5xl md:text-6xl font-extrabold text-[#4a3525] mb-6 tracking-tight drop-shadow-sm"
            >
              Experience Premium Coffee
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl text-[#4a3525]/80 max-w-2xl mx-auto font-medium"
            >
              Expertly roasted beans from around the world, delivered fresh to your door.
            </motion.p>
          </motion.div>
          <CoffeeList />
        </div>
      </div>
    </PageTransition>
  );
}
