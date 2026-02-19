import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import { useAuthStore } from "./store/useAuthStore";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ChatPage from "./pages/ChatPage";

function App() {
  const { checkAuth, authUser } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <>
      <div>
        <Routes>
          <Route
            path="/"
            element={authUser ? <ChatPage /> : <Navigate to={"/auth/login"} />}
          />

          <Route
            path="/auth/signup"
            element={!authUser ? <Signup /> : <Navigate to="/" />}
          />
          <Route
            path="/auth/login"
            element={!authUser ? <Login /> : <Navigate to="/" />}
          />
        </Routes>
      </div>

      <Toaster />
    </>
  );
}

export default App;
