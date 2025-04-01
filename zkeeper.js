/*
Zoom Keeper v1.0
-----------
Use iframe to retain zoom level cross domain (ex. local files)
https://github.com/miragecraft/zkeeper/
*/
(() => {
  const isInIframe = window.self !== window.top;

  if (isInIframe) {
    // Client Code

    // Function to sync current URL with parent
    const syncWithParent = () =>
      window.parent.postMessage({ page: window.location.href }, "*");

    // Listen for load and hashchange events
    ["load", "hashchange"].forEach(eventType =>
      window.addEventListener(eventType, syncWithParent)
    );

    const baseUrl = new URL(window.location.href);

    // Intercept clicks on external or non-html links
    document.addEventListener("click", event => {
      const link = event.target.closest("a");
      if (!link) return;

      const targetUrl = new URL(link.getAttribute("href"), baseUrl);
      const isExternal = baseUrl.origin !== targetUrl.origin;
      const isNonHtml = !/\.(html?)$/i.test(targetUrl.pathname);

      if (isExternal || isNonHtml) {
        window.parent.postMessage(
          { page: targetUrl.href, extLink: true },
          "*"
        );
        event.preventDefault();
      }
    });
  } else {
    // Host Code

    // Helper function to compute a relative URL from base to target
    const getRelativePath = (base, target) => {
      const baseParts = base.pathname.split("/").slice(0, -1);
      const targetParts = target.pathname.split("/");
      let common = 0;

      while (
        common < baseParts.length &&
        common < targetParts.length &&
        baseParts[common] === targetParts[common]
      ) {
        common++;
      }

      const upDirs = "../".repeat(baseParts.length - common);
      const remain = targetParts.slice(common).join("/");
      return upDirs + remain + target.search + target.hash;
    };

    // Listen for messages from the client iframe
    window.addEventListener("message", event => {
      const baseUrl = new URL(window.location.href);
      const targetUrl = new URL(event.data.page, baseUrl);

      if (event.data.extLink) {
        window.location.href = targetUrl.href;
        return;
      }

      const relative = getRelativePath(baseUrl, targetUrl);
      const query = encodeURIComponent(relative);
      history.replaceState({ query }, "", `?page=${query}`);
    });

    // On ready, set the iframe source based on query parameter or default
    window.addEventListener("DOMContentLoaded", () => {
      const iframe = document.querySelector("iframe");
      const params = new URLSearchParams(window.location.search);
      const page = params.get("page") || iframe.dataset.defaultSrc;
      iframe.src = page;
    });
  }
})();