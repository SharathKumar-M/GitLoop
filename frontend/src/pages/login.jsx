import { useNavigate, useSearchParams} from "react-router-dom";

function Login() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const githubUsername = searchParams.get("github");

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05050b]">

      {/* Background glow */}

      <div className="absolute inset-0">

        {/* Main purple glow */}
        <div className="absolute left-1/2 top-[-250px] h-[650px] w-[650px] -translate-x-1/2 rounded-full bg-violet-700/15 blur-[180px]" />

        {/* Left glow */}
        <div className="absolute left-[-250px] top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-indigo-600/10 blur-[170px]" />

        {/* Right glow */}
        <div className="absolute right-[-250px] top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-cyan-600/10 blur-[170px]" />

      </div>


      {/* Small background grid */}

      <div
        className="
          pointer-events-none
          absolute
          inset-0
          opacity-[0.08]
          [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)]
          [background-size:80px_80px]
          [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]
        "
      />


      {/* Content */}

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">

        <div className="w-full max-w-md">

          {/* Logo */}

          <div className="mb-10 text-center">

            <div className="mx-auto flex h-12 w-20 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-lg font-bold text-violet-300 shadow-[0_0_30px_rgba(139,92,246,0.15)]">
              Git◌◌p
            </div>

            <h1 className="mt-4 text-2xl font-semibold text-white">
              GitLoop
            </h1>

          </div>

          {githubUsername && (
  <div className="mb-6 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-center">
    <p className="text-sm font-medium text-emerald-300">
      GitHub connected successfully
    </p>

    <p className="mt-1 text-xs text-emerald-400/70">
      Welcome, {githubUsername}
    </p>

    <button
      onClick={() => navigate("/dashboard")}
      className="mt-4 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-medium text-slate-950"
    >
      Continue to Dashboard
    </button>
  </div>
)}


          {/* Login Card */}

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-[0_30px_100px_rgba(0,0,0,0.55)] backdrop-blur-2xl">

            {/* Heading */}

            <div className="text-center">

              <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-400">
                Welcome back
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                Connect to GitLoop
              </h2>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-400">
                Connect your GitHub account to analyze repositories,
                understand your codebase and use GitLoop AI.
              </p>

            </div>


            {/* GitHub Button */}

            <button
            onClick={() => {
    window.location.href = "http://127.0.0.1:8000/auth/github";
  }}
              className="
                mt-8
                flex
                w-full
                items-center
                justify-center
                gap-3
                rounded-xl
                bg-white
                px-5
                py-3.5
                text-sm
                font-semibold
                text-slate-950
                transition
                duration-300
                hover:-translate-y-0.5
                hover:bg-slate-100
                hover:shadow-[0_10px_30px_rgba(255,255,255,0.08)]
              "
            >

              {/* GitHub Icon */}

              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  d="M12 2C6.477 2 2 6.477 2 12c0 4.418
                  2.865 8.167 6.839 9.49.5.092.682-.217.682-.482
                  0-.237-.009-.868-.014-1.703-2.782.604-3.369-1.34
                  -3.369-1.34-.455-1.155-1.11-1.463-1.11-1.463
                  -.908-.62.069-.607.069-.607 1.004.07 1.531 1.032
                  1.531 1.032.892 1.529 2.341 1.087 2.91.831
                  .091-.646.35-1.087.636-1.338-2.22-.253-4.555-1.11
                  -4.555-4.943 0-1.091.39-1.984 1.03-2.685-.103-.253
                  -.446-1.272.098-2.65 0 0 .84-.269 2.75 1.025A9.564
                  9.564 0 0112 6.844a9.58 9.58 0 012.504.337c1.909-1.294
                  2.748-1.025 2.748-1.025.546 1.378.202 2.397.1 2.65.64.701
                  1.028 1.594 1.028 2.685 0 3.842-2.339 4.687-4.566
                  4.935.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012
                  2.748 0 .267.18.578.688.48A10.001 10.001 0 0022 12
                  C22 6.477 17.523 2 12 2z"
                />
              </svg>

              Continue with GitHub

            </button>


            {/* Divider */}

            <div className="my-7 flex items-center gap-4">

              <div className="h-px flex-1 bg-white/10" />

              <span className="text-xs text-slate-600">
                Secure authentication
              </span>

              <div className="h-px flex-1 bg-white/10" />

            </div>


            {/* Security Points */}

            <div className="space-y-3">

              <SecurityItem>
                Repository access is controlled by GitHub permissions.
              </SecurityItem>

              <SecurityItem>
                Your credentials are never stored by GitLoop.
              </SecurityItem>

              <SecurityItem>
                Revoke GitHub access at any time.
              </SecurityItem>

            </div>

          </div>


          {/* Back */}

          <div className="mt-7 text-center">

            <button
              onClick={() => navigate("/")}
              className="text-sm text-slate-500 transition hover:text-violet-300"
            >
              ← Back to GitLoop
            </button>

          </div>


          <p className="mt-6 text-center text-xs text-slate-600">
            GitLoop • AI Codebase Intelligence Platform
          </p>

        </div>

      </div>

    </main>
  );
}


function SecurityItem({ children }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">

      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-[10px] text-emerald-400">
        ✓
      </div>

      <p className="text-xs leading-5 text-slate-400">
        {children}
      </p>

    </div>
  );
}


export default Login;