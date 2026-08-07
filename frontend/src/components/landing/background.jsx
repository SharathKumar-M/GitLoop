import "../../styles/background.css";
import NetworkLines from "./Networkbackground";

export default function background() {
    return (
        <div className="background">
            <div className="gradient"></div>
            <div className="purple-glow"></div>
            <div className="blue-glow"></div>

            <div className="grid"></div>

            <NetworkLines />

            <div className="stars"></div>
        </div>
    )
}

