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

        const text = await response.text();
        const result = text ? JSON.parse(text) : {};
        
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

        const text = await response.text();
        const result = text ? JSON.parse(text) : {};
        
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
        
        const text = await response.text();
        const result = text ? JSON.parse(text) : {};
        
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

        const text = await response.text();
        const result = text ? JSON.parse(text) : {};
        document.getElementById('statusMessage').textContent = result.message;
    } catch (error) {
        document.getElementById('statusMessage').textContent = 'Error: ' + error.message;
    }
}

// Post content
document.getElementById('postForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        title: document.getElementById('postTitle').value,
        body: document.getElementById('postBody').value
    };

    try {
        const response = await fetch('/M01046382/content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const text = await response.text();
        const result = text ? JSON.parse(text) : {};
        
        const msgDiv = document.getElementById('postMessage');
        msgDiv.textContent = result.message;

        if (result.success) {
            document.getElementById('postForm').reset();
        }
    } catch (error) {
        document.getElementById('postMessage').textContent = 'Error: ' + error.message;
    }
});

// Search users
async function searchUsers() {
    const query = document.getElementById('userSearchQuery').value;
    
    if (!query) {
        document.getElementById('userSearchResults').innerHTML = '<p>Please enter a search query</p>';
        return;
    }

    try {
        const response = await fetch(`/M01046382/search/users?q=${encodeURIComponent(query)}`);

        if (!response.ok) {
            throw new Error('Server error');
        }

        const text = await response.text();
        const result = text ? JSON.parse(text) : { users: [] };
        const resultsContainer = document.getElementById('userSearchResults');

        if (result.users.length === 0) {
            resultsContainer.innerHTML = '<p>No users found.</p>';
            return;
        }

        resultsContainer.innerHTML = result.users.map(user => `
            <div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0;">
                <strong>${user.fullName}</strong> (@${user.username})<br>
                <small>${user.email}</small><br>
                <button onclick="followUser('${user.username}')">Follow</button>
                <button onclick="unfollowUser('${user.username}')">Unfollow</button>
            </div>
        `).join('');
    } catch (error) {
        document.getElementById('userSearchResults').innerHTML = 'Error: ' + error.message;
    }
}

// Follow user
async function followUser(username) {
    try {
        const response = await fetch('/M01046382/follow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usernameToFollow: username })
        });

        const text = await response.text();
        const result = text ? JSON.parse(text) : {};
        alert(result.message);
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Unfollow user
async function unfollowUser(username) {
    try {
        const response = await fetch('/M01046382/unfollow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usernameToUnfollow: username })
        });

        const text = await response.text();
        const result = text ? JSON.parse(text) : {};
        alert(result.message);
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Search content
async function searchContent() {
    const query = document.getElementById('contentSearchQuery').value;
    
    if (!query) {
        document.getElementById('contentSearchResults').innerHTML = '<p>Please enter a search query</p>';
        return;
    }

    try {
        const response = await fetch(`/M01046382/search/content?q=${encodeURIComponent(query)}`);

        if (!response.ok) {
            throw new Error('Server error');
        }

        const text = await response.text();
        const result = text ? JSON.parse(text) : { content: [] };
        const resultsContainer = document.getElementById('contentSearchResults');

        if (result.content.length === 0) {
            resultsContainer.innerHTML = '<p>No content found.</p>';
            return;
        }

        resultsContainer.innerHTML = result.content.map(post => `
            <div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0;">
                <h3>${post.title}</h3>
                <p>${post.body}</p>
                <small>By: ${post.username} | ${new Date(post.createdAt).toLocaleString()}</small>
            </div>
        `).join('');
    } catch (error) {
        document.getElementById('contentSearchResults').innerHTML = 'Error: ' + error.message;
    }
}

// Load personalized feed (only from followed users)
async function loadFeed() {
    try {
        const response = await fetch('/M01046382/feed');

        if (!response.ok) {
            throw new Error('Server error');
        }

        const text = await response.text();
        const result = text ? JSON.parse(text) : { content: [] };
        const feedContainer = document.getElementById('feedContainer');

        if (result.content.length === 0) {
            feedContainer.innerHTML = '<p>' + (result.message || 'No posts in your feed.') + '</p>';
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
