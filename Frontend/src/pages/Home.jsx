import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

// 🖼️ Card images
const cardImages = {
  victoryPoint: "/cards/victory-point.png",
  knight: "/cards/knight.png",
  roadBuilding: "/cards/road-building.png",
  yearOfPlenty: "/cards/year-of-plenty.png",
  monopoly: "/cards/monopoly.png",
};

// 🌾 Resource icons
const resourceImages = {
  wood: "/resources/wood.png",
  Bricks: "/resources/stone.png",
  iron: "/resources/iron.png",
  wheat: "/resources/wheat.png",
  Sheep: "/resources/lamb.png",
};

const Home = ({ user, error }) => {
  const [users, setUsers] = useState([]);
  const [inventory, setInventory] = useState(user?.inventory || {});
  const [editingUser, setEditingUser] = useState(null);
  const [editData, setEditData] = useState({ username: "", email: "" });
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    const init = async () => {
      if (user) {
        await fetchUsers();
              await refreshUser(); // 👈 keeps user always in sync
        setInventory(user.inventory || {});
      }
    };
    init();
  }, [user]);

  const fetchUsers = async () => {
    try {
      const endpoint =
        user?.role === "admin"
          ? "/api/users/admin/users"
          : "/api/users/all";
      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };
  const refreshUser = async () => {
  try {
    const res = await axios.get("/api/users/profile", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    setInventory(res.data.inventory || {});
    user.inventory = res.data.inventory;
    user.resources = res.data.resources;
    user.house = res.data.house;
    user.village = res.data.village;
    user.roads = res.data.roads;
    user.Token = res.data.Token;
  } catch (err) {
    console.error("Failed to refresh user:", err);
  }
};


  const updateInventory = async (id, card, amount) => {
    try {
      await axios.put(
        `/api/users/admin/inventory/${id}`,
        { card, amount },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      fetchUsers();
      
    } catch (err) {
      console.error("Failed to update inventory:", err);
    }
  };

  const updateResources = async (id, resource, amount) => {
    try {
      await axios.put(
        `/api/users/admin/resources/${id}`,
        { resource, amount },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      fetchUsers();
    } catch (err) {
      console.error("Failed to update resources:", err);
    }
  };

  const updateBuildings = async (id, type, amount) => {
    try {
      await axios.put(
        `/api/users/admin/buildings/${id}`,
        { type, amount },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      fetchUsers();
    } catch (err) {
      console.error("Failed to update buildings:", err);
    }
  };

const updateTokens = async (id, amount) => {
  try {
    const res = await axios.put(
      `/api/users/admin/tokens/${id}`,
      { amount },
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );

    // ✅ Update local users array instantly (no wait for fetch)
    setUsers((prev) =>
      prev.map((u) =>
        u._id === id ? { ...u, Token: res.data.tokens } : u
      )
    );
  } catch (err) {
    console.error("Failed to update tokens:", err);
  }
};


const handleMysteryCard = async () => {
  try {
    if (user.Token <= 0) {
      alert("❌ You don't have enough tokens!");
      return;
    }

    const cards = Object.keys(cardImages);
    const randomCard = cards[Math.floor(Math.random() * cards.length)];

    // 🎴 Add a random card (user-safe route)
    await axios.put(
      `/api/users/inventory/${user._id}`,
      { card: randomCard, amount: (inventory[randomCard] || 0) + 1 },
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );

    // 🪙 Deduct one token (user-safe route)
    await axios.put(
      `/api/users/tokens/${user._id}`,
      { amount: -1 },
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );

    alert(`🎉 You received a ${randomCard.replace(/([A-Z])/g, " $1")} card!`);

    // Refresh user's inventory and tokens
    await refreshUser();
  } catch (err) {
    console.error("Failed to use mystery card:", err);
  }
};


  const handleEditClick = (u) => {
    setEditingUser(u._id);
    setEditData({ username: u.username, email: u.email });
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleEditSave = async (id) => {
    try {
      await axios.put(
        `/api/users/admin/edit/${id}`,
        editData,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      console.error("Failed to edit user:", err);
    }
  };

  const sumCards = (inv) => Object.values(inv || {}).reduce((a, b) => a + (b || 0), 0);
  const sumResources = (res) => Object.values(res || {}).reduce((a, b) => a + (b || 0), 0);

  const totalCards = sumCards(user?.inventory || {});
  const totalResources = sumResources(user?.resources || {});
  const totalSum = totalCards + totalResources;

  return (
    <div className="relative w-screen h-screen flex items-center justify-center overflow-hidden">
      <img
        src="/Background/Bg.jpg"
        alt="background"
        className="absolute inset-0 w-full h-full object-cover -z-10"
      />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      <div className="relative z-10 bg-white/80 backdrop-blur-lg p-6 md:p-8 rounded-2xl shadow-2xl w-[95%] sm:w-[90%] md:w-[85%] lg:w-[75%] xl:max-w-5xl text-center border border-gray-200 animate-fadeIn overflow-y-auto max-h-[90vh]">
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

        {user ? (
          <>
            {user.role !== "admin" ? (
              <>
                <div className="flex justify-center mb-6 space-x-4">
                  <button
                    onClick={() => setActiveTab("profile")}
                    className={`px-4 py-2 rounded-lg font-semibold ${
                      activeTab === "profile"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => setActiveTab("summary")}
                    className={`px-4 py-2 rounded-lg font-semibold ${
                      activeTab === "summary"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    Summary
                  </button>
                </div>

                {activeTab === "profile" && (
                  <>
                    <h2 className="text-3xl font-bold mb-4 text-gray-900 drop-shadow-md">
                      Welcome, {user.username}
                    </h2>
                    <p className="text-gray-700 mb-6 font-medium">Role: {user.role}</p>

                    {/* Cards */}
                    <div className="text-left bg-white/80 p-4 rounded-lg mb-6 shadow-md">
                      <h3 className="text-lg font-semibold mb-3 text-gray-800">Your Cards:</h3>
                      {Object.keys(cardImages).map((card) => (
                        <div
                          key={card}
                          className="flex items-center gap-3 bg-white hover:bg-gray-50 rounded-md p-2 mb-2 shadow-sm border border-gray-200"
                        >
                          <img
                            src={cardImages[card]}
                            alt={card}
                            className="w-8 h-8 rounded-md border border-gray-300 object-cover"
                          />
                          <span className="capitalize text-gray-700 font-medium flex-1">
                            {card.replace(/([A-Z])/g, " $1")}:
                          </span>
                          <span className="font-semibold text-gray-900">
                            {inventory?.[card] ?? 0}
                          </span>
                        </div>
                      ))}
                      <p className="text-lg font-semibold text-yellow-500 mt-2">
                        🏆 Score: {user.score}
                      </p>
                      <p className="mt-3 font-semibold text-gray-900">
                        Total Cards: {totalCards}
                      </p>
                    </div>

                    {/* Resources */}
                    <div className="text-left bg-white/80 p-4 rounded-lg mb-6 shadow-md">
                      <h3 className="text-lg font-semibold mb-3 text-gray-800">
                        Your Resources:
                      </h3>
                      {Object.keys(resourceImages).map((res) => (
                        <div
                          key={res}
                          className="flex items-center gap-3 bg-white hover:bg-gray-50 rounded-md p-2 mb-2 shadow-sm border border-gray-200"
                        >
                          <img
                            src={resourceImages[res]}
                            alt={res}
                            className="w-8 h-8 rounded-md border border-gray-300 object-cover"
                          />
                          <span className="capitalize text-gray-700 font-medium flex-1">
                            {res}
                          </span>
                          <span className="font-semibold text-gray-900">
                            {user?.resources?.[res] ?? 0}
                          </span>
                        </div>
                      ))}
                      <p className="mt-3 font-semibold text-gray-900">
                        Total Resources: {totalResources}
                      </p>
                    </div>

                    {/* Buildings */}
                    <div className="text-left bg-white/80 p-4 rounded-lg mb-4 shadow-md">
                      <h3 className="text-lg font-semibold mb-3 text-gray-800">
                        Your Buildings:
                      </h3>
                      <div className="space-y-2">
                        <p className="font-medium text-gray-700">🏠 Houses: {user.house ?? 0}</p>
                        <p className="font-medium text-gray-700">🏡 Villages: {user.village ?? 0}</p>
                        <p className="font-medium text-gray-700">🛣️ Roads: {user.roads ?? 0}</p>
                      </div>
                    </div>

                    {/* Tokens + Mystery Card */}
                    <div className="bg-white/80 p-4 rounded-lg shadow-md text-center">
                      <p className="font-semibold text-gray-800 mb-2">
                        🎟️ Tokens: {user.Token ?? 0}
                      </p>
                      <button
                        onClick={handleMysteryCard}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold shadow-md transition-all"
                      >
                        🎴 Mystery Card
                      </button>
                    </div>
                  </>
                )}

                {activeTab === "summary" && (
                  <div className="animate-fadeIn">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6 drop-shadow">
                      Overall Summary
                    </h3>
                    <div className="bg-white/80 p-4 rounded-lg shadow-md mb-6">
                      <p className="text-lg font-semibold mb-3 text-gray-700">
                        {user.username}'s Totals:
                      </p>
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border p-2">🏆 Score</th>
                            <th className="border p-2">🃏 Total Cards</th>
                            <th className="border p-2">🌾 Total Resources</th>
                            <th className="border p-2">📊 Combined Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border p-2">{user.score ?? 0}</td>
                            <td className="border p-2">{totalCards}</td>
                            <td className="border p-2">{totalResources}</td>
                            <td className="border p-2 font-bold text-blue-700">{totalSum}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-white/80 p-4 rounded-lg shadow-md">
                      <h3 className="text-lg font-bold mb-3 text-gray-800">Other Teams:</h3>
                      {users
                        .filter((u) => u.role !== "admin" && u._id !== user._id)
                        .map((u) => (
                          <div
                            key={u._id}
                            className="flex justify-between items-center bg-white rounded-md p-3 mb-2 border border-gray-200"
                          >
                            <span className="font-medium text-gray-800">{u.username}</span>
                            <span className="text-sm text-gray-600">
                              🏠 {u.house ?? 0} | 🏡 {u.village ?? 0} | 🛣️ {u.roads ?? 0} | 🏆{" "}
                              {u.score ?? 0}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              // 🧩 ADMIN PANEL
              <div>
                <h3 className="text-xl font-bold mb-4 text-gray-900 drop-shadow">
                  Admin Panel – Manage Teams
                </h3>

                {users
                  .filter((u) => u.role !== "admin")
                  .map((u) => (
                    <div
                      key={u._id}
                      className="border border-gray-200 p-4 rounded-lg mb-4 text-left bg-white/80 shadow-lg hover:shadow-xl transition-all"
                    >
                      {editingUser === u._id ? (
                        <div className="mb-3">
                          <input
                            className="border p-2 rounded w-full mb-2"
                            type="text"
                            name="username"
                            value={editData.username}
                            onChange={handleEditChange}
                            placeholder="Username"
                          />
                          <input
                            className="border p-2 rounded w-full mb-2"
                            type="email"
                            name="email"
                            value={editData.email}
                            onChange={handleEditChange}
                            placeholder="Email"
                          />
                          <button
                            onClick={() => handleEditSave(u._id)}
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mr-2"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingUser(null)}
                            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="mb-3 flex justify-between items-center">
                          <p className="font-semibold text-gray-800">
                            {u.username} ({u.email})
                          </p>
                          <button
                            onClick={() => handleEditClick(u)}
                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                          >
                            Edit
                          </button>
                        </div>
                      )}

                      <p className="text-gray-800 font-medium mb-2">
                        🏆 Score:{" "}
                        <span className="text-yellow-600 font-bold">{u.score ?? 0}</span>
                      </p>

                      {/* 🪙 Tokens */}
                      <h4 className="font-semibold text-gray-800 mt-4 mb-2">Tokens:</h4>
                      <div className="flex justify-between items-center bg-white rounded-md p-2 border border-gray-200">
                        <span className="font-medium text-gray-700">🎟️ Tokens</span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateTokens(u._id, -1)}
                            className="px-2 bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            -
                          </button>
                          <span>{u.Token ?? 0}</span>
                          <button
                            onClick={() => updateTokens(u._id, 1)}
                            className="px-2 bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Cards */}
                      <h4 className="font-semibold text-gray-800 mt-4 mb-2">Cards:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {Object.entries(u.inventory || {}).map(([card, count]) => (
                          <div
                            key={card}
                            className="flex justify-between items-center bg-white rounded-md p-2 border border-gray-200"
                          >
                            <div className="flex items-center gap-2">
                              <img
                                src={cardImages[card]}
                                alt={card}
                                className="w-6 h-6 rounded-md border border-gray-300 object-cover"
                              />
                              <span className="capitalize">{card}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => updateInventory(u._id, card, count - 1)}
                                className="px-2 bg-red-500 text-white rounded hover:bg-red-600"
                              >
                                -
                              </button>
                              <span>{count}</span>
                              <button
                                onClick={() => updateInventory(u._id, card, count + 1)}
                                className="px-2 bg-green-500 text-white rounded hover:bg-green-600"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Resources */}
                      <h4 className="font-semibold text-gray-800 mt-4 mb-2">Resources:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {Object.entries(u.resources || {}).map(([res, amount]) => (
                          <div
                            key={res}
                            className="flex justify-between items-center bg-white rounded-md p-2 border border-gray-200"
                          >
                            <div className="flex items-center gap-2">
                              <img
                                src={resourceImages[res]}
                                alt={res}
                                className="w-6 h-6 rounded-md border border-gray-300 object-cover"
                              />
                              <span className="capitalize">{res}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => updateResources(u._id, res, amount - 1)}
                                className="px-2 bg-red-500 text-white rounded hover:bg-red-600"
                              >
                                -
                              </button>
                              <span>{amount}</span>
                              <button
                                onClick={() => updateResources(u._id, res, amount + 1)}
                                className="px-2 bg-green-500 text-white rounded hover:bg-green-600"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Buildings */}
                      <h4 className="font-semibold text-gray-800 mt-4 mb-2">Buildings:</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {["house", "village", "roads"].map((b) => (
                          <div
                            key={b}
                            className="flex justify-between items-center bg-white rounded-md p-2 border border-gray-200"
                          >
                            <span className="capitalize font-medium text-gray-700">{b}</span>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() =>
                                  updateBuildings(u._id, b, Math.max(0, u[b] - 1))
                                }
                                className="px-2 bg-red-500 text-white rounded hover:bg-red-600"
                              >
                                -
                              </button>
                              <span>{u[b] ?? 0}</span>
                              <button
                                onClick={() =>
                                  updateBuildings(u._id, b, (u[b] ?? 0) + 1)
                                }
                                className="px-2 bg-green-500 text-white rounded hover:bg-green-600"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </>
        ) : (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-white drop-shadow-md">Welcome!</h2>
            <p className="text-xl font-semibold mb-6 text-white drop-shadow-md">
              Please log in or register
            </p>
            <div className="flex flex-col space-y-4">
              <Link
                className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 font-medium shadow-md"
                to="/login"
              >
                Login
              </Link>
              <Link
                className="w-full bg-gray-200 text-gray-800 p-3 rounded-md hover:bg-gray-300 font-medium shadow-md"
                to="/register"
              >
                Register
              </Link>
            </div>
          </div>
        )}
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

export default Home;
