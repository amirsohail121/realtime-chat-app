export default function Logo({ inverse = false }) {
  return (
    <div className={`brand-mark${inverse ? " brand-mark--inverse" : ""}`}>
      <span className="brand-mark__dot" aria-hidden="true" />
      <span>ChatWave</span>
    </div>
  );
}
