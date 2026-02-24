const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001; // Changed to 5001 to avoid AirPlay conflict
const DB_FILE = path.join(__dirname, 'data', 'db.json');

// --- DATABASE HELPER FUNCTIONS (JSON FILE) ---
const readDB = () => {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], products: [] }, null, 2));
    }
    const data = fs.readFileSync(DB_FILE);
    return JSON.parse(data);
};

const writeDB = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- MULTER CONFIG ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// --- ROUTES ---

app.get('/', (req, res) => {
    res.send('API Running (JSON DB Mode)');
});

// Auth Routes
app.post('/api/register', (req, res) => {
    const { username, password, role, walletAddress } = req.body;
    try {
        const db = readDB();
        const existingUser = db.users.find(u => u.username === username);

        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const newUser = {
            id: Date.now(),
            username,
            password, // In real app, hash this!
            role,
            walletAddress
        };

        db.users.push(newUser);
        writeDB(db);

        res.json({ message: 'User registered successfully', user: newUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    try {
        const db = readDB();
        const user = db.users.find(u => u.username === username);

        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.password !== password) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        res.json({
            message: 'Login successful',
            user: {
                username: user.username,
                role: user.role,
                walletAddress: user.walletAddress
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Upload Endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) return res.status(400).send('No file uploaded');

        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        res.json({ imageUrl, filename: req.file.filename });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).send('Server Error: ' + error.message);
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
