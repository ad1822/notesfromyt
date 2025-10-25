// NOTE: Get Video metadata logic
async function getVideoDetails() {
  let title = null;
  let channel = null;

  // 1. Get details from YouTube's internal JS object (fastest)
  if (window.ytInitialPlayerResponse?.videoDetails) {
    const vd = window.ytInitialPlayerResponse.videoDetails;
    title = vd.title;
    channel = vd.author;
  }

  // 2. Fallback: from DOM (slower but reliable)
  if (!title) {
    const titleEl = document.querySelector("#title h1 yt-formatted-string");
    title = titleEl ? titleEl.innerText.trim() : null;
  }
  if (!channel) {
    const channelEl = document.querySelector("#owner yt-formatted-string a");
    channel = channelEl ? channelEl.innerText.trim() : null;
  }

  await browser.storage.local.set({ channel: channel, title: title });

  return { title, channel };
}

// NOTE: Get current timestamp
async function latestTimestamp() {
  const timeElement = document.getElementsByClassName("ytp-time-current")[0];
  const time = timeElement ? timeElement.innerText : null;

  await browser.storage.local.set({ timestamp: time });
  return { time };
}

// --- Listen for background script requests ---
browser.runtime.onMessage.addListener((msg) => {
  if (msg.action === "getVideoInfo") {
    return Promise.resolve(getVideoDetails());
  }

  if (msg.action === "getTimestamp") {
    return Promise.resolve(latestTimestamp());
  }

  if (msg.action === "getVideoRect") {
    const video = document.querySelector(".html5-main-video");
    if (!video) return Promise.reject("No video element");

    const rect = video.getBoundingClientRect();
    return Promise.resolve({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      devicePixelRatio: window.devicePixelRatio
    });
  }
});

