
import express from 'express';
import Product from '../models/Product.js';

const router = express.Router();

// Get All Products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    // Map _id to id for frontend compatibility
    const formatted = products.map(p => ({
        ...p._doc,
        id: p._id.toString()
    }));
    res.status(200).json(formatted);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Add Product (Admin)
router.post('/', async (req, res) => {
  try {
    // Remove the 'id' field if sent by frontend, let MongoDB handle _id
    const { id, ...productData } = req.body;
    
    const newProduct = new Product(productData);
    const savedProduct = await newProduct.save();
    
    res.status(201).json({ ...savedProduct._doc, id: savedProduct._id.toString() });
  } catch (err) {
    console.error("Add Product Error:", err);
    res.status(500).json({ message: "Failed to add product", error: err.message });
  }
});

// Delete Product (Admin)
router.delete('/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json("Product has been deleted...");
  } catch (err) {
    res.status(500).json(err);
  }
});

export default router;
