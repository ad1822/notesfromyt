async function getVideoDetails() {
  let title = null;
  let channel = null;

  // Fastest: from YouTube's internal JS object
  if (window.ytInitialPlayerResponse?.videoDetails) {
    const vd = window.ytInitialPlayerResponse.videoDetails;
    title = vd.title;
    channel = vd.author;
  }


  // Fallback: from DOM (works even if page changed dynamically)
  if (!title) {
    const titleEl = document.querySelector("#title h1 yt-formatted-string");
    title = titleEl ? titleEl.innerText.trim() : null;
  }

  if (!channel) {
    const channelEl = document.querySelector("#owner yt-formatted-string a");
    channel = channelEl ? channelEl.innerText.trim() : null;
  }

  await browser.storage.local.set({ channel: channel });
  await browser.storage.local.set({ title: title });

  return { title, channel };
}

async function latestTimestamp() {
  const timeElement = document.getElementsByClassName("ytp-time-current")[0];
  if (!timeElement) return { time: null };
  const time = timeElement.innerText;

  await browser.storage.local.set({ timestamp: time });
  return { time };
}


// --- Listen for popup requests ---
browser.runtime.onMessage.addListener((msg) => {
  if (msg.action === "getVideoInfo") {
    const details = getVideoDetails();
    return Promise.resolve(details);
  }

  if (msg.action === "getTimestamp") {
    const timestamp = latestTimestamp();
    return Promise.resolve(timestamp);
  }
});



// Function to get video title
(async () => {
  const video = document.querySelector(".html5-main-video");
  if (!video) {
    console.error("No video element found.");
    return;
  }

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
})();
