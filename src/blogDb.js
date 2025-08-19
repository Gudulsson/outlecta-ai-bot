import fs from "fs";
import path from "path";
import { createRequire } from "module";

let Database = null;
try {
  const require = createRequire(import.meta.url);
  // eslint-disable-next-line import/no-extraneous-dependencies
  Database = require("better-sqlite3");
} catch (_) {
  Database = null; // Fallback to JSON store if not installed
}

const DB_PATH = path.join(process.cwd(), "blog_cache.sqlite");
const JSON_PATH = path.join(process.cwd(), "blog_cache.json");

export class BlogCacheDB {
  constructor() {
    this.isSqlite = Boolean(Database);
    if (this.isSqlite) {
      const firstTime = !fs.existsSync(DB_PATH);
      this.db = new Database(DB_PATH);
      if (firstTime) {
        this.initialize();
      }
      this.prepareStatements();
    } else {
      this.json = this.loadJson();
    }
  }

  initialize() {
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        title TEXT,
        vendor TEXT,
        product_type TEXT,
        last_hash TEXT,
        analyzed_at TEXT
      );
      CREATE TABLE IF NOT EXISTS product_analysis (
        product_id TEXT PRIMARY KEY,
        category TEXT,
        keywords TEXT,
        tags TEXT,
        analysis_json TEXT,
        updated_at TEXT
      );
      CREATE TABLE IF NOT EXISTS blog_metrics (
        key TEXT PRIMARY KEY,
        value_json TEXT,
        updated_at TEXT
      );
      CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        type TEXT,
        category TEXT,
        keywords TEXT,
        content_hash TEXT,
        quality_score INTEGER,
        created_at TEXT
      );
    `);
  }

  prepareStatements() {
    this.stmts = {
      upsertProduct: this.db.prepare(`INSERT INTO products (id, title, vendor, product_type, last_hash, analyzed_at)
        VALUES (@id, @title, @vendor, @product_type, @last_hash, @analyzed_at)
        ON CONFLICT(id) DO UPDATE SET title=excluded.title, vendor=excluded.vendor, product_type=excluded.product_type, last_hash=excluded.last_hash, analyzed_at=excluded.analyzed_at`),
      getProduct: this.db.prepare(`SELECT * FROM products WHERE id = ?`),
      upsertAnalysis: this.db.prepare(`INSERT INTO product_analysis (product_id, category, keywords, tags, analysis_json, updated_at)
        VALUES (@product_id, @category, @keywords, @tags, @analysis_json, @updated_at)
        ON CONFLICT(product_id) DO UPDATE SET category=excluded.category, keywords=excluded.keywords, tags=excluded.tags, analysis_json=excluded.analysis_json, updated_at=excluded.updated_at`),
      getAnalysis: this.db.prepare(`SELECT * FROM product_analysis WHERE product_id = ?`),
      setMetric: this.db.prepare(`INSERT INTO blog_metrics (key, value_json, updated_at)
        VALUES (@key, @value_json, @updated_at)
        ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json, updated_at=excluded.updated_at`),
      getMetric: this.db.prepare(`SELECT value_json FROM blog_metrics WHERE key = ?`),
      insertArticle: this.db.prepare(`INSERT INTO articles (title, type, category, keywords, content_hash, quality_score, created_at)
        VALUES (@title, @type, @category, @keywords, @content_hash, @quality_score, @created_at)`)
    };
  }

  saveProduct(product, contentHash) {
    if (this.isSqlite) {
      this.stmts.upsertProduct.run({
        id: String(product.id),
        title: product.title,
        vendor: product.vendor || "",
        product_type: product.product_type || "",
        last_hash: contentHash || "",
        analyzed_at: new Date().toISOString()
      });
      return;
    }
    // JSON fallback
    this.json.products[String(product.id)] = {
      id: String(product.id),
      title: product.title,
      vendor: product.vendor || "",
      product_type: product.product_type || "",
      last_hash: contentHash || "",
      analyzed_at: new Date().toISOString()
    };
    this.saveJson();
  }

  getProductById(productId) {
    if (this.isSqlite) {
      return this.stmts.getProduct.get(String(productId));
    }
    return this.json.products[String(productId)] || null;
  }

  saveAnalysis(productId, analysis) {
    const row = {
      product_id: String(productId),
      category: analysis?.analysis?.complexity || analysis?.category || "unknown",
      keywords: JSON.stringify(analysis?.keywords || []),
      tags: JSON.stringify(analysis?.tags || []),
      analysis_json: JSON.stringify(analysis || {}),
      updated_at: new Date().toISOString()
    };
    if (this.isSqlite) {
      this.stmts.upsertAnalysis.run(row);
      return;
    }
    this.json.analysis[String(productId)] = row;
    this.saveJson();
  }

  getAnalysis(productId) {
    const row = this.isSqlite
      ? this.stmts.getAnalysis.get(String(productId))
      : this.json.analysis[String(productId)] || null;
    if (!row) return null;
    return {
      ...row,
      keywords: JSON.parse(row.keywords || "[]"),
      tags: JSON.parse(row.tags || "[]"),
      analysis: JSON.parse(row.analysis_json || "{}")
    };
  }

  setMetric(key, value) {
    if (this.isSqlite) {
      this.stmts.setMetric.run({
        key,
        value_json: JSON.stringify(value),
        updated_at: new Date().toISOString()
      });
      return;
    }
    this.json.metrics[key] = { value: value, updated_at: new Date().toISOString() };
    this.saveJson();
  }

  getMetric(key) {
    if (this.isSqlite) {
      const row = this.stmts.getMetric.get(key);
      return row ? JSON.parse(row.value_json) : null;
    }
    const row = this.json.metrics[key];
    return row ? row.value : null;
  }

  recordArticleMeta({ title, type, category, keywords, contentHash, qualityScore }) {
    if (this.isSqlite) {
      this.stmts.insertArticle.run({
        title,
        type,
        category,
        keywords: JSON.stringify(keywords || []),
        content_hash: contentHash || "",
        quality_score: qualityScore ?? null,
        created_at: new Date().toISOString()
      });
      return;
    }
    this.json.articles.push({
      title,
      type,
      category,
      keywords: keywords || [],
      content_hash: contentHash || "",
      quality_score: qualityScore ?? null,
      created_at: new Date().toISOString()
    });
    this.saveJson();
  }

  loadJson() {
    if (!fs.existsSync(JSON_PATH)) {
      const initial = { products: {}, analysis: {}, metrics: {}, articles: [] };
      fs.writeFileSync(JSON_PATH, JSON.stringify(initial, null, 2));
      return initial;
    }
    try {
      const data = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
      return { products: {}, analysis: {}, metrics: {}, articles: [], ...data };
    } catch {
      return { products: {}, analysis: {}, metrics: {}, articles: [] };
    }
  }

  saveJson() {
    fs.writeFileSync(JSON_PATH, JSON.stringify(this.json, null, 2));
  }
}

export default BlogCacheDB;


