import dotenv from "dotenv";
dotenv.config();
import { registerProductWebhooks, listWebhooks } from "./shopify.js";

const WEBHOOK_URL = process.env.WEBHOOK_URL;

async function setupWebhooks() {
  if (!WEBHOOK_URL) {
    console.error("❌ WEBHOOK_URL environment variable is required");
    console.log("Set it to your webhook endpoint URL (e.g., https://your-domain.com/webhook)");
    process.exit(1);
  }
  
  console.log("🔧 Setting up Shopify webhooks for AI agent...");
  console.log(`📡 Webhook URL: ${WEBHOOK_URL}`);
  
  try {
    // List existing webhooks
    const existingWebhooks = await listWebhooks();
    console.log(`📋 Found ${existingWebhooks.length} existing webhooks`);
    
    // Register new webhooks
    await registerProductWebhooks(WEBHOOK_URL);
    
    // List webhooks again to confirm
    const updatedWebhooks = await listWebhooks();
    console.log(`✅ Setup complete. Total webhooks: ${updatedWebhooks.length}`);
    
    // Show product-related webhooks
    const productWebhooks = updatedWebhooks.filter(w => 
      w.topic.includes('products/')
    );
    
    if (productWebhooks.length > 0) {
      console.log("\n📦 Product webhooks:");
      productWebhooks.forEach(webhook => {
        console.log(`  - ${webhook.topic} → ${webhook.address}`);
      });
    }
    
  } catch (error) {
    console.error("❌ Failed to setup webhooks:", error.message);
    process.exit(1);
  }
}

// Run setup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupWebhooks();
}
