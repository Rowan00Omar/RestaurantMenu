// admin.js
// Simple admin panel accessible at #/admin/demo-restaurant
// Use demo password stored in DB (adminPassword). For production, replace with real auth.

import { DB } from './db.js';
const restaurantId = "demo-restaurant";
const wrap = document.getElementById("wrap");
// Import formatPrice from menu.js
import { formatPrice } from './menu.js';

// (function(){

// })();

function showAdminLogin() {
  wrap.innerHTML = `
      <div style="background:#0b0b0b;padding:28px;border:3px solid #fff">
        <h2 style="font-family:'Bebas Neue';font-size:30px;margin:0 0 12px 0">Admin Dashboard</h2>
        <div style="color:var(--muted);margin-bottom:12px">Enter admin password to manage the menu.</div>
        <input id="adminPass" type="password" placeholder="password" style="padding:8px 10px;border-radius:6px;border:1px solid #333;width:240px;margin-bottom:10px"/>
        <div style="margin-top:8px">
          <button id="adminEnter" class="btn">Enter</button>
          <button id="backHome" class="btn secondary">Back</button>
        </div>
        <div style="margin-top:10px;color:var(--muted);font-size:0.86rem">Demo password is stored in the DB (admin123). Replace with real auth for production.</div>
      </div>
    `;
  document.getElementById("backHome").onclick = () => {
    location.hash = "";
    location.reload();
  };
  document.getElementById("adminEnter").onclick = tryEnter;
}

async function tryEnter() {
  const pass = document.getElementById("adminPass").value;
  const doc = DB.data[restaurantId];
  if (!doc) {
    alert("Restaurant not found");
    return;
  }
  if (pass !== (doc.adminPassword || "")) {
    alert("Wrong password");
    return;
  }
  showAdminPanel();
}

export function showAdminPanel(restaurantId) {
  // Listen to live menu
  DB.onSnapshot(restaurantId, (doc) => {
    const data = doc.data();
    renderAdmin(data);
  });
}

