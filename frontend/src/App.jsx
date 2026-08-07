import Background from "./components/landing/background.jsx";
import Landing from "./pages/landing.jsx";

function App() {
  return (
    <>
      <div className="relative min-h-screen overflow-hidden">
        <Background />
      </div>
      <div className="relative z-10">
        <Landing />
      </div>
    </>
  );
}



export default App;