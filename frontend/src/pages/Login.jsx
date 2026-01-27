import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
// import { ChatContext } from "../context/ChatContext";

const Login = () => {
  // const { setSelectedChat } = useContext(ChatContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    // Basic Validation
    if (!email || !password) {
      setError("All fields are required");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    // // Simulate API Call
    setLoading(true);
    setTimeout(() => {
      //   // Fake user login
      //   setSelectedChat({
      //     name: email.split("@")[0],
      //     email: email,
      //   });

      setLoading(false);
      navigate("/chat");
    }, 1000);
  };

  return (
    <div className="flex flex-1 justify-center items-center min-h-screen">
      <div className="bg-white  p-8 w-100 rounded-xl border-1 border-green-400 shadow-lg">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto bg-green-500 text-white flex items-center justify-center rounded-full text-xl font-bold">
            💬
          </div>
          <h2 className="text-2xl font-semibold mt-3">Welcome Back</h2>
          <p className="text-gray-500 text-sm">
            Login to continue to chat
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 text-red-700 px-3 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-black px-3 py-2 border-2 border-green-400 rounded-lg focus:outline-none focus: focus:ring-green-400"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-black border-green-400 px-3 py-2 border-2 rounded-lg focus:outline-none focus: focus:ring-green-400"
            />
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-4">
          Don’t have an account?{" "}
          <Link to="/register" className="text-green-500 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;