export default function NetworkLines() {
  return (
    <svg
      className="network-lines"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="none"
    >
      {/* Left Network */}

      <path
        d="
        M0 300
        C150 250 220 500 420 420
        S620 200 760 450
        "
      />

      <path
        d="
        M0 520
        C180 450 300 700 520 610
        S700 350 900 650
        "
      />

      {/* Right Network */}

      <path
        d="
        M1920 260
        C1720 180 1600 420 1450 340
        S1200 500 1020 260
        "
      />

      <path
        d="
        M1920 650
        C1750 720 1650 500 1480 620
        S1200 820 980 600
        "
      />
    </svg>
  );
}