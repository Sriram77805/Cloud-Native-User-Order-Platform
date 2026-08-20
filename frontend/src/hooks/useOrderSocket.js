import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Subscribes to real-time order events for the logged-in user (auth is via
// the same httpOnly cookie the REST API uses - see backend/sockets/index.js).
export default function useOrderSocket({ enabled, onCreated, onUpdated, onDeleted }) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;

    const socket = io(SOCKET_URL, { withCredentials: true });
    socketRef.current = socket;

    if (onCreated) socket.on("order:created", onCreated);
    if (onUpdated) socket.on("order:updated", onUpdated);
    if (onDeleted) socket.on("order:deleted", onDeleted);

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return socketRef;
}
