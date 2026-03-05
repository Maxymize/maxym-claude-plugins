/**
 * Stripe Code Execution Client
 *
 * Direct connection to Stripe API for payment processing, customer management,
 * subscriptions, invoices, and more. Supports both Test Mode (sandbox) and Live Mode.
 * Reduces token usage by 99%+ following Anthropic's Code Execution pattern.
 *
 * @see https://www.anthropic.com/engineering/code-execution-with-mcp
 * @see https://docs.stripe.com/api
 */

// ============================================================================
// Configuration
// ============================================================================

const STRIPE_API_BASE = 'https://api.stripe.com/v1';
const STRIPE_API_VERSION = '2024-12-18.acacia';

// ============================================================================
// Types
// ============================================================================

export interface StripeConfig {
  apiKey: string;
  idempotencyKey?: string;
}

export interface StripeError {
  type: string;
  code?: string;
  message: string;
  param?: string;
  decline_code?: string;
}

export interface StripeListResponse<T> {
  object: 'list';
  data: T[];
  has_more: boolean;
  url: string;
}

export interface StripeSearchResponse<T> {
  object: 'search_result';
  data: T[];
  has_more: boolean;
  next_page?: string;
}

// Customer Types
export interface Customer {
  id: string;
  object: 'customer';
  email?: string;
  name?: string;
  phone?: string;
  description?: string;
  metadata?: Record<string, string>;
  created: number;
  livemode: boolean;
  default_source?: string;
  invoice_settings?: {
    default_payment_method?: string;
  };
}

export interface CreateCustomerParams {
  email?: string;
  name?: string;
  phone?: string;
  description?: string;
  metadata?: Record<string, string>;
  payment_method?: string;
  invoice_settings?: {
    default_payment_method?: string;
  };
}

// Product Types
export interface Product {
  id: string;
  object: 'product';
  name: string;
  description?: string;
  active: boolean;
  metadata?: Record<string, string>;
  created: number;
  livemode: boolean;
  default_price?: string;
  images?: string[];
}

export interface CreateProductParams {
  name: string;
  description?: string;
  active?: boolean;
  metadata?: Record<string, string>;
  default_price_data?: {
    currency: string;
    unit_amount: number;
    recurring?: {
      interval: 'day' | 'week' | 'month' | 'year';
      interval_count?: number;
    };
  };
  images?: string[];
}

// Price Types
export interface Price {
  id: string;
  object: 'price';
  product: string;
  currency: string;
  unit_amount?: number;
  active: boolean;
  type: 'one_time' | 'recurring';
  recurring?: {
    interval: 'day' | 'week' | 'month' | 'year';
    interval_count: number;
  };
  metadata?: Record<string, string>;
  created: number;
  livemode: boolean;
}

export interface CreatePriceParams {
  product: string;
  currency: string;
  unit_amount?: number;
  recurring?: {
    interval: 'day' | 'week' | 'month' | 'year';
    interval_count?: number;
  };
  metadata?: Record<string, string>;
  nickname?: string;
}

// Payment Intent Types
export interface PaymentIntent {
  id: string;
  object: 'payment_intent';
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded';
  client_secret: string;
  customer?: string;
  payment_method?: string;
  description?: string;
  metadata?: Record<string, string>;
  created: number;
  livemode: boolean;
}

export interface CreatePaymentIntentParams {
  amount: number;
  currency: string;
  customer?: string;
  payment_method?: string;
  payment_method_types?: string[];
  description?: string;
  metadata?: Record<string, string>;
  receipt_email?: string;
  confirm?: boolean;
  automatic_payment_methods?: {
    enabled: boolean;
  };
}

// Subscription Types
export interface Subscription {
  id: string;
  object: 'subscription';
  customer: string;
  status: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused';
  items: {
    object: 'list';
    data: SubscriptionItem[];
  };
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  metadata?: Record<string, string>;
  created: number;
  livemode: boolean;
}

export interface SubscriptionItem {
  id: string;
  object: 'subscription_item';
  price: Price;
  quantity: number;
}

export interface CreateSubscriptionParams {
  customer: string;
  items: Array<{
    price: string;
    quantity?: number;
  }>;
  payment_behavior?: 'default_incomplete' | 'error_if_incomplete' | 'allow_incomplete' | 'pending_if_incomplete';
  trial_period_days?: number;
  metadata?: Record<string, string>;
  default_payment_method?: string;
}

export interface UpdateSubscriptionParams {
  items?: Array<{
    id?: string;
    price?: string;
    quantity?: number;
    deleted?: boolean;
  }>;
  cancel_at_period_end?: boolean;
  proration_behavior?: 'create_prorations' | 'none' | 'always_invoice';
  metadata?: Record<string, string>;
  default_payment_method?: string;
}

// Invoice Types
export interface Invoice {
  id: string;
  object: 'invoice';
  customer: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  total: number;
  currency: string;
  lines: {
    object: 'list';
    data: InvoiceLineItem[];
  };
  hosted_invoice_url?: string;
  invoice_pdf?: string;
  metadata?: Record<string, string>;
  created: number;
  livemode: boolean;
}

export interface InvoiceLineItem {
  id: string;
  object: 'line_item';
  amount: number;
  currency: string;
  description?: string;
  price?: Price;
  quantity: number;
}

