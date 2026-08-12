function Features() {
  return (
    <section className="relative z-10 px-6 py-32">

      {/* Section Header */}
      <div className="mx-auto max-w-3xl text-center">

        <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-400">
          Why GitLoop
        </p>

        <h2 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Understand your codebase
          <span className="block bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            like never before.
          </span>
        </h2>

        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
          GitLoop combines repository intelligence with AI to help
          developers understand, search, analyze and improve their
          code faster.
        </p>

      </div>


      {/* Feature Cards */}
      <div className="mx-auto mt-16 grid max-w-6xl gap-5 md:grid-cols-2">

        <FeatureCard
          icon="✦"
          label="AI Codebase Chat"
          title="Ask your codebase anything."
          description="Understand authentication flows, database logic, APIs and project structure with answers grounded in your actual repository."
        />

        <FeatureCard
          icon="⌕"
          label="Semantic Search"
          title="Find code by meaning."
          description="Search for concepts, functions and logic even when the exact words are not present in the code."
        />

        <FeatureCard
          icon="⌘"
          label="Architecture Explorer"
          title="See how everything connects."
          description="Explore the relationships between components, APIs, services, models and other important parts of your application."
        />

        <FeatureCard
          icon="⌁"
          label="AI Code Review"
          title="Catch problems before they ship."
          description="Use AI to identify possible bugs, security concerns, code smells and opportunities to improve your implementation."
        />

      </div>

    </section>
  );
}


function FeatureCard({
  icon,
  label,
  title,
  description,
}) {
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] p-7 backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-violet-400/30 hover:bg-white/[0.04]">

      {/* Glow */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl transition duration-500 group-hover:bg-violet-500/20" />

      {/* Icon */}
      <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-lg text-violet-300">
        {icon}
      </div>

      {/* Label */}
      <p className="relative mt-6 text-xs font-medium uppercase tracking-[0.18em] text-violet-400">
        {label}
      </p>

      {/* Title */}
      <h3 className="relative mt-3 text-2xl font-semibold text-white">
        {title}
      </h3>

      {/* Description */}
      <p className="relative mt-4 max-w-xl text-sm leading-7 text-slate-400">
        {description}
      </p>

      {/* Bottom line */}
      <div className="relative mt-7 h-px w-full bg-gradient-to-r from-violet-500/30 via-white/10 to-transparent" />

      <div className="relative mt-4 text-sm text-slate-500 transition group-hover:text-violet-300">
        Explore feature →
      </div>

    </article>
  );
}


export default Features;