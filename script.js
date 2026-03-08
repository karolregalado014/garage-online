/**
 * PROYECTO: GarageOnline
 * DESCRIPCIÓN: Gestión dinámica de tienda de vehículos
 */

let vehiclesData = [];
let cart = [];
let selectedVehicle = null;

document.addEventListener('DOMContentLoaded', () => {
    loadVehicles();
    initEventListeners();
    runTests(); // Ejecución de pruebas automáticas
});

// --- CARGA DE DATOS ---
async function loadVehicles() {
    const container = document.getElementById('productsContainer');
    const spinner = document.getElementById('loadingSpinner');

    try {
        const response = await fetch('https://raw.githubusercontent.com/JUANCITOPENA/Pagina_Vehiculos_Ventas/refs/heads/main/vehiculos.json');
        if (!response.ok) throw new Error('Error al cargar datos');
        
        vehiclesData = await response.json();
        spinner.style.display = 'none';
        displayVehicles(vehiclesData);
    } catch (error) {
        spinner.innerHTML = `<p class="text-danger">Error: ${error.message}. Intente más tarde.</p>`;
    }
}

// --- MOSTRAR VEHÍCULOS ---
function displayVehicles(data) {
    const container = document.getElementById('productsContainer');
    container.innerHTML = '';

    data.forEach(vehicle => {
        const col = document.createElement('div');
        col.className = 'col-lg-4 col-md-6 mb-4';
        
        // Limpiar emojis del campo tipo (RegEx para remover caracteres especiales de emoji)
        const typeClean = vehicle.tipo.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}]/gu, '');

        col.innerHTML = `
            <div class="card h-100">
                <img src="${vehicle.imagen}" class="card-img-top viewDetailsBtn" data-codigo="${vehicle.codigo}" alt="${vehicle.marca}" loading="lazy" style="cursor:pointer">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${vehicle.marca} ${vehicle.modelo}</h5>
                    <p class="text-muted mb-1 small">${vehicle.categoria} | ${typeClean}</p>
                    <p class="fw-bold text-primary fs-4 mb-3">$${vehicle.precio_venta.toLocaleString()}</p>
                    <div class="mt-auto">
                        <button class="btn btn-outline-dark w-100 mb-2 viewDetailsBtn" data-codigo="${vehicle.codigo}">Ver Detalle</button>
                        <button class="btn btn-primary w-100 addToCartBtn" data-codigo="${vehicle.codigo}">
                            <i class="fas fa-cart-plus me-2"></i>Añadir al Carrito
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(col);
    });
}

// --- DELEGACIÓN DE EVENTOS ---
function initEventListeners() {
    const container = document.getElementById('productsContainer');
    
    container.addEventListener('click', (e) => {
        const target = e.target.closest('.viewDetailsBtn');
        const cartBtn = e.target.closest('.addToCartBtn');

        if (target) {
            const codigo = target.getAttribute('data-codigo');
            showDetails(codigo);
        }

        if (cartBtn) {
            const codigo = cartBtn.getAttribute('data-codigo');
            openQuantityModal(codigo);
        }
    });

    document.getElementById('searchInput').addEventListener('input', (e) => {
        filterVehicles(e.target.value);
    });

    document.getElementById('addToCartBtn').addEventListener('click', confirmAddCart);
    document.getElementById('processPaymentBtn').addEventListener('click', processPayment);
}

// --- FILTRADO ---
function filterVehicles(query) {
    const filtered = vehiclesData.filter(v => 
        v.marca.toLowerCase().includes(query.toLowerCase()) ||
        v.modelo.toLowerCase().includes(query.toLowerCase()) ||
        v.categoria.toLowerCase().includes(query.toLowerCase())
    );
    displayVehicles(filtered);
}

// --- DETALLES ---
function showDetails(codigo) {
    const vehicle = vehiclesData.find(v => v.codigo == codigo);
    const detailBody = document.getElementById('detailBody');
    const modal = new bootstrap.Modal(document.getElementById('detailModal'));
    
    detailBody.innerHTML = `
        <div class="row">
            <div class="col-md-7">
                <img src="${vehicle.imagen}" class="img-fluid rounded shadow" alt="${vehicle.marca}">
            </div>
            <div class="col-md-5">
                <h3>${vehicle.marca} ${vehicle.modelo}</h3>
                <ul class="list-group list-group-flush my-3">
                    <li class="list-group-item"><strong>Categoría:</strong> ${vehicle.categoria}</li>
                    <li class="list-group-item"><strong>Año:</strong> ${vehicle.año || 'N/A'}</li>
                    <li class="list-group-item"><strong>Precio:</strong> $${vehicle.precio_venta.toLocaleString()}</li>
                </ul>
                <button class="btn btn-primary w-100" onclick="openQuantityModal(${vehicle.codigo})">Comprar Ahora</button>
            </div>
        </div>
    `;
    modal.show();
}

// --- CARRITO ---
function openQuantityModal(codigo) {
    selectedVehicle = vehiclesData.find(v => v.codigo == codigo);
    document.getElementById('quantityInput').value = 1;
    const qModal = new bootstrap.Modal(document.getElementById('quantityModal'));
    qModal.show();
}

function confirmAddCart() {
    const qty = parseInt(document.getElementById('quantityInput').value);
    if (qty > 0) {
        addItemToCart(selectedVehicle, qty);
        bootstrap.Modal.getInstance(document.getElementById('quantityModal')).hide();
        animateCartBadge();
    }
}

function addItemToCart(vehicle, qty) {
    const existing = cart.find(item => item.codigo === vehicle.codigo);
    if (existing) {
        existing.quantity += qty;
    } else {
        cart.push({
            codigo: vehicle.codigo,
            marca: vehicle.marca,
            modelo: vehicle.modelo,
            precio: vehicle.precio_venta,
            imagen: vehicle.imagen,
            quantity: qty
        });
    }
    updateCartUI();
}

function updateCartUI() {
    const container = document.getElementById('cartItems');
    const totalSpan = document.getElementById('cartTotal');
    const countSpan = document.getElementById('cartCount');
    
    container.innerHTML = '';
    let total = 0;
    let itemsCount = 0;

    cart.forEach(item => {
        const subtotal = item.precio * item.quantity;
        total += subtotal;
        itemsCount += item.quantity;

        container.innerHTML += `
            <div class="d-flex align-items-center mb-3">
                <img src="${item.imagen}" class="cart-item-img me-3">
                <div class="flex-grow-1">
                    <h6 class="mb-0">${item.marca} ${item.modelo}</h6>
                    <small>${item.quantity} x $${item.precio.toLocaleString()}</small>
                </div>
                <div class="fw-bold">$${subtotal.toLocaleString()}</div>
            </div>
        `;
    });

    totalSpan.innerText = `$${total.toLocaleString()}`;
    countSpan.innerText = itemsCount;
}

function animateCartBadge() {
    const badge = document.getElementById('cartCount');
    badge.classList.add('pulse');
    setTimeout(() => badge.classList.remove('pulse'), 300);
}

// --- PAGO Y PDF ---
async function processPayment() {
    const name = document.getElementById('payName').value;
    const card = document.getElementById('payCard').value;

    if (!name || !card) {
        alert('Por favor complete los datos de pago');
        return;
    }

    alert('¡Pago procesado con éxito! Generando factura...');
    generateInvoice(name);
    
    cart = [];
    updateCartUI();
    
    bootstrap.Modal.getInstance(document.getElementById('paymentModal')).hide();
    bootstrap.Modal.getInstance(document.getElementById('cartModal')).hide();
}

function generateInvoice(userName) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(22);
    doc.text('FACTURA DE COMPRA - GARAGEONLINE', 20, y);
    y += 15;

    doc.setFontSize(12);
    doc.text(`Cliente: ${userName}`, 20, y);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, y + 7);
    y += 20;

    doc.text('Detalles del pedido:', 20, y);
    y += 10;

    let grandTotal = 0;
    cart.forEach(item => {
        const subtotal = item.precio * item.quantity;
        grandTotal += subtotal;
        doc.text(`${item.marca} ${item.modelo} (x${item.quantity}): $${subtotal.toLocaleString()}`, 25, y);
        y += 7;
    });

    y += 5;
    doc.setFontSize(14);
    doc.text(`TOTAL PAGADO: $${grandTotal.toLocaleString()}`, 20, y);
    
    doc.save(`Factura_GarageOnline_${Date.now()}.pdf`);
}

// --- BLOQUE DE TESTING ---
function runTests() {
    console.group("🚀 Ejecutando Pruebas Unitarias...");
    
    // Test 1: Carga de datos inicial
    setTimeout(() => {
        if (vehiclesData.length > 0) {
            console.log("✅ Test loadVehicles: PASSED (Datos cargados)");
        } else {
            console.error("❌ Test loadVehicles: FAILED (No hay datos)");
        }
    }, 2000);

    // Test 2: Lógica de Carrito
    const testVehicle = { codigo: 999, marca: "Test", modelo: "Car", precio_venta: 1000 };
    addItemToCart(testVehicle, 2);
    const found = cart.find(i => i.codigo === 999);
    if (found && found.quantity === 2) {
        console.log("✅ Test addItemToCart: PASSED");
    } else {
        console.error("❌ Test addItemToCart: FAILED");
    }

    // Test 3: UI de Carrito
    const badge = document.getElementById('cartCount').innerText;
    if (parseInt(badge) > 0) {
        console.log("✅ Test updateCartUI: PASSED");
    } else {
        console.error("❌ Test updateCartUI: FAILED");
    }

    console.groupEnd();
}