export interface CreateInvoiceParams {
  customer: string;
  auto_advance?: boolean;
  collection_method?: 'charge_automatically' | 'send_invoice';
  description?: string;
  metadata?: Record<string, string>;
  days_until_due?: number;
}

export interface CreateInvoiceItemParams {
  customer: string;
  invoice?: string;
  price?: string;
  amount?: number;
  currency?: string;
  description?: string;
  quantity?: number;
  metadata?: Record<string, string>;
}

// Coupon Types
export interface Coupon {
  id: string;
  object: 'coupon';
  amount_off?: number;
  percent_off?: number;
  currency?: string;
  duration: 'forever' | 'once' | 'repeating';
  duration_in_months?: number;
  max_redemptions?: number;
  times_redeemed: number;
  valid: boolean;
  metadata?: Record<string, string>;
  created: number;
  livemode: boolean;
}

export interface CreateCouponParams {
  id?: string;
  amount_off?: number;
  percent_off?: number;
  currency?: string;
  duration: 'forever' | 'once' | 'repeating';
  duration_in_months?: number;
  max_redemptions?: number;
  metadata?: Record<string, string>;
  name?: string;
}

// Refund Types
export interface Refund {
  id: string;
  object: 'refund';
  amount: number;
  currency: string;
  payment_intent?: string;
  charge?: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  reason?: string;
  metadata?: Record<string, string>;
  created: number;
}

export interface CreateRefundParams {
  payment_intent?: string;
  charge?: string;
  amount?: number;
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  metadata?: Record<string, string>;
}

// Dispute Types
export interface Dispute {
  id: string;
  object: 'dispute';
  amount: number;
  currency: string;
  charge: string;
  payment_intent?: string;
  reason: string;
  status: 'warning_needs_response' | 'warning_under_review' | 'warning_closed' | 'needs_response' | 'under_review' | 'won' | 'lost';
  metadata?: Record<string, string>;
  created: number;
  livemode: boolean;
}

export interface UpdateDisputeParams {
  evidence?: {
    customer_name?: string;
    customer_email_address?: string;
    product_description?: string;
    uncategorized_text?: string;
    [key: string]: string | undefined;
  };
  metadata?: Record<string, string>;
  submit?: boolean;
}

// Payment Link Types
export interface PaymentLink {
  id: string;
  object: 'payment_link';
  active: boolean;
  url: string;
  line_items: {
    object: 'list';
    data: Array<{
      id: string;
      price: Price;
      quantity: number;
    }>;
  };
  metadata?: Record<string, string>;
  livemode: boolean;
}

export interface CreatePaymentLinkParams {
  line_items: Array<{
    price: string;
    quantity: number;
  }>;
  after_completion?: {
    type: 'redirect' | 'hosted_confirmation';
    redirect?: {
      url: string;
    };
  };
  metadata?: Record<string, string>;
}

// Balance Types
export interface Balance {
  object: 'balance';
  available: Array<{
    amount: number;
    currency: string;
    source_types?: Record<string, number>;
  }>;
  pending: Array<{
    amount: number;
    currency: string;
    source_types?: Record<string, number>;
  }>;
  livemode: boolean;
}

// Account Types
export interface Account {
  id: string;
  object: 'account';
  business_profile?: {
    name?: string;
    url?: string;
  };
  email?: string;
  country?: string;
  default_currency?: string;
  capabilities?: Record<string, string>;
  created: number;
  livemode: boolean;
}

// ============================================================================
// Test Cards & Payment Methods Catalog (Local - No Network)
// ============================================================================

/**
 * Test card numbers for various scenarios
 * Use these ONLY with test API keys (sk_test_*)
 */
export const TEST_CARDS = {
  // Successful payments by brand
  visa: '4242424242424242',
  visa_debit: '4000056655665556',
  mastercard: '5555555555554444',
  mastercard_debit: '5200828282828210',
  mastercard_prepaid: '5105105105105100',
  amex: '378282246310005',
  amex_2: '371449635398431',
  discover: '6011111111111117',
  discover_2: '6011000990139424',
  diners: '3056930009020004',
  jcb: '3566002020360505',
  unionpay: '6200000000000005',

  // Successful payments by country
  us: '4242424242424242',
  ar: '4000000320000021', // Argentina
  br: '4000000760000002', // Brazil
  ca: '4000001240000000', // Canada
  mx: '4000004840008001', // Mexico
  gb: '4000008260000000', // UK
  de: '4000002760000016', // Germany
  fr: '4000002500000003', // France
  it: '4000003800000008', // Italy
  es: '4000007240000007', // Spain
  au: '4000000360000006', // Australia
  jp: '4000003920000003', // Japan

  // Decline scenarios
  decline_generic: '4000000000000002',
  decline_insufficient_funds: '4000000000009995',
  decline_lost_card: '4000000000009987',
  decline_stolen_card: '4000000000009979',
  decline_expired_card: '4000000000000069',
  decline_incorrect_cvc: '4000000000000127',
  decline_processing_error: '4000000000000119',
  decline_incorrect_number: '4242424242424241',

  // 3D Secure scenarios
  '3ds_required': '4000000000003220',
  '3ds_required_2': '4000000000003063',
  '3ds_optional': '4000000000003055',
  '3ds_not_supported': '378282246310005',
  '3ds_authentication_failed': '4000008400001629',

  // Special scenarios
  dispute_inquiry: '4000000000005423',
  dispute_fraudulent: '4000000000000259',
  dispute_not_received: '4000000000002685',
  dispute_inquiry_closed: '4000000000001976',
  refund_fail: '4000000000005126',

  // Address verification
  avs_zip_fail: '4000000000000036',
  avs_line1_fail: '4000000000000028',
  avs_address_fail: '4000000000000010',

  // CVC verification
  cvc_check_fail: '4000000000000101',
} as const;

