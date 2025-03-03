// @ts-nocheck
export default function waitForElementWithText(parentElement, text, callback) {
  const observer = new MutationObserver((mutationsList) => {
    const child = Array.from(parentElement.querySelectorAll('*')).find(
      (el) => el.textContent === text,
    );

    if (child) {
      callback(child); // Found the element, invoke the callback
      observer.disconnect(); // Stop observing
    }
  });

  observer.observe(parentElement, { childList: true, subtree: true });
}
