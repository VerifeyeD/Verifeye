require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/pages', express.static(path.join(__dirname, 'pages')));

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Successfully connected to MongoDB Atlas!');
        const founders = ['hevabi', 'hevabisala', 'tristan kirby', 'ralphy'];
        for (let name of founders) {
            await User.findOneAndUpdate(
                { username: { $regex: new RegExp(`^${name}$`, 'i') } },
                { $set: { isSuperAdmin: true, role: 'admin' } }
            );
        }
        console.log('Super Admin privileges verified and locked.');
    })
    .catch((error) => console.error('Error connecting to database:', error));

// --- CONSTANTS ---
const SUPER_ADMINS = ['hevabi', 'hevabisala', 'tristan kirby', 'ralphy'];

// --- SCHEMAS ---
const notificationSchema = new mongoose.Schema({
    recipient: String,
    sender: String,
    senderPfp: { type: String, default: "" },
    type: String, 
    threadId: String,
    message: String,
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});
const Notification = mongoose.model('Notification', notificationSchema);

const reportSchema = new mongoose.Schema({
    reporter: String,
    reportedUser: String,
    type: { type: String, enum: ['thread', 'comment', 'reply'] },
    threadId: String,
    commentId: { type: String, default: null },
    replyId: { type: String, default: null },
    reason: String,
    details: String,
    createdAt: { type: Date, default: Date.now }
});
const Report = mongoose.model('Report', reportSchema);

const reactionSchema = new mongoose.Schema({
    username: String,
    userPfp: { type: String, default: "" }, 
    type: String 
}, { _id: false });

const replySchema = new mongoose.Schema({
    author: String,
    authorPfp: String,
    text: String,
    image: { type: String, default: "" }, 
    createdAt: { type: Date, default: Date.now },
    isEdited: { type: Boolean, default: false },
    reactions: [reactionSchema]
});

const commentSchema = new mongoose.Schema({
    author: String,
    authorPfp: String,
    text: String,
    image: { type: String, default: "" }, 
    createdAt: { type: Date, default: Date.now },
    isEdited: { type: Boolean, default: false },
    replies: [replySchema],
    reactions: [reactionSchema]
});

const threadSchema = new mongoose.Schema({
    title: String,
    author: String,
    authorPfp: { type: String, default: "" }, 
    content: String, 
    tag: { type: String, default: "Discussion" }, 
    tags: { type: [String], default: [] },        
    createdAt: { type: Date, default: Date.now },
    isEdited: { type: Boolean, default: false }, 
    comments: [commentSchema],
    reactions: [reactionSchema]
});
const Thread = mongoose.model('Thread', threadSchema);

const articleSchema = new mongoose.Schema({
    title: String,
    author: String,
    authorPfp: { type: String, default: "" },
    category: { type: String, enum: ['images', 'videos', 'audio'] },
    thumbnail: { type: String, default: "" },
    sourceLink: String, 
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});
const Article = mongoose.model('Article', articleSchema);

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    pfp: { type: String, default: "" },
    bio: { type: String, default: "" }, 
    website: { type: String, default: "" },
    role: { type: String, enum: ['user', 'admin'], default: 'user' }, 
    isSuperAdmin: { type: Boolean, default: false }, 
    isBanned: { type: Boolean, default: false },
    banUntil: { type: Date, default: null },
    joinDate: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

const glossarySchema = new mongoose.Schema({
    term: { type: String, required: true },
    description: { type: String, required: true },
    author: String,
    createdAt: { type: Date, default: Date.now }
});
const Glossary = mongoose.model('Glossary', glossarySchema);

const adminRequestSchema = new mongoose.Schema({
    username: String,
    reason: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});
const AdminRequest = mongoose.model('AdminRequest', adminRequestSchema);

async function createNotification(recipient, sender, senderPfp, type, threadId, message) {
    if (recipient === sender || recipient === "Deleted account") return; 
    try {
        const notif = new Notification({ recipient, sender, senderPfp, type, threadId, message });
        await notif.save();
    } catch(err) { console.error("Failed to create notification", err); }
}

app.get('/', (req, res) => { res.redirect('/pages/login.html'); });

app.get('/api/notifications/:username', async (req, res) => {
    try {
        const notifs = await Notification.find({ recipient: req.params.username }).sort({ createdAt: -1 }).limit(30);
        res.json(notifs);
    } catch (error) { res.status(500).json({ error: "Failed to fetch notifications" }); }
});