/**
 * Test payment method tokens for programmatic testing
 * These can be used directly without entering card details
 */
export const TEST_PAYMENT_METHODS = {
  // Cards
  visa: 'pm_card_visa',
  visa_debit: 'pm_card_visa_debit',
  mastercard: 'pm_card_mastercard',
  mastercard_debit: 'pm_card_mastercard_debit',
  mastercard_prepaid: 'pm_card_mastercard_prepaid',
  amex: 'pm_card_amex',
  discover: 'pm_card_discover',
  diners: 'pm_card_diners',
  jcb: 'pm_card_jcb',
  unionpay: 'pm_card_unionpay',

  // Declines
  charge_declined: 'pm_card_chargeDeclined',
  charge_declined_insufficient_funds: 'pm_card_chargeDeclinedInsufficientFunds',
  charge_declined_fraudulent: 'pm_card_chargeDeclinedFraudulent',
  charge_declined_lost_card: 'pm_card_chargeDeclinedLostCard',
  charge_declined_stolen_card: 'pm_card_chargeDeclinedStolenCard',
  charge_declined_expired_card: 'pm_card_chargeDeclinedExpiredCard',
  charge_declined_incorrect_cvc: 'pm_card_chargeDeclinedIncorrectCvc',
  charge_declined_processing_error: 'pm_card_chargeDeclinedProcessingError',

  // 3D Secure
  '3ds_authenticate': 'pm_card_threeDSecure2Required',
  '3ds_optional': 'pm_card_threeDSecureOptional',

  // International
  us: 'pm_card_us',
  br: 'pm_card_br',
  ca: 'pm_card_ca',
  gb: 'pm_card_gb',
  de: 'pm_card_de',
  fr: 'pm_card_fr',
  au: 'pm_card_au',
  jp: 'pm_card_jp',
} as const;

/**
 * Test bank accounts for ACH
 */
export const TEST_BANK_ACCOUNTS = {
  success: '000123456789',
  success_routing: '110000000',
  fail_account_closed: '000111111116',
  fail_no_account: '000111111113',
  fail_insufficient_funds: '000111111112',
} as const;

export type TestCardScenario = keyof typeof TEST_CARDS;
export type TestPaymentMethodType = keyof typeof TEST_PAYMENT_METHODS;

// ============================================================================
// Local Utility Functions (No Network)
// ============================================================================

/**
 * Check if an API key is a test key
 */
export function isTestMode(apiKey: string): boolean {
  return apiKey.startsWith('sk_test_') || apiKey.startsWith('rk_test_');
}

/**
 * Check if an API key is a live key
 */
export function isLiveMode(apiKey: string): boolean {
  return apiKey.startsWith('sk_live_') || apiKey.startsWith('rk_live_');
}

/**
 * Validate API key format
 */
export function validateApiKey(apiKey: string): { valid: boolean; mode: 'test' | 'live' | 'unknown'; type: 'secret' | 'restricted' | 'unknown' } {
  if (apiKey.startsWith('sk_test_')) {
    return { valid: true, mode: 'test', type: 'secret' };
  }
  if (apiKey.startsWith('sk_live_')) {
    return { valid: true, mode: 'live', type: 'secret' };
  }
  if (apiKey.startsWith('rk_test_')) {
    return { valid: true, mode: 'test', type: 'restricted' };
  }
  if (apiKey.startsWith('rk_live_')) {
    return { valid: true, mode: 'live', type: 'restricted' };
  }
  return { valid: false, mode: 'unknown', type: 'unknown' };
}

/**
 * Get a test card number for a specific scenario
 */
export function getTestCard(scenario: TestCardScenario): string {
  return TEST_CARDS[scenario];
}

/**
 * Get a test payment method identifier
 */
export function getTestPaymentMethod(type: TestPaymentMethodType): string {
  return TEST_PAYMENT_METHODS[type];
}

/**
 * Get all available test card scenarios
 */
export function listTestCardScenarios(): string[] {
  return Object.keys(TEST_CARDS);
}

/**
 * Get all available test payment method types
 */
export function listTestPaymentMethods(): string[] {
  return Object.keys(TEST_PAYMENT_METHODS);
}

/**
 * Format an amount for display (cents to dollars)
 */
export function formatAmount(amountInCents: number, currency: string = 'usd'): string {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}

/**
 * Convert dollars to cents
 */
export function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Get sandbox setup guide
 */
