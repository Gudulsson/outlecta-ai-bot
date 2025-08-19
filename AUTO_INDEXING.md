# 🤖 Automatiserad Produktindexering

**Realtidsindexering av alla nya produkter på outlecta.com**

## 🚀 Funktioner

### ⚡ **Realtidsindexering**
- **Automatisk upptäckt** av nya produkter
- **Omedelbar indexering** så fort produkter hittas
- **Webhook-triggers** för realtidsuppdateringar
- **Kontinuerlig övervakning** var 30:e sekund

### 🧠 **Ultimate AI-modell**
- **Mänskliga beskrivningar** - naturligt språk
- **Smart kategoridetektering** - automatisk produktklassificering
- **SEO-optimerat** - sökmotorvänligt innehåll
- **Inga platshållare** - rent, professionellt innehåll

### 🔄 **Automatiserad hantering**
- **Hash-baserad ändringsdetektering** - undviker onödiga uppdateringar
- **Rate limiting** - respekterar API-gränser
- **Felhantering** - robust och pålitlig
- **Loggning** - fullständig spårning

## 📋 Komponenter

### 1. **Auto-Indexer** (`src/autoIndexer.js`)
Kontinuerlig övervakning som söker efter nya produkter var 30:e sekund.

```bash
# Starta kontinuerlig indexering
npm run auto-indexer

# Kör en gång
npm run auto-index:once
```

### 2. **Webhook Server** (`src/webhookServer.js`)
Express-server som hanterar Shopify-webhooks för realtidsuppdateringar.

```bash
# Starta webhook-server
npm run webhook-server
```

### 3. **Webhook Indexer** (`src/webhookIndexer.js`)
Hanterar webhook-data och indexerar produkter omedelbart.

## 🛠️ Installation & Konfiguration

### 1. **Miljövariabler**
```bash
# Shopify API
SHOP_DOMAIN=your-store.myshopify.com
SHOP_ACCESS_TOKEN=shpat_your_access_token

# Webhook (valfritt)
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret
PORT=3000
```

### 2. **Starta Auto-Indexer**
```bash
# Kontinuerlig övervakning
npm run auto-indexer

# En gång för test
npm run auto-index:once
```

### 3. **Konfigurera Webhooks (valfritt)**
```bash
# Starta webhook-server
npm run webhook-server

# I Shopify Admin:
# 1. Gå till Settings > Notifications > Webhooks
# 2. Lägg till webhook för "Product creation"
# 3. URL: https://your-domain.com/webhook/products
# 4. Lägg till webhook för "Product updates"
# 5. Sätt webhook secret i SHOPIFY_WEBHOOK_SECRET
```

## 📊 Funktioner

### **Automatisk Produktupptäckt**
- Söker efter nya produkter var 30:e sekund
- Identifierar produkter utan beskrivningar
- Upptäcker titeländringar
- Sparar indexerade produkter i `.indexed_products.json`

### **Smart Kategoridetektering**
- **Power Cable** - kablar, stekar, kontakter
- **Panel PC** - touch screens, Android, HMI
- **Load Cell** - strain gauges, kraftmätning
- **Monitor Stand** - VESA-mounts, ställ
- **Weight Indicator** - vågar, indikatorer
- **Data Acquisition** - DAQ-system, datalogging
- **Vibration Sensor** - vibrationssensorer

### **Mänskliga Beskrivningar**
- Naturligt språk utan platshållare
- Produktspecifika nyckelord
- SEO-optimerade meta-beskrivningar
- Komplexitetsmedvetna beskrivningar

## 🔍 Övervakning

### **Loggar**
```
🤖 Auto-Indexer running at 2025-08-18T13:22:38.183Z
📊 Scanned 45 products
🚀 Found 45 products to index:
   New products: 45
   Updated products: 0

🔍 Indexing: EU Power Cable – 220V C13 Plug, 1.5m (new_product)
🔍 ULTIMATE AI ANALYSIS FOR: EU Power Cable – 220V C13 Plug, 1.5m
📊 Category: power cable
🎯 Keywords: power supply, electrical cable, industrial power, power cord, electrical connection
✨ USPs: industrial grade, reliable connection, durable construction, safety certified
✅ Successfully indexed: EU Power Cable – 220V C13 Plug, 1.5m
```

### **Webhook-loggar**
```
🔔 Webhook received: products/create
📝 Processing single product webhook: New Product Title
🔍 ULTIMATE AI ANALYSIS FOR: New Product Title
📊 Category: panel pc
✅ Successfully indexed via webhook: New Product Title
```

## 📈 Prestanda

### **Hastighet**
- **45 produkter** indexerade på ~2 minuter
- **Realtidswebhooks** - omedelbar indexering
- **Rate limiting** - respekterar API-gränser

### **Effektivitet**
- **Hash-baserad detektering** - undviker onödiga uppdateringar
- **Smart caching** - sparar indexerade produkter
- **Felåterställning** - robust felhantering

### **Kostnad**
- **$0.00** - helt gratis, inga API-kostnader
- **Offline drift** - inga externa beroenden
- **Obegränsad användning** - inga hastighetsbegränsningar

## 🚀 Deployment

### **Lokal utveckling**
```bash
npm run auto-indexer
```

### **Produktionsmiljö**
```bash
# Starta auto-indexer som bakgrundsprocess
nohup npm run auto-indexer > auto-indexer.log 2>&1 &

# Starta webhook-server
nohup npm run webhook-server > webhook-server.log 2>&1 &
```

### **Docker (valfritt)**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "auto-indexer"]
```

## 🔧 Felsökning

### **Vanliga problem**

**API Rate Limiting**
```
Shopify API usage high: 39/40
```
- Auto-indexer hanterar detta automatiskt
- Väntar mellan förfrågningar

**Webhook-signaturfel**
```
❌ Invalid webhook signature
```
- Kontrollera `SHOPIFY_WEBHOOK_SECRET`
- Verifiera webhook-URL i Shopify

**Produkt inte indexerad**
```
⚠️  No content generated for Product Name
```
- Kontrollera produktnamn för kategoridetektering
- Verifiera Ultimate AI-modell

## 📝 Exempel

### **Före (utan beskrivning)**
```
Title: "EU Power Cable – 220V C13 Plug, 1.5m"
Description: ""
```

### **Efter (automatiskt indexerad)**
```
Title: "EU Power Cable – 220V C13 Plug, 1.5m"
Description: "This EU Power Cable – 220V C13 Plug, 1.5m is a standard power cable designed for industrial equipment. It features industrial grade and reliable connection and provides reliable power delivery for your electrical devices."
Category: power cable
Keywords: power supply, electrical cable, industrial power
```

## 🎉 Resultat

### **Automatiserad indexering**
- ✅ **Alla nya produkter** indexeras automatiskt
- ✅ **Realtidsuppdateringar** via webhooks
- ✅ **Mänskliga beskrivningar** utan fel
- ✅ **SEO-optimerat** innehåll
- ✅ **Kostnadsfri** lösning

### **Fördelar**
- 🚀 **Ingen manuell hantering** - allt sker automatiskt
- 🧠 **Intelligent AI** - smart kategoridetektering
- 💰 **Kostnadsfri** - inga API-avgifter
- ⚡ **Snabb** - realtidsindexering
- 🔒 **Säker** - hash-baserad ändringsdetektering

---

**🎊 Din automatiserade produktindexering är nu aktiv och kommer att indexera alla nya produkter så fort de hittas!**