function renderAdmin(data) {
  // Build simple admin UI but styled consistent with menu
  const menu = data.menu || {};
  let categoriesHtml = "";
  Object.entries(menu).forEach(([key, section]) => {
    const itemsHtml = Object.values(section.items)
      .map((it) => {
        return `<div style="display:flex;justify-content:space-between;gap:12px;padding:10px;border-bottom:1px dashed rgba(255,255,255,0.04);align-items:center">
                  <div style="min-width:180px">
                    <div style="font-weight:700">${it.name}</div>
                    ${
                      it.desc
                        ? `<div style="color:var(--muted)">${it.desc}</div>`
                        : ""
                    }
                  </div>
                  <div style="display:flex;gap:8px;align-items:center">
                    <input type="number" min="0" step="0.01" value="${
                      it.price
                    }" data-section="${key}" data-id="${
          it.id
        }" class="priceInput" style="width:90px;padding:6px;border-radius:6px;border:1px solid #333;background:#0b0b0b;color:var(--text)"/>
                    <button class="toggleAvailability btn secondary" data-section="${key}" data-id="${
          it.id
        }">${it.available ? "Available" : "Unavailable"}</button>
                    <button class="deleteItem btn" data-section="${key}" data-id="${
          it.id
        }">Delete</button>
                  </div>
                </div>`;
      })
      .join("");

    categoriesHtml += `<div style="margin-bottom:18px">
                          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                            <h3 style="font-family:'Bebas Neue';font-size:20px;margin:0">${
                              section.name
                            }</h3>
                            <button class="deleteCategory btn" data-cat="${key}">Delete Category</button>
                          </div>
                          <div style="background:#0b0b0b;padding:10px;border:1px solid rgba(255,255,255,0.04)">${
                            itemsHtml ||
                            '<div style="color:var(--muted)">No items</div>'
                          }</div>
                        </div>`;
  });

  wrap.innerHTML = `
      <div style="background:#000;padding:18px;border:3px solid #fff">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <h2 style="font-family:'Bebas Neue';font-size:28px;margin:0">Admin — ${
              data.name
            }</h2>
            <div style="color:var(--muted);margin-top:6px">Manage availability, prices, categories and items. Changes are live.</div>
          </div>
          <div style="display:flex;gap:10px;align-items:center">
            <a href="#/menu/demo-restaurant" class="btn">View Public Menu</a>
            <button id="showQrLink" class="btn secondary">Show Menu Link</button>
            <button id="logout" class="btn secondary">Logout</button>
          </div>
        </div>

        <div style="margin-top:18px;display:grid;grid-template-columns:1fr 320px;gap:18px">
          <div>
            ${
              categoriesHtml ||
              '<div style="color:var(--muted)">No categories</div>'
            }
          </div>

          <div style="background:#0b0b0b;padding:12px;border:1px solid rgba(255,255,255,0.04)">
            <h4 style="font-family:\'Bebas Neue\';font-size:18px;margin:0 0 8px 0">Add Category</h4>
            <input id="newCatName" placeholder="Category name" style="width:100%;padding:8px;border-radius:6px;border:1px solid #333;background:#000;color:#fff;margin-bottom:8px"/>
            <button id="addCategory" class="btn">Add Category</button>

            <hr style="opacity:.06;margin:12px 0"/>

            <h4 style="font-family:\'Bebas Neue\';font-size:18px;margin:0 0 8px 0">Add Item</h4>
            <input id="newItemName" placeholder="Item name" style="width:100%;padding:8px;border-radius:6px;border:1px solid #333;background:#000;color:#fff;margin-bottom:6px"/>
            <input id="newItemDesc" placeholder="Description (optional)" style="width:100%;padding:8px;border-radius:6px;border:1px solid #333;background:#000;color:#fff;margin-bottom:6px"/>
            <input id="newItemPrice" placeholder="Price" type="number" step="0.01" style="width:100%;padding:8px;border-radius:6px;border:1px solid #333;background:#000;color:#fff;margin-bottom:6px"/>
            <select id="newItemCategory" style="width:100%;padding:8px;border-radius:6px;border:1px solid #333;background:#000;color:#fff;margin-bottom:6px">
              <option value="">Select category</option>
              ${Object.keys(data.menu)
                .map(
                  (k) => `<option value="${k}">${data.menu[k].name}</option>`
                )
                .join("")}
            </select>
            <button id="addItem" class="btn">Add Item</button>
          </div>
        </div>
      </div>

      <div style="background:#0b0b0b;padding:12px;border:1px solid rgba(255,255,255,0.04); margin-top: 18px;">
        <h4 style="font-family:\'Bebas Neue\';font-size:18px;margin:0 0 8px 0">Scan Order QR</h4>
        <input id="orderQrInput" placeholder="Paste QR link here" style="width:100%;padding:8px;border-radius:6px;border:1px solid #333;background:#000;color:#fff;margin-bottom:8px"/>
        <button id="processOrder" class="btn">Process Order</button>
        <div id="scannedOrderDetails" style="margin-top:10px;color:var(--muted);"></div>
      </div>

      <div id="menuLinkPanel" style="max-width:900px;margin-top:10px;display:none">
        <div style="background:#111;padding:10px;border:1px solid rgba(255,255,255,0.04)">
          <div style="margin-bottom:8px;color:var(--muted)">Public menu link:</div>
          <div style="word-break:break-all;color:var(--muted)">${
            location.origin + location.pathname
          }#/menu/demo-restaurant</div>
          <div style="margin-top:8px"><button id="copyMenuLink" class="btn">Copy link</button></div>
        </div>
      </div>
    `;

  // wire events
  document.getElementById("logout").onclick = () => {
    location.hash = "";
    location.reload();
  };
  document.getElementById("showQrLink").onclick = () => {
    const panel = document.getElementById("menuLinkPanel");
    panel.style.display = panel.style.display === "block" ? "none" : "block";
    setTimeout(() => {
      const btn = document.getElementById("copyMenuLink");
      if (btn)
        btn.onclick = async () => {
          try {
            await navigator.clipboard.writeText(
              location.origin + location.pathname + "#/menu/demo-restaurant"
            );
            alert("Link copied");
          } catch (e) {
            alert("Copy failed");
          }
        };
    }, 50);
  };

  // price inputs
  document.querySelectorAll(".priceInput").forEach((inp) => {
    inp.addEventListener("change", (ev) => {
      const sec = inp.dataset.section;
      const id = inp.dataset.id;
      const val = parseFloat(inp.value);
      if (isNaN(val) || val < 0) {
        alert("Invalid price");
        return;
      }
      // update DB
      const newMenu = JSON.parse(JSON.stringify(DB.data[restaurantId].menu));
      newMenu[sec].items[id].price = val;
      DB.updateDoc(restaurantId, { menu: newMenu });
    });
  });

  // toggle availability
  document.querySelectorAll(".toggleAvailability").forEach((btn) => {
    btn.onclick = () => {
      const sec = btn.dataset.section;
      const id = btn.dataset.id;
      const newMenu = JSON.parse(JSON.stringify(DB.data[restaurantId].menu));
      newMenu[sec].items[id].available = !newMenu[sec].items[id].available;
      DB.updateDoc(restaurantId, { menu: newMenu });
    };
  });

  document.getElementById("processOrder").onclick = processOrderQr;

  // delete item
  document.querySelectorAll(".deleteItem").forEach((btn) => {
    btn.onclick = () => {
      if (!confirm("Delete item?")) return;
      const sec = btn.dataset.section;
      const id = btn.dataset.id;
      const newMenu = JSON.parse(JSON.stringify(DB.data[restaurantId].menu));
      delete newMenu[sec].items[id];
      DB.updateDoc(restaurantId, { menu: newMenu });
    };
  });

  // delete category
  document.querySelectorAll(".deleteCategory").forEach((btn) => {
    btn.onclick = () => {
      if (!confirm("Delete category and all its items?")) return;
      const cat = btn.dataset.cat;
      const newMenu = JSON.parse(JSON.stringify(DB.data[restaurantId].menu));
      delete newMenu[cat];
      DB.updateDoc(restaurantId, { menu: newMenu });
    };
  });

  // add category
  const addCatBtn = document.getElementById("addCategory");
  addCatBtn.onclick = () => {
    const name = document.getElementById("newCatName").value.trim();
    if (!name) return alert("Enter category name");
    const id = name.toLowerCase().replace(/\s+/g, "-");
    const newMenu = JSON.parse(JSON.stringify(DB.data[restaurantId].menu));
    if (newMenu[id]) return alert("Category exists");
    newMenu[id] = { name, items: {} };
    DB.updateDoc(restaurantId, { menu: newMenu });
    document.getElementById("newCatName").value = "";
  };

  // add item
  document.getElementById("addItem").onclick = () => {
    const name = document.getElementById("newItemName").value.trim();
    const desc = document.getElementById("newItemDesc").value.trim();
    const price = parseFloat(document.getElementById("newItemPrice").value);
    const cat = document.getElementById("newItemCategory").value;
    if (!name || isNaN(price) || !cat)
      return alert("Fill name, price, category");
    const id = name.toLowerCase().replace(/\s+/g, "-");
    const newMenu = JSON.parse(JSON.stringify(DB.data[restaurantId].menu));
    newMenu[cat].items[id] = { id, name, desc, price, available: true };
    DB.updateDoc(restaurantId, { menu: newMenu });
    document.getElementById("newItemName").value = "";
    document.getElementById("newItemDesc").value = "";
    document.getElementById("newItemPrice").value = "";
    document.getElementById("newItemCategory").value = "";
  };
} // renderAdmin