export function getSandboxSetupGuide(): string {
  return `
================================================================================
                        STRIPE SANDBOX TESTING GUIDE
================================================================================

1. GET TEST API KEYS
   - Go to: https://dashboard.stripe.com/test/apikeys
   - Copy your "Secret key" (starts with sk_test_)
   - NEVER use live keys (sk_live_) for testing!

2. SET ENVIRONMENT VARIABLE
   export STRIPE_API_KEY=sk_test_your_key_here

3. TEST CARD NUMBERS (use any future expiry, any CVC)

   SUCCESS SCENARIOS:
   - Visa:       4242 4242 4242 4242
   - Mastercard: 5555 5555 5555 4444
   - Amex:       3782 822463 10005
   - Discover:   6011 1111 1111 1117

   DECLINE SCENARIOS:
   - Generic decline:      4000 0000 0000 0002
   - Insufficient funds:   4000 0000 0000 9995
   - Lost card:            4000 0000 0000 9987
   - Expired card:         4000 0000 0000 0069

   3D SECURE:
   - 3DS Required:         4000 0000 0000 3220
   - 3DS Optional:         4000 0000 0000 3055

4. TEST PAYMENT METHOD TOKENS (for API testing)
   - pm_card_visa
   - pm_card_mastercard
   - pm_card_amex
   - pm_card_chargeDeclined

5. TYPICAL TEST FLOW
   a. Create a customer
   b. Create a product and price
   c. Create a payment intent with test card
   d. Confirm payment
   e. Check payment status

6. SWITCH TO PRODUCTION
   - Replace sk_test_ with sk_live_ key
   - Test thoroughly before going live
   - Never expose live keys in code

================================================================================
`;
}

/**
 * Get quick reference for common Stripe error codes
 */
export function getErrorCodeReference(): Record<string, string> {
  return {
    'card_declined': 'The card was declined. Try a different card.',
    'incorrect_cvc': 'The card CVC is incorrect.',
    'expired_card': 'The card has expired.',
    'processing_error': 'An error occurred while processing the card.',
    'incorrect_number': 'The card number is incorrect.',
    'invalid_expiry_month': 'The expiration month is invalid.',
    'invalid_expiry_year': 'The expiration year is invalid.',
    'invalid_cvc': 'The CVC number is invalid.',
    'authentication_required': '3D Secure authentication is required.',
    'rate_limit': 'Too many requests. Please wait and try again.',
    'invalid_api_key': 'The API key is invalid.',
    'api_key_expired': 'The API key has expired.',
    'testmode_charges_only': 'This account can only create test charges.',
    'resource_missing': 'The requested resource does not exist.',
  };
}

// ============================================================================
// Core API Request Function
// ============================================================================

/**
 * Make a request to the Stripe API
 */
async function stripeRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'DELETE',
  params?: Record<string, any>,
  config?: StripeConfig
): Promise<T> {
  const apiKey = config?.apiKey || process.env.STRIPE_API_KEY;

  if (!apiKey) {
    throw new Error('Stripe API key is required. Set STRIPE_API_KEY environment variable or pass config.apiKey');
  }

  const keyValidation = validateApiKey(apiKey);
  if (!keyValidation.valid) {
    throw new Error('Invalid Stripe API key format. Must start with sk_test_, sk_live_, rk_test_, or rk_live_');
  }

  const url = new URL(`${STRIPE_API_BASE}${endpoint}`);

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Stripe-Version': STRIPE_API_VERSION,
  };

  if (config?.idempotencyKey) {
    headers['Idempotency-Key'] = config.idempotencyKey;
  }

  let body: string | undefined;

  if (method === 'GET' && params) {
    // Add params as query string for GET requests
    Object.entries(flattenParams(params)).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  } else if ((method === 'POST' || method === 'DELETE') && params) {
    // Use form-encoded body for POST/DELETE
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    body = new URLSearchParams(flattenParams(params)).toString();
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body,
  });

  const data = await response.json();

  if (!response.ok) {
    const error = data.error as StripeError;
    throw new Error(`Stripe API Error [${error.type}]: ${error.message}${error.code ? ` (${error.code})` : ''}`);
  }

  return data as T;
}

/**
 * Flatten nested objects for form-encoding
 */
function flattenParams(params: Record<string, any>, prefix: string = ''): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(params)) {
    const fullKey = prefix ? `${prefix}[${key}]` : key;

    if (value === undefined || value === null) {
      continue;
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          Object.assign(result, flattenParams(item, `${fullKey}[${index}]`));
        } else {
          result[`${fullKey}[${index}]`] = String(item);
        }
      });
    } else if (typeof value === 'object') {
      Object.assign(result, flattenParams(value, fullKey));
    } else {
      result[fullKey] = String(value);
    }
  }

  return result;
}

// ============================================================================
// Account & Balance Operations
// ============================================================================

/**
 * Get account information
 */
export async function getAccount(config?: StripeConfig): Promise<Account> {
  return stripeRequest<Account>('/account', 'GET', undefined, config);
}

/**
 * Get account balance
 */
export async function getBalance(config?: StripeConfig): Promise<Balance> {
  return stripeRequest<Balance>('/balance', 'GET', undefined, config);
}

// ============================================================================
// Customer Operations
// ============================================================================

/**
 * Create a new customer
 */
