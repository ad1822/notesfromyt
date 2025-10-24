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

    const { timestamp } = await browser.storage.local.get("timestamp");
    let safeTimestamp = timestamp ? timestamp.replace(/\D/g, "").replace(/^0+/, "") : "0";

    // Prepend a folder if you want (must exist)
    const filename = `screenshot-${safeTimestamp}.png`;

    await browser.downloads.download({
      url: croppedUrl,
      filename: filename
    });

    // Save the filename to storage
    await browser.storage.local.set({ lastFilename: filename });

    // console.log("Cropped video frame saved.");
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
