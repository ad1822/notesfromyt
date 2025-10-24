async function captureScreenshot(msg) {
  try {
    const { rect } = msg;
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

    // Capture full visible tab
    const dataUrl = await browser.tabs.captureVisibleTab(tab.windowId, { format: "png" });

    // Convert base64 → Image → Canvas → Crop
    const img = await createImageBitmap(await (await fetch(dataUrl)).blob());
    const canvas = new OffscreenCanvas(rect.width * rect.devicePixelRatio, rect.height * rect.devicePixelRatio);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(
      img,
      rect.x * rect.devicePixelRatio,
      rect.y * rect.devicePixelRatio,
      rect.width * rect.devicePixelRatio,
      rect.height * rect.devicePixelRatio,
      0,
      0,
      rect.width * rect.devicePixelRatio,
      rect.height * rect.devicePixelRatio
    );

    const croppedBlob = await canvas.convertToBlob({ type: "image/png" });
    const croppedUrl = URL.createObjectURL(croppedBlob);

    const now = new Date();
    const YYYY = now.getFullYear();
    const MM = String(now.getMonth() + 1).padStart(2, '0');
    const DD = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');

    const date = `${YYYY}${MM}${DD}${hh}${mm}${ss}`;

    const filename = `yt/screenshot-${date}.png`;

    // Download the file
    await browser.downloads.download({
      url: croppedUrl,
      filename: filename
    });

    // Save the filename to storage
    await browser.storage.local.set({ lastFilename: filename });

    console.log("Cropped video frame saved.");
  } catch (err) {
    console.error("Capture failed:", err);
  }
}

browser.runtime.onMessage.addListener(async (msg, sender) => {
  if (msg.action === "videoTitle") {
    console.log("Video title received in background:", msg.title);
  }
  if (msg.action === "captureVideoFrame") {
    captureScreenshot(msg)
  }
});
