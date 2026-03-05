# Stripe API Reference

Comprehensive API documentation collected from Stripe's official documentation for the Code Execution skill.

## API Overview

- **Base URL**: `https://api.stripe.com/v1`
- **Protocol**: HTTPS only (HTTP requests will fail)
- **Format**: Form-encoded requests, JSON responses
- **Authentication**: HTTP Basic Auth or Bearer token

## Authentication

### API Key Types

| Prefix | Mode | Type | Description |
|--------|------|------|-------------|
| `sk_test_` | Test | Secret | Full test API access |
| `sk_live_` | Live | Secret | Full production access |
| `rk_test_` | Test | Restricted | Limited test permissions |
| `rk_live_` | Live | Restricted | Limited live permissions |
| `pk_test_` | Test | Publishable | Client-side only |
| `pk_live_` | Live | Publishable | Client-side only |

### Authentication Methods

**HTTP Basic Auth**:
```
Authorization: Basic base64(api_key:)
```

**Bearer Token** (recommended for CORS):
```
Authorization: Bearer sk_test_xxx
```

## Core Resources

### Account

Retrieve information about the Stripe account.

```
GET /v1/account
```

**Response Fields**:
- `id` - Account ID (acct_xxx)
- `business_profile.name` - Business name
- `country` - Two-letter country code
- `default_currency` - Default currency
- `capabilities` - Account capabilities

### Balance

Retrieve the current balance.

```
GET /v1/balance
```

**Response Fields**:
- `available` - Array of available balances by currency
- `pending` - Array of pending balances by currency
- `livemode` - Boolean indicating live/test mode

---

## Customers

Customer objects allow you to perform recurring charges and track payments.

### Create Customer

```
POST /v1/customers
```

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `email` | string | Customer email |
| `name` | string | Customer name |
| `phone` | string | Customer phone |
| `description` | string | Description |
| `metadata` | object | Key-value pairs |
| `payment_method` | string | Payment method to attach |
| `invoice_settings.default_payment_method` | string | Default for invoices |

### Retrieve Customer

```
GET /v1/customers/{customer_id}
```

### Update Customer

```
POST /v1/customers/{customer_id}
```

### Delete Customer

```
DELETE /v1/customers/{customer_id}
```

### List Customers

```
GET /v1/customers
```

**Parameters**:
- `limit` - Max results (1-100)
- `starting_after` - Cursor for pagination
- `email` - Filter by email

### Search Customers

```
GET /v1/customers/search
```

**Query Syntax**:
```
email:"customer@example.com"
name:"John Doe"
metadata["key"]:"value"
created>1609459200
```

---

## Products

Products describe the specific goods or services you offer.

### Create Product

```
POST /v1/products
```

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | **Required** - Product name |
| `description` | string | Product description |
| `active` | boolean | Whether product is available |
| `metadata` | object | Key-value pairs |
| `images` | array | Product image URLs |
| `default_price_data` | object | Create price inline |

### Retrieve Product

```
GET /v1/products/{product_id}
```

### Update Product

```
POST /v1/products/{product_id}
```

### Delete Product

```
DELETE /v1/products/{product_id}
```

### List Products

```
GET /v1/products
```

### Search Products

```
GET /v1/products/search
```

---

## Prices

Prices define the unit cost, currency, and billing cycle.

### Create Price

```
POST /v1/prices
```

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `product` | string | **Required** - Product ID |
| `currency` | string | **Required** - Three-letter ISO code |
| `unit_amount` | integer | Amount in cents |
| `recurring.interval` | string | day, week, month, year |
| `recurring.interval_count` | integer | Intervals between charges |
| `metadata` | object | Key-value pairs |
| `nickname` | string | Price nickname |

### Retrieve Price

```
GET /v1/prices/{price_id}
```

### Update Price

```
POST /v1/prices/{price_id}
```

Only `active`, `metadata`, and `nickname` can be updated.

### List Prices

```
GET /v1/prices
```

**Parameters**:
- `product` - Filter by product
- `active` - Filter by active status

---

## Payment Intents

PaymentIntents guide you through the process of collecting a payment.

### Create Payment Intent

```
POST /v1/payment_intents
```

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `amount` | integer | **Required** - Amount in cents |
| `currency` | string | **Required** - Three-letter ISO code |
| `customer` | string | Customer ID |
| `payment_method` | string | Payment method ID |
| `payment_method_types` | array | Allowed payment methods |
| `confirm` | boolean | Confirm immediately |
| `automatic_payment_methods.enabled` | boolean | Enable automatic methods |
| `description` | string | Description |
| `metadata` | object | Key-value pairs |
| `receipt_email` | string | Email for receipt |
| `statement_descriptor` | string | Statement descriptor |

### Retrieve Payment Intent

```
GET /v1/payment_intents/{payment_intent_id}
```

### Update Payment Intent

```
POST /v1/payment_intents/{payment_intent_id}
```

### Confirm Payment Intent

