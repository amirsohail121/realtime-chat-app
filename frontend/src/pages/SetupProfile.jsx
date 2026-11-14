import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiAlertCircle, FiEdit3, FiLoader, FiLock, FiMail, FiPlus, FiUser } from "react-icons/fi";
import imageCompression from "browser-image-compression";
import { AuthContext } from "../context/AuthContext";
import api from "../api/api";
import { generateKeyPair, getPrivateKey, savePrivateKey } from "../utils/crypto";
import "../styles/pages/signup.css";

function Tag({ children, variant = "" }) {
  return <span className={`profile-tag${variant ? ` profile-tag--${variant}` : ""}`}>{children}</span>;
}

function SampleMessage({ name, time, mine, children }) {
  return (
    <article className={`profile-message${mine ? " profile-message--mine" : ""}`}>
      <div className="profile-message__meta"><strong>{name}</strong><span>{time}</span></div>
      <p>{children}</p>
    </article>
  );
}

export default function SetupProfile() {
  const navigate = useNavigate();
  const { user, login } = useContext(AuthContext);
  const email = user?.email || "";
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [profilePic, setProfilePic] = useState(user?.profilePic || "");
  const [preview, setPreview] = useState(user?.profilePic || "");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    setError("");

    try {
      const compressedBlob = await imageCompression(file, {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 512,
        useWebWorker: true,
        initialQuality: 0.8,
      });
      const uploadFile = new File([compressedBlob], file.name, {
        type: compressedBlob.type || file.type,
        lastModified: Date.now(),
      });
      const formData = new FormData();
      formData.append("image", uploadFile);
      const response = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfilePic(response.data.url);
    } catch (uploadError) {
      console.error("Profile photo upload failed", uploadError.response?.data || uploadError);
      setError(uploadError.response?.data?.message || "Image upload failed. Please try another image.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Enter your name.");
      return;
    }

    setSaving(true);
    const startedAt = Date.now();
    try {
      const hasExistingKey = user?.publicKey && getPrivateKey(user._id) !== null;
      let publicKey = user?.publicKey || "";
      if (!hasExistingKey) {
        const keyPair = generateKeyPair();
        publicKey = keyPair.publicKey;
        savePrivateKey(keyPair.privateKey, user._id);
      }

      const response = await api.put("/auth/complete-profile", { name, bio, profilePic, publicKey });
      const remaining = 600 - (Date.now() - startedAt);
      if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
      login(response.data);
      navigate("/chat");
    } catch (saveError) {
      setError(saveError.response?.data?.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="profile-page">
      <aside className="profile-aside">
        <div className="profile-rings" aria-hidden="true" />
        <div className="profile-aside__content">
          <div className="profile-logo">ChatWave</div>
          <div className="profile-aside__intro">
            <h1>Create your account in seconds.</h1>
            <p>Add a photo, choose your name and start talking. You&apos;re in as soon as you finish.</p>
          </div>
          <div className="profile-thread" aria-label="Sample conversation">
            <SampleMessage name="Aarav" time="10:38">Standup moved to 10, see you there.</SampleMessage>
            <SampleMessage name="You" time="10:40" mine>I&apos;ll bring the API notes.</SampleMessage>
          </div>
          <div className="profile-aside__tags">
            <Tag variant="lock"><FiLock aria-hidden="true" /> End-to-end encrypted</Tag>
            <Tag>Passwordless sign-in</Tag>
          </div>
        </div>
      </aside>

      <section className="profile-main" aria-label="Create your profile">
        <div className="profile-mobile-header">
          <div className="profile-logo profile-logo--dark">ChatWave</div>
          <Tag variant="lock"><FiLock aria-hidden="true" /> Secure sign-in</Tag>
        </div>
        <form className="profile-card" onSubmit={handleSave}>
          <div className="profile-card__topline">
            <div className="profile-logo profile-logo--dark">ChatWave</div>
            <Tag variant="lock"><FiLock aria-hidden="true" /> Secure sign-in</Tag>
          </div>
          <div className="profile-card__intro">
            <h2>Create your profile</h2>
            <p>Your account is ready as soon as you finish. No verification step.</p>
          </div>

          {error ? <div className="profile-error" role="alert"><FiAlertCircle aria-hidden="true" /><span>{error}</span></div> : null}

          <div className="profile-photo-row">
            <label className="profile-photo-picker" aria-label="Choose a profile photo">
              <span className="profile-photo">
                {preview ? <img src={preview} alt="Profile preview" /> : <FiUser aria-hidden="true" size={28} />}
              </span>
              <span className="profile-photo__badge"><FiPlus aria-hidden="true" /></span>
              <input type="file" accept="image/*" onChange={handleImageChange} disabled={saving} />
            </label>
            <div>
              <div className="profile-photo__title"><strong>Profile photo</strong><Tag>Optional</Tag></div>
              
              <label className="profile-upload-button" htmlFor="profile-upload">Upload photo</label>
              <input id="profile-upload" type="file" accept="image/*" onChange={handleImageChange} disabled={saving} />
            </div>
          </div>

          <div className="profile-fields">
            <label className="profile-field">
              <span>Full name</span>
              <span className="profile-input-wrap"><FiUser aria-hidden="true" /><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" autoComplete="name" disabled={saving} required /></span>
            </label>
            <label className="profile-field">
              <span>Email</span>
              <span className="profile-input-wrap profile-email">
                <FiMail aria-hidden="true" />
                <input value={email} readOnly aria-label="Email address" />
              </span>
            </label>
            <label className="profile-field">
              <span>Bio</span>
              <span className="profile-input-wrap profile-input-wrap--textarea"><FiEdit3 aria-hidden="true" /><textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength={150} rows={3} placeholder="Write a short bio..." disabled={saving} aria-label="Bio" /></span>
              <small>{bio.length}/150</small>
            </label>
          </div>

          <button className="profile-submit" type="submit" disabled={saving}>
            {saving ? <FiLoader aria-hidden="true" className="profile-spin" /> : null}
            {saving ? "Creating account..." : "Create account"}
          </button>
          <p className="profile-card__footer">Your profile is protected with end-to-end encryption.</p>
        </form>
      </section>
    </main>
  );
}
