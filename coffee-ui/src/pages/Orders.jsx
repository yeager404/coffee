import { useEffect, useState } from "react";
import PageTransition from "../components/PageTransition";
import { getOrders } from "../services/api";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await getOrders();
        // Since we pagination is present in backend, content is our list
        setOrders(data.content || []);
      } catch (err) {
        setError(err.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  if (loading) {
    return (
      <PageTransition>
        <div className="flex justify-center items-center mt-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6f4e37]/20 border-t-[#6f4e37]"></div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="p-8 max-w-4xl mx-auto mt-6 backdrop-blur-md bg-white/40 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/50">
        <h2 className="text-3xl font-extrabold text-[#4a3525] mb-6 border-b border-[#6f4e37]/10 pb-4">My Orders</h2>
        
        {error && <p className="text-red-600 bg-red-100/50 p-3 rounded-xl border border-red-200 mb-6 text-sm font-medium">{error}</p>}

        {orders.length === 0 ? (
          <p className="text-center text-[#4a3525]/70 font-medium py-10">You have no orders yet.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.orderId} className="bg-white/50 p-5 rounded-xl shadow-sm border border-white/60 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <div className="text-sm text-[#4a3525]/60 mb-1">
                    Order #{order.orderId}
                  </div>
                  <div className="text-[#4a3525] font-bold">
                    {new Date(order.placedAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col text-right">
                    <span className="text-sm text-[#4a3525]/60">Status</span>
                    <span className={`font-bold ${order.status === 'PENDING' ? 'text-amber-600' : 'text-green-600'}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-sm text-[#4a3525]/60">Total</span>
                    <span className="font-extrabold text-[#4a3525]">Rs.{order.totalAmount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
