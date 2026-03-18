document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('article-grid');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('article-search');
    let allArticles = [];

    async function loadArticles() {
        try {
            const response = await fetch('http://localhost:3000/api/articles');
            if (response.ok) {
                allArticles = await response.json();
                renderArticles('all');
            } else {
                grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: red;">Failed to load articles.</div>';
            }
        } catch (error) {
            console.error(error);
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: red;">Server error. Is Node.js running?</div>';
        }
    }

    function renderArticles(filterType, searchQuery = "") {
        grid.innerHTML = '';

        let filtered = allArticles.filter(a => filterType === 'all' || a.category === filterType);
        
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(a => a.title.toLowerCase().includes(lowerQuery));
        }

        if (filtered.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #888; padding: 40px;">No articles found.</div>`;
            return;
        }

        filtered.forEach(article => {
            const playButtonHtml = article.category === 'videos' ? `
                <div class="play-button">
                    <svg viewBox="0 0 24 25" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                </div>
            ` : '';

            const thumbnailSrc = article.thumbnail || '../assets/images/Placeholder1_article.png';
            const extraClass = article.category === 'videos' ? 'video-card' : '';

            const card = `
                <div class="article-card" onclick="window.open('${article.sourceLink}', '_blank')">
                    <div class="card-image ${extraClass}">
                        <img src="${thumbnailSrc}" style="background-color: #2c3e50; width: 100%; height: 100%; object-fit: cover;">
                        ${playButtonHtml}
                    </div>
                    <div class="card-content">
                        <span class="category-pill">${article.category.toUpperCase()}</span>
                        <h3>${article.title}</h3>
                    </div>
                </div>
            `;
            grid.insertAdjacentHTML('beforeend', card);
        });
    }

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            renderArticles(button.getAttribute('data-filter'), searchInput.value);
        });
    });

    searchInput.addEventListener('input', (e) => {
        const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
        renderArticles(activeFilter, e.target.value);
    });

    loadArticles();
});