export async function createCustomer(params: CreateCustomerParams, config?: StripeConfig): Promise<Customer> {
  return stripeRequest<Customer>('/customers', 'POST', params, config);
}

/**
 * Retrieve a customer by ID
 */
export async function getCustomer(customerId: string, config?: StripeConfig): Promise<Customer> {
  return stripeRequest<Customer>(`/customers/${customerId}`, 'GET', undefined, config);
}

/**
 * Update a customer
 */
export async function updateCustomer(customerId: string, params: Partial<CreateCustomerParams>, config?: StripeConfig): Promise<Customer> {
  return stripeRequest<Customer>(`/customers/${customerId}`, 'POST', params, config);
}

/**
 * Delete a customer
 */
export async function deleteCustomer(customerId: string, config?: StripeConfig): Promise<{ id: string; object: 'customer'; deleted: boolean }> {
  return stripeRequest(`/customers/${customerId}`, 'DELETE', undefined, config);
}

/**
 * List customers with optional filters
 */
export async function listCustomers(params?: { limit?: number; starting_after?: string; email?: string }, config?: StripeConfig): Promise<StripeListResponse<Customer>> {
  return stripeRequest<StripeListResponse<Customer>>('/customers', 'GET', params, config);
}

/**
 * Search customers using Stripe's search syntax
 */
export async function searchCustomers(query: string, params?: { limit?: number }, config?: StripeConfig): Promise<StripeSearchResponse<Customer>> {
  return stripeRequest<StripeSearchResponse<Customer>>('/customers/search', 'GET', { query, ...params }, config);
}

// ============================================================================
// Product Operations
// ============================================================================

/**
 * Create a new product
 */
export async function createProduct(params: CreateProductParams, config?: StripeConfig): Promise<Product> {
  return stripeRequest<Product>('/products', 'POST', params, config);
}

/**
 * Retrieve a product by ID
 */
export async function getProduct(productId: string, config?: StripeConfig): Promise<Product> {
  return stripeRequest<Product>(`/products/${productId}`, 'GET', undefined, config);
}

/**
 * Update a product
 */
export async function updateProduct(productId: string, params: Partial<CreateProductParams>, config?: StripeConfig): Promise<Product> {
  return stripeRequest<Product>(`/products/${productId}`, 'POST', params, config);
}

/**
 * Delete a product
 */
export async function deleteProduct(productId: string, config?: StripeConfig): Promise<{ id: string; object: 'product'; deleted: boolean }> {
  return stripeRequest(`/products/${productId}`, 'DELETE', undefined, config);
}

/**
 * List products with optional filters
 */
export async function listProducts(params?: { limit?: number; starting_after?: string; active?: boolean }, config?: StripeConfig): Promise<StripeListResponse<Product>> {
  return stripeRequest<StripeListResponse<Product>>('/products', 'GET', params, config);
}

/**
 * Search products using Stripe's search syntax
 */
export async function searchProducts(query: string, params?: { limit?: number }, config?: StripeConfig): Promise<StripeSearchResponse<Product>> {
  return stripeRequest<StripeSearchResponse<Product>>('/products/search', 'GET', { query, ...params }, config);
}

// ============================================================================
// Price Operations
// ============================================================================

/**
 * Create a new price
 */
export async function createPrice(params: CreatePriceParams, config?: StripeConfig): Promise<Price> {
  return stripeRequest<Price>('/prices', 'POST', params, config);
}

/**
 * Retrieve a price by ID
 */
export async function getPrice(priceId: string, config?: StripeConfig): Promise<Price> {
  return stripeRequest<Price>(`/prices/${priceId}`, 'GET', undefined, config);
}

/**
 * Update a price
 */
export async function updatePrice(priceId: string, params: { active?: boolean; metadata?: Record<string, string>; nickname?: string }, config?: StripeConfig): Promise<Price> {
  return stripeRequest<Price>(`/prices/${priceId}`, 'POST', params, config);
}

/**
 * List prices with optional filters
 */
export async function listPrices(params?: { limit?: number; starting_after?: string; product?: string; active?: boolean }, config?: StripeConfig): Promise<StripeListResponse<Price>> {
  return stripeRequest<StripeListResponse<Price>>('/prices', 'GET', params, config);
}

/**
 * Search prices using Stripe's search syntax
 */
export async function searchPrices(query: string, params?: { limit?: number }, config?: StripeConfig): Promise<StripeSearchResponse<Price>> {
  return stripeRequest<StripeSearchResponse<Price>>('/prices/search', 'GET', { query, ...params }, config);
}

// ============================================================================
// Payment Intent Operations
// ============================================================================

/**
 * Create a new payment intent
 */
export async function createPaymentIntent(params: CreatePaymentIntentParams, config?: StripeConfig): Promise<PaymentIntent> {
  return stripeRequest<PaymentIntent>('/payment_intents', 'POST', params, config);
}

/**
 * Retrieve a payment intent by ID
 */
export async function getPaymentIntent(paymentIntentId: string, config?: StripeConfig): Promise<PaymentIntent> {
  return stripeRequest<PaymentIntent>(`/payment_intents/${paymentIntentId}`, 'GET', undefined, config);
}

/**
 * Update a payment intent
 */
