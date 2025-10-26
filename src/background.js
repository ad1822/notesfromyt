let latestFilename = null;

async function captureScreenshot({ rect }) {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    const dataUrl = await browser.tabs.captureVisibleTab(tab.windowId, { format: "png" });

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
    const date = now.toISOString().replace(/[:.]/g, '-');
    const folder = "notesfromyt";


    await browser.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });

    const { title } = await browser.storage.local.get("title");
    const safeTitle = (title || "unknown_video").replace(/[\/\\:*?"<>|]/g, "").trim();
    console.log(safeTitle)



    const filename = `screenshot/screenshot-${date}.png`;
    latestFilename = filename;

    await browser.downloads.download({
      url: croppedUrl,
      filename: `${folder}/${safeTitle}/${filename}`,
      saveAs: false
    });

    browser.runtime.sendMessage({ action: "newFilename", filename });
    console.log("Cropped frame saved as", filename);
  } catch (err) {
    console.error("Capture failed:", err);
  }
}

browser.runtime.onMessage.addListener((msg) => {
  switch (msg.action) {
    case "captureVideoFrame":
      captureScreenshot(msg);
      break;
    case "getFilename":
      return Promise.resolve({ filename: latestFilename });
    case "videoTitle":
      console.log("Video title received in background:", msg.title);
      break;
  }
});
