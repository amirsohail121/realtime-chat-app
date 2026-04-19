import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Login() {

  const { login } = useContext(AuthContext);


  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");

  // ===== SEND OTP (SIMULATED) =====
  const handleSendOtp = () => {
    setError("");

    if (!email) {
      setError("Enter email");
      return;
    }

    alert("OTP sent to email (demo: 123456)");
    setOtpSent(true);
  };

  // ===== VERIFY OTP =====
  const handleVerifyOtp = () => {
    setError("");

    if (!otp) {
      setError("Enter OTP");
      return;
    }

    if (otp !== "123456") {
      setError("Invalid OTP");
      return;
    }

    login({
      email: email,
      name: email.split("@")[0] // demo name
    });
    // ===== SIMULATE USER CHECK =====
    const existingUserEmails = ["rahul@gmail.com", "ali@gmail.com"];

    if (existingUserEmails.includes(email)) {
      // Existing user → go to chat
      navigate("/chat");
    } else {
      // New user → go to profile setup
      navigate("/profile", { state: { email } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Email Login</h2>
        <p className="text-gray-500 text-center mb-6">Secure access to your chat</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* EMAIL SCREEN */}
        {!otpSent && (
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-black px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />

            <button
              onClick={handleSendOtp}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition duration-200"
            >
              Send OTP
            </button>
          </div>
        )}

        {/* OTP SCREEN */}
        {otpSent && (
          <div className="space-y-4">
            <p className="text-gray-600 text-center">Enter OTP sent to <span className="font-semibold text-indigo-600">{email}</span></p>

            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full text-black px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-center tracking-widest text-lg"
            />

            <button
              onClick={handleVerifyOtp}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition duration-200"
            >
              Verify OTP
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
