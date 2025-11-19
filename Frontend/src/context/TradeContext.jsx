import { createContext, useState } from "react";

export const TradeContext = createContext();

export const TradeProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const sendTrade = (offer, want) => {
    setNotifications((prev) => [
      ...prev,
      { id: Date.now(), offer, want }
    ]);
  };

  const removeTrade = (id) => {
    setNotifications((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <TradeContext.Provider value={{ notifications, sendTrade, removeTrade }}>
      {children}
    </TradeContext.Provider>
  );
};
