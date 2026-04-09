/**
 * Derby Digital Onboarding Embed Script
 *
 * Usage:
 *   <div id="onboarding"></div>
 *   <script src="https://onboarding.derbydigital.us/embed.js"></script>
 *   <script>
 *     DerbyOnboarding.init({
 *       container: '#onboarding',
 *       baseUrl: 'https://onboarding.derbydigital.us'
 *     });
 *   </script>
 */
(function () {
  "use strict";

  var DerbyOnboarding = {
    _iframe: null,

    init: function (options) {
      options = options || {};
      var container =
        typeof options.container === "string"
          ? document.querySelector(options.container)
          : options.container;

      if (!container) {
        console.error(
          "[DerbyOnboarding] Container not found:",
          options.container
        );
        return;
      }

      var baseUrl = (options.baseUrl || "").replace(/\/$/, "");
      if (!baseUrl) {
        // Infer from script src
        var scripts = document.getElementsByTagName("script");
        for (var i = 0; i < scripts.length; i++) {
          var src = scripts[i].src || "";
          if (src.indexOf("embed.js") !== -1) {
            baseUrl = src.replace(/\/embed\.js.*$/, "");
            break;
          }
        }
      }

      if (!baseUrl) {
        console.error("[DerbyOnboarding] baseUrl is required");
        return;
      }

      var iframe = document.createElement("iframe");
      iframe.src = baseUrl + "/embed";
      iframe.style.width = "100%";
      iframe.style.minWidth = "320px";
      iframe.style.border = "none";
      iframe.style.overflow = "hidden";
      iframe.style.minHeight = "600px";
      iframe.style.transition = "height 0.2s ease";
      iframe.setAttribute("title", "Derby Digital Onboarding");
      iframe.setAttribute("allowtransparency", "true");
      iframe.setAttribute(
        "allow",
        "camera; microphone; clipboard-write; encrypted-media"
      );

      container.innerHTML = "";
      container.appendChild(iframe);
      this._iframe = iframe;

      // Listen for messages from the iframe
      var onStepChange = options.onStepChange || null;
      var onComplete = options.onComplete || null;

      window.addEventListener("message", function (event) {
        var data = event.data;
        if (!data || data.type !== "derby-onboarding") return;

        if (data.event === "resize" && data.height) {
          iframe.style.height = data.height + "px";
        }

        if (data.event === "step-change" && onStepChange) {
          onStepChange({
            step: data.step,
            totalSteps: data.totalSteps,
            completionPercent: data.completionPercent,
          });
        }

        if (data.event === "complete" && onComplete) {
          onComplete();
        }
      });
    },

    getIframe: function () {
      return this._iframe;
    },
  };

  // Expose globally
  if (typeof window !== "undefined") {
    window.DerbyOnboarding = DerbyOnboarding;
  }
})();
