document.getElementById("screenshot").addEventListener("click", async () => {
  try {
    await browser.runtime.sendMessage({ action: "capture" });
  } catch (err) {
    console.error("Error sending message:", err);
  }
});
