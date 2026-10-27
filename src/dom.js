/**
 * Small DOM helpers shared by the view modules. Text always goes in through
 * textContent, never as HTML.
 */

/**
 * Creates an element with an optional class name and text.
 * @param {string} tag
 * @param {string} [className]
 * @param {string} [text]
 * @returns {HTMLElement}
 */
export function makeElement(tag, className = '', text = '') {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

/**
 * Sets the text of an element only when it changed, which saves layout work
 * for values that are refreshed on every frame.
 * @param {Element} element
 * @param {string} text
 */
export function setText(element, text) {
  if (element.textContent !== text) element.textContent = text;
}
