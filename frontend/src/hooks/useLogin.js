import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/api";

export const OTP_LENGTH = 6;

export const useLogin = ({ signup = false } = {}) => {
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // redirect already-authenticated users
  useEffect(() => {
    if (user) {
      if (user.isProfileComplete) {
        navigate("/chat", { replace: true });
      } else {
        navigate("/profile", { replace: true });
      }
    }
  }, [user]);

  // send otp
  const handleSendOtp = async () => {
    setError("");

    if (!email) {
      setError("Enter email");
      return;
    }

    setSubmitting(true);
    try {
      const existingUser = await api.get("/auth/check-email", {
        params: { email: email.trim() },
      });
      if (signup && existingUser.data.exists) {
          setError("This email is already registered. Sign in instead.");
          return;
      }
      if (!signup && !existingUser.data.exists) {
        setError("This email is not registered. Create an account instead.");
        return;
      }
      await api.post("/auth/send-otp", { email });
      setOtpSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setSubmitting(false);
    }
  };

  // verify otp
  const handleVerifyOtp = async () => {
    setError("");

    if (!otp) {
      setError("Enter OTP");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/auth/verify-otp", { email, otp });
      login(res.data);
      navigate(res.data.isProfileComplete ? "/chat" : "/profile");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setSubmitting(false);
    }
  };

  // single entry point for the form's submit — picks send vs verify based on step
  const handleSubmit = (e) => {
    e?.preventDefault();
    if (submitting) return;
    otpSent ? handleVerifyOtp() : handleSendOtp();
  };

  const resetOtp = () => {
    setOtp("");
    setOtpSent(false);
    setError("");
  };

  // update one digit of the OTP by box index (used by the segmented input)
  const updateOtpDigit = (index, digit) => {
    const chars = otp.padEnd(OTP_LENGTH, " ").split("");
    chars[index] = digit || " ";
    setOtp(chars.join("").trimEnd());
  };

  // fill the whole OTP at once (used when the code is pasted in)
  const applyPastedOtp = (pasted) => {
    setOtp(pasted.replace(/\D/g, "").slice(0, OTP_LENGTH));
  };

  // auto-verify once all boxes are filled
  useEffect(() => {
    if (otpSent && otp.length === OTP_LENGTH && !submitting) {
      handleVerifyOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, otpSent]);

  // shows just enough of the email to confirm it's theirs — e.g. "ro***@gmail.com"
  const maskEmail = (value) => {
    const [local, domain] = value.split("@");
    if (!domain) return value;
    const visible = local.slice(0, Math.min(2, local.length));
    return `${visible}${"*".repeat(Math.max(local.length - visible.length, 3))}@${domain}`;
  };

  return {
    email,
    setEmail,
    otp,
    resetOtp,
    otpSent,
    error,
    submitting,
    maskedEmail: maskEmail(email),
    handleSubmit,
    updateOtpDigit,
    applyPastedOtp,
  };
};
