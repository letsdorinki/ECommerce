const express = require('express');
const db = require('../db'); // Import database connection
const router = express.Router();

// 📌 Create a New Order (POST /orders)
router.post('/orders', (req, res) => {
    const { order_date, customer_id, shipping_contact_mech_id, billing_contact_mech_id, order_items } = req.body;

    if (!order_date || !customer_id || !shipping_contact_mech_id || !billing_contact_mech_id || !order_items.length) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Insert Order Header
    const sqlOrder = `INSERT INTO Order_Header (order_date, customer_id, shipping_contact_mech_id, billing_contact_mech_id) VALUES (?, ?, ?, ?)`;
    db.query(sqlOrder, [order_date, customer_id, shipping_contact_mech_id, billing_contact_mech_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        const orderId = result.insertId; // Get the created order ID

        // Insert Order Items
        const sqlItems = `INSERT INTO Order_Item (order_id, product_id, quantity, status) VALUES ?`;
        const orderItemsData = order_items.map(item => [orderId, item.product_id, item.quantity, item.status]);

        db.query(sqlItems, [orderItemsData], (err) => {
            if (err) return res.status(500).json({ error: err.message });

            res.status(201).json({ message: 'Order created successfully', order_id: orderId });
        });
    });
});

// 📌 Get Order Details (GET /orders/:order_id)
router.get('/orders/:order_id', (req, res) => {
    const { order_id } = req.params;

    const sql = `
        SELECT oh.order_id, oh.order_date, c.first_name, c.last_name, 
               cm1.street_address AS shipping_address, cm2.street_address AS billing_address,
               oi.order_item_seq_id, p.product_name, oi.quantity, oi.status
        FROM Order_Header oh
        JOIN Customer c ON oh.customer_id = c.customer_id
        JOIN Contact_Mech cm1 ON oh.shipping_contact_mech_id = cm1.contact_mech_id
        JOIN Contact_Mech cm2 ON oh.billing_contact_mech_id = cm2.contact_mech_id
        JOIN Order_Item oi ON oh.order_id = oi.order_id
        JOIN Product p ON oi.product_id = p.product_id
        WHERE oh.order_id = ?`;

    db.query(sql, [order_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Order not found' });

        res.status(200).json(results);
    });
});

// 📌 Update Order (PUT /orders/:order_id)
router.put('/orders/:order_id', (req, res) => {
    const { order_id } = req.params;
    const { shipping_contact_mech_id, billing_contact_mech_id } = req.body;

    const sql = `UPDATE Order_Header SET shipping_contact_mech_id = ?, billing_contact_mech_id = ? WHERE order_id = ?`;
    db.query(sql, [shipping_contact_mech_id, billing_contact_mech_id, order_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Order updated successfully' });
    });
});

// 📌 Delete Order (DELETE /orders/:order_id)
router.delete('/orders/:order_id', (req, res) => {
    const { order_id } = req.params;

    const sqlOrderItems = `DELETE FROM Order_Item WHERE order_id = ?`;
    db.query(sqlOrderItems, [order_id], (err) => {
        if (err) return res.status(500).json({ error: err.message });

        const sqlOrder = `DELETE FROM Order_Header WHERE order_id = ?`;
        db.query(sqlOrder, [order_id], (err) => {
            if (err) return res.status(500).json({ error: err.message });

            res.status(200).json({ message: 'Order deleted successfully' });
        });
    });
});

module.exports = router;
