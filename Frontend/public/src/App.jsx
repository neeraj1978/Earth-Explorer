import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Landing from "./pages/Landing";
import SolarSystem from "./pages/SolarSystem";
import GlobeView from "./components/GlobeView";
import { Navbar, Container, Nav } from "react-bootstrap";


export default function App() {
  return (
    <Router>
    <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/solar" element={<SolarSystem />} />
        <Route path="/earth" element={<GlobeView />} />
      </Routes>
    </Router>
  );
}
