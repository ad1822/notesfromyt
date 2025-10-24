const textArea = document.getElementById("note")

document.getElementById("screenshot").addEventListener("click", async () => {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

    await browser.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
    textArea.value += "First line"
  } catch (err) {
    console.error(err);
  }
});
