// menu.js
// Renders the printed-style menu using data from MockDB
// Handles order cart, sticky footer, QR generation

import { DB } from './db.js';
const restaurantId = "demo-restaurant";
const wrap = document.getElementById("wrap");

// State
let menuData = null;
let cart = {}; // key -> {id,name,price,qty}

// window.addEventListener("hashchange", handleHash);
// handleHash();
// function runApp() {
// }
// runApp();

// Helpers
export function formatPrice(v) {
  return Number(v).toFixed(2);
}

// Build main template (header + columns)
export function renderMenu() {
  if (!menuData) return;
  const doc = menuData;
  // header images: we'll use two images similar to screenshot (replace links as desired)
  const headerImgLeft =
    "https://images.unsplash.com/photo-1553177591-7c7b28a5a8a0?auto=format&fit=crop&w=800&q=60";
  const headerImgRight =
    "https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=800&q=60";

  // categories order to match screenshot: starters,mains,sides,desserts,drinks
  const order = ["starters", "mains", "sides", "desserts", "drinks"];
  const sections = order
    .map((key) => {
      const section = doc.menu[key];
      if (!section) return "";
      // For sides list (small format) we render differently
      if (key === "sides") {
        const items = Object.values(section.items)
          .map((it) => {
            return `<li style="display:flex;justify-content:space-between;padding:4px 0">
                    <span>${it.name}</span>
                    <span class="${
                      it.available ? "" : "unavailable"
                    }">${formatPrice(it.price)}</span>
                  </li>`;
          })
          .join("");
        return `<div>
                  <h3 class="section-title">${section.name}</h3>
                  <ul class="small-list">${items}</ul>
                </div>`;
      }

      // normal section with descriptions
      const itemsHtml = Object.values(section.items)
        .map((it) => {
          const classes = it.available ? "available" : "unavailable";
          // clickable -> data attributes
          return `<div class="menu-item ${classes}" data-id="${
            it.id
          }" data-section="${key}" ${
            it.available ? "" : 'aria-disabled="true"'
          } onclick="window.__menuClick && window.__menuClick('${key}','${
            it.id
          }')">
                  <div class="left">
                    <div style="font-weight:700">${it.name}</div>
                    ${it.desc ? `<div class="desc">${it.desc}</div>` : ""}
                  </div>
                  <div class="right leader">
                    <div class="dots" aria-hidden></div>
                    <div class="${classes}">$${formatPrice(it.price)}</div>
                  </div>
                </div>`;
        })
        .join("");

      return `<div>
                <h3 class="section-title">${section.name}</h3>
                <div class="menu-list">${itemsHtml}</div>
              </div>`;
    })
    .join("");

  // Compose final layout: header + two columns (left contains starters + sides + desserts, right contains mains + drinks and images)
  // We'll distribute sections to mimic the screenshot
  const html = `
      <div class="brand">
        <div class="title-box">
          <h2 style="font-size:18px;margin-bottom:8px">RICARDO'S</h2>
          <h1>MENU</h1>
        </div>
        <div class="img-box"><img src="${headerImgRight}" alt="dish"/></div>
      </div>

      <div class="columns">
        <div>
          <!-- Left column: Starters + Sides + Desserts -->
          ${renderSectionByKey("starters")}
          ${renderSectionByKey("sides")}
          ${renderSectionByKey("desserts")}
        </div>
        <div>
          <!-- Right column: Mains + image + Drinks -->
          ${renderSectionByKey("mains")}
          <div style="margin-top:10px" class="img-box"><img src="${headerImgLeft}" alt="pasta"/></div>
          ${renderSectionByKey("drinks")}
        </div>
      </div>
    `;

  wrap.innerHTML = html;
  // hook click handler
  window.__menuClick = (sectionId, itemId) => {
    addToCart(sectionId, itemId);
  };
}

