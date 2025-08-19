import { processProductUpdate } from "./webhookHandler.js";
import crypto from "crypto";

const WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET;

// Verify Shopify webhook signature
function verifyWebhookSignature(body, hmacHeader) {
  if (!WEBHOOK_SECRET || !hmacHeader) return false;
  
  const calculatedHmac = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(body, 'utf8')
    .digest('base64');
    
  return crypto.timingSafeEqual(
    Buffer.from(calculatedHmac),
    Buffer.from(hmacHeader)
  );
}

// Handle Shopify product webhook events
export async function handleShopifyWebhook(req, res) {
  const hmacHeader = req.headers['x-shopify-hmac-sha256'];
  const topic = req.headers['x-shopify-topic'];
  const shopDomain = req.headers['x-shopify-shop-domain'];
  
  console.log(`📨 Webhook received: ${topic} from ${shopDomain}`);
  
  // Verify webhook signature
  if (!verifyWebhookSignature(req.body, hmacHeader)) {
    console.error('❌ Invalid webhook signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Only process product events
  if (!topic?.includes('products/')) {
    return res.status(200).json({ message: 'Ignored non-product event' });
  }
  
  try {
    const product = req.body;
    
    if (!product?.id || !product?.title) {
      return res.status(400).json({ error: 'Invalid product data' });
    }
    
    console.log(`🔄 Processing webhook for product: ${product.title} (ID: ${product.id})`);
    
    // Process the product update
    const result = await processProductUpdate(
      product.id,
      product.title,
      product.vendor || '',
      product.variants?.[0]?.title || ''
    );
    
    console.log(`✅ Webhook processing result:`, result);
    
    return res.status(200).json({
      success: true,
      product_id: product.id,
      result
    });
    
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// Simple Express-style middleware for webhook verification
export function webhookMiddleware(req, res, next) {
  const hmacHeader = req.headers['x-shopify-hmac-sha256'];
  
  if (!verifyWebhookSignature(req.body, hmacHeader)) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }
  
  next();
}
