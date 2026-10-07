document.addEventListener('DOMContentLoaded', () => {
  // Mock Data Initialization (Populates default records if LocalStorage is empty)
  const initialData = [
// Export CSV Event Listener
const exportCsvBtn = document.getElementById('exportCsvBtn');

exportCsvBtn.addEventListener('click', () => {
  // Get currently filtered list matching active tab and search query
  const filteredData = listings.filter(item => {
    const matchesFilter = 
      activeFilter === 'all' ? true :
      activeFilter === 'pending' ? !item.verified :
      activeFilter === 'verified' ? item.verified : true;

    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.landlordName && item.landlordName.toLowerCase().includes(q)) ||
      (item.nin && item.nin.toLowerCase().includes(q)) ||
      (item.location && item.location.toLowerCase().includes(q));

    return matchesFilter && matchesSearch;
  });

  if (filteredData.length === 0) {
    alert("No property listings to export based on your current filters.");
    return;
  }

  // Generate CSV text string
  const csvString = generateCsvContent(filteredData);

  // Create a Blob with UTF-8 BOM to open correctly in Microsoft Excel
  const blob = new Blob(["\ufeff" + csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  // Build temporary link to trigger download
  const timestamp = new Date().toISOString().slice(0, 10);
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.setAttribute('download', `Property_Report_${activeFilter}_${timestamp}.csv`);
  
  document.body.appendChild(downloadLink);
  downloadLink.click();
  
  // Cleanup
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
});
    {
      id: "UG-101",
      title: "Modern 2-Bedroom Apartment in Ntinda",
      location: "Ntinda, Kampala",
      landlordName: "Ssemwanga Joseph",
      landlordPhone: "0705070233",
      nin: "CM92018104JKLA",
      priceUGX: 850000,
      verified: false,
      createdAt: "2026-10-01"
    },
    {
      id: "UG-102",
      title: "Furnished Studio Unit near KU Campus",
      location: "Ggaba, Kampala",
      landlordName: "Nsubuga David",
      landlordPhone: "0782939552",
      nin: "CM88045102MKN1",
      priceUGX: 450000,
      verified: true,
      createdAt: "2026-09-28"
    }
  ];

  // Retrieve listings from LocalStorage or seed initial data
  let listings = JSON.parse(localStorage.getItem('property_listings'));
  if (!listings || listings.length === 0) {
    listings = initialData;
    localStorage.setItem('property_listings', JSON.stringify(listings));
  }

  let activeFilter = 'all';
  let searchQuery = '';

  // DOM Elements
  const tableBody = document.getElementById('adminTableBody');
  const searchInput = document.getElementById('searchInput');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const ninModal = document.getElementById('ninModal');
  const modalContent = document.getElementById('modalContent');
  const closeModalBtn = document.getElementById('closeModalBtn');

  // Render Table & Metrics
  function renderDashboard() {
    updateAnalytics();
    tableBody.innerHTML = '';

    // Filter Logic
    const filtered = listings.filter(item => {
      const matchesFilter = 
        activeFilter === 'all' ? true :
        activeFilter === 'pending' ? !item.verified :
        activeFilter === 'verified' ? item.verified : true;

      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.landlordName && item.landlordName.toLowerCase().includes(q)) ||
        (item.nin && item.nin.toLowerCase().includes(q)) ||
        (item.location && item.location.toLowerCase().includes(q));

      return matchesFilter && matchesSearch;
    });
// Utility: Escape CSV field values safely
function escapeCsvValue(value) {
  if (value === null || value === undefined) return '""';
  let str = String(value);
  // If value contains quotes, commas, or newlines, enclose in double quotes and double up internal quotes
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    str = str.replace(/"/g, '""');
    return `"${str}"`;
  }
  return `"${str}"`;
}

// Utility: Build CSV string from array of property objects
function generateCsvContent(dataList) {
  const headers = [
    "Property ID",
    "Title",
    "Location",
    "Landlord Name",
    "Contact Phone",
    "Landlord NIN",
    "Price (UGX)",
    "Verification Status",
    "Created Date"
  ];

  const rows = dataList.map(item => [
    escapeCsvValue(item.id),
    escapeCsvValue(item.title),
    escapeCsvValue(item.location),
    escapeCsvValue(item.landlordName),
    escapeCsvValue(item.landlordPhone),
    escapeCsvValue(item.nin),
    escapeCsvValue(item.priceUGX),
    escapeCsvValue(item.verified ? "Verified" : "Pending Audit"),
    escapeCsvValue(item.createdAt || "N/A")
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-8 text-slate-500">No listings found matching the criteria.</td>
        </tr>`;
      return;
    }

    filtered.forEach(property => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-800/40 transition';

      tr.innerHTML = `
        <td class="px-6 py-4">
          <p class="font-semibold text-white">${property.title}</p>
          <p class="text-xs text-slate-400">📍 ${property.location} | ID: #${property.id}</p>
        </td>
        <td class="px-6 py-4">
          <p class="font-medium text-slate-200">${property.landlordName || 'N/A'}</p>
          <p class="text-xs text-slate-400">${property.landlordPhone || 'N/A'}</p>
        </td>
        <td class="px-6 py-4">
          <button class="inspect-nin-btn text-xs bg-slate-800 hover:bg-slate-700 text-blue-400 px-2.5 py-1 rounded font-mono border border-slate-700 transition" data-id="${property.id}">
            ${property.nin || 'UNREGISTERED'} 🔍
          </button>
        </td>
        <td class="px-6 py-4 font-semibold text-slate-200">
          UGX ${(property.priceUGX || 0).toLocaleString()}
        </td>
        <td class="px-6 py-4">
          ${property.verified ? 
            `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
               <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Verified
             </span>` : 
            `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
               <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Pending Audit
             </span>`
          }
        </td>
        <td class="px-6 py-4 text-right space-x-2">
          <button class="toggle-verify-btn text-xs px-3 py-1.5 rounded-lg font-medium transition ${
            property.verified ? 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-300' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
          }" data-id="${property.id}">
            ${property.verified ? 'Revoke Status' : 'Approve & Verify'}
          </button>
          <button class="delete-btn text-xs bg-red-600/20 hover:bg-red-600/40 text-red-400 px-3 py-1.5 rounded-lg font-medium transition" data-id="${property.id}">
            Delete
          </button>
        </td>
      `;

      tableBody.appendChild(tr);
    });

    attachActionListeners();
  }

  // Update Summary Analytics Metrics
  function updateAnalytics() {
    const total = listings.length;
    const verifiedCount = listings.filter(l => l.verified).length;
    const pendingCount = total - verifiedCount;
    const totalVal = listings.reduce((sum, l) => sum + Number(l.priceUGX || 0), 0);

    document.getElementById('statTotal').textContent = total;
    document.getElementById('statVerified').textContent = verifiedCount;
    document.getElementById('statPending').textContent = pendingCount;
    document.getElementById('statValue').textContent = totalVal.toLocaleString() + ' UGX';
  }

  // Attach Table Event Handlers
  function attachActionListeners() {
    // Toggle Verification Status
    document.querySelectorAll('.toggle-verify-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        listings = listings.map(item => {
          if (item.id === id) {
            return { ...item, verified: !item.verified };
          }
          return item;
        });
        saveAndReload();
      });
    });

    // Delete Property Listing
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        if (confirm(`Are you sure you want to permanently delete listing #${id}?`)) {
          listings = listings.filter(item => item.id !== id);
          saveAndReload();
        }
      });
    });

    // Inspect NIN Modal Trigger
    document.querySelectorAll('.inspect-nin-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const item = listings.find(l => l.id === id);
        if (item) {
          modalContent.innerHTML = `
            <div class="p-3 bg-slate-800 rounded-lg space-y-1">
              <p class="text-xs text-slate-400">Full Name</p>
              <p class="font-semibold text-white">${item.landlordName || 'Unregistered'}</p>
            </div>
            <div class="p-3 bg-slate-800 rounded-lg space-y-1">
              <p class="text-xs text-slate-400">National Identification Number (NIN)</p>
              <p class="font-mono text-emerald-400 font-bold text-base tracking-wide">${item.nin || 'Not Provided'}</p>
            </div>
            <div class="p-3 bg-slate-800 rounded-lg space-y-1">
              <p class="text-xs text-slate-400">Contact Phone</p>
              <p class="font-medium text-white">${item.landlordPhone || 'N/A'}</p>
            </div>
          `;
          ninModal.classList.remove('hidden');
        }
      });
    });
  }

  // Save changes to LocalStorage and refresh UI
  function saveAndReload() {
    localStorage.setItem('property_listings', JSON.stringify(listings));
    renderDashboard();
  }

  // Search Input Handler
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderDashboard();
  });

  // Filter Buttons Handler
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterBtns.forEach(b => {
        b.classList.remove('bg-blue-600', 'text-white');
        b.classList.add('bg-slate-800', 'text-slate-300');
      });
      e.target.classList.remove('bg-slate-800', 'text-slate-300');
      e.target.classList.add('bg-blue-600', 'text-white');

      activeFilter = e.target.getAttribute('data-filter');
      renderDashboard();
    });
  });

  // Modal Close
  closeModalBtn.addEventListener('click', () => {
    ninModal.classList.add('hidden');
  });

  // Initial Load
  renderDashboard();
});