# 🔧 Setup Guide - Shopify Connection

För att kunna publicera bloggartiklar till Outlecta.com behöver du konfigurera Shopify API-anslutningen.

## 📋 Krav

1. **Shopify Store**: Du behöver ha tillgång till din Shopify-butik (Outlecta.com)
2. **Admin API Access Token**: En API-nyckel för att ansluta till Shopify

## 🚀 Steg för att sätta upp

### 1. Skapa en .env-fil

Skapa en fil som heter `.env` i projektets rotmapp med följande innehåll:

```env
# Shopify API Configuration
SHOP_DOMAIN=outlecta.myshopify.com
SHOP_ACCESS_TOKEN=your_access_token_here

# Optional: AI API Keys för förbättrad innehållsgenerering
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. Hämta Shopify Access Token

1. Logga in på din Shopify admin: https://outlecta.myshopify.com/admin
2. Gå till **Apps** > **App and sales channel settings**
3. Klicka på **Develop apps**
4. Skapa en ny app eller använd en befintlig
5. Under **Admin API access scopes**, aktivera:
   - `read_products`
   - `write_products` 
   - `read_online_store_pages`
   - `write_online_store_pages`
   - `read_blog_articles`
   - `write_blog_articles`
6. Installera appen på din butik
7. Kopiera **Admin API access token**

### 3. Testa anslutningen

När du har konfigurerat .env-filen, testa anslutningen:

```bash
npm run blog:analyze
```

## 🔍 Felsökning

### "Missing environment variables"
- Kontrollera att .env-filen finns i projektets rotmapp
- Kontrollera att variablerna är korrekt namngivna

### "401 Unauthorized"
- Kontrollera att SHOP_ACCESS_TOKEN är korrekt
- Kontrollera att appen har rätt behörigheter

### "404 Not Found"
- Kontrollera att SHOP_DOMAIN är korrekt (ska vara `outlecta.myshopify.com`)

## 📝 Exempel på .env-fil

```env
SHOP_DOMAIN=outlecta.myshopify.com
SHOP_ACCESS_TOKEN=your_access_token_here
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
```

## 🎯 Nästa steg

När .env-filen är konfigurerad kan du köra:

```bash
# Analysera produkter
npm run blog:analyze

# Generera och publicera bloggartiklar
npm run blog:generate

# Tvinga fram ny generering
npm run blog:force
```

## 🔒 Säkerhet

- **Lägg aldrig till .env-filen i Git** - den är redan i .gitignore
- **Dela aldrig din access token** med andra
- **Rotera access tokens regelbundet** för säkerhet
