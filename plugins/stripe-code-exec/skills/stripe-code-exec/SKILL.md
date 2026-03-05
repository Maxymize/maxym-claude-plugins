---
name: stripe-code-exec
description: Direct Stripe API access with Test/Live mode support, payment processing, subscriptions, invoices (99%+ token reduction)
---

# Stripe Code Execution

Direct connection to Stripe API for payment processing, customer management, subscriptions, invoices, and more. Supports both **Test Mode (sandbox)** and **Live Mode** for production.

**Strategy**: Direct Connection (100% MIGRATED)
**Result**: User CAN uninstall the Stripe MCP server

## Setup

### 1. Install Dependencies

No additional dependencies required - uses native `fetch()`.

### 2. Get API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. For testing: Copy your **Test mode** secret key (`sk_test_...`)
3. For production: Copy your **Live mode** secret key (`sk_live_...`)

### 3. Set Environment Variable

```bash
# For testing (recommended to start)
export STRIPE_API_KEY=sk_test_your_key_here

# For production (when ready)
export STRIPE_API_KEY=sk_live_your_key_here
```

## Sandbox Testing Guide

### Test vs Live Mode

| Mode | Key Prefix | Real Money | Use For |
|------|------------|------------|---------|
| Test | `sk_test_` | No | Development, testing |
| Live | `sk_live_` | Yes | Production |

### Test Card Numbers

Use these card numbers with **any future expiry date** and **any 3-digit CVC**:

#### Successful Payments
| Brand | Number | Description |
|-------|--------|-------------|
| Visa | `4242424242424242` | Succeeds and immediately processes |
| Mastercard | `5555555555554444` | Succeeds and immediately processes |
| Amex | `378282246310005` | Succeeds and immediately processes |
| Discover | `6011111111111117` | Succeeds and immediately processes |

#### Decline Scenarios
| Scenario | Number | Description |
|----------|--------|-------------|
| Generic decline | `4000000000000002` | Card declined |
| Insufficient funds | `4000000000009995` | Insufficient funds |
| Lost card | `4000000000009987` | Card reported lost |
| Expired card | `4000000000000069` | Expired card |
| Incorrect CVC | `4000000000000127` | Incorrect CVC |

#### 3D Secure
| Scenario | Number | Description |
|----------|--------|-------------|
| 3DS Required | `4000000000003220` | Requires authentication |
| 3DS Optional | `4000000000003055` | Optional authentication |

### Test Payment Method Tokens

For programmatic testing, use these tokens instead of card numbers:

```typescript
import { TEST_PAYMENT_METHODS } from './scripts/client-stripe.js';

// Use directly in API calls
const paymentMethod = TEST_PAYMENT_METHODS.visa; // 'pm_card_visa'
```

## Usage

### Import the Client

```typescript
import {
  // Utilities
  isTestMode,
  validateApiKey,
  getTestCard,
  getSandboxSetupGuide,
  formatAmount,
  toCents,

  // Account
  getAccount,
  getBalance,

  // Customers
  createCustomer,
  listCustomers,
  searchCustomers,

  // Products & Prices
  createProduct,
  createPrice,
  listProducts,
  createProductWithPrice,

  // Payments
  createPaymentIntent,
  confirmPaymentIntent,
  listPaymentIntents,

  // Subscriptions
  createSubscription,
  updateSubscription,
  cancelSubscription,
  listSubscriptions,

  // Invoices
  createInvoice,
  createInvoiceItem,
  finalizeInvoice,
  listInvoices,

  // Refunds & Disputes
  createRefund,
  listDisputes,

  // Coupons
  createCoupon,
  listCoupons,

  // Payment Links
  createPaymentLink,

  // Constants
  TEST_CARDS,
  TEST_PAYMENT_METHODS,
} from './.claude/skills/stripe-code-exec/scripts/client-stripe.js';
```

### Check API Key Mode

```typescript
const apiKey = process.env.STRIPE_API_KEY!;

// Validate key format
const validation = validateApiKey(apiKey);
console.log(`Mode: ${validation.mode}, Type: ${validation.type}`);

// Check if test mode
if (isTestMode(apiKey)) {
  console.log('Running in TEST mode - no real charges');
} else {
  console.log('WARNING: Running in LIVE mode - real charges!');
}
```

