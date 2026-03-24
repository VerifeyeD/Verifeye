document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Get user and tab from the URL (e.g., user-activity.html?user=Sisigegg&tab=comments)
    const urlParams = new URLSearchParams(window.location.search);
    const targetUser = urlParams.get('user');
    let currentTab = urlParams.get('tab') || 'articles';

    if (!targetUser) {
        document.getElementById('activity-title').innerText = "User Not Found";
        document.getElementById('loading-spinner').style.display = 'none';
        return;
    }

    document.getElementById('activity-title').innerText = `${targetUser}'s Activity`;

    const contentArea = document.getElementById('activity-content');
    const loadingSpinner = document.getElementById('loading-spinner');
    let activityData = { articles: [], discussions: [], comments: [] };

    // 2. Fetch Data from the new Backend Route
    try {
        const response = await fetch(`http://localhost:3000/api/user/${targetUser}/activity`);
        if (response.ok) {
            activityData = await response.json();
            switchTab(currentTab); 
        } else {
            contentArea.innerHTML = '<p style="color:red; text-align:center;">Failed to load activity.</p>';
            contentArea.style.display = 'block';
        }
    } catch (err) {
        contentArea.innerHTML = '<p style="color:red; text-align:center;">Server error.</p>';
        contentArea.style.display = 'block';
    } finally {
        loadingSpinner.style.display = 'none';
    }

    // 3. Tab Switching Logic
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            tabBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            currentTab = e.target.getAttribute('data-target');
            
            // Update URL cleanly without reloading the page
            const newUrl = new URL(window.location);
            newUrl.searchParams.set('tab', currentTab);
            window.history.pushState({}, '', newUrl);

            renderContent(currentTab);
        });
    });

    // Automatically set the active tab button based on URL param
    tabBtns.forEach(btn => {
        if (btn.getAttribute('data-target') === currentTab) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    function switchTab(tabName) {
        renderContent(tabName);
    }

    // 4. Render Logic
    function renderContent(tab) {
        contentArea.style.display = 'none';
        contentArea.innerHTML = '';
        let htmlString = '';

        if (tab === 'articles') {
            if (activityData.articles.length === 0) htmlString = '<p style="text-align:center; color:#888; padding: 20px;">No articles submitted.</p>';
            activityData.articles.forEach((item, index) => {
                const date = new Date(item.createdAt).toLocaleDateString();
                htmlString += `
                    <div class="activity-item slide-down-item" style="animation-delay: ${index * 0.1}s;" onclick="window.open('${item.sourceLink}', '_blank')">
                        <div class="item-meta">
                            <span class="item-tag">ARTICLE</span>
                            <span>${date}</span>
                        </div>
                        <h3 class="item-title">${item.title}</h3>
                        <p class="item-snippet" style="border:none; padding:0; font-style:normal;">Category: ${item.category.toUpperCase()}</p>
                    </div>
                `;
            });
        } 
        else if (tab === 'discussions') {
            if (activityData.discussions.length === 0) htmlString = '<p style="text-align:center; color:#888; padding: 20px;">No discussions started.</p>';
            activityData.discussions.forEach((item, index) => {
                const date = new Date(item.createdAt).toLocaleDateString();
                // Strip HTML tags for the snippet safely
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = item.content;
                const textContent = tempDiv.textContent || tempDiv.innerText || "";
                
                htmlString += `
                    <div class="activity-item slide-down-item" style="animation-delay: ${index * 0.1}s;" onclick="window.location.href='../pages/view-thread.html?id=${item._id}'">
                        <div class="item-meta">
                            <span class="item-tag">${item.tag || "DISCUSSION"}</span>
                            <span>${date}</span>
                        </div>
                        <h3 class="item-title">${item.title}</h3>
                        <p class="item-snippet">${textContent.substring(0, 150)}${textContent.length > 150 ? '...' : ''}</p>
                    </div>
                `;
            });
        } 
        else if (tab === 'comments') {
            if (activityData.comments.length === 0) htmlString = '<p style="text-align:center; color:#888; padding: 20px;">No comments written.</p>';
            activityData.comments.forEach((item, index) => {
                const date = new Date(item.createdAt).toLocaleDateString();
                
                // DEEP LINKING: Construct the exact URL to jump to the comment/reply and trigger the animation
                let targetUrl = `../pages/view-thread.html?id=${item.threadId}`;
                if (item.type === 'comment') targetUrl += `#comment-${item.commentId}`;
                if (item.type === 'reply') targetUrl += `#reply-${item.replyId}`;

                htmlString += `
                    <div class="activity-item slide-down-item" style="animation-delay: ${index * 0.1}s;" onclick="window.location.href='${targetUrl}'">
                        <div class="item-meta">
                            <span class="item-tag" style="background:#f39c12; color:#fff;">${item.type.toUpperCase()}</span>
                            <span>${date}</span>
                            <span>in <strong>${item.threadTitle}</strong></span>
                        </div>
                        <p class="item-snippet">"${item.text}"</p>
                    </div>
                `;
            });
        }

        contentArea.innerHTML = htmlString;
        
        // Trigger CSS reflow to restart animations
        void contentArea.offsetWidth;
        contentArea.style.display = 'flex';
    }
});