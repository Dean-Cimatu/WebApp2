import express from 'express';
import bodyParser from 'body-parser';
import expressSession from 'express-session';
import { connectDB, getCollection } from './database.mjs';

const app = express();

app.use(bodyParser.json());
app.use(expressSession({
    secret: "simple-session-secret",
    cookie: { maxAge: 3600000 },
    saveUninitialized: false,
    resave: false
}));

app.use(express.static('.'));

await connectDB();

app.post('/M01046382/users', async (req, res) => {
    try {
        const { username, email, password, fullName } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username, email, and password are required'
            });
        }

        const existingUser = await getCollection('users').findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: existingUser.email === email 
                    ? 'Email already registered' 
                    : 'Username already taken'
            });
        }

        const newUser = {
            username,
            email,
            password,
            fullName: fullName || username,
            follows: [],
            createdAt: new Date()
        };

        const result = await getCollection('users').insertOne(newUser);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            userId: result.insertedId,
            username: username
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

app.post('/M01046382/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const user = await getCollection('users').findOne({ email, password });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        req.session.userId = user._id;
        req.session.username = user.username;

        res.json({
            success: true,
            message: 'Login successful',
            userId: user._id,
            username: user.username
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

app.get('/M01046382/login', (req, res) => {
    if (req.session.userId) {
        res.json({
            loggedIn: true,
            userId: req.session.userId,
            username: req.session.username
        });
    } else {
        res.json({
            loggedIn: false,
            message: 'Not logged in'
        });
    }
});

// POST follow a user
app.post('/M01046382/follow', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'Must be logged in to follow users'
            });
        }

        const { usernameToFollow } = req.body;

        if (!usernameToFollow) {
            return res.status(400).json({
                success: false,
                message: 'Username to follow is required'
            });
        }

        // Check if user exists
        const userToFollow = await getCollection('users').findOne({ username: usernameToFollow });
        
        if (!userToFollow) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent following yourself
        if (userToFollow._id.toString() === req.session.userId.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot follow yourself'
            });
        }

        // Add to follows array
        const result = await getCollection('users').updateOne(
            { _id: req.session.userId },
            { $addToSet: { follows: usernameToFollow } }
        );

        res.json({
            success: true,
            message: `Now following ${usernameToFollow}`,
            modified: result.modifiedCount > 0
        });
    } catch (error) {
        console.error('Error following user:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// POST unfollow a user
app.post('/M01046382/unfollow', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'Must be logged in to unfollow users'
            });
        }

        const { usernameToUnfollow } = req.body;

        if (!usernameToUnfollow) {
            return res.status(400).json({
                success: false,
                message: 'Username to unfollow is required'
            });
        }

        // Remove from follows array
        const result = await getCollection('users').updateOne(
            { _id: req.session.userId },
            { $pull: { follows: usernameToUnfollow } }
        );

        res.json({
            success: true,
            message: `Unfollowed ${usernameToUnfollow}`,
            modified: result.modifiedCount > 0
        });
    } catch (error) {
        console.error('Error unfollowing user:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// GET personalized feed (only from followed users)
app.get('/M01046382/feed', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'Must be logged in to view feed'
            });
        }

        // Get current user with follows array
        const currentUser = await getCollection('users').findOne({ _id: req.session.userId });

        if (!currentUser || !currentUser.follows || currentUser.follows.length === 0) {
            return res.json({
                success: true,
                count: 0,
                content: [],
                message: 'Follow some users to see their posts in your feed'
            });
        }

        // Get content from followed users
        const feedContent = await getCollection('content')
            .find({ username: { $in: currentUser.follows } })
            .sort({ createdAt: -1 })
            .toArray();

        res.json({
            success: true,
            count: feedContent.length,
            content: feedContent
        });
    } catch (error) {
        console.error('Error fetching feed:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// GET search users
app.get('/M01046382/search/users', async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const users = await getCollection('users')
            .find(
                {
                    $or: [
                        { username: { $regex: q, $options: 'i' } },
                        { fullName: { $regex: q, $options: 'i' } }
                    ]
                },
                { projection: { password: 0 } }
            )
            .toArray();

        res.json({
            success: true,
            count: users.length,
            users: users
        });
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// GET search content
app.get('/M01046382/search/content', async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const content = await getCollection('content')
            .find(
                {
                    $or: [
                        { title: { $regex: q, $options: 'i' } },
                        { body: { $regex: q, $options: 'i' } }
                    ]
                }
            )
            .sort({ createdAt: -1 })
            .toArray();

        res.json({
            success: true,
            count: content.length,
            content: content
        });
    } catch (error) {
        console.error('Error searching content:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// GET all users
app.get('/M01046382/users', async (req, res) => {
    try {
        const users = await getCollection('users')
            .find({}, { projection: { password: 0 } }) // Exclude passwords
            .toArray();

        res.json({
            success: true,
            count: users.length,
            users: users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// GET single user by ID
app.get('/M01046382/users/:id', async (req, res) => {
    try {
        const { ObjectId } = await import('mongodb');
        const user = await getCollection('users').findOne(
            { _id: new ObjectId(req.params.id) },
            { projection: { password: 0 } }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: user
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// DELETE user by ID
app.delete('/M01046382/users/:id', async (req, res) => {
    try {
        const { ObjectId } = await import('mongodb');
        const result = await getCollection('users').deleteOne({
            _id: new ObjectId(req.params.id)
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// POST create content
app.post('/M01046382/content', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'Must be logged in to post content'
            });
        }

        const { title, body } = req.body;

        if (!title || !body) {
            return res.status(400).json({
                success: false,
                message: 'Title and body are required'
            });
        }

        const content = {
            userId: req.session.userId,
            username: req.session.username,
            title,
            body,
            createdAt: new Date()
        };

        const result = await getCollection('content').insertOne(content);

        res.status(201).json({
            success: true,
            message: 'Content created successfully',
            contentId: result.insertedId
        });
    } catch (error) {
        console.error('Error creating content:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// GET all content\
app.get('/M01046382/content', async (req, res) => {
    try {
        const content = await getCollection('content')
            .find({})
            .sort({ createdAt: -1 })
            .toArray();

        res.json({
            success: true,
            count: content.length,
            content: content
        });
    } catch (error) {
        console.error('Error fetching content:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// GET content by ID
app.get('/M01046382/content/:id', async (req, res) => {
    try {
        const { ObjectId } = await import('mongodb');
        const content = await getCollection('content').findOne({
            _id: new ObjectId(req.params.id)
        });

        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }

        res.json({
            success: true,
            content: content
        });
    } catch (error) {
        console.error('Error fetching content:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// DELETE content by ID
app.delete('/M01046382/content/:id', async (req, res) => {
    try {
        const { ObjectId } = await import('mongodb');
        
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'Must be logged in to delete content'
            });
        }

        const content = await getCollection('content').findOne({
            _id: new ObjectId(req.params.id)
        });

        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }

        // Check if user owns the content
        if (content.userId.toString() !== req.session.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own content'
            });
        }

        await getCollection('content').deleteOne({
            _id: new ObjectId(req.params.id)
        });

        res.json({
            success: true,
            message: 'Content deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting content:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

app.delete('/M01046382/login', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error during logout'
            });
        }
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    });
});

app.listen(8080, () => {
    console.log(`\nServer running on http://localhost:8080`);
    console.log(`Student ID: M01046382\n`);
    console.log(`Available endpoints:`);
    console.log(`\n  Authentication:`);
    console.log(`  POST   /M01046382/users - Register new user`);
    console.log(`  POST   /M01046382/login - Login`);
    console.log(`  GET    /M01046382/login - Check login status`);
    console.log(`  DELETE /M01046382/login - Logout`);
    console.log(`\n  Social Networking:`);
    console.log(`  POST   /M01046382/follow - Follow a user (requires login)`);
    console.log(`  POST   /M01046382/unfollow - Unfollow a user (requires login)`);
    console.log(`  GET    /M01046382/feed - Get personalized feed from followed users (requires login)`);
    console.log(`\n  Search:`);
    console.log(`  GET    /M01046382/search/users?q=query - Search users by username or name`);
    console.log(`  GET    /M01046382/search/content?q=query - Search content by title or body`);
    console.log(`\n  Users:`);
    console.log(`  GET    /M01046382/users - Get all users`);
    console.log(`  GET    /M01046382/users/:id - Get user by ID`);
    console.log(`  DELETE /M01046382/users/:id - Delete user by ID`);
    console.log(`\n  Content:`);
    console.log(`  POST   /M01046382/content - Create content (requires login)`);
    console.log(`  GET    /M01046382/content - Get all content`);
    console.log(`  GET    /M01046382/content/:id - Get content by ID`);
    console.log(`  DELETE /M01046382/content/:id - Delete content by ID (own content only)\n`);
});