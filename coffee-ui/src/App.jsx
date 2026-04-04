import Navbar from "./components/Navbar";
import BackgroundAnimation from "./components/BackgroundAnimation";
import { Routes, Route, useLocation } from "react-router";
import Home from "./pages/Home.jsx";
import CartPage from "./pages/CartPage.jsx";
import CoffeeDetail from "./pages/CoffeeDetails.jsx";
import Success from "./pages/Success.jsx"
import Checkout from "./pages/Checkout.jsx"
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Orders from "./pages/Orders.jsx";
import AdminInventory from "./pages/AdminInventory.jsx";
import AdminAnalytics from "./pages/AdminAnalytics.jsx";
import AdminAnalyticsHelp from "./pages/AdminAnalyticsHelp.jsx";

import { AnimatePresence } from "framer-motion";

export default function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen p-6 relative">
      <BackgroundAnimation />
      <Navbar />

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/coffee/:id" element={<CoffeeDetail />} />
          <Route path="/success" element={<Success />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/admin/inventory" element={<AdminInventory />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/analytics/help" element={<AdminAnalyticsHelp />} />
        </Routes>
      </AnimatePresence>

    </div>
  );
}
