document.addEventListener('DOMContentLoaded', async () => {
    
    // Auth Check for Upload Button
    const loggedInUser = localStorage.getItem('verifeye_user');
    const uploadBtn = document.getElementById('upload-article-link');

    if (uploadBtn) {
        uploadBtn.addEventListener('click', (e) => {
            if (!loggedInUser) {
                e.preventDefault(); 
                if (window.showCustomAlert) {
                    window.showCustomAlert("Login Required", "You must be logged in to submit an article!", "error", () => {
                        window.location.href = '../pages/login.html';
                    });
                } else {
                    alert("You must be logged in to submit an article!");
                    window.location.href = '../pages/login.html';
                }
            }
        });
    }

    const grid = document.getElementById('articles-grid');
    const loadingSpinner = document.getElementById('loading-spinner');
    const noResultsMsg = document.getElementById('no-results-msg');
    const searchInput = document.getElementById('article-search-input');
    const filterBtns = document.querySelectorAll('.filter-btn');

    let allArticles = [];
    let currentFilter = 'all';

    // 1. Fetch Approved Articles
    try {
        const response = await fetch('http://localhost:3000/api/articles');
        if (response.ok) {
            allArticles = await response.json();
            renderArticles();
        } else {
            grid.innerHTML = '<p style="color:red; text-align:center; grid-column: 1 / -1;">Failed to load library.</p>';
            grid.style.display = 'block';
        }
    } catch (err) {
        grid.innerHTML = '<p style="color:red; text-align:center; grid-column: 1 / -1;">Server error. Is Node running?</p>';
        grid.style.display = 'block';
    } finally {
        loadingSpinner.style.display = 'none';
        if (allArticles.length > 0) grid.style.display = 'grid';
    }

    // 2. Render Logic
    function renderArticles(searchQuery = '') {
        grid.innerHTML = '';
        noResultsMsg.style.display = 'none';

        // Filter by Tab
        let filtered = currentFilter === 'all' 
            ? allArticles 
            : allArticles.filter(a => a.category === currentFilter);

        // Filter by Search
        if (searchQuery) {
            filtered = filtered.filter(a => 
                a.title.toLowerCase().includes(searchQuery) ||
                a.author.toLowerCase().includes(searchQuery)
            );
        }

        if (filtered.length === 0) {
            grid.style.display = 'none';
            noResultsMsg.style.display = 'block';
            return;
        }

        grid.style.display = 'grid';

        filtered.forEach((article, index) => {
            const dateStr = new Date(article.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
            const delay = index * 0.05; // Staggered entrance animation

            // THE FIX: Adding "By [Author]" and User Profile Deep Linking
            const html = `
                <div class="article-card slide-down-item" style="animation-delay: ${delay}s;" onclick="window.open('${article.sourceLink}', '_blank')">
                    <div class="article-thumb">
                        <span class="article-badge">${article.category}</span>
                        ${article.thumbnail ? `<img src="${article.thumbnail}" alt="Cover">` : ''}
                    </div>
                    <div class="article-content">
                        <h2 class="article-title">${article.title}</h2>
                        <div class="article-footer">
                            <span class="article-author" onclick="event.stopPropagation(); window.location.href='../pages/user-profile.html?user=${article.author}'" style="cursor: pointer; transition: 0.2s;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">
                                By <strong>${article.author}</strong>
                            </span>
                            <span class="article-date">${dateStr}</span>
                        </div>
                    </div>
                </div>
            `;
            grid.insertAdjacentHTML('beforeend', html);
        });
    }

    // 3. Search & Filter Listeners
    searchInput.addEventListener('input', (e) => {
        renderArticles(e.target.value.trim().toLowerCase());
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            currentFilter = e.target.getAttribute('data-filter');
            
            // Restart animations by triggering reflow
            grid.classList.remove('slide-in');
            void grid.offsetWidth;
            grid.classList.add('slide-in');

            renderArticles(searchInput.value.trim().toLowerCase());
        });
    });

});