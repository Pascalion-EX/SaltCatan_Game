import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = ({ setUser }) => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/users/login`,
        formData
      );

      localStorage.setItem("token", res.data.token);
      setUser(res.data);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="relative w-screen h-screen flex items-center justify-center overflow-hidden">
      
      {/* Background Image */}
      <img
        src="/Background/Bg.jpg"
        className="absolute inset-0 w-full h-full object-cover -z-10"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      {/* Login Panel */}
      <div
        className="relative z-10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl 
                   w-[90%] sm:w-[70%] md:w-[40%] lg:w-[30%] 
                   animate-fadeIn"
        style={{ backgroundColor: "rgba(69, 0, 9, 0.6)" }}
      >
        <h2 className="text-3xl font-bold mb-6 text-center text-white">
          Login
        </h2>

        {error && <p className="text-red-300 mb-4 text-sm text-center">{error}</p>}

        <form onSubmit={handleSubmit}>

          <div className="mb-4 text-left">
            <label className="block text-white text-sm font-medium mb-1">
              Username
            </label>
            <input
              className="w-full p-3 rounded-md bg-white/20 text-white placeholder-gray-300 
                         focus:ring-2 focus:ring-red-300 outline-none"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter username"
              required
            />
          </div>

          <div className="mb-6 text-left">
            <label className="block text-white text-sm font-medium mb-1">
              Password
            </label>
            <input
              className="w-full p-3 rounded-md bg-white/20 text-white placeholder-gray-300 
                         focus:ring-2 focus:ring-red-300 outline-none"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              required
            />
          </div>

          <button className="w-full bg-red-700 hover:bg-red-800 text-white p-3 rounded-md font-semibold cursor-pointer transition">
            Login
          </button>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 1s ease forwards;
        }
      `}</style>
    </div>
  );
};

export default Login;
