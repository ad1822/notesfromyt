# YouTube Notes Capture

A lightweight Firefox/Zen browser extension for creating structured, markdown-based notes directly from YouTube videos.
Built for developers, learners, and researchers who prefer keeping their knowledge in Markdown or Obsidian.

---

## Features

**Capture Screenshots**
  - Capture the current frame of a YouTube video instantly.
  - Each video gets its own folder named after the video title.
  - Screenshots are stored inside that folder.

 **Insert Timestamps**
  - Insert the current video time (e.g., `12:34` or `1:02:15`) into your notes with a single click.
  - Works for videos with hours or minutes.
  - Ideal for timestamp-based note-taking.

- **Persistent Notes Storage**
  - Notes written in the popup persist between sessions.
  - Data is saved locally using `browser.storage.local`.
  - Notes remain intact even if the popup is closed or the browser is restarted.

- **Save Notes as Markdown**
  - Export your notes as a `.md` file using the video title as the filename.
  - Includes video title, URL, and optional metadata.
  - Structured for easy import into Markdown editors like Obsidian.

- **Obsidian Template Integration**
  - Markdown files follow a structured format:
    - Video Title
    - Channel Name
    - Video URL
    - Description
    - Your Notes
    - Screenshot and timestamp references

- **Folder Structure**

  ```
  YouTube Notes/
  ├── <Video Title>/
  │   ├── <Video Title>.md
  │   ├── screenshot_2025-10-27_01-24-05.png
  │   ├── screenshot_2025-10-27_01-26-11.png
  │   └── ...
  ├── Another Video Title/
  │   ├── Another Video Title.md
  │   ├── screenshot_2025-10-26_21-55-33.png
  │   └── ...
  ```

---

## How It Works

1. Open any YouTube video.
2. Launch the extension popup.
3. Write your notes or click available actions:
   - Capture frame
   - Insert timestamp
   - Fetch video info (title, channel, description)
   - Clear notes
4. Click **Save Notes** to export everything as a Markdown file inside a folder named after the video title.

---

## Future Improvements

- Automatic sync with an Obsidian vault
- Global keyboard shortcut for timestamp capture
- AI-based section summaries
- Cross-video tagging and search

---

