// API and data management functions

async function loadDiscover() {
    const { data, error } = await window.supabase
        .from('deals')
        .select('id,unique_id,listing_title,price,listing_url,online_store,discovered_at,item_name,batch_id,city,state')
        .eq('status', 'new');
    if (error) return console.error(error);

    window.allDeals = data || [];
    window.deals = [...window.allDeals];
    window.dealsLoaded = true;

    if (window.currentSort === 'random') {
        for (let i = window.deals.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [window.deals[i], window.deals[j]] = [window.deals[j], window.deals[i]];
        }
    } else if (window.currentSort === 'item_name') {
        window.deals.sort((a, b) => (a.item_name || '').localeCompare(b.item_name || ''));
    } else if (window.currentSort === 'name') {
        window.deals.sort((a, b) => (a.online_store || '').localeCompare(b.online_store || ''));
    } else if (window.currentSort === 'price_asc') {
        window.deals.sort((a, b) => a.price - b.price);
    } else if (window.currentSort === 'price_desc') {
        window.deals.sort((a, b) => b.price - a.price);
    } else if (window.currentSort === 'newest') {
        window.deals.sort((a, b) => new Date(b.discovered_at) - new Date(a.discovered_at));
    }

    // Update counter
    updateDealCounter();

    // Render active view
    if (window.viewMode === 'card') renderStack();
    else renderTable();
}

async function loadSaved() {
    const list = document.getElementById('saved-list');
    list.innerHTML = '<div style="text-align:center;color:#888;margin-top:20px;">Loading...</div>';

    const { data, error } = await window.supabase
        .from('deals')
        .select('id,unique_id,listing_title,price,listing_url,online_store,discovered_at,item_name,batch_id,city,state')
        .eq('status', 'saved');

    list.innerHTML = '';
    if (!data || data.length === 0) {
        list.innerHTML = '<div style="text-align:center;color:#888;margin-top:50px;">No saved items</div>';
        return;
    }

    const groups = data.reduce((acc, obj) => {
        const key = obj.item_name || 'Other';
        if (!acc[key]) acc[key] = [];
        acc[key].push(obj);
        return acc;
    }, {});

    Object.keys(groups).sort().forEach(group => {
        const header = document.createElement('div');
        header.className = 'group-header';
        const count = groups[group].length;
        header.innerHTML = `
            ${group}
            <span class="group-badge">${count} item${count !== 1 ? 's' : ''}</span>
        `;
        list.appendChild(header);

        groups[group].forEach(deal => {
            const item = document.createElement('div');
            item.className = 'saved-item';
            item.innerHTML = `
                <div class="saved-content">
                    <h3>${deal.listing_title}</h3>
                    <p>${deal.online_store} • $${deal.price}</p>
                    <a href="${deal.listing_url}" target="_blank">View Link ↗</a>
                </div>
                <button class="btn-trash" onclick="deleteSaved(${deal.id})">🗑</button>
            `;
            list.appendChild(item);
        });
    });
}

window.handleTableAction = async function (id, status) {
    // Optimistic UI Update
    window.deals = window.deals.filter(d => d.id !== id);
    updateDealCounter();
    renderTable(); // Re-render table

    await window.supabase.from('deals').update({ status }).eq('id', id);
}

window.deleteSaved = async function (id) {
    window.pendingDeleteId = id;
    document.getElementById('delete-modal').classList.add('active');
}

window.closeDeleteModal = function () {
    document.getElementById('delete-modal').classList.remove('active');
    window.pendingDeleteId = null;
}

window.confirmDelete = async function () {
    if (!window.pendingDeleteId) return;
    await window.supabase.from('deals').update({ status: 'deleted' }).eq('id', window.pendingDeleteId);
    window.closeDeleteModal();
    loadSaved();
}

window.refreshDeals = async function () {
    const refreshBtn = document.getElementById('refresh-btn');
    const emptyStateMessage = document.getElementById('empty-state-message');
    refreshBtn.disabled = true;
    refreshBtn.textContent = 'Checking...';

    const { data, error } = await window.supabase
        .from('deals')
        .select('id,unique_id,listing_title,price,listing_url,online_store,discovered_at,item_name,batch_id,city,state')
        .eq('status', 'new');

    if (error) {
        refreshBtn.disabled = false;
        refreshBtn.textContent = 'Refresh Deals';
        return console.error(error);
    }

    if (!data || data.length === 0) {
        emptyStateMessage.textContent = 'Come back later—there are no new deals right now.';
        refreshBtn.disabled = false;
        refreshBtn.textContent = 'Refresh Deals';
    } else {
        // New deals found, reload normally
        loadDiscover();
    }
}
