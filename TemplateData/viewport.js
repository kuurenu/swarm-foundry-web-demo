(function (root) {
  "use strict";
  function setupSwarmViewport(win, doc) {
    var container = doc.querySelector("#unity-container");
    var canvas = doc.querySelector("#unity-canvas");
    var footer = doc.querySelector("#unity-footer");
    var button = doc.querySelector("#unity-fullscreen-button");
    var pageExpanded = false;
    var pending = false;

    function nativeElement() {
      return doc.fullscreenElement || doc.webkitFullscreenElement;
    }
    function fit() {
      var native = nativeElement() === container;
      var expanded = pageExpanded || native;
      container.classList.toggle("unity-expanded", expanded);
      var viewport = !native && win.visualViewport;
      var vw = viewport ? viewport.width : win.innerWidth;
      var vh = viewport ? viewport.height : win.innerHeight;
      var ox = viewport ? viewport.offsetLeft : 0;
      var oy = viewport ? viewport.offsetTop : 0;
      var style = win.getComputedStyle(container);
      var horizontalPadding = (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);
      var verticalPadding = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
      var margin = expanded ? 0 : 16;
      // Keep an exit control outside the game, including on phones without native fullscreen.
      var footerHeight = 44;
      var scale = Math.min(
        Math.max(1, vw - margin * 2 - horizontalPadding) / 540,
        Math.max(1, vh - margin * 2 - verticalPadding - footerHeight) / 960,
        expanded ? Infinity : 1
      );
      var width = Math.max(1, Math.floor(540 * scale));
      var height = Math.max(1, Math.floor(960 * scale));
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      footer.style.width = width + "px";
      container.style.width = (expanded ? vw : width) + "px";
      container.style.height = (expanded ? vh : height + footerHeight) + "px";
      container.style.left = (expanded ? ox : ox + vw / 2) + "px";
      container.style.top = (expanded ? oy : oy + vh / 2) + "px";
      button.setAttribute("aria-pressed", String(expanded));
      button.setAttribute("aria-label", expanded ? "元の表示に戻す" : "画面を広げる");
      button.title = expanded ? "元の表示に戻す" : "画面を広げる";
      button.textContent = expanded ? "↙" : "";
    }

    async function toggle() {
      if (pending) return;
      if (pageExpanded && nativeElement() !== container) {
        pageExpanded = false;
        fit();
        return;
      }
      pending = true;
      try {
        if (nativeElement() === container) {
          var exit = doc.exitFullscreen || doc.webkitExitFullscreen;
          if (typeof exit === "function") await exit.call(doc);
        } else {
          var request = container.requestFullscreen || container.webkitRequestFullscreen;
          var supported = typeof request === "function" &&
            doc.fullscreenEnabled !== false && doc.webkitFullscreenEnabled !== false;
          if (supported) {
            try {
              // Invoke during the click, before awaiting, to preserve browser user activation.
              await request.call(container);
              pageExpanded = nativeElement() !== container;
            } catch (_) {
              pageExpanded = true;
            }
          } else {
            pageExpanded = true;
          }
        }
      } catch (_) {
        // A refused exit must not escape into Unity's global exception handler either.
      } finally {
        pending = false;
        fit();
      }
    }

    button.addEventListener("click", toggle);
    win.addEventListener("resize", fit);
    if (win.visualViewport) {
      win.visualViewport.addEventListener("resize", fit);
      win.visualViewport.addEventListener("scroll", fit);
    }
    function changed() {
      pageExpanded = false;
      fit();
    }
    doc.addEventListener("fullscreenchange", changed);
    doc.addEventListener("webkitfullscreenchange", changed);
    doc.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && pageExpanded) { pageExpanded = false; fit(); }
    });
    fit();
    return { toggle: toggle, fit: fit };
  }
  if (typeof module !== "undefined" && module.exports) module.exports = setupSwarmViewport;
  else root.setupSwarmViewport = setupSwarmViewport;
})(typeof window !== "undefined" ? window : globalThis);
