const express = require('express');
const router = express.Router();
const controller = require('../controllers/rawMaterialController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', controller.list);
router.get('/reorder', controller.reorder);
router.get('/movements', controller.movements);
router.post('/', controller.create);
router.post('/bulk', controller.bulkCreate);
router.post('/purchases', controller.recordPurchase);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);
router.get('/:id/movements', controller.movements);
router.post('/:id/movements', controller.addMovement);

module.exports = router;
