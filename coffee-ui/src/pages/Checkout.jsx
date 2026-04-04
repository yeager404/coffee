import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router";
import { placeOrder } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import PageTransition from "../components/PageTransition";

export default function Checkout() {

  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [location, setLocation] = useState("UNKNOWN");

  const LOCATIONS = ["UNKNOWN", "NORTH", "SOUTH", "EAST", "WEST", "ONLINE"];

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  async function handlePlaceOrder() {
    if (cart.length === 0) return;

    if (!user) {
      setError("You must be logged in to place an order.");
      return;
    }

    try {
      const orderItems = cart.map((item) => ({
        beanId: item.id,
        quantity: item.qty
      }));
      await placeOrder(orderItems, location);
      clearCart();
      navigate("/success");
    } catch (err) {
      setError(err.message || "Failed to place order.");
    }
  }

  if (cart.length === 0) {
    return (
      <PageTransition>
        <div className="p-8 max-w-xl mx-auto mt-10 backdrop-blur-md bg-white/40 border border-white/50 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] text-center text-[#4a3525]/70 font-medium">
          <p>Your cart is empty.</p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="p-8 max-w-xl mx-auto mt-6 backdrop-blur-md bg-white/40 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/50">
        <h2 className="text-3xl font-extrabold text-[#4a3525] mb-6 border-b border-[#6f4e37]/10 pb-4">Checkout</h2>
        {error && <p className="text-red-600 bg-red-100/50 p-3 rounded-xl border border-red-200 mb-6 text-sm font-medium">{error}</p>}

        <ul className="space-y-4">
          {cart.map((item) => (
            <li key={item.id} className="flex justify-between items-center bg-white/50 p-4 rounded-xl shadow-sm border border-white/60 text-[#4a3525]">
              <span className="font-bold">
                {item.name} <span className="text-[#4a3525]/70 font-medium ml-2">x {item.qty}</span>
              </span>
              <span className="font-bold">Rs.{item.price * item.qty}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col gap-2">
          <label className="text-[#4a3525] font-bold text-sm">Select Region / Location</label>
          <select 
            value={location} 
            onChange={(e) => setLocation(e.target.value)}
            className="w-full bg-white/60 border border-white/60 rounded-xl px-4 py-3 text-[#4a3525] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#6f4e37]/40"
          >
            {LOCATIONS.map(loc => (
               <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
          <p className="text-xs text-[#4a3525]/60 mt-1">This helps us forecast demand for restocks.</p>
        </div>

        <div className="font-extrabold text-[#4a3525] text-xl text-right mt-6 pt-4 border-t border-[#6f4e37]/10">
          Total: Rs.{total}
        </div>

        <button onClick={handlePlaceOrder}
          className="mt-8 w-full bg-[#6f4e37]/90 text-white font-bold px-6 py-3 rounded-xl shadow-sm border border-[#6f4e37]/20 hover:bg-[#5a3f2c] transition-all">
          Place Order
        </button>
      </div>
    </PageTransition>
  );

}

