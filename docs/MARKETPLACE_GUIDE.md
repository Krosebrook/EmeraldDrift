# Marketplace Integration Guide

> **Version**: 2.0.0  
> **Last Updated**: January 2026

This guide provides comprehensive instructions for integrating and managing e-commerce marketplaces in EmeraldDrift.

## Table of Contents

1. [Overview](#overview)
2. [Supported Marketplaces](#supported-marketplaces)
3. [Prerequisites](#prerequisites)
4. [Setup Instructions](#setup-instructions)
5. [Unified Marketplace Service](#unified-marketplace-service)
6. [Common Operations](#common-operations)
7. [Webhooks](#webhooks)
8. [Troubleshooting](#troubleshooting)

---

## Overview

EmeraldDrift provides seamless integration with 7 major e-commerce marketplaces, allowing you to:

- **Manage products** across multiple platforms from a single dashboard
- **Track orders** and fulfillment in real-time
- **Sync inventory** automatically across all connected platforms
- **View aggregated analytics** (revenue, orders, AOV)
- **Receive webhook notifications** for order events

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Unified Marketplace Service                 │
├─────────────────────────────────────────────────────────────┤
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│   │ Shopify  │ │  Etsy    │ │ Amazon   │ │ TikTok Shop  │  │
│   └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
│   │ Printify │ │WooCommerce│ │ (Future) │                  │
│   └──────────┘ └──────────┘ └──────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Supported Marketplaces

| Marketplace | Features | Setup Difficulty | Best For |
|------------|----------|------------------|----------|
| **Shopify** | Products, Orders, Inventory, Analytics | Easy | Online stores, dropshipping |
| **Etsy** | Listings, Orders, Shop analytics | Medium | Handmade, vintage, crafts |
| **Amazon** | Products, Orders, FBA/FBM | Medium | Large catalog, fulfillment |
| **Printify** | POD products, Auto-fulfillment | Easy | Print-on-demand, merch |
| **TikTok Shop** | Products, Orders, Analytics | Medium | Social commerce, viral products |
| **WooCommerce** | Products, Orders, Inventory | Easy | Self-hosted WordPress stores |

---

## Prerequisites

Before setting up marketplace integrations, ensure you have:

1. **Active seller accounts** on the marketplaces you want to connect
2. **API credentials** for each marketplace (see setup instructions below)
3. **Valid payment methods** configured on each platform
4. **SSL certificate** (required for webhooks)
5. **EmeraldDrift app** with marketplace features enabled

---

## Setup Instructions

### 1. Shopify

#### Step 1: Create a Custom App

1. Log in to your Shopify admin panel
2. Navigate to **Settings > Apps and sales channels**
3. Click **Develop apps** → **Create an app**
4. Name your app (e.g., "EmeraldDrift Integration")
5. Click **Configure Admin API scopes**

#### Step 2: Configure API Scopes

Select the following scopes:
- `read_products`, `write_products`
- `read_orders`, `write_orders`
- `read_inventory`, `write_inventory`
- `read_fulfillments`, `write_fulfillments`
- `read_analytics`

#### Step 3: Install the App

1. Click **Install app**
2. Copy the **Admin API access token** (starts with `shpat_`)
3. Copy your **store domain** (e.g., `yourstore.myshopify.com`)

#### Step 4: Add to EmeraldDrift

In your `.env.local` file:
```env
EXPO_PUBLIC_SHOPIFY_STORE_DOMAIN=yourstore.myshopify.com
EXPO_PUBLIC_SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_...
```

#### Step 5: Connect in App

1. Open EmeraldDrift
2. Navigate to **Settings > Platforms**
3. Select **Shopify** and click **Connect**
4. Verify connection status shows "Connected"

---

### 2. Etsy

#### Step 1: Create an App

1. Go to [Etsy Developers](https://www.etsy.com/developers/)
2. Click **Register as a Developer** (if first time)
3. Create a new app: **Your Account > Apps > Create a New App**
4. Fill in app details:
   - **App Name**: EmeraldDrift
   - **Callback URL**: `https://your-domain.com/auth/etsy/callback`

#### Step 2: Get API Credentials

1. Copy your **API Key** (Keystring)
2. Copy your **Shared Secret**
3. Note your **Shop ID** (found in your shop URL)

#### Step 3: Configure Permissions

Request the following OAuth scopes:
- `listings_r` (read listings)
- `listings_w` (write listings)
- `transactions_r` (read orders)
- `shops_r` (read shop info)

#### Step 4: Add to EmeraldDrift

In your `.env.local`:
```env
EXPO_PUBLIC_ETSY_API_KEY=your_etsy_api_key
EXPO_PUBLIC_ETSY_SHARED_SECRET=your_etsy_shared_secret
EXPO_PUBLIC_ETSY_SHOP_ID=your_shop_id
```

---

### 3. Amazon (Seller Central + KDP)

#### Step 1: Register as Amazon Developer

1. Go to [Amazon Seller Central](https://sellercentral.amazon.com/)
2. Navigate to **Settings > User Permissions**
3. Click **Amazon MWS Auth Token** → **View your developer information**

#### Step 2: Get API Credentials

1. Copy **AWS Access Key ID**
2. Copy **Secret Access Key**
3. Note your **Marketplace ID** (e.g., `ATVPDKIKX0DER` for US)
4. Note your **Seller ID** / **Merchant ID**

#### Step 3: Register Your Application

1. Go to **App Store > Develop apps**
2. Register a new application
3. Submit for approval (may take 24-48 hours)

#### Step 4: Add to EmeraldDrift

```env
EXPO_PUBLIC_AMAZON_ACCESS_KEY_ID=your_access_key_id
EXPO_PUBLIC_AMAZON_SECRET_ACCESS_KEY=your_secret_key
EXPO_PUBLIC_AMAZON_MARKETPLACE_ID=ATVPDKIKX0DER
EXPO_PUBLIC_AMAZON_SELLER_ID=your_seller_id
```

---

### 4. Printify (Print-on-Demand)

#### Step 1: Create API Token

1. Log in to [Printify](https://printify.com/)
2. Go to **My Account > API**
3. Click **Create Token**
4. Name it "EmeraldDrift" and copy the token

#### Step 2: Get Shop ID

1. Navigate to **My Shops**
2. Copy your **Shop ID** from the URL or shop settings

#### Step 3: Add to EmeraldDrift

```env
EXPO_PUBLIC_PRINTIFY_API_TOKEN=your_printify_api_token
EXPO_PUBLIC_PRINTIFY_SHOP_ID=your_shop_id
```

---

### 5. WooCommerce

#### Step 1: Generate API Keys

1. In WordPress admin, go to **WooCommerce > Settings > Advanced > REST API**
2. Click **Add key**
3. Fill in:
   - **Description**: EmeraldDrift Integration
   - **User**: Select admin user
   - **Permissions**: Read/Write
4. Click **Generate API key**

#### Step 2: Copy Credentials

1. Copy **Consumer key** (starts with `ck_`)
2. Copy **Consumer secret** (starts with `cs_`)

#### Step 3: Add to EmeraldDrift

```env
EXPO_PUBLIC_WOOCOMMERCE_URL=https://yourstore.com
EXPO_PUBLIC_WOOCOMMERCE_CONSUMER_KEY=ck_...
EXPO_PUBLIC_WOOCOMMERCE_CONSUMER_SECRET=cs_...
```

---

### 6. TikTok Shop

#### Step 1: Register as TikTok Shop Partner

1. Go to [TikTok Shop Partner Portal](https://partner.tiktokshop.com/)
2. Click **Sign Up** and complete registration
3. Verify your business information

#### Step 2: Create an App

1. Navigate to **Development > My Apps**
2. Click **Create App**
3. Fill in app details and submit for review

#### Step 3: Get Credentials

1. Copy **App Key**
2. Copy **App Secret**
3. Complete OAuth flow to get **Access Token**

#### Step 4: Add to EmeraldDrift

```env
EXPO_PUBLIC_TIKTOK_SHOP_APP_KEY=your_app_key
EXPO_PUBLIC_TIKTOK_SHOP_APP_SECRET=your_app_secret
EXPO_PUBLIC_TIKTOK_SHOP_ACCESS_TOKEN=your_access_token
```

---

## Unified Marketplace Service

### Using the Service

```typescript
import { marketplaceService } from '@/features/marketplaces';

// Get all connected marketplaces
const connections = await marketplaceService.getAllConnections();

// Get products from all marketplaces
const products = await marketplaceService.getAllProducts({
  marketplaces: ['shopify', 'etsy'],
  limit: 50
});

// Get aggregated analytics
const analytics = await marketplaceService.getAggregatedAnalytics({
  startDate: '2026-01-01',
  endDate: '2026-01-31',
  marketplaces: ['shopify', 'etsy', 'amazon']
});

console.log(`Total Revenue: $${analytics.data.totalRevenue}`);
console.log(`Total Orders: ${analytics.data.totalOrders}`);
console.log(`Average Order Value: $${analytics.data.averageOrderValue}`);
```

### Connect a Marketplace

```typescript
const result = await marketplaceService.connect('shopify', {
  storeDomain: 'yourstore.myshopify.com',
  accessToken: 'shpat_...'
});

if (result.success) {
  console.log('Connected:', result.data.marketplace);
}
```

### Sync All Marketplaces

```typescript
const syncResults = await marketplaceService.syncAll();

syncResults.data.forEach(result => {
  console.log(`${result.marketplace}: ${result.productsAdded} products added`);
});
```

---

## Common Operations

### List Products

```typescript
const result = await marketplaceService.getAllProducts({
  marketplaces: ['shopify', 'etsy'],
  limit: 100
});

if (result.success) {
  result.data.forEach(product => {
    console.log(`${product.title} - $${product.price}`);
  });
}
```

### Get Recent Orders

```typescript
const orders = await marketplaceService.getAllOrders({
  marketplaces: ['shopify', 'amazon'],
  limit: 50,
  since: '2026-01-01T00:00:00Z'
});

orders.data.forEach(order => {
  console.log(`Order #${order.orderNumber} - ${order.status}`);
});
```

### Update Product Inventory

```typescript
const service = marketplaceService.getService('shopify');
if (service) {
  await service.updateInventory('product-id', 100);
}
```

---

## Webhooks

### Setting Up Webhooks

Webhooks allow marketplaces to notify your app of events in real-time (new orders, inventory changes, etc.).

#### Step 1: Configure Webhook Endpoint

In your `.env.local`:
```env
EXPO_PUBLIC_WEBHOOK_BASE_URL=https://your-domain.com/webhooks
EXPO_PUBLIC_WEBHOOK_SECRET=your_random_secret_key
```

#### Step 2: Register Webhooks

Each marketplace has different webhook setup:

**Shopify:**
1. Admin > Settings > Notifications > Webhooks
2. Add webhook: `https://your-domain.com/webhooks/shopify`
3. Select events: `orders/create`, `orders/updated`, `inventory_levels/update`

**Etsy:**
- Webhooks configured via API during app registration

**Amazon:**
- Use Amazon MWS Subscriptions API

**WooCommerce:**
1. WooCommerce > Settings > Advanced > Webhooks
2. Add webhook for order events

#### Step 3: Handle Webhook Events

```typescript
import { webhookHandler } from '@/features/marketplaces';

// In your API endpoint
app.post('/webhooks/:marketplace', async (req, res) => {
  const { marketplace } = req.params;
  const signature = req.headers['x-signature'];
  
  const result = await webhookHandler.process(marketplace, req.body, signature);
  
  if (result.success) {
    res.status(200).json({ received: true });
  } else {
    res.status(400).json({ error: result.error });
  }
});
```

---

## Troubleshooting

### Common Issues

#### "Authentication Failed"
- **Cause**: Invalid API credentials
- **Solution**: 
  1. Verify credentials in `.env.local`
  2. Check token hasn't expired
  3. Ensure all required scopes are granted

#### "Rate Limit Exceeded"
- **Cause**: Too many API requests
- **Solution**: 
  1. Reduce sync frequency
  2. Implement exponential backoff
  3. Contact marketplace for higher limits

#### "Product Sync Failed"
- **Cause**: Missing required fields or invalid data
- **Solution**:
  1. Check product has all required fields (title, price, etc.)
  2. Verify product format matches marketplace requirements
  3. Check logs for specific error messages

#### "Webhook Not Receiving Events"
- **Cause**: Invalid webhook URL or firewall blocking
- **Solution**:
  1. Verify URL is publicly accessible
  2. Check SSL certificate is valid
  3. Verify webhook signature validation
  4. Check marketplace webhook settings

### Debug Mode

Enable debug logging:
```env
EXPO_PUBLIC_DEBUG=true
EXPO_PUBLIC_LOG_LEVEL=debug
```

### Support

For additional help:
- Check [Troubleshooting Guide](TROUBLESHOOTING.md)
- Review marketplace API documentation
- Open an issue on [GitHub](https://github.com/Krosebrook/EmeraldDrift/issues)

---

## Best Practices

1. **Test in Sandbox First**: Most marketplaces offer sandbox/test environments
2. **Handle Rate Limits**: Implement retry logic and respect API limits
3. **Validate Webhooks**: Always verify webhook signatures
4. **Monitor Sync Status**: Set up alerts for failed syncs
5. **Keep Credentials Secure**: Never commit API keys to version control
6. **Regular Backups**: Export product data regularly
7. **Error Handling**: Implement comprehensive error logging

---

## API Reference

For detailed API documentation, see [API.md](API.md#marketplace-service).

---

*This guide is maintained as part of the EmeraldDrift documentation and should be updated when marketplace integrations change.*
