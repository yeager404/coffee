import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { login as loginApi } from "../services/api";
import PageTransition from "../components/PageTransition";


export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const data = await loginApi(email, password);
            login(data.token, { firstName: data.firstName });
            navigate("/");
        } catch (err) {
            setError(err.message || "Failed to login");
        }
    };

    return (
        <PageTransition>
            <div className="max-w-md mx-auto mt-16 backdrop-blur-md bg-white/40 p-8 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/50 relative z-10">
                <h2 className="text-3xl font-extrabold text-[#4a3525] mb-6 text-center">Welcome Back</h2>
                {error && <p className="text-red-600 bg-red-100/50 p-3 rounded-xl border border-red-200 mb-6 text-sm font-medium text-center">{error}</p>}
                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-[#4a3525] font-bold mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/60 border border-white/80 p-3 rounded-xl focus:ring-2 focus:ring-[#d4a373] focus:border-transparent outline-none transition-all shadow-sm text-[#4a3525]"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-[#4a3525] font-bold mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/60 border border-white/80 p-3 rounded-xl focus:ring-2 focus:ring-[#d4a373] focus:border-transparent outline-none transition-all shadow-sm text-[#4a3525]"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full bg-[#6f4e37]/90 hover:bg-[#5a3f2c] text-white font-bold py-3 mt-2 rounded-xl shadow-sm border border-[#6f4e37]/20 transition-all">
                        Login
                    </button>
                </form>
                <p className="mt-6 text-center text-sm font-medium text-[#4a3525]/80">
                    Don&apos;t have an account? <Link to="/register" className="text-[#6f4e37] font-bold hover:text-[#4a3525] transition-colors">Register</Link>
                </p>
            </div>
        </PageTransition>
    );
}
