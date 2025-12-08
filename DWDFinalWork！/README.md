# CyberNest Virtual Space Platform

## 1. Project Overview
**CyberNest** is a web-based interactive virtual space design platform. 

The inspiration for this project comes from my girlfriend, who often wished we had a cozy little space of our own to decorate. Additionally, the design concept is drawn from a type of sticker art she enjoys, where users place various furniture stickers onto a 2.5D isometric room background to create their ideal room. I adopted this creative form to bring CyberNest to life, allowing users to build their dream spaces digitally.

Technically, the project utilizes a modern stack (React + Vite + Node.js + Socket.io), enabling smooth drag-and-drop interactions, real-time synchronization across multiple clients, and AI-powered creative asset generation.

## 2. Features

### 🎨 Core Interaction & Design
*   **Isometric Canvas**: A drag-and-drop system based on a diamond grid, ensuring automatic alignment and correct visual perspective.
*   **Asset Library & Layer Management**:
    *   Built-in high-quality furniture assets (beds, bookshelves, plants, etc.).
    *   Layer order adjustment (Bring to Front / Send to Back) to easily handle object occlusion.
    *   Smart collision detection and edge snapping.
*   **Personalization**:
    *   **Custom Uploads**: Support for uploading local images as furniture or decorations.
    *   **Music Player**: Clickable scene objects (e.g., Lower Shelf) to toggle background music.
    *   **Day/Night Mode**: One-click switching between day and night themes, synchronizing the interface and canvas atmosphere.

### 🤖 AI Integration (GenAI)
*   **AI Asset Generation**: Integrated with Google Gemini Pro Vision model. Users can upload sketches or photos, and the AI automatically transforms them into "Ghibli-style" 2.5D assets.
*   **Automatic Background Removal**: Integrated with Remove.bg API to automatically remove backgrounds from generated assets, ensuring they blend perfectly into the canvas without manual editing.

### ⚡ Real-time Technology
*   **Multi-Client Sync**: Real-time communication via WebSocket (Socket.io). Any canvas change (move, add, delete) is instantly synchronized to all connected clients.
*   **Persistent Storage**: Room state is automatically saved on the server, retaining the layout even after page refreshes or re-connections.

## 3. Deployment Configuration

This project is recommended to be deployed on an Ubuntu Linux server (e.g., DigitalOcean Droplet).

### 3.1 Environment Setup
The server requires the Node.js runtime environment.

```bash
# 1. Get Node.js v20 installation script
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# 2. Install Node.js and npm
sudo apt-get install -y nodejs npm

# 3. Install Forever process manager (for persistent background execution)
sudo npm install -g forever
```

### 3.2 File Preparation
Ensure your deployment package includes the following:
*   `server.js` (Backend entry point)
*   `package.json` (Dependency list)
*   `public/` (Frontend build artifacts, containing `index.html` and `assets/`)
*   `data.json` (Optional, initial room data)

### 3.3 Environment Variables
Create a `.env` file in the project root directory and fill in the necessary API Keys:

```bash
# Create and edit file
nano .env
```

**Example Content:**
(References: [Google Gemini API](https://ai.google.dev/gemini-api/docs/image-generation#gemini-image-editing), [Remove.bg API](https://www.remove.bg/api))

```env
GOOGLE_API_KEY=Your_Gemini_API_Key
REMOVE_BG_API_KEY=Your_RemoveBG_API_Key
```
*(Press Ctrl+O to save, Ctrl+X to exit)*

### 3.4 Start & Maintenance
Use `forever` to start the service, ensuring it keeps running even after SSH disconnection.

```bash
# Install dependencies
npm install --production

# Start service
forever start server.js

# View running status
forever list

# Restart service (after code updates)
forever restart server.js
```
