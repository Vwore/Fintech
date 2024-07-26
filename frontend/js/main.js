document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const profileDetails = document.getElementById('profileDetails');
    const userDetails = document.getElementById('userDetails');
    const transactionSection = document.getElementById('transactionSection');
    const profileLink = document.getElementById('profileLink');
    const loginLink = document.getElementById('loginLink');
    const signupLink = document.getElementById('signupLink');
    const logoutButton = document.getElementById('logoutButton');
    const navLinks = document.getElementById('navLinks');

    const API_URL = 'http://localhost:5000'; // Update with your backend URL

    // Check user login status and update UI
    function checkLoginStatus() {
        const token = localStorage.getItem('token');
        if (token) {
            loginLink.style.display = 'none';
            signupLink.style.display = 'none';
            profileLink.style.display = 'inline';
            logoutButton.style.display = 'inline';
        } else {
            loginLink.style.display = 'inline';
            signupLink.style.display = 'inline';
            profileLink.style.display = 'none';
            logoutButton.style.display = 'none';
        }
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            if (data.token) {
                localStorage.setItem('token', data.token);
                window.location.href = 'index.html';
            } else {
                alert('Login failed');
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signupName').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;

            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json();
            if (data.token) {
                localStorage.setItem('token', data.token);
                window.location.href = 'index.html';
            } else {
                alert('Signup failed');
            }
        });
    }

    if (profileDetails) {
        const token = localStorage.getItem('token');
        if (token) {
            fetch(`${API_URL}/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            .then(response => response.json())
            .then(data => {
                profileDetails.innerHTML = `
                    <p>Name: ${data.name}</p>
                    <p>Email: ${data.email}</p>
                    <p>Balance: ${data.balance}</p>
                `;
            });
        } else {
            window.location.href = 'login.html';
        }
    }

    if (userDetails) {
        const token = localStorage.getItem('token');
        if (token) {
            fetch(`${API_URL}/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            .then(response => response.json())
            .then(data => {
                userDetails.innerHTML = `
                    <p>Welcome, ${data.name}</p>
                    <p>Your balance is: ${data.balance}</p>
                `;
                transactionSection.style.display = 'block';
            });
        } else {
            userDetails.innerHTML = `<p>Please <a href="login.html">login</a> or <a href="signup.html">signup</a> to manage your account.</p>`;
        }
    }

    if (profileLink) {
        profileLink.addEventListener('click', () => {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = 'login.html';
            }
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        });
    }

    // Check login status on page load
    checkLoginStatus();
});

async function deposit() {
    const amount = document.getElementById('amount').value;
    const token = localStorage.getItem('token');

    const response = await fetch('http://localhost:5000/deposit', { // Update with your backend URL
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
    });

    const data = await response.json();
    if (data) {
        alert('Deposit successful');
        window.location.reload();
    } else {
        alert('Deposit failed');
    }
}

async function withdraw() {
    const amount = document.getElementById('amount').value;
    const token = localStorage.getItem('token');

    const response = await fetch('http://localhost:5000/withdraw', { // Update with your backend URL
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
    });

    const data = await response.json();
    if (data) {
        alert('Withdrawal successful');
        window.location.reload();
    } else {
        alert('Withdrawal failed');
    }
}
