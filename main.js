import {
  DEFAULT_PADDING,
  DEFAULT_TEXT_SETTINGS,
  ScrollingText,
} from "./modules/scrolling-text.js";
import {
  loadSettings,
  loadText,
  storeSettings,
  storeText,
} from "./modules/storage.js";

/**
 * @type {HTMLFormElement}
 */
const settingsEl = document.getElementById("settings");
const cancelBtn = document.getElementById("cancel");
const dialog = document.getElementsByTagName("dialog")[0];
const canvas = document.getElementsByTagName("canvas")[0];

const scrollingText = new ScrollingText(
  canvas,
  "Hello world!\nHello world!",
  2,
  50,
  DEFAULT_TEXT_SETTINGS,
  DEFAULT_PADDING,
  100,
  70
);
scrollingText.autoSizeFont = true;
await loadSettings(scrollingText);

document.getElementById("speed").value = scrollingText.scrollSpeed;

const reader = new FileReader();
reader.addEventListener("load", async () => {
  scrollingText.text = reader.result.toString();
  storeText(reader.result.toString());
});

settingsEl.onsubmit = async (ev) => {
  ev.preventDefault();
  ev.stopPropagation();

  scrollingText.scrollSpeed = ev.target.speed.value;

  await storeSettings(scrollingText);

  /**
   * @type {HTMLInputElement}
   */
  const fileEl = ev.target.file;
  if (fileEl.files.length > 0) {
    reader.readAsText(fileEl.files[0]);
    scrollingText.renderActive = true;
  }

  dialog.close();
};

canvas.ondblclick = () => {
  dialog.show();
};

if (window.obsstudio) {
  window.addEventListener("obsSourceVisibleChanged", (e) => {
    scrollingText.renderActive = e.detail.visible;
  });
}

const initialText = await loadText();
if (initialText && initialText.length > 0) {
  scrollingText.text = initialText;
  scrollingText.renderActive = true;
} else {
  dialog.show();
}

cancelBtn.onclick = () => {
  dialog.close();
};
