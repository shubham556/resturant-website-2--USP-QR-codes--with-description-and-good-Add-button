document.addEventListener('DOMContentLoaded', function () {

    /* ===========================================
       CART STATE
       =========================================== */
    let cart = [];  // { name, price, qty }

    function saveCart() {
        localStorage.setItem('hsv_cart', JSON.stringify(cart));
    }
    function loadCart() {
        try { cart = JSON.parse(localStorage.getItem('hsv_cart')) || []; } catch(e) { cart = []; }
    }
    loadCart();

    function escapeHtml(str) {
        return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    /* ===========================================
       WHATSAPP AUTO-CONFIRMATION (Green API)
       -------------------------------------------
       Setup (one-time, 2 minutes):
       1. Go to https://green-api.com and create a FREE account
       2. Create an Instance → scan the QR code with your WhatsApp
       3. Copy your "Instance ID" and "API Token" below
       4. Done! Customers will now receive WhatsApp confirmations.
       =========================================== */
    const WHATSAPP_API = {
        instanceId : '7103522358',
        token      : '5a82a135f73c4d6898842617561cdf47549ddd39955848f8af',
    };

    async function sendWhatsAppConfirmation(customerPhone, details) {
        // Skip if not configured
        if (!WHATSAPP_API.instanceId || !WHATSAPP_API.token) {
            console.warn('WhatsApp API not configured.');
            return false;
        }

        const phone = customerPhone.replace(/[\s\-\+\(\)]/g, '');
        const phoneNum = phone.startsWith('91') ? phone : '91' + phone;

        const msg = `\u{1F37D}\uFE0F *Reservation Confirmed \u2013 Hotel Sri Vaari*\n\n` +
            `Hello ${details.name}! Your table has been reserved.\n\n` +
            `\u{1F4C5} *Date:* ${details.date}\n` +
            `\u{1F550} *Time:* ${details.time}\n` +
            `\u{1F465} *Guests:* ${details.guests}\n` +
            (details.requests ? `\u{1F4DD} *Requests:* ${details.requests}\n` : '') +
            `\nWe look forward to serving you!\nFor any changes call us at 9829625389.\n\nThank you \u{1F64F} \u2013 Hotel Sri Vaari`;

        try {
            const url = `https://api.green-api.com/waInstance${WHATSAPP_API.instanceId}/sendMessage/${WHATSAPP_API.token}`;
            console.log('Sending WhatsApp to:', phoneNum);
            const res = await fetch(url, {
                method : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body   : JSON.stringify({ chatId: phoneNum + '@c.us', message: msg })
            });
            const data = await res.json();
            console.log('WhatsApp API response:', data);
            return res.ok;
        } catch (err) {
            console.warn('WhatsApp send failed:', err);
            return false;
        }
    }

    /* ===========================================
       EMAIL CONFIRMATION TO CUSTOMER (EmailJS)
       -------------------------------------------
       Setup (one-time, 5 minutes):
       1. Go to https://www.emailjs.com and Sign Up (free: 200 emails/month)
       2. Go to "Email Services" → Add Service → Gmail → connect your Gmail
       3. Go to "Email Templates" → Create New Template:
          - Subject: Reservation Confirmed - Hotel Sri Vaari
          - Body (paste this):
              Hello {{to_name}},

              Your reservation at Hotel Sri Vaari is confirmed!

              Date: {{date}}
              Time: {{time}}
              Guests: {{guests}}
              {{requests}}

              For changes, call us at 9829625389.

              Thank you!
              Hotel Sri Vaari
          - To Email: {{to_email}}
       4. Copy Service ID, Template ID, and your Public Key (from Account page)
       5. Paste them below. Done!
       =========================================== */
    const EMAILJS_CONFIG = {
        publicKey  : 'Ay471LoXo-yjrZ552',
        serviceId  : 'service_vi64if8',
        templateId : 'template_au3mi7j',
    };

    // Initialize EmailJS
    if (EMAILJS_CONFIG.publicKey) {
        emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });
    }

    async function sendCustomerEmail(toEmail, details) {
        if (!EMAILJS_CONFIG.publicKey || !EMAILJS_CONFIG.serviceId || !EMAILJS_CONFIG.templateId) {
            console.warn('EmailJS not configured — customer email not sent.');
            return false;
        }
        try {
            const res = await emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, {
                to_email : toEmail,
                to_name  : details.name,
                date     : details.date,
                time     : details.time,
                guests   : details.guests,
                requests : details.requests ? 'Special Requests: ' + details.requests : '',
            });
            console.log('EmailJS sent:', res.status, res.text);
            return res.status === 200;
        } catch (err) {
            console.warn('EmailJS failed:', err);
            return false;
        }
    }

    /* ===========================================
       MENU: RENDER + TABS
       =========================================== */
    const menuContainer = document.getElementById('menu-container');
    const menuTabsWrap  = document.getElementById('menu-tabs');

    // "All" tab
    const allTab = document.createElement('button');
    allTab.classList.add('menu-tab-btn', 'active');
    allTab.textContent = 'All';
    allTab.dataset.cat = 'all';
    menuTabsWrap.appendChild(allTab);

    menu.forEach(category => {
        const tab = document.createElement('button');
        tab.classList.add('menu-tab-btn');
        tab.textContent = category.category;
        tab.dataset.cat = category.category;
        menuTabsWrap.appendChild(tab);

        const card = document.createElement('div');
        card.classList.add('menu-category');
        card.dataset.cat = category.category;

        const title = document.createElement('h3');
        title.textContent = category.category;
        card.appendChild(title);

        const ul = document.createElement('ul');
        category.items.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="menu-item-info">
                    <span class="menu-item-name">${item.name}</span>
                    <span class="menu-item-price">&#8377;${item.price.toFixed(2)}</span>
                </div>
                <button class="add-to-cart-btn" data-name="${item.name}" data-price="${item.price}"><span class="btn-label">+ Add</span><span class="btn-qty-badge"></span></button>
            `;
            ul.appendChild(li);
        });
        card.appendChild(ul);
        menuContainer.appendChild(card);
    });

    // Tab click → filter
    menuTabsWrap.addEventListener('click', function (e) {
        if (!e.target.classList.contains('menu-tab-btn')) return;
        document.querySelectorAll('.menu-tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const sel = e.target.dataset.cat;
        document.querySelectorAll('.menu-category').forEach(card => {
            card.style.display = (sel === 'all' || card.dataset.cat === sel) ? '' : 'none';
        });
    });

    // Add-to-cart clicks (delegated)
    menuContainer.addEventListener('click', function (e) {
        const btn = e.target.closest('.add-to-cart-btn');
        if (!btn) return;
        const name  = btn.dataset.name;
        const price = parseFloat(btn.dataset.price);
        addToCart(name, price);
        // Mini feedback
        const label = btn.querySelector('.btn-label');
        if (label) label.textContent = '✓ Added';
        btn.classList.add('added');
        setTimeout(() => { if (label) label.textContent = '+ Add'; btn.classList.remove('added'); }, 800);
    });

    /* ===========================================
       CART LOGIC
       =========================================== */
    function addToCart(name, price) {
        const existing = cart.find(i => i.name === name);
        if (existing) { existing.qty++; } else { cart.push({ name, price, qty: 1, note: '' }); }
        saveCart();
        renderCart();
    }
    function removeFromCart(name) {
        cart = cart.filter(i => i.name !== name);
        saveCart();
        renderCart();
    }
    function changeQty(name, delta) {
        const item = cart.find(i => i.name === name);
        if (!item) return;
        item.qty += delta;
        if (item.qty <= 0) { removeFromCart(name); return; }
        saveCart();
        renderCart();
    }
    function clearCart() {
        cart = [];
        saveCart();
        renderCart();
    }
    function getTotal() {
        return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    }

    /* ===========================================
       CART UI
       =========================================== */
    const cartFloat    = document.getElementById('cart-float');
    const cartBadge    = document.getElementById('cart-badge');
    const cartDrawer   = document.getElementById('cart-drawer');
    const cartOverlay  = document.getElementById('cart-overlay');
    const cartItemsDiv = document.getElementById('cart-items');
    const cartTotalEl  = document.getElementById('cart-total-amount');
    const checkoutBtn  = document.getElementById('cart-checkout-btn');
    const clearBtn     = document.getElementById('cart-clear-btn');
    const cartCloseBtn = document.getElementById('cart-close');

    function renderCart() {
        const count = cart.reduce((s, i) => s + i.qty, 0);
        cartBadge.textContent = count;
        cartFloat.classList.toggle('has-items', count > 0);

        if (cart.length === 0) {
            cartItemsDiv.innerHTML = '<p class="cart-empty">Your cart is empty.<br>Add items from the menu!</p>';
            checkoutBtn.disabled = true;
            clearBtn.style.display = 'none';
        } else {
            let html = '';
            cart.forEach(item => {
                html += `
                <div class="cart-item">
                    <div class="cart-item-main">
                        <div class="cart-item-info">
                            <span class="cart-item-name">${item.name}</span>
                            <span class="cart-item-price">&#8377;${(item.price * item.qty).toFixed(2)}</span>
                        </div>
                        <div class="cart-item-controls">
                            <button class="qty-btn" data-name="${item.name}" data-delta="-1">&minus;</button>
                            <span class="qty-count">${item.qty}</span>
                            <button class="qty-btn" data-name="${item.name}" data-delta="1">&plus;</button>
                            <button class="note-btn${item.note ? ' has-note' : ''}" data-name="${item.name}" title="Add cooking instructions">&#9998;</button>
                        </div>
                    </div>
                    <div class="cart-item-note-row${item.note ? ' open' : ''}">
                        <textarea class="cart-item-note-input" data-name="${item.name}" placeholder="e.g. Make it spicy, no peanuts…" rows="2">${escapeHtml(item.note)}</textarea>
                    </div>
                </div>`;
            });
            cartItemsDiv.innerHTML = html;
            checkoutBtn.disabled = false;
            clearBtn.style.display = 'block';
        }
        cartTotalEl.innerHTML = '&#8377;' + getTotal().toFixed(2);
        updateMenuButtonBadges();
    }

    function updateMenuButtonBadges() {
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            const name  = btn.dataset.name;
            const entry = cart.find(i => i.name === name);
            const badge = btn.querySelector('.btn-qty-badge');
            if (!badge) return;
            if (entry && entry.qty > 0) {
                badge.textContent = entry.qty;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        });
    }

    // Cart item controls (delegated)
    cartItemsDiv.addEventListener('click', function (e) {
        const qtyBtn  = e.target.closest('.qty-btn');
        const noteBtn = e.target.closest('.note-btn');
        if (qtyBtn)  changeQty(qtyBtn.dataset.name, parseInt(qtyBtn.dataset.delta));
        if (noteBtn) {
            const row = noteBtn.closest('.cart-item').querySelector('.cart-item-note-row');
            row.classList.toggle('open');
            if (row.classList.contains('open')) row.querySelector('textarea').focus();
        }
    });

    // Save note text without re-rendering (to keep focus)
    cartItemsDiv.addEventListener('input', function (e) {
        const ta = e.target.closest('.cart-item-note-input');
        if (!ta) return;
        const name = ta.dataset.name;
        const item = cart.find(i => i.name === name);
        if (item) {
            item.note = ta.value;
            saveCart();
            const noteBtn = ta.closest('.cart-item').querySelector('.note-btn');
            if (noteBtn) noteBtn.classList.toggle('has-note', ta.value.trim().length > 0);
        }
    });

    // Open / close cart
    cartFloat.addEventListener('click', () => openCart());
    cartCloseBtn.addEventListener('click', () => closeCart());
    cartOverlay.addEventListener('click', () => closeCart());
    clearBtn.addEventListener('click', () => { clearCart(); });

    function openCart() {
        cartDrawer.classList.add('open');
        cartOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    function closeCart() {
        cartDrawer.classList.remove('open');
        cartOverlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    // Initial render
    renderCart();

    /* ===========================================
       TABLE DETECTION (from QR code URL)
       =========================================== */
    const urlParams   = new URLSearchParams(window.location.search);
    const tableNumber = parseInt(urlParams.get('table')) || 0;

    if (tableNumber > 0) {
        const tableBanner = document.getElementById('table-banner');
        const tableNumEl  = document.getElementById('table-number');
        tableBanner.style.display = 'flex';
        tableNumEl.textContent = tableNumber;
    }

    /* ===========================================
       ORDER PLACEMENT (Firebase)
       =========================================== */
    const orderModal      = document.getElementById('order-modal');
    const orderModalClose = document.getElementById('order-modal-close');
    const orderSummary    = document.getElementById('order-summary');
    const orderTotalEl    = document.getElementById('order-total-amount');
    const orderNumberEl   = document.getElementById('order-number-display');
    const orderTableEl    = document.getElementById('order-table-display');

    checkoutBtn.addEventListener('click', async function () {
        if (cart.length === 0) return;
        if (tableNumber <= 0) {
            alert('No table assigned. Please scan the QR code on your table to place an order.');
            return;
        }

        checkoutBtn.disabled = true;
        checkoutBtn.textContent = 'Placing Order...';

        try {
            const orderNum = await getNextOrderNumber();
            const total = getTotal();

            // Flush any note currently typed in open textareas into cart state
            document.querySelectorAll('.cart-item-note-input').forEach(ta => {
                const item = cart.find(i => i.name === ta.dataset.name);
                if (item) item.note = ta.value;
            });

            const orderData = {
                tableNumber : tableNumber,
                items       : cart.map(i => ({ name: i.name, price: i.price, qty: i.qty, ...(i.note && i.note.trim() ? { note: i.note.trim() } : {}) })),
                total       : total,
                status      : 'new',
                timestamp   : firebase.database.ServerValue.TIMESTAMP,
                orderNumber : orderNum
            };

            console.log('[DEBUG] Sending to Firebase:', JSON.stringify(orderData, null, 2));

            await db.ref('orders').push(orderData);

            // Show confirmation
            closeCart();
            showOrderConfirmation(orderNum, total);

            // Clear cart
            clearCart();
        } catch (err) {
            console.error('Order failed:', err);
            alert('Failed to place order. Please try again.');
        }

        checkoutBtn.disabled = false;
        checkoutBtn.textContent = 'Place Order';
    });

    async function getNextOrderNumber() {
        const counterRef = db.ref('counters');
        const snapshot = await counterRef.once('value');
        const data = snapshot.val() || {};

        const today = new Date().toISOString().slice(0, 10);
        let count = data.dailyOrderCount || 0;
        const lastDate = data.lastResetDate || '';

        if (lastDate !== today) {
            count = 0; // Reset daily
        }

        count++;
        await counterRef.update({ dailyOrderCount: count, lastResetDate: today });
        return count;
    }

    function showOrderConfirmation(orderNum, total) {
        orderNumberEl.textContent = orderNum;
        orderTableEl.textContent  = tableNumber;
        orderTotalEl.innerHTML    = '&#8377;' + total.toFixed(2);

        let html = '<div class="order-items">';
        cart.forEach(item => {
            html += `<div class="order-item"><span>${item.name} &times; ${item.qty}</span><span>&#8377;${(item.price * item.qty).toFixed(2)}</span></div>`;
        });
        html += '</div>';
        orderSummary.innerHTML = html;

        orderModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeOrderModal() {
        orderModal.classList.remove('open');
        document.body.style.overflow = '';
    }

    orderModalClose.addEventListener('click', closeOrderModal);
    orderModal.addEventListener('click', function (e) {
        if (e.target === orderModal) closeOrderModal();
    });

    /* ===========================================
       LISTEN FOR ORDER STATUS UPDATES
       =========================================== */
    const statusBar      = document.getElementById('order-status-bar');
    const statusText     = document.getElementById('order-status-text');
    const statusCloseBtn = document.getElementById('order-status-close');

    if (tableNumber > 0) {
        db.ref('orders').orderByChild('tableNumber').equalTo(tableNumber)
            .on('child_changed', function (snapshot) {
                const order = snapshot.val();
                if (order.status === 'ready') {
                    showStatusNotification('Order #' + order.orderNumber + ' is ready! A waiter will bring it to your table.');
                }
            });
    }

    function showStatusNotification(message) {
        statusText.textContent = message;
        statusBar.style.display = 'flex';
        setTimeout(() => { statusBar.style.display = 'none'; }, 15000);
    }

    statusCloseBtn.addEventListener('click', function () {
        statusBar.style.display = 'none';
    });

    /* ===========================================
       HAMBURGER MENU
       =========================================== */

    /* ---- GUEST PICKER ---- */
    const guestPicker = document.getElementById('guest-picker');
    const guestInput  = document.getElementById('guest-input');
    guestPicker.addEventListener('click', function (e) {
        const btn = e.target.closest('.guest-btn');
        if (!btn) return;
        guestPicker.querySelectorAll('.guest-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        guestInput.value = btn.dataset.val;
    });

    /* ---- WHATSAPP SAME-AS-PHONE CHECKBOX ---- */
    const whatsappSame  = document.getElementById('whatsapp-same');
    const whatsappInput = document.getElementById('whatsapp-input');
    const phoneInput    = document.querySelector('#reserve-form input[name="phone"]');
    whatsappSame.addEventListener('change', function () {
        if (this.checked) {
            whatsappInput.value = phoneInput.value;
            whatsappInput.readOnly = true;
            whatsappInput.style.opacity = '0.6';
        } else {
            whatsappInput.readOnly = false;
            whatsappInput.style.opacity = '1';
        }
    });
    phoneInput.addEventListener('input', function () {
        if (whatsappSame.checked) {
            whatsappInput.value = phoneInput.value;
        }
    });

    /* ---- RESERVATION FORM SUBMIT ---- */
    const reserveForm    = document.getElementById('reserve-form');
    const reserveSuccess = document.getElementById('reserve-success');

    // Populate date dropdown with next 14 days
    const dateSelect = document.getElementById('date-select');
    if (dateSelect) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        for (let i = 0; i < 14; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : days[d.getDay()] + ', ' + d.getDate() + ' ' + months[d.getMonth()];
            const value = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
            const opt = document.createElement('option');
            opt.value = value;
            opt.textContent = label;
            dateSelect.appendChild(opt);
        }
    }

    if (reserveForm) {
        reserveForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            if (!guestInput.value) {
                alert('Please select the number of guests.');
                return;
            }

            const submitBtn = reserveForm.querySelector('.reserve-submit-btn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';

            const formData = new FormData(reserveForm);

            const resName     = formData.get('name') || '';
            const resWhatsApp = formData.get('whatsapp') || '';
            const resEmail    = formData.get('email') || '';
            const resDate     = formData.get('date') || '';
            const resTime     = reserveForm.querySelector('select[name="time"]').selectedOptions[0]?.textContent || '';
            const resGuests   = formData.get('guests') || '';
            const resRequests = formData.get('requests') || '';

            try {
                // 1. Submit to Formspree (sends email to owner)
                let formspreeOk = false;
                try {
                    const response = await fetch(reserveForm.action, {
                        method : 'POST',
                        body   : formData,
                        headers: { 'Accept': 'application/json' }
                    });
                    formspreeOk = response.ok;
                    console.log('Formspree response:', response.status, response.statusText);
                } catch (fErr) {
                    console.warn('Formspree failed:', fErr);
                }

                // 2. Show success screen immediately
                reserveForm.style.display = 'none';
                reserveSuccess.style.display = 'block';
                reserveSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });

                if (!formspreeOk) {
                    console.warn('Formspree did not succeed, but continuing with email/WhatsApp...');
                }

                // 3. Send confirmation email to customer via EmailJS (non-blocking)
                if (resEmail.trim()) {
                    document.getElementById('confirm-email-note').style.display = 'block';
                    console.log('Sending EmailJS to:', resEmail);
                    sendCustomerEmail(resEmail, {
                        name    : resName,
                        date    : resDate,
                        time    : resTime,
                        guests  : resGuests,
                        requests: resRequests
                    }).then(ok => {
                        console.log('EmailJS result:', ok);
                        if (!ok) console.warn('Customer email could not be sent.');
                    });
                } else {
                    console.log('No customer email provided, skipping EmailJS.');
                }

                // 4. Send WhatsApp in background (non-blocking)
                if (resWhatsApp.trim()) {
                    document.getElementById('confirm-wa-note').style.display = 'block';
                    console.log('Sending WhatsApp to:', resWhatsApp);
                    sendWhatsAppConfirmation(resWhatsApp, {
                        name    : resName,
                        date    : resDate,
                        time    : resTime,
                        guests  : resGuests,
                        requests: resRequests
                    }).then(ok => {
                        console.log('WhatsApp result:', ok);
                        if (!ok) console.warn('WhatsApp confirmation could not be sent.');
                    });
                } else {
                    console.log('No WhatsApp number provided, skipping WhatsApp.');
                }

            } catch (err) {
                alert('Network error. Please check your connection and try again.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '&#10003; Confirm My Reservation';
            }
        });
    }

    const hamburger = document.getElementById('hamburger');
    const nav       = document.getElementById('nav');
    hamburger.addEventListener('click', function () {
        nav.classList.toggle('open');
        hamburger.classList.toggle('open');
    });
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('open');
            hamburger.classList.remove('open');
        });
    });

    /* ===========================================
       SCROLL: header shadow + active nav
       =========================================== */
    const header   = document.getElementById('header');
    const sections = document.querySelectorAll('section[id]');

    window.addEventListener('scroll', function () {
        header.style.boxShadow = window.scrollY > 60
            ? '0 4px 24px rgba(0,0,0,0.13)'
            : '0 2px 15px rgba(0,0,0,0.08)';

        let current = '';
        sections.forEach(sec => {
            if (window.scrollY >= sec.offsetTop - 90) current = sec.id;
        });
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + current);
        });
    });

    /* ===========================================
       GALLERY LIGHTBOX
       =========================================== */
    const lightbox    = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lbCloseBtn  = document.getElementById('lightbox-close');

    document.querySelectorAll('.gallery-grid img').forEach(img => {
        img.addEventListener('click', function () {
            lightboxImg.src = this.src;
            lightbox.classList.add('active');
        });
    });
    lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox || e.target === lbCloseBtn) {
            lightbox.classList.remove('active');
        }
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            lightbox.classList.remove('active');
            closeOrderModal();
            closeCart();
        }
    });

});
