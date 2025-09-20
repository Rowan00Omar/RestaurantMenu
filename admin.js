// admin.js
// Simple admin panel accessible at #/admin/demo-restaurant
// Use demo password stored in DB (adminPassword). For production, replace with real auth.

import { DB } from './db.js';
let restaurantId;  //="demo-restaurant";
const wrap = document.getElementById("wrap");
// Import formatPrice from menu.js
import { formatPrice } from './menu.js';
import { db } from './firebase.js'; // Import the Firestore db instance
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { loadTemplate } from './templateLoader.js';
import { menuStructure } from './menu.js';

// (function(){

// })();

export async function showAdminLogin(restId) {
  restaurantId = restId
  wrap.innerHTML = await loadTemplate('./templates/admin-login.html');
  document.getElementById("backHome").onclick = () => {
    location.hash = "";
    location.reload();
  };
  document.getElementById("adminEnter").onclick = () => {
    tryEnter(restaurantId);
  };
}

async function tryEnter(restaurantId) {
  const pass = document.getElementById("adminPass").value;
  console.log(restaurantId)
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

function showAdminPanel() {
  // Listen to live menu
  DB.onSnapshot(restaurantId, (doc) => {
    const data = doc.data();
    renderAdmin(data);
  });
}

async function renderAdmin(data) {
  wrap.innerHTML = await loadTemplate('./templates/admin.html');
  document.getElementById('adminRestaurantName').innerText = `Admin — ${data.name}`;

  const categoriesContainer = document.getElementById('adminCategories');
  // const newItemCategorySelect = document.getElementById('newItemCategory');
  let categoriesHtml = '';
  // let categoryOptionsHtml = '<option value="">Select category</option>';

  const menu = data.menu || {};
  menuStructure.forEach((key) => {
    const section = menu[key]; // Get section data based on ordered key
    if (!section) return; // Skip if section does not exist in data

    const itemsHtml = Array.from(section.items)
      .map((it) => {
        return `<div style="display:flex;justify-content:space-between;gap:12px;padding:10px;border-bottom:1px dashed rgba(255,255,255,0.04);align-items:center">
                  <div style="min-width:180px">
                    <div style="font-weight:700">${it.name}</div>
                    ${it.desc
            ? `<div style="color:var(--muted)">${it.desc}</div>`
            : ""
          }
                  </div>
                  <div style="display:flex;gap:8px;align-items:center">
                    <input type="number" min="0" step="1" value="${it.price
          }" data-section="${key}" data-id="${it.id
          }" class="priceInput" style="width:60px;padding:6px;border-radius:6px;border:1px solid #333;background:#0b0b0b;color:var(--text)"/>
                    <button class="toggleAvailability btn secondary" data-section="${key}" data-id="${it.id
          }">${it.available ? "Available" : "Unavailable"}</button>
                    <button class="deleteItem btn" data-section="${key}" data-id="${it.id
          }">Delete</button>
                  </div>
                </div>`;
      })
      .join("");

    categoriesHtml += `<div style="margin-bottom:18px">
                          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                            <h3 style="font-family:'Bebas Neue';font-size:20px;margin:0">${section.name
      }</h3>
                            <button class="deleteCategory btn" data-cat="${key}">Delete Category</button>
                          </div>
                          <div style="background:#0b0b0b;padding:10px;border:1px solid rgba(255,255,255,0.04)">${itemsHtml ||
      '<div style="color:var(--muted)">No items</div>'
      }</div>
                        </div>`;
    // categoryOptionsHtml += `<option value="${key}">${section.name}</option>`;
  });

  categoriesContainer.innerHTML = categoriesHtml;
  // newItemCategorySelect.innerHTML = categoryOptionsHtml;

  // wire events
  document.getElementById("logout").onclick = () => {
    location.hash = "";
    location.reload();
  };
  document.getElementById("copyQrLink").onclick = () => {
    setTimeout(async () => {
      try {
        await navigator.clipboard.writeText(
          location.origin + location.pathname + "#/menu/demo-restaurant"
        );
        alert("Link copied");
      } catch (e) {
        alert("Copy failed");
      }

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
      const itemToUpdate = newMenu[sec].items.find(item => item.id === id);
      if (itemToUpdate) {
        itemToUpdate.price = val;
      }
      DB.updateDoc(restaurantId, { menu: newMenu });
    });
  });

  // toggle availability
  document.querySelectorAll(".toggleAvailability").forEach((btn) => {
    btn.onclick = () => {
      const sec = btn.dataset.section;
      const id = btn.dataset.id;
      const newMenu = JSON.parse(JSON.stringify(DB.data[restaurantId].menu));
      const itemToUpdate = newMenu[sec].items.find(item => item.id === id);
      if (itemToUpdate) {
        itemToUpdate.available = !itemToUpdate.available;
      }
      DB.updateDoc(restaurantId, { menu: newMenu });
    };
  });

  // delete item
  document.querySelectorAll(".deleteItem").forEach((btn) => {
    btn.onclick = () => {
      if (!confirm("Delete item?")) return;
      const sec = btn.dataset.section;
      const id = btn.dataset.id;
      const newMenu = JSON.parse(JSON.stringify(DB.data[restaurantId].menu));
      newMenu[sec].items = newMenu[sec].items.filter(item => item.id !== id);
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
  // const addCatBtn = document.getElementById("addCategory");
  // addCatBtn.onclick = () => {
  //   const name = document.getElementById("newCatName").value.trim();
  //   if (!name) return alert("Enter category name");
  //   const id = name.toLowerCase().replace(/\s+/g, "-");
  //   const newMenu = JSON.parse(JSON.stringify(DB.data[restaurantId].menu));
  //   if (newMenu[id]) return alert("Category exists");
  //   newMenu[id] = { name, items: [] };
  //   DB.updateDoc(restaurantId, { menu: newMenu });
  //   document.getElementById("newCatName").value = "";
  // };

  // add item
  // document.getElementById("addItem").onclick = () => {
  //   const name = document.getElementById("newItemName").value.trim();
  //   const desc = document.getElementById("newItemDesc").value.trim();
  //   const price = parseFloat(document.getElementById("newItemPrice").value);
  //   // const cat = document.getElementById("newItemCategory").value;
  //   if (!name || isNaN(price) || !cat)
  //     return alert("Fill name, price, category");
  //   const id = name.toLowerCase().replace(/\s+/g, "-");
  //   const newMenu = JSON.parse(JSON.stringify(DB.data[restaurantId].menu));
  //   if (!newMenu[cat]) {
  //     newMenu[cat] = { name: cat, items: [] }; // Initialize if category doesn't exist
  //   }
  //   newMenu[cat].items.push({ id, name, desc, price, available: true });
  //   DB.updateDoc(restaurantId, { menu: newMenu });
  //   document.getElementById("newItemName").value = "";
  //   document.getElementById("newItemDesc").value = "";
  //   document.getElementById("newItemPrice").value = "";
  //   document.getElementById("newItemCategory").value = "";
  // };
} // renderAdmin

async function fetchAndDisplayOrder(orderId, displayDiv) {
  displayDiv.innerHTML = "Fetching order...";
  try {
    const orderDocRef = doc(db, "orders", orderId);
    const orderDocSnap = await getDoc(orderDocRef);

    if (!orderDocSnap.exists()) {
      displayDiv.innerHTML = `<span style="color:red;">Order with ID \`${orderId}\` not found.</span>`;
      return;
    }

    const order = orderDocSnap.data();

    let orderHtml = `<h4>Order Details (ID: ${orderId}):</h4>
                     <p>Restaurant ID: ${order.restaurantId}</p>
                     <p>Created At: ${new Date(order.createdAt).toLocaleString()}</p>
                     <p>Status: <span id="orderStatus">${order.status}</span></p>
                     <p>Total: $${formatPrice(order.total)}</p>
                     <h5>Items:</h5>
                     <ul>`;
    order.items.forEach(item => {
      orderHtml += `<li>${item.name} (x${item.qty}) - $${formatPrice(item.price * item.qty)}</li>`;
    });
    orderHtml += `</ul>`;

    if (order.status === "pending") {
      orderHtml += `<button id="markAsProcessed" class="btn green" data-order-id="${orderId}" style="margin-top:10px;">Mark as Processed</button>`;
    }

    displayDiv.innerHTML = orderHtml;

    if (order.status === "pending") {
      document.getElementById("markAsProcessed").onclick = async () => {
        await updateDoc(orderDocRef, { status: "processed" });
        alert("Order marked as processed!");
        fetchAndDisplayOrder(orderId, displayDiv); // Re-fetch to update status display
      };
    }
  } catch (e) {
    console.error("Error fetching order: ", e);
    displayDiv.innerHTML = `<span style="color:red;">Error fetching order: ${e.message}</span>`;
  }
}

let html5QrCode = null;

async function initAdminQrScannerLogic() {
  const adminQrScannerPopup = document.getElementById('adminQrScannerPopup');
  const closeAdminQrScannerPopup = document.getElementById('closeAdminQrScannerPopup');
  const qrScannerCameraDiv = document.getElementById('qrScannerCamera');
  const startCameraScanBtn = document.getElementById('startCameraScanBtn');
  const stopCameraScanBtn = document.getElementById('stopCameraScanBtn');
  const uploadQrImageBtn = document.getElementById('uploadQrImageBtn');
  const qrCodeImageInput = document.getElementById('qrCodeImageInput');
  const scannedOrderDetailsDiv = document.getElementById('scannedOrderDetails');
  const tableNumberPromptDiv = document.getElementById('tableNumberPrompt');
  const tableNumberInput = document.getElementById('tableNumberInput');
  const assignTableBtn = document.getElementById('assignTableBtn');

  let html5QrCode = null;
  let currentOrderId = null;

  closeAdminQrScannerPopup.onclick = () => {
    stopQrScanning();
    adminQrScannerPopup.classList.remove('show');
    // Clear content when closing
    scannedOrderDetailsDiv.innerHTML = '';
  };

  startCameraScanBtn.onclick = () => {
    qrScannerCameraDiv.style.display = 'block';
    startCameraScanBtn.style.display = 'none';
    stopCameraScanBtn.style.display = 'inline-block';
    scannedOrderDetailsDiv.style.display = 'none';
    tableNumberPromptDiv.style.display = 'none';

    html5QrCode = new Html5Qrcode("qrScannerCamera");
    html5QrCode.start(
      { facingMode: "environment" },
      (decodedText, decodedResult) => {
        console.log(`QR Code detected: ${decodedText}`);
        handleDecodedQrCode(decodedText);
      },
      (errorMessage) => {
        console.warn(`QR Code scanning error: ${errorMessage}`);
      }
    ).catch((err) => {
      console.error("Unable to start QR code scanner.", err);
      scannedOrderDetailsDiv.innerHTML = `<span style="color:red;">Error starting camera: ${err}</span>`;
      scannedOrderDetailsDiv.style.display = 'block';
      stopQrScanning();
    });
  };

  stopCameraScanBtn.onclick = () => {
    stopQrScanning();
  };

  uploadQrImageBtn.onclick = () => {
    html5QrCode = new Html5Qrcode("qrScannerCamera");

    qrCodeImageInput.click(); // Trigger file input click
  };

  qrCodeImageInput.onchange = (e) => {
    if (e.target.files.length > 0) {
      const imageFile = e.target.files[0];
      if (html5QrCode) {
        html5QrCode.scanFile(imageFile)
          .then(decodedText => {
            console.log(`QR Code from image: ${decodedText}`);
            handleDecodedQrCode(decodedText);
          })
          .catch(err => {
            console.error("Error scanning image: ", err);
            scannedOrderDetailsDiv.innerHTML = `<span style="color:red;">Error scanning image: ${err}</span>`;
            scannedOrderDetailsDiv.style.display = 'block';
          });
      } else {
        scannedOrderDetailsDiv.innerHTML = `<span style="color:red;">Scanner not initialized. Try starting camera first.</span>`;
        scannedOrderDetailsDiv.style.display = 'block';
      }
      closeAdminQrScannerPopup.click();
    }
  };

  assignTableBtn.onclick = async () => {
    if (!currentOrderId) {
      alert("No order scanned to assign.");
      return;
    }
    const tableNumber = tableNumberInput.value.trim();
    if (!tableNumber) {
      alert("Please enter a table number.");
      return;
    }

    // Update order in Firestore with table number and status
    const orderDocRef = doc(db, "orders", currentOrderId);
    await updateDoc(orderDocRef, { tableNumber: tableNumber, status: "received" });
    alert(`Order ${currentOrderId} assigned to table ${tableNumber} and marked as received!`);
    tableNumberInput.value = '';
    tableNumberPromptDiv.style.display = 'none';
    fetchAndDisplayOrder(currentOrderId, scannedOrderDetailsDiv); // Re-fetch to update display
  };

  function stopQrScanning() {
    if (html5QrCode) {
      html5QrCode.stop().then(() => {
        qrScannerCameraDiv.style.display = 'none';
        startCameraScanBtn.style.display = 'inline-block';
        stopCameraScanBtn.style.display = 'none';
        html5QrCode.clear(); // Clear the camera feed and resources
      }).catch((err) => {
        console.error("Error stopping QR scanner", err);
      });
    }
  }

  async function handleDecodedQrCode(decodedText) {
    stopQrScanning(); // Stop camera after successful scan

    let orderId = decodedText;
    if (decodedText.startsWith("order:")) {
      orderId = decodedText.substring(6);
    }
    currentOrderId = orderId;

    scannedOrderDetailsDiv.style.display = 'block';
    await fetchAndDisplayOrder(orderId, scannedOrderDetailsDiv);

    // Only show table number prompt if order is pending
    const orderDocRef = doc(db, "orders", orderId);
    const orderDocSnap = await getDoc(orderDocRef);
    if (orderDocSnap.exists() && orderDocSnap.data().status === "pending") {
      tableNumberPromptDiv.style.display = 'block';
    } else {
      tableNumberPromptDiv.style.display = 'none';
    }
  }
}

// Call initQrScanner when the admin panel is rendered
const originalRenderAdmin = renderAdmin;
renderAdmin = async (data) => {
  await originalRenderAdmin(data);
  document.getElementById('openAdminQrScanner').onclick = () => {
    document.getElementById('adminQrScannerPopup').classList.add('show');
    // Reset state when opening popup
    document.getElementById('qrScannerCamera').style.display = 'none';
    document.getElementById('startCameraScanBtn').style.display = 'inline-block';
    document.getElementById('stopCameraScanBtn').style.display = 'none';
    document.getElementById('scannedOrderDetails').style.display = 'none';
    document.getElementById('tableNumberPrompt').style.display = 'none';
    document.getElementById('qrCodeImageInput').value = ''; // Clear file input
  };
  initAdminQrScannerLogic(); // Initialize the new scanner logic
};
