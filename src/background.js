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

    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    const folder = "notesfromyt";


    await browser.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });

    // Take value from local
    // const { title } = await browser.storage.local.get("title");

    // No, Take value from youtube page, because in local value maybe wrong
    const { title } = await browser.tabs.sendMessage(tab.id, {
      action: "getVideoInfo"
    });

    const safeTitle = (title || "unknown_video").replace(/[\/\\:*?"<>|]/g, "").trim();

    const filename = `screenshot/screenshot-${date}.png`;
    latestFilename = filename;

    await browser.downloads.download({
      url: croppedUrl,
      filename: `${folder}/${safeTitle}/${filename}`,
      saveAs: false
    });

    browser.runtime.sendMessage({ action: "newFilename", filename });
    // console.log("Cropped frame saved as", filename);
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
  }
});
