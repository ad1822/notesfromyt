async function getVideoDetails() {
  let title = window.ytInitialPlayerResponse?.videoDetails?.title ||
    document.querySelector("#title h1 yt-formatted-string")?.innerText.trim() || "Unknown";
  let channel = window.ytInitialPlayerResponse?.videoDetails?.author ||
    document.querySelector("#owner yt-formatted-string a")?.innerText.trim() || "Unknown";


  const duration = document.querySelector(".ytp-time-duration")?.innerText || null;
  console.log(duration)

  const url = window.location.href

  await browser.storage.local.set({ title, channel, url, duration });
  return { title, channel, url, duration };
}

async function latestTimestamp() {
  const time = document.querySelector(".ytp-time-current")?.innerText || null;
  await browser.storage.local.set({ timestamp: time });
  const [minStr, secStr] = time.split(":");
  const min = parseInt(minStr, 10) * 60
  const actualTime = min + parseInt(secStr, 10)
  return { time, actualTime };
}

// Auto-capture frame on video load
async function captureCurrentVideoFrame() {
  const video = document.querySelector(".html5-main-video");
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
