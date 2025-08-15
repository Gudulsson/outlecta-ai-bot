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

// Cursor-baserad pagination (page_info)
export async function listProducts({ limit = 100, pageInfo = null }) {
  const url = pageInfo
    ? `/products.json?limit=${limit}&page_info=${encodeURIComponent(pageInfo)}`
    : `/products.json?limit=${limit}&order=created_at+asc`;

  const res = await api.get(url);
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
  return api.put(`/products/${productId}/images/${imageId}.json`, {
    image: { id: imageId, alt }
  });
}

export async function updateProductDescription(productId, description) {
  // PUT /products/{id}.json
  return api.put(`/products/${productId}.json`, {
    product: { 
      id: productId, 
      body_html: description 
    }
  });
}
