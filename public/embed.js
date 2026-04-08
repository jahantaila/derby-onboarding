(function () {
  "use strict";

  // Derive the app origin from this script's URL
  var script = document.currentScript;
  if (!script) return;
  var origin = new URL(script.src).origin;

  // Create the iframe
  var iframe = document.createElement("iframe");
  iframe.src = origin + "/embed";
  iframe.style.cssText =
    "width:100%;border:none;overflow:hidden;min-height:400px;";
  iframe.setAttribute("title", "Derby Digital Onboarding");
  iframe.setAttribute("loading", "lazy");

  // Insert after the script tag
  script.parentNode.insertBefore(iframe, script.nextSibling);

  // Listen for postMessage events from the iframe
  window.addEventListener("message", function (e) {
    if (e.origin !== origin) return;
    if (!e.data || typeof e.data !== "object") return;

    if (e.data.type === "derby:resize" && typeof e.data.height === "number") {
      iframe.style.height = e.data.height + "px";
    }

    if (e.data.type === "derby:onboard:complete") {
      // Dispatch a custom event so the host page can react
      var event = new CustomEvent("derby:onboard:complete", {
        detail: { iframe: iframe },
      });
      document.dispatchEvent(event);
    }
  });
})();
