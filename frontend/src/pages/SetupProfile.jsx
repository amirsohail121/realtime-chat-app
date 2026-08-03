import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/api";
import { generateKeyPair, savePrivateKey, getPrivateKey } from "../utils/crypto";
import { FiCamera, FiUser, FiMail, FiEdit3, FiAlertCircle, FiLoader } from "react-icons/fi";
import imageCompression from "browser-image-compression";

export default function SetupProfile() {
  const navigate = useNavigate();
  const { user, login } = useContext(AuthContext);
  const email = user?.email || "";

  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [profilePic, setProfilePic] = useState(user?.profilePic || "");
  const [preview, setPreview] = useState(user?.profilePic || null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const BIO_LIMIT = 150;

  // ===== HANDLE IMAGE UPLOAD =====
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setUploading(true);
    setError("");

    try {
      console.log("📷 Original File:", {
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      });

      // Compress image
      const compressedBlob = await imageCompression(file, {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 512,
        useWebWorker: true,
        initialQuality: 0.8,
      });

      // Convert Blob back to File
      const uploadFile = new File(
        [compressedBlob],
        file.name,
        {
          type: compressedBlob.type || file.type,
          lastModified: Date.now(),
        }
      );

      console.log("🗜️ Compressed File:", {
        name: uploadFile.name,
        type: uploadFile.type,
        size: `${(uploadFile.size / 1024 / 1024).toFixed(2)} MB`,
      });

      const formData = new FormData();
      formData.append("image", uploadFile);

      console.time("Image Upload");

      const res = await api.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.timeEnd("Image Upload");

      console.log("✅ Upload Response:", res.data);

      setProfilePic(res.data.url);
    } catch (err) {
      console.error("❌ Upload Error:", err.response?.data || err);

      setError(
        err.response?.data?.message ||
        "Image upload failed. Please try another image."
      );
    } finally {
      setUploading(false);
    }
  };

  // ===== SAVE =====
  const handleSave = async () => {
    setError("");

    if (!name.trim()) {
      setError("Enter your name");
      return;
    }

    setSaving(true);
    const savingStartedAt = Date.now();
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

      const elapsed = Date.now() - savingStartedAt;
      const MIN_LOADER_MS = 600;
      if (elapsed < MIN_LOADER_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_LOADER_MS - elapsed));
      }

      login(res.data);
      navigate("/chat");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(135deg, var(--color-primary-light) 0%, #ffffff 45%, var(--bubble-received-bg) 100%)",
      }}
    >
      <div className="relative bg-[var(--color-surface)] rounded-2xl shadow-xl p-8 w-full max-w-md border border-[var(--color-surface-muted)]">
        {/* SAVING OVERLAY */}
        {saving && (
          <div className="absolute inset-0 z-10 rounded-2xl bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <FiLoader size={32} className="animate-spin text-[var(--color-secondary)]" />
            <p className="text-sm font-medium text-[var(--color-heading)]">
              Saving your profile...
            </p>
            <p className="text-xs text-[var(--color-body)]">
              Setting up secure encryption keys
            </p>
          </div>
        )}
        {/* HEADER */}
        <div className="text-center mb-7">
          <h2 className="text-2xl font-bold text-[var(--color-heading)]">
            Set up your profile
          </h2>
          <p className="text-sm text-[var(--color-body)] mt-1">
            This is how others will see you on ChatWave
          </p>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-5 text-sm">
            <FiAlertCircle className="flex-shrink-0" size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* ===== PROFILE IMAGE ===== */}
        <div className="flex flex-col items-center mb-7">
          <label className={`relative group ${saving ? "pointer-events-none opacity-70" : "cursor-pointer"}`}>
            <div
              className="w-28 h-28 rounded-full overflow-hidden shadow-md ring-4"
              style={{ "--tw-ring-color": "var(--color-secondary-light)" }}
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Profile Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[var(--color-primary-light)]">
                  <FiUser size={40} className="text-[var(--color-secondary)]" />
                </div>
              )}

              {/* HOVER OVERLAY */}
              <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                {uploading ? (
                  <FiLoader
                    size={22}
                    className="text-white animate-spin opacity-100"
                  />
                ) : (
                  <FiCamera
                    size={22}
                    className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                )}
              </div>
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>

          <span className="mt-3 text-sm font-medium text-[var(--color-secondary)]">
            {uploading ? "Uploading..." : "Tap to change photo"}
          </span>
        </div>

        {/* ===== EMAIL DISPLAY ===== */}
        <div className="mb-4 flex items-center gap-3 p-3.5 bg-[var(--color-surface-tint)] rounded-xl">
          <div className="w-9 h-9 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center flex-shrink-0">
            <FiMail size={16} className="text-[var(--color-primary,#00A19E)]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-[var(--color-body)]">Email address</p>
            <p className="text-sm font-semibold text-[var(--color-heading)] truncate">
              {email}
            </p>
          </div>
        </div>

        {/* ===== NAME ===== */}
        <div className="relative mb-4">
          <FiUser
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-body)]"
          />
          <input
            type="text"
            placeholder="Full name"
            value={name}
            disabled={saving}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-[var(--color-heading)] pl-10 pr-4 py-3 border border-[var(--color-surface-muted)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary-light)] transition-shadow disabled:opacity-60"
          />
        </div>

        {/* ===== BIO ===== */}
        <div className="relative mb-1.5">
          <FiEdit3
            size={16}
            className="absolute left-3.5 top-3.5 text-[var(--color-body)]"
          />
          <textarea
            placeholder="Write a short bio..."
            value={bio}
            maxLength={BIO_LIMIT}
            disabled={saving}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full text-[var(--color-heading)] pl-10 pr-4 py-3 border border-[var(--color-surface-muted)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary-light)] resize-none transition-shadow disabled:opacity-60"
          />
        </div>
        <p className="text-xs text-right text-[var(--color-body)] mb-5">
          {bio.length}/{BIO_LIMIT}
        </p>

        {/* ===== SAVE BUTTON ===== */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full text-white font-semibold py-3 rounded-xl transition-transform disabled:opacity-70 disabled:hover:scale-100 hover:scale-[1.02] flex items-center justify-center gap-2 shadow-md"
          style={{
            background:
              "linear-gradient(135deg, var(--color-secondary) 0%, #5b3aa8 100%)",
          }}
        >
          {saving && <FiLoader size={16} className="animate-spin" />}
          {saving ? "Saving..." : "Save & Continue"}
        </button>
      </div>
    </div>
  );
}