### Customer Management

```typescript
// Create a customer
const customer = await createCustomer({
  email: 'customer@example.com',
  name: 'John Doe',
  metadata: { user_id: '12345' }
});

// List customers
const customers = await listCustomers({ limit: 10 });

// Search customers
const results = await searchCustomers('email:"customer@example.com"');
```

### Products & Prices

```typescript
// Create product with price in one call
const { product, price } = await createProductWithPrice(
  { name: 'Pro Plan', description: 'Monthly subscription' },
  { currency: 'usd', unit_amount: 2999, recurring: { interval: 'month' } }
);

// Or create separately
const product = await createProduct({ name: 'T-Shirt' });
const price = await createPrice({
  product: product.id,
  currency: 'usd',
  unit_amount: 2000  // $20.00
});
```

### Payment Processing

```typescript
// Create payment intent
const paymentIntent = await createPaymentIntent({
  amount: 2000,  // $20.00 in cents
  currency: 'usd',
  customer: customer.id,
  automatic_payment_methods: { enabled: true }
});

// For testing: confirm with test payment method
const confirmed = await confirmPaymentIntent(paymentIntent.id, {
  payment_method: 'pm_card_visa'
});

console.log(`Payment status: ${confirmed.status}`);
```

### Subscriptions

```typescript
// Create subscription
const subscription = await createSubscription({
  customer: customer.id,
  items: [{ price: price.id }],
  trial_period_days: 14
});

// Update subscription
await updateSubscription(subscription.id, {
  cancel_at_period_end: true
});

// Cancel immediately
await cancelSubscription(subscription.id);
```

### Invoices

```typescript
// Create invoice
const invoice = await createInvoice({
  customer: customer.id,
  auto_advance: false
});

// Add line item
await createInvoiceItem({
  customer: customer.id,
  invoice: invoice.id,
  amount: 5000,
  currency: 'usd',
  description: 'Consulting services'
});

// Finalize and send
await finalizeInvoice(invoice.id);
```

### Refunds

```typescript
// Full refund
const refund = await createRefund({
  payment_intent: paymentIntent.id
});

// Partial refund
const partialRefund = await createRefund({
  payment_intent: paymentIntent.id,
  amount: 1000  // $10.00
});
```

### Payment Links

```typescript
const paymentLink = await createPaymentLink({
  line_items: [{ price: price.id, quantity: 1 }],
  after_completion: {
    type: 'redirect',
    redirect: { url: 'https://example.com/success' }
  }
});

console.log(`Checkout URL: ${paymentLink.url}`);
```

### Quick Checkout (All-in-One)

```typescript
// Create customer + product + price + payment intent in one call
const checkout = await createQuickCheckout({
  customerEmail: 'customer@example.com',
  productName: 'Premium Feature',
  amountInCents: 4999  // $49.99
});

console.log(`Customer: ${checkout.customer.id}`);
console.log(`Payment Intent: ${checkout.paymentIntent.client_secret}`);
```

## Available Functions

### Local Operations (No Network)

| Function | Description |
|----------|-------------|
| `isTestMode(apiKey)` | Check if using test key |
| `isLiveMode(apiKey)` | Check if using live key |
| `validateApiKey(apiKey)` | Validate key format and get mode |
| `getTestCard(scenario)` | Get test card number |
| `getTestPaymentMethod(type)` | Get pm_card_* identifier |
| `listTestCardScenarios()` | List all test card scenarios |
| `listTestPaymentMethods()` | List all test payment methods |
| `formatAmount(cents, currency)` | Format cents to currency string |
| `toCents(dollars)` | Convert dollars to cents |
| `getSandboxSetupGuide()` | Get setup instructions |
| `getErrorCodeReference()` | Get error code explanations |

### API Operations (Network Required)

#### Account & Balance
| Function | Description |
|----------|-------------|
| `getAccount()` | Get account info |
| `getBalance()` | Get account balance |

