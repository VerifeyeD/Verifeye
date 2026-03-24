// --- NEW: GLOBAL VERIFIED ADMINS FETCHER ---
// This runs globally on every page load to grab the list of verified admins
window.verifiedAdmins = [];
window.verifiedAdminsPromise = fetch('http://localhost:3000/api/admins')
    .then(res => res.json())
    .then(data => { window.verifiedAdmins = data; })
    .catch(err => console.error("Error loading admins:", err));

// This function checks if a user is an admin and returns the badge icon!
window.getBadgeHTML = function(username) {
    if (!username) return '';
    if (window.verifiedAdmins.includes(username.toLowerCase())) {
        // Fallback trick: If you haven't uploaded verified-badge.png yet, it draws an SVG!
        return `<img src="../assets/images/verified-badge.png" class="verified-badge" title="Verified Admin" alt="✔" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 24 24\\' fill=\\'%2306629b\\'><path d=\\'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z\\'/></svg>'">`;
    }
    return '';
};

document.addEventListener('DOMContentLoaded', () => {

    // =====================================================================
    // 1. DYNAMIC COMPONENT INJECTION (CSS & HTML)
    // =====================================================================
    const componentCSS = `
    <style>
        /* CSS for the new Verified Badge! */
        .verified-badge { width: 18px; height: 18px; margin-left: 4px; vertical-align: -3px; display: inline-block; object-fit: contain; }

        #edit-profile-modal, #crop-modal, #request-admin-modal { display: none; position: fixed; z-index: 999999; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.7); justify-content: center; align-items: center; }
        #edit-profile-modal.show, #crop-modal.show, #request-admin-modal.show { display: flex !important; }
        .modal-content { background-color: #f3eff5; color: #0e0d0e; padding: 30px; border-radius: 12px; width: 400px; max-width: 90%; position: relative; box-shadow: 0 5px 25px rgba(0,0,0,0.5); max-height: 90vh; overflow-y: auto; }
        .crop-container { width: 500px; }
        .close-btn { position: absolute; top: 15px; right: 20px; font-size: 28px; font-weight: bold; cursor: pointer; color: #555; line-height: 1; }
        .close-btn:hover { color: #000; }
        .profile-pic-group { text-align: center; margin-bottom: 25px; }
        .pfp-preview-container { width: 100px; height: 100px; border-radius: 50%; background: #ececec; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; font-size: 40px; font-weight: 700; color: #222b3e; border: 2px solid #ccc; overflow: hidden; }
        .pfp-actions { display: flex; justify-content: center; gap: 10px; }
        .pfp-action-btn { display: inline-block; width: 130px; height: 40px; line-height: 40px; text-align: center; font-size: 13px; font-weight: 600; border-radius: 5px; cursor: pointer; border: none; padding: 0; margin: 0; transition: 0.2s; box-sizing: border-box; text-decoration: none; }
        .upload-btn { background-color: #222b3e; color: white; }
        .upload-btn:hover { background-color: #596272; }
        .remove-btn { background-color: #e74c3c; color: white; }
        .remove-btn:hover { background-color: #c0392b; }
        .form-group { margin-bottom: 15px; text-align: left; }
        .form-group label { display: block; margin-bottom: 6px; font-weight: 600; font-size: 14px; }
        .form-group .input-field { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 6px; font-size: 15px; background: #fff; font-family: inherit; }
        .btn-save { width: 100%; padding: 14px; background: #222b3e; color: #ececec; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; margin-top: 10px; transition: 0.3s; }
        .btn-save:hover { background: #596272; }
        .img-container { width: 100%; height: 300px; background-color: #ddd; margin-bottom: 15px; overflow: hidden; border-radius: 8px; }
        .img-container img { max-width: 100%; display: block; }
        .crop-controls { display: flex; justify-content: center; gap: 10px; margin-bottom: 20px; }
        .tool-btn { background: #ececec; border: 1px solid #ccc; border-radius: 5px; padding: 8px 15px; font-size: 18px; cursor: pointer; transition: 0.2s; color: #333; }
        .tool-btn:hover { background: #d4d4d4; }
        .crop-actions { display: flex; gap: 15px; }
        .btn-cancel { flex: 1; padding: 14px; background: #ccc; color: #333; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: 0.3s; }
        .btn-cancel:hover { background: #bbb; }
        
        .notif-item { display:flex; align-items:flex-start; gap:12px; padding:12px 15px; cursor:pointer; border-bottom:1px solid #f5f5f5; transition:0.2s; }
        .notif-item:hover { background-color: #e4e6eb !important; }
        .notif-item.unread { background-color: #f0f7ff; }
        .notif-item.read { background-color: #fff; }
        #notif-btn:hover { background-color: #e4e6eb !important; }

        .dropdown-menu button:hover { background-color: #e4e6eb !important; color: #06629b !important; }

        .dropdown-menu { visibility: hidden; opacity: 0; transform: translateY(-15px); transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); display: block !important; }
        .dropdown-menu.show { visibility: visible; opacity: 1; transform: translateY(0); }
        
        #notif-dropdown { visibility: hidden; opacity: 0; transform: translateY(-15px); transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); display: block !important; }
        #notif-dropdown.show { visibility: visible; opacity: 1; transform: translateY(0); }

        #user-hover-card { position: absolute; display: none; width: 320px; background: #fff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); z-index: 999999; padding: 20px; border: 1px solid #e0e0e0; pointer-events: auto; }
        .user-hover-link { cursor: pointer; color: inherit; text-decoration: none; }
        .user-hover-link:hover { text-decoration: underline; color: #06629b; }

        .custom-alert-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 999999; opacity: 0; visibility: hidden; transition: 0.3s ease; }
        .custom-alert-overlay.show { opacity: 1; visibility: visible; }
        .custom-alert-box { background: #f3eff5; padding: 35px 40px; border-radius: 20px; text-align: center; box-shadow: 0 15px 35px rgba(0,0,0,0.3); transform: translateY(-40px) scale(0.9); transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); max-width: 400px; width: 90%; }
        .custom-alert-overlay.show .custom-alert-box { transform: translateY(0) scale(1); }
        .custom-alert-icon { font-size: 65px; margin-bottom: 10px; }
        .custom-alert-error .custom-alert-icon { color: #e74c3c; }
        .custom-alert-success .custom-alert-icon { color: #27ae60; }
        .custom-alert-title { font-size: 24px; color: #222b3e; margin-bottom: 10px; font-weight: 700; }
        .custom-alert-message { font-size: 16px; color: #555; margin-bottom: 25px; line-height: 1.5; }
        .custom-alert-btn { background: #222b3e; color: #fff; border: none; padding: 12px 35px; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; transition: 0.2s; }
        .custom-alert-btn:hover { background: #596272; transform: scale(1.05); }
    </style>
    `;

    const modalsHTML = `
        <div id="edit-profile-modal" class="modal">
            <div class="modal-content">
                <span class="close-btn" id="close-edit-modal">&times;</span>
                <h2>Edit Profile</h2>
                <form id="edit-profile-form">
                    <div class="profile-pic-group">
                        <div class="pfp-preview-container" id="pfp-preview"></div>
                        <div class="pfp-actions">
                            <label for="pfp-upload" class="pfp-action-btn upload-btn">Upload Photo</label>
                            <input type="file" id="pfp-upload" accept="image/*" style="display: none;">
                            <button type="button" id="pfp-remove" class="pfp-action-btn remove-btn">Remove Photo</button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="edit-username">Username</label>
                        <input type="text" id="edit-username" class="input-field" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-bio">Short Bio</label>
                        <textarea id="edit-bio" class="input-field" rows="2" placeholder="Tell us about yourself..."></textarea>
                    </div>
                    <div class="form-group">
                        <label for="edit-website">Website</label>
                        <input type="url" id="edit-website" class="input-field" placeholder="https://yourwebsite.com">
                    </div>
                    <button type="submit" class="btn-save">Save Changes</button>
                </form>
                <div style="margin-top: 20px; text-align: center; padding-top: 15px; border-top: 1px solid #ddd;">
                    <button type="button" id="delete-account-btn" style="background: none; border: none; color: #e74c3c; font-size: 14px; font-weight: bold; cursor: pointer; text-decoration: underline;">Delete Account</button>
                </div>
            </div>
        </div>

        <div id="crop-modal" class="modal">
            <div class="modal-content crop-container">
                <h2>Adjust Picture</h2>
                <div class="img-container"><img id="image-to-crop" src=""></div>
                <div class="crop-controls">
                    <button type="button" class="tool-btn" id="rotate-left">↺</button>
                    <button type="button" class="tool-btn" id="rotate-right">↻</button>
                    <button type="button" class="tool-btn" id="flip-horizontal">↔</button>
                    <button type="button" class="tool-btn" id="flip-vertical">↕</button>
                </div>
                <div class="crop-actions">
                    <button type="button" id="cancel-crop" class="btn-cancel">Cancel</button>
                    <button type="button" id="apply-crop" class="btn-save">Apply</button>
                </div>
            </div>
        </div>

        <div id="request-admin-modal" class="modal">
            <div class="modal-content" style="width: 450px;">
                <span class="close-btn" id="close-request-admin-modal">&times;</span>
                <h2 style="color: #0F3047; margin-bottom: 10px;">Admin Verification</h2>
                <div style="background: #eaf4fc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #cce4f7;">
                    <h4 style="color: #06629b; margin-bottom: 5px; font-size: 15px;">Requirements for Admin Badge:</h4>
                    <ul style="font-size: 13px; color: #444; padding-left: 20px; line-height: 1.6;">
                        <li>At least 50+ approved articles submitted.</li>
                        <li>Consistent, proper interactions in Discussions.</li>
                        <li>History of leaving helpful, educational comments.</li>
                    </ul>
                </div>
                <form id="request-admin-form">
                    <div class="form-group">
                        <label>Why do you want to be an Admin?</label>
                        <textarea id="admin-reason-input" class="input-field" rows="4" placeholder="Explain how you can help moderate the VerifEye community..." required style="resize: vertical;"></textarea>
                    </div>
                    <button type="submit" class="btn-save">Submit Request</button>
                </form>
            </div>
        </div>

        <div id="user-hover-card" onmouseenter="clearTimeout(window.hideHoverCardTimer)" onmouseleave="window.closeHoverCard()"></div>
    `;

    document.head.insertAdjacentHTML('beforeend', componentCSS);
    document.body.insertAdjacentHTML('beforeend', modalsHTML);

    if (!document.getElementById('custom-alert-overlay')) {
        const alertHTML = `<div id="custom-alert-overlay" class="custom-alert-overlay"><div class="custom-alert-box" id="custom-alert-box"><div class="custom-alert-icon" id="custom-alert-icon"></div><h2 class="custom-alert-title" id="custom-alert-title"></h2><p class="custom-alert-message" id="custom-alert-message"></p><button class="custom-alert-btn" onclick="window.closeCustomAlert()">OK</button></div></div>`;
        document.body.insertAdjacentHTML('beforeend', alertHTML);
    }

    // =====================================================================
    // 2. GLOBAL ALERT LOGIC
    // =====================================================================
    if (!window.showCustomAlert) {
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
    }

    // =====================================================================
    // 3. SETUP VARIABLES & NAVIGATION UI
    // =====================================================================
    const authStatusDiv = document.getElementById('auth-status');
    const loggedInUser = localStorage.getItem('verifeye_user');
    const savedPfp = localStorage.getItem('verifeye_pfp'); 
    const userRole = localStorage.getItem('verifeye_role'); 
    
    let cropper = null; 
    let tempPfpData = savedPfp || ""; 

    function timeAgoNotif(dateString) {
        const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return Math.floor(seconds / 60) + 'm';
        if (seconds < 86400) return Math.floor(seconds / 3600) + 'h';
        if (seconds < 604800) return Math.floor(seconds / 86400) + 'd';
        return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    async function loadNotifications() {
        if (!loggedInUser) return;
        try {
            const response = await fetch(`http://localhost:3000/api/notifications/${loggedInUser}`);
            const notifs = await response.json();
            
            const badge = document.getElementById('notif-badge');
            const list = document.getElementById('notif-list');
            const unreadCount = notifs.filter(n => !n.isRead).length;
            
            if (unreadCount > 0) {
                badge.style.display = 'flex';
                badge.innerText = unreadCount;
            } else {
                badge.style.display = 'none';
            }

            list.innerHTML = '';
            if (notifs.length === 0) {
                list.innerHTML = '<div style="padding:20px; text-align:center; color:#888; font-size:14px;">No new notifications</div>';
            } else {
                notifs.forEach(n => {
                    const avatarHtml = n.senderPfp 
                        ? `<img src="${n.senderPfp}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;">`
                        : `<div style="width:40px; height:40px; border-radius:50%; background:#596272; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:16px;">${n.sender.charAt(0).toUpperCase()}</div>`;
                    
                    const stateClass = n.isRead ? 'read' : 'unread';
                    const dot = !n.isRead ? `<div style="width:10px; height:10px; border-radius:50%; background:#06629b; margin-top:15px; flex-shrink:0;"></div>` : '';

                    list.insertAdjacentHTML('beforeend', `
                        <div class="notif-item ${stateClass}" data-id="${n._id}" data-thread="${n.threadId}">
                            ${avatarHtml}
                            <div style="flex:1;">
                                <div style="font-size:14px; color:#333; line-height:1.4;"><strong style="color:#0F3047;">${n.sender}</strong> ${n.message}</div>
                                <div style="font-size:12px; color:#06629b; margin-top:4px; font-weight:600;">${timeAgoNotif(n.createdAt)}</div>
                            </div>
                            ${dot}
                        </div>
                    `);
                });
            }
        } catch (err) { console.error('Error fetching notifications', err); }
    }

    if (loggedInUser && authStatusDiv) {
        const initial = loggedInUser.charAt(0).toUpperCase();
        const profileIconContent = savedPfp ? `<img src="${savedPfp}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">` : initial;

        const adminBtnHtml = userRole === 'admin' 
            ? `<button id="admin-dashboard-btn-nav" style="color:#0e0d0e; padding:12px 20px; display:block; width:100%; text-align:left; background:none; border:none; font-size:15px; cursor:pointer; border-bottom: 1px solid #ddd;">Admin Dashboard</button>` 
            : '';
            
        const requestAdminBtnHtml = userRole !== 'admin' 
            ? `<button id="request-admin-btn-nav" style="color:#0e0d0e; padding:12px 20px; display:block; width:100%; text-align:left; background:none; border:none; font-size:15px; cursor:pointer;">Request to be an Admin</button>` 
            : '';

        authStatusDiv.innerHTML = `
            <div class="profile-container" style="display:flex; align-items:center; gap:15px;">
                <span class="user-greeting" style="font-weight:600; font-size:16px; color:inherit;">Hi, ${loggedInUser}!</span>
                <div class="profile-menu-wrapper" style="position:relative; display:inline-block;">
                    <div class="profile-icon" id="profile-btn" style="width:45px; height:45px; border-radius:50%; background:#596272; color:#fff; display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:700; cursor:pointer; text-transform:uppercase; overflow:hidden; border: 2px solid transparent; transition: 0.2s;">
                        ${profileIconContent}
                    </div>
                    <div class="dropdown-menu" id="profile-dropdown" style="position:absolute; right:0; top:55px; background-color:#f3eff5; min-width:160px; box-shadow:0px 8px 25px rgba(0,0,0,0.2); border-radius:8px; z-index:999999; overflow:hidden; padding: 5px 0;">
                        ${adminBtnHtml}
                        <button id="view-profile-btn-nav" style="color:#0e0d0e; padding:12px 20px; display:block; width:100%; text-align:left; background:none; border:none; font-size:15px; cursor:pointer;">View profile</button>
                        <button id="edit-profile-btn-nav" style="color:#0e0d0e; padding:12px 20px; display:block; width:100%; text-align:left; background:none; border:none; font-size:15px; cursor:pointer;">Edit profile</button>
                        ${requestAdminBtnHtml}
                        <hr style="border:none; border-top:1px solid #ddd; margin: 5px 0;">
                        <button id="logout-btn" style="color:#e74c3c; padding:12px 20px; display:block; width:100%; text-align:left; background:none; border:none; font-size:15px; font-weight: 600; cursor:pointer;">Logout</button>
                    </div>
                </div>
                <div class="notification-wrapper" style="position:relative; display:inline-block; margin-left: 5px;">
                    <div id="notif-btn" style="cursor:pointer; display:flex; align-items:center; justify-content:center; width:40px; height:40px; border-radius:50%; background:#f4f7f9; transition:0.2s;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px; height:20px;"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                        <span id="notif-badge" style="display:none; position:absolute; top:-2px; right:-2px; background:#e74c3c; color:white; border-radius:50%; min-width:18px; height:18px; font-size:11px; font-weight:bold; align-items:center; justify-content:center;">0</span>
                    </div>
                    <div id="notif-dropdown" style="position:absolute; right:0; top:50px; background:#fff; width:340px; max-height:450px; overflow-y:auto; box-shadow:0px 8px 25px rgba(0,0,0,0.15); border-radius:8px; z-index:999999; padding:0;">
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:15px 20px; border-bottom:1px solid #eee; position:sticky; top:0; background:#fff; z-index:10;">
                            <h3 style="margin:0; font-size:16px; color:#0F3047; font-weight:700;">Notifications</h3>
                            <span id="mark-all-read-btn" style="font-size:13px; color:#06629b; cursor:pointer; font-weight:600;">Mark all read</span>
                        </div>
                        <div id="notif-list" style="padding: 5px 0;">Loading...</div>
                    </div>
                </div>
            </div>
        `;
        loadNotifications(); 
    } else if (authStatusDiv) {
        authStatusDiv.innerHTML = `<button class="btn-login" style="padding:10px 30px; background:#596272; color:#ececec; border:none; border-radius:10px; cursor:pointer;" onclick="window.location.href='../pages/login.html'">Login</button>`;
    }


    const articleStatBox = document.getElementById('articles-stat-box');
    const discussStatBox = document.getElementById('discussions-stat-box');
    const commentStatBox = document.getElementById('comments-stat-box');

    if (articleStatBox && discussStatBox && commentStatBox) {
        const urlParams = new URLSearchParams(window.location.search);
        const profileUsername = urlParams.get('user') || loggedInUser; 

        articleStatBox.style.cursor = 'pointer';
        articleStatBox.onclick = () => window.location.href = `../pages/user-activity.html?user=${profileUsername}&tab=articles`;

        discussStatBox.style.cursor = 'pointer';
        discussStatBox.onclick = () => window.location.href = `../pages/user-activity.html?user=${profileUsername}&tab=discussions`;

        commentStatBox.style.cursor = 'pointer';
        commentStatBox.onclick = () => window.location.href = `../pages/user-activity.html?user=${profileUsername}&tab=comments`;
        
        [articleStatBox, discussStatBox, commentStatBox].forEach(box => {
            box.style.transition = '0.2s';
            box.addEventListener('mouseenter', () => box.style.transform = 'translateY(-3px)');
            box.addEventListener('mouseleave', () => box.style.transform = 'translateY(0)');
        });
    }

    // =====================================================================
    // 4. FACEBOOK-STYLE HOVER CARD LOGIC
    // =====================================================================
    window.hoverCardTimer = null;
    window.hideHoverCardTimer = null;

    document.addEventListener('mouseover', (e) => {
        const trigger = e.target.closest('.user-hover-link');
        if (trigger) {
            clearTimeout(window.hideHoverCardTimer);
            window.hoverCardTimer = setTimeout(async () => {
                const username = trigger.getAttribute('data-username');
                if (!username || username === 'Deleted account') return;

                const card = document.getElementById('user-hover-card');
                const rect = trigger.getBoundingClientRect();
                
                card.style.top = (rect.bottom + window.scrollY + 10) + 'px';
                card.style.left = Math.max(10, (rect.left + window.scrollX - 50)) + 'px'; 
                card.style.display = 'block';
                card.innerHTML = '<div style="text-align:center; padding: 20px; color:#888; font-size: 14px;">Loading user...</div>';

                try {
                    const res = await fetch(`http://localhost:3000/api/user/${username}`);
                    if(res.ok) {
                        const data = await res.json();
                        const pfp = data.user.pfp 
                            ? `<img src="${data.user.pfp}" style="width:70px; height:70px; border-radius:50%; object-fit:cover; border: 2px solid #eee;">` 
                            : `<div style="width:70px; height:70px; border-radius:50%; background:#596272; color:#fff; display:flex; align-items:center; justify-content:center; font-size:28px; font-weight:bold;">${username.charAt(0).toUpperCase()}</div>`;
                        
                        // Added Badge to Hover Card!
                        const badgeHTML = window.getBadgeHTML(username);

                        card.innerHTML = `
                            <div style="display:flex; gap:15px; margin-bottom:15px;">
                                <a href="../pages/user-profile.html?user=${username}">${pfp}</a>
                                <div>
                                    <a href="../pages/user-profile.html?user=${username}" style="text-decoration:none; color:inherit;">
                                        <h3 style="margin:0; color:#0F3047; font-size:20px; display:flex; align-items:center;">${username} ${badgeHTML}</h3>
                                    </a>
                                    <p style="margin:8px 0 0 0; font-size:13px; color:#555; line-height: 1.4;">${data.user.bio || 'No bio provided yet.'}</p>
                                </div>
                            </div>
                            <div style="display:flex; justify-content: space-between; border-top:1px solid #eee; padding-top:15px;">
                                <div style="text-align: center;"><div style="font-size:16px; font-weight: bold; color:#06629b;">${data.stats.articles}</div><div style="font-size:11px; color:#888; text-transform: uppercase;">Articles</div></div>
                                <div style="text-align: center;"><div style="font-size:16px; font-weight: bold; color:#06629b;">${data.stats.discussions}</div><div style="font-size:11px; color:#888; text-transform: uppercase;">Posts</div></div>
                                <div style="text-align: center;"><div style="font-size:16px; font-weight: bold; color:#06629b;">${data.stats.comments}</div><div style="font-size:11px; color:#888; text-transform: uppercase;">Comments</div></div>
                            </div>
                        `;
                    } else {
                        card.innerHTML = '<div style="color:#e74c3c; text-align:center; padding: 20px;">User not found</div>';
                    }
                } catch(err) {
                    card.innerHTML = '<div style="color:#e74c3c; text-align:center; padding: 20px;">Error loading user details.</div>';
                }
            }, 500); 
        }
    });

    window.closeHoverCard = function() {
        window.hideHoverCardTimer = setTimeout(() => {
            const card = document.getElementById('user-hover-card');
            if (card) card.style.display = 'none';
        }, 300); 
    };

    document.addEventListener('mouseout', (e) => {
        if (e.target.closest('.user-hover-link')) {
            clearTimeout(window.hoverCardTimer);
            window.closeHoverCard();
        }
    });

    // =====================================================================
    // 5. GLOBAL CLICK LISTENER (Dropdowns, Modals, Notifs, Admin Requests)
    // =====================================================================
    document.addEventListener('click', async (e) => {
        
        if (e.target.closest('#profile-btn')) {
            const menu = document.getElementById('profile-dropdown');
            const notifMenu = document.getElementById('notif-dropdown');
            if(notifMenu) notifMenu.classList.remove('show'); 
            if (menu) menu.classList.toggle('show');
            return;
        }

        if (e.target.closest('#notif-btn')) {
            const notifMenu = document.getElementById('notif-dropdown');
            const profileMenu = document.getElementById('profile-dropdown');
            if(profileMenu) profileMenu.classList.remove('show');
            if (notifMenu) {
                if(notifMenu.classList.contains('show')) {
                    notifMenu.classList.remove('show');
                } else {
                    notifMenu.classList.add('show');
                    loadNotifications(); 
                }
            }
            return;
        }

        const notifItem = e.target.closest('.notif-item');
        if (notifItem) {
            const notifId = notifItem.getAttribute('data-id');
            const threadId = notifItem.getAttribute('data-thread');
            try {
                await fetch(`http://localhost:3000/api/notifications/${notifId}/read`, { method: 'PUT' });
                if (!threadId || threadId === 'null') {
                    notifItem.classList.remove('unread');
                    notifItem.classList.add('read');
                    const dot = notifItem.querySelector('div[style*="background:#06629b"]');
                    if (dot) dot.remove();
                    const badge = document.getElementById('notif-badge');
                    let count = parseInt(badge.innerText) - 1;
                    if (count > 0) badge.innerText = count;
                    else badge.style.display = 'none';
                    return; 
                } else {
                    window.location.href = `../pages/view-thread.html?id=${threadId}`;
                }
            } catch(err) { console.error(err); }
            return;
        }

        if (e.target.closest('#mark-all-read-btn')) {
            try {
                await fetch(`http://localhost:3000/api/notifications/read-all/${loggedInUser}`, { method: 'PUT' });
                loadNotifications(); 
            } catch(err) { console.error(err); }
            return;
        }

        if (e.target.closest('#admin-dashboard-btn-nav')) {
            window.location.href = '../pages/admin-dashboard.html';
            return;
        }

        if (e.target.closest('#view-profile-btn-nav')) {
            window.location.href = `../pages/user-profile.html?user=${loggedInUser}`;
            return;
        }

        if (e.target.closest('#request-admin-btn-nav')) {
            e.preventDefault();
            const modal = document.getElementById('request-admin-modal');
            if (modal) { modal.style.display = 'flex'; modal.classList.add('show'); }
            const menu = document.getElementById('profile-dropdown');
            if (menu) menu.classList.remove('show');
            return;
        }

        if (e.target.closest('#close-request-admin-modal')) {
            const modal = document.getElementById('request-admin-modal');
            if (modal) { modal.style.display = 'none'; modal.classList.remove('show'); }
            return;
        }

        if (e.target.closest('#edit-profile-btn-nav') || e.target.closest('#edit-profile-btn')) {
            e.preventDefault();
            const modal = document.getElementById('edit-profile-modal');
            const usernameInput = document.getElementById('edit-username');
            const previewDiv = document.getElementById('pfp-preview');
            
            if (modal) { modal.style.display = 'flex'; modal.classList.add('show'); }
            if (usernameInput) usernameInput.value = loggedInUser || '';
            if (previewDiv) {
                previewDiv.innerHTML = tempPfpData 
                    ? `<img src="${tempPfpData}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">` 
                    : (loggedInUser ? loggedInUser.charAt(0).toUpperCase() : '?');
            }

            try {
                const response = await fetch(`http://localhost:3000/api/user/${loggedInUser}`);
                if (response.ok) {
                    const data = await response.json();
                    document.getElementById('edit-bio').value = data.user.bio || "";
                    document.getElementById('edit-website').value = data.user.website || "";
                }
            } catch(e) { console.error(e); }

            const menu = document.getElementById('profile-dropdown');
            if (menu) menu.classList.remove('show'); 
            return;
        }

        if (e.target.closest('#logout-btn')) {
            localStorage.removeItem('verifeye_user');
            localStorage.removeItem('verifeye_pfp');
            localStorage.removeItem('verifeye_role');
            window.location.href = '../pages/login.html';
            return;
        }

        if (e.target.closest('#delete-account-btn')) {
            e.preventDefault();
            if (!loggedInUser) return;
            if (confirm("Are you absolutely sure you want to permanently delete your account? This action cannot be undone.")) {
                try {
                    const response = await fetch(`http://localhost:3000/api/user/${loggedInUser}`, { method: 'DELETE' });
                    if (response.ok) {
                        localStorage.removeItem('verifeye_user');
                        localStorage.removeItem('verifeye_pfp');
                        localStorage.removeItem('verifeye_role');
                        window.showCustomAlert("Goodbye", "Account deleted successfully.", "success", () => {
                            window.location.href = '../pages/login.html';
                        });
                    } else {
                        const data = await response.json();
                        window.showCustomAlert("Error", 'Failed to delete account: ' + data.error, "error");
                    }
                } catch (err) { 
                    window.showCustomAlert("Error", "Server error while deleting account.", "error"); 
                }
            }
            return;
        }

        if (e.target.closest('#close-edit-modal')) {
            const modal = document.getElementById('edit-profile-modal');
            if (modal) { modal.style.display = 'none'; modal.classList.remove('show'); }
            tempPfpData = savedPfp || ""; 
            return;
        }

        if (!e.target.closest('.profile-menu-wrapper') && !e.target.closest('.notification-wrapper') && !e.target.closest('#user-hover-card') && !e.target.closest('.custom-alert-box')) {
            const menu = document.getElementById('profile-dropdown');
            const notifMenu = document.getElementById('notif-dropdown');
            if (menu) menu.classList.remove('show'); 
            if (notifMenu) notifMenu.classList.remove('show'); 
        }
    });

    // =====================================================================
    // 6. CROPPER LOGIC
    // =====================================================================
    const pfpUploadInput = document.getElementById('pfp-upload');
    const imageToCrop = document.getElementById('image-to-crop');
    
    if (pfpUploadInput) {
        pfpUploadInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    if(imageToCrop) imageToCrop.src = event.target.result;
                    const editModal = document.getElementById('edit-profile-modal');
                    const cropModal = document.getElementById('crop-modal');
                    if(editModal) { editModal.style.display = 'none'; editModal.classList.remove('show'); }
                    if(cropModal) { cropModal.style.display = 'flex'; cropModal.classList.add('show'); }
                    if (cropper) cropper.destroy();
                    cropper = new Cropper(imageToCrop, { aspectRatio: 1, viewMode: 1, autoCropArea: 1 });
                };
                reader.readAsDataURL(file);
            }
        });

        let flipX = 1, flipY = 1;
        document.getElementById('rotate-left')?.addEventListener('click', () => cropper && cropper.rotate(-90));
        document.getElementById('rotate-right')?.addEventListener('click', () => cropper && cropper.rotate(90));
        document.getElementById('flip-horizontal')?.addEventListener('click', () => { flipX = flipX === 1 ? -1 : 1; if(cropper) cropper.scaleX(flipX); });
        document.getElementById('flip-vertical')?.addEventListener('click', () => { flipY = flipY === 1 ? -1 : 1; if(cropper) cropper.scaleY(flipY); });

        document.getElementById('apply-crop')?.addEventListener('click', () => {
            if (cropper) {
                tempPfpData = cropper.getCroppedCanvas({ width: 250, height: 250 }).toDataURL('image/jpeg', 0.8);
                const preview = document.getElementById('pfp-preview');
                if (preview) { preview.innerHTML = `<img src="${tempPfpData}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`; }
                cropper.destroy(); cropper = null; pfpUploadInput.value = ''; 
                const cropModal = document.getElementById('crop-modal');
                if(cropModal) { cropModal.style.display = 'none'; cropModal.classList.remove('show'); }
                const editModal = document.getElementById('edit-profile-modal');
                if(editModal) { editModal.style.display = 'flex'; editModal.classList.add('show'); }
            }
        });

        document.getElementById('cancel-crop')?.addEventListener('click', () => {
            if (cropper) cropper.destroy(); cropper = null; pfpUploadInput.value = ''; 
            const cropModal = document.getElementById('crop-modal');
            if(cropModal) { cropModal.style.display = 'none'; cropModal.classList.remove('show'); }
            const editModal = document.getElementById('edit-profile-modal');
            if(editModal) { editModal.style.display = 'flex'; editModal.classList.add('show'); }
        });

        document.getElementById('pfp-remove')?.addEventListener('click', () => {
            tempPfpData = ""; 
            const activeUser = document.getElementById('edit-username')?.value || loggedInUser || "?";
            const preview = document.getElementById('pfp-preview');
            if (preview) preview.innerHTML = activeUser.charAt(0).toUpperCase();
            pfpUploadInput.value = ''; 
        });
    }

    // =====================================================================
    // 7. FORM SUBMISSIONS (Profile Edit & Admin Request)
    // =====================================================================
    document.addEventListener('submit', async (e) => {
        if (e.target && e.target.id === 'edit-profile-form') {
            e.preventDefault();
            
            const newUsernameInput = document.getElementById('edit-username').value.trim();
            const newBioInput = document.getElementById('edit-bio').value.trim();
            const newWebsiteInput = document.getElementById('edit-website').value.trim();
            
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn ? submitBtn.innerText : "Save Changes";
            
            if(submitBtn) { submitBtn.innerText = "Saving..."; submitBtn.disabled = true; }

            try {
                const response = await fetch('http://localhost:3000/api/user/update-profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        currentUsername: loggedInUser, 
                        newUsername: newUsernameInput,
                        pfp: tempPfpData,
                        bio: newBioInput,
                        website: newWebsiteInput
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('verifeye_user', data.username);
                    if (tempPfpData === "") {
                        localStorage.removeItem('verifeye_pfp');
                    } else {
                        localStorage.setItem('verifeye_pfp', tempPfpData);
                    }
                    window.showCustomAlert("Success", "Profile updated everywhere successfully!", "success", () => {
                        window.location.reload();
                    });
                } else {
                    window.showCustomAlert("Error", 'Failed to update: ' + data.error, "error");
                    if(submitBtn) { submitBtn.innerText = originalText; submitBtn.disabled = false; }
                }
            } catch (err) {
                console.error(err);
                window.showCustomAlert("Error", "Server error saving profile.", "error");
                if(submitBtn) { submitBtn.innerText = originalText; submitBtn.disabled = false; }
            }
        }

        if (e.target && e.target.id === 'request-admin-form') {
            e.preventDefault();
            const reasonInput = document.getElementById('admin-reason-input').value.trim();
            const submitBtn = e.target.querySelector('button[type="submit"]');
            
            if(submitBtn) { submitBtn.innerText = "Submitting..."; submitBtn.disabled = true; }

            try {
                const response = await fetch('http://localhost:3000/api/user/request-admin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: loggedInUser, reason: reasonInput })
                });

                const data = await response.json();

                if (response.ok) {
                    const modal = document.getElementById('request-admin-modal');
                    if (modal) { modal.style.display = 'none'; modal.classList.remove('show'); }
                    document.getElementById('admin-reason-input').value = ""; 
                    
                    window.showCustomAlert("Request Sent", "Your request to become an Admin has been submitted for review.", "success");
                } else {
                    window.showCustomAlert("Notice", data.error || "Failed to submit request.", "error");
                }
            } catch (err) {
                window.showCustomAlert("Error", "Server error submitting request.", "error");
            } finally {
                if(submitBtn) { submitBtn.innerText = "Submit Request"; submitBtn.disabled = false; }
            }
        }
    });
});