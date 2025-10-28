async function getVideoDetails() {
  let title = window.ytInitialPlayerResponse?.videoDetails?.title ||
    document.querySelector("#title h1 yt-formatted-string")?.innerText.trim() || "Unknown";
  let channel = window.ytInitialPlayerResponse?.videoDetails?.author ||
    document.querySelector("#owner yt-formatted-string a")?.innerText.trim() || "Unknown";


  const duration = document.querySelector(".ytp-time-duration")?.innerText || null;

  let url = window.location.href
  url = url.split("&t")[0]

  let hash = url.split("?v=")[1]

  await browser.storage.local.set({ title, channel, url, hash, duration });

  return { title, channel, url, hash, duration };
}

async function latestTimestamp() {
  const time = document.querySelector(".ytp-time-current")?.innerText || null;
  if (!time) return { time: null, actualTime: null };

  await browser.storage.local.set({ timestamp: time });

  const parts = time.split(":").map(Number);
  let actualTime = 0;

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    actualTime = hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    const [minutes, seconds] = parts;
    actualTime = minutes * 60 + seconds;
  } else {
    actualTime = parts[0] || 0;
  }

  return { time, actualTime };
}

// Auto-capture frame on video load
async function captureCurrentVideoFrame() {
  const video = document.querySelector("video");
  if (!video) return;

  const rect = video.getBoundingClientRect();
  await browser.runtime.sendMessage({
    action: "captureVideoFrame",
    rect: {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      devicePixelRatio: window.devicePixelRatio
    }
  });
}

// Expose function so popup can call it
window.captureCurrentVideoFrame = captureCurrentVideoFrame;

browser.runtime.onMessage.addListener((msg) => {
  if (msg.action === "getVideoInfo") return getVideoDetails();
  if (msg.action === "getTimestamp") return latestTimestamp();
});
