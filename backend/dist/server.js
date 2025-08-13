import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import * as db from './database';
const app = express();
const port = process.env.PORT || 3001;
// Middleware
app.use(cors());
app.use(express.json());
// Since we are using ES Modules, __dirname is not available directly.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, '../../frontend/dist')));
// --- API Endpoints ---
// GET Menu Items
app.get('/api/menu-items', async (req, res) => {
    try {
        const menuItems = await db.getMenuItems();
        res.json(menuItems);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching menu items', error });
    }
});
// GET Testimonials
app.get('/api/testimonials', async (req, res) => {
    try {
        const testimonials = await db.getTestimonials();
        res.json(testimonials);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching testimonials', error });
    }
});
// GET Orders
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await db.getOrders();
        res.json(orders);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching orders', error });
    }
});
// GET Stats
app.get('/api/stats', async (req, res) => {
    try {
        const stats = await db.getStats();
        res.json(stats);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching stats', error });
    }
});
// POST Place Order
app.post('/api/orders', async (req, res) => {
    try {
        const { cartItems, details } = req.body;
        if (!cartItems || !details) {
            return res.status(400).json({ message: 'Missing cartItems or details in request body' });
        }
        const subtotal = cartItems.reduce((acc, item) => acc + item.totalPrice, 0);
        const total = subtotal + (details.tip || 0);
        const newOrder = {
            id: `ORD-${Date.now().toString().slice(-6)}`,
            customerName: details.name,
            date: new Date().toISOString().replace('T', ' ').substring(0, 16),
            total: total,
            status: 'Preparando',
            items: cartItems,
        };
        const savedOrder = await db.addOrder(newOrder);
        res.status(201).json(savedOrder);
    }
    catch (error) {
        res.status(500).json({ message: 'Error placing order', error });
    }
});
// POST Upload Menu Content (Mock)
app.post('/api/upload-menu', async (req, res) => {
    await new Promise(res => setTimeout(res, 2000));
    const productsFound = Math.floor(Math.random() * 20) + 10;
    const promosFound = Math.floor(Math.random() * 5);
    res.json({
        message: `¡Proceso completado! La IA ha analizado los archivos y ha cargado ${productsFound} productos y ${promosFound} promociones en el sistema.`
    });
});
// The "catchall" handler: for any request that doesn't match one above,
// send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});
// Start Server
app.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
});
