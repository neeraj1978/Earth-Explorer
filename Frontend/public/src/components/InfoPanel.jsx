// src/components/InfoPanel.jsx
import React, { useState, useEffect } from "react";
import { Card, ListGroup, Badge, Image, Button } from "react-bootstrap";

/** emoji helper (same as before) */
function weatherEmoji(desc = "") {
  if (!desc) return "🌤️";
  const d = desc.toLowerCase();
  if (d.includes("rain") || d.includes("showers")) return "🌧️";
  if (d.includes("thunder")) return "⛈️";
  if (d.includes("snow") || d.includes("sleet") || d.includes("blizzard")) return "❄️";
  if (d.includes("cloud")) return "☁️";
  if (d.includes("fog") || d.includes("mist") || d.includes("haze")) return "🌫️";
  if (d.includes("clear") || d.includes("sunny")) return "☀️";
  if (d.includes("wind") || d.includes("breezy")) return "🌬️";
  if (d.includes("hot")) return "🔥";
  if (d.includes("cold")) return "🧊";
  return "🌤️";
}

export default function InfoPanel({ info, onClose }) {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  // if info becomes falsy, hide
  useEffect(() => {
    if (!info) setVisible(false);
    else setVisible(true);
  }, [info]);

  const handleClose = () => {
    // start exit animation then actually hide
    setExiting(true);
    // call parent handler immediately so parent can update state if it wants
    try {
      if (typeof onClose === "function") onClose();
    } catch (e) {
      // ignore handler errors
      // (we still proceed to hide locally)
    }
    // after animation, hide component
    setTimeout(() => {
      setVisible(false);
      setExiting(false);
    }, 220); // match CSS transition duration below
  };

  if (!visible) return null;
  if (!info) return null;

  const level = info.level || "city";
  const details = info.details || {};
  const pop = (info.pop && (info.pop.population || info.pop?.value)) || details?.population || null;

  const timeDisplay =
    info?.time?.formatted ||
    info?.time?.zoneName ||
    (info?.time && info?.time.status ? JSON.stringify(info.time) : "N/A");

  const title =
    level === "state"
      ? details?.state || info.state || info.city || "Region"
      : level === "country"
      ? details?.name || info.country || "Country"
      : info.city || info.state || info.country || "Location";

  const subtitle = info?.geo?.formatted || (details?.capital ? `Capital: ${details.capital}` : "");

  const wikiText =
    details?.wiki_extract ||
    (info?.wiki?.extract ? (info.wiki.extract.length > 800 ? info.wiki.extract.slice(0, 800) + "..." : info.wiki.extract) : null);

  const weatherDesc =
    info?.weather?.weather?.[0]?.description ||
    info?.weather?.weather?.[0] ||
    (info?.weather && info.weather.description) ||
    null;
  const temp =
    info?.weather && info?.weather.main && (info.weather.main.temp !== undefined)
      ? `${Math.round(info.weather.main.temp)}°C`
      : null;

  const cardStyle = {
    position: "absolute",
    bottom: 20,
    left: 20,
    width: 420,
    maxWidth: "calc(100vw - 40px)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
    color: "#e9f6ff",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 14,
    boxShadow: "0 8px 30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.02)",
    zIndex: 9999,
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    overflow: "hidden",
    // animation
    transition: "transform 180ms ease, opacity 180ms ease",
    transform: exiting ? "translateY(8px) scale(0.995)" : "translateY(0)",
    opacity: exiting ? 0 : 1,
    pointerEvents: exiting ? "none" : "auto",
  };

  const titleStyle = {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 6,
    lineHeight: 1.05,
  };

  const subtitleStyle = {
    color: "#cfe8ff",
    fontSize: 13,
    marginBottom: 12,
  };

  const listItemStyle = {
    background: "transparent",
    border: 0,
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 6,
    paddingBottom: 6,
    color: "rgba(230,245,255,0.95)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };

  const labelStyle = { fontWeight: 600, color: "rgba(230,245,255,0.9)" };
  const valueStyle = { marginLeft: 8, color: "rgba(230,245,255,0.95)" };

  const closeBtnStyle = {
    position: "absolute",
    top: 8,
    right: 8,
    width: 34,
    height: 34,
    padding: 0,
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.02)",
    color: "#e9f6ff",
    boxShadow: "0 2px 10px rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  };

  return (
    <Card style={cardStyle}>
      {/* close button */}
<button
  onClick={handleClose}
  aria-label="Close info panel"
  title="Close"
  style={{
    position: "absolute",
    top: 8,
    right: 8,
    width: 34,
    height: 34,
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.02)",
    color: "#e9f6ff",
    boxShadow: "0 2px 10px rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: 18,
    fontWeight: 600,
    textDecoration: "none", // removes underline
  }}
>
❌
</button>


      <Card.Body style={{ padding: "18px 18px" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          {details?.flag_url ? (
            <Image
              src={details.flag_url}
              alt="flag"
              style={{
                width: 56,
                height: 36,
                objectFit: "cover",
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.06)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.45)",
              }}
            />
          ) : (
            <div
              style={{
                width: 56,
                height: 36,
                borderRadius: 6,
                background: "linear-gradient(90deg,#153a5b,#1e90ff)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#eaf6ff",
                fontWeight: 700,
                boxShadow: "0 2px 8px rgba(0,0,0,0.45)",
              }}
            >
              {title?.slice?.(0, 2)?.toUpperCase() || "🌍"}
            </div>
          )}

          <div style={{ flex: 1 }}>
            <div style={titleStyle}>{title}</div>
            {subtitle ? <div style={subtitleStyle}>{subtitle}</div> : <div style={{ height: 12 }} />}

            <ListGroup variant="flush" className="text-white" style={{ background: "transparent", marginTop: 4 }}>
              <ListGroup.Item style={listItemStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>📍</span>
                  <div>
                    <div style={labelStyle}>Location</div>
                    <div style={{ ...valueStyle, fontSize: 13 }}>
                      {info?.geo?.formatted || (info?.country || "Unknown")}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: "rgba(230,245,255,0.7)" }}>Population</div>
                  <div style={{ fontWeight: 700, marginTop: 2 }}>
                    {pop ? Number(pop).toLocaleString() : "N/A"}
                  </div>
                </div>
              </ListGroup.Item>

              <ListGroup.Item style={listItemStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{weatherEmoji(weatherDesc)}</span>
                  <div>
                    <div style={labelStyle}>Weather</div>
                    <div style={{ ...valueStyle, fontSize: 13 }}>{weatherDesc ? weatherDesc : "N/A"}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <Badge
                    bg="info"
                    style={{
                      background: "linear-gradient(90deg,#4fd1c5,#3fb6ff)",
                      color: "#022338",
                      fontWeight: 700,
                      padding: "6px 10px",
                      borderRadius: 12,
                      boxShadow: "0 4px 14px rgba(63,182,255,0.18)",
                    }}
                  >
                    {temp || ""}
                  </Badge>
                </div>
              </ListGroup.Item>

              <ListGroup.Item style={listItemStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>⏰</span>
                  <div>
                    <div style={labelStyle}>Local Time</div>
                    <div style={{ ...valueStyle, fontSize: 13 }}>{timeDisplay}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right", fontSize: 12, color: "rgba(230,245,255,0.75)" }}>
                  {info?.time?.zoneName || ""}
                </div>
              </ListGroup.Item>
            </ListGroup>
          </div>
        </div>

        <Card.Text
          className="mt-3"
          style={{
            fontSize: 13,
            opacity: 0.95,
            maxHeight: 170,
            overflow: "auto",
            paddingRight: 6,
            marginBottom: 2,
          }}
        >
          {wikiText || "No summary available."}
        </Card.Text>

        <div style={{ marginTop: 8, fontSize: 12, color: "rgba(230,245,255,0.65)" }}>
          Lat: {Number(info.lat).toFixed(3)}, Lng: {Number(info.lng).toFixed(3)}{" "}
          {info.altitude ? `• zoom: ${Number(info.altitude).toFixed(2)}` : ""}
        </div>
      </Card.Body>
    </Card>
  );
}
