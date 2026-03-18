// Function to fetch discussions from your Node.js backend
async function loadDiscussions() {
    try {
        // 1. Fetch the data from the server
        const response = await fetch('http://localhost:3000/api/discussions');
        const data = await response.json();

        // 2. Find the container on your page
        const container = document.querySelector('.thread-list-container');
        
        if (container) {
            // 3. Keep the dynamic topic count
            let htmlContent = `<div class="thread-count">${data.count} Topics</div>`;
            
            // 4. Loop through the backend data and use YOUR exact HTML structure
            data.topics.forEach(topic => {
                htmlContent += `
                    <div class="thread-item">
                        <div class="thread-meta">
                            <div class="avatar-circle"></div>
                            <span class="username">${topic.author}</span>
                            <span class="date">Just now</span>
                            <span class="dot">•</span>
                            <span class="tag">Discussion</span>
                        </div>
                        <a href="#" class="thread-title">${topic.title}</a>
                    </div>
                `;
            });

            // 5. Inject it into the page
            container.innerHTML = htmlContent;
        }
    } catch (error) {
        console.error("Error fetching discussions:", error);
    }
}

// Run this as soon as the page loads
document.addEventListener('DOMContentLoaded', loadDiscussions);

document.addEventListener('DOMContentLoaded', () => {
    const authStatusDiv = document.getElementById('auth-status');
    const loggedInUser = localStorage.getItem('verifeye_user');

    if (loggedInUser && authStatusDiv) {
        // If a user is logged in, replace the button with their name and a logout option
        authStatusDiv.innerHTML = `
            <div class="user-profile-nav" style="display: flex; align-items: center; gap: 10px;">
                <span style="color: #333; font-weight: 600;">Hi, ${loggedInUser}!</span>
                <button id="logout-btn" style="padding: 5px 10px; cursor: pointer; border: none; background: #596272; color: white; border-radius: 5px;">Logout</button>
            </div>
        `;

        // Add Logout functionality
        document.getElementById('logout-btn').addEventListener('click', () => {
            localStorage.removeItem('verifeye_user');
            window.location.reload(); // Refresh to show the Login button again
        });
    }
});