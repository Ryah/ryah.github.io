// GitHub counts downloads of release files, not visitors or unique people.
// Infer the release and assets from the buttons so future link edits stay in sync.
(async () => {
  const lifetime = 5 * 60 * 1000;
  const cacheKey = "vexa-download-count-v1";
  const requests = new Map();

  function releaseFiles(section) {
    const releases = new Map();
    for (const link of section.querySelectorAll("[data-download][href]")) {
      try {
        const url = new URL(link.href);
        const parts = url.pathname.split("/").filter(Boolean);
        if (url.protocol !== "https:" || url.hostname !== "github.com" ||
            parts.length !== 6 || parts[2] !== "releases" || parts[3] !== "download") continue;
        const [owner, repo, , , tag, file] = parts.map(decodeURIComponent);
        const key = JSON.stringify([owner, repo, tag]);
        if (!releases.has(key)) releases.set(key, { owner, repo, tag, files: new Set() });
        releases.get(key).files.add(file);
      } catch (_) { /* A custom or unavailable download has no GitHub count. */ }
    }
    return [...releases.values()];
  }

  function fetchRelease(release) {
    const api = `https://api.github.com/repos/${encodeURIComponent(release.owner)}/${encodeURIComponent(release.repo)}/releases/tags/${encodeURIComponent(release.tag)}`;
    if (!requests.has(api)) requests.set(api, (async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch(api, {
          headers: { Accept: "application/vnd.github+json" },
          credentials: "omit", signal: controller.signal,
        });
        if (!response.ok) throw new Error("Release count unavailable");
        const data = await response.json();
        if (!Array.isArray(data.assets)) throw new Error("Release assets unavailable");
        return data.assets;
      } finally { clearTimeout(timer); }
    })());
    return requests.get(api);
  }

  async function updateCounter(counter) {
    try {
      const releases = releaseFiles(counter.closest(".downloads-section"));
      if (!releases.length) return;
      const signature = JSON.stringify(releases.map(r =>
        [r.owner, r.repo, r.tag, [...r.files].sort()]).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))));
      let cached;
      try { cached = JSON.parse(localStorage.getItem(cacheKey)); } catch (_) { /* Storage is optional. */ }
      const validCache = cached?.signature === signature && Number.isSafeInteger(cached.count) &&
        cached.count >= 0 && Number.isFinite(cached.at) && cached.at <= Date.now();
      const show = (count, stale = false) => {
        counter.querySelector("[data-download-total]").textContent = new Intl.NumberFormat().format(count);
        counter.title = "GitHub downloads for the preset and regex files linked below. Repeat downloads count." +
          (stale ? " Showing the last available count." : " Refreshed at most every 5 minutes.");
        counter.querySelector("[data-download-count-note]").textContent = stale ? " · last available count" : "";
        counter.hidden = false;
      };
      if (validCache && Date.now() - cached.at < lifetime) { show(cached.count); return; }
      try {
        const totals = await Promise.all(releases.map(async release => {
          const assets = await fetchRelease(release);
          return [...release.files].reduce((sum, name) => {
            const asset = assets.find(a => a.name === name);
            if (!asset || !Number.isSafeInteger(asset.download_count) || asset.download_count < 0)
              throw new Error("Incomplete release count");
            return sum + asset.download_count;
          }, 0);
        }));
        const count = totals.reduce((sum, value) => sum + value, 0);
        if (!Number.isSafeInteger(count)) throw new Error("Invalid release count");
        show(count);
        try { localStorage.setItem(cacheKey, JSON.stringify({ signature, count, at: Date.now() })); } catch (_) { /* Still show the live result. */ }
      } catch (_) {
        if (validCache) show(cached.count, true);
        // With no known count, keep the enhancement hidden rather than inventing 0.
      }
    } catch (_) { /* Counters never interfere with the download links. */ }
  }
  await Promise.all([...document.querySelectorAll("[data-download-count]")].map(updateCounter));
})();