```
POST /v1/payment_intents/{payment_intent_id}/confirm
```

**Parameters**:
- `payment_method` - Payment method to use
- `return_url` - URL for redirect-based methods

### Capture Payment Intent

```
POST /v1/payment_intents/{payment_intent_id}/capture
```

For manual capture flows. Parameters:
- `amount_to_capture` - Amount in cents (must be <= authorized)

### Cancel Payment Intent

```
POST /v1/payment_intents/{payment_intent_id}/cancel
```

**Parameters**:
- `cancellation_reason` - requested_by_customer, duplicate, fraudulent, etc.

### List Payment Intents

```
GET /v1/payment_intents
```

### Search Payment Intents

```
GET /v1/payment_intents/search
```

**Query Examples**:
```
status:"succeeded"
customer:"cus_xxx"
metadata["order_id"]:"12345"
amount>1000
```

### Payment Intent Statuses

| Status | Description |
|--------|-------------|
| `requires_payment_method` | Awaiting payment method |
| `requires_confirmation` | Needs confirmation |
| `requires_action` | Needs customer action (3DS) |
| `processing` | Payment is processing |
| `requires_capture` | Awaiting capture |
| `canceled` | Payment was canceled |
| `succeeded` | Payment succeeded |

---

## Subscriptions

Subscriptions allow you to charge a customer on a recurring basis.

### Create Subscription

```
POST /v1/subscriptions
```

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `customer` | string | **Required** - Customer ID |
| `items` | array | **Required** - Subscription items |
| `items[].price` | string | Price ID |
| `items[].quantity` | integer | Quantity |
| `payment_behavior` | string | How to handle payment |
| `trial_period_days` | integer | Trial length |
| `default_payment_method` | string | Payment method |
| `metadata` | object | Key-value pairs |

### Retrieve Subscription

```
GET /v1/subscriptions/{subscription_id}
```

### Update Subscription

```
POST /v1/subscriptions/{subscription_id}
```

**Parameters**:
- `items` - Update subscription items
- `cancel_at_period_end` - Cancel at end of period
- `proration_behavior` - create_prorations, none, always_invoice

### Cancel Subscription

```
DELETE /v1/subscriptions/{subscription_id}
```

**Parameters**:
- `prorate` - Prorate final invoice
- `invoice_now` - Generate final invoice immediately

### Resume Subscription

```
POST /v1/subscriptions/{subscription_id}/resume
```

### List Subscriptions

```
GET /v1/subscriptions
```

### Search Subscriptions

```
GET /v1/subscriptions/search
```

### Subscription Statuses

| Status | Description |
|--------|-------------|
| `incomplete` | Initial payment failed |
| `incomplete_expired` | First invoice not paid |
| `trialing` | In trial period |
| `active` | Active subscription |
| `past_due` | Payment failed |
| `canceled` | Subscription canceled |
| `unpaid` | All retry attempts failed |
| `paused` | Subscription paused |

---

## Invoices

Invoices are statements of amounts owed by a customer.

### Create Invoice

```
POST /v1/invoices
```

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `customer` | string | **Required** - Customer ID |
| `auto_advance` | boolean | Auto-finalize |
| `collection_method` | string | charge_automatically or send_invoice |
| `description` | string | Invoice description |
| `days_until_due` | integer | Days until due (for send_invoice) |
| `metadata` | object | Key-value pairs |

### Create Invoice Item

```
POST /v1/invoiceitems
```

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `customer` | string | **Required** - Customer ID |
| `invoice` | string | Invoice to add to |
| `price` | string | Price ID |
| `amount` | integer | Amount in cents |
| `currency` | string | Currency |
| `description` | string | Description |
| `quantity` | integer | Quantity |

### Finalize Invoice

```
POST /v1/invoices/{invoice_id}/finalize
```

### Pay Invoice

```
POST /v1/invoices/{invoice_id}/pay
```

### Send Invoice

```
POST /v1/invoices/{invoice_id}/send
```

### Void Invoice

```
POST /v1/invoices/{invoice_id}/void
```

### List Invoices

```
GET /v1/invoices
```

### Invoice Statuses

| Status | Description |
|--------|-------------|
| `draft` | Invoice is a draft |
| `open` | Invoice is finalized |
| `paid` | Invoice is paid |
| `void` | Invoice is voided |
| `uncollectible` | Invoice is uncollectible |

---

## Coupons

Coupons contain information about a percent-off or amount-off discount.

### Create Coupon

```
POST /v1/coupons
```

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `duration` | string | **Required** - forever, once, repeating |
| `amount_off` | integer | Amount off in cents |
| `percent_off` | decimal | Percentage off (0-100) |
| `currency` | string | Currency for amount_off |
| `duration_in_months` | integer | Months for repeating |
| `max_redemptions` | integer | Max times to redeem |
| `name` | string | Coupon name |
| `id` | string | Custom coupon ID |
| `metadata` | object | Key-value pairs |

### Retrieve Coupon

