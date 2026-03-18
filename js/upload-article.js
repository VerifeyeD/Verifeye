document.addEventListener('DOMContentLoaded', () => {
    
    // Custom Alert Logic
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

    // 1. Check Auth
    const loggedInUser = localStorage.getItem('verifeye_user');
    if (!loggedInUser) {
        showCustomAlert("Access Denied", "You must be logged in to submit an article.", "error", () => {
            window.location.href = '../pages/login.html';
        });
        return;
    }

    // 2. Category Selector Logic
    const categoryRadios = document.querySelectorAll('input[name="article_category"]');
    categoryRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            document.querySelectorAll('.topic-option').forEach(opt => opt.classList.remove('selected'));
            if(e.target.checked) e.target.parentElement.classList.add('selected');
        });
    });

    // 3. Thumbnail Upload Logic
    let thumbnailBase64 = "";
    const thumbnailBox = document.getElementById('thumbnail-preview-box');
    const thumbnailInput = document.getElementById('thumbnailUploadInput');

    thumbnailBox.addEventListener('click', () => thumbnailInput.click());

    thumbnailInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                thumbnailBase64 = event.target.result;
                thumbnailBox.innerHTML = `<img src="${thumbnailBase64}" alt="Thumbnail">`;
            };
            reader.readAsDataURL(file);
        }
    });

    // 4. Submit Article Logic
    const submitBtn = document.getElementById('submit-article-btn');
    submitBtn.addEventListener('click', async () => {
        const title = document.getElementById('title').value.trim();
        const sourceLink = document.getElementById('article-link').value.trim();
        const category = document.querySelector('input[name="article_category"]:checked').value;
        const savedPfp = localStorage.getItem('verifeye_pfp');

        if (!title || !sourceLink || !thumbnailBase64) {
            showCustomAlert("Missing Fields", "Please provide a title, a cover thumbnail, and a valid source link.", "error");
            return;
        }

        // Validate URL format
        try {
            new URL(sourceLink);
        } catch (_) {
            showCustomAlert("Invalid Link", "Please provide a valid URL (e.g., https://example.com)", "error");
            return;
        }

        submitBtn.innerText = "Submitting...";
        submitBtn.disabled = true;

        try {
            const response = await fetch('http://localhost:3000/api/articles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    title: title, 
                    author: loggedInUser, 
                    authorPfp: savedPfp || "", 
                    category: category,
                    thumbnail: thumbnailBase64,
                    sourceLink: sourceLink 
                })
            });

            const data = await response.json();

            if (response.ok) {
                showCustomAlert("Success", data.message || "Article submitted for review!", "success", () => {
                    window.location.href = '../pages/article.html';
                });
            } else {
                showCustomAlert("Error", "Failed to submit article.", "error");
                submitBtn.innerText = "Submit Article";
                submitBtn.disabled = false;
            }
        } catch (error) {
            console.error(error);
            showCustomAlert("Error", "Server error. Is the backend running?", "error");
            submitBtn.innerText = "Submit Article";
            submitBtn.disabled = false;
        }
    });
});