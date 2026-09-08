export default function AppBackground({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      {/* Main atmospheric glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-purple-600/10 blur-[130px]" />
        <div className="absolute top-1/4 -right-40 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[140px]" />
        <div className="absolute bottom-[-200px] left-1/3 h-[500px] w-[500px] rounded-full bg-fuchsia-600/[0.06] blur-[150px]" />

        {/* Technical grid */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)
            `,
            backgroundSize: "70px 70px",
          }}
        />

        {/* Neural / AI network */}
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.18]"
          viewBox="0 0 1440 900"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="networkGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
              <stop offset="30%" stopColor="#8b5cf6" stopOpacity="0.7" />
              <stop offset="70%" stopColor="#3b82f6" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>

          <path
            d="M-100 650 C180 400, 350 820, 620 560 S1050 230, 1520 470"
            fill="none"
            stroke="url(#networkGradient)"
            strokeWidth="1.2"
          />

          <path
            d="M-150 300 C120 520, 340 120, 580 340 S1080 720, 1520 250"
            fill="none"
            stroke="url(#networkGradient)"
            strokeWidth="1"
          />

          <path
            d="M180 900 C380 610, 580 720, 810 440 S1160 180, 1440 100"
            fill="none"
            stroke="url(#networkGradient)"
            strokeWidth="0.8"
          />

          {/* Network nodes */}
          <circle cx="170" cy="520" r="2.5" fill="#8b5cf6" />
          <circle cx="360" cy="470" r="2" fill="#6366f1" />
          <circle cx="590" cy="565" r="2.5" fill="#3b82f6" />
          <circle cx="790" cy="395" r="2" fill="#8b5cf6" />
          <circle cx="1010" cy="300" r="2.5" fill="#6366f1" />
          <circle cx="1210" cy="460" r="2" fill="#3b82f6" />
          <circle cx="1370" cy="350" r="2.5" fill="#8b5cf6" />

          <circle cx="290" cy="330" r="1.8" fill="#3b82f6" />
          <circle cx="530" cy="330" r="2" fill="#8b5cf6" />
          <circle cx="860" cy="650" r="2.2" fill="#6366f1" />
          <circle cx="1110" cy="560" r="2" fill="#3b82f6" />
        </svg>

        {/* Soft vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(5,8,22,0.72)_100%)]" />
      </div>

      {/* Application content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}