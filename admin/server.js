const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const basicAuth = require('express-basic-auth');
const path = require('path');

const app = express();
const port = process.env.PORT || 3002;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
            scriptSrcElem: ["'self'", "https://cdn.jsdelivr.net"],
            scriptSrcAttr: ["'none'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:"],
            fontSrc: ["'self'", "https://cdn.jsdelivr.net"]
        }
    },
    crossOriginOpenerPolicy: false,
    originAgentCluster: false,
    hsts: false
}));
app.use(express.json());
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Basic authentication
app.use(basicAuth({
    users: {
        [process.env.ADMIN_USER || 'admin']: process.env.ADMIN_PASSWORD || 'change-this-password'
    },
    challenge: true,
    realm: 'LVDA Admin Panel'
}));

// Database setup
const dbPath = process.env.DB_PATH || '/data/contacts.db';
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE);

// API Routes
app.get('/api/messages', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    db.all(
        'SELECT * FROM contacts ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            // Get total count
            db.get('SELECT COUNT(*) as total FROM contacts', (err, countResult) => {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }
                
                res.json({
                    messages: rows,
                    currentPage: page,
                    totalPages: Math.ceil(countResult.total / limit),
                    totalMessages: countResult.total
                });
            });
        }
    );
});

app.get('/api/messages/:id', (req, res) => {
    const id = req.params.id;
    
    db.get('SELECT * FROM contacts WHERE id = ?', [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'Message not found' });
        }
        
        res.json(row);
    });
});

app.put('/api/messages/:id/read', (req, res) => {
    const id = req.params.id;
    
    db.run('UPDATE contacts SET read_status = 1 WHERE id = ?', [id], function(err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to update message' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Message not found' });
        }
        
        res.json({ success: true, message: 'Message marked as read' });
    });
});

app.delete('/api/messages/:id', (req, res) => {
    const id = req.params.id;
    
    db.run('DELETE FROM contacts WHERE id = ?', [id], function(err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to delete message' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Message not found' });
        }
        
        res.json({ success: true, message: 'Message deleted successfully' });
    });
});

app.get('/api/stats', (req, res) => {
    const queries = [
        'SELECT COUNT(*) as total FROM contacts',
        'SELECT COUNT(*) as unread FROM contacts WHERE read_status = 0',
        'SELECT COUNT(*) as today FROM contacts WHERE date(created_at) = date("now")',
        'SELECT COUNT(*) as week FROM contacts WHERE date(created_at) >= date("now", "-7 days")'
    ];
    
    const stats = {};
    let completed = 0;
    
    queries.forEach((query, index) => {
        db.get(query, (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            const key = Object.keys(result)[0];
            stats[key] = result[key];
            completed++;
            
            if (completed === queries.length) {
                res.json(stats);
            }
        });
    });
});

// Serve admin panel
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`Admin panel running on port ${port}`);
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