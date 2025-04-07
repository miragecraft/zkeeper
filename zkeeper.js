/*
Zoom Keeper v1.2
-----------
Use iframe to retain zoom level for local files, now with scroll restore on refresh.
https://github.com/miragecraft/zkeeper/
*/
(() => {
  const isInIframe = window.self !== window.top;

  if (isInIframe) {
    // Client Code (iframe)

    const baseUrl = new URL(window.location.href);

    // Send initial page and title
    const syncWithParent = () => {
      window.parent.postMessage({
        page: window.location.href,
        title: document.title
      }, "*");
    };

    // Observe title changes
    new MutationObserver(syncWithParent).observe(
      document.querySelector("title"),
      { childList: true }
    );

    // Inform parent on load and hashchange
    ["DOMContentLoaded", "hashchange"].forEach(event =>
      window.addEventListener(event, syncWithParent)
    );

    // Send scroll position to parent on scroll
    let scrollTimeout;
    let debounce = 200;

    window.addEventListener("scroll", () => {
      const y = window.scrollY;
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        window.parent.postMessage({ scrollY: y }, "*");
      }, debounce);
    });


    // Receive scroll restore from parent
    window.addEventListener("load", () => {
      window.addEventListener("message", (event) => {
        if (event.data.restoreScrollY != null) {
          window.scrollTo(0, event.data.restoreScrollY);
        }
      });
    });

    // Intercept external or non-HTML links
    document.addEventListener("click", event => {
      const link = event.target.closest("a");
      if (!link) return;

      const targetUrl = new URL(link.getAttribute("href"), baseUrl);
      const isExternal = baseUrl.origin !== targetUrl.origin;
      const isNonHtml = !/\.(html?)$/i.test(targetUrl.pathname);

      // if (isExternal || isNonHtml) {
      //   window.parent.postMessage(
      //     { page: targetUrl.href, extLink: true },
      //     "*"
      //   );
      //   event.preventDefault();
      // }
      if (isExternal) {
        window.open(targetUrl.href, "_blank");
        event.preventDefault();
        return;
      }
      if (isNonHtml) {
        window.parent.postMessage(
          { page: targetUrl.href },
          "*"
        );
      }
    });

    return;
  }

  // Host Code (parent)
  const frameSrc = document.currentScript.getAttribute("data-frame-src");

  window.zKeeper = (frameSrc) => {
    if (window.location.protocol !== "file:") {
      window.location.href = frameSrc;
      return;
    }

    let ownTitle = document.title;
    let lastScrollY = 0;

    // Navigation helper
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

    // Listen to messages from iframe
    window.addEventListener("message", (event) => {
      if (typeof event.data === "object") {
        if (event.data.page) {
          const baseUrl = new URL(window.location.href);
          const targetUrl = new URL(event.data.page, baseUrl);

          // if (event.data.extLink) {
          //   window.location.href = targetUrl.href;
          //   return;
          // }

          // Update title
          document.title = event.data.title ?? ownTitle;

          // update url
          const relative = getRelativePath(baseUrl, targetUrl);
          const params = new URLSearchParams(window.location.search);
          const page = params.get("page") || frameSrc;
          const savedScroll = parseInt(params.get("scroll") || "0", 10);
          const iframe = document.querySelector("iframe");

          // restore scroll position
          if (relative === page) {
            iframe.contentWindow.postMessage({ restoreScrollY: savedScroll }, "*");
            return;
          }

          const query = encodeURIComponent(relative);
          history.replaceState({ query }, "", `?page=${query}`);
        }

        // Update scroll param live
        if (event.data.scrollY != null) {
          let lastScrollY = event.data.scrollY;
          const url = new URL(window.location.href);
          url.searchParams.set("scroll", lastScrollY);
          history.replaceState(null, "", url.toString());
        }
      }
    });

    // On page load
    window.addEventListener("DOMContentLoaded", () => {
      const params = new URLSearchParams(window.location.search);
      const page = params.get("page") || frameSrc;
      const savedScroll = parseInt(params.get("scroll") || "0", 10);

      document.head.insertAdjacentHTML("beforeend", `
        <style>
          html, body, iframe {
            border: 0;
            margin: 0;
            padding: 0;
            display: grid;
            width: 100%;
            height: 100%;
          }
        </style>
      `);

      document.body.insertAdjacentHTML("beforeend", `
        <iframe src="${page}"></iframe>
      `);

      const iframe = document.querySelector("iframe");

      iframe.addEventListener("load", () => {
        // If it was a reload and scroll param exists, send it to iframe
        const navEntries = performance.getEntriesByType("navigation");
        if (navEntries.length && navEntries[0].type === "reload" && !isNaN(savedScroll)) {
          iframe.contentWindow.postMessage({ restoreScrollY: savedScroll }, "*");

          // Remove scroll from URL
          const url = new URL(window.location.href);
          url.searchParams.delete("scroll");
          history.replaceState(null, "", url.toString());
        }
      }, { once: true });
    });
  };

  if (frameSrc) window.zKeeper(frameSrc);
})();
