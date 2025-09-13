# AdonisJS 6 Kernel Configuration Fix

## Problem
Error pada middleware import di `start/kernel.ts` karena menggunakan path lama dari AdonisJS 5:

```typescript
// ❌ AdonisJS 5 (Deprecated paths)
() => import('@adonisjs/cookie/build/cookie_middleware'),
() => import('@adonisjs/session/build/session_middleware'),
() => import('@adonisjs/static/build/static_middleware'),
() => import('@adonisjs/core/build/bodyparser_middleware'),
```

## Solution
Updated to AdonisJS 6 proper middleware configuration:

```typescript
// ✅ AdonisJS 6 (Correct configuration)
server.use([
  () => import('#middleware/container_bindings_middleware'),
  () => import('#middleware/force_json_response_middleware'),
  () => import('@adonisjs/cors/cors_middleware'),
])

router.use([
  () => import('@adonisjs/core/bodyparser_middleware'),
  () => import('@adonisjs/auth/initialize_auth_middleware')
])
```

## Key Changes

### 1. **Removed Deprecated Middleware:**
- ❌ `@adonisjs/cookie/build/cookie_middleware` - Not needed in AdonisJS 6
- ❌ `@adonisjs/session/build/session_middleware` - Not needed for API-only app  
- ❌ `@adonisjs/static/build/static_middleware` - Not needed for API-only app
- ❌ `@adonisjs/core/build/bodyparser_middleware` - Wrong path

### 2. **Correct AdonisJS 6 Middleware Stack:**

#### Server Middleware (All HTTP requests):
```typescript
server.use([
  () => import('#middleware/container_bindings_middleware'),    // Container bindings
  () => import('#middleware/force_json_response_middleware'),   // Force JSON responses
  () => import('@adonisjs/cors/cors_middleware'),              // CORS handling
])
```

#### Router Middleware (Registered routes only):
```typescript
router.use([
  () => import('@adonisjs/core/bodyparser_middleware'),        // Request body parsing
  () => import('@adonisjs/auth/initialize_auth_middleware')    // Authentication
])
```

### 3. **Named Middleware (Unchanged):**
```typescript
export const middleware = router.named({
  guest: () => import('#middleware/guest_middleware'),
  checkRole: () => import('#middleware/check_role_middleware'),
  cekVerifikasiPembeli: () => import('#middleware/cek_verifikasi_pembeli_middleware'),
  auth: () => import('#middleware/auth_middleware')
})
```

## Why These Changes?

### **Cookie & Session Middleware Removed:**
- API-only applications don't need cookie/session middleware
- Using token-based authentication (Bearer tokens)
- Cookies add unnecessary overhead for REST APIs

### **Static Middleware Removed:**
- API doesn't serve static files directly
- Images served through dedicated image route with custom middleware
- Keeps API lightweight and focused

### **Bodyparser Path Fixed:**
- AdonisJS 6 uses `@adonisjs/core/bodyparser_middleware`
- No more `/build/` in the path

### **Clean Separation:**
- **Server middleware:** Runs on ALL requests (even 404s)
- **Router middleware:** Runs only on matched routes
- **Named middleware:** Applied selectively to specific routes

## Current Middleware Flow

```
1. HTTP Request
   ↓
2. server.use() middleware:
   - Container bindings
   - Force JSON response  
   - CORS headers
   ↓
3. Route matching
   ↓
4. router.use() middleware (if route found):
   - Body parsing
   - Auth initialization
   ↓
5. Named middleware (if specified on route):
   - guest, checkRole, cekVerifikasiPembeli, auth
   ↓
6. Controller action
```

## Benefits of This Configuration

✅ **Performance:** Minimal middleware stack for API  
✅ **Clean:** No unnecessary session/cookie handling  
✅ **Secure:** CORS and Auth properly configured  
✅ **Flexible:** Named middleware for specific routes  
✅ **Compatible:** Works perfectly with AdonisJS 6  

## Testing

After fix, server should start without errors:

```bash
npm run dev
# ✅ No middleware import errors
# ✅ Clean startup
# ✅ CORS working
# ✅ Auth working
# ✅ Body parsing working
```

## File Structure Reference

```
start/
  kernel.ts           ← Fixed middleware configuration
app/
  middleware/
    auth_middleware.ts
    check_role_middleware.ts
    cek_verifikasi_pembeli_middleware.ts
    container_bindings_middleware.ts
    force_json_response_middleware.ts
    guest_middleware.ts
```

## Notes

- **No cookies needed:** API uses Bearer token auth
- **No sessions needed:** Stateless REST API design  
- **No static files:** Images served via route handler
- **Bodyparser essential:** Needed for POST/PUT requests
- **CORS essential:** Needed for frontend integration
- **Auth middleware:** Handles token validation

**Kernel configuration is now optimized for AdonisJS 6 API application!** 🚀
