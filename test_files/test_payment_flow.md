# Payment Flow Test Instructions

## Complete End-to-End Payment Flow with Verifone

### Test Flow:
1. Register as supplier (redirects to subscription selection)
2. Select a subscription plan
3. Complete Verifone payment form
4. Get redirected to supplier dashboard
5. Verify subscription is active

### Test Accounts:
- **Admin**: admin@fourone.com.do / password
- **Supplier**: proveedor@ejemplo.com.do / password
- **Client**: cliente@ejemplo.com.do / password

### Test Payment Data:
- Card Number: 4111 1111 1111 1111
- Expiry: 12/25
- CVV: 123
- Name: Test User

### Expected Behavior:
- Suppliers must select and pay for subscription to access features
- Different plans provide different feature access levels
- Payment processed through Verifone simulation
- Success leads to approved supplier status

### Features by Plan:
- **Basic (RD$1,000)**: Basic profile, 10 products, 5 quotes/month
- **Professional (RD$2,500)**: Unlimited products/quotes, priority search
- **Enterprise (RD$5,000)**: API access, dedicated support, analytics