import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const { SHOP_DOMAIN, SHOP_ACCESS_TOKEN } = process.env;

export const api = axios.create({
  baseURL: `https://${SHOP_DOMAIN}/admin/api/2024-07`,
  headers: {
    "X-Shopify-Access-Token": SHOP_ACCESS_TOKEN,
    "Content-Type": "application/json"
  },
  timeout: 30000
});

// Surface rate-limit info in logs for adaptive behavior
api.interceptors.response.use((res) => {
  const limit = res.headers?.["x-shopify-shop-api-call-limit"];
  if (limit) {
    // Example: "6/80"
    const [used, total] = String(limit).split("/").map(Number);
    if (!Number.isNaN(used) && !Number.isNaN(total) && used / total > 0.8) {
      // eslint-disable-next-line no-console
      console.log(`Shopify API usage high: ${used}/${total}`);
    }
  }
  return res;
});

// Enkel retry/backoff för 429/5xx
export async function requestWithRetry(method, url, data = undefined, attempt = 1) {
  const maxAttempts = 5;
  const baseDelayMs = 1000;
  try {
    if (method === "get") return await api.get(url);
    if (method === "put") return await api.put(url, data);
    if (method === "post") return await api.post(url, data);
    if (method === "delete") return await api.delete(url);
    throw new Error(`Unsupported method: ${method}`);
  } catch (err) {
    const status = err?.response?.status;
    const shouldRetry = status === 429 || (status >= 500 && status < 600) || err.code === "ECONNABORTED";
    if (shouldRetry && attempt < maxAttempts) {
      const retryAfterHeader = err?.response?.headers?.["retry-after"];
      const serverDelay = retryAfterHeader ? Number(retryAfterHeader) * 1000 : 0;
      const backoff = baseDelayMs * Math.pow(2, attempt - 1);
      const jitter = Math.floor(Math.random() * 250);
      const delay = Math.max(serverDelay, backoff + jitter);
      await new Promise(r => setTimeout(r, delay));
      return requestWithRetry(method, url, data, attempt + 1);
    }
    throw err;
  }
}

// Cursor-baserad pagination (page_info)
export async function listProducts({ limit = 100, pageInfo = null }) {
  const url = pageInfo
    ? `/products.json?limit=${limit}&page_info=${encodeURIComponent(pageInfo)}`
    : `/products.json?limit=${limit}&order=created_at+asc`;

  const res = await requestWithRetry("get", url);
  // Hämta nästa page_info från Link-header
  const link = res.headers?.link || "";
  let next = null;
  if (link.includes(`rel="next"`)) {
    const m = link.match(/<([^>]+)>; rel="next"/);
    if (m) {
      const u = new URL(m[1]);
      next = u.searchParams.get("page_info");
    }
  }
  return { products: res.data.products || [], nextPageInfo: next };
}

export async function updateImageAlt(productId, imageId, alt) {
  // PUT /products/{id}/images/{image_id}.json
  return requestWithRetry("put", `/products/${productId}/images/${imageId}.json`, {
    image: { id: imageId, alt }
  });
}

export async function updateProductDescription(productId, description) {
  // PUT /products/{id}.json
  return requestWithRetry("put", `/products/${productId}.json`, {
    product: { 
      id: productId, 
      body_html: description 
    }
  });
}

// Upsert product metafield (e.g., global/description_tag for SEO description)
export async function upsertProductMetafield(productId, namespace, key, value, type = "single_line_text_field") {
  const payload = {
    metafield: {
      namespace,
      key,
      type,
      value,
      owner_id: productId,
      owner_resource: "product"
    }
  };
  return requestWithRetry("post", `/metafields.json`, payload);
}

// Get product metafield value
export async function getProductMetafield(productId, namespace, key) {
  const res = await requestWithRetry("get", `/products/${productId}/metafields.json?namespace=${namespace}&key=${key}`);
  const metafields = res.data?.metafields || [];
  return metafields.length > 0 ? metafields[0].value : null;
}

// Check if description hash matches (skip unchanged content)
export async function getDescriptionHash(productId) {
  return await getProductMetafield(productId, "agent", "desc_hash");
}

// Webhook management functions
export async function createWebhook(topic, address, format = "json") {
  const payload = {
    webhook: {
      topic,
      address,
      format
    }
  };
  return requestWithRetry("post", "/webhooks.json", payload);
}

export async function listWebhooks() {
  const res = await requestWithRetry("get", "/webhooks.json");
  return res.data?.webhooks || [];
}

export async function deleteWebhook(webhookId) {
  return requestWithRetry("delete", `/webhooks/${webhookId}.json`);
}

// Upload a file (e.g., blog thumbnail) to Shopify Files and return the URL
export async function uploadFileBase64(filename, base64Attachment, mimeType = "image/png") {
  const payload = {
    file: {
      attachment: base64Attachment,
      filename,
      mime_type: mimeType
    }
  };
  const res = await requestWithRetry("post", "/files.json", payload);
  // Response contains file object with url
  const file = res.data?.file;
  if (!file?.url) {
    throw new Error("File upload did not return a URL");
  }
  return file.url;
}

// Register product webhooks for AI agent
export async function registerProductWebhooks(webhookUrl) {
  const topics = [
    "products/create",
    "products/update"
  ];
  
  console.log(`🔗 Registering webhooks for: ${webhookUrl}`);
  
  for (const topic of topics) {
    try {
      const result = await createWebhook(topic, webhookUrl);
      console.log(`✅ Registered webhook: ${topic}`);
    } catch (error) {
      if (error?.response?.status === 422) {
        console.log(`⚠️  Webhook already exists: ${topic}`);
      } else {
        console.error(`❌ Failed to register webhook ${topic}:`, error.message);
      }
    }
  }
}
