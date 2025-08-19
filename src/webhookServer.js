import express from 'express';
import { handleProductWebhook, verifyWebhookSignature } from './webhookIndexer.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET || 'your_webhook_secret';

// Middleware to parse JSON
app.use(express.json({ verify: (req, res, buf) => {
  req.rawBody = buf;
}}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Shopify Auto-Indexer Webhook Server'
  });
});

// Webhook endpoint for product updates
app.post('/webhook/products', async (req, res) => {
  try {
    // Verify webhook signature
    const signature = req.headers['x-shopify-hmac-sha256'];
    if (!signature) {
      console.log('❌ No webhook signature provided');
      return res.status(401).json({ error: 'No signature provided' });
    }

    const isValid = verifyWebhookSignature(req.rawBody, signature, WEBHOOK_SECRET);
    if (!isValid) {
      console.log('❌ Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    console.log('🔔 Webhook received:', req.headers['x-shopify-topic']);
    
    // Handle different webhook topics
    const topic = req.headers['x-shopify-topic'];
    
    if (topic === 'products/create' || topic === 'products/update') {
      const productData = req.body;
      
      if (Array.isArray(productData)) {
        // Batch webhook
        console.log(`📦 Processing batch webhook with ${productData.length} products`);
        
        const results = [];
        for (const product of productData) {
          const result = await handleProductWebhook(product);
          results.push({
            productId: product.id,
            productTitle: product.title,
            ...result
          });
        }
        
        console.log(`✅ Batch webhook processed: ${results.filter(r => r.success).length}/${results.length} successful`);
        res.json({ 
          success: true, 
          message: 'Batch webhook processed',
          results 
        });
        
      } else {
        // Single product webhook
        console.log(`📝 Processing single product webhook: ${productData.title}`);
        
        const result = await handleProductWebhook(productData);
        
        console.log(`✅ Single webhook processed: ${result.success ? 'success' : 'failed'}`);
        res.json({ 
          success: true, 
          message: 'Single webhook processed',
          result 
        });
      }
      
    } else {
      console.log(`⚠️  Unsupported webhook topic: ${topic}`);
      res.status(400).json({ error: 'Unsupported webhook topic' });
    }
    
  } catch (error) {
    console.error('❌ Webhook processing error:', error.message);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Webhook endpoint for product deletion (optional)
app.post('/webhook/products/delete', async (req, res) => {
  try {
    const signature = req.headers['x-shopify-hmac-sha256'];
    if (!signature) {
      return res.status(401).json({ error: 'No signature provided' });
    }

    const isValid = verifyWebhookSignature(req.rawBody, signature, WEBHOOK_SECRET);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const productData = req.body;
    console.log(`🗑️  Product deleted: ${productData.title} (ID: ${productData.id})`);
    
    // Here you could clean up any stored data for the deleted product
    // For now, we just log the deletion
    
    res.json({ 
      success: true, 
      message: 'Product deletion logged',
      productId: productData.id 
    });
    
  } catch (error) {
    console.error('❌ Product deletion webhook error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Server error:', error.message);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Webhook server running on port ${PORT}`);
  console.log(`🔗 Webhook endpoints:`);
  console.log(`   POST /webhook/products - Product create/update`);
  console.log(`   POST /webhook/products/delete - Product deletion`);
  console.log(`   GET /health - Health check`);
  console.log(`\n📝 To set up webhooks in Shopify:`);
  console.log(`   1. Go to Shopify Admin > Settings > Notifications > Webhooks`);
  console.log(`   2. Add webhook for "Product creation" -> ${req.protocol}://${req.get('host')}/webhook/products`);
  console.log(`   3. Add webhook for "Product updates" -> ${req.protocol}://${req.get('host')}/webhook/products`);
  console.log(`   4. Set webhook secret in environment variable SHOPIFY_WEBHOOK_SECRET`);
});

export default app;
