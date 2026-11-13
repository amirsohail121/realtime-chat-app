// src/api/call.js
import api from "./api";

export const fetchIceServers = async () => {
  const response = await api.get("/call/ice-servers");
  return response.data.iceServers;
};
