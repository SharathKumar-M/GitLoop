import { useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  return (
    <header className="relative z-40 flex justify-center px-6 pt-7">

      <nav className="flex w-full max-w-7xl items-center justify-between rounded-full border border-white/10 bg-white/5 px-8 py-4 backdrop-blur-xl">

        <h1 className="text-xl font-bold text-white">
          GitLoop
        </h1>

        <div className="hidden items-center gap-8 text-sm text-gray-300 md:flex">
          <a href="#">Features</a>
          <a href="#">Docs</a>
          <a href="#">Pricing</a>
          <a href="#">Contact</a>
        </div>

        <button 
        onClick={() => navigate("/login")}
        className="rounded-full bg-violet-600 px-6 py-2.5 text-white transition hover:bg-violet-500">
          
          Login
        </button>

      </nav>

    </header>
  );
}

export default Navbar;