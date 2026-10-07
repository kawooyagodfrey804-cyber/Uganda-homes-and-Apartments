const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root123',
    database: 'uganda_rentals_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection and query live properties with updated owner credentials
pool.query(`
    SELECT p.*, o.full_name AS owner_name, o.phone_number, o.whatsapp_number, o.is_verified 
    FROM properties p 
    JOIN owners o ON p.owner_id = o.owner_id 
    ORDER BY p.updated_at DESC
`, (err, results) => {
    if (err) throw err;
    console.log('Fetched live properties:', results);
});

module.exports = pool.promise();
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onChildAdded, set, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const listingsRef = ref(db, 'listings');

// Listen for newly posted rentals in real-time
onChildAdded(listingsRef, (snapshot) => {
    const listing = snapshot.val();
    const container = document.getElementById('listings-container');
    
    // Create element and prepend to DOM with updated owner credentials
    const element = document.createElement('div');
    element.innerHTML = `<h4>${listing.title} - UGX ${listing.price}</h4><p>Owner Contact: ${listing.phone}</p>`;
    container.prepend(element);
});
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());

// In-memory or database storage mock
let listings = [];

// Endpoint to post a new rental with updated owner credentials
api.post('/api/listings', (req, res) => {
    const { title, price, location, ownerName, phone, whatsapp, email, imageUrl } = req.body;
    
    const newListing = {
        id: Date.now().toString(),
        title,
        price,
        location,
        owner: {
            name: ownerName,
            phone: phone,          // e.g., 0782939552
            whatsapp: whatsapp,    // e.g., 0705070233
            email: email
        },
        imageUrl,
        updatedAt: new Date().toISOString()
    };

    listings.unshift(newListing); // Add to the beginning of the feed

    // Broadcast the newly posted listing and updated credentials in real-time to all connected clients
    io.emit('new_listing', newListing);

    res.status(201).json({ success: true, data: newListing });
});

// WebSocket connection listener
io.on('connection', (socket) => {
    console.log('Client connected to live feed:', socket.id);
    
    // Send existing listings upon connection
    socket.emit('init_listings', listings);
});

server.listen(5000, () => {
    console.log('Server running on port 5000');
});
function loadLiveProperties() {
    fetch('/api/properties/all')
        .then(res => res.json())
        .then(data => {
            if (!data.success) return;
            
            const container = document.getElementById('listings-container');
            container.innerHTML = ''; // Clear container before rendering updated list

            data.data.forEach(item => {
                const card = document.createElement('div');
                card.className = 'rental-card';
                card.innerHTML = `
                    <img src="${item.image_url}" alt="${item.title}" style="width:100%; border-radius:8px;">
                    <h3>${item.title}</h3>
                    <p><strong>Price:</strong> UGX ${Number(item.price_ugx).toLocaleString()}</p>
                    <p><strong>Location:</strong> 📍 ${item.location}</p>
                    <div class="contact-box">
                        <p><strong>Contact:</strong> ${item.owner_name}</p>
                        <a href="tel:${item.phone_number}">📞 Call</a> | 
                        <a href="https://wa.me/256${item.whatsapp_number.replace(/^0/, '')}" target="_blank">💬 WhatsApp</a>
                    </div>
                `;
                container.appendChild(card);
            });
        });
}

// Initial fetch on page load
loadLiveProperties();

// Auto-refresh property feed every 15 seconds to pull newly aggregated items instantly
setInterval(loadLiveProperties, 15000);
// Function to render property map using OpenStreetMap
function renderPropertyMap(lat, lng, title) {
  // Clear existing map instance if re-rendering
  if (window.activeMap) {
    window.activeMap.remove();
  }

  // Initialize map centered at property coordinates (Default: Kampala - Ntinda ~ 0.3522, 32.6181)
  const map = L.map('propertyMap').setView([lat, lng], 15);
  window.activeMap = map;

  // Load free OpenStreetMap map tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  // Add custom marker pin
  const marker = L.marker([lat, lng]).addTo(map);
  
  // Attach informative popup
  marker.bindPopup(`<b>${title}</b><br>Exact property location`).openPopup();
}

// Example Execution
renderPropertyMap(0.3522, 32.6181, "2-Bedroom Apartment in Ntinda");
// Function to construct pre-filled WhatsApp booking link
function setupWhatsAppBooking(property) {
  const btn = document.getElementById('whatsappBookingBtn');

  // Sanitize landlord phone number into international format (+256)
  // Converts "0705070233" -> "256705070233"
  let formattedPhone = property.landlordPhone.replace(/\s+/g, '');
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '256' + formattedPhone.substring(1);
  }

  // Formulate structured inquiry message
  const message = `Hello, I am interested in scheduling a physical inspection for:
- Property ID: #${property.id}
- Listing: ${property.title}
- Rent: UGX ${property.priceUGX.toLocaleString()}/month
- Location: ${property.location}

Is this property available for a viewing this week?`;

  // Encode text parameter for URL compatibility
  const encodedMessage = encodeURIComponent(message);

  // Set final WhatsApp API URL
  btn.href = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}

// Example Data Object
const currentProperty = {
  id: "UG-104",
  title: "Modern 2-Bedroom Apartment in Ntinda",
  priceUGX: 800000,
  location: "Ntinda, Kampala",
  landlordPhone: "0705070233" // Uses your direct contact
};

setupWhatsAppBooking(currentProperty);

// Function to render property map using OpenStreetMap
function renderPropertyMap(lat, lng, title) {
  // Clear existing map instance if re-rendering
  if (window.activeMap) {
    window.activeMap.remove();
  }

  // Initialize map centered at property coordinates (Default: Kampala - Ntinda ~ 0.3522, 32.6181)
  const map = L.map('propertyMap').setView([lat, lng], 15);
  window.activeMap = map;

  // Load free OpenStreetMap map tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  // Add custom marker pin
  const marker = L.marker([lat, lng]).addTo(map);
  
  // Attach informative popup
  marker.bindPopup(`<b>${title}</b><br>Exact property location`).openPopup();
}

// Example Execution
renderPropertyMap(0.3522, 32.6181, "2-Bedroom Apartment in Ntinda");

};

