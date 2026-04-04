import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useCart } from "../context/CartContext";
import { getBeans } from "../services/api";
import PageTransition from "../components/PageTransition";

export default function CoffeeDetail() {

  const { id } = useParams();
  const { addToCart } = useCart();
  const [coffee, setCoffee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCoffee() {
      try {
        const data = await getBeans();
        const found = data.find((c) => c.id === Number(id));
        if (found) {
          // Map basePricePerKg to price for convenience
          setCoffee({ ...found, price: found.basePricePerKg });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchCoffee();
  }, [id]);

  if (loading) {
    return <PageTransition><p className="p-6 text-center text-[#4a3525] font-medium">Loading...</p></PageTransition>;
  }

  if (!coffee) {
    return <PageTransition><div className="p-8 max-w-xl mx-auto mt-10 backdrop-blur-md bg-white/40 border border-white/50 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] text-center text-[#4a3525]/70 font-medium">Coffee not found</div></PageTransition>;
  }

  return (
    <PageTransition>
      <div className="p-8 max-w-xl mx-auto mt-6 backdrop-blur-md bg-white/40 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/50">
        <h2 className="text-3xl font-extrabold text-[#4a3525] border-b border-[#6f4e37]/10 pb-4 mb-4">{coffee.name}</h2>
        <p className="text-[#4a3525]/80 text-lg leading-relaxed">{coffee.description}</p>
        <p className="font-extrabold text-2xl text-[#4a3525] mt-6">Rs.{coffee.price}</p>

        <button
          onClick={() => addToCart(coffee)}
          className="mt-8 w-full bg-[#6f4e37]/90 text-white font-bold px-6 py-3 rounded-xl shadow-sm border border-[#6f4e37]/20 hover:bg-[#5a3f2c] transition-all"
        >
          Add to cart
        </button>
      </div>
    </PageTransition>
  );
}