export async function updatePaymentIntent(paymentIntentId: string, params: Partial<CreatePaymentIntentParams>, config?: StripeConfig): Promise<PaymentIntent> {
  return stripeRequest<PaymentIntent>(`/payment_intents/${paymentIntentId}`, 'POST', params, config);
}

/**
 * Confirm a payment intent
 */
export async function confirmPaymentIntent(paymentIntentId: string, params?: { payment_method?: string; return_url?: string }, config?: StripeConfig): Promise<PaymentIntent> {
  return stripeRequest<PaymentIntent>(`/payment_intents/${paymentIntentId}/confirm`, 'POST', params, config);
}

/**
 * Capture a payment intent (for manual capture)
 */
export async function capturePaymentIntent(paymentIntentId: string, params?: { amount_to_capture?: number }, config?: StripeConfig): Promise<PaymentIntent> {
  return stripeRequest<PaymentIntent>(`/payment_intents/${paymentIntentId}/capture`, 'POST', params, config);
}

/**
 * Cancel a payment intent
 */
export async function cancelPaymentIntent(paymentIntentId: string, params?: { cancellation_reason?: string }, config?: StripeConfig): Promise<PaymentIntent> {
  return stripeRequest<PaymentIntent>(`/payment_intents/${paymentIntentId}/cancel`, 'POST', params, config);
}

/**
 * List payment intents with optional filters
 */
export async function listPaymentIntents(params?: { limit?: number; starting_after?: string; customer?: string }, config?: StripeConfig): Promise<StripeListResponse<PaymentIntent>> {
  return stripeRequest<StripeListResponse<PaymentIntent>>('/payment_intents', 'GET', params, config);
}

/**
 * Search payment intents using Stripe's search syntax
 */
export async function searchPaymentIntents(query: string, params?: { limit?: number }, config?: StripeConfig): Promise<StripeSearchResponse<PaymentIntent>> {
  return stripeRequest<StripeSearchResponse<PaymentIntent>>('/payment_intents/search', 'GET', { query, ...params }, config);
}

// ============================================================================
// Subscription Operations
// ============================================================================

/**
 * Create a new subscription
 */
export async function createSubscription(params: CreateSubscriptionParams, config?: StripeConfig): Promise<Subscription> {
  return stripeRequest<Subscription>('/subscriptions', 'POST', params, config);
}

/**
 * Retrieve a subscription by ID
 */
export async function getSubscription(subscriptionId: string, config?: StripeConfig): Promise<Subscription> {
  return stripeRequest<Subscription>(`/subscriptions/${subscriptionId}`, 'GET', undefined, config);
}

/**
 * Update a subscription
 */
export async function updateSubscription(subscriptionId: string, params: UpdateSubscriptionParams, config?: StripeConfig): Promise<Subscription> {
  return stripeRequest<Subscription>(`/subscriptions/${subscriptionId}`, 'POST', params, config);
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string, params?: { prorate?: boolean; invoice_now?: boolean }, config?: StripeConfig): Promise<Subscription> {
  return stripeRequest<Subscription>(`/subscriptions/${subscriptionId}`, 'DELETE', params, config);
}

/**
 * Resume a paused subscription
 */
export async function resumeSubscription(subscriptionId: string, params?: { proration_behavior?: string }, config?: StripeConfig): Promise<Subscription> {
  return stripeRequest<Subscription>(`/subscriptions/${subscriptionId}/resume`, 'POST', params, config);
}

/**
 * List subscriptions with optional filters
 */
export async function listSubscriptions(params?: { limit?: number; starting_after?: string; customer?: string; status?: string }, config?: StripeConfig): Promise<StripeListResponse<Subscription>> {
  return stripeRequest<StripeListResponse<Subscription>>('/subscriptions', 'GET', params, config);
}

/**
 * Search subscriptions using Stripe's search syntax
 */
export async function searchSubscriptions(query: string, params?: { limit?: number }, config?: StripeConfig): Promise<StripeSearchResponse<Subscription>> {
  return stripeRequest<StripeSearchResponse<Subscription>>('/subscriptions/search', 'GET', { query, ...params }, config);
}

// ============================================================================
// Invoice Operations
// ============================================================================

/**
 * Create a new invoice
 */
export async function createInvoice(params: CreateInvoiceParams, config?: StripeConfig): Promise<Invoice> {
  return stripeRequest<Invoice>('/invoices', 'POST', params, config);
}

/**
 * Retrieve an invoice by ID
 */
export async function getInvoice(invoiceId: string, config?: StripeConfig): Promise<Invoice> {
  return stripeRequest<Invoice>(`/invoices/${invoiceId}`, 'GET', undefined, config);
}

/**
 * Update an invoice
 */
export async function updateInvoice(invoiceId: string, params: Partial<CreateInvoiceParams>, config?: StripeConfig): Promise<Invoice> {
  return stripeRequest<Invoice>(`/invoices/${invoiceId}`, 'POST', params, config);
}

/**
 * Finalize an invoice
 */
export async function finalizeInvoice(invoiceId: string, params?: { auto_advance?: boolean }, config?: StripeConfig): Promise<Invoice> {
  return stripeRequest<Invoice>(`/invoices/${invoiceId}/finalize`, 'POST', params, config);
}

