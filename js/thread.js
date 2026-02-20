document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SIMPLE FORMATTING TOOLS ---
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

    btnColor.addEventListener('click', () => {
        colorInput.click();
    });

    colorInput.addEventListener('input', (e) => {
        exec('foreColor', e.target.value);
        btnColor.style.borderBottomColor = e.target.value;
        btnColor.style.color = e.target.value;
    });

    // --- 3. IMAGE UPLOAD LOGIC ---
    const btnImage = document.getElementById('btnImage');
    const imageInput = document.getElementById('imageUploadInput');

    btnImage.addEventListener('click', () => {
        imageInput.click();
    });

    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                exec('insertImage', e.target.result);
            };
            reader.readAsDataURL(file);
        }
        imageInput.value = '';
    });

    // --- 4. FORMAT DROPDOWN LOGIC ---
    const dropdownBtn = document.getElementById('paragraphDropdownBtn');
    const dropdownMenu = document.getElementById('paragraphDropdownMenu');
    const currentFormatSpan = document.getElementById('currentFormat');
    const dropdownOptions = document.querySelectorAll('#paragraphDropdownMenu .dropdown-option');

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

    // --- 5. EMOJI PICKER LOGIC ---
    const btnEmoji = document.getElementById('btnEmoji');
    const emojiMenu = document.getElementById('emojiDropdownMenu');
    const emojiOptions = document.querySelectorAll('.emoji-option');

    btnEmoji.addEventListener('click', (e) => {
        e.stopPropagation();
        emojiMenu.classList.toggle('show');
    });

    emojiOptions.forEach(emoji => {
        emoji.addEventListener('mousedown', (e) => {
            e.preventDefault(); // Prevents editor from losing focus
            // Insert the emoji text into the editor
            exec('insertText', emoji.textContent);
            emojiMenu.classList.remove('show');
        });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!dropdownBtn.contains(e.target)) {
            dropdownMenu.classList.remove('show');
        }
        if (!btnEmoji.contains(e.target)) {
            emojiMenu.classList.remove('show');
        }
    });

    // --- 6. TOPIC & TAGS LOGIC ---
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