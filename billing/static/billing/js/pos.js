document.addEventListener('DOMContentLoaded', () => {
    const cart = new Map();
    const results = document.getElementById('productResults');
    const cartBody = document.getElementById('cartBody');
    const grandTotal = document.getElementById('grandTotal');
    const csrf = document.querySelector('[name=csrfmiddlewaretoken]').value;

    const money = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;
    const debounce = (fn, delay = 250) => {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    };

    const totals = () => {
        let subtotal = 0;
        cart.forEach((item) => { subtotal += item.price * item.quantity; });
        const discount = Number(document.getElementById('discount').value || 0);
        const tax = Number(document.getElementById('taxPercent').value || 0);
        const gst = Number(document.getElementById('gstPercent').value || 0);
        const taxable = Math.max(subtotal - discount, 0);
        const total = taxable + (taxable * tax / 100) + (taxable * gst / 100);
        grandTotal.textContent = money(total);
        return { subtotal, discount, tax, gst, total };
    };

    const renderCart = () => {
        cartBody.innerHTML = '';
        cart.forEach((item) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.barcode}</td>
                <td>
                    <div class="input-group input-group-sm" style="width: 132px">
                        <button class="btn btn-outline-secondary qty-dec" data-id="${item.id}" type="button">-</button>
                        <input class="form-control text-center qty-input" data-id="${item.id}" value="${item.quantity}" type="number" min="1" max="${item.stock}">
                        <button class="btn btn-outline-secondary qty-inc" data-id="${item.id}" type="button">+</button>
                    </div>
                </td>
                <td>${money(item.price)}</td>
                <td>${money(item.price * item.quantity)}</td>
                <td><button class="icon-btn danger remove-item" data-id="${item.id}" title="Remove"><i class="bi bi-x-lg"></i></button></td>
            `;
            cartBody.appendChild(row);
        });
        totals();
    };

    const addToCart = (product) => {
        const current = cart.get(product.id);
        if (current) {
            current.quantity = Math.min(current.quantity + 1, current.stock);
        } else {
            cart.set(product.id, { ...product, quantity: 1, stock: product.quantity });
        }
        renderCart();
    };

    const renderProducts = (products) => {
        results.innerHTML = products.map((p) => `
            <button class="product-card text-start" data-product="${encodeURIComponent(JSON.stringify(p))}">
                <strong>${p.name}</strong>
                <small>${p.category} | ${p.barcode}</small>
                <div class="d-flex justify-content-between mt-2"><span>${money(p.price)}</span><span>${p.quantity} in stock</span></div>
            </button>
        `).join('') || '<p class="empty">No matching products.</p>';
    };

    const lookup = async (params) => {
        const response = await fetch(`${window.POS_ENDPOINTS.lookup}?${new URLSearchParams(params)}`);
        const data = await response.json();
        renderProducts(data.products);
        if (params.barcode && data.products.length === 1) addToCart(data.products[0]);
    };

    document.getElementById('productSearch').addEventListener('input', debounce((event) => {
        const q = event.target.value.trim();
        if (q.length >= 2) lookup({ q });
    }));
    document.getElementById('barcodeInput').addEventListener('change', (event) => {
        const barcode = event.target.value.trim();
        if (barcode) lookup({ barcode });
    });
    results.addEventListener('click', (event) => {
        const card = event.target.closest('.product-card');
        if (card) addToCart(JSON.parse(decodeURIComponent(card.dataset.product)));
    });
    cartBody.addEventListener('click', (event) => {
        const id = Number(event.target.closest('[data-id]')?.dataset.id);
        if (!id) return;
        const item = cart.get(id);
        if (event.target.closest('.qty-inc')) item.quantity = Math.min(item.quantity + 1, item.stock);
        if (event.target.closest('.qty-dec')) item.quantity = Math.max(item.quantity - 1, 1);
        if (event.target.closest('.remove-item')) cart.delete(id);
        renderCart();
    });
    cartBody.addEventListener('change', (event) => {
        if (!event.target.classList.contains('qty-input')) return;
        const id = Number(event.target.dataset.id);
        const item = cart.get(id);
        item.quantity = Math.max(1, Math.min(Number(event.target.value || 1), item.stock));
        renderCart();
    });
    ['discount', 'taxPercent', 'gstPercent'].forEach((id) => document.getElementById(id).addEventListener('input', totals));
    document.getElementById('clearCart').addEventListener('click', () => { cart.clear(); renderCart(); });

    document.getElementById('generateBill').addEventListener('click', async () => {
        if (!cart.size) {
            Swal.fire('Cart is empty', 'Add products before generating a bill.', 'warning');
            return;
        }
        const payload = {
            customer_name: document.getElementById('customerName').value || 'Walk-in Customer',
            customer_phone: document.getElementById('customerPhone').value || '0000000000',
            discount: document.getElementById('discount').value || 0,
            tax_percent: document.getElementById('taxPercent').value || 0,
            gst_percent: document.getElementById('gstPercent').value || 0,
            payment_method: document.getElementById('paymentMethod').value,
            items: Array.from(cart.values()).map((item) => ({ product_id: item.id, quantity: item.quantity }))
        };
        const response = await fetch(window.POS_ENDPOINTS.createBill, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!data.ok) {
            Swal.fire('Billing failed', data.error, 'error');
            return;
        }
        cart.clear();
        renderCart();
        const printBill = document.getElementById('printBill');
        const downloadPdf = document.getElementById('downloadPdf');
        printBill.href = data.detail_url;
        downloadPdf.href = data.pdf_url;
        printBill.classList.remove('disabled');
        downloadPdf.classList.remove('disabled');
        Swal.fire('Bill generated', `${data.invoice_number} | ${money(data.grand_total)}`, 'success');
    });

    document.getElementById('startScanner').addEventListener('click', async () => {
        const scannerBox = document.getElementById('scanner');
        scannerBox.classList.toggle('d-none');
        if (scannerBox.dataset.started) return;
        scannerBox.dataset.started = 'true';
        try {
            const scanner = new Html5Qrcode('scanner');
            await scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: 220 }, (decodedText) => {
                document.getElementById('barcodeInput').value = decodedText;
                lookup({ barcode: decodedText });
            });
        } catch (error) {
            Swal.fire('Scanner unavailable', 'Use the barcode input field for this device.', 'info');
        }
    });
});
