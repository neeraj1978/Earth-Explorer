import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Globe from "globe.gl";
import InfoPanel from "./InfoPanel";
import { Spinner, Alert } from "react-bootstrap";
import * as THREE from "three";

export default function GlobeView() {
  const containerRef = useRef(null);
  const globeRef = useRef(null);
  const audioRef = useRef(null);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // full viewport height (remove bottom black strip)
    el.style.width = "100vw";
    el.style.height = "100vh";
    el.style.margin = "0";
    el.style.padding = "0";
    el.style.background = "radial-gradient(circle at center, #000015, #000010)";
    el.style.overflow = "hidden";

    try {
      el.innerHTML = "";
      if (globeRef.current) globeRef.current = null;

      // 🌍 Create Globe
      const globe = Globe()(el)
        .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
        .bumpImageUrl("https://unpkg.com/three-globe/example/img/earth-topology.png")
        .showAtmosphere(true)
        .atmosphereColor("rgba(100,180,255,0.35)")
        .atmosphereAltitude(0.25)
        .onGlobeClick(handleGlobeClick);

      globe.pointOfView({ lat: 20, lng: 0, altitude: 2.5 });
      globeRef.current = globe;

      // Resize fix (perfect sphere always)
      const handleResize = () => {
        const { clientWidth, clientHeight } = el;
        globe.renderer().setSize(clientWidth, clientHeight);
        globe.camera().aspect = clientWidth / clientHeight;
        globe.camera().updateProjectionMatrix();
      };
      window.addEventListener("resize", handleResize);

      // Lighting
      const scene = globe.scene();
      const light = new THREE.DirectionalLight(0xffffff, 1.5);
      light.position.set(1, 1, 1);
      scene.add(light);
      scene.add(new THREE.AmbientLight(0x404040, 1.5));

      // Stars background
      const starGeo = new THREE.BufferGeometry();
      const starCount = 1000;
      const starPositions = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount * 3; i++)
        starPositions[i] = (Math.random() - 0.5) * 4000;
      starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
      const starMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1.2,
        opacity: 0.7,
        transparent: true,
      });
      scene.add(new THREE.Points(starGeo, starMat));

      // Manual control only
      if (globe.controls()) {
        const c = globe.controls();
        c.autoRotate = false;
        c.enableZoom = true;
        c.enableDamping = true;
        c.rotateSpeed = 0.5;
      }

      // 🎵 Background sound setup
      try {
        if (!audioRef.current) {
          const audioEl = document.createElement("audio");
          audioEl.src = "/audio/bgsound.mp3"; // make sure it exists in public/audio/
          audioEl.loop = true;
          audioEl.volume = 0.4;
          audioEl.preload = "auto";
          audioEl.style.display = "none";
          document.body.appendChild(audioEl);
          audioRef.current = audioEl;
        }

        const audio = audioRef.current;
        const p = audio.play();
        if (p && p.catch) {
          p.catch(() => {
            const tryPlay = () => {
              audio.play().catch(() => {});
              window.removeEventListener("pointerdown", tryPlay);
            };
            window.addEventListener("pointerdown", tryPlay, { once: true });
          });
        }
      } catch (e) {
        console.warn("Audio setup failed:", e);
      }

      console.log("🌍 Perfect globe initialized with background sound");
    } catch (err) {
      console.error(err);
      setInitError(err.message);
    }

    return () => {
      if (globeRef.current) globeRef.current = null;
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          if (audioRef.current.parentNode)
            audioRef.current.parentNode.removeChild(audioRef.current);
        } catch {}
      }
      window.removeEventListener("resize", () => {});
    };
  }, []);

  // ✅ Clean click handler (no green pop-up, only info fetch)
  async function handleGlobeClick(latLng) {
    const lat = latLng.lat;
    const lng = latLng.lng;
    const globe = globeRef.current;

    // determine zoom level
    let altitude = 2.5;
    try {
      const pov = globe.pointOfView();
      altitude = pov.altitude || 2.5;
    } catch {}

    const ZOOM_STATE_THRESHOLD = 1.8;
    const wantsState = altitude <= ZOOM_STATE_THRESHOLD;
    await fetchZoomAwareInfo(lat, lng, wantsState);
  }

  // Info Fetcher
  async function fetchZoomAwareInfo(lat, lng, wantsState) {
    setLoading(true);
    setInfo(null);

    try {
      const geoResp = await axios.get(
        `http://localhost:4000/api/geocode/reverse?lat=${lat}&lng=${lng}`
      );
      const geo = geoResp.data || {};
      const c = geo.components || {};
      const country = c.country || c.country_name || null;
      const state = c.state || c.region || null;
      const city = c.city || c.town || null;

      let details = null;
      let level = "country";

      if (wantsState && state && country) {
        try {
          const res = await axios.get(
            `http://localhost:4000/api/state/info?country=${encodeURIComponent(
              country
            )}&state=${encodeURIComponent(state)}`
          );
          details = res.data;
          level = "state";
        } catch {}
      } else if (country) {
        try {
          const res = await axios.get(
            `http://localhost:4000/api/country/info?country=${encodeURIComponent(
              country
            )}`
          );
          details = res.data;
          level = "country";
        } catch {}
      }

      const wikiTitle = city || state || country || "Earth";
      const popQuery = city || state || country || "";

      const [weatherRes, timeRes, wikiRes, popRes] = await Promise.allSettled([
        axios.get(`http://localhost:4000/api/weather/current?lat=${lat}&lng=${lng}`).catch(() => null),
        axios.get(`http://localhost:4000/api/timezone/local?lat=${lat}&lng=${lng}`).catch(() => null),
        axios.get(`http://localhost:4000/api/wiki/summary?title=${encodeURIComponent(wikiTitle)}`).catch(() => null),
        axios.get(`http://localhost:4000/api/population?city=${encodeURIComponent(popQuery)}`).catch(() => null),
      ]);

      const weather = weatherRes.status === "fulfilled" ? weatherRes.value?.data : null;
      const time = timeRes.status === "fulfilled" ? timeRes.value?.data : null;
      const wiki = wikiRes.status === "fulfilled" ? wikiRes.value?.data : null;
      const pop = popRes.status === "fulfilled" ? popRes.value?.data : null;

      setInfo({
        lat,
        lng,
        level,
        geo,
        country,
        state,
        city,
        altitude: wantsState ? 1.5 : 2.5,
        details,
        weather,
        time,
        wiki,
        pop,
      });
    } catch (e) {
      console.error("Fetch error:", e);
      setInitError("Failed to fetch info");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "relative", margin: "0", padding: "0" }}>
      <h1
        style={{
          position: "absolute",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          color: "#7ceeff",
          fontSize: "2rem",
          letterSpacing: 3,
          zIndex: 50,
          textShadow: "0 0 15px #00ccff",
          fontFamily: "Orbitron, sans-serif",
        }}
      >
        THE EARTH
      </h1>

      {initError && (
        <Alert variant="danger" className="m-3">
          {initError}
        </Alert>
      )}
      <div ref={containerRef} style={{ width: "100vw", height: "100vh" }} />
      {loading && (
        <div style={{ position: "absolute", top: 16, right: 16 }}>
          <Spinner animation="border" role="status" />
        </div>
      )}
      {info && <InfoPanel info={info} />}
    </div>
  );
}
