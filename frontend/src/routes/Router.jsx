import { createBrowserRouter } from "react-router-dom";
// import Login from "../pages/Login";
import Chat from "../pages/Chat";
// import SetupProfile from "../pages/SetupProfile";
// import ProtectedRoute from "./ProtectedRoute"; // your filename
import Settings from "../pages/Settings";

const router = createBrowserRouter([
  // {
  //   path: "/",
  //   element: <Login />
  // },
  // {
  //   path: "/profile",
  //   element: (
  //     <ProtectedRoute>
  //       <SetupProfile />
  //     </ProtectedRoute>
  //   )
  // },
  {
    path: "/settings",
    element: (
      <Settings />
    )
  },
  {
    path: "/chat",
    element: (
      // <ProtectedRoute>
      <Chat />
      // {/* </ProtectedRoute> */}
    )
  }
]);

export default router;
