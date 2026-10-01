import Background from "../components/landing/background";
import Navbar from "../components/layout/navbar";
import Hero from "../components/landing/hero";
import RepositoryPreview from "../components/landing/repositoryPreview";
import Features from "../components/landing/features";

function Landing() {
  return (
    <main className="relative min-h-screen bg-[#05050b]">

      {/* Background */}
      <Background />

      {/* Content */}
      <section className="relative z-10">
        <Navbar />
        <Hero />
        <RepositoryPreview />
        <Features />

      </section>

    </main>
  );
}

export default Landing;