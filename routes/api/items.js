import express from 'express';
import itemsCtrl from '../../controllers/api/items.js';

const router = express.Router();

// GET /api/items
router.get('/', itemsCtrl.index);
// GET /api/items/:id
router.get('/:id', itemsCtrl.show);

export default router;