/**
 * Social Networking Website - Front-end JavaScript
 * Student ID: M01046382
 * All communication with server uses fetch() and JSON format
 */

// ===== REGISTRATION FUNCTIONALITY =====

/**
 * Handle user registration
 * Sends user data to server and displays result
 */
function register() {
    const data = {
        username: document.getElementById('regUsername').value,
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value,
        fullName: document.getElementById('regFullName').value
    };

    fetch('/M01046382/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.text())
    .then(text => {
        const result = text ? JSON.parse(text) : {};
        const msgDiv = document.getElementById('registerMessage');
        msgDiv.className = 'message show ' + (result.success ? 'success' : 'error');
        msgDiv.textContent = result.message;

        if (result.success) {
            // Clear form fields on success
            document.getElementById('regUsername').value = '';
            document.getElementById('regEmail').value = '';
            document.getElementById('regPassword').value = '';
            document.getElementById('regFullName').value = '';
        }
    })
    .catch(error => {
        document.getElementById('registerMessage').className = 'message show error';
        document.getElementById('registerMessage').textContent = 'Error: ' + error.message;
    });
}

// ===== LOGIN FUNCTIONALITY =====

/**
 * Handle user login
 * Sends credentials to server and creates session
 */
function login() {
    const data = {
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value
    };

    fetch('/M01046382/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.text())
    .then(text => {
        const result = text ? JSON.parse(text) : {};
        const msgDiv = document.getElementById('loginMessage');
        msgDiv.className = 'message show ' + (result.success ? 'success' : 'error');
        msgDiv.textContent = result.message;

        if (result.success) {
            // Clear form fields on success
            document.getElementById('loginEmail').value = '';
            document.getElementById('loginPassword').value = '';
        }
    })
    .catch(error => {
        document.getElementById('loginMessage').className = 'message show error';
        document.getElementById('loginMessage').textContent = 'Error: ' + error.message;
    });
}

// ===== SESSION STATUS =====

/**
 * Check if user is logged in
 * Displays current session status
 */
function checkStatus() {
    fetch('/M01046382/login')
    .then(response => response.text())
    .then(text => {
        const result = text ? JSON.parse(text) : {};
        const msgDiv = document.getElementById('statusMessage');
        msgDiv.className = 'message show info';
        
        if (result.loggedIn) {
            msgDiv.textContent = `Logged in as: ${result.username} (ID: ${result.userId})`;
        } else {
            msgDiv.textContent = result.message || 'Not logged in';
        }
    })
    .catch(error => {
        document.getElementById('statusMessage').className = 'message show error';
        document.getElementById('statusMessage').textContent = 'Error: ' + error.message;
    });
}

/**
 * Logout user
 * Destroys session on server
 */
function logout() {
    fetch('/M01046382/login', {
        method: 'DELETE'
    })
    .then(response => response.text())
    .then(text => {
        const result = text ? JSON.parse(text) : {};
        const msgDiv = document.getElementById('statusMessage');
        msgDiv.className = 'message show success';
        msgDiv.textContent = result.message;
    })
    .catch(error => {
        document.getElementById('statusMessage').className = 'message show error';
        document.getElementById('statusMessage').textContent = 'Error: ' + error.message;
    });
}

// ===== CONTENT POSTING =====

/**
 * Create a new post
 * Requires user to be logged in
 */
function createPost() {
    const data = {
        title: document.getElementById('postTitle').value,
        body: document.getElementById('postBody').value
    };

    fetch('/M01046382/contents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.text())
    .then(text => {
        const result = text ? JSON.parse(text) : {};
        const msgDiv = document.getElementById('postMessage');
        msgDiv.className = 'message show ' + (result.success ? 'success' : 'error');
        msgDiv.textContent = result.message;

        if (result.success) {
            // Clear form fields on success
            document.getElementById('postTitle').value = '';
            document.getElementById('postBody').value = '';
        }
    })
    .catch(error => {
        document.getElementById('postMessage').className = 'message show error';
        document.getElementById('postMessage').textContent = 'Error: ' + error.message;
    });
}

// ===== USER SEARCH =====

/**
 * Search for users by username or full name
 * Displays results with follow/unfollow buttons
 */
function searchUsers() {
    const query = document.getElementById('userSearchQuery').value;
    
    if (!query) {
        document.getElementById('userSearchResults').innerHTML = '<p class="message show error">Please enter a search query</p>';
        return;
    }

    fetch(`/M01046382/users?q=${encodeURIComponent(query)}`)
    .then(response => response.text())
    .then(text => {
        const result = text ? JSON.parse(text) : { users: [] };
        const resultsContainer = document.getElementById('userSearchResults');

        if (result.users.length === 0) {
            resultsContainer.innerHTML = '<p class="message show info">No users found.</p>';
            return;
        }

        // Display user cards with follow/unfollow buttons
        resultsContainer.innerHTML = result.users.map(user => `
            <div class="user-card">
                <div class="user-name">${user.fullName}</div>
                <div class="user-email">@${user.username} • ${user.email}</div>
                <button onclick="followUser('${user.username}')" class="btn btn-follow">Follow</button>
                <button onclick="unfollowUser('${user.username}')" class="btn btn-unfollow">Unfollow</button>
            </div>
        `).join('');
    })
    .catch(error => {
        document.getElementById('userSearchResults').innerHTML = '<p class="message show error">Error: ' + error.message + '</p>';
    });
}

// ===== FOLLOW/UNFOLLOW FUNCTIONALITY =====

/**
 * Follow a user
 * Adds user to follows array
 */
function followUser(username) {
    fetch('/M01046382/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameToFollow: username })
    })
    .then(response => response.text())
    .then(text => {
        const result = text ? JSON.parse(text) : {};
        const msgDiv = document.getElementById('followMessage');
        msgDiv.className = 'message show ' + (result.success ? 'success' : 'error');
        msgDiv.textContent = result.message;
        
        // Hide message after 3 seconds
        setTimeout(() => {
            msgDiv.className = 'message';
        }, 3000);
    })
    .catch(error => {
        const msgDiv = document.getElementById('followMessage');
        msgDiv.className = 'message show error';
        msgDiv.textContent = 'Error: ' + error.message;
    });
}

/**
 * Unfollow a user
 * Removes user from follows array
 */
function unfollowUser(username) {
    fetch('/M01046382/follow', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameToUnfollow: username })
    })
    .then(response => response.text())
    .then(text => {
        const result = text ? JSON.parse(text) : {};
        const msgDiv = document.getElementById('followMessage');
        msgDiv.className = 'message show ' + (result.success ? 'success' : 'error');
        msgDiv.textContent = result.message;
        
        // Hide message after 3 seconds
        setTimeout(() => {
            msgDiv.className = 'message';
        }, 3000);
    })
    .catch(error => {
        const msgDiv = document.getElementById('followMessage');
        msgDiv.className = 'message show error';
        msgDiv.textContent = 'Error: ' + error.message;
    });
}

