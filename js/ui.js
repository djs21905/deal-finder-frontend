// UI and view management functions

window.showApp = function () {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('app-header').style.display = 'flex';
    document.getElementById('main-container').style.display = 'flex';
    loadDiscover();
}

window.switchTab = function (tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');

    const discover = document.getElementById('discover-view');
    const saved = document.getElementById('saved-view');
    const toggles = document.querySelector('.view-toggles');
    const sort = document.getElementById('sort-select');

    if (tab === 'discover') {
        saved.style.display = 'none';
        discover.style.display = 'flex';
        toggles.style.visibility = 'visible';
        sort.style.visibility = 'visible';
        // Only load discover if not already loaded, otherwise just render
        if (!window.dealsLoaded) {
            loadDiscover();
        } else {
            if (window.viewMode === 'card') renderStack();
            else renderTable();
        }
    } else {
        discover.style.display = 'none';
        saved.style.display = 'block';
        toggles.style.visibility = 'hidden';
        sort.style.visibility = 'hidden';
        loadSaved();
    }
}

window.switchViewMode = function (mode) {
    window.viewMode = mode;
    document.getElementById('btn-card-view').classList.toggle('active', mode === 'card');
    document.getElementById('btn-table-view').classList.toggle('active', mode === 'table');

    document.getElementById('discover-card-mode').style.display = mode === 'card' ? 'flex' : 'none';
    document.getElementById('discover-table-mode').style.display = mode === 'table' ? 'block' : 'none';

    // Re-render based on current mode
    if (mode === 'table') renderTable();
    else renderStack();

    // Update counter visibility
    updateDealCounter();
}

window.changeSort = function (val) {
    window.currentSort = val;
    loadDiscover();
}

function updateDealCounter() {
    const counter = document.getElementById('deal-counter');
    const remaining = window.deals.length;
    const total = window.allDeals.length;
    if (window.viewMode === 'card' && remaining > 0) {
        counter.style.display = 'inline-block';
        counter.textContent = `${remaining} / ${total}`;
    } else {
        counter.style.display = 'none';
    }
}

// --- RENDER CARD STACK ---
function renderStack() {
    const container = document.getElementById('card-stack');
    const empty = document.getElementById('empty-state');
    const emptyContainer = document.getElementById('empty-state-container');
    Array.from(container.querySelectorAll('.swipe-card')).forEach(c => c.remove());

    if (window.deals.length === 0) {
        empty.style.display = 'none';
        emptyContainer.classList.add('active');
        return;
    } else {
        empty.style.display = 'none';
        emptyContainer.classList.remove('active');
    }

    window.deals.slice().reverse().forEach(deal => {
        const card = document.createElement('div');
        card.className = 'swipe-card';
        card.dataset.id = deal.id;

        const store = deal.online_store || 'Unknown';

        card.innerHTML = `
            <div class="status-badge badge-nope">NOPE</div>
            <div class="status-badge badge-like">LIKE</div>
            <div class="card-header">
                <span class="badge-store">${store}</span>
                <div class="price">$${deal.price}</div>
            </div>
            <div class="card-body">
                <div class="item-label">${deal.item_name || 'Item'}</div>
                <h2 class="item-title">${deal.listing_title || 'Untitled'}</h2>
                <div style="margin-top: auto;"></div>
                <div style="text-align: center; color: var(--text-tertiary); font-size: 12px;">👆 Tap for details</div>
            </div>
        `;
        container.appendChild(card);
        card.addEventListener('click', (e) => {
            if (e.target.tagName !== 'A') openDetailView(deal);
        });
    });
    initSwipe();
}

