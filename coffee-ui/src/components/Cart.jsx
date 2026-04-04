import { useNavigate } from "react-router";
import { useCart } from "../context/CartContext";

export default function Cart() {

  const { cart, incrementItem, decrementItem } = useCart();

  if (cart.length === 0) {
    return (
      <div className="p-8 max-w-xl mx-auto mt-10 backdrop-blur-md bg-white/40 border border-white/50 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] text-center text-[#4a3525]/70 font-medium">
        Your cart is empty
      </div>
    );
  }

  const navigate = useNavigate();

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  return (
    <div className="p-8 max-w-xl mx-auto mt-6 backdrop-blur-md bg-white/40 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/50">
      <h2 className="text-2xl font-extrabold text-[#4a3525] mb-6 border-b border-[#6f4e37]/10 pb-4">Your Cart</h2>

      <ul className="space-y-4">
        {cart.map((item) => (
          <li
            key={item.id}
            className="flex justify-between items-center bg-white/50 p-4 rounded-xl shadow-sm border border-white/60"
          >
            <div>
              <p className="font-bold text-[#4a3525]">{item.name}</p>
              <p className="text-sm text-[#4a3525]/70 font-medium mt-1">
                Rs.{item.price} x {item.qty}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => decrementItem(item.id)}
                className="w-8 h-8 flex items-center justify-center bg-white/60 hover:bg-white text-[#4a3525] font-bold rounded-lg border border-white/80 shadow-sm transition-all">-</button>
              <span className="font-bold text-[#4a3525] min-w-[20px] text-center">{item.qty}</span>
              <button
                onClick={() => incrementItem(item.id)}
                className="w-8 h-8 flex items-center justify-center bg-white/60 hover:bg-white text-[#4a3525] font-bold rounded-lg border border-white/80 shadow-sm transition-all">+</button>
            </div>
          </li>
        ))}
      </ul>

      <div className="font-extrabold text-[#4a3525] text-xl text-right mt-6 pt-4 border-t border-[#6f4e37]/10">
        Total: Rs.{total}
      </div>

      <button onClick={() => navigate("/checkout")}
        className="mt-6 w-full bg-[#6f4e37]/90 hover:bg-[#5a3f2c] text-white font-bold py-3 rounded-xl shadow-sm border border-[#6f4e37]/20 transition-all">
        Proceed to Checkout
      </button>

    </div>
  );

}