#### Customers
| Function | Description |
|----------|-------------|
| `createCustomer(params)` | Create customer |
| `getCustomer(id)` | Get customer by ID |
| `updateCustomer(id, params)` | Update customer |
| `deleteCustomer(id)` | Delete customer |
| `listCustomers(params?)` | List customers |
| `searchCustomers(query)` | Search customers |

#### Products
| Function | Description |
|----------|-------------|
| `createProduct(params)` | Create product |
| `getProduct(id)` | Get product by ID |
| `updateProduct(id, params)` | Update product |
| `deleteProduct(id)` | Delete product |
| `listProducts(params?)` | List products |
| `searchProducts(query)` | Search products |

#### Prices
| Function | Description |
|----------|-------------|
| `createPrice(params)` | Create price |
| `getPrice(id)` | Get price by ID |
| `updatePrice(id, params)` | Update price |
| `listPrices(params?)` | List prices |
| `searchPrices(query)` | Search prices |

#### Payment Intents
| Function | Description |
|----------|-------------|
| `createPaymentIntent(params)` | Create payment intent |
| `getPaymentIntent(id)` | Get payment intent |
| `updatePaymentIntent(id, params)` | Update payment intent |
| `confirmPaymentIntent(id, params?)` | Confirm payment |
| `capturePaymentIntent(id, params?)` | Capture payment |
| `cancelPaymentIntent(id, params?)` | Cancel payment |
| `listPaymentIntents(params?)` | List payment intents |
| `searchPaymentIntents(query)` | Search payment intents |

#### Subscriptions
| Function | Description |
|----------|-------------|
| `createSubscription(params)` | Create subscription |
| `getSubscription(id)` | Get subscription |
| `updateSubscription(id, params)` | Update subscription |
| `cancelSubscription(id, params?)` | Cancel subscription |
| `resumeSubscription(id, params?)` | Resume subscription |
| `listSubscriptions(params?)` | List subscriptions |
| `searchSubscriptions(query)` | Search subscriptions |

#### Invoices
| Function | Description |
|----------|-------------|
| `createInvoice(params)` | Create invoice |
| `getInvoice(id)` | Get invoice |
| `updateInvoice(id, params)` | Update invoice |
| `finalizeInvoice(id, params?)` | Finalize invoice |
| `payInvoice(id, params?)` | Pay invoice |
| `voidInvoice(id)` | Void invoice |
| `sendInvoice(id)` | Send invoice |
| `listInvoices(params?)` | List invoices |
| `searchInvoices(query)` | Search invoices |
| `createInvoiceItem(params)` | Add invoice item |

#### Coupons
| Function | Description |
|----------|-------------|
| `createCoupon(params)` | Create coupon |
| `getCoupon(id)` | Get coupon |
| `updateCoupon(id, params)` | Update coupon |
| `deleteCoupon(id)` | Delete coupon |
| `listCoupons(params?)` | List coupons |

#### Refunds
| Function | Description |
|----------|-------------|
| `createRefund(params)` | Create refund |
| `getRefund(id)` | Get refund |
| `updateRefund(id, params)` | Update refund |
| `cancelRefund(id)` | Cancel refund |
| `listRefunds(params?)` | List refunds |

#### Disputes
| Function | Description |
|----------|-------------|
| `getDispute(id)` | Get dispute |
| `updateDispute(id, params)` | Update dispute (submit evidence) |
| `closeDispute(id)` | Close dispute |
| `listDisputes(params?)` | List disputes |

#### Payment Links
| Function | Description |
|----------|-------------|
| `createPaymentLink(params)` | Create payment link |
| `getPaymentLink(id)` | Get payment link |
| `updatePaymentLink(id, params)` | Update payment link |
| `listPaymentLinks(params?)` | List payment links |

#### Batch Operations
| Function | Description |
|----------|-------------|
| `createProductWithPrice(product, price)` | Create product + price |
| `createQuickCheckout(params)` | Full checkout setup |

## MCP Tool Coverage

