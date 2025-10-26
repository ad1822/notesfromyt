browser.browserAction.onClicked.addListener(async (tab) => {
  await browser.tabs.sendMessage(tab.id, { action: "toggleOverlay" });
});

let latestFilename = null;

async function captureScreenshot(rect) {
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
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}-${String(now.getSeconds()).padStart(2, "0")}`;

    const filename = `screenshot/screenshot-${stamp}.png`;
    latestFilename = filename;

    await browser.downloads.download({
      url: croppedUrl,
      filename,
      saveAs: false
    });

    return filename;
  } catch (err) {
    console.error("Capture failed:", err);
    return null;
  }
}

browser.runtime.onMessage.addListener(async (msg, sender) => {
  if (msg.action === "captureRequest") {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    const rect = await browser.tabs.sendMessage(tab.id, { action: "getVideoRect" });
    const filename = await captureScreenshot(rect);

    if (filename) {
      browser.tabs.sendMessage(tab.id, { action: "newFilename", filename });
    }

    const info = await browser.tabs.sendMessage(tab.id, { action: "getVideoInfo" });
    const time = await browser.tabs.sendMessage(tab.id, { action: "getTimestamp" });

    browser.tabs.sendMessage(tab.id, {
      action: "displayInfo",
      info: { ...info, ...time }
    });
  }

  if (msg.action === "getMetadataRequest") {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    const info = await browser.tabs.sendMessage(tab.id, { action: "getVideoInfo" });
    browser.tabs.sendMessage(tab.id, { action: "metadataResponse", info });
  }
});