```
GET /v1/coupons/{coupon_id}
```

### Update Coupon

```
POST /v1/coupons/{coupon_id}
```

### Delete Coupon

```
DELETE /v1/coupons/{coupon_id}
```

### List Coupons

```
GET /v1/coupons
```

---

## Refunds

Refund objects allow you to refund a charge.

### Create Refund

```
POST /v1/refunds
```

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `payment_intent` | string | Payment intent to refund |
| `charge` | string | Charge to refund |
| `amount` | integer | Amount in cents (partial refund) |
| `reason` | string | duplicate, fraudulent, requested_by_customer |
| `metadata` | object | Key-value pairs |

### Retrieve Refund

```
GET /v1/refunds/{refund_id}
```

### Update Refund

```
POST /v1/refunds/{refund_id}
```

### Cancel Refund

```
POST /v1/refunds/{refund_id}/cancel
```

### List Refunds

```
GET /v1/refunds
```

### Refund Statuses

| Status | Description |
|--------|-------------|
| `pending` | Refund is pending |
| `succeeded` | Refund succeeded |
| `failed` | Refund failed |
| `canceled` | Refund was canceled |

---

## Disputes

A dispute occurs when a customer questions your charge.

### Retrieve Dispute

```
GET /v1/disputes/{dispute_id}
```

### Update Dispute

```
POST /v1/disputes/{dispute_id}
```

**Parameters**:
- `evidence` - Evidence to submit
- `submit` - Submit evidence immediately
- `metadata` - Key-value pairs

### Close Dispute

```
POST /v1/disputes/{dispute_id}/close
```

Accept the dispute and stop fighting it.

### List Disputes

```
GET /v1/disputes
```

### Dispute Statuses

| Status | Description |
|--------|-------------|
| `warning_needs_response` | Warning that needs response |
| `warning_under_review` | Warning under review |
| `warning_closed` | Warning closed |
| `needs_response` | Needs your response |
| `under_review` | Being reviewed by issuer |
| `won` | You won the dispute |
| `lost` | You lost the dispute |

---

## Payment Links

Payment Links allow you to sell without a website.

### Create Payment Link

```
POST /v1/payment_links
```

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `line_items` | array | **Required** - Items to sell |
| `line_items[].price` | string | Price ID |
| `line_items[].quantity` | integer | Quantity |
| `after_completion.type` | string | redirect or hosted_confirmation |
| `after_completion.redirect.url` | string | Redirect URL |
| `metadata` | object | Key-value pairs |

### Retrieve Payment Link

```
GET /v1/payment_links/{payment_link_id}
```

### Update Payment Link

```
POST /v1/payment_links/{payment_link_id}
```

### List Payment Links

```
GET /v1/payment_links
```

---

## Pagination

All list endpoints support pagination:

**Parameters**:
- `limit` - Number of objects (1-100, default 10)
- `starting_after` - Cursor for next page
- `ending_before` - Cursor for previous page

**Response**:
```json
{
  "object": "list",
  "data": [...],
  "has_more": true,
  "url": "/v1/customers"
}
```

---

## Search Syntax

Stripe search supports a query language:

**Operators**:
- `field:"value"` - Exact match
- `field~"value"` - Contains
- `field>value` - Greater than
- `field<value` - Less than
- `field>=value` - Greater than or equal
- `field<=value` - Less than or equal
- `-field:"value"` - Negation

**Combining**:
- `AND` - Both conditions
- `OR` - Either condition

**Examples**:
```
email:"customer@example.com"
created>1609459200 AND status:"active"
metadata["plan"]:"premium"
-status:"canceled"
```

---

## Error Handling

### Error Response Format

```json
{
  "error": {
    "type": "card_error",
    "code": "card_declined",
    "message": "Your card was declined.",
    "param": "payment_method",
    "decline_code": "insufficient_funds"
  }
}
```

### Error Types

| Type | Description |
|------|-------------|
| `api_error` | API-related errors |
| `card_error` | Card-related errors |
| `idempotency_error` | Idempotency key errors |
| `invalid_request_error` | Invalid parameters |
| `rate_limit_error` | Too many requests |
| `authentication_error` | Authentication failed |

### Common Error Codes

| Code | Description |
|------|-------------|
| `card_declined` | Card was declined |
| `expired_card` | Card has expired |
| `incorrect_cvc` | CVC is incorrect |
| `incorrect_number` | Card number is incorrect |
| `insufficient_funds` | Not enough funds |
| `rate_limit` | Too many requests |
| `resource_missing` | Resource not found |

---

## Webhooks (Reference Only)

Webhooks are out of scope for Code Execution but documented for reference.

Stripe can send events to your server:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

---

## References

- [Stripe API Documentation](https://docs.stripe.com/api)
- [Stripe Testing](https://docs.stripe.com/testing)
- [Stripe MCP Server](https://docs.stripe.com/mcp)
- [API Changelog](https://docs.stripe.com/upgrades)
