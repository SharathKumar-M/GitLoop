function Hero() {
  return (
    <section className="relative z-30 px-6 pt-20">

      <div className="mx-auto max-w-5xl text-center">

        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-sm text-violet-200 backdrop-blur-md">

          <span className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_12px_#a78bfa]" />

          AI Codebase Intelligence

        </div>


        {/* Heading */}
        <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-[82px]">

          Understand Your

          <span className="block bg-gradient-to-r from-violet-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
            Codebase.
          </span>

        </h1>


        {/* Description */}
        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">

          GitLoop uses AI to understand your GitHub repositories,
          helping you search, analyze, debug and navigate your
          codebase faster.

        </p>


        {/* Buttons */}
        <div className="mt-8 flex items-center justify-center gap-4">

          <button className="rounded-full bg-white px-7 py-3.5 font-medium text-slate-900 transition duration-300 hover:scale-105">
            Connect GitHub →
          </button>

          <button className="rounded-full border border-white/10 bg-white/5 px-7 py-3.5 font-medium text-white backdrop-blur-md transition duration-300 hover:bg-white/10">
            Explore GitLoop
          </button>

        </div>

      </div>

    </section>
  );
}

export default Hero;