  import { useState, useContext } from "react";
  import { useNavigate } from "react-router-dom";
  import {AuthContext} from "../context/AuthContext";
  import api from "../api/api";
import { generateKeyPair, savePrivateKey, getPrivateKey } from "../utils/crypto";


  export default function SetupProfile() {
    const navigate = useNavigate();
    const {user , login} =  useContext(AuthContext);
    const email = user?.email || "";

    const [name, setName] = useState(user?.name || "");
    const [bio, setBio] = useState(user?.bio || "");
    const [profilePic, setProfilePic] = useState(user?.profilePic || "");
    const [preview, setPreview] = useState(user?.profilePic || null);
    const [error, setError] = useState("");
  

    // ===== HANDLE IMAGE UPLOAD =====
    const handleImageChange =async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setPreview(URL.createObjectURL(file));

      const formData = new FormData();
      formData.append("image", file);
      try{
        const res = await api.post("/upload", formData);
        setProfilePic(res.data.url);
      } catch (err) {
        setError("Image upload failed");
      }
    };

   //saved
    const handleSave = async () => {
      setError("");

      if (!name.trim()) {
        setError("Enter your name");
        return;
      }

      try {
        // Check if user already has valid key pair
        const hasExistingKey =
          user?.publicKey &&
          user.publicKey.length > 0 &&
          getPrivateKey(user._id) !== null;

        let publicKey = user?.publicKey || "";

        if (!hasExistingKey) {
          console.log("Generating new key pair...");
          const { publicKey: pubKey, privateKey } = generateKeyPair();
          publicKey = pubKey;
          savePrivateKey(privateKey, user._id);
          console.log("Key pair generated ✅");
        } else {
          console.log("Keeping existing key pair ✅");
          publicKey = user.publicKey;
        }

        const res = await api.put("/auth/complete-profile", {
          name,
          bio,
          profilePic,
          publicKey,
        });

        login(res.data);
        navigate("/chat");

      } catch (err) {
        setError(err.response?.data?.message || "Failed to save profile");
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Setup Profile
          </h2>

      {/* error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

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

        

          {/* ===== BIO ===== */}
          <textarea
            placeholder="Write a short bio..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full text-black px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
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
