import Background from "../components/landing/Background";
import Navbar from "../components/layout/Navbar";
import Hero from "../components/landing/Hero";
import RepositoryPreview from "../components/landing/RepositoryPreview";
import Features from "../components/landing/Features";

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