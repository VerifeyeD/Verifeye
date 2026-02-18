document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SIMPLE FORMATTING TOOLS (Bold, Italic, etc.) ---
    const btnBold = document.getElementById('btnBold');
    const btnItalic = document.getElementById('btnItalic');
    const btnUnderline = document.getElementById('btnUnderline');
    const btnUl = document.getElementById('btnUl');
    const btnOl = document.getElementById('btnOl');
    const btnIndent = document.getElementById('btnIndent');
    const btnOutdent = document.getElementById('btnOutdent');
    const btnAlign = document.getElementById('btnAlign');
    const btnQuote = document.getElementById('btnQuote');
    const btnLink = document.getElementById('btnLink');

    function exec(command, value = null) {
        document.execCommand(command, false, value);
        document.getElementById('editor').focus();
    }

    btnBold.addEventListener('click', () => exec('bold'));
    btnItalic.addEventListener('click', () => exec('italic'));
    btnUnderline.addEventListener('click', () => exec('underline'));
    btnUl.addEventListener('click', () => exec('insertUnorderedList'));
    btnOl.addEventListener('click', () => exec('insertOrderedList'));
    btnIndent.addEventListener('click', () => exec('indent'));
    btnOutdent.addEventListener('click', () => exec('outdent'));
    btnAlign.addEventListener('click', () => exec('justifyCenter'));
    btnQuote.addEventListener('click', () => exec('formatBlock', 'BLOCKQUOTE'));
    
    btnLink.addEventListener('click', () => {
        const url = prompt('Enter link URL:', 'https://');
        if (url) exec('createLink', url);
    });

    // --- 2. COLOR PICKER LOGIC ---
    const btnColor = document.getElementById('btnColor');
    const colorInput = document.getElementById('colorPickerInput');

    // Trigger hidden color input on icon click
    btnColor.addEventListener('click', () => {
        colorInput.click();
    });

    // Apply color when user selects a color
    colorInput.addEventListener('input', (e) => {
        exec('foreColor', e.target.value);
        // Optional: Update the 'A' icon underline color
        btnColor.style.borderBottomColor = e.target.value;
        btnColor.style.color = e.target.value;
    });

    // --- 3. HIGHLIGHT TOGGLE LOGIC ---
    const btnHighlight = document.getElementById('btnHighlight');
    
    btnHighlight.addEventListener('click', () => {
        // Check if the current selection already has a background color
        const currentColor = document.queryCommandValue('hiliteColor');
        
        // Note: Browsers return 'transparent', 'rgba(0, 0, 0, 0)', or empty string if no color.
        const isTransparent = !currentColor || currentColor === 'transparent' || currentColor === 'rgba(0, 0, 0, 0)';

        if (isTransparent) {
            // Add Highlight (Yellow)
            exec('hiliteColor', '#ffeb3b');
        } else {
            // Remove Highlight (Set to transparent)
            exec('hiliteColor', 'transparent');
        }
    });

    // --- 4. IMAGE UPLOAD LOGIC ---
    const btnImage = document.getElementById('btnImage');
    const imageInput = document.getElementById('imageUploadInput');

    // Trigger hidden file input
    btnImage.addEventListener('click', () => {
        imageInput.click();
    });

    // Handle file selection
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                // Insert the image into the editor
                exec('insertImage', e.target.result);
            };
            reader.readAsDataURL(file);
        }
        // Reset input so same file can be selected again if needed
        imageInput.value = '';
    });

    // --- 5. DROPDOWN LOGIC ---
    const dropdownBtn = document.getElementById('paragraphDropdownBtn');
    const dropdownMenu = document.getElementById('paragraphDropdownMenu');
    const currentFormatSpan = document.getElementById('currentFormat');
    const dropdownOptions = document.querySelectorAll('.dropdown-option');

    dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
    });

    dropdownOptions.forEach(option => {
        option.addEventListener('mousedown', (e) => {
            e.preventDefault();
            const cmd = option.getAttribute('data-cmd');
            const val = option.getAttribute('data-val');
            exec(cmd, val);
            currentFormatSpan.textContent = option.textContent;
            dropdownMenu.classList.remove('show');
        });
    });

    document.addEventListener('click', (e) => {
        if (!dropdownBtn.contains(e.target)) {
            dropdownMenu.classList.remove('show');
        }
    });

    // --- 6. TOPIC & TAGS LOGIC (Preserved from previous version) ---
    const topicLabels = document.querySelectorAll('.topic-option');
    topicLabels.forEach(label => {
        label.addEventListener('click', () => {
            topicLabels.forEach(l => l.classList.remove('selected'));
            label.classList.add('selected');
            const radio = label.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
        });
    });

    const tagInput = document.getElementById('tagsInput');
    const tagContainer = document.getElementById('tagContainer');
    tagContainer.addEventListener('click', () => tagInput.focus());

    tagInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const tagText = tagInput.value.trim();
            if (tagText !== "") {
                const tag = document.createElement('span');
                tag.classList.add('created-tag');
                tag.innerHTML = `${tagText} <span class="remove-tag">×</span>`;
                tagContainer.insertBefore(tag, tagInput);
                tag.querySelector('.remove-tag').addEventListener('click', (e) => {
                    e.stopPropagation(); tag.remove();
                });
                tagInput.value = "";
            }
        }
    });
});