document.addEventListener('DOMContentLoaded', async () => {
    // 1. Determine whose profile we are looking at
    const urlParams = new URLSearchParams(window.location.search);
    const targetUser = urlParams.get('user');
    const loggedInUser = localStorage.getItem('verifeye_user');

    if (!targetUser && !loggedInUser) {
        window.location.href = 'login.html';
        return;
    }

    const usernameToFetch = targetUser || loggedInUser;

    const loadingSpinner = document.getElementById('loading-spinner');
    const profileContent = document.getElementById('profile-content');

    // --- WAIT FOR GLOBAL VERIFIED ADMINS TO LOAD ---
    await window.verifiedAdminsPromise; 

    // 2. Fetch the user's data and stats from backend
    try {
        const response = await fetch(`http://localhost:3000/api/user/${usernameToFetch}`);
        
        if (response.ok) {
            const data = await response.json();
            
            // --- THE FIX: Let CSS Flexbox handle the gap, remove the string space ---
            const badgeHTML = window.getBadgeHTML(data.user.username);
            document.getElementById('username-display').innerHTML = `${data.user.username}${badgeHTML}`;

            // --- Fill in the Profile Card ---
            document.getElementById('role-display').innerText = data.user.role.toUpperCase();
            document.getElementById('bio-display').innerText = data.user.bio || "No bio provided.";
            
            if (data.user.website) {
                const webEl = document.getElementById('website-display');
                document.getElementById('website-text').innerText = data.user.website.replace(/^https?:\/\//, '');
                webEl.href = data.user.website.startsWith('http') ? data.user.website : `https://${data.user.website}`;
                webEl.style.display = 'inline-flex';
            }

            const joinDate = new Date(data.user.joinDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
            document.getElementById('joindate-display').innerText = `Joined ${joinDate}`;

            const pfpDisplay = document.getElementById('pfp-display');
            if (data.user.pfp) {
                pfpDisplay.innerHTML = `<img src="${data.user.pfp}">`;
            } else {
                pfpDisplay.innerHTML = data.user.username.charAt(0).toUpperCase();
            }

            // --- Fill in the Stat Numbers ---
            document.getElementById('count-articles').innerText = data.stats.articles;
            document.getElementById('count-discussions').innerText = data.stats.discussions;
            document.getElementById('count-comments').innerText = data.stats.comments;

            // Stats routing
            document.getElementById('stat-articles').onclick = () => {
                window.location.href = `../pages/user-activity.html?user=${data.user.username}&tab=articles`;
            };
            document.getElementById('stat-discussions').onclick = () => {
                window.location.href = `../pages/user-activity.html?user=${data.user.username}&tab=discussions`;
            };
            document.getElementById('stat-comments').onclick = () => {
                window.location.href = `../pages/user-activity.html?user=${data.user.username}&tab=comments`;
            };

            // Show Edit Button if viewing your own profile
            if (loggedInUser && loggedInUser.toLowerCase() === data.user.username.toLowerCase()) {
                document.getElementById('edit-profile-btn').style.display = 'inline-block';
            }

            loadingSpinner.style.display = 'none';
            profileContent.style.display = 'flex';

        } else {
            loadingSpinner.innerHTML = "User not found.";
        }
    } catch (error) {
        console.error(error);
        loadingSpinner.innerHTML = "Server error. Could not load profile.";
    }
});