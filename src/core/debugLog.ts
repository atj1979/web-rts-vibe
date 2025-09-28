export function debugLog(msg: string) {
  let el = document.getElementById("debug");
  if (!el) {
    el = document.createElement("div");
    el.id = "debug";
    el.style.position = "fixed";
    el.style.bottom = "0";
    el.style.left = "0";
    el.style.background = "rgba(0,0,0,0.7)";
    el.style.color = "lime";
    el.style.fontSize = "16px";
    el.style.zIndex = "9999";
    el.style.padding = "8px";
    document.body.appendChild(el);
  }
  el.textContent = msg;
}
