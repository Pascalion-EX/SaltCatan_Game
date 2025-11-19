import React from "react";
import { Link, useNavigate } from "react-router-dom";
import TradePopup from "./TradePopup";

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/");
  };

  return (
    <>
      <nav className="bg-gray-800 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-white text-lg font-bold">
            SALT CATAN
          </Link>

          <div>
            {user ? (
              <button
                onClick={handleLogout}
                className="text-white bg-red-500 px-4 py-2 rounded hover:bg-red-600"
              >
                Logout
              </button>
            ) : (
              <>
                <Link className="text-white mx-2 hover:underline" to="/login">
                  Login
                </Link>
                <Link className="text-white mx-2 hover:underline" to="/register">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hovering Trade Button + Popup */}
      {user && <TradePopup user={user} />}
    </>
  );
};

export default Navbar;
