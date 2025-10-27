# YouTube Markdown Notes

A lightweight Firefox-based browser extension for creators, developers, and learners who take structured notes directly from YouTube videos — in Markdown.
It captures screenshots, timestamps, and metadata, and saves notes persistently with Obsidian-compatible formatting.

---

## 🚀 Features

* **Screenshot Capture**
  Instantly capture a frame from the current YouTube video.
  Each screenshot is automatically stored inside a folder named after the video title.

* **Timestamp Insertion**
  Insert the current YouTube playback timestamp (supports hours, minutes, seconds) directly into your notes for quick referencing.

* **Persistent Notes**
  Notes remain saved even after popup closure.
  Your draft stays safe until you explicitly save or clear it.

* **Markdown Export**
  Save notes as `.md` files — structured, readable, and ready for integration with Markdown-based note systems.

* **Obsidian Template Support**
  Saved Markdown files include a metadata section formatted for Obsidian, including:

  * Video title
  * Channel name
  * URL
  * Published date

  Example:

  ```markdown
  ---
  video: "How to Learn Kubernetes"
  channel: "TechWorld with Nana"
  url: "https://www.youtube.com/watch?v=xxxxxx"
  date: "2025-10-27"
  ---

  ## Notes
  - Timestamp: 02:15 → Great explanation on Pods.
  - Screenshot captured for Deployment example.
  ```

---

## How It Works

1. Open any YouTube video.
2. Launch the extension popup.
3. Start taking notes — insert timestamps, capture screenshots, or write text.
4. Click **Save Notes** to export your Markdown file.

All screenshots and notes are automatically organized per video.

---

## Tech Stack

* **WebExtension (Manifest V3)**
* **JavaScript / HTML / CSS**
* **Firefox-compatible APIs (storage, tabs, downloads)**
* **LocalStorage persistence**
* **Dynamic folder organization for each video**

---

## 🧱 Folder Structure

```
YouTube Markdown Notes/
├── manifest.json
├── popup.html
├── popup.js
├── overlay.js
└── icons/
```

---

## Future Enhancements

* Direct sync with an Obsidian vault (auto-detect vault paths)
* Auto-fetch video transcript for deeper note linking
* Keyboard shortcuts for capture and timestamp
* Export session as `.zip` (screenshots + markdown)

---

<!-- ## 📄 License -->
<!---->
<!-- MIT License — free to use, modify, and extend. -->
<!---->
<!-- --- -->