// helper to render a specific section (used above)
function renderSectionByKey(key) {
  const sec = menuData.menu[key];
  if (!sec) return "";
  //   const items = Object.values(sec.items).map(it => `<li style="display:flex;justify-content:space-between;padding:4px 0"><span>${it.name}</span><span class="${it.available? '': 'unavailable'}">${formatPrice(it.price)}</span></li>`).join("");
  //   return `<h3 class="section-title">${sec.name}</h3><ul class="small-list">${items}</ul>`;
  // } else {
  const itemsHtml = Object.values(sec.items)
    .map((it) => {
      const classes = it.available ? "available" : "unavailable";
      return `<div class="menu-item ${classes}" data-id="${
        it.id
      }" data-section="${key}" ${
        it.available ? "" : 'aria-disabled="true"'
      } onclick="window.__menuClick && window.__menuClick('${key}','${it.id}')">
                  <div class="left">
                    <div style="font-weight:700">${it.name}</div>
                    ${it.desc ? `<div class="desc">${it.desc}</div>` : ""}
                  </div>
                  <div class="right leader">
                    <div class="dots" aria-hidden></div>
                    <div class="${classes}">$${formatPrice(it.price)}</div>
                  </div>
                </div>`;
    })
    .join("");
  return `<h3 class="section-title">${sec.name}</h3><div class="menu-list">${itemsHtml}</div>`;
  // }
}

// Cart functions
function addToCart(sectionId, itemId) {
  const item = menuData.menu[sectionId].items[itemId];
  if (!item || !item.available) return;
  if (!cart[itemId]) cart[itemId] = { ...item, qty: 0 };
  cart[itemId].qty++;
  renderCart();
}
function removeOne(itemId) {
  if (!cart[itemId]) return;
  cart[itemId].qty--;
  if (cart[itemId].qty <= 0) delete cart[itemId];
  renderCart();
}
function clearCart() {
  cart = {};
  renderCart();
}

function renderCart() {
  const orderSummary = document.getElementById("orderSummary");
  const orderItems = document.getElementById("orderItems");
  const orderTotal = document.getElementById("orderTotal");
  const qrPanel = document.getElementById("qrPanel");
  qrPanel.style.display = "none";
  qrPanel.innerHTML = "";

  const keys = Object.keys(cart);
  if (keys.length === 0) {
    orderSummary.style.display = "none";
    return;
  }
  orderSummary.style.display = "block";
  const rows = keys
    .map((k) => {
      const it = cart[k];
      return `<div style="display:flex;gap:8px;align-items:center">
                <div style="min-width:220px">${
                  it.name
                } <span style="color:var(--muted)">x${it.qty}</span></div>
                <div style="font-weight:700">$${formatPrice(
                  it.price * it.qty
                )}</div>
                <div style="margin-left:8px"><button data-id="${k}" class="btn secondary small-btn" onclick="window.__removeOne('${k}')">−</button></div>
              </div>`;
    })
    .join("<hr style='opacity:.06;margin:6px 0'/>");
  const total = keys.reduce((s, k) => s + cart[k].price * cart[k].qty, 0);

  orderItems.innerHTML = rows;
  orderTotal.innerText = `Total: $${formatPrice(total)}`;

  // hook remove action
  window.__removeOne = function (id) {
    removeOne(id);
  };
}

// build order link (encode order JSON in fragment - demo ONLY)
function buildOrderUrl() {
  const items = Object.values(cart).map((it) => ({
    id: it.id,
    name: it.name,
    price: it.price,
    qty: it.qty,
  }));
  const payload = {
    restaurantId,
    createdAt: new Date().toISOString(),
    items,
    total: items.reduce((s, i) => s + i.price * i.qty, 0),
  };
  const json = JSON.stringify(payload);
  const encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(json))));
  return `${location.origin}${location.pathname}#order=${encoded}`;
}

// generate QR and show link
function generateQr() {
  const url = buildOrderUrl();
  const qrPanel = document.getElementById("qrPanel");
  qrPanel.style.display = "block";
  qrPanel.innerHTML = `<div style="display:flex;gap:12px;align-items:center">
                          <div id="qrCanvas"></div>
                          <div style="color:var(--muted);word-break:break-all">${url}<div style="margin-top:6px"><button id="copyLink" class="btn secondary">Copy link</button></div></div>
                        </div>`;
  const canvasWrap = document.getElementById("qrCanvas");
  const canvas = document.createElement("canvas");
  QRCode.toCanvas(canvas, url, { width: 160, margin: 2 }, () => {
    canvasWrap.appendChild(canvas);
  });

  document.getElementById("copyLink").onclick = async () => {
    try {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard");
    } catch (e) {
      alert("Copy failed");
    }
  };
}

// wire footer buttons
document.addEventListener("click", (e) => {
  if (e.target && e.target.id === "clearOrder") {
    clearCart();
  }
  if (e.target && e.target.id === "generateQr") {
    generateQr();
  }
});

// listen DB for live updates
DB.onSnapshot(restaurantId, (doc) => {
  if (!doc.exists()) return;
  menuData = doc.data();
  renderMenu();
  renderCart(); // re-render cart visually (in case availability changed)
});