function processOrderQr() {
  const qrInput = document.getElementById("orderQrInput");
  const orderDetailsDiv = document.getElementById("scannedOrderDetails");
  const url = qrInput.value;
  
  if (!url) {
    orderDetailsDiv.innerHTML = "Please enter a QR link.";
    return;
  }
  
  try {
    const hash = url.split("#order=")[1];
    if (!hash) {
      throw new Error("Invalid order QR link.");
    }
    const decoded = decodeURIComponent(atob(hash));
    const order = JSON.parse(decoded);
    
    let orderHtml = `<h4>Order Details:</h4>
                     <p>Restaurant ID: ${order.restaurantId}</p>
                     <p>Created At: ${new Date(order.createdAt).toLocaleString()}</p>
                     <p>Total: $${formatPrice(order.total)}</p>
                     <h5>Items:</h5>
                     <ul>`;
    order.items.forEach(item => {
      orderHtml += `<li>${item.name} (x${item.qty}) - $${formatPrice(item.price * item.qty)}</li>`;
    });
    orderHtml += `</ul>`;
    orderDetailsDiv.innerHTML = orderHtml;
    qrInput.value = ""; // Clear the input after processing
  } catch (e) {
    orderDetailsDiv.innerHTML = `<span style="color:red;">Error processing order: ${e.message}</span>`;
  }
}
