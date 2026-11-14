import { useRef } from "react";
import { LuArrowRight, LuLock } from "react-icons/lu";
import { OTP_LENGTH, useLogin } from "../hooks/useLogin";
import { useNavigate } from "react-router-dom";
import "../styles/pages/login.css";
import "../styles/pages/signup.css";

function Logo({ inverse = false }) {
  return <div className={`profile-logo${inverse ? "" : " profile-logo--dark"}`}>ChatWave</div>;
}

function Tag({ children, variant = "" }) {
  return <span className={`tag ${variant ? `tag--${variant}` : ""}`}>{children}</span>;
}

function SampleMessage({ name, time, children, mine = false }) {
  return (
    <div className={`profile-message${mine ? " profile-message--mine" : ""}`}>
      <div className="profile-message__meta">
        <strong>{name}</strong>
        <span>{time}</span>
      </div>
      <p>{children}</p>
    </div>
  );
}

export function AuthAside() {
  return (
    <aside className="login-aside profile-aside">
      <div className="profile-rings" aria-hidden="true" />
      <div className="profile-aside__content">
        <Logo inverse />
        <div className="profile-aside__intro login-aside__intro">
          <p className="eyebrow">A quieter way to connect</p>
          <h1>Conversations, kept in order.</h1>
          <p className="login-aside__copy">
            A considered place for the people and ideas you want to keep close.
          </p>
        </div>
        <div className="profile-thread" aria-label="Sample conversation">
          <SampleMessage name="Maya Chen" time="10:42">
            The notes are ready whenever you are.
          </SampleMessage>
          <SampleMessage name="You" time="10:43" mine>
            Perfect. I&apos;ll look through them this afternoon.
          </SampleMessage>
        </div>
        <div className="profile-aside__tags">
          <span className="profile-tag"><LuLock aria-hidden="true" /> End-to-end encrypted</span>
          <span className="profile-tag">◎ Passwordless sign-in</span>
        </div>
      </div>
    </aside>
  );
}

function EmailForm({ email, setEmail, onSubmit, submitting }) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="email">Email address</label>
        <input
          id="email"
          className="input"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoFocus
        />
      </div>
      <button className="btn btn--primary btn--full" type="submit" disabled={submitting}>
        {submitting ? "Sending code..." : "Continue"}
        <LuArrowRight aria-hidden="true" />
      </button>
    </form>
  );
}

function CodeForm({ otp, updateOtpDigit, onSubmit, onBack, submitting }) {
  const inputRefs = useRef([]);
  const digits = otp.padEnd(OTP_LENGTH, " ").split("");

  const updateDigit = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    updateOtpDigit(index, digit);
    if (digit && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (event, index) => {
    if (event.key !== "Backspace") return;

    event.preventDefault();
    if (digits[index].trim()) {
      updateOtpDigit(index, "");
      return;
    }

    if (index > 0) {
      updateOtpDigit(index - 1, "");
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <button className="back-link" type="button" onClick={onBack}>← Use a different email</button>
      <div className="otp-group" aria-label="One-time passcode">
        <div className="otp-label-row">
          <label htmlFor="otp-0">6-digit code</label>
          <span>Sent to your inbox</span>
        </div>
        <div className="otp-boxes">
          {Array.from({ length: OTP_LENGTH }, (_, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              ref={(element) => { inputRefs.current[index] = element; }}
              className={`otp-box${index === 0 && !otp ? " otp-box--active" : ""}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digits[index].trim()}
              onChange={(event) => updateDigit(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              autoFocus={index === 0}
              aria-label={`Digit ${index + 1}`}
            />
          ))}
        </div>
      </div>
      <button className="btn btn--primary btn--full" type="submit" disabled={submitting}>
        {submitting ? "Verifying..." : "Verify and log in"}
        <LuArrowRight aria-hidden="true" />
      </button>
    </form>
  );
}

export default function Login({ mode = "login" }) {
  const navigate = useNavigate();
  const {
    email,
    setEmail,
    otp,
    otpSent,
    error,
    submitting,
    handleSubmit,
    updateOtpDigit,
    resetOtp,
  } = useLogin({ signup: mode === "signup" });

  return (
    <main className="login-page flex min-h-0 flex-col min-[701px]:grid min-[701px]:grid-cols-2">
      <AuthAside />
      <section className="login-main flex min-w-0 flex-1 flex-col items-center justify-center px-4 py-6 sm:px-6 md:px-8 lg:px-10" aria-label="Sign in">
        <div className="mobile-login-header">
          <Logo />
          <Tag variant="lock"><LuLock aria-hidden="true" /> Secure sign-in</Tag>
        </div>
        <div className="auth-card">
          <div className="auth-card__topline">
            <Logo />
            <Tag variant="lock"><LuLock aria-hidden="true" /> Secure sign-in</Tag>
          </div>
          <h2>{otpSent ? "Check your email" : mode === "signup" ? "Create your account" : "Welcome back"}</h2>
          <p className="auth-card__intro">
            {!otpSent
              ? mode === "signup"
                ? "Start with your email and set up your profile."
                : "Log in with your email to keep chatting."
              : <>We sent a code to <strong>{email || "your inbox"}</strong>.</>}
          </p>
          {error && <p className="auth-error" role="alert">{error}</p>}
          {!otpSent ? (
            <EmailForm email={email} setEmail={setEmail} onSubmit={handleSubmit} submitting={submitting} />
          ) : (
            <CodeForm
              otp={otp}
              updateOtpDigit={updateOtpDigit}
              onSubmit={handleSubmit}
              onBack={resetOtp}
              submitting={submitting}
            />
          )}
          {!otpSent && (
            <p className="auth-card__footer">
              {mode === "signup"
                ? <>Already have an account? <button type="button" onClick={() => navigate("/login")}>Sign in</button></>
                : <>New to ChatWave? <button type="button" onClick={() => navigate("/")}>Create an account</button></>}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
