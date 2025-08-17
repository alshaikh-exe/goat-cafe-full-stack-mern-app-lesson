import express from 'express';
import { cart, addToCart, setItemQtyInCart, checkout, history } from '../../controllers/api/orders.js';

const router = express.Router();

// GET /api/orders/cart
router.get('/cart', cart);
// GET /api/orders/history
router.get('/history', history);
// POST /api/orders/cart/items/:id
router.post('/cart/items/:id', addToCart);
// POST /api/orders/cart/checkout
router.post('/cart/checkout', checkout);
// POST /api/orders/cart/qty
router.put('/cart/qty', setItemQtyInCart);

export default router;