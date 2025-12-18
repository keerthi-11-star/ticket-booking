document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    if (isAuthenticated()) {
        const user = getCurrentUser();
        if (user.role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'dashboard.html';
        }
        return;
    }

    const form = document.getElementById('login-form');
    form.addEventListener('submit', handleLogin);

    // Check for redirect parameter
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect');
});

async function handleLogin(e) {
    e.preventDefault();
    clearErrors();
    const alertContainer = document.getElementById('alert-container');

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const isAdmin = document.getElementById('isAdmin').checked;

    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, role: isAdmin ? 'admin' : 'user' })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        setAuthData(data.token, data.user);

        // Show success message
        alertContainer.innerHTML = '<div class="alert alert-success">Login successful! Redirecting...</div>';

        // Redirect based on role or redirect parameter
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect');

        setTimeout(() => {
            if (redirect) {
                window.location.href = redirect;
            } else if (data.user.role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        }, 1000);

    } catch (error) {
        alertContainer.innerHTML = `<div class="alert alert-error">${error.message}</div>`;
    }
}

function clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => {
        el.classList.remove('show');
        el.textContent = '';
    });
}

