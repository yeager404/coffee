import { Link } from "react-router";
import { motion } from "framer-motion";
import { useCart } from "../context/CartContext";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function CoffeeCard({ id, name, description, price }) {

  const { addToCart } = useCart();

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -5 }}
      className="backdrop-blur-md bg-white/40 p-5 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.1)] transition-shadow duration-300 border border-white/50 flex flex-col h-full"
    >
      <h2 className="text-xl font-bold text-[#4a3525]">{name}</h2>
      <p className="text-[#4a3525]/80 mt-2 flex-grow">{description}</p>
      <p className="font-bold text-lg text-[#4a3525] mt-4">Rs.{price}</p>

      <div className="flex items-center justify-between mt-5 pt-4 border-t border-[#6f4e37]/10">
        <Link
          to={`/coffee/${id}`}
          className="text-[#6f4e37] font-bold hover:text-[#4a3525] transition-colors"
        >
          View Details
        </Link>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => addToCart({ id, name, description, price })}
          className="bg-[#6f4e37]/90 text-white px-4 py-2 rounded-xl font-semibold shadow-sm border border-[#6f4e37]/20 hover:bg-[#5a3f2c] transition-all"
        >
          Add to Cart
        </motion.button>
      </div>
    </motion.div>
  );
}
