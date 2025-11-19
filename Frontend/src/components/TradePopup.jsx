import { useState, useEffect } from "react";
import axios from "axios";

export default function TradePopup({ user }) {
  const [open, setOpen] = useState(false);

  const [offer, setOffer] = useState("");
  const [want, setWant] = useState("");

  const [trades, setTrades] = useState([]); // admin only
  const API_BASE = import.meta.env.VITE_API_URL;

  const token = localStorage.getItem("token");

  /* ============================
      USER — SEND TRADE
  ============================ */
  const handleSend = async () => {
    if (!offer || !want) return alert("Enter trade details");

    try {
      await axios.post(
        `${API_BASE}/api/users/trade/create`,   // <--- UPDATED
        { offer, want },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Trade sent!");
      setOffer("");
      setWant("");
    } catch (err) {
      console.error(err);
      alert("Failed to send trade");
    }
  };

  /* ============================
      ADMIN — FETCH ALL TRADES
  ============================ */
  const fetchTrades = async () => {
    if (user.role !== "admin") return;

    try {
      const res = await axios.get(`${API_BASE}/api/users/trade/all`, {   // <--- UPDATED
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTrades(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Auto-refresh trades for admin
  useEffect(() => {
    if (user.role === "admin") {
      fetchTrades();
      const interval = setInterval(fetchTrades, 3000); // refresh every 3 sec
      return () => clearInterval(interval);
    }
  }, [user]);

  /* ============================
      ADMIN — UPDATE TRADE
  ============================ */
  const updateTrade = async (id, status) => {
    try {
      await axios.put(
        `${API_BASE}/api/users/trade/update/${id}`,  // <--- UPDATED
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchTrades(); // refresh after update
    } catch (err) {
      console.error(err);
      alert("Failed to update trade");
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-blue-700 z-[9999]"
      >
        Trade
        {user?.role === "admin" && trades.length > 0 && (
          <span className="ml-2 bg-red-500 px-2 py-1 rounded-full text-xs">
            {trades.filter((t) => t.status === "pending").length}
          </span>
        )}
      </button>

      {/* Popup Panel */}
      {open && (
        <div className="fixed bottom-20 right-6 w-72 bg-white shadow-xl p-4 rounded-lg border z-[99999]">
          {/* USER VIEW */}
          {user?.role !== "admin" && (
            <div>
              <h2 className="font-bold mb-2">Request Trade</h2>

              <input
                className="border p-2 w-full mb-2"
                placeholder="You offer..."
                value={offer}
                onChange={(e) => setOffer(e.target.value)}
              />

              <input
                className="border p-2 w-full mb-2"
                placeholder="You want..."
                value={want}
                onChange={(e) => setWant(e.target.value)}
              />

              <button
                onClick={handleSend}
                className="w-full bg-black text-white p-2 rounded"
              >
                Send
              </button>
            </div>
          )}

          {/* ADMIN VIEW */}
          {user?.role === "admin" && (
            <div>
              <h2 className="font-bold mb-3">Trade Requests</h2>

              {trades.filter((t) => t.status === "pending").length === 0 && (
                <p className="text-gray-500">No pending trades.</p>
              )}

              {trades
                .filter((t) => t.status === "pending")
                .map((t) => (
                  <div key={t._id} className="border p-2 rounded mb-3">
                    <p>
                      <b>User:</b> {t.user?.username}
                    </p>
                    <p>
                      <b>Offer:</b> {t.offer}
                    </p>
                    <p>
                      <b>Want:</b> {t.want}
                    </p>

                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => updateTrade(t._id, "accepted")}
                        className="flex-1 bg-green-600 text-white p-1 rounded"
                      >
                        Accept
                      </button>

                      <button
                        onClick={() => updateTrade(t._id, "declined")}
                        className="flex-1 bg-red-600 text-white p-1 rounded"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
