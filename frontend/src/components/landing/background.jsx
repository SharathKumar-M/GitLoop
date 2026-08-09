import "../../styles/background.css";


function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">

      {/* Base background */}
      <div className="absolute inset-0 bg-[#05050b]" />

      {/* Main atmospheric glows */}
      <div className="absolute left-1/2 top-[-250px] h-[650px] w-[650px] -translate-x-1/2 rounded-full bg-purple-700/10 blur-[180px]" />

      <div className="absolute left-[-250px] top-[150px] h-[500px] w-[500px] rounded-full bg-violet-700/10 blur-[160px]" />

      <div className="absolute right-[-250px] top-[180px] h-[500px] w-[500px] rounded-full bg-blue-700/10 blur-[160px]" />

      {/* Stars */}
      <div className="network-stars" />

      {/* Flowing network */}
      <svg
        className="network-svg"
  viewBox="0 0 1600 900"
  preserveAspectRatio="none"
  aria-hidden="true"
>
  {/* LEFT SIDE */}

  <path
    className="network-path purple"
    d="M-80 170 C100 80 160 300 330 220 C430 170 470 80 590 160"
  />

  <path
    className="network-path blue"
    d="M-100 250 C80 160 180 380 360 300 C470 250 500 150 620 240"
  />

  <path
    className="network-path cyan"
    d="M-100 340 C100 250 180 480 370 380 C470 330 540 230 650 320"
  />

  <path
    className="network-path pink"
    d="M-80 430 C100 340 220 560 400 460 C500 410 560 330 680 410"
  />

  <path
    className="network-path gold"
    d="M-100 520 C80 430 230 650 410 550 C520 490 600 400 720 500"
  />

  <path
    className="network-path purple"
    d="M-80 620 C100 520 220 740 430 620 C550 550 620 470 760 570"
  />

  {/* RIGHT SIDE */}

  <path
    className="network-path purple"
    d="M1680 170 C1500 80 1440 300 1270 220 C1170 170 1130 80 1010 160"
  />

  <path
    className="network-path blue"
    d="M1700 250 C1520 160 1420 380 1240 300 C1130 250 1100 150 980 240"
  />

  <path
    className="network-path cyan"
    d="M1700 340 C1500 250 1420 480 1230 380 C1130 330 1060 230 950 320"
  />

  <path
    className="network-path pink"
    d="M1680 430 C1500 340 1380 560 1200 460 C1100 410 1040 330 920 410"
  />

  <path
    className="network-path gold"
    d="M1700 520 C1520 430 1370 650 1190 550 C1080 490 1000 400 880 500"
  />

  <path
    className="network-path purple"
    d="M1680 620 C1500 520 1380 740 1170 620 C1050 550 980 470 840 570"
  />

  {/* LEFT NODES */}

  <circle className="network-node purple-node" cx="80" cy="170" r="6" />
  <circle className="network-node blue-node" cx="170" cy="300" r="7" />
  <circle className="network-node cyan-node" cx="330" cy="220" r="6" />
  <circle className="network-node pink-node" cx="400" cy="460" r="7" />
  <circle className="network-node gold-node" cx="410" cy="550" r="6" />
  <circle className="network-node blue-node" cx="500" cy="150" r="6" />
  <circle className="network-node purple-node" cx="620" cy="240" r="7" />
  <circle className="network-node cyan-node" cx="600" cy="470" r="6" />

  {/* RIGHT NODES */}

  <circle className="network-node purple-node" cx="1520" cy="170" r="6" />
  <circle className="network-node blue-node" cx="1430" cy="300" r="7" />
  <circle className="network-node cyan-node" cx="1270" cy="220" r="6" />
  <circle className="network-node pink-node" cx="1200" cy="460" r="7" />
  <circle className="network-node gold-node" cx="1190" cy="550" r="6" />
  <circle className="network-node blue-node" cx="1100" cy="150" r="6" />
  <circle className="network-node purple-node" cx="980" cy="240" r="7" />
  <circle className="network-node cyan-node" cx="1000" cy="470" r="6" />

      </svg>

      {/* Soft center vignette */}
      <div className="absolute
    inset-0
    bg-[radial-gradient(
      ellipse_at_center,
      rgba(5,5,11,0.95)_0%,
      rgba(5,5,11,0.82)_32%,
      rgba(5,5,11,0.35)_65%,
      transparent_100%
    )]" />

    </div>
  );
}

export default Background;


