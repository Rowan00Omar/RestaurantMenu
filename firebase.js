// firebase.js
// Initialize Firebase and provide Firestore interaction functions.

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, updateDoc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Your Firebase configuration
// IMPORTANT: Replace with your actual Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyATrdvqiytGfeRrOfv9mvluHmKOdL7AZ_g",
    authDomain: "restaurant-menu-5a204.firebaseapp.com",
    projectId: "restaurant-menu-5a204",
    storageBucket: "restaurant-menu-5a204.firebasestorage.app",
    messagingSenderId: "1090732162723",
    appId: "1:1090732162723:web:abaaeb3317ca3b8fcf8916",
    measurementId: "G-56M29NNDBP"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

class FirestoreDB {
  constructor() {
    this.data = {}; // This will store cached data, similar to MockDB
  }

  async initializeData(restaurantId, initialData) {
    const docRef = doc(db, "restaurants", restaurantId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      await setDoc(docRef, initialData);
      console.log("Initial data set for restaurant:", restaurantId);
    }
  }

  onSnapshot(path, cb) {
    const docRef = doc(db, "restaurants", path);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        this.data[path] = docSnap.data(); // Cache the data
        cb({ exists: () => true, data: () => this.data[path] });
      } else {
        delete this.data[path]; // Remove from cache if document no longer exists
        cb({ exists: () => false, data: () => null });
      }
    });
  }

  async updateDoc(path, updates) {
    const docRef = doc(db, "restaurants", path);
    // Merge updates with existing data if available, otherwise just apply updates
    const currentData = this.data[path] || {};
    const mergedData = { ...currentData, ...updates };
    await setDoc(docRef, mergedData, { merge: true }); // Use setDoc with merge: true for partial updates
  }

  async setDoc(path, docData) {
    const docRef = doc(db, "restaurants", path);
    await setDoc(docRef, docData);
  }
}

export const FirebaseDB = new FirestoreDB();

// Initial data for demo restaurant (copy from original db.js)
const initialDemoData = {
  name: "RICARDO'S MENU",
  adminPassword: "admin123",
  menu: {
    starters: {
      name: "STARTERS",
      layout: "left",
      items: {
        "greek-salad": {
          id: "greek-salad",
          name: "GREEK SALAD",
          desc: "Lorem ipsum dolor sit amet, sit audire recusabo complectitur eu.",
          price: 5.0,
          available: true,
        },
        "tortilla-espanola": {
          id: "tortilla-espanola",
          name: "TORTILLA ESPAÑOLA",
          desc: "Pelletusque nece nulla non urna faucibus maximus in sed tellus.",
          price: 4.5,
          available: true,
        },
        "olivas-rellenas": {
          id: "olivas-rellenas",
          name: "OLIVAS RELLENAS",
          desc: "Audire recusabo complectitur eu.",
          price: 6.0,
          available: true,
        },
        "verduras-con-olivada": {
          id: "verduras-con-olivada",
          name: "VERDURAS CON OLIVADA",
          desc: "Pellentesque neque nulla non urna faucibus.",
          price: 6.5,
          available: true,
        },
        lasagne: {
          id: "lasagne",
          name: "LASAGNE",
          desc: "Pellentesque neque nulla non urna faucibus maximus in sed tellus.",
          price: 3.0,
          available: true,
        },
      },
    },
    mains: {
      name: "MAINS",
      layout: "right",
      items: {
        lenguado: {
          id: "lenguado",
          name: "LENGUADO",
          desc: "Lorem ipsum dolor sit amet.",
          price: 12.0,
          available: true,
        },
        "bacalao-frito": {
          id: "bacalao-frito",
          name: "BACALAO FRITO",
          desc: "Lorem ipsum dolor sit amet.",
          price: 7.0,
          available: true,
        },
        "paella-mixta": {
          id: "paella-mixta",
          name: "PAELLA MIXTA",
          desc: "Lorem ipsum dolor sit amet.",
          price: 8.5,
          available: true,
        },
        "lomo-de-salmon": {
          id: "lomo-de-salmon",
          name: "LOMO DE SALMÓN",
          desc: "Lorem ipsum dolor sit amet.",
          price: 11.5,
          available: true,
        },
        "pollo-al-horno": {
          id: "pollo-al-horno",
          name: "POLLO AL HORNO",
          desc: "Lorem ipsum dolor sit amet.",
          price: 8.0,
          available: true,
        },
      },
    },
    sides: {
      name: "SIDES",
      layout: "left",
      items: {
        fries: {
          id: "fries",
          name: "FRIES",
          price: 2.0,
          available: true,
        },
        "pepper-potatoes": {
          id: "pepper-potatoes",
          name: "PEPPER POTATOES",
          price: 2.0,
          available: true,
        },
        "green-salad": {
          id: "green-salad",
          name: "GREEN SALAD",
          price: 2.0,
          available: true,
        },
        coleslaw: {
          id: "coleslaw",
          name: "COLESLAW",
          price: 2.0,
          available: true,
        },
        "jackpot-potato": {
          id: "jackpot-potato",
          name: "JACKET POTATO",
          price: 3.0,
          available: true,
        },
        "onion-rings": {
          id: "onion-rings",
          name: "ONION RINGS",
          price: 3.0,
          available: true,
        },
        "fried-beans": {
          id: "fried-beans",
          name: "FRIED BEANS",
          price: 3.0,
          available: true,
        },
      },
    },
    desserts: {
      name: "DESSERTS",
      layout: "left",
      items: {
        "banana-split": {
          id: "banana-split",
          name: "BANANA SPLIT",
          price: 9.0,
          available: true,
        },
        "cherry-pie": {
          id: "cherry-pie",
          name: "CHERRY PIE",
          price: 2.0,
          available: true,
        },
        "choco-budor": {
          id: "choco-budor",
          name: "CHOCO BUDOR",
          price: 2.0,
          available: true,
        },
        "cookie-delight": {
          id: "cookie-delight",
          name: "COOKIE DELIGHT",
          price: 2.0,
          available: true,
        },
        "apple-pie": {
          id: "apple-pie",
          name: "APPLE PIE",
          price: 3.0,
          available: true,
        },
        "fruit-smoothie": {
          id: "fruit-smoothie",
          name: "FRUIT SMOOTHIE",
          price: 2.0,
          available: true,
        },
        "chocolate-muffin": {
          id: "chocolate-muffin",
          name: "CHOCOLATE MUFFIN",
          price: 1.5,
          available: true,
        },
      },
    },
    drinks: {
      name: "DRINKS",
      layout: "right",
      items: {
        "soft-drinks": {
          id: "soft-drinks",
          name: "SOFT DRINKS",
          price: 1.75,
          available: true,
        },
        beer: { id: "beer", name: "BEER", price: 2.0, available: true },
        "glass-of-wine": {
          id: "glass-of-wine",
          name: "GLASS OF WINE",
          price: 2.0,
          available: true,
        },
        cider: {
          id: "cider",
          name: "CIDER",
          price: 2.0,
          available: true,
        },
        "bottled-water": {
          id: "bottled-water",
          name: "BOTTLED WATER",
          price: 1.5,
          available: true,
        },
        "fresh-juice": {
          id: "fresh-juice",
          name: "FRESH JUICE",
          price: 3.0,
          available: true,
        },
        "tea-or-coffee": {
          id: "tea-or-coffee",
          name: "TEA or COFFEE",
          price: 1.5,
          available: true,
        },
      },
    },
  },
};

FirebaseDB.initializeData("demo-restaurant", initialDemoData);