/**
 * Pay an invoice
 */
export async function payInvoice(invoiceId: string, params?: { payment_method?: string }, config?: StripeConfig): Promise<Invoice> {
  return stripeRequest<Invoice>(`/invoices/${invoiceId}/pay`, 'POST', params, config);
}

/**
 * Void an invoice
 */
export async function voidInvoice(invoiceId: string, config?: StripeConfig): Promise<Invoice> {
  return stripeRequest<Invoice>(`/invoices/${invoiceId}/void`, 'POST', undefined, config);
}

/**
 * Send an invoice for manual payment
 */
export async function sendInvoice(invoiceId: string, config?: StripeConfig): Promise<Invoice> {
  return stripeRequest<Invoice>(`/invoices/${invoiceId}/send`, 'POST', undefined, config);
}

/**
 * List invoices with optional filters
 */
export async function listInvoices(params?: { limit?: number; starting_after?: string; customer?: string; status?: string }, config?: StripeConfig): Promise<StripeListResponse<Invoice>> {
  return stripeRequest<StripeListResponse<Invoice>>('/invoices', 'GET', params, config);
}

/**
 * Search invoices using Stripe's search syntax
 */
export async function searchInvoices(query: string, params?: { limit?: number }, config?: StripeConfig): Promise<StripeSearchResponse<Invoice>> {
  return stripeRequest<StripeSearchResponse<Invoice>>('/invoices/search', 'GET', { query, ...params }, config);
}

/**
 * Create an invoice item
 */
export async function createInvoiceItem(params: CreateInvoiceItemParams, config?: StripeConfig): Promise<InvoiceLineItem> {
  return stripeRequest<InvoiceLineItem>('/invoiceitems', 'POST', params, config);
}

// ============================================================================
// Coupon Operations
// ============================================================================

/**
 * Create a new coupon
 */
export async function createCoupon(params: CreateCouponParams, config?: StripeConfig): Promise<Coupon> {
  return stripeRequest<Coupon>('/coupons', 'POST', params, config);
}

/**
 * Retrieve a coupon by ID
 */
export async function getCoupon(couponId: string, config?: StripeConfig): Promise<Coupon> {
  return stripeRequest<Coupon>(`/coupons/${couponId}`, 'GET', undefined, config);
}

/**
 * Update a coupon
 */
export async function updateCoupon(couponId: string, params: { metadata?: Record<string, string>; name?: string }, config?: StripeConfig): Promise<Coupon> {
  return stripeRequest<Coupon>(`/coupons/${couponId}`, 'POST', params, config);
}

/**
 * Delete a coupon
 */
export async function deleteCoupon(couponId: string, config?: StripeConfig): Promise<{ id: string; object: 'coupon'; deleted: boolean }> {
  return stripeRequest(`/coupons/${couponId}`, 'DELETE', undefined, config);
}

/**
 * List coupons with optional filters
 */
export async function listCoupons(params?: { limit?: number; starting_after?: string }, config?: StripeConfig): Promise<StripeListResponse<Coupon>> {
  return stripeRequest<StripeListResponse<Coupon>>('/coupons', 'GET', params, config);
}

// ============================================================================
// Refund Operations
// ============================================================================

/**
 * Create a refund
 */
export async function createRefund(params: CreateRefundParams, config?: StripeConfig): Promise<Refund> {
  return stripeRequest<Refund>('/refunds', 'POST', params, config);
}

/**
 * Retrieve a refund by ID
 */
export async function getRefund(refundId: string, config?: StripeConfig): Promise<Refund> {
  return stripeRequest<Refund>(`/refunds/${refundId}`, 'GET', undefined, config);
}

/**
 * Update a refund
 */
export async function updateRefund(refundId: string, params: { metadata?: Record<string, string> }, config?: StripeConfig): Promise<Refund> {
  return stripeRequest<Refund>(`/refunds/${refundId}`, 'POST', params, config);
}

/**
 * Cancel a refund (only pending refunds can be canceled)
 */
export async function cancelRefund(refundId: string, config?: StripeConfig): Promise<Refund> {
  return stripeRequest<Refund>(`/refunds/${refundId}/cancel`, 'POST', undefined, config);
}

/**
 * List refunds with optional filters
 */
export async function listRefunds(params?: { limit?: number; starting_after?: string; payment_intent?: string }, config?: StripeConfig): Promise<StripeListResponse<Refund>> {
  return stripeRequest<StripeListResponse<Refund>>('/refunds', 'GET', params, config);
}

// ============================================================================
// Dispute Operations
// ============================================================================

/**
 * Retrieve a dispute by ID
 */
export async function getDispute(disputeId: string, config?: StripeConfig): Promise<Dispute> {
  return stripeRequest<Dispute>(`/disputes/${disputeId}`, 'GET', undefined, config);
}

/**
 * Update a dispute (submit evidence)
 */
export async function updateDispute(disputeId: string, params: UpdateDisputeParams, config?: StripeConfig): Promise<Dispute> {
  return stripeRequest<Dispute>(`/disputes/${disputeId}`, 'POST', params, config);
}

/**
 * Close a dispute (accept the dispute)
 */