| MCP Tool | Code Exec Function | Status |
|----------|-------------------|--------|
| `get_stripe_account_info` | `getAccount()` | Covered |
| `retrieve_balance` | `getBalance()` | Covered |
| `create_customer` | `createCustomer()` | Covered |
| `list_customers` | `listCustomers()` | Covered |
| `create_product` | `createProduct()` | Covered |
| `list_products` | `listProducts()` | Covered |
| `create_price` | `createPrice()` | Covered |
| `list_prices` | `listPrices()` | Covered |
| `create_coupon` | `createCoupon()` | Covered |
| `list_coupons` | `listCoupons()` | Covered |
| `list_payment_intents` | `listPaymentIntents()` | Covered |
| `create_payment_link` | `createPaymentLink()` | Covered |
| `create_invoice` | `createInvoice()` | Covered |
| `create_invoice_item` | `createInvoiceItem()` | Covered |
| `finalize_invoice` | `finalizeInvoice()` | Covered |
| `list_invoices` | `listInvoices()` | Covered |
| `list_subscriptions` | `listSubscriptions()` | Covered |
| `update_subscription` | `updateSubscription()` | Covered |
| `cancel_subscription` | `cancelSubscription()` | Covered |
| `create_refund` | `createRefund()` | Covered |
| `list_disputes` | `listDisputes()` | Covered |
| `update_dispute` | `updateDispute()` | Covered |

**Additional functions not in MCP**:
- `createPaymentIntent()`, `confirmPaymentIntent()` - Full payment flow
- `searchCustomers()`, `searchProducts()`, etc. - Search capabilities
- `createQuickCheckout()` - All-in-one checkout
- All CRUD operations for entities

## Recommended Patterns

### Always Check Mode First

```typescript
const apiKey = process.env.STRIPE_API_KEY!;
if (!isTestMode(apiKey)) {
  console.warn('WARNING: Using LIVE mode!');
  // Add confirmation prompt in production
}
```

### Use Test Payment Methods in Tests

```typescript
// Don't hardcode card numbers - use tokens
const pm = getTestPaymentMethod('visa');
await confirmPaymentIntent(piId, { payment_method: pm });
```

### Handle Errors Gracefully

```typescript
try {
  const customer = await createCustomer({ email: 'test@example.com' });
} catch (error) {
  if (error.message.includes('rate_limit')) {
    // Wait and retry
  } else if (error.message.includes('invalid_api_key')) {
    // Check API key configuration
  }
}
```

### Use Idempotency Keys for Critical Operations

```typescript
await createPaymentIntent(
  { amount: 2000, currency: 'usd' },
  { apiKey: process.env.STRIPE_API_KEY, idempotencyKey: 'order_12345' }
);
```

## Advantages vs Traditional MCP

| Aspect | MCP | Code Execution |
|--------|-----|----------------|
| Token usage | ~5,000+ per operation | ~200-300 per operation |
| Batch operations | Sequential calls | Parallel with Promise.all |
| Search capability | Limited | Full Stripe search syntax |
| Error handling | Generic | Detailed with codes |
| Test card access | Requires lookup | Built-in catalog |
| Mode detection | Manual | Automatic |

**Token Reduction**: 99%+ for typical workflows

## Troubleshooting

### "Invalid API key format"
- Ensure key starts with `sk_test_` or `sk_live_`
- Check for extra spaces or newlines

### "No such customer"
- The customer ID doesn't exist
- Check if you're using test vs live mode (different data)

### "Card declined"
- In test mode, use test cards from the catalog
- Check the decline code for specific reason

### "Rate limit exceeded"
- Too many requests too quickly
- Implement exponential backoff

### "Authentication required"
- 3D Secure is needed
- Use `pm_card_threeDSecure2Required` for testing

## References

- [Stripe API Documentation](https://docs.stripe.com/api)
- [Stripe Testing Guide](https://docs.stripe.com/testing)
- [Test Card Numbers](https://docs.stripe.com/testing#cards)
- [Stripe MCP Server](https://docs.stripe.com/mcp)
- [Anthropic Code Execution Pattern](https://www.anthropic.com/engineering/code-execution-with-mcp)