// ===== CONTENT SEARCH =====

/**
 * Search for posts by title or body content
 * Shows results from all users (not just followed)
 */
function searchContent() {
    const query = document.getElementById('contentSearchQuery').value;
    
    if (!query) {
        document.getElementById('contentSearchResults').innerHTML = '<p class="message show error">Please enter a search query</p>';
        return;
    }

    fetch(`/M01046382/contents?q=${encodeURIComponent(query)}`)
    .then(response => response.text())
    .then(text => {
        const result = text ? JSON.parse(text) : { content: [] };
        const resultsContainer = document.getElementById('contentSearchResults');

        if (result.content.length === 0) {
            resultsContainer.innerHTML = '<p class="message show info">No content found.</p>';
            return;
        }

        // Display post cards
        resultsContainer.innerHTML = result.content.map(post => `
            <div class="post-card">
                <div class="post-title">${post.title}</div>
                <div class="post-body">${post.body}</div>
                <div class="post-meta">By: ${post.username} | ${new Date(post.createdAt).toLocaleString()}</div>
            </div>
        `).join('');
    })
    .catch(error => {
        document.getElementById('contentSearchResults').innerHTML = '<p class="message show error">Error: ' + error.message + '</p>';
    });
}

// ===== PERSONALIZED FEED =====

/**
 * Load personalized feed
 * Shows ONLY posts from users that the current user follows
 * This is a critical requirement - must not show posts from unfollowed users
 */
function loadFeed() {
    fetch('/M01046382/feed')
    .then(response => response.text())
    .then(text => {
        const result = text ? JSON.parse(text) : { content: [] };
        const feedContainer = document.getElementById('feedContainer');

        if (result.content.length === 0) {
            feedContainer.innerHTML = '<p class="message show info">' + (result.message || 'No posts in your feed. Follow some users to see their posts!') + '</p>';
            return;
        }

        // Display feed posts
        feedContainer.innerHTML = result.content.map(post => `
            <div class="post-card">
                <div class="post-title">${post.title}</div>
                <div class="post-body">${post.body}</div>
                <div class="post-meta">By: ${post.username} | ${new Date(post.createdAt).toLocaleString()}</div>
            </div>
        `).join('');
    })
    .catch(error => {
        document.getElementById('feedContainer').innerHTML = '<p class="message show error">Error: ' + error.message + '</p>';
    });
}
