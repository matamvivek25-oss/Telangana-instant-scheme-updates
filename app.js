// --- 1. FIREBASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyDopgzs9LOH9ANbGmXPQ1dkZW6C-jSQRIo",
    authDomain: "telangana-scheme-update.firebaseapp.com",
    projectId: "telangana-scheme-update",
    storageBucket: "telangana-scheme-update.firebasestorage.app",
    messagingSenderId: "71447675002",
    appId: "1:71447675002:web:562845548d998149d9fbc3",
    measurementId: "G-866QSX4S70"
};

// Initialize
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database();


// --- 2. ADMIN SYSTEM ---
let lastTap = 0;
const adminTrigger = document.getElementById('adminTrigger');
const adminPanel = document.getElementById('adminPanel');
const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');

// Double Tap Logic
adminTrigger.addEventListener('click', (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    if (tapLength < 500 && tapLength > 0) {
        toggleAdmin();
        e.preventDefault();
    }
    lastTap = currentTime;
});

function toggleAdmin() {
    adminPanel.classList.toggle('hidden');
    if (!adminPanel.classList.contains('hidden')) {
        // Check session
        if(sessionStorage.getItem('adminLoggedIn') !== 'true') {
            loginSection.classList.remove('hidden');
            dashboardSection.classList.add('hidden');
        } else {
            loginSection.classList.add('hidden');
            dashboardSection.classList.remove('hidden');
        }
    }
}

function verifyAdmin() {
    const input = document.getElementById('adminPassInput').value;
    const currentPass = localStorage.getItem('adminPass') || "admin123";
    
    if (input === currentPass) {
        sessionStorage.setItem('adminLoggedIn', 'true');
        alert("Login Successful! Reloading to show Admin tools...");
        window.location.reload(); // KEY FIX: Reloads to show delete buttons
    } else {
        alert("Wrong Password!");
    }
}

function logout() {
    sessionStorage.removeItem('adminLoggedIn');
    alert("Logged Out");
    window.location.reload();
}

function showChangePass() {
    const newPass = prompt("Enter new password:");
    if (newPass) localStorage.setItem('adminPass', newPass);
}


// --- 3. ADD SCHEME ---
document.getElementById('addSchemeForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const newScheme = {
        title: document.getElementById('sTitle').value,
        desc: document.getElementById('sDesc').value,
        eligibility: document.getElementById('sEligible').value,
        benefits: document.getElementById('sBenefits').value,
        docs: document.getElementById('sDocs').value,
        link: document.getElementById('sLink').value,
        image: document.getElementById('sImage').value,
        timestamp: Date.now()
    };

    db.ref('schemes').push(newScheme, (error) => {
        if (error) alert("Error: " + error.message);
        else {
            alert("Published!");
            toggleAdmin();
            e.target.reset();
        }
    });
});


// --- 4. RENDER LIST ---
const schemesContainer = document.getElementById('schemesContainer');

db.ref('schemes').on('value', (snapshot) => {
    schemesContainer.innerHTML = '';
    const data = snapshot.val();
    
    if (!data) {
        schemesContainer.innerHTML = '<p style="text-align:center; padding:20px; opacity:0.6">No updates found.</p>';
        return;
    }

    const list = Object.entries(data).reverse();
    const now = Date.now();
    const expiryTime = 15 * 24 * 60 * 60 * 1000; // 15 Days

    list.forEach(([id, scheme]) => {
        // Auto-Delete Check
        if (now - scheme.timestamp > expiryTime) return;

        const card = document.createElement('div');
        card.className = 'scheme-card';
        
        // Image Logic
        const imgHTML = scheme.image ? 
            `<div class="card-img-container"><img src="${scheme.image}" class="card-img" alt="Update"></div>` : '';

        // Delete Button Logic (Only if Admin)
        const deleteBtn = sessionStorage.getItem('adminLoggedIn') === 'true' ? 
            `<button class="delete-btn" onclick="deleteScheme('${id}')"><i class="fas fa-trash"></i></button>` : '';

        card.innerHTML = `
            ${imgHTML}
            ${deleteBtn}
            <div class="card-content">
                <h3>${scheme.title}</h3>
                <p class="desc">${scheme.desc}</p>
                <div class="meta-grid">
                    <div class="tag"><strong>Eligibility</strong> ${scheme.eligibility || '-'}</div>
                    <div class="tag"><strong>Benefits</strong> ${scheme.benefits || '-'}</div>
                    <div class="tag"><strong>Docs</strong> ${scheme.docs || '-'}</div>
                </div>
                <a href="${scheme.link}" target="_blank" class="apply-btn">View Details</a>
            </div>
        `;
        schemesContainer.appendChild(card);
    });
});

window.deleteScheme = function(id) {
    if(confirm("Delete this scheme permanently?")) {
        db.ref('schemes/' + id).remove();
    }
}

window.searchSchemes = function() {
    const input = document.getElementById('searchInput').value.toLowerCase();
    const cards = document.getElementsByClassName('scheme-card');
    for (let card of cards) {
        const title = card.querySelector('h3').innerText.toLowerCase();
        card.style.display = title.includes(input) ? "" : "none";
    }
}
