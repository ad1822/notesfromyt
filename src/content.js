// Inject overlay if user clicks icon
browser.runtime.onMessage.addListener((msg) => {
  if (msg.action === "toggleOverlay") injectOverlay();
  if (msg.action === "getVideoInfo") return Promise.resolve(getVideoDetails());
  if (msg.action === "getTimestamp") return Promise.resolve(latestTimestamp());
  if (msg.action === "getVideoRect") return Promise.resolve(getVideoRect());
});

function injectOverlay() {
  if (document.getElementById("yt-overlay")) return;

  const s = document.createElement("script");
  s.src = browser.runtime.getURL("src/overlay.js");
  document.body.appendChild(s);

  // Bridge between overlay (page) and extension (content)
  window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data) return;
    const { action, payload } = event.data;
    if (!action) return;

    browser.runtime.sendMessage({ action, ...payload });
  });

  browser.runtime.onMessage.addListener((msg) => {
    window.postMessage({ fromExtension: true, msg }, "*");
  });
}

async function getVideoDetails() {
  let title = null;
  let channel = null;

  if (window.ytInitialPlayerResponse?.videoDetails) {
    title = window.ytInitialPlayerResponse.videoDetails.title;
    channel = window.ytInitialPlayerResponse.videoDetails.author;
  }

  if (!title) {
    const el = document.querySelector("#title h1 yt-formatted-string");
    title = el ? el.innerText.trim() : "Unknown Title";
  }
  if (!channel) {
    const el = document.querySelector("#owner yt-formatted-string a");
    channel = el ? el.innerText.trim() : "Unknown Channel";
  }

  await browser.storage.local.set({ title, channel });
  return { title, channel };
}

async function latestTimestamp() {
  const el = document.querySelector(".ytp-time-current");
  const time = el ? el.innerText : "0:00";
  await browser.storage.local.set({ timestamp: time });
  return { time };
}

function getVideoRect() {
  const video = document.querySelector(".html5-main-video");
  if (!video) throw new Error("No video element found");
  const r = video.getBoundingClientRect();
  return {
    x: r.x,
    y: r.y,
    width: r.width,
    height: r.height,
    devicePixelRatio: window.devicePixelRatio
  };
}
