import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import router from "./routes/router";
import { ChatProvider } from "./context/ChatContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <ChatProvider>
      <RouterProvider router={router} />
    </ChatProvider>
  </AuthProvider>
);
