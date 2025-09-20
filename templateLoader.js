// templateLoader.js
// Utility to load and cache HTML templates from separate files.

const templateCache = new Map();

export async function loadTemplate(url) {
  if (templateCache.has(url)) {
    return templateCache.get(url);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load template from ${url}: ${response.statusText}`);
  }
  const templateHtml = await response.text();
  templateCache.set(url, templateHtml);
  return templateHtml;
}