export async function closeDispute(disputeId: string, config?: StripeConfig): Promise<Dispute> {
  return stripeRequest<Dispute>(`/disputes/${disputeId}/close`, 'POST', undefined, config);
}

/**
 * List disputes with optional filters
 */
export async function listDisputes(params?: { limit?: number; starting_after?: string; payment_intent?: string }, config?: StripeConfig): Promise<StripeListResponse<Dispute>> {
  return stripeRequest<StripeListResponse<Dispute>>('/disputes', 'GET', params, config);
}

// ============================================================================
// Payment Link Operations
// ============================================================================

/**
 * Create a payment link
 */
export async function createPaymentLink(params: CreatePaymentLinkParams, config?: StripeConfig): Promise<PaymentLink> {
  return stripeRequest<PaymentLink>('/payment_links', 'POST', params, config);
}

/**
 * Retrieve a payment link by ID
 */
export async function getPaymentLink(paymentLinkId: string, config?: StripeConfig): Promise<PaymentLink> {
  return stripeRequest<PaymentLink>(`/payment_links/${paymentLinkId}`, 'GET', undefined, config);
}

/**
 * Update a payment link
 */
export async function updatePaymentLink(paymentLinkId: string, params: { active?: boolean; metadata?: Record<string, string> }, config?: StripeConfig): Promise<PaymentLink> {
  return stripeRequest<PaymentLink>(`/payment_links/${paymentLinkId}`, 'POST', params, config);
}

/**
 * List payment links with optional filters
 */
export async function listPaymentLinks(params?: { limit?: number; starting_after?: string; active?: boolean }, config?: StripeConfig): Promise<StripeListResponse<PaymentLink>> {
  return stripeRequest<StripeListResponse<PaymentLink>>('/payment_links', 'GET', params, config);
}

// ============================================================================
// Batch / Convenience Operations
// ============================================================================

/**
 * Create a product with an associated price in one call
 */
export async function createProductWithPrice(
  productParams: CreateProductParams,
  priceParams: Omit<CreatePriceParams, 'product'>,
  config?: StripeConfig
): Promise<{ product: Product; price: Price }> {
  const product = await createProduct(productParams, config);
  const price = await createPrice({ ...priceParams, product: product.id }, config);
  return { product, price };
}

/**
 * Create a complete checkout flow: customer + product + price + payment intent
 */
export async function createQuickCheckout(
  params: {
    customerEmail: string;
    productName: string;
    amountInCents: number;
    currency?: string;
  },
  config?: StripeConfig
): Promise<{
  customer: Customer;
  product: Product;
  price: Price;
  paymentIntent: PaymentIntent;
}> {
  const currency = params.currency || 'usd';

  // Create customer
  const customer = await createCustomer({ email: params.customerEmail }, config);

  // Create product
  const product = await createProduct({ name: params.productName }, config);

  // Create price
  const price = await createPrice({
    product: product.id,
    currency,
    unit_amount: params.amountInCents,
  }, config);

  // Create payment intent
  const paymentIntent = await createPaymentIntent({
    amount: params.amountInCents,
    currency,
    customer: customer.id,
    automatic_payment_methods: { enabled: true },
  }, config);

  return { customer, product, price, paymentIntent };
}

// ============================================================================
// Exports Summary
// ============================================================================

export default {
  // Config & Utilities
  isTestMode,
  isLiveMode,
  validateApiKey,
  getTestCard,
  getTestPaymentMethod,
  listTestCardScenarios,
  listTestPaymentMethods,
  formatAmount,
  toCents,
  getSandboxSetupGuide,
  getErrorCodeReference,

  // Constants
  TEST_CARDS,
  TEST_PAYMENT_METHODS,
  TEST_BANK_ACCOUNTS,

  // Account & Balance
  getAccount,
  getBalance,

  // Customers
  createCustomer,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  listCustomers,
  searchCustomers,

  // Products
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct,
  listProducts,
  searchProducts,

  // Prices
  createPrice,
  getPrice,
  updatePrice,
  listPrices,
  searchPrices,

  // Payment Intents
  createPaymentIntent,
  getPaymentIntent,
  updatePaymentIntent,
  confirmPaymentIntent,
  capturePaymentIntent,
  cancelPaymentIntent,
  listPaymentIntents,
  searchPaymentIntents,

  // Subscriptions
  createSubscription,
  getSubscription,
  updateSubscription,
  cancelSubscription,
  resumeSubscription,
  listSubscriptions,
  searchSubscriptions,

  // Invoices
  createInvoice,
  getInvoice,
  updateInvoice,
  finalizeInvoice,
  payInvoice,
  voidInvoice,
  sendInvoice,
  listInvoices,
  searchInvoices,
  createInvoiceItem,

  // Coupons
  createCoupon,
  getCoupon,
  updateCoupon,
  deleteCoupon,
  listCoupons,

  // Refunds
  createRefund,
  getRefund,
  updateRefund,
  cancelRefund,
  listRefunds,

  // Disputes
  getDispute,
  updateDispute,
  closeDispute,
  listDisputes,

  // Payment Links
  createPaymentLink,
  getPaymentLink,
  updatePaymentLink,
  listPaymentLinks,

  // Batch Operations
  createProductWithPrice,
  createQuickCheckout,
};
