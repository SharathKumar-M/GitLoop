import Background from "../components/landing/Background";
import Navbar from "../components/layout/navbar";

function Landing() {
    return (
        <main className="relative min-h-screen overflow-hidden bg-[#050816]">
            <Background />

            <div className="relative z-10">
                <Navbar />
            </div>
            

        </main>
    )
}

export default Landing;