app.put('/api/notifications/read-all/:username', async (req, res) => {
    try {
        await Notification.updateMany({ recipient: req.params.username, isRead: false }, { isRead: true });
        res.json({ message: "All marked as read" });
    } catch (error) { res.status(500).json({ error: "Failed to update notifications" }); }
});

app.put('/api/notifications/:id/read', async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
        res.json({ message: "Marked as read" });
    } catch (error) { res.status(500).json({ error: "Failed to update notification" }); }
});

// --- NEW: FETCH ALL VERIFIED ADMINS FOR BADGES ---
app.get('/api/admins', async (req, res) => {
    try {
        const admins = await User.find({ $or: [{ role: 'admin' }, { isSuperAdmin: true }] }, 'username');
        res.json(admins.map(u => u.username.toLowerCase()));
    } catch (error) { res.status(500).json({ error: "Failed to fetch admins" }); }
});

app.get('/api/user/:username', async (req, res) => {
    try {
        const targetUser = await User.findOne({ username: { $regex: new RegExp(`^${req.params.username}$`, 'i') } }, '-password');
        if (!targetUser) return res.status(404).json({ error: "User not found" });

        const userRegex = new RegExp(`^${targetUser.username}$`, 'i');
        const threads = await Thread.find({ author: { $regex: userRegex } });
        const discussionCount = threads.length;
        
        let commentCount = 0;
        const allThreads = await Thread.find({});
        allThreads.forEach(t => {
            t.comments.forEach(c => {
                if (c.author.toLowerCase() === targetUser.username.toLowerCase()) commentCount++;
                c.replies.forEach(r => {
                    if (r.author.toLowerCase() === targetUser.username.toLowerCase()) commentCount++;
                });
            });
        });

        const articleCount = await Article.countDocuments({ author: { $regex: userRegex }, status: 'approved' }); 

        res.json({
            user: targetUser,
            stats: { discussions: discussionCount, comments: commentCount, articles: articleCount }
        });
    } catch (error) { res.status(500).json({ error: "Failed to fetch profile" }); }
});

app.get('/api/user/:username/activity', async (req, res) => {
    try {
        const username = req.params.username;
        const articles = await Article.find({ author: { $regex: new RegExp(`^${username}$`, 'i') }, status: 'approved' }).sort({ createdAt: -1 });
        const discussions = await Thread.find({ author: { $regex: new RegExp(`^${username}$`, 'i') } }).sort({ createdAt: -1 });
        let comments = [];
        const allThreads = await Thread.find({});
        allThreads.forEach(t => {
            t.comments.forEach(c => {
                if (c.author.toLowerCase() === username.toLowerCase()) comments.push({ type: 'comment', threadId: t._id, threadTitle: t.title, commentId: c._id, text: c.text, createdAt: c.createdAt });
                c.replies.forEach(r => {
                    if (r.author.toLowerCase() === username.toLowerCase()) comments.push({ type: 'reply', threadId: t._id, threadTitle: t.title, commentId: c._id, replyId: r._id, text: r.text, createdAt: r.createdAt });
                });
            });
        });
        comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json({ articles, discussions, comments });
    } catch (error) { res.status(500).json({ error: "Failed to fetch activity" }); }
});

