function getTimestamp() {
  const now = new Date();
  const YYYY = now.getFullYear();
  const MM = String(now.getMonth() + 1).padStart(2, "0");
  const DD = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `${YYYY}${MM}${DD}${hh}${mm}${ss}`;
}


document.getElementById("capture").addEventListener("click", async () => {
  const infoDiv = document.getElementById("info");
  console.log(infoDiv)

  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

    await browser.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });

    // Get video info
    const { title, channel } = await browser.tabs.sendMessage(tab.id, {
      action: "getVideoInfo"
    });

    const timestamp = getTimestamp();

    const { lastFilename } = await browser.storage.local.get("lastFilename");
    console.log("Filename from storage:", lastFilename);

    infoDiv.innerHTML = `
      <b>Captured:</b><br>
      Title: ${title || "Unknown"}<br>
      Channel: ${channel || "Unknown"}<br>
      Time: ${timestamp}<br>
      Filename : ${lastFilename}<br>
    `;

  } catch (err) {
    console.error(err);
  }
});
