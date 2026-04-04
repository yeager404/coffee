import { useCart } from "../context/CartContext";
import { Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

export default function Navbar() {
  const { cart, clearCart } = useCart();
  const { user, logout, isAdmin } = useAuth();

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-2 z-50 backdrop-blur-md bg-[#d4a373]/30 border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.05)] text-[#4a3525] px-6 py-4 rounded-2xl flex justify-between items-center mb-6 mx-auto"
    >
      <div className="flex items-center gap-6">
        <Link to="/" className="text-2xl font-extrabold tracking-tight drop-shadow-sm flex items-center gap-2 mr-4">
          <span className="text-3xl">☕</span> Coffee Store
        </Link>
        
        {user && !isAdmin && (
          <Link to="/orders" className="font-bold text-[#4a3525] hover:text-[#6f4e37] transition-all">My Orders</Link>
        )}
        
        {user && isAdmin && (
          <>
            <Link to="/orders" className="font-bold text-[#4a3525] hover:text-[#6f4e37] transition-all">Orders</Link>
            <Link to="/admin/inventory" className="font-bold text-[#4a3525] hover:text-[#6f4e37] transition-all">Inventory</Link>
            <Link to="/admin/analytics" className="font-bold text-[#4a3525] hover:text-[#6f4e37] transition-all">Analytics</Link>
          </>
        )}
      </div>

      <div className="flex items-center gap-3 font-medium">
        {user ? (
          <div className="flex items-center gap-3">
            <span className="bg-white/40 px-4 py-2 rounded-xl border border-white/50 shadow-[inset_0_1px_4px_rgba(255,255,255,0.6)] text-sm text-[#4a3525] font-semibold">
              Hello, {user.firstName} {isAdmin && "(Admin)"}
            </span>
            <button
              onClick={logout}
              className="bg-white/30 hover:bg-white/50 border border-white/40 text-[#4a3525] px-4 py-2 rounded-xl transition-all shadow-sm text-sm font-semibold"
            >
              Logout
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="bg-white/30 hover:bg-white/50 border border-white/40 text-[#4a3525] px-5 py-2 rounded-xl transition-all shadow-sm text-sm font-semibold"
          >
            Login
          </Link>
        )}

        {(!user || !isAdmin) && (
          <Link
            to="/cart"
            className="flex items-center gap-2 bg-[#6f4e37]/10 hover:bg-[#6f4e37]/20 transition-all px-5 py-2 rounded-xl border border-[#6f4e37]/20 shadow-sm text-[#4a3525] font-bold ml-2"
          >
            Cart ({cartCount})
          </Link>
        )}

        {(!user || !isAdmin) && (
          <button
            onClick={clearCart}
            disabled={cartCount === 0}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm border ${cartCount === 0
                ? 'bg-[#6f4e37]/5 text-[#6f4e37]/40 border-transparent cursor-not-allowed'
                : 'bg-[#6f4e37]/90 text-white hover:bg-[#5a3f2c] border-[#6f4e37]/20 hover:shadow-md'
              }`}
          >
            Clear Cart
          </button>
        )}
      </div>
    </motion.nav>
  );
}
