import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();
  const [currentThought, setCurrentThought] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [visibleCards, setVisibleCards] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const thoughts = [
    "Explore 4.5 billion years of Earth's history 🌍",
    "Discover 8 billion people across 195 countries 🌏",
    "Experience real-time weather from anywhere 🌤️",
    "Journey through time and space with Earth 🚀",
    "Uncover the mysteries of our blue planet 🌊",
  ];

  const earthFacts = [
    {
      title: "Earth's History",
      description:
        "Formed 4.54 billion years ago, Earth is the only planet known to harbor life. From molten rock to lush forests, witness the incredible transformation.",
      stats: "4.54 Billion Years",
      image:
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=900&h=600&fit=crop",
    },
    {
      title: "Global Population",
      description:
        "Home to over 8 billion people across 195 countries, speaking more than 7,000 languages. Every person has a unique story to tell.",
      stats: "8+ Billion People",
      image:
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&h=600&fit=crop",
    },
    {
      title: "Water World",
      description:
        "71% of Earth's surface is covered by water. Our oceans contain 97% of all water on Earth and are home to millions of species.",
      stats: "71% Water Coverage",
      image:
        "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=900&h=600&fit=crop",
    },
    {
      title: "Climate Zones",
      description:
        "From frozen tundras to scorching deserts, Earth has diverse climate zones. Experience weather patterns from anywhere, anytime.",
      stats: "5 Major Zones",
      image:
        "https://images.unsplash.com/photo-1592210454359-9043f067919b?w=900&h=600&fit=crop",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentThought((p) => (p + 1) % thoughts.length);
    }, 4000);

    const handleScroll = () => {
      setScrollY(window.scrollY);
      const cardsSection = document.getElementById("explore");
      if (cardsSection) {
        // Trigger when section enters viewport
        const sectionTop = cardsSection.getBoundingClientRect().top + window.scrollY;
        const triggerPoint = sectionTop - window.innerHeight + 200;
        if (window.scrollY > triggerPoint) {
          // show all cards (0..earthFacts.length-1)
          setVisibleCards(earthFacts.map((_, i) => i));
        } else {
          setVisibleCards([]);
        }
      }
    };

    // initial check in case already scrolled
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => {
      clearInterval(interval);
      window.removeEventListener("scroll", handleScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // earthFacts stable constant so OK

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const toggleSound = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.volume = 0.3;
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <>
      {/* 🎵 Background Music */}
      <audio ref={audioRef} loop>
        <source src="/audio/bgsound.mp3" type="audio/mp3" />
      </audio>

      {/* 🌐 Navbar */}
      <nav
        className="navbar navbar-expand-lg navbar-dark fixed-top"
        style={{
          background: scrollY > 50 ? "rgba(0,0,0,0.9)" : "transparent",
          backdropFilter: "blur(10px)",
          transition: "all 0.3s ease",
          borderBottom: scrollY > 50 ? "1px solid rgba(255,255,255,0.1)" : "none",
          padding: "12px 0",
        }}
      >
        <div className="container">
          <a
            className="navbar-brand d-flex align-items-center"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            style={{ fontSize: "20px", fontWeight: "700" }}
          >
            <span
              style={{
                width: "40px",
                height: "40px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "12px",
                fontSize: "20px",
              }}
            >
              🌍
            </span>
            Earth Explorer
          </a>

          <div className="d-flex align-items-center">
            <button
              className="btn btn-link text-white me-3"
              onClick={() => scrollToSection("about")}
              style={{ fontWeight: "600", textDecoration: "none" }}
            >
              About
            </button>
            <button
              className="btn btn-link text-white me-3"
              onClick={toggleSound}
              style={{ fontWeight: "600", textDecoration: "none" }}
            >
              {isPlaying ? "🔊 Sound On" : "🔈 Sound Off"}
            </button>
            <button
              className="btn btn-sm btn-3d"
              onClick={() => scrollToSection("explore")}
              style={{
                background: "linear-gradient(145deg, #667eea 0%, #764ba2 100%)",
                border: "none",
                color: "white",
                padding: "8px 18px",
                borderRadius: "20px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Start Now
            </button>
          </div>
        </div>
      </nav>

      {/* 🌌 Hero Section */}
      <section
        style={{
          position: "relative",
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            minWidth: "100%",
            minHeight: "100%",
            transform: "translate(-50%, -50%)",
            objectFit: "cover",
            zIndex: 1,
          }}
        >
          <source src="/videos/earth.mp4" type="video/mp4" />
        </video>

        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "linear-gradient(135deg, rgba(0,0,0,0.7), rgba(0,0,0,0.6))",
            zIndex: 2,
          }}
        />

        <div
          className="container"
          style={{
            position: "relative",
            zIndex: 3,
            textAlign: "center",
            color: "white",
          }}
        >
          <h1 className="purple-heading">Earth Explorer</h1>

          <p
            style={{
              fontSize: "clamp(8px, 3vw, 18px)",
              color: "rgba(255,255,255,0.9)",
              fontWeight: "300",
              marginTop: "25px",
            }}
          >
            {thoughts[currentThought]}
          </p>

          <button
            onClick={() => navigate("/solar")}
            className="btn-3d"
            style={{
              background: "linear-gradient(145deg, #667eea 0%, #764ba2 100%)",
              border: "none",
              color: "white",
              padding: "18px 40px",
              fontSize: "20px",
              fontWeight: "600",
              borderRadius: "50px",
              cursor: "pointer",
              marginTop: "40px",
            }}
          >
            Let's  begin Exploring!! 
          </button>
        </div>
      </section>

      {/* 🌍 Cards Section */}
      <section
        id="explore"
        style={{
          background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
          padding: "100px 0",
          minHeight: "100vh",
        }}
      >
        <div className="container">
          <h2
            style={{
              textAlign: "center",
              color: "white",
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: "700",
              marginBottom: "20px",
            }}
          >
            Discover Our Planet
          </h2>
          <p
            style={{
              textAlign: "center",
              color: "rgba(255,255,255,0.7)",
              fontSize: "18px",
              marginBottom: "60px",
              maxWidth: "600px",
              margin: "0 auto 60px",
            }}
          >
            Explore fascinating facts and real-time data about Earth
          </p>

          {/* cards-container wrapper */}
          <div className="cards-container row g-4">
            {earthFacts.map((fact, index) => {
              const isVisible = visibleCards.includes(index);
              return (
                <div key={index} className="col-lg-6 col-md-6 card-wrapper">
                  {/* Add visible/hidden class here; do NOT set transform/opacity inline */}
                  <div
                    className={`earth-card ${isVisible ? "visible" : "hidden"}`}
                    style={{
                      background: "rgba(15,23,42,0.8)",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "20px",
                      overflow: "hidden",
                      height: "100%",
                      cursor: "pointer",
                    }}
                  >
                    <img
                      src={fact.image}
                      alt={fact.title}
                      style={{
                        width: "100%",
                        height: "250px",
                        objectFit: "cover",
                      }}
                    />
                    <div style={{ padding: "30px" }}>
                      <h3
                        style={{
                          color: "white",
                          fontSize: "28px",
                          fontWeight: "600",
                        }}
                      >
                        {fact.title}
                      </h3>
                      <p
                        style={{
                          color: "rgba(255,255,255,0.7)",
                          fontSize: "16px",
                          lineHeight: "1.6",
                        }}
                      >
                        {fact.description}
                      </p>
                      <div
                        style={{
                          display: "inline-block",
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          padding: "12px 24px",
                          borderRadius: "25px",
                          fontSize: "15px",
                          fontWeight: "600",
                          color: "white",
                        }}
                      >
                        {fact.stats}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 🪐 Footer */}
      <footer
        id="about"
        style={{
          background: "#0a0f1a",
          color: "white",
          padding: "80px 0 40px",
        }}
      >
        <div className="container text-center">
          <h3 style={{ fontWeight: "700", marginBottom: "15px" }}>About Earth Explorer</h3>
          <p
            style={{
              color: "rgba(255,255,255,0.7)",
              maxWidth: "700px",
              margin: "0 auto 40px",
              fontSize: "16px",
              lineHeight: "1.6",
            }}
          >
            Earth Explorer is an interactive 3D experience that lets you travel across space and time — explore countries, weather, population, and Earth's history in one immersive journey.
          </p>
          <h6 style={{ color: "rgba(255,255,255,0.6)" }}>© 2025 Earth Explorer 🌍 | Built with 💙 for planet Earth</h6>
        </div>
      </footer>

      {/* ✨ Styles */}
      <style>{`
        /* ---- Card entrance + hover behaviors ---- */
        .cards-container {
          /* no transform here; children handle their own transforms */
        }

        .earth-card {
          transform-origin: center center;
          will-change: transform, opacity;
          /* initial compact state handled by .hidden class */
        }

        /* Entrance: hidden -> visible */
        .earth-card.hidden {
          transform: translateY(60px) scale(0.95);
          opacity: 0;
          transition: transform 520ms cubic-bezier(.2,.9,.2,1), opacity 420ms ease;
        }

        .earth-card.visible {
          transform: translateY(0) scale(1);
          opacity: 1;
          transition: transform 520ms cubic-bezier(.2,.9,.2,1), opacity 420ms ease;
        }

        /* When hovering the container, shrink all NON-hovered cards */
        .cards-container:hover .earth-card:not(:hover) {
          transform: translateY(0) scale(0.93);
          opacity: 0.85;
          filter: brightness(0.95);
          transition: transform 320ms cubic-bezier(.2,.9,.2,1), opacity 320ms ease;
        }

        /* Hovered card grows and pops */
        .cards-container .earth-card:hover {
          transform: translateY(-8px) scale(1.08);
          opacity: 1;
          z-index: 5;
          box-shadow: 0 20px 40px rgba(2,6,23,0.6);
          border: 1px solid rgba(118,75,162,0.18);
          transition: transform 320ms cubic-bezier(.2,.9,.2,1), box-shadow 320ms ease;
        }

        /* Small accessibility focus */
        .cards-container .earth-card:focus {
          outline: none;
          transform: translateY(-6px) scale(1.06);
          box-shadow: 0 18px 36px rgba(2,6,23,0.55);
        }

        .purple-heading {
          font-size: clamp(150px, 8vw, 290px);
          font-weight: 800;
          color: transparent;
          background: linear-gradient(90deg, rgba(255,255,255,0.3), rgba(255,255,255,0.3));
          -webkit-background-clip: text;
          background-clip: text;
          transition: all 0.4s ease;
          display: inline-block;
          letter-spacing: -1px;
          text-shadow: 0 0 30px rgba(0,0,0,0.4);
        }

        .purple-heading:hover {
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          transform: translateY(-5px);
          text-shadow: 0 0 25px rgba(118, 75, 162, 0.7),
                       0 0 40px rgba(102, 126, 234, 0.5);
          animation: floatText 2.5s ease-in-out infinite;
        }

        @keyframes floatText {
          0% { transform: translateY(-5px); }
          50% { transform: translateY(-12px); }
          100% { transform: translateY(-5px); }
        }

        html { scroll-behavior: smooth; }
        body { overflow-x: hidden; }
      `}</style>
    </>
  );
}
