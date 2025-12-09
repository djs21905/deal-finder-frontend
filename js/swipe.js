// Swipe card interaction functions

function initSwipe() {
    const cards = document.querySelectorAll('.swipe-card');
    if (cards.length === 0) return;
    const top = cards[cards.length - 1];
    let isDragging = false, startX = 0, currentX = 0;

    const start = (x) => { isDragging = true; startX = x; top.style.transition = 'none'; };
    const move = (x) => {
        if (!isDragging) return;
        currentX = x - startX;
        top.style.transform = `translateX(${currentX}px) rotate(${currentX * 0.05}deg)`;
        const like = top.querySelector('.badge-like');
        const nope = top.querySelector('.badge-nope');
        if (currentX > 0) { like.style.opacity = Math.min(currentX / 100, 1); nope.style.opacity = 0; }
        else { nope.style.opacity = Math.min(Math.abs(currentX) / 100, 1); like.style.opacity = 0; }
    };
    const end = () => {
        isDragging = false;
        top.style.transition = 'transform 0.4s ease';
        if (currentX > 100) {
            top.style.transform = `translateX(120vw) rotate(30deg)`;
            processSwipe(top.dataset.id, 'saved');
        } else if (currentX < -100) {
            top.style.transform = `translateX(-120vw) rotate(-30deg)`;
            processSwipe(top.dataset.id, 'deleted');
        } else {
            top.style.transform = 'translate(0) rotate(0)';
            top.querySelectorAll('.status-badge').forEach(b => b.style.opacity = 0);
        }
        currentX = 0;
    };

    top.addEventListener('touchstart', e => start(e.touches[0].clientX));
    top.addEventListener('touchmove', e => {
        move(e.touches[0].clientX);
        if (isDragging) e.preventDefault();
    }, { passive: false });
    top.addEventListener('touchend', end);
    top.addEventListener('mousedown', e => start(e.clientX));
    document.addEventListener('mousemove', e => isDragging && move(e.clientX));
    document.addEventListener('mouseup', () => isDragging && end());
}

async function processSwipe(id, status) {
    // Wait for animation
    setTimeout(async () => {
        const card = document.querySelector(`.swipe-card[data-id='${id}']`);
        if (card) card.remove();

        // Remove from local array so table view matches
        window.deals = window.deals.filter(d => d.id != id);

        // Update counter
        updateDealCounter();

        if (document.querySelectorAll('.swipe-card').length === 0) {
            document.getElementById('empty-state-container').classList.add('active');
        }
        initSwipe(); // re-init next card

        await window.supabase.from('deals').update({ status }).eq('id', id);
    }, 300);
}
