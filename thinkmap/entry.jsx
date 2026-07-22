import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import ThinkMap from "./thinkmap-landing.jsx";
import EducationRoi from "./education-roi-v4.jsx";
import Margin from "./margin-calculator-v2.jsx";
import PodiumIndia from "./podium-india-v2.jsx";
import PodiumGlobal from "./podium-global-v2.jsx";
import ExamCompassIndia from "./exam-compass-india.jsx";
import ExamCompassWorld from "./exam-compass-world.jsx";
import MindMirror from "./mind-mirror.jsx";

function ThinkMapApp() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Sync internal state with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Intercept local links inside the ThinkMap app to perform client-side SPA routing
  useEffect(() => {
    const handleLinkClick = (e) => {
      const target = e.target.closest("a");
      if (target && target.href) {
        const url = new URL(target.href);
        if (url.origin === window.location.origin && url.pathname.startsWith("/thinkmap")) {
          // If it is a guide page, let it perform a normal page load
          if (url.pathname.includes("/guides/")) {
            return;
          }
          e.preventDefault();
          window.history.pushState({ page: "thinkmap" }, "", url.pathname);
          setCurrentPath(url.pathname);
          window.scrollTo({ top: 0, behavior: "instant" });
        }
      }
    };

    const container = document.getElementById("thinkmap-root");
    if (container) {
      container.addEventListener("click", handleLinkClick);
    }
    return () => {
      if (container) {
        container.removeEventListener("click", handleLinkClick);
      }
    };
  }, []);

  // Clean the path for comparison
  const path = currentPath.replace(/^\/+|\/+$/g, "");

  // Client-side router logic
  if (path === "thinkmap/education-roi") {
    return <div className="tm-wrap"><EducationRoi /></div>;
  } else if (path === "thinkmap/margin") {
    return <div className="tm-wrap"><Margin /></div>;
  } else if (path === "thinkmap/podium-india") {
    return <div className="tm-wrap"><PodiumIndia /></div>;
  } else if (path === "thinkmap/podium-global") {
    return <div className="tm-wrap"><PodiumGlobal /></div>;
  } else if (path === "thinkmap/exam-compass-india") {
    return <div className="tm-wrap"><ExamCompassIndia /></div>;
  } else if (path === "thinkmap/exam-compass-world") {
    return <div className="tm-wrap"><ExamCompassWorld /></div>;
  } else if (path === "thinkmap/mind-mirror") {
    return <div className="tm-wrap"><MindMirror /></div>;
  } else {
    return <ThinkMap />;
  }
}

// Mount React Root
const rootEl = document.getElementById("thinkmap-root");
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(<ThinkMapApp />);
}
