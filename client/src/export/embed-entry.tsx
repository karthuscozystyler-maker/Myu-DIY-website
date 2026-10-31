import { createRoot } from "react-dom/client";
import "../index.css";
import EmbedApp from "./EmbedApp";

const EMBED_SELECTOR = "[data-myu-embed]";
const EMBED_CSS_SELECTOR = ':scope > script[type="text/myu-css"]';

function findEmbedHost(): HTMLElement | null {
  const currentScript = document.currentScript;
  if (currentScript instanceof HTMLScriptElement) {
    const containingHost = currentScript.closest<HTMLElement>(EMBED_SELECTOR);
    if (containingHost) return containingHost;
  }

  return document.querySelector<HTMLElement>(EMBED_SELECTOR);
}

function readEmbedCss(host: HTMLElement): string {
  const cssScript = host.querySelector<HTMLScriptElement>(EMBED_CSS_SELECTOR);
  return cssScript?.textContent ?? host.dataset.myuCss ?? "";
}

function protectModalScroll(shadow: ShadowRoot) {
  let touchY = 0;
  const canScroll = (target: EventTarget | null, delta: number) => {
    let element = target instanceof Element ? target : null;
    while (element) {
      const overflow = window.getComputedStyle(element).overflowY;
      if (
        /auto|scroll/.test(overflow) &&
        element.scrollHeight > element.clientHeight
      ) {
        if (delta < 0) return element.scrollTop > 0;
        if (delta > 0)
          return (
            element.scrollTop + element.clientHeight < element.scrollHeight - 1
          );
        return true;
      }
      element = element.parentElement;
    }
    return false;
  };
  const isModalOpen = () => !!shadow.querySelector('[aria-modal="true"]');
  shadow.addEventListener(
    "touchstart",
    rawEvent => {
      const event = rawEvent as TouchEvent;
      if (event.touches.length === 1) touchY = event.touches[0].clientY;
    },
    { passive: true }
  );
  shadow.addEventListener(
    "touchmove",
    rawEvent => {
      const event = rawEvent as TouchEvent;
      if (!isModalOpen() || event.touches.length !== 1) return;
      const nextY = event.touches[0].clientY;
      const delta = touchY - nextY;
      touchY = nextY;
      if (!canScroll(event.target, delta) && event.cancelable)
        event.preventDefault();
    },
    { passive: false }
  );
  shadow.addEventListener(
    "wheel",
    rawEvent => {
      const event = rawEvent as WheelEvent;
      if (
        isModalOpen() &&
        !canScroll(event.target, event.deltaY) &&
        event.cancelable
      )
        event.preventDefault();
    },
    { passive: false }
  );
}

function createFailureMessage(): HTMLParagraphElement {
  const message = document.createElement("p");
  message.setAttribute("role", "alert");
  message.textContent = "載入失敗，請重新整理後再試。";
  message.style.cssText =
    "margin:0;padding:24px;background:#fff;color:#5b3926;font:16px/1.5 sans-serif;";
  return message;
}

function showMountFailure(host: HTMLElement) {
  try {
    const shadow = host.shadowRoot ?? host.attachShadow({ mode: "open" });
    host.replaceChildren();
    shadow.replaceChildren(createFailureMessage());
  } catch {
    host.replaceChildren(createFailureMessage());
  }
}

function mountEmbed() {
  const host = findEmbedHost();
  if (!host) return;

  try {
    const cssText = readEmbedCss(host);
    host.replaceChildren();

    const shadow = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = cssText;

    const rootElement = document.createElement("div");
    rootElement.id = "root";
    shadow.append(style, rootElement);
    protectModalScroll(shadow);

    createRoot(rootElement).render(<EmbedApp />);
  } catch {
    showMountFailure(host);
  }
}

mountEmbed();
