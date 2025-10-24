// Function to get video title
function getVideoTitle() {
  const el = document.querySelector('#title h1 yt-formatted-string');
  return el ? el.getAttribute('title') || el.innerText.trim() : null;
}

// Try immediately
// const title = getVideoTitle();
// if (title) {
//   browser.runtime.sendMessage({ action: "videoTitle", title });
// } else {
//   // Observe #title for dynamic loading
//   const observer = new MutationObserver(() => {
//     const title = getVideoTitle();
//     if (title) {
//       browser.runtime.sendMessage({ action: "videoTitle", title });
//       observer.disconnect();
//     }
//   });
//
//   const titleDiv = document.getElementById('title');
//   if (titleDiv) observer.observe(titleDiv, { childList: true, subtree: true });
// }

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
