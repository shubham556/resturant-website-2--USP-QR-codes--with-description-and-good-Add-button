document.addEventListener('DOMContentLoaded', function () {

    const activeOrdersDiv  = document.getElementById('active-orders');
    const orderHistoryDiv  = document.getElementById('order-history');
    const activeCountEl    = document.getElementById('active-count');
    const readyCountEl     = document.getElementById('ready-count');
    const totalCountEl     = document.getElementById('total-count');
    const toggleHistoryBtn = document.getElementById('toggle-history');

    let allOrders = {};       // keyed by Firebase ID
    let isFirstLoad = true;   // suppress notification sound on initial load

    /* ===========================================
       NOTIFICATION SOUND
       =========================================== */
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function playNotificationSound() {
        try {
            const oscillator = audioCtx.createOscillator();
            const gainNode   = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.frequency.value = 880;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.5);

            // Second beep
            setTimeout(() => {
                const osc2  = audioCtx.createOscillator();
                const gain2 = audioCtx.createGain();
                osc2.connect(gain2);
                gain2.connect(audioCtx.destination);
                osc2.frequency.value = 1100;
                osc2.type = 'sine';
                gain2.gain.setValueAtTime(0.3, audioCtx.currentTime);
                gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
                osc2.start(audioCtx.currentTime);
                osc2.stop(audioCtx.currentTime + 0.5);
            }, 200);
        } catch (e) {
            console.warn('Audio not available:', e);
        }
    }

    /* ===========================================
       TIME FORMATTING
       =========================================== */
    function timeAgo(timestamp) {
        const diff = Math.floor((Date.now() - timestamp) / 1000);
        if (diff < 60) return diff + 's ago';
        if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
        return Math.floor(diff / 3600) + 'h ' + Math.floor((diff % 3600) / 60) + 'm ago';
    }

    function formatTime(timestamp) {
        const d = new Date(timestamp);
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    }

    /* ===========================================
       RENDER ORDERS
       =========================================== */
    function renderOrders() {
        const orders = Object.entries(allOrders);

        const activeOrders = orders
            .filter(([, o]) => o.status === 'new')
            .sort((a, b) => a[1].timestamp - b[1].timestamp);

        const readyOrders = orders
            .filter(([, o]) => o.status === 'ready')
            .sort((a, b) => b[1].timestamp - a[1].timestamp);

        // Update counts
        activeCountEl.textContent = activeOrders.length;
        readyCountEl.textContent  = readyOrders.length;
        totalCountEl.textContent  = orders.length;

        // Render active orders
        if (activeOrders.length === 0) {
            activeOrdersDiv.innerHTML = '<p class="no-orders">No active orders right now.</p>';
        } else {
            activeOrdersDiv.innerHTML = activeOrders.map(([id, order]) => `
                <div class="order-card order-new">
                    <div class="order-card-header">
                        <div class="order-card-table">Table ${order.tableNumber}</div>
                        <div class="order-card-meta">
                            <span class="order-card-number">#${order.orderNumber}</span>
                            <span class="order-card-time">${formatTime(order.timestamp)}</span>
                        </div>
                    </div>
                    <div class="order-card-items">
                        ${(order.items || []).map(item => `
                            <div class="order-card-item">
                                <div class="item-row">
                                    <span class="item-qty">${item.qty}x</span>
                                    <span class="item-name">${item.name}</span>
                                </div>
                                ${item.note ? `<div class="item-note">&#9998; ${item.note}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                    <div class="order-card-footer">
                        <span class="order-card-elapsed">${timeAgo(order.timestamp)}</span>
                        <button class="mark-ready-btn" data-id="${id}">Mark Ready</button>
                    </div>
                </div>
            `).join('');
        }

        // Render history
        if (readyOrders.length === 0) {
            orderHistoryDiv.innerHTML = '<p class="no-orders">No completed orders yet today.</p>';
        } else {
            orderHistoryDiv.innerHTML = readyOrders.map(([id, order]) => `
                <div class="order-card order-ready">
                    <div class="order-card-header">
                        <div class="order-card-table">Table ${order.tableNumber}</div>
                        <div class="order-card-meta">
                            <span class="order-card-number">#${order.orderNumber}</span>
                            <span class="order-card-time">${formatTime(order.timestamp)}</span>
                        </div>
                    </div>
                    <div class="order-card-items">
                        ${(order.items || []).map(item => `
                            <div class="order-card-item">
                                <div class="item-row">
                                    <span class="item-qty">${item.qty}x</span>
                                    <span class="item-name">${item.name}</span>
                                </div>
                                ${item.note ? `<div class="item-note">&#9998; ${item.note}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                    <div class="order-card-footer">
                        <span class="order-card-status-badge">Ready</span>
                    </div>
                </div>
            `).join('');
        }
    }

    /* ===========================================
       MARK ORDER AS READY
       =========================================== */
    document.addEventListener('click', function (e) {
        const btn = e.target.closest('.mark-ready-btn');
        if (!btn) return;
        const orderId = btn.dataset.id;
        btn.disabled = true;
        btn.textContent = 'Updating...';
        db.ref('orders/' + orderId).update({ status: 'ready' });
    });

    /* ===========================================
       TOGGLE HISTORY
       =========================================== */
    let historyVisible = false;
    toggleHistoryBtn.addEventListener('click', function () {
        historyVisible = !historyVisible;
        orderHistoryDiv.style.display = historyVisible ? 'grid' : 'none';
        toggleHistoryBtn.textContent  = historyVisible ? 'Hide' : 'Show';
    });

    /* ===========================================
       FIREBASE REAL-TIME LISTENERS
       =========================================== */
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    db.ref('orders').orderByChild('timestamp').startAt(todayStart.getTime())
        .on('child_added', function (snapshot) {
            const orderVal = snapshot.val();
            console.log('[DEBUG Kitchen] Order received:', JSON.stringify(orderVal, null, 2));
            allOrders[snapshot.key] = orderVal;
            renderOrders();

            if (!isFirstLoad) {
                playNotificationSound();
            }
        });

    db.ref('orders').orderByChild('timestamp').startAt(todayStart.getTime())
        .on('child_changed', function (snapshot) {
            allOrders[snapshot.key] = snapshot.val();
            renderOrders();
        });

    db.ref('orders').orderByChild('timestamp').startAt(todayStart.getTime())
        .on('child_removed', function (snapshot) {
            delete allOrders[snapshot.key];
            renderOrders();
        });

    // After initial load, enable sound notifications
    setTimeout(() => { isFirstLoad = false; }, 2000);

    // Auto-refresh elapsed times every 30 seconds
    setInterval(renderOrders, 30000);

    // Resume AudioContext on first user interaction (required by browsers)
    document.addEventListener('click', function () {
        if (audioCtx.state === 'suspended') audioCtx.resume();
    }, { once: true });

});
