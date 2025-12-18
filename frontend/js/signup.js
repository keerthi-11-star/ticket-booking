document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    if (isAuthenticated()) {
        const user = getCurrentUser();
        window.location.href = user.role === 'admin' ? 'admin.html' : 'dashboard.html';
        return;
    }

    const form = document.getElementById('signup-form');
    form.addEventListener('submit', handleSignup);
});

async function handleSignup(e) {
    e.preventDefault();
    clearErrors();
    const alertContainer = document.getElementById('alert-container');

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validation
    if (password !== confirmPassword) {
        document.getElementById('confirmPassword-error').textContent = 'Passwords do not match';
        document.getElementById('confirmPassword-error').classList.add('show');
        return;
    }

    if (password.length < 6) {
        document.getElementById('password-error').textContent = 'Password must be at least 6 characters';
        document.getElementById('password-error').classList.add('show');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Signup failed');
        }

        setAuthData(data.token, data.user);

        alertContainer.innerHTML = '<div class="alert alert-success">Account created successfully! Redirecting...</div>';

        setTimeout(() => {
            window.location.href = 'dashboard.html';
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

