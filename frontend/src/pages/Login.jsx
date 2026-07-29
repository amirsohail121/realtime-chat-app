import { useRef } from "react";
import { useLogin, OTP_LENGTH } from "../hooks/useLogin";
import chatwaveLogo from "../assets/chatwaveLogo.png";
import banner from "../assets/banner.png";
import { HiArrowRight } from "react-icons/hi";

export default function Login() {
  const {
    email,
    setEmail,
    otp,
    otpSent,
    error,
    submitting,
    maskedEmail,
    handleSubmit,
    updateOtpDigit,
    applyPastedOtp,
  } = useLogin();


  const otpBoxRefs = useRef([]);

  const handleOtpDigitChange = (e, index) => {
    const digit = e.target.value.replace(/\D/g, "").slice(-1);
    updateOtpDigit(index, digit);
    if (digit && index < OTP_LENGTH - 1) {
      otpBoxRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpBoxRefs.current[index - 1]?.focus();
      return;
    }
    const isControlKey = ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Enter"].includes(e.key);
    if (!isControlKey && !/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    applyPastedOtp(pasted);
    requestAnimationFrame(() => {
      const nextIndex = Math.min(pasted.replace(/\D/g, "").length, OTP_LENGTH - 1);
      otpBoxRefs.current[nextIndex]?.focus();
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--color-surface-tint)] p-4 sm:p-8">
      {/* SINGLE CARD — image and form live inside the same box */}
      <div className="w-full max-w-4xl bg-[var(--color-surface)] rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        {/* LEFT — illustration, shown in full with no cropping */}
        <div className="hidden lg:flex items-center justify-center bg-white p-8">
          <img
            src={banner}
            alt="Encrypted messaging illustration"
            className="w-full h-full object-contain"
          />
        </div>

        {/* RIGHT — form */}
        <div className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
          <div className="w-full max-w-sm">
            {/* logo */}
            <img
              src={chatwaveLogo}
              alt="ChatWave"
              className="h-11 sm:h-12 w-auto mb-8 mx-auto lg:mx-0"
            />

            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-heading)] tracking-tight">
              Welcome back
            </h2>
            <p className="text-[var(--color-body)] mt-2 mb-8">
              {otpSent ? (
                <>
                  Enter the code sent to{" "}
                  <span className="font-semibold text-[var(--color-secondary)]">{maskedEmail}</span>
                </>
              ) : (
                "Log in with your email to keep chatting"
              )}
            </p>

            {error && (
              <div className="bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 text-[var(--color-warning)] px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* EMAIL SCREEN */}
              {!otpSent && (
                <div>
                  <label className="block text-sm font-medium text-[var(--color-heading)] mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                    className="w-full px-4 py-3 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-heading)] placeholder:text-[var(--color-body)] border border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] transition"
                  />
                </div>
              )}

              {/* OTP SCREEN */}
              {otpSent && (
                <div>
                  <div className="flex justify-between gap-3 sm:gap-4" onPaste={handleOtpPaste}>
                    {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                      <input
                        key={index}
                        ref={(el) => (otpBoxRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        placeholder="0"
                        autoFocus={index === 0}
                        value={otp[index] || ""}
                        onChange={(e) => handleOtpDigitChange(e, index)}
                        onKeyDown={(e) => handleOtpKeyDown(e, index)}
                        className="w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-semibold rounded-xl bg-[var(--color-primary-light)] text-[var(--color-heading)] placeholder:text-[var(--color-body)]/30 border-2 border-transparent focus:outline-none focus:border-[var(--color-secondary)] focus:ring-2 focus:ring-[var(--color-secondary)]/30 transition"
                      />
                    ))}
                  </div>

                  {submitting && (
                    <p className="text-xs text-[var(--color-body)] mt-2 flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full border-2 border-[var(--color-secondary)]/30 border-t-[var(--color-secondary)] animate-spin" />
                      Verifying...
                    </p>
                  )}
                </div>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={submitting}
                className="group w-full flex items-center justify-center gap-2 bg-[var(--color-secondary)] hover:brightness-110 active:brightness-95 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 text-white font-semibold py-3 rounded-lg transition-all duration-150 cursor-pointer disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    {otpSent ? "Verifying..." : "Sending..."}
                  </>
                ) : (
                  <>
                    {otpSent ? "Verify OTP" : "Send OTP"}
                    <HiArrowRight
                      size={18}
                      className="transition-transform duration-200 group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}