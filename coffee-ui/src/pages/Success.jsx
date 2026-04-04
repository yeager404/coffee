import { Link } from "react-router";
import PageTransition from "../components/PageTransition";

export default function Success() {
  return (
    <PageTransition>
      <div className="max-w-md mx-auto mt-16 p-10 text-center backdrop-blur-md bg-white/40 border border-white/50 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] relative z-10">
        <div className="mb-6 text-[#6f4e37] text-6xl">
          ✨
        </div>
        <h2 className="text-4xl font-extrabold text-[#4a3525] mb-4">Order Placed</h2>
        <p className="text-[#4a3525]/80 text-lg mb-8 font-medium">
          Thank you for your purchase!
        </p>

        <Link to="/"
          className="inline-block bg-[#6f4e37]/90 text-white font-bold px-8 py-3 rounded-xl shadow-sm border border-[#6f4e37]/20 hover:bg-[#5a3f2c] transition-all">
          Back to Home
        </Link>
      </div>
    </PageTransition>
  );
}
