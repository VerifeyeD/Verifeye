document.addEventListener('DOMContentLoaded', () => {

    const userRole = localStorage.getItem('verifeye_role');
    const loggedInUser = localStorage.getItem('verifeye_user');
    
    const glossaryList = document.getElementById('glossary-list');
    const searchInput = document.getElementById('glossary-search');
    const addTermBtn = document.getElementById('add-term-btn');
    
    let allTerms = [];

    // Show "Add Term" button if admin
    if (userRole === 'admin') {
        addTermBtn.style.display = 'inline-block';
    }

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

    window.customConfirm = function(title, message, confirmBtnText = "Yes", confirmBtnColor = "#e74c3c") {
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
    };

    // Fetch and Sort Glossary Terms
    async function fetchGlossary() {
        try {
            const res = await fetch('http://localhost:3000/api/glossary');
            if (res.ok) {
                allTerms = await res.json();
                // AUTOMATICALLY ALPHABETIZE
                allTerms.sort((a, b) => a.term.localeCompare(b.term));
                renderGlossary(allTerms);
            } else {
                glossaryList.innerHTML = '<div style="text-align: center; color: red;">Failed to load terms.</div>';
            }
        } catch (error) {
            glossaryList.innerHTML = '<div style="text-align: center; color: red;">Server error. Is Node.js running?</div>';
        }
    }

    function renderGlossary(termsToRender) {
        glossaryList.innerHTML = '';
        
        if (termsToRender.length === 0) {
            glossaryList.innerHTML = '<div style="text-align: center; color: #888;">No terms found.</div>';
            return;
        }

        termsToRender.forEach(item => {
            let adminControls = '';
            
            // Only admins get the Edit/Delete tools on each item
            if (userRole === 'admin') {
                const escapedTerm = item.term.replace(/'/g, "\\'");
                const escapedDesc = item.description.replace(/'/g, "\\'");
                adminControls = `
                    <div class="glossary-admin-actions">
                        <button class="btn-edit-term" onclick="openGlossaryModal('${item._id}', '${escapedTerm}', '${escapedDesc}')" title="Edit"><i class='bx bxs-edit'></i></button>
                        <button class="btn-delete-term" onclick="deleteGlossaryTerm('${item._id}')" title="Delete"><i class='bx bxs-trash'></i></button>
                    </div>
                `;
            }

            const html = `
                <div class="glossary-item">
                    <h3>${item.term}</h3>
                    <p>${item.description}</p>
                    ${adminControls}
                </div>
            `;
            glossaryList.insertAdjacentHTML('beforeend', html);
        });
    }

    // Live Search
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const filtered = allTerms.filter(item => 
            item.term.toLowerCase().includes(query) || 
            item.description.toLowerCase().includes(query)
        );
        renderGlossary(filtered);
    });

    // --- ADMIN MODAL LOGIC (ADD / EDIT) ---
    window.openGlossaryModal = function(id = null, currentTerm = '', currentDesc = '') {
        document.getElementById('glossary-id').value = id || '';
        document.getElementById('glossary-term-input').value = currentTerm;
        document.getElementById('glossary-desc-input').value = currentDesc;
        
        document.getElementById('glossary-modal-title').innerText = id ? 'Edit Glossary Term' : 'Add Glossary Term';
        
        const modal = document.getElementById('glossary-form-modal');
        modal.style.display = 'flex';
        modal.classList.add('show');
    };

    window.closeGlossaryModal = function() {
        const modal = document.getElementById('glossary-form-modal');
        modal.style.display = 'none';
        modal.classList.remove('show');
    };

    document.getElementById('glossary-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('glossary-id').value;
        const term = document.getElementById('glossary-term-input').value.trim();
        const description = document.getElementById('glossary-desc-input').value.trim();
        
        const btn = document.getElementById('glossary-submit-btn');
        btn.innerText = 'Saving...';
        btn.disabled = true;

        const payload = { term, description, author: loggedInUser };
        
        try {
            let res;
            if (id) {
                // EDIT
                res = await fetch(`http://localhost:3000/api/admin/glossary/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                // CREATE
                res = await fetch('http://localhost:3000/api/admin/glossary', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            if (res.ok) {
                closeGlossaryModal();
                showCustomAlert("Success", id ? "Term updated successfully." : "Term added successfully.", "success");
                fetchGlossary(); // Re-fetch and re-alphabetize
                searchInput.value = ''; // Reset search
            } else {
                showCustomAlert("Error", "Failed to save term.", "error");
            }
        } catch (err) {
            showCustomAlert("Error", "Server error while saving term.", "error");
        } finally {
            btn.innerText = 'Save Term';
            btn.disabled = false;
        }
    });

    window.deleteGlossaryTerm = async function(id) {
        const confirmed = await customConfirm("Delete Term", "Are you sure you want to permanently delete this glossary term?", "Delete", "#e74c3c");
        if (!confirmed) return;

        try {
            const res = await fetch(`http://localhost:3000/api/admin/glossary/${id}`, { method: 'DELETE' });
            if (res.ok) {
                showCustomAlert("Success", "Term deleted successfully.", "success");
                fetchGlossary();
            } else {
                showCustomAlert("Error", "Failed to delete term.", "error");
            }
        } catch (err) {
            showCustomAlert("Error", "Server error while deleting term.", "error");
        }
    };

    fetchGlossary();
});