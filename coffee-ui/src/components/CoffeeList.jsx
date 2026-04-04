import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import CoffeeCard from "./CoffeeCard";
import { getBeans } from "../services/api";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function CoffeeList() {
  const [coffees, setCoffees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCoffees() {
      try {
        const data = await getBeans();
        // Filter only available beans if needed, but we'll show all
        setCoffees(data);
      } catch (err) {
        setError("Failed to load coffees");
      } finally {
        setLoading(false);
      }
    }
    fetchCoffees();
  }, []);

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6"
    >
      {coffees.map((coffee) => (
        <CoffeeCard
          key={coffee.id}
          id={coffee.id}
          name={coffee.name}
          description={coffee.description}
          price={coffee.basePricePerKg}
        />
      ))}
    </motion.div>
  );
}
