import { createBrowserRouter } from "react-router-dom";
import Login from "../pages/Login";
import Chat from "../pages/Chat";
import ProtectedRoute from "./ProtectedRoute";
import SetupProfile from "../pages/SetupProfile";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />
  },
  {
    path: "/profile",
    element: <SetupProfile />
  },
  {
    path: "/chat",
    element: (
      // <ProtectedRoute>
        <Chat />
      // </ProtectedRoute>
    )
  }
]);

export default router;
