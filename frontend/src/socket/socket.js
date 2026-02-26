import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000"; // backend later

export const socket = io(SOCKET_URL, { // create a socket  (but don't connect immediately)
  autoConnect: false
});