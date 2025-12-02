document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        username: document.getElementById('regUsername').value,
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value,
        fullName: document.getElementById('regFullName').value
    };

    try {
        const response = await fetch('/M01046382/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        const msgDiv = document.getElementById('registerMessage');
        msgDiv.className = 'message ' + (result.success ? 'success' : 'error');
        msgDiv.textContent = result.message;

        if (result.success) {
            document.getElementById('registerForm').reset();
        }
    } catch (error) {
        document.getElementById('registerMessage').className = 'message error';
        document.getElementById('registerMessage').textContent = 'Error: ' + error.message;
    }
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value
    };

    try {
        const response = await fetch('/M01046382/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        const msgDiv = document.getElementById('loginMessage');
        msgDiv.className = 'message ' + (result.success ? 'success' : 'error');
        msgDiv.textContent = result.message;

        if (result.success) {
            document.getElementById('loginForm').reset();
        }
    } catch (error) {
        document.getElementById('loginMessage').className = 'message error';
        document.getElementById('loginMessage').textContent = 'Error: ' + error.message;
    }
});

async function checkStatus() {
    try {
        const response = await fetch('/M01046382/login');
        
        if (!response.ok) {
            throw new Error('Server error');
        }
        
        const result = await response.json();
        
        const msgDiv = document.getElementById('statusMessage');
        
        if (result.loggedIn) {
            msgDiv.textContent = `Logged in as: ${result.username} (ID: ${result.userId})`;
        } else {
            msgDiv.textContent = result.message || 'Not logged in';
        }
    } catch (error) {
        document.getElementById('statusMessage').textContent = 'Error: ' + error.message;
    }
}

async function logout() {
    try {
        const response = await fetch('/M01046382/login', {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Server error');
        }

        const result = await response.json();
        document.getElementById('statusMessage').textContent = result.message;
    } catch (error) {
        document.getElementById('statusMessage').textContent = 'Error: ' + error.message;
    }
}

async function loadFeed() {
    try {
        const response = await fetch('/M01046382/content');

        if (!response.ok) {
            throw new Error('Server error');
        }

        const result = await response.json();
        const feedContainer = document.getElementById('feedContainer');

        if (result.content.length === 0) {
            feedContainer.innerHTML = '<p>No posts yet.</p>';
            return;
        }

        feedContainer.innerHTML = result.content.map(post => `
            <div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0;">
                <h3>${post.title}</h3>
                <p>${post.body}</p>
                <small>By: ${post.username} | ${new Date(post.createdAt).toLocaleString()}</small>
            </div>
        `).join('');
    } catch (error) {
        document.getElementById('feedContainer').innerHTML = 'Error: ' + error.message;
    }
}
