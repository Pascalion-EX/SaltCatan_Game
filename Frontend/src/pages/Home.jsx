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
  brick: "/resources/brick.png",
  iron: "/resources/iron.png",
  wheat: "/resources/wheat.png",
  sheep: "/resources/sheep.png",
};

const Home = ({ user, setUser, error }) => {
  const [users, setUsers] = useState([]);
  const [inventory, setInventory] = useState(user?.inventory || {});
  const [editingUser, setEditingUser] = useState(null);
  const [editData, setEditData] = useState({ username: "", email: "" });
  const [activeTab, setActiveTab] = useState("profile");
  

  const API_BASE = import.meta.env.VITE_API_URL;

  /* ============================================================
      🔁 Sync local user with backend (profile refresh)
  ============================================================ */
  const refreshUser = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/users/profile`);
      setInventory(res.data.inventory || {});

      setUser((prev) => {
        const updated = { ...prev, ...res.data };
        localStorage.setItem("user", JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error("Failed to refresh user:", err);
    }
  };

  /* ============================================================
      🔁 Fetch Users (Admin + Normal Users)
  ============================================================ */
  const fetchUsers = async () => {
    try {
      const endpoint =
        user?.role === "admin"
          ? `${API_BASE}/api/users/admin/users`
          : `${API_BASE}/api/users/all`;

      const res = await axios.get(endpoint);
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users:", err.response?.data || err.message);
    }
  };

  /* ============================================================
      🔁 When user loads or changes → fetch users + sync profile
  ============================================================ */
  useEffect(() => {
    if (user) {
      fetchUsers();
      refreshUser();
    }
  }, [user]);

  /* ============================================================
      🧩 Admin Update Functions
  ============================================================ */
  const updateInventory = async (id, card, amount) => {
    try {
      const res = await axios.put(
        `${API_BASE}/api/users/admin/inventory/${id}`,
        { card, amount }
      );
      fetchUsers();
    } catch (err) {
      console.error("Failed to update inventory:", err);
    }
  };

  const updateResources = async (id, resource, amount) => {
    try {
      await axios.put(
        `${API_BASE}/api/users/admin/resources/${id}`,
        { resource, amount }
      );
      fetchUsers();
    } catch (err) {
      console.error("Failed to update resources:", err);
    }
  };

  const updateBuildings = async (id, type, amount) => {
    try {
      await axios.put(
        `${API_BASE}/api/users/admin/buildings/${id}`,
        { type, amount }
      );
      fetchUsers();
    } catch (err) {
      console.error("Failed to update buildings:", err);
    }
  };

  const updateTokens = async (id, amount) => {
    try {
      const res = await axios.put(
        `${API_BASE}/api/users/admin/tokens/${id}`,
        { amount }
      );

      // Update instantly
      setUsers((prev) =>
        prev.map((u) =>
          u._id === id ? { ...u, Token: res.data.Token } : u
        )
      );
    } catch (err) {
      console.error("Failed to update tokens:", err);
    }
  };

  /* ============================================================
      🎴 Mystery Card (User Only)
  ============================================================ */
  const handleMysteryCard = async () => {
    try {
      if (user.Token <= 0) {
        alert("❌ Not enough tokens!");
        return;
      }

      const cards = Object.keys(cardImages);
      const randomCard = cards[Math.floor(Math.random() * cards.length)];

      // Add card
      await axios.put(
        `${API_BASE}/api/users/inventory/${user._id}`,
        {
          card: randomCard,
          amount: (inventory[randomCard] || 0) + 1,
        }
      );

      // Deduct token
      await axios.put(
        `${API_BASE}/api/users/tokens/${user._id}`,
        { amount: -1 }
      );

      alert(`🎉 You received a ${randomCard}!`);

      await refreshUser();
    } catch (err) {
      console.error("Failed to use mystery card:", err);
    }
  };

  /* ============================================================
      📝 Edit Username / Email (Admin)
  ============================================================ */
  const handleEditClick = (u) => {
    setEditingUser(u._id);
    setEditData({ username: u.username, email: u.email });
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleEditSave = async (id) => {
    try {
      await axios.put(`${API_BASE}/api/users/admin/edit/${id}`, editData);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      console.error("Failed to edit user:", err);
    }
  };

  /* ============================================================
      🧮 Calculations
  ============================================================ */
  const sumCards = (inv) =>
    Object.values(inv || {}).reduce((a, b) => a + (b || 0), 0);

  const sumResources = (res) =>
    Object.values(res || {}).reduce((a, b) => a + (b || 0), 0);

  const totalCards = sumCards(user?.inventory || {});
  const totalResources = sumResources(user?.resources || {});
  const totalSum = totalCards + totalResources;

  /* ============================================================
      UI Rendering
  ============================================================ */
  return (
    <div className="relative w-screen h-screen flex items-center justify-center overflow-hidden">
      <img
        src="/Background/Bg.jpg"
        className="absolute inset-0 w-full h-full object-cover -z-10"
      />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      <div className="relative z-10 bg-white/80 backdrop-blur-lg p-6 md:p-8 rounded-2xl shadow-2xl w-[95%] sm:w-[90%] md:w-[85%] lg:w-[75%] xl:max-w-5xl text-center border border-gray-200 animate-fadeIn overflow-y-auto max-h-[90vh]">
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

        {user ? (
          <>
            {/* ======================== USER VIEW ======================== */}
            {user.role !== "admin" ? (
              <>
                {/* Tabs */}
                <div className="flex justify-center mb-6 space-x-4">
                  <button
                    onClick={() => setActiveTab("profile")}
                    className={`px-4 py-2 rounded-lg font-semibold ${
                      activeTab === "profile"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200"
                    }`}
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => setActiveTab("summary")}
                    className={`px-4 py-2 rounded-lg font-semibold ${
                      activeTab === "summary"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200"
                    }`}
                  >
                    Summary
                  </button>
                </div>

                {activeTab === "profile" && (
                  <>
                    <h2 className="text-3xl font-bold mb-4 text-gray-900">
                      Welcome, {user.username}
                    </h2>

                    <p className="text-gray-700 mb-6 font-medium">
                      Role: {user.role}
                    </p>

                    {/* Cards */}
                    <div className="text-left bg-white/80 p-4 rounded-lg mb-6 shadow-md">
                      <h3 className="text-lg font-semibold mb-3 text-gray-800">
                        Your Cards:
                      </h3>

                      {Object.keys(cardImages).map((card) => (
                        <div
                          key={card}
                          className="flex items-center gap-3 bg-white hover:bg-gray-50 rounded-md p-2 mb-2 shadow-sm border"
                        >
                          <img
                            src={cardImages[card]}
                            className="w-8 h-8 rounded-md border"
                          />
                          <span className="capitalize flex-1">
                            {card.replace(/([A-Z])/g, " $1")}:
                          </span>
                          <span className="font-semibold">
                            {inventory?.[card] ?? 0}
                          </span>
                        </div>
                      ))}

                      <p className="text-lg font-semibold text-yellow-500 mt-2">
                        🏆 Score: {user.score}
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
                          className="flex items-center gap-3 bg-white hover:bg-gray-50 rounded-md p-2 mb-2 shadow-sm border"
                        >
                          <img
                            src={resourceImages[res]}
                            className="w-8 h-8 rounded-md border"
                          />
                          <span className="capitalize flex-1">{res}</span>
                          <span className="font-semibold">
                            {user?.resources?.[res] ?? 0}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Buildings */}
                    <div className="text-left bg-white/80 p-4 rounded-lg mb-4 shadow-md">
                      <h3 className="text-lg font-semibold mb-3 text-gray-800">
                        Buildings:
                      </h3>

                      <p>🏠 Houses: {user.house ?? 0}</p>
                      <p>🏡 Villages: {user.village ?? 0}</p>
                      <p>🛣️ Roads: {user.roads ?? 0}</p>
                    </div>

                    {/* Tokens */}
                    <div className="bg-white/80 p-4 rounded-lg shadow-md">
                      <p className="font-semibold mb-2">
                        🎟️ Tokens: {user.Token ?? 0}
                      </p>

                      <button
                        onClick={handleMysteryCard}
                        className="bg-purple-600 text-white px-6 py-3 rounded-xl"
                      >
                        🎴 Mystery Card
                      </button>
                    </div>
                  </>
                )}

                {/* ======================== SUMMARY TAB ======================== */}
                {activeTab === "summary" && (
                  <div>
                    <h3 className="text-2xl font-bold mb-6">Overall Summary</h3>

                    <table className="w-full mb-6">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border p-2">🏆 Score</th>
                          <th className="border p-2">🃏 Cards</th>
                          <th className="border p-2">🌾 Resources</th>
                          <th className="border p-2">📊 Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border p-2">{user.score ?? 0}</td>
                          <td className="border p-2">{totalCards}</td>
                          <td className="border p-2">{totalResources}</td>
                          <td className="border p-2">{totalSum}</td>
                        </tr>
                      </tbody>
                    </table>

                    <div>
                      <h3 className="text-lg font-bold mb-3">Other Teams:</h3>

                      {users
                        .filter((u) => u.role !== "admin" && u._id !== user._id)
                        .map((u) => (
                          
                          <div
                            key={u._id}
                            className="flex justify-between p-3 mb-2 border bg-white rounded"
                          >
                            <span>{u.username}</span>
                            
                            <span>
                              
                              🏠 {u.house ?? 0} | 🏡 {u.village ?? 0} | 🛣️ {u.roads ?? 0} | 🏆{" "}
                              {u.score ?? 0} |🌾 {u.totalResources} | 🃏 {u.totalCards}

                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* ======================== ADMIN VIEW ======================== */
              <div>
                <h3 className="text-xl font-bold mb-4">Admin Panel</h3>

                {users
                  .filter((u) => u.role !== "admin")
                  .map((u) => (
                    <div key={u._id} className="border p-4 rounded mb-4 bg-white/90">
                      {/* Edit User */}
                      {editingUser === u._id ? (
                        <div>
                          <input
                            className="border p-2 rounded w-full mb-2"
                            name="username"
                            value={editData.username}
                            onChange={handleEditChange}
                          />
                          <input
                            className="border p-2 rounded w-full mb-2"
                            name="email"
                            value={editData.email}
                            onChange={handleEditChange}
                          />
                          <button
                            className="bg-green-500 text-white px-4 py-2 rounded"
                            onClick={() => handleEditSave(u._id)}
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-between">
                          <p>
                            {u.username} ({u.email})
                          </p>
                          <button
                            className="bg-blue-500 text-white px-3 py-1 rounded"
                            onClick={() => handleEditClick(u)}
                          >
                            Edit
                          </button>
                        </div>
                      )}

                      {/* Score */}
                      <p className="mt-2">🏆 Score: {u.score ?? 0}</p>

                      {/* Tokens */}
                      <div className="mt-3">
                        <h4 className="font-semibold">Tokens:</h4>
                        <div className="flex justify-between p-2 border rounded bg-white">
                          <span>🎟️ Tokens</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateTokens(u._id, -1)}
                              className="px-2 bg-red-500 text-white rounded"
                            >
                              -
                            </button>
                            <span>{u.Token ?? 0}</span>
                            <button
                              onClick={() => updateTokens(u._id, 1)}
                              className="px-2 bg-green-500 text-white rounded"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Cards */}
                      <div className="mt-4">
                        <h4 className="font-semibold">Cards:</h4>
                        {Object.entries(u.inventory || {}).map(([card, count]) => (
                          <div
                            key={card}
                            className="flex justify-between p-2 border rounded bg-white mb-1"
                          >
                            <div className="flex items-center gap-2">
                              <img src={cardImages[card]} className="w-6 h-6" />
                              <span className="capitalize">{card}</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateInventory(u._id, card, count - 1)}
                                className="px-2 bg-red-500 text-white rounded"
                              >
                                -
                              </button>
                              <span>{count}</span>
                              <button
                                onClick={() => updateInventory(u._id, card, count + 1)}
                                className="px-2 bg-green-500 text-white rounded"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Resources */}
                      <div className="mt-4">
                        <h4 className="font-semibold">Resources:</h4>
                        {Object.entries(u.resources || {}).map(([res, amount]) => (
                          <div
                            key={res}
                            className="flex justify-between p-2 border rounded bg-white mb-1"
                          >
                            <div className="flex items-center gap-2">
                              <img src={resourceImages[res]} className="w-6 h-6" />
                              <span className="capitalize">{res}</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateResources(u._id, res, amount - 1)}
                                className="px-2 bg-red-500 text-white rounded"
                              >
                                -
                              </button>
                              <span>{amount}</span>
                              <button
                                onClick={() => updateResources(u._id, res, amount + 1)}
                                className="px-2 bg-green-500 text-white rounded"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Buildings */}
                      <div className="mt-4">
                        <h4 className="font-semibold">Buildings:</h4>
                        {["house", "village", "roads"].map((b) => (
                          <div
                            key={b}
                            className="flex justify-between p-2 border rounded bg-white mb-1"
                          >
                            <span className="capitalize">{b}</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  updateBuildings(u._id, b, Math.max(0, u[b] - 1))
                                }
                                className="px-2 bg-red-500 text-white rounded"
                              >
                                -
                              </button>
                              <span>{u[b] ?? 0}</span>
                              <button
                                onClick={() =>
                                  updateBuildings(u._id, b, (u[b] ?? 0) + 1)
                                }
                                className="px-2 bg-green-500 text-white rounded"
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
            <h2 className="text-2xl font-bold mb-6 text-white">
              Welcome!
            </h2>
            <p className="text-xl mb-6 text-white">Please log in or register</p>
            <div className="flex flex-col space-y-4">
              <Link className="bg-blue-600 text-white p-3 rounded" to="/login">
                Login
              </Link>
              <Link className="bg-gray-200 p-3 rounded" to="/register">
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
