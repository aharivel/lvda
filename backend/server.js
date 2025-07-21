const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Rate limiting
const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: {
        error: 'Too many contact requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Database setup
const dbPath = process.env.DB_PATH || '/data/contacts.db';
const db = new sqlite3.Database(dbPath);

// Create table if not exists
db.run(`CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_status INTEGER DEFAULT 0
)`);

// Validation middleware
const validateContact = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('message')
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Message must be between 10 and 1000 characters'),
    body('captcha')
        .notEmpty()
        .withMessage('Please complete the CAPTCHA')
];

// Simple CAPTCHA verification
function verifyCaptcha(userAnswer, sessionAnswer) {
    return parseInt(userAnswer) === parseInt(sessionAnswer);
}

// Generate simple math CAPTCHA
app.get('/api/captcha', (req, res) => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const answer = num1 + num2;
    
    res.json({
        question: `${num1} + ${num2} = ?`,
        answer: answer // In production, store this in session/redis
    });
});

// Contact form submission
app.post('/api/contact', contactLimiter, validateContact, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const { name, email, message, captcha, captchaAnswer } = req.body;

    // Verify CAPTCHA
    if (!verifyCaptcha(captcha, captchaAnswer)) {
        return res.status(400).json({
            error: 'CAPTCHA verification failed'
        });
    }

    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    db.run(
        'INSERT INTO contacts (name, email, message, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
        [name, email, message, ip, userAgent],
        function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    error: 'Failed to save message'
                });
            }

            res.json({
                success: true,
                message: 'Message sent successfully!',
                id: this.lastID
            });
        }
    );
});

// Admin API endpoints (both /api/ and /admin-api/ prefixes)
app.get('/api/stats', (req, res) => {
    const queries = [
        'SELECT COUNT(*) as total FROM contacts',
        'SELECT COUNT(*) as unread FROM contacts WHERE read_status = 0',
        'SELECT COUNT(*) as today FROM contacts WHERE date(created_at) = date("now")',
        'SELECT COUNT(*) as week FROM contacts WHERE date(created_at) >= date("now", "-7 days")'
    ];
    
    const results = {};
    let completed = 0;
    
    queries.forEach((query, index) => {
        db.get(query, (err, row) => {
            if (err) {
                console.error('Stats query error:', err);
                return res.status(500).json({ error: 'Failed to fetch stats' });
            }
            
            const keys = ['total', 'unread', 'today', 'week'];
            results[keys[index]] = Object.values(row)[0];
            
            completed++;
            if (completed === queries.length) {
                res.json(results);
            }
        });
    });
});

// Duplicate admin routes
app.get('/admin-api/stats', (req, res) => {
    const queries = [
        'SELECT COUNT(*) as total FROM contacts',
        'SELECT COUNT(*) as unread FROM contacts WHERE read_status = 0',
        'SELECT COUNT(*) as today FROM contacts WHERE date(created_at) = date("now")',
        'SELECT COUNT(*) as week FROM contacts WHERE date(created_at) >= date("now", "-7 days")'
    ];
    
    const results = {};
    let completed = 0;
    
    queries.forEach((query, index) => {
        db.get(query, (err, row) => {
            if (err) {
                console.error('Stats query error:', err);
                return res.status(500).json({ error: 'Failed to fetch stats' });
            }
            
            const keys = ['total', 'unread', 'today', 'week'];
            results[keys[index]] = Object.values(row)[0];
            
            completed++;
            if (completed === queries.length) {
                res.json(results);
            }
        });
    });
});

app.get('/api/messages', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Get total count
    db.get('SELECT COUNT(*) as total FROM contacts', (err, countRow) => {
        if (err) {
            console.error('Count query error:', err);
            return res.status(500).json({ error: 'Failed to fetch messages' });
        }
        
        const totalMessages = countRow.total;
        const totalPages = Math.ceil(totalMessages / limit);
        
        // Get messages for current page
        db.all(
            'SELECT * FROM contacts ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [limit, offset],
            (err, rows) => {
                if (err) {
                    console.error('Messages query error:', err);
                    return res.status(500).json({ error: 'Failed to fetch messages' });
                }
                
                res.json({
                    messages: rows,
                    currentPage: page,
                    totalPages: totalPages,
                    totalMessages: totalMessages
                });
            }
        );
    });
});

app.get('/admin-api/messages', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Get total count
    db.get('SELECT COUNT(*) as total FROM contacts', (err, countRow) => {
        if (err) {
            console.error('Count query error:', err);
            return res.status(500).json({ error: 'Failed to fetch messages' });
        }
        
        const totalMessages = countRow.total;
        const totalPages = Math.ceil(totalMessages / limit);
        
        // Get messages for current page
        db.all(
            'SELECT * FROM contacts ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [limit, offset],
            (err, rows) => {
                if (err) {
                    console.error('Messages query error:', err);
                    return res.status(500).json({ error: 'Failed to fetch messages' });
                }
                
                res.json({
                    messages: rows,
                    currentPage: page,
                    totalPages: totalPages,
                    totalMessages: totalMessages
                });
            }
        );
    });
});

app.get('/api/messages/:id', (req, res) => {
    const messageId = req.params.id;
    
    db.get('SELECT * FROM contacts WHERE id = ?', [messageId], (err, row) => {
        if (err) {
            console.error('Message query error:', err);
            return res.status(500).json({ error: 'Failed to fetch message' });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'Message not found' });
        }
        
        res.json(row);
    });
});

app.get('/admin-api/messages/:id', (req, res) => {
    const messageId = req.params.id;
    
    db.get('SELECT * FROM contacts WHERE id = ?', [messageId], (err, row) => {
        if (err) {
            console.error('Message query error:', err);
            return res.status(500).json({ error: 'Failed to fetch message' });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'Message not found' });
        }
        
        res.json(row);
    });
});

app.put('/api/messages/:id/read', (req, res) => {
    const messageId = req.params.id;
    
    db.run('UPDATE contacts SET read_status = 1 WHERE id = ?', [messageId], function(err) {
        if (err) {
            console.error('Update query error:', err);
            return res.status(500).json({ error: 'Failed to mark message as read' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Message not found' });
        }
        
        res.json({ success: true });
    });
});

app.put('/admin-api/messages/:id/read', (req, res) => {
    const messageId = req.params.id;
    
    db.run('UPDATE contacts SET read_status = 1 WHERE id = ?', [messageId], function(err) {
        if (err) {
            console.error('Update query error:', err);
            return res.status(500).json({ error: 'Failed to mark message as read' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Message not found' });
        }
        
        res.json({ success: true });
    });
});

app.delete('/api/messages/:id', (req, res) => {
    const messageId = req.params.id;
    
    db.run('DELETE FROM contacts WHERE id = ?', [messageId], function(err) {
        if (err) {
            console.error('Delete query error:', err);
            return res.status(500).json({ error: 'Failed to delete message' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Message not found' });
        }
        
        res.json({ success: true });
    });
});

app.delete('/admin-api/messages/:id', (req, res) => {
    const messageId = req.params.id;
    
    db.run('DELETE FROM contacts WHERE id = ?', [messageId], function(err) {
        if (err) {
            console.error('Delete query error:', err);
            return res.status(500).json({ error: 'Failed to delete message' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Message not found' });
        }
        
        res.json({ success: true });
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`Backend server running on port ${port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});