// --- RENDER TABLE ---
function renderTable() {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';

    if (window.deals.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:20px;">No deals found</td></tr>';
        return;
    }

    window.deals.forEach(deal => {
        const tr = document.createElement('tr');
        const store = deal.online_store || 'Unknown';
        const dateStr = deal.discovered_at ? new Date(deal.discovered_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '-';

        tr.innerHTML = `
            <td>
                <div class="tbl-store">${store} • ${dateStr}</div>
                <a href="${deal.listing_url}" target="_blank" class="tbl-title">${deal.listing_title || deal.item_name}</a>
                <div class="tbl-meta">${deal.city ? deal.city + ', ' + deal.state : 'Online'}</div>
            </td>
            <td style="text-align:right">
                <div class="tbl-price">$${deal.price}</div>
            </td>
            <td style="text-align:right">
                <div class="tbl-actions">
                    <button class="mini-btn mini-nope" onclick="handleTableAction(${deal.id}, 'deleted')">✕</button>
                    <button class="mini-btn mini-like" onclick="handleTableAction(${deal.id}, 'saved')">✓</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// --- DETAIL VIEW ---
window.openDetailView = function (deal) {
    currentDetailDeal = deal;
    const dateStr = deal.discovered_at ? new Date(deal.discovered_at).toLocaleDateString() : 'N/A';
    const store = deal.online_store || 'Unknown';
    const loc = (deal.city) ? `${deal.city}, ${deal.state}` : 'Online';

    const detailContent = document.getElementById('detail-content');
    detailContent.innerHTML = `
        <div class="detail-section">
            <div class="detail-label">Store</div>
            <div class="detail-value">${store}</div>
        </div>
        <div class="detail-section">
            <div class="detail-label">Price</div>
            <div class="detail-value" style="font-size: 32px; font-weight: 800;">$${deal.price}</div>
        </div>
        <div class="detail-section">
            <div class="detail-label">Item</div>
            <div class="detail-value">${deal.item_name || 'Item'}</div>
        </div>
        <div class="detail-section">
            <div class="detail-label">Product</div>
            <div class="detail-value">${deal.listing_title || 'Untitled'}</div>
        </div>
        <div class="detail-section">
            <div class="detail-label">Location</div>
            <div class="detail-value">${loc}</div>
        </div>
        <div class="detail-section">
            <div class="detail-label">Listed</div>
            <div class="detail-value">${dateStr}</div>
        </div>
        <div class="detail-section">
            <div class="detail-label">Batch ID</div>
            <div class="detail-value">${deal.batch_id || '-'}</div>
        </div>
        <div class="detail-section">
            <a href="${deal.listing_url}" target="_blank" class="btn-link">View Full Listing ↗</a>
        </div>
    `;
    document.getElementById('detail-overlay').classList.add('active');
}

window.closeDetailView = function () {
    document.getElementById('detail-overlay').classList.remove('active');
    currentDetailDeal = null;
}

window.rejectFromDetail = async function () {
    if (!window.currentDetailDeal) return;
    const id = window.currentDetailDeal.id;
    window.closeDetailView();

    // Remove from array first
    window.deals = window.deals.filter(d => d.id != id);
    updateDealCounter();

    // Re-render and re-init swipe
    renderStack();

    // Update database
    await window.supabase.from('deals').update({ status: 'deleted' }).eq('id', id);
}

window.saveFromDetail = async function () {
    if (!window.currentDetailDeal) return;
    const id = window.currentDetailDeal.id;
    window.closeDetailView();

    // Remove from array first
    window.deals = window.deals.filter(d => d.id != id);
    updateDealCounter();

    // Re-render and re-init swipe
    renderStack();

    // Update database
    await window.supabase.from('deals').update({ status: 'saved' }).eq('id', id);
}

window.forceSwipe = function (dir) {
    const cards = document.querySelectorAll('.swipe-card');
    if (!cards.length) return;
    const top = cards[cards.length - 1];
    top.style.transition = 'transform 0.5s ease-out';
    top.style.transform = `translateX(${dir === 'right' ? 1000 : -1000}px) rotate(${dir === 'right' ? 30 : -30}deg)`;
    processSwipe(top.dataset.id, dir === 'right' ? 'saved' : 'deleted');
}
