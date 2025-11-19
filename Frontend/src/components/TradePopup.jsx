import { useState, useContext } from "react";
import { TradeContext } from "../context/TradeContext";

export default function TradePopup({ user }) {
  const { notifications, sendTrade, removeTrade } = useContext(TradeContext);
  const [open, setOpen] = useState(false);

  const [offer, setOffer] = useState("");
  const [want, setWant] = useState("");

  const handleSend = () => {
    if (!offer || !want) return alert("Enter trade details");

    sendTrade(offer, want);
    setOffer("");
    setWant("");
    alert("Trade sent!");
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
      className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-blue-700 z-[9999]"
      >
        Trade
        {user?.role === "Admin" && notifications.length > 0 && (
          <span className="ml-2 bg-red-500 px-2 py-1 rounded-full text-xs">
            {notifications.length}
          </span>
        )}
      </button>

      {/* Popup Panel */}
      {open && (
        <div className="fixed bottom-20 right-6 w-72 bg-white shadow-xl p-4 rounded-lg border z-[99999]">
          {/* USER VIEW */}
          {user?.role !== "Admin" && (
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
          {user?.role === "Admin" && (
            <div>
              <h2 className="font-bold mb-3">Trade Requests</h2>

              {notifications.length === 0 && (
                <p className="text-gray-500">No pending trades.</p>
              )}

              {notifications.map((t) => (
                <div key={t.id} className="border p-2 rounded mb-3">
                  <p><b>Offer:</b> {t.offer}</p>
                  <p><b>Wants:</b> {t.want}</p>

                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        alert("Trade Accepted!");
                        removeTrade(t.id);
                      }}
                      className="flex-1 bg-green-600 text-white p-1 rounded"
                    >
                      Accept
                    </button>

                    <button
                      onClick={() => {
                        alert("Trade Declined.");
                        removeTrade(t.id);
                      }}
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
