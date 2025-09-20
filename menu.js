// menu.js
// Renders the printed-style menu using data from MockDB
// Handles order cart, sticky footer, QR generation

import { DB } from "./db.js";
import { db } from "./firebase.js"; // Import the Firestore db instance
import {
  collection,
  addDoc,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { loadTemplate } from './templateLoader.js';
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

export const menuStructure = ["starters", "mains", "sides", "desserts", "drinks"];

// Build main template (header + columns)
export async function renderMenu() {
  if (!menuData) return;
  const doc = menuData;

  wrap.innerHTML = await loadTemplate('./templates/menu.html');

  document.getElementById('headerImgLeft').src = "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?auto=format&fit=crop&w=800&q=60";
  document.getElementById('headerImgRight').src = "https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=800&q=60";


  menuStructure.forEach((key) => {
    const section = doc.menu[key];
    if (!section) return;

    let sectionHtml = '';
    if (key === "sides") {
      const items = Array.from(section.items)
        .map((it) => {
          return `<li style="display:flex;justify-content:space-between;padding:4px 0">
                  <span>${it.name}</span>
                  <span class="${it.available ? "" : "unavailable"
            }">${formatPrice(it.price)}</span>
                </li>`;
        })
        .join("");
      sectionHtml = `<div>
                      <h3 class="section-title">${section.name}</h3>
                      <ul class="small-list">${items}</ul>
                    </div>`;
    } else {
      const itemsHtml = Array.from(section.items)
        .map((it) => {
          const classes = it.available ? "available" : "unavailable";
          return `<div class="menu-item ${classes}" data-id="${it.id
            }" data-section="${key}" ${it.available ? "" : 'aria-disabled="true"'
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
      sectionHtml = `<div>
                      <h3 class="section-title">${section.name}</h3>
                      <div class="menu-list">${itemsHtml}</div>
                    </div>`;
    }
    document.getElementById(`${key}Section`).innerHTML = sectionHtml;
  });

  window.__menuClick = (sectionId, itemId) => {
    addToCart(sectionId, itemId);
  };
  updateWrapPadding(); // Initial padding update
}

// Cart functions
function addToCart(sectionId, itemId) {
  const item = menuData.menu[sectionId].items.find(it => it.id === itemId);
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
  // const qrPanel = document.getElementById("qrPanel");
  // qrPanel.style.display = "none";
  // qrPanel.innerHTML = "";

  const keys = Object.keys(cart);
  if (keys.length === 0) {
    orderSummary.style.display = "none";
    updateWrapPadding(); // Update padding when cart is empty
    return;
  }
  orderSummary.style.display = "block";
  const rows = keys
    .map((k) => {
      const it = cart[k];
      return `<div style="display:flex;gap:8px;align-items:center">
                <div style="min-width:220px">${it.name
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
  updateWrapPadding(); // Update padding after cart is rendered
}

// generate QR and show link
async function generateQr() {
  if (Object.keys(cart).length === 0) {
    alert("Your cart is empty!");
    return;
  }

  const orderPayload = {
    restaurantId,
    createdAt: new Date().toISOString(),
    items: Object.values(cart).map((it) => ({
      id: it.id,
      name: it.name,
      price: it.price,
      qty: it.qty,
    })),
    total: Object.values(cart).reduce((s, i) => s + i.price * i.qty, 0),
    status: "pending", // Add a status for tracking
  };

  try {
    const docRef = await addDoc(collection(db, "orders"), orderPayload);
    const orderId = docRef.id;
    clearCart(); // Clear cart after placing order

    const qrData = `order:${orderId}`;
    // Get the element where the QR code will be displayed
    const qrElement = document.getElementById('qrcode');

    // // Define the data for the QR code
    // const qrData = 'https://www.example.com'; // Replace with your desired URL or text

    // Create a new QRCode instance
    const qrcode = new QRCode(qrElement, {
      text: qrData,
      width: 128,
      height: 128,
      colorDark: '#000000', // Dark color for the QR code modules
      colorLight: '#ffffff', // Light color for the background
      correctLevel: QRCode.CorrectLevel.H // Error correction level (L, M, Q, H)
    });

    // If you need to generate a new QR code with different data later,
    // you can use the makeCode method:
    qrcode.makeCode('New QR code data');

    // const qrPanel = document.getElementById("qrPanel");
    // qrPanel.style.display = "block";
    // qrPanel.innerHTML = `<div style="display:flex;flex-direction:column;gap:12px;align-items:center">
    //                         <div id="qrCanvas"></div>
    //                         <div style="color:var(--muted);word-break:break-all">Order ID: ${orderId}<div style="margin-top:6px"><button id="copyOrderId" class="btn secondary">Copy Order ID</button></div></div>
    //                       </div>`;
    // const canvasWrap = document.getElementById("qrCanvas");
    // const canvas = document.createElement("canvas");
    // console.log("window.QRCode before toCanvas:", window.QRCode);
    // window.QRCode.toCanvas(canvas, qrData, { width: 160, margin: 2 }, () => {
    //   canvasWrap.appendChild(canvas);
    // });

    // document.getElementById("copyOrderId").onclick = async () => {
    //   try {
    //     await navigator.clipboard.writeText(orderId);
    //     alert("Order ID copied to clipboard");
    //   } catch (e) {
    //     alert("Copy failed");
    //   }
    // };
  } catch (e) {
    console.error("Error placing order: ", e);
    alert("Failed to place order. Please try again.");
  }
}

function updateWrapPadding() {
  const orderSummary = document.getElementById("orderSummary");
  const wrap = document.getElementById("wrap");
  if (orderSummary && wrap) {
    const summaryHeight = orderSummary.offsetHeight;
    if (orderSummary.style.display !== 'none' && summaryHeight > 0) {
      // Add a small buffer (e.g., 20px) to the summary height
      wrap.style.paddingBottom = `${summaryHeight + 20}px`;
    } else {
      // Default padding when order summary is not visible
      wrap.style.paddingBottom = '30px';
    }
  }
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
