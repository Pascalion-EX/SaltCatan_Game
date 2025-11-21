import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Register = ({ setUser }) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
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
  `${import.meta.env.VITE_API_URL}/api/users/register`,
  formData
);

      localStorage.setItem("token", res.data.token);
      console.log(res.data);
      setUser(res.data);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

return (
<div className="min-h-screen flex items-center justify-center bg-gray-100">
<div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-200 text-center">
<h1 className="text-4xl font-bold text-gray-800">HELLO FADY</h1>
</div>
</div>
);
}
export default Register;
