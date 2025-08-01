import { DEFAULT_PADDING, DEFAULT_TEXT_SETTINGS } from './scrolling-text.js';

/**
 * @function
 * @template T
 * @param {IDBRequest<T>} request
 * @returns {Promise<T>}
 */
async function requestPromise(request) {
  return new Promise((resolve, reject) => {
    request.onerror = () => reject();
    request.onsuccess = (e) => resolve(e.target.result);
  });
}

/**
 * @returns {Promise<IDBDatabase>}
 */
async function getDatabase() {
  const request = window.indexedDB.open("scrolling", 3);
  request.onupgradeneeded = (e) => {
    /**
     * @type {IDBDatabase}
     */
    const db = e.target.result;

    if (!db.objectStoreNames.contains("text")) {
      db.createObjectStore("text");
    }

    if (!db.objectStoreNames.contains("settings")) {
      db.createObjectStore("settings");
    }
  };
  return requestPromise(request);
}

/**
 * @param {string} text
 */
export async function storeText(text) {
  const database = await getDatabase();
  const store = database.transaction("text", "readwrite").objectStore("text");
  await requestPromise(store.put(text, "text"));
}

/**
 * @returns {Promise<string|undefined>}
 */
export async function loadText() {
  const database = await getDatabase();
  const store = database.transaction("text").objectStore("text");
  return await requestPromise(store.get("text"));
}

/**
 * @typedef {object} StoredSettings
 * @property {number} columnCount
 * @property {number} columnSpacing
 * @property {import('./scrolling-text.js').TextSettings} textSettings
 * @property {import('./scrolling-text.js').Padding} padding
 * @property {number} scrollSpeed
 * @property {number} repeatSpacing
 * @property {boolean} autoSizeFont
 * @property {boolean} wordWrap
 */

/**
 * @param {import('./scrolling-text.js').ScrollingText} scrollingText
 */
export async function storeSettings(scrollingText) {
  const database = await getDatabase();
  const store = database
    .transaction("settings", "readwrite")
    .objectStore("settings");

  const settings = {
    autoSizeFont: scrollingText.autoSizeFont,
    wordWrap: scrollingText.wordWrap,
    columnSpacing: scrollingText.columnSpacing,
    repeatSpacing: scrollingText.repeatSpacing,
    textSettings: scrollingText.settings,
    padding: scrollingText.padding,
    columnCount: scrollingText.columnCount,
    scrollSpeed: scrollingText.scrollSpeed,
  };

  await requestPromise(store.put(settings, "settings"));
}

/**
 * @param {import('./scrolling-text.js').ScrollingText} scrollingText
 */
export async function loadSettings(scrollingText) {
  const database = await getDatabase();
  const store = database.transaction("settings").objectStore("settings");

  /**
   * @type {StoredSettings|undefined}
   */
  const settings = await requestPromise(store.get("settings"));

  if (settings === undefined) {
    return;
  }

  scrollingText.autoSizeFont = settings.autoSizeFont ?? false;
  scrollingText.wordWrap = settings.wordWrap ?? false;
  scrollingText.columnSpacing = settings.columnSpacing ?? 50;
  scrollingText.repeatSpacing = settings.repeatSpacing ?? 70;
  scrollingText.settings = settings.textSettings ?? DEFAULT_TEXT_SETTINGS;
  scrollingText.padding = settings.padding ?? DEFAULT_PADDING;
  scrollingText.columnCount = settings.columnCount ?? 2;
  scrollingText.scrollSpeed = settings.scrollSpeed ?? 100;
}
