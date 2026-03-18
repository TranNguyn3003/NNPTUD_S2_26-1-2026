var express = require("express");
var router = express.Router();
let { checkLogin } = require('../utils/authHandler')
let reservationModel = require('../schemas/reservations')
let cartModel = require('../schemas/carts')
let inventoryModel = require('../schemas/inventories')
let productModel = require('../schemas/products')
let mongoose = require('mongoose');

//get all cua user -> get reservations/
router.get('/', checkLogin, async (req, res) => {
    try {
        let reservations = await reservationModel.find({ user: req.userId });
        res.send({ success: true, data: reservations });
    } catch (err) {
        res.status(500).send({ success: false, message: err.message });
    }
});

// get 1 cua user -> get reservations/:id
router.get('/:id', checkLogin, async (req, res) => {
    try {
        let reservation = await reservationModel.findOne({ _id: req.params.id, user: req.userId });
        if (!reservation) return res.status(404).send({ success: false, message: "Reservation not found" });
        res.send({ success: true, data: reservation });
    } catch (err) {
        res.status(500).send({ success: false, message: err.message });
    }
});

// reserveACart -> post reserveACart/
router.post('/reserveACart', checkLogin, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        let cart = await cartModel.findOne({ user: req.userId }).session(session);
        if (!cart || cart.cartItems.length === 0) {
            throw new Error("Cart is empty");
        }

        let items = [];
        let totalAmount = 0;

        for (let item of cart.cartItems) {
            let product = await productModel.findById(item.product).session(session);
            if (!product) throw new Error("Product not found");

            let inventory = await inventoryModel.findOne({ product: item.product }).session(session);
            if (!inventory || inventory.stock < item.quantity) {
                throw new Error(`Not enough stock for product ${product.title}`);
            }

            // update inventory
            inventory.stock -= item.quantity;
            inventory.reserved += item.quantity;
            await inventory.save({ session });

            let subtotal = product.price * item.quantity;
            totalAmount += subtotal;

            items.push({
                product: item.product,
                quantity: item.quantity,
                title: product.title,
                price: product.price,
                subtotal: subtotal
            });
        }

        let expiredIn = new Date();
        expiredIn.setMinutes(expiredIn.getMinutes() + 15);

        let reservation = new reservationModel({
            user: req.userId,
            items: items,
            amount: totalAmount,
            status: "actived",
            expiredIn: expiredIn
        });
        await reservation.save({ session });

        // empty cart
        cart.cartItems = [];
        await cart.save({ session });

        await session.commitTransaction();
        session.endSession();
        res.send({ success: true, data: reservation });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).send({ success: false, message: err.message });
    }
});

// reserveItems -> post reserveItems/ {body gom list product va quantity}
router.post('/reserveItems', checkLogin, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        let itemsInput = req.body;
        if (!Array.isArray(itemsInput) || itemsInput.length === 0) {
            throw new Error("Invalid items format");
        }

        let items = [];
        let totalAmount = 0;

        for (let item of itemsInput) {
            let product = await productModel.findById(item.product).session(session);
            if (!product) throw new Error("Product not found");

            let inventory = await inventoryModel.findOne({ product: item.product }).session(session);
            if (!inventory || inventory.stock < item.quantity) {
                throw new Error(`Not enough stock for product ${product.title}`);
            }

            inventory.stock -= item.quantity;
            inventory.reserved += item.quantity;
            await inventory.save({ session });

            let subtotal = product.price * item.quantity;
            totalAmount += subtotal;

            items.push({
                product: item.product,
                quantity: item.quantity,
                title: product.title,
                price: product.price,
                subtotal: subtotal
            });
        }

        let expiredIn = new Date();
        expiredIn.setMinutes(expiredIn.getMinutes() + 15);

        let reservation = new reservationModel({
            user: req.userId,
            items: items,
            amount: totalAmount,
            status: "actived",
            expiredIn: expiredIn
        });
        await reservation.save({ session });

        await session.commitTransaction();
        session.endSession();
        res.send({ success: true, data: reservation });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).send({ success: false, message: err.message });
    }
});

// cancelReserve -> post cancelReserve/:id
router.post('/cancelReserve/:id', checkLogin, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        let reservation = await reservationModel.findOne({ _id: req.params.id, user: req.userId }).session(session);
        if (!reservation) throw new Error("Reservation not found");
        if (reservation.status !== "actived") throw new Error("Reservation is not active");

        for (let item of reservation.items) {
            let inventory = await inventoryModel.findOne({ product: item.product }).session(session);
            if (inventory) {
                inventory.stock += item.quantity;
                inventory.reserved -= item.quantity;
                await inventory.save({ session });
            }
        }

        reservation.status = "cancelled";
        await reservation.save({ session });

        await session.commitTransaction();
        session.endSession();
        res.send({ success: true, data: reservation });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).send({ success: false, message: err.message });
    }
});

module.exports = router;
