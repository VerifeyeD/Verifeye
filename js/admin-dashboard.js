document.addEventListener('DOMContentLoaded', async () => {
    
    const loggedInUser = localStorage.getItem('verifeye_user');
    const loggedInRole = localStorage.getItem('verifeye_role');

    if (!loggedInUser || loggedInRole !== 'admin') {
        window.location.href = '../pages/homepage.html';
        return;
    }

    const queueContainer = document.getElementById('article-queue');
    const userContainer = document.getElementById('user-management');
    const reportsContainer = document.getElementById('reported-content');
    const reportsList = document.getElementById('reports-list');
    const adminRequestsContainer = document.getElementById('admin-requests');
    const adminRequestsList = document.getElementById('admin-requests-list');
    const loadingSpinner = document.getElementById('loading-spinner');
    
    const articleSearchContainer = document.getElementById('article-search-container');
    const articleSearchInput = document.getElementById('article-search-input');
    const userSearchInput = document.getElementById('user-search-input');
    const searchResults = document.getElementById('user-search-results');

    let allArticles = [];
    let currentFilter = 'pending';

    function triggerAnimation(element) {
        element.classList.remove('slide-in');
        void element.offsetWidth; 
        element.classList.add('slide-in');
    }

    // ==========================================
    // CUSTOM ALERTS & MODALS
    // ==========================================
    window.showCustomAlert = function(title, message, type, onSuccessCallback = null) {
        const overlay = document.getElementById('custom-alert-overlay');
        const alertBox = document.getElementById('custom-alert-box');
        const icon = document.getElementById('custom-alert-icon');
        
        document.getElementById('custom-alert-title').innerText = title;
        document.getElementById('custom-alert-message').innerText = message;

        if (type === 'error') {
            alertBox.className = 'custom-alert-box custom-alert-error';
            icon.innerHTML = "<i class='bx bx-error-circle'></i>";
        } else {
            alertBox.className = 'custom-alert-box custom-alert-success';
            icon.innerHTML = "<i class='bx bx-check-circle'></i>";
        }

        overlay.classList.add('show');
        window.currentAlertCallback = onSuccessCallback;
    };

    window.closeCustomAlert = function() {
        document.getElementById('custom-alert-overlay').classList.remove('show');
        if (typeof window.currentAlertCallback === 'function') {
            window.currentAlertCallback();
            window.currentAlertCallback = null;
        }
    };

    function customConfirm(title, message, confirmBtnText = "Yes", confirmBtnColor = "#e74c3c") {
        return new Promise((resolve) => {
            const modal = document.getElementById('custom-confirm-modal');
            document.getElementById('confirm-title').innerText = title;
            document.getElementById('confirm-message').innerText = message;
            
            const btnDo = document.getElementById('btn-do-confirm');
            btnDo.innerText = confirmBtnText;
            btnDo.style.background = confirmBtnColor;

            modal.classList.add('show');

            const handleConfirm = () => { cleanup(); resolve(true); };
            const handleCancel = () => { cleanup(); resolve(false); };

            function cleanup() {
                modal.classList.remove('show');
                btnDo.removeEventListener('click', handleConfirm);
                document.getElementById('btn-cancel-confirm').removeEventListener('click', handleCancel);
            }

            btnDo.addEventListener('click', handleConfirm);
            document.getElementById('btn-cancel-confirm').addEventListener('click', handleCancel);
        });
    }

    function customRejectPrompt() {
        return new Promise((resolve) => {
            const modal = document.getElementById('custom-prompt-modal');
            const input = document.getElementById('reject-reason-input');
            input.value = ''; 
            modal.classList.add('show');
            input.focus();

            const handleSubmit = () => { cleanup(); resolve(input.value.trim()); };
            const handleCancel = () => { cleanup(); resolve(null); };

            function cleanup() {
                modal.classList.remove('show');
                document.getElementById('btn-submit-prompt').removeEventListener('click', handleSubmit);
                document.getElementById('btn-cancel-prompt').removeEventListener('click', handleCancel);
            }

            document.getElementById('btn-submit-prompt').addEventListener('click', handleSubmit);
            document.getElementById('btn-cancel-prompt').addEventListener('click', handleCancel);
        });
    }

    function customBanModal(username) {
        return new Promise((resolve) => {
            const modal = document.getElementById('custom-ban-modal');
            document.getElementById('ban-user-text').innerText = `Select ban duration for ${username}:`;
            document.querySelector('input[name="ban_duration"][value="24"]').checked = true; 
            
            modal.classList.add('show');

            const handleSubmit = () => { 
                const selected = document.querySelector('input[name="ban_duration"]:checked').value;
                cleanup(); 
                resolve(parseInt(selected)); 
            };
            const handleCancel = () => { cleanup(); resolve(null); };

            function cleanup() {
                modal.classList.remove('show');
                document.getElementById('btn-submit-ban').removeEventListener('click', handleSubmit);
                document.getElementById('btn-cancel-ban').removeEventListener('click', handleCancel);
            }

            document.getElementById('btn-submit-ban').addEventListener('click', handleSubmit);
            document.getElementById('btn-cancel-ban').addEventListener('click', handleCancel);
        });
    }

    // ==========================================
    // ADMIN REQUESTS LOGIC
    // ==========================================
    async function fetchAdminRequests() {
        try {
            loadingSpinner.style.display = 'block';
            queueContainer.style.display = 'none';
            userContainer.style.display = 'none';
            reportsContainer.style.display = 'none';
            adminRequestsContainer.style.display = 'none';

            const response = await fetch('http://localhost:3000/api/admin/requests');
            if (response.ok) {
                const reqs = await response.json();
                renderAdminRequests(reqs);
            } else {
                adminRequestsList.innerHTML = '<p style="color:red; text-align:center;">Failed to load requests.</p>';
            }
        } catch (err) {
            adminRequestsList.innerHTML = '<p style="color:red; text-align:center;">Server error.</p>';
        } finally {
            loadingSpinner.style.display = 'none';
            if (currentFilter === 'admin-requests') adminRequestsContainer.style.display = 'flex';
        }
    }

    function renderAdminRequests(reqs) {
        adminRequestsList.innerHTML = '';
        if (reqs.length === 0) {
            adminRequestsList.innerHTML = `<div style="text-align: center; padding: 40px; color: #888; background: #fff; border-radius: 8px; border: 1px solid #ddd;">No pending admin requests.</div>`;
            return;
        }

        reqs.forEach((r, index) => {
            const animationDelay = index * 0.1;
            const dateStr = new Date(r.createdAt).toLocaleString();
            
            const html = `
                <div class="report-item slide-down-item" style="animation-delay: ${animationDelay}s; cursor: default;">
                    <div class="report-details">
                        <span class="report-badge" style="background:#eaf4fc; color:#06629b;">Admin Request</span>
                        <div style="font-size:16px; color:#333; margin-bottom: 5px;">
                            <strong style="display:flex; align-items:center;">${r.username} ${window.getBadgeHTML(r.username)}</strong> is applying to be an Admin.
                        </div>
                        <div style="font-size:14px; color:#555; background:#f9fbfd; padding: 12px; border-left: 3px solid #06629b; border-radius: 4px;">
                            <strong>Reason:</strong> "${r.reason}"
                        </div>
                        <div style="font-size:12px; color:#888; margin-top:8px;">Requested on: ${dateStr}</div>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        <button class="btn-approve" onclick="handleAdminRequest('${r._id}', 'approve')">Grant Admin</button>
                        <button class="btn-reject" onclick="handleAdminRequest('${r._id}', 'reject')">Reject</button>
                    </div>
                </div>
            `;
            adminRequestsList.insertAdjacentHTML('beforeend', html);
        });
    }

    window.handleAdminRequest = async function(id, action) {
        const actionText = action === 'approve' ? 'Grant Admin Privileges' : 'Reject Request';
        const color = action === 'approve' ? '#27ae60' : '#e74c3c';
        
        const confirmed = await customConfirm("Confirm Decision", `Are you sure you want to ${action} this request?`, actionText, color);
        if (!confirmed) return;

        try {
            const res = await fetch(`http://localhost:3000/api/admin/requests/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: action })
            });

            if (res.ok) {
                showCustomAlert("Success", `Request ${action}d successfully.`, "success");
                
                // If we granted admin, refresh the global badge list in the background!
                if (action === 'approve') {
                    window.verifiedAdminsPromise = fetch('http://localhost:3000/api/admins')
                        .then(r => r.json())
                        .then(data => { window.verifiedAdmins = data; });
                }
                
                fetchAdminRequests();
            } else {
                showCustomAlert("Error", `Failed to ${action} request.`, "error");
            }
        } catch (err) { showCustomAlert("Error", "Server error", "error"); }
    };

    // ==========================================
    // REPORTS LOGIC
    // ==========================================
    async function fetchReports() {
        try {
            loadingSpinner.style.display = 'block';
            queueContainer.style.display = 'none';
            userContainer.style.display = 'none';
            reportsContainer.style.display = 'none';
            adminRequestsContainer.style.display = 'none';

            const response = await fetch('http://localhost:3000/api/admin/reports');
            if (response.ok) {
                const reports = await response.json();
                renderReports(reports);
            } else {
                reportsList.innerHTML = '<p style="color:red; text-align:center;">Failed to load reports.</p>';
            }
        } catch (err) {
            reportsList.innerHTML = '<p style="color:red; text-align:center;">Server error.</p>';
        } finally {
            loadingSpinner.style.display = 'none';
            if (currentFilter === 'reports') reportsContainer.style.display = 'flex';
        }
    }

    function renderReports(reports) {
        reportsList.innerHTML = '';
        if (reports.length === 0) {
            reportsList.innerHTML = `<div style="text-align: center; padding: 40px; color: #888; background: #fff; border-radius: 8px; border: 1px solid #ddd;">No content has been reported.</div>`;
            return;
        }

        reports.forEach((r, index) => {
            const animationDelay = index * 0.1;
            const dateStr = new Date(r.createdAt).toLocaleString();
            
            let targetLink = `../pages/view-thread.html?id=${r.threadId}`;
            if (r.type === 'comment' && r.commentId) targetLink += `#comment-${r.commentId}`;
            if (r.type === 'reply' && r.replyId) targetLink += `#reply-${r.replyId}`;

            const html = `
                <div class="report-item slide-down-item" style="animation-delay: ${animationDelay}s;" onclick="window.location.href='${targetLink}'">
                    <div class="report-details">
                        <span class="report-badge">${r.reason}</span>
                        <div style="font-size:16px; color:#333;">
                            <strong>${r.reporter}</strong> reported <strong>${r.reportedUser}</strong>'s ${r.type}.
                        </div>
                        ${r.details ? `<div style="font-size:14px; color:#666; margin-top:6px; font-style:italic; border-left: 3px solid #ccc; padding-left: 10px;">"${r.details}"</div>` : ''}
                        <div style="font-size:12px; color:#888; margin-top:8px;">${dateStr}</div>
                    </div>
                    <button class="btn-dismiss" onclick="event.stopPropagation(); dismissReport('${r._id}')">Dismiss Report</button>
                </div>
            `;
            reportsList.insertAdjacentHTML('beforeend', html);
        });
    }

    window.dismissReport = async function(reportId) {
        const confirmed = await customConfirm("Dismiss Report", "Are you sure you want to dismiss this report? This will remove it from the list.", "Dismiss", "#06629b");
        if (!confirmed) return;

        try {
            const res = await fetch(`http://localhost:3000/api/admin/reports/${reportId}`, { method: 'DELETE' });
            if (res.ok) fetchReports();
            else showCustomAlert("Error", "Failed to dismiss report.", "error");
        } catch (err) { showCustomAlert("Error", "Server error", "error"); }
    };

    // ==========================================
    // ARTICLES LOGIC
    // ==========================================
    async function fetchArticles() {
        try {
            loadingSpinner.style.display = 'block';
            queueContainer.style.display = 'none';
            userContainer.style.display = 'none';
            reportsContainer.style.display = 'none';
            adminRequestsContainer.style.display = 'none';
            
            const response = await fetch('http://localhost:3000/api/admin/articles');
            if (response.ok) {
                allArticles = await response.json();
                renderArticles();
                triggerAnimation(queueContainer);
            }
        } catch (error) {
            queueContainer.innerHTML = '<p style="color:red; text-align:center;">Server error. Is Node running?</p>';
        } finally {
            loadingSpinner.style.display = 'none';
            if (currentFilter !== 'users' && currentFilter !== 'reports' && currentFilter !== 'admin-requests') queueContainer.style.display = 'flex';
        }
    }

    function renderArticles(searchQuery = '') {
        queueContainer.innerHTML = '';
        let filteredArticles = allArticles.filter(article => article.status === currentFilter);

        if (currentFilter === 'approved' && searchQuery) {
            filteredArticles = filteredArticles.filter(article => 
                article.title.toLowerCase().includes(searchQuery) ||
                article.category.toLowerCase().includes(searchQuery) ||
                article.author.toLowerCase().includes(searchQuery)
            );
        }

        if (filteredArticles.length === 0) {
            if (searchQuery) {
                queueContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: #888; background: #fff; border-radius: 8px; border: 1px solid #ddd;">No approved articles matched your search.</div>`;
            } else {
                queueContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: #888; background: #fff; border-radius: 8px; border: 1px solid #ddd;">No ${currentFilter} articles found.</div>`;
            }
            return;
        }

        filteredArticles.forEach(article => {
            const date = new Date(article.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
            let actionButtons = '';
            
            if (article.status === 'pending') {
                actionButtons = `<div class="card-actions"><button class="btn-approve" onclick="updateStatus('${article._id}', 'approved')">Approve & Publish</button><button class="btn-reject" onclick="updateStatus('${article._id}', 'rejected')">Reject</button></div>`;
            } else if (article.status === 'approved' || article.status === 'rejected') {
                actionButtons = `<div class="card-actions"><button class="btn-delete-article" onclick="deleteArticle('${article._id}')">Delete Article</button></div>`;
            }

            const cardHTML = `
                <div class="admin-card interactive-card" onclick="if(!event.target.closest('.card-actions')) window.open('${article.sourceLink}', '_blank')">
                    <div class="card-layout-side">
                        ${article.thumbnail ? `<div class="card-thumb-wrapper"><img src="${article.thumbnail}" class="card-thumbnail-left" alt="Thumbnail"></div>` : ''}
                        <div class="card-details-wrapper">
                            <div class="card-header-row">
                                <div>
                                    <h2 class="card-title">${article.title}</h2>
                                    <div class="card-meta"><span>By <strong>${article.author}</strong></span><span>•</span><span>${date}</span><span>•</span><span class="category-badge">${article.category}</span></div>
                                </div>
                                <span class="status-badge status-${article.status}">${article.status.toUpperCase()}</span>
                            </div>
                            ${actionButtons}
                        </div>
                    </div>
                </div>`;
            queueContainer.insertAdjacentHTML('beforeend', cardHTML);
        });
    }

    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (e.target.classList.contains('active')) return;

            tabBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.getAttribute('data-target');
            
            articleSearchInput.value = '';
            userSearchInput.value = '';
            searchResults.innerHTML = '<p style="text-align: center; color: #888; padding: 20px;">Enter a username above to search for an account.</p>';

            userContainer.style.display = 'none';
            articleSearchContainer.style.display = 'none';
            queueContainer.style.display = 'none';
            reportsContainer.style.display = 'none';
            adminRequestsContainer.style.display = 'none';

            if (currentFilter === 'users') {
                userContainer.style.display = 'block';
                triggerAnimation(userContainer);
            } else if (currentFilter === 'reports') {
                reportsContainer.style.display = 'flex';
                fetchReports();
                triggerAnimation(reportsContainer);
            } else if (currentFilter === 'admin-requests') {
                adminRequestsContainer.style.display = 'flex';
                fetchAdminRequests();
                triggerAnimation(adminRequestsContainer);
            } else {
                if (currentFilter === 'approved') {
                    articleSearchContainer.style.display = 'flex';
                    triggerAnimation(articleSearchContainer);
                }
                queueContainer.style.display = 'flex';
                renderArticles();
                triggerAnimation(queueContainer);
            }
        });
    });

    articleSearchInput.addEventListener('input', (e) => { renderArticles(e.target.value.trim().toLowerCase()); });

    window.updateStatus = async function(articleId, newStatus) {
        let adminMessage = "";
        if (newStatus === 'rejected') {
            adminMessage = await customRejectPrompt();
            if (adminMessage === null) return; 
        } else {
            const confirmed = await customConfirm("Approve Article", "Are you sure you want to approve and publish this article?", "Approve", "#27ae60");
            if (!confirmed) return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/admin/articles/${articleId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus, adminMessage: adminMessage })
            });

            if (response.ok) await fetchArticles(); 
            else showCustomAlert("Error", "Failed to update status.", "error");
        } catch (error) { showCustomAlert("Error", "Server error while updating status.", "error"); }
    };

    window.deleteArticle = async function(articleId) {
        const confirmed = await customConfirm("Delete Article", "Are you sure you want to permanently delete this article? This action cannot be undone.", "Delete", "#e74c3c");
        if (!confirmed) return;
        try {
            const response = await fetch(`http://localhost:3000/api/admin/articles/${articleId}`, { method: 'DELETE' });
            if (response.ok) {
                showCustomAlert("Success", "Article permanently deleted.", "success");
                await fetchArticles(); 
            } else {
                showCustomAlert("Error", "Failed to delete article.", "error");
            }
        } catch (error) { showCustomAlert("Error", "Server error while attempting to delete the article.", "error"); }
    };

    // ==========================================
    // USER MANAGEMENT LOGIC
    // ==========================================
    let userSearchTimeout;
    userSearchInput.addEventListener('input', (e) => {
        clearTimeout(userSearchTimeout); 
        const query = e.target.value.trim();

        if (!query) {
            searchResults.innerHTML = '<p style="text-align: center; color: #888; padding: 20px;">Enter a username above to search for an account.</p>';
            return;
        }
        searchResults.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Searching...</p>';

        userSearchTimeout = setTimeout(async () => {
            try {
                const response = await fetch(`http://localhost:3000/api/admin/users/search?q=${encodeURIComponent(query)}`);
                if (response.ok) renderUserCards(await response.json());
                else searchResults.innerHTML = `<p style="text-align: center; color: #e74c3c; padding: 20px;">Error searching users.</p>`;
            } catch (err) { searchResults.innerHTML = `<p style="text-align: center; color: #e74c3c; padding: 20px;">Server error.</p>`; }
        }, 300);
    });

    async function renderUserCards(users) {
        if (!users || users.length === 0) {
            searchResults.innerHTML = `<p style="text-align: center; color: #e74c3c; padding: 20px;">No users found matching that name.</p>`;
            return;
        }

        // Make sure we have the latest badges before rendering!
        await window.verifiedAdminsPromise;

        let htmlString = '';
        users.forEach((user, index) => {
            const pfp = user.pfp ? `<img src="${user.pfp}" style="width:50px; height:50px; border-radius:50%; object-fit:cover;">` : `<div style="width:50px; height:50px; border-radius:50%; background:#596272; color:#fff; display:flex; justify-content:center; align-items:center; font-size:24px; font-weight:bold;">${user.username.charAt(0).toUpperCase()}</div>`;
            
            let banStatusHtml = '';
            if (user.isBanned) banStatusHtml = user.banUntil ? `<span style="color:#d35400; font-weight:bold; font-size:12px;">Banned until ${new Date(user.banUntil).toLocaleDateString()}</span>` : `<span style="color:#c0392b; font-weight:bold; font-size:12px;">Permanently Banned</span>`;
            
            let actionsHtml = '';
            if (user.username.toLowerCase() === loggedInUser.toLowerCase()) {
                actionsHtml = `<span style="color:#888; font-style:italic;">This is you</span>`;
            } else if (user.role === 'admin') {
                if (user.isSuperAdmin) {
                    actionsHtml = `<span style="color:#f39c12; font-weight:bold; border: 1px solid #f39c12; padding: 4px 8px; border-radius: 4px; font-size: 11px;">SUPER ADMIN</span>`;
                } else {
                    actionsHtml = `<button class="btn-reject" style="background:#e67e22;" onclick="event.stopPropagation(); revokeAdmin('${user.username}')">Revoke Admin</button>`;
                }
            } else {
                actionsHtml += user.isBanned ? `<button class="btn-unban" onclick="event.stopPropagation(); banUser('${user.username}', 'unban')">Unban User</button>` : `<button class="btn-ban" onclick="event.stopPropagation(); banUser('${user.username}', 'ban')">Ban User</button>`;
            }

            // --- ADDED: Verified Admin Badge to User Management ---
            const badgeHTML = window.getBadgeHTML(user.username);

            htmlString += `
                <div class="user-result-card slide-down-item" style="animation-delay: ${index * 0.1}s; cursor:pointer;" onclick="window.location.href='../pages/user-profile.html?user=${user.username}'">
                    <div class="user-info-group">${pfp}<div><h3 style="margin:0; font-size: 18px; color: #0F3047; display:flex; align-items:center;">${user.username} ${badgeHTML} <span style="font-size:12px; color:#888; text-transform:uppercase; border:1px solid #ccc; padding:2px 6px; border-radius:4px; margin-left:5px;">${user.role}</span></h3><div style="margin-top:4px;">${banStatusHtml}</div></div></div>
                    <div class="user-action-group">${actionsHtml}</div>
                </div>`;
        });
        searchResults.innerHTML = htmlString;
    }

    window.revokeAdmin = async function(username) {
        const confirmed = await customConfirm("Revoke Access", `Are you sure you want to remove Admin privileges from ${username}?`, "Revoke Admin", "#e67e22");
        if (!confirmed) return;

        try {
            const response = await fetch(`http://localhost:3000/api/admin/users/${username}/revoke`, { method: 'PUT' });
            if (response.ok) {
                showCustomAlert("Success", `${username} is no longer an Admin.`, "success");
                
                // If we revoked admin, refresh the global badge list in the background!
                window.verifiedAdminsPromise = fetch('http://localhost:3000/api/admins')
                    .then(r => r.json())
                    .then(data => { window.verifiedAdmins = data; });

                userSearchInput.dispatchEvent(new Event('input')); 
            } else {
                const data = await response.json();
                showCustomAlert("Error", data.error || "Failed to revoke access.", "error");
            }
        } catch(err) { showCustomAlert("Error", "Server error.", "error"); }
    };

    window.banUser = async function(username, action) {
        let durationHours = 0; 
        if (action === 'ban') {
            const selectedDuration = await customBanModal(username);
            if (selectedDuration === null) return; 
            durationHours = selectedDuration;
        } else {
            const confirmed = await customConfirm("Unban User", `Are you sure you want to unban ${username}?`, "Unban", "#27ae60");
            if (!confirmed) return;
        }
        try {
            const response = await fetch(`http://localhost:3000/api/admin/users/${username}/ban`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: action, durationHours: durationHours }) });
            if(response.ok) {
                showCustomAlert("Success", action === 'unban' ? `${username} has been unbanned.` : `${username} has been banned.`, "success");
                userSearchInput.dispatchEvent(new Event('input'));
            } else {
                showCustomAlert("Error", `Failed to ${action} user.`, "error");
            }
        } catch(err) { showCustomAlert("Error", "Server error.", "error"); }
    };

    // Make sure we wait for the admins to load before fetching initial data
    window.verifiedAdminsPromise.then(() => fetchArticles());
});