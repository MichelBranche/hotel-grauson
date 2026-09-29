export const SIDEBAR_KEY = "pms-sidebar-collapsed";
export const SIDEBAR_ATTR = "data-pms-sidebar";
const CHANGE_EVENT = "pms-sidebar-change";

/** Runs before first paint so a collapsed rail never flashes open on reload. */
export const sidebarBootScript = `try{if(localStorage.getItem("${SIDEBAR_KEY}")==="1")document.documentElement.setAttribute("${SIDEBAR_ATTR}","collapsed")}catch(e){}`;

export function readSidebarCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === "1";
  } catch {
    return false;
  }
}

export function subscribeSidebarCollapsed(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function writeSidebarCollapsed(collapsed: boolean) {
  try {
    localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0");
  } catch {
    return;
  }
  applySidebarAttr(collapsed);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function applySidebarAttr(collapsed: boolean) {
  if (collapsed) document.documentElement.setAttribute(SIDEBAR_ATTR, "collapsed");
  else document.documentElement.removeAttribute(SIDEBAR_ATTR);
}
