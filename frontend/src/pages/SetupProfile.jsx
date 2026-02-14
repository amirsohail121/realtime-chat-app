import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function SetupProfile() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [dob, setDob] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [preview, setPreview] = useState(null);

  // ===== HANDLE IMAGE UPLOAD =====
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // ===== SAVE PROFILE =====
  const handleSave = () => {
    if (!name.trim()) {
      alert("Enter your name");
      return;
    }

    if (!username.trim()) {
      alert("Enter username");
      return;
    }

    alert("Profile saved successfully");

    // later you will send this data to backend
    navigate("/chat");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Setup Profile
        </h2>

        {/* ===== PROFILE IMAGE ===== */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-indigo-200 shadow">
            {preview ? (
              <img
                src={preview}
                alt="Profile Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
                alt="Default avatar"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <label className="mt-3 text-indigo-600 cursor-pointer font-medium hover:underline">
            Change Photo
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        </div>

        {/* ===== EMAIL DISPLAY ===== */}
        <div className="mb-5 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Email Address</p>
          <p className="text-lg font-semibold text-gray-800">{email}</p>
        </div>

        {/* ===== NAME ===== */}
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full text-black px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        {/* ===== USERNAME ===== */}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full text-black px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        {/* ===== BIO ===== */}
        <textarea
          placeholder="Write a short bio..."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full text-black px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />

        {/* ===== DATE OF BIRTH ===== */}
        <input
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          className="w-full text-black px-4 py-3 border border-gray-300 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        {/* ===== SAVE BUTTON ===== */}
        <button
          onClick={handleSave}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition transform hover:scale-105"
        >
          Save & Continue
        </button>
      </div>
    </div>
  );
}