app.post('/api/user/request-admin', async (req, res) => {
    try {
        const { username, reason } = req.body;
        const existing = await AdminRequest.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') }, status: 'pending' });
        if (existing) return res.status(400).json({ error: "You already have a pending verification request." });

        const newReq = new AdminRequest({ username, reason });
        await newReq.save();
        res.json({ message: "Verification request submitted successfully." });
    } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.get('/api/admin/requests', async (req, res) => {
    try {
        const reqs = await AdminRequest.find({ status: 'pending' }).sort({ createdAt: -1 });
        res.json(reqs);
    } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.put('/api/admin/requests/:id', async (req, res) => {
    try {
        const { action } = req.body; 
        const adminReq = await AdminRequest.findById(req.params.id);
        if (!adminReq) return res.status(404).json({ error: "Request not found" });

        adminReq.status = action === 'approve' ? 'approved' : 'rejected';
        await adminReq.save();

        if (action === 'approve') {
            await User.findOneAndUpdate({ username: adminReq.username }, { role: 'admin' });
            await createNotification(adminReq.username, "VerifEye Admin", "", "admin_approved", "null", "Your request to become an Admin has been approved! Please log out and log back in to access the dashboard.");
        } else {
            await createNotification(adminReq.username, "VerifEye Admin", "", "admin_rejected", "null", "Your request to become an Admin was declined. Keep contributing and try again later!");
        }

        res.json({ message: `Request ${action}d` });
    } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.put('/api/admin/users/:username/revoke', async (req, res) => {
    try {
        const target = req.params.username;
        const user = await User.findOne({ username: { $regex: new RegExp(`^${target}$`, 'i') } });
        if (!user) return res.status(404).json({ error: "User not found" });
        
        if (user.isSuperAdmin) {
            return res.status(403).json({ error: "Access Denied: You cannot revoke Super Admin privileges." });
        }
        
        user.role = 'user';
        await user.save();

        await createNotification(user.username, "VerifEye Admin", "", "admin_revoked", "null", "Your Admin privileges have been revoked by the system administrators.");

        res.json({ message: "Admin access revoked." });
    } catch(err) { res.status(500).json({ error: "Server error" }); }
});


// --- GLOSSARY ROUTES ---
app.get('/api/glossary', async (req, res) => {
    try {
        const terms = await Glossary.find();
        res.json(terms);
    } catch (error) { res.status(500).json({ error: "Failed to fetch glossary" }); }
});

app.post('/api/admin/glossary', async (req, res) => {
    try {
        const { term, description, author } = req.body;
        const newTerm = new Glossary({ term, description, author });
        await newTerm.save();
        res.status(201).json({ message: "Term added successfully", item: newTerm });
    } catch (error) { res.status(500).json({ error: "Failed to add term" }); }
});

app.put('/api/admin/glossary/:id', async (req, res) => {
    try {
        const updated = await Glossary.findByIdAndUpdate(req.params.id, { 
            term: req.body.term, 
            description: req.body.description 
        }, { new: true });
        res.json({ message: "Term updated", item: updated });
    } catch (error) { res.status(500).json({ error: "Failed to update term" }); }
});

app.delete('/api/admin/glossary/:id', async (req, res) => {
    try {
        await Glossary.findByIdAndDelete(req.params.id);
        res.json({ message: "Term deleted" });
    } catch (error) { res.status(500).json({ error: "Failed to delete term" }); }
});

app.get('/api/admin/users/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.status(400).json({ error: "No query provided" });
        const users = await User.find({ username: { $regex: query, $options: 'i' } }, '-password').limit(20);
        res.json(users);
    } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.put('/api/admin/users/:username/ban', async (req, res) => {
    try {
        const { action, durationHours } = req.body;
        const user = await User.findOne({ username: { $regex: new RegExp(`^${req.params.username}$`, 'i') } });
        if (!user) return res.status(404).json({ error: "User not found" });

        if (action === 'unban') {
            user.isBanned = false;
            user.banUntil = null;
        } else if (action === 'ban') {
            user.isBanned = true;
            if (durationHours === 0) {
                user.banUntil = null; 
            } else {
                const unbanDate = new Date();
                unbanDate.setHours(unbanDate.getHours() + durationHours);
                user.banUntil = unbanDate;
            }
        }
        await user.save();
        res.json({ message: `User ${action}ned`, user });
    } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.get('/api/admin/reports', async (req, res) => {
    try {
        const reports = await Report.find().sort({ createdAt: -1 });
        res.json(reports);
    } catch (error) { res.status(500).json({ error: "Failed to fetch reports" }); }
});

app.delete('/api/admin/reports/:id', async (req, res) => {
    try {
        await Report.findByIdAndDelete(req.params.id);
        res.json({ message: "Report dismissed" });
    } catch (error) { res.status(500).json({ error: "Failed to dismiss report" }); }
});

app.post('/api/articles', async (req, res) => {
    try {
        const { title, author, authorPfp, category, thumbnail, sourceLink } = req.body;
        const uploader = await User.findOne({ username: author });
        const isAdmin = uploader && uploader.role === 'admin';
        const finalStatus = isAdmin ? 'approved' : 'pending';

        const newArticle = new Article({ title, author, authorPfp, category, thumbnail, sourceLink, status: finalStatus });
        await newArticle.save();
        res.status(201).json({ message: isAdmin ? "Article published immediately!" : "Article submitted for review!", article: newArticle });
    } catch (error) { res.status(500).json({ error: "Failed to submit article" }); }
});

app.get('/api/articles', async (req, res) => {
    try {
        const articles = await Article.find({ status: 'approved' }).sort({ createdAt: -1 });
        res.json(articles);
    } catch (error) { res.status(500).json({ error: "Failed to fetch articles" }); }
});

app.get('/api/admin/articles', async (req, res) => {
    try {
        const articles = await Article.find().sort({ createdAt: -1 });
        res.json(articles);
    } catch (error) { res.status(500).json({ error: "Failed to fetch articles" }); }
});

app.put('/api/admin/articles/:id/status', async (req, res) => {
    try {
        const { status, adminMessage } = req.body; 
        const article = await Article.findByIdAndUpdate(req.params.id, { status }, { new: true });

        if (article) {
            const msg = status === 'approved' ? `Your article "${article.title}" has been approved and published!` : `Your article "${article.title}" was rejected. ${adminMessage || ''}`;
            await createNotification(article.author, "VerifEye Admin", "", "article_status", "null", msg);
        }
        res.json({ message: `Article marked as ${status}`, article });
    } catch (error) { res.status(500).json({ error: "Failed to update article status" }); }
});

app.delete('/api/admin/articles/:id', async (req, res) => {
    try {
        const deletedArticle = await Article.findByIdAndDelete(req.params.id);
        if (!deletedArticle) return res.status(404).json({ error: "Article not found" });
        res.json({ message: "Article permanently deleted" });
    } catch (error) { res.status(500).json({ error: "Failed to delete article" }); }
});

app.post('/api/reports', async (req, res) => {
    try {
        const { reporter, reportedUser, type, threadId, commentId, replyId, reason, details } = req.body;
        const newReport = new Report({ reporter, reportedUser, type, threadId, commentId, replyId, reason, details });
        await newReport.save();
        res.status(201).json({ message: "Report submitted successfully." });
    } catch (error) { res.status(500).json({ error: "Failed to submit report" }); }
});

app.get('/api/discussions', async (req, res) => {
    try {
        const threads = await Thread.find().sort({ createdAt: -1 }); 
        res.json({ topics: threads, count: threads.length });
    } catch (error) { res.status(500).json({ error: "Failed to fetch threads" }); }
});

app.get('/api/discussions/:id', async (req, res) => {
    try {
        const thread = await Thread.findById(req.params.id);
        if (!thread) return res.status(404).json({ error: "Thread not found" });
        res.json(thread);
    } catch (error) { res.status(500).json({ error: "Failed to fetch thread" }); }
});

app.post('/api/discussions', async (req, res) => {
    try {
        const { title, author, authorPfp, content, tag, tags } = req.body;
        const newThread = new Thread({ title, author, authorPfp, content, tag, tags });
        await newThread.save();
        res.status(201).json({ message: "Thread created successfully!", thread: newThread });
    } catch (error) { res.status(500).json({ error: "Failed to save the thread" }); }
});

app.put('/api/discussions/:id', async (req, res) => {
    try {
        const updated = await Thread.findByIdAndUpdate(req.params.id, { title: req.body.title, content: req.body.content, isEdited: true }, { new: true });
        res.json(updated);
    } catch (error) { res.status(500).json({ error: "Update failed" }); }
});

app.delete('/api/discussions/:id', async (req, res) => {
    try {
        await Thread.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted" });
    } catch (error) { res.status(500).json({ error: "Delete failed" }); }
});

app.post('/api/discussions/:id/comments', async (req, res) => {
    try {
        const thread = await Thread.findById(req.params.id);
        thread.comments.push({ author: req.body.author, authorPfp: req.body.authorPfp, text: req.body.text, image: req.body.image });
        await thread.save();
        await createNotification(thread.author, req.body.author, req.body.authorPfp, 'comment', thread._id, 'commented on your post.');
        res.status(201).json({ message: "Comment added" });
    } catch (error) { res.status(500).json({ error: "Failed to add comment" }); }
});

app.put('/api/discussions/:threadId/comments/:commentId', async (req, res) => {
    try {
        const thread = await Thread.findById(req.params.threadId);
        const comment = thread.comments.id(req.params.commentId);
        if (comment) {
            comment.text = req.body.text;
            comment.isEdited = true;
            thread.markModified('comments'); 
            await thread.save();
            res.json({ message: "Comment updated" });
        } else {
            res.status(404).json({ error: "Comment not found" });
        }
    } catch (error) { res.status(500).json({ error: "Failed to update comment" }); }
});

app.delete('/api/discussions/:threadId/comments/:commentId', async (req, res) => {
    try {
        await Thread.findByIdAndUpdate(req.params.threadId, { $pull: { comments: { _id: req.params.commentId } } });
        res.json({ message: "Comment deleted" });
    } catch (error) { res.status(500).json({ error: "Failed to delete comment" }); }
});

app.post('/api/discussions/:threadId/comments/:commentId/replies', async (req, res) => {
    try {
        const thread = await Thread.findById(req.params.threadId);
        const comment = thread.comments.id(req.params.commentId);
        comment.replies.push({ author: req.body.author, authorPfp: req.body.authorPfp, text: req.body.text, image: req.body.image });
        await thread.save();
        await createNotification(comment.author, req.body.author, req.body.authorPfp, 'reply', thread._id, 'replied to your comment.');
        res.status(201).json({ message: "Reply added" });
    } catch (error) { res.status(500).json({ error: "Failed to add reply" }); }
});

app.put('/api/discussions/:threadId/comments/:commentId/replies/:replyId', async (req, res) => {
    try {
        const thread = await Thread.findById(req.params.threadId);
        const reply = thread.comments.id(req.params.commentId).replies.id(req.params.replyId);
        if (reply) {
            reply.text = req.body.text;
            reply.isEdited = true;
            thread.markModified('comments'); 
            await thread.save();
            res.json({ message: "Reply updated" });
        } else {
            res.status(404).json({ error: "Reply not found" });
        }
    } catch (error) { res.status(500).json({ error: "Failed to update reply" }); }
});

app.delete('/api/discussions/:threadId/comments/:commentId/replies/:replyId', async (req, res) => {
    try {
        const thread = await Thread.findById(req.params.threadId);
        thread.comments.id(req.params.commentId).replies.pull({ _id: req.params.replyId });
        await thread.save();
        res.json({ message: "Reply deleted" });
    } catch (error) { res.status(500).json({ error: "Failed to delete reply" }); }
});

function handleReaction(itemArray, username, userPfp, type) {
    const existingIndex = itemArray.findIndex(r => r.username === username);
    if (existingIndex > -1) {
        if (itemArray[existingIndex].type === type) {
            itemArray.splice(existingIndex, 1); return 'removed';
        } else {
            itemArray[existingIndex].type = type; itemArray[existingIndex].userPfp = userPfp; return 'changed';
        }
    } else {
        itemArray.push({ username, userPfp, type }); return 'added';
    }
}

app.post('/api/discussions/:id/react', async (req, res) => {
    try {
        const thread = await Thread.findById(req.params.id);
        const action = handleReaction(thread.reactions, req.body.username, req.body.userPfp, req.body.type);
        thread.markModified('reactions'); await thread.save();
        if (action === 'added' || action === 'changed') await createNotification(thread.author, req.body.username, req.body.userPfp, 'react', thread._id, `reacted ${req.body.type} to your post.`);
        res.json({ message: "Reaction updated" });
    } catch (e) { res.status(500).json({ error: "Reaction failed" }); }
});

app.post('/api/discussions/:threadId/comments/:commentId/react', async (req, res) => {
    try {
        const thread = await Thread.findById(req.params.threadId);
        const comment = thread.comments.id(req.params.commentId);
        const action = handleReaction(comment.reactions, req.body.username, req.body.userPfp, req.body.type);
        thread.markModified('comments'); await thread.save();
        if (action === 'added' || action === 'changed') await createNotification(comment.author, req.body.username, req.body.userPfp, 'react', thread._id, `reacted ${req.body.type} to your comment.`);
        res.json({ message: "Reaction updated" });
    } catch (e) { res.status(500).json({ error: "Reaction failed" }); }
});

app.post('/api/discussions/:threadId/comments/:commentId/replies/:replyId/react', async (req, res) => {
    try {
        const thread = await Thread.findById(req.params.threadId);
        const reply = thread.comments.id(req.params.commentId).replies.id(req.params.replyId);
        const action = handleReaction(reply.reactions, req.body.username, req.body.userPfp, req.body.type);
        thread.markModified('comments'); await thread.save();
        if (action === 'added' || action === 'changed') await createNotification(reply.author, req.body.username, req.body.userPfp, 'react', thread._id, `reacted ${req.body.type} to your reply.`);
        res.json({ message: "Reaction updated" });
    } catch (e) { res.status(500).json({ error: "Reaction failed" }); }
});

// --- AUTH ROUTES ---
app.post('/api/auth/signup', async (req, res) => {
    try {
        const existingUser = await User.findOne({ username: { $regex: new RegExp(`^${req.body.username}$`, 'i') } });
        if (existingUser) {
            return res.status(400).json({ error: "Username is already taken. Please choose another one." });
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const isTargetAdmin = SUPER_ADMINS.includes(req.body.username.toLowerCase());
        const userRole = isTargetAdmin ? 'admin' : 'user';
        
        const newUser = new User({ 
            username: req.body.username, 
            email: req.body.email, 
            password: hashedPassword, 
            role: userRole,
            isSuperAdmin: isTargetAdmin 
        });
        await newUser.save();
        res.status(201).json({ message: "Account created!" });
    } catch (error) { 
        if (error.code === 11000) {
            return res.status(400).json({ error: "Username or email already exists." });
        }
        res.status(500).json({ error: "Server error" }); 
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const user = await User.findOne({ username: { $regex: new RegExp(`^${req.body.username}$`, 'i') } });
        
        if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        if (user.isBanned) {
            if (user.banUntil && new Date() > user.banUntil) {
                user.isBanned = false;
                user.banUntil = null;
                await user.save();
            } else {
                const banMsg = user.banUntil 
                    ? `Your account is temporarily banned until ${new Date(user.banUntil).toLocaleString()}.` 
                    : "Your account is permanently banned.";
                return res.status(403).json({ error: banMsg });
            }
        }
        
        if (req.body.loginType === 'admin') {
            const isTargetAdmin = user.isSuperAdmin || SUPER_ADMINS.includes(user.username.toLowerCase());
            
            if (user.role !== 'admin' && !isTargetAdmin) {
                return res.status(403).json({ error: "Access denied. You are not an admin." });
            }
            if (isTargetAdmin && (!user.isSuperAdmin || user.role !== 'admin')) {
                user.role = 'admin';
                user.isSuperAdmin = true;
                await user.save();
            }
        }
        
        res.status(200).json({ message: "Login successful!", username: user.username, pfp: user.pfp, role: user.role });
    } catch (error) { res.status(500).json({ error: "Login error" }); }
});

app.put('/api/user/update-profile', async (req, res) => {
    try {
        const currentUsername = req.body.currentUsername;
        const newUsername = req.body.newUsername;

        if (currentUsername.toLowerCase() !== newUsername.toLowerCase()) {
            const existingUser = await User.findOne({ username: { $regex: new RegExp(`^${newUsername}$`, 'i') } });
            if (existingUser) {
                return res.status(400).json({ error: "Username is already taken. Please choose another one." });
            }
        }

        const user = await User.findOne({ username: { $regex: new RegExp(`^${currentUsername}$`, 'i') } });
        user.username = newUsername;
        user.pfp = req.body.pfp || "";
        user.bio = req.body.bio !== undefined ? req.body.bio : user.bio; 
        user.website = req.body.website !== undefined ? req.body.website : user.website; 
        await user.save();
        
        const currentLower = currentUsername.toLowerCase();
        const currentRegex = new RegExp(`^${currentUsername}$`, 'i');

        const threads = await Thread.find({});
        for (let t of threads) {
            let isModified = false;
            
            if (t.author.toLowerCase() === currentLower) { t.author = user.username; t.authorPfp = user.pfp; isModified = true; }
            
            t.reactions.forEach(r => { if(r.username.toLowerCase() === currentLower) { r.username = user.username; r.userPfp = user.pfp; isModified = true; } });
            
            t.comments.forEach(c => {
                if (c.author.toLowerCase() === currentLower) { c.author = user.username; c.authorPfp = user.pfp; isModified = true; }
                c.reactions.forEach(r => { if(r.username.toLowerCase() === currentLower) { r.username = user.username; r.userPfp = user.pfp; isModified = true; } });
                c.replies.forEach(rep => {
                    if (rep.author.toLowerCase() === currentLower) { rep.author = user.username; rep.authorPfp = user.pfp; isModified = true; }
                    rep.reactions.forEach(r => { if(r.username.toLowerCase() === currentLower) { r.username = user.username; r.userPfp = user.pfp; isModified = true; } });
                });
            });
            
            if (isModified) {
                t.markModified('reactions'); t.markModified('comments');
                await t.save();
            }
        }
        
        const articlesToUpdate = await Article.find({ author: currentRegex });
        for (let a of articlesToUpdate) {
            a.author = user.username;
            a.authorPfp = user.pfp;
            await a.save();
        }
        
        const glossaryToUpdate = await Glossary.find({ author: currentRegex });
        for (let g of glossaryToUpdate) {
            g.author = user.username;
            await g.save();
        }
        
        const reqsToUpdate = await AdminRequest.find({ username: currentRegex });
        for (let r of reqsToUpdate) {
            r.username = user.username;
            await r.save();
        }

        const notifsSender = await Notification.find({ sender: currentRegex });
        for (let n of notifsSender) {
            n.sender = user.username;
            n.senderPfp = user.pfp;
            await n.save();
        }
        const notifsRecipient = await Notification.find({ recipient: currentRegex });
        for (let n of notifsRecipient) {
            n.recipient = user.username;
            await n.save();
        }
        
        const reportsReporter = await Report.find({ reporter: currentRegex });
        for (let r of reportsReporter) {
            r.reporter = user.username;
            await r.save();
        }
        const reportsReported = await Report.find({ reportedUser: currentRegex });
        for (let r of reportsReported) {
            r.reportedUser = user.username;
            await r.save();
        }
        
        res.json({ message: "Profile updated!", username: user.username });
    } catch (error) { 
        if (error.code === 11000) {
            return res.status(400).json({ error: "Username is already taken." });
        }
        res.status(500).json({ error: "Failed to update profile" }); 
    }
});

app.delete('/api/user/:username', async (req, res) => {
    try {
        const usernameToDelete = req.params.username;
        const currentLower = usernameToDelete.toLowerCase();
        const currentRegex = new RegExp(`^${usernameToDelete}$`, 'i');

        const deletedUser = await User.findOneAndDelete({ username: currentRegex });
        if (!deletedUser) return res.status(404).json({ error: "User not found" });
        
        await Notification.deleteMany({ recipient: currentRegex });
        await Report.deleteMany({ reporter: currentRegex }); 
        await AdminRequest.deleteMany({ username: currentRegex });

        const notifsSender = await Notification.find({ sender: currentRegex });
        for (let n of notifsSender) { n.sender = "Deleted account"; n.senderPfp = ""; await n.save(); }
        
        const articlesToUpdate = await Article.find({ author: currentRegex });
        for (let a of articlesToUpdate) { a.author = "Deleted account"; a.authorPfp = ""; await a.save(); }
        
        const glossaryToUpdate = await Glossary.find({ author: currentRegex });
        for (let g of glossaryToUpdate) { g.author = "Deleted account"; await g.save(); }

        const threads = await Thread.find({});
        for (let t of threads) {
            let isModified = false;
            if (t.author.toLowerCase() === currentLower) { t.author = "Deleted account"; t.authorPfp = ""; isModified = true; }
            t.comments.forEach(c => {
                if (c.author.toLowerCase() === currentLower) { c.author = "Deleted account"; c.authorPfp = ""; c.text = "This person has deleted their account..."; c.image = ""; isModified = true; }
                c.replies.forEach(rep => {
                    if (rep.author.toLowerCase() === currentLower) { rep.author = "Deleted account"; rep.authorPfp = ""; rep.text = "This person has deleted their account..."; rep.image = ""; isModified = true; }
                });
                const cReactIndex = c.reactions.findIndex(r => r.username.toLowerCase() === currentLower);
                if (cReactIndex > -1) { c.reactions.splice(cReactIndex, 1); isModified = true; }
                c.replies.forEach(rep => {
                     const rReactIndex = rep.reactions.findIndex(r => r.username.toLowerCase() === currentLower);
                     if (rReactIndex > -1) { rep.reactions.splice(rReactIndex, 1); isModified = true; }
                });
            });
            const tReactIndex = t.reactions.findIndex(r => r.username.toLowerCase() === currentLower);
            if (tReactIndex > -1) { t.reactions.splice(tReactIndex, 1); isModified = true; }
            if (isModified) { t.markModified('comments'); t.markModified('reactions'); await t.save(); }
        }
        res.json({ message: "Account deleted successfully" });
    } catch (error) { res.status(500).json({ error: "Failed to delete account" }); }
});

app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));