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

function ToolPage({ children }) {
  return (
    <div className="tm-wrap">
      <div className="tm-tool-nav">
        <a className="tm-back-link" href="/thinkmap" aria-label="Back to all ThinkMap tools">
          <span aria-hidden="true">←</span> Back to ThinkMap
        </a>
      </div>
      {children}
    </div>
  );
}

function ThinkMapApp() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Sync internal state with browser history and the main CatalystBox shell.
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    const handleShellNavigation = (event) => {
      setCurrentPath(event.detail?.path || window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("thinkmap:navigate", handleShellNavigation);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("thinkmap:navigate", handleShellNavigation);
    };
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
    return <ToolPage><EducationRoi /></ToolPage>;
  } else if (path === "thinkmap/margin") {
    return <ToolPage><Margin /></ToolPage>;
  } else if (path === "thinkmap/podium-india") {
    return <ToolPage><PodiumIndia /></ToolPage>;
  } else if (path === "thinkmap/podium-global") {
    return <ToolPage><PodiumGlobal /></ToolPage>;
  } else if (path === "thinkmap/exam-compass-india") {
    return <ToolPage><ExamCompassIndia /></ToolPage>;
  } else if (path === "thinkmap/exam-compass-world") {
    return <ToolPage><ExamCompassWorld /></ToolPage>;
  } else if (path === "thinkmap/mind-mirror") {
    return <ToolPage><MindMirror /></ToolPage>;
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
