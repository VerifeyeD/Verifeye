document.addEventListener('DOMContentLoaded', () => {

    // 1. Topic Selector Logic
    const topicRadios = document.querySelectorAll('input[name="topic_type"]');
    topicRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            document.querySelectorAll('.topic-option').forEach(opt => opt.classList.remove('selected'));
            if(e.target.checked) e.target.parentElement.classList.add('selected');
        });
    });

    // 2. Custom Tags Input Logic
    const tagsInput = document.getElementById('tagsInput');
    const tagContainer = document.getElementById('tagContainer');
    
    if (tagsInput && tagContainer) {
        tagsInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const val = this.value.trim();
                if (val) {
                    const span = document.createElement('span');
                    span.className = 'created-tag';
                    span.innerHTML = `${val} <span class="remove-tag" onclick="this.parentElement.remove()" style="margin-left: 6px; cursor: pointer; opacity: 0.6;">x</span>`;
                    tagContainer.insertBefore(span, tagsInput);
                    this.value = '';
                }
            }
        });
    }

    // 3. Rich Text Editor Controls
    const execCmd = (command, value = null) => document.execCommand(command, false, value);
    
    const btnBold = document.getElementById('btnBold');
    if(btnBold) btnBold.onclick = () => execCmd('bold');
    
    const btnItalic = document.getElementById('btnItalic');
    if(btnItalic) btnItalic.onclick = () => execCmd('italic');
    
    const btnUnderline = document.getElementById('btnUnderline');
    if(btnUnderline) btnUnderline.onclick = () => execCmd('underline');

    const btnUl = document.getElementById('btnUl');
    if(btnUl) btnUl.onclick = () => execCmd('insertUnorderedList');

    const btnOl = document.getElementById('btnOl');
    if(btnOl) btnOl.onclick = () => execCmd('insertOrderedList');

    // Image Upload inside Editor
    const btnImage = document.getElementById('btnImage');
    const imageUploadInput = document.getElementById('imageUploadInput');
    if (btnImage && imageUploadInput) {
        btnImage.onclick = () => imageUploadInput.click();
        imageUploadInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    execCmd('insertImage', e.target.result);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // NEW: Foolproof click to enlarge inside the editor
    document.addEventListener('click', (e) => {
        if (e.target.tagName === 'IMG' && e.target.closest('.editor-content')) {
            const viewer = document.getElementById('image-viewer-modal');
            const fullImg = document.getElementById('full-size-image');
            fullImg.src = e.target.src;
            viewer.style.display = 'flex'; // Forces the modal open
        }
    });

    // 4. POST BUTTON LOGIC
    const postBtn = document.querySelector('.btn-post');
    if (postBtn) {
        postBtn.addEventListener('click', async () => {
            const title = document.getElementById('title').value.trim();
            const content = document.getElementById('editor').innerHTML.trim();
            
            const selectedTopic = document.querySelector('input[name="topic_type"]:checked').parentElement.textContent.trim();
            
            const tagsElements = document.querySelectorAll('.created-tag');
            const tagsArray = Array.from(tagsElements).map(el => el.textContent.replace('x', '').trim());

            if (!title || !content) {
                alert("Please provide both a title and a description.");
                return;
            }

            const loggedInUser = localStorage.getItem('verifeye_user');
            const savedPfp = localStorage.getItem('verifeye_pfp');

            if (!loggedInUser) {
                alert("You must be logged in to post a thread.");
                window.location.href = '../pages/login.html';
                return;
            }

            try {
                postBtn.innerText = "Posting...";
                postBtn.disabled = true;

                const response = await fetch('http://localhost:3000/api/discussions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        title: title, 
                        author: loggedInUser, 
                        authorPfp: savedPfp || "", 
                        content: content, 
                        tag: selectedTopic,   
                        tags: tagsArray       
                    })
                });

                if (response.ok) {
                    window.location.href = '../pages/Discussions.html';
                } else {
                    alert("Failed to post thread.");
                    postBtn.innerText = "Post";
                    postBtn.disabled = false;
                }
            } catch (error) {
                console.error("Error posting thread:", error);
                alert("Server error. Is the backend running?");
                postBtn.innerText = "Post";
                postBtn.disabled = false;
            }
        });
    }
});