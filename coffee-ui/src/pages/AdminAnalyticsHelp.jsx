import PageTransition from "../components/PageTransition";
import { Link } from "react-router";

export default function AdminAnalyticsHelp() {
  return (
    <PageTransition>
      <div className="p-8 max-w-4xl mx-auto mt-6 backdrop-blur-md bg-white/40 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/50 text-[#4a3525]">
        
        <div className="flex justify-between items-center mb-6 border-b border-[#6f4e37]/10 pb-4">
          <h2 className="text-3xl font-extrabold text-[#4a3525]">How Analytics Works</h2>
          <Link to="/admin/analytics" className="text-sm font-bold bg-[#6f4e37]/10 hover:bg-[#6f4e37]/20 transition px-4 py-2 rounded-xl">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="space-y-6 text-lg leading-relaxed font-medium">
          <p>
            Use the analytics area to understand coffee demand and stock recommendations across locations.
          </p>
          <p>
            The <strong className="font-bold text-[#6f4e37]">demand section</strong> shows how much of each bean was sold in a selected time window. You can use it to compare locations such as <code>NORTH</code>, <code>SOUTH</code>, <code>EAST</code>, <code>WEST</code>, and <code>ONLINE</code>.
          </p>
          <p>
            The <strong className="font-bold text-[#6f4e37]">predictions section</strong> shows model-generated stock guidance. Each prediction is tied to a specific bean and location. If <code>restockNeeded</code> is true, the platform believes current stock may not cover expected demand.
          </p>

          <h3 className="text-xl font-extrabold mt-8 mb-2">To use analytics effectively:</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Start with the demand view to identify high-volume beans and regions.</li>
            <li>Narrow the date range to inspect recent shifts.</li>
            <li>Switch to predictions to see recommended restock amounts.</li>
            <li>Review prediction history for a bean to understand how recommendations are changing over time.</li>
            <li>Pay attention to location because demand can vary significantly by region.</li>
          </ul>

          <div className="bg-amber-100/50 border border-amber-200/50 p-5 rounded-xl text-amber-900 mt-6 shadow-sm">
            <h4 className="font-extrabold mb-2 uppercase text-sm tracking-wider">Important</h4>
            <ul className="list-disc pl-6 space-y-1">
              <li>Predictions may be empty if the analytics service has not processed enough recent data yet.</li>
              <li>Predictions are advisory, not guaranteed outcomes.</li>
              <li>Orders must include a location for region-level forecasting to be useful.</li>
            </ul>
          </div>

          <div className="bg-[#6f4e37]/10 border border-[#6f4e37]/20 p-5 rounded-xl text-[#3b2b1d] mt-6 shadow-sm">
            <h4 className="font-extrabold mb-2 uppercase text-sm tracking-wider">Quick Tips</h4>
            <ul className="list-disc pl-6 space-y-1 text-sm font-semibold">
              <li>Use recent date ranges for operational decisions.</li>
              <li>Compare the same bean across multiple locations.</li>
              <li>Treat <code>recommendedRestockAmount</code> as a planning input for procurement.</li>
              <li>Use <code>/admin/predictions</code> data for urgent alert views.</li>
            </ul>
          </div>
        </div>

      </div>
    </PageTransition>
  );
}
