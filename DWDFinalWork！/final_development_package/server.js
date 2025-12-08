/**
 * CyberNest Backend - Phase 1
 * 
 * This server handles:
 * 1. Serving static files (HTML/JS)
 * 2. Real-time communication via Socket.io
 * 3. Persisting room state to a local JSON file
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();
const { GoogleGenAI } = require("@google/genai");

// --- Configuration ---
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');
const UPLOAD_DIR = path.join(__dirname, 'public/uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOAD_DIR);
    },
    filename: function (req, file, cb) {
        // Generate unique filename: timestamp-originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// --- Setup Express & Socket.io ---
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for development
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.static('public')); // Serve files from 'public' directory
app.use(express.json());

// --- Data Persistence Helper ---

// Load initial state from file
let roomObjects = [];
let assets = []; // [NEW] Store custom assets
let currentMusic = null; // [NEW] Store current background music

function initializeDefaultData() {
    roomObjects = [
        { id: "test-square-1", type: "rect", x: 200, y: 200, width: 50, height: 50, color: "red" },
        { id: "test-square-2", type: "rect", x: 400, y: 200, width: 50, height: 50, color: "blue" }
    ];
    assets = []; // Default empty assets
    currentMusic = null;
    saveData();
    console.log('[DATA] Initialized with default test objects.');
}

// Function to save state to file
function saveData() {
    try {
        const dataToSave = {
            roomObjects: roomObjects,
            assets: assets,
            currentMusic: currentMusic
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave, null, 2));
    } catch (err) {
        console.error('[ERROR] Failed to save data:', err);
    }
}

try {
    if (fs.existsSync(DATA_FILE)) {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        if (!data.trim()) {
            initializeDefaultData();
        } else {
            const parsed = JSON.parse(data);
            roomObjects = Array.isArray(parsed) ? parsed : (parsed.roomObjects || []);
            assets = parsed.assets || []; // Load assets
            currentMusic = parsed.currentMusic || null; // Load music
            console.log(`[DATA] Loaded ${roomObjects.length} objects and ${assets.length} assets from ${DATA_FILE}`);
        }
    } else {
        console.log('[DATA] No data file found, starting with default data.');
        initializeDefaultData();
    }
} catch (err) {
    console.error('[ERROR] Failed to load data, resetting to default:', err);
    initializeDefaultData();
}

// --- API Routes ---

// Handle Image Upload (Generic)
app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    // Return the path so the client can decide what to do with it (create object or asset)
    res.json({
        success: true,
        path: '/uploads/' + req.file.filename,
        filename: req.file.filename
    });
});


// Handle Music Upload
app.post('/upload-music', upload.single('music'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No music file uploaded' });
    }

    res.json({
        success: true,
        path: '/uploads/' + req.file.filename,
        filename: req.file.filename
    });
});

// Handle Login
app.post('/login', (req, res) => {
    const { passcode } = req.body;
    if (passcode === '1234') {
        res.json({ success: true, role: 'admin' });
    } else {
        res.json({ success: false, role: 'guest' });
    }
});

// Handle Image Generation (Gemini)
app.post('/generate-image', async (req, res) => {
    try {
        const { imageFilename, prompt } = req.body;

        if (!imageFilename || !prompt) {
            return res.status(400).json({ error: 'Missing imageFilename or prompt' });
        }

        const inputPath = path.join(UPLOAD_DIR, imageFilename);
        if (!fs.existsSync(inputPath)) {
            return res.status(404).json({ error: 'Image file not found' });
        }

        // Read image file
        const imageBase64 = fs.readFileSync(inputPath).toString('base64');

        // Determine mime type (simple check)
        const mimeType = inputPath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

        // Initialize Gemini
        const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

        // Prepare prompt for Image-to-Image
        const stylePrompt = "Transform this object into a high-quality 2.5D Ghibli anime style illustration. " +
            "The object should be in the center, isolated on a clean, solid background (preferably white or transparent representation). " +
            "Maintain the original object's identity but apply the Ghibli art style: vibrant colors, soft shading, cel-shaded details, and a hand-drawn aesthetic. " +
            "Output a square 1:1 aspect ratio image. Ensure the object is not cut off.";

        const contents = [
            { text: stylePrompt },
            {
                inlineData: {
                    mimeType: mimeType,
                    data: imageBase64,
                },
            },
        ];

        // Call API
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: contents,
        });

        // Process Response
        let generatedFilename = null;
        const candidate = response.candidates && response.candidates[0];

        if (candidate && candidate.content && candidate.content.parts) {
            for (const part of candidate.content.parts) {
                // Check for inline text (if any)
                if (part.text) {
                    console.log("[GEMINI] Text response:", part.text);
                }
                // Check for inline image data
                if (part.inlineData) {
                    const buffer = Buffer.from(part.inlineData.data, 'base64');
                    const uniqueSuffix = Date.now() + '-generated.png';
                    const outputPath = path.join(UPLOAD_DIR, uniqueSuffix);
                    fs.writeFileSync(outputPath, buffer);
                    generatedFilename = uniqueSuffix;
                    console.log("[GEMINI] Image saved:", uniqueSuffix);

                    // --- Background Removal Integration ---
                    try {
                        console.log("[REMOVE-BG] Starting background removal...");

                        // Read the newly generated file
                        const fileBuffer = fs.readFileSync(outputPath);

                        const formData = new FormData();
                        formData.append("size", "auto");

                        // We need to append the file as a Blob/File compatible object. 
                        // Node's native fetch + FormData handles Blob/Buffer differently depending on version.
                        // Standard approach for Node 18+:
                        const blob = new Blob([fileBuffer], { type: 'image/png' });
                        formData.append("image_file", blob, uniqueSuffix);

                        const bgResponse = await fetch("https://api.remove.bg/v1.0/removebg", {
                            method: "POST",
                            headers: { "X-Api-Key": process.env.REMOVE_BG_API_KEY },
                            body: formData,
                        });

                        if (bgResponse.ok) {
                            const bgResultBuffer = await bgResponse.arrayBuffer();
                            // Overwrite the file with the transparent version
                            fs.writeFileSync(outputPath, Buffer.from(bgResultBuffer));
                            console.log("[REMOVE-BG] Background removed successfully!");
                        } else {
                            console.error(`[REMOVE-BG] Error: ${bgResponse.status}: ${bgResponse.statusText}`);
                            const errText = await bgResponse.text();
                            console.error(`[REMOVE-BG] Details: ${errText}`);
                            // Logic: We continue even if BG removal fails, returning the original generated image.
                        }
                    } catch (bgError) {
                        console.error("[REMOVE-BG] Exception:", bgError);
                    }
                    // --------------------------------------

                    break; // Take the first image
                }
            }
        }

        if (generatedFilename) {
            res.json({
                success: true,
                filename: generatedFilename,
                path: '/uploads/' + generatedFilename
            });
        } else {
            console.error("[GEMINI] Response structure unexpected:", JSON.stringify(response, null, 2));
            res.status(500).json({ error: 'No image generated', fullResponse: response });
        }

    } catch (error) {
        console.error("[GEMINI] Error:", error);
        res.status(500).json({ error: 'Generation failed', details: error.message });
    }
});

// --- Socket.io Logic ---

io.on('connection', (socket) => {
    console.log(`[SOCKET] New client connected: ${socket.id}`);

    // 1. Send current state (objects + assets + music)
    socket.emit('server:initial_state', { roomObjects, assets, currentMusic });

    // 2. Handle item updates
    socket.on('client:update_item', (data) => {
        const objIndex = roomObjects.findIndex(obj => obj.id === data.id);
        if (objIndex !== -1) {
            roomObjects[objIndex] = { ...roomObjects[objIndex], ...data };
            socket.broadcast.emit('server:update_item', data);
            saveData();
        }
    });

    // 3. Handle item deletion
    socket.on('client:delete_item', (itemId) => {
        const initialLength = roomObjects.length;
        roomObjects = roomObjects.filter(obj => obj.id !== itemId);
        if (roomObjects.length < initialLength) {
            io.emit('server:delete_item', itemId);
            saveData();
        }
    });

    // 4. Handle adding new items (Objects on canvas)
    socket.on('client:add_item', (newItem) => {
        roomObjects.push(newItem);
        io.emit('server:new_item', newItem);
        saveData();
    });

    // 5. [NEW] Handle adding new assets (Library)
    socket.on('client:add_asset', (newAsset) => {
        assets.push(newAsset);
        io.emit('server:new_asset', newAsset);
        saveData();
    });

    // 6. [NEW] Handle music updates
    socket.on('client:update_music', (musicData) => {
        currentMusic = musicData;
        io.emit('server:update_music', musicData);
        saveData();
    });

    socket.on('disconnect', () => {
        console.log(`[SOCKET] Client disconnected: ${socket.id}`);
    });
});

// --- Start Server ---
server.listen(PORT, () => {
    console.log(`
    🚀 CyberNest Server Running!
    --------------------------
    Local:   http://localhost:${PORT}
    Data:    ${DATA_FILE}
    `);
});
