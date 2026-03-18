const container = document.querySelector('.container');
const registerBtn = document.querySelector('.register-btn');
const loginBtn = document.querySelector('.login-btn');

// --- UI Toggle Logic ---
if(registerBtn) registerBtn.addEventListener('click', () => container.classList.add('active'));
if(loginBtn) loginBtn.addEventListener('click', () => container.classList.remove('active'));

// --- CUSTOM ALERT LOGIC ---
function showCustomAlert(title, message, type, onSuccessCallback = null) {
    const overlay = document.getElementById('custom-alert-overlay');
    const alertBox = document.getElementById('custom-alert-box');
    const icon = document.getElementById('custom-alert-icon');
    const titleEl = document.getElementById('custom-alert-title');
    const messageEl = document.getElementById('custom-alert-message');

    titleEl.innerText = title;
    messageEl.innerText = message;

    if (type === 'error') {
        alertBox.className = 'custom-alert-box custom-alert-error';
        icon.innerHTML = "<i class='bx bx-error-circle'></i>";
    } else {
        alertBox.className = 'custom-alert-box custom-alert-success';
        icon.innerHTML = "<i class='bx bx-check-circle'></i>";
    }

    overlay.classList.add('show');
    
    // Store callback to run when user closes the modal
    window.currentAlertCallback = onSuccessCallback;
}

window.closeCustomAlert = function() {
    document.getElementById('custom-alert-overlay').classList.remove('show');
    if (typeof window.currentAlertCallback === 'function') {
        window.currentAlertCallback();
        window.currentAlertCallback = null;
    }
}

// --- BACKEND INTEGRATION LOGIC ---
const loginForm = document.querySelector('.form-box.login form');
const registerForm = document.querySelector('.form-box.register form');

// 1. Handle Registration
if(registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        const inputs = registerForm.querySelectorAll('input');
        const username = inputs[0].value.trim();
        const email = inputs[1].value.trim();
        const password = inputs[2].value.trim();

        try {
            const response = await fetch('http://localhost:3000/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                showCustomAlert("Success", "Registration successful! You can now log in.", "success", () => {
                    registerForm.reset(); 
                    container.classList.remove('active'); 
                });
            } else {
                showCustomAlert("Registration Failed", data.error, "error");
            }
        } catch (error) {
            console.error('Registration error:', error);
            showCustomAlert("Connection Error", "Could not connect to the server. Is Node.js running?", "error");
        }
    });
}

// 2. Handle Login
if(loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        // Grab text inputs
        const textInputs = loginForm.querySelectorAll('input[type="text"], input[type="password"]');
        const username = textInputs[0].value.trim();
        const password = textInputs[1].value.trim();
        
        // Grab selected role
        const roleRadios = loginForm.querySelectorAll('input[name="loginRole"]');
        let loginType = 'user';
        roleRadios.forEach(radio => {
            if (radio.checked) loginType = radio.value;
        });

        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, loginType })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('verifeye_user', data.username);
                localStorage.setItem('verifeye_role', data.role);
                
                if (data.pfp && data.pfp !== "") {
                    localStorage.setItem('verifeye_pfp', data.pfp);
                } else {
                    localStorage.removeItem('verifeye_pfp'); 
                }
                
                showCustomAlert("Login Successful", `Welcome back, ${data.username}!`, "success", () => {
                    if (data.role === 'admin') {
                        window.location.href = '../pages/admin-dashboard.html';
                    } else {
                        window.location.href = '../pages/homepage.html';
                    }
                });
            } else {
                showCustomAlert("Login Failed", data.error, "error");
            }
        } catch (error) {
            console.error('Login error:', error);
            showCustomAlert("Connection Error", "Could not connect to the server. Is Node.js running?", "error");
        }
    });
}