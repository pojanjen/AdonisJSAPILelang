# Google OAuth Implementation - AdonisJS 6

## Overview
Implementasi Google OAuth untuk login dan registrasi otomatis user dengan role "pembeli". Fitur ini equivalent dengan Laravel Socialite untuk Google OAuth.

## Setup

### 1. Environment Variables
Tambahkan di file `.env`:
```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

### 2. Google Cloud Console Setup
1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat atau pilih project
3. Enable Google+ API
4. Buat OAuth 2.0 credentials
5. Tambahkan authorized redirect URI: `http://localhost:3333/auth/google/callback`

## API Endpoints

### 1. Redirect ke Google OAuth
```
GET /auth/google/redirect
```

**Response:**
```json
{
  "success": true,
  "message": "Redirect to Google OAuth",
  "data": {
    "redirect_url": "https://accounts.google.com/oauth/authorize?..."
  }
}
```

### 2. Handle Google OAuth Callback
```
GET /auth/google/callback
```

**Parameters:**
- `code`: Authorization code dari Google
- `state`: State parameter untuk security

**Response (Success):**
```json
{
  "success": true,
  "message": "Login with Google successful",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@gmail.com",
      "role": "pembeli",
      "google_id": "google_user_id",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    },
    "token": {
      "type": "Bearer",
      "name": null,
      "token": "oat_...",
      "abilities": ["*"],
      "expires_at": "2024-01-08T00:00:00.000Z"
    }
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "User denied access to Google account",
  "data": null
}
```

### 3. Get OAuth User Info (Protected)
```
GET /auth/oauth/user
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "OAuth user information retrieved successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@gmail.com",
      "role": "pembeli",
      "google_id": "google_user_id",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

## Implementation Details

### Database Schema
```sql
-- Migration: add_google_id_to_users_table
ALTER TABLE users ADD COLUMN google_id VARCHAR(255) NULL UNIQUE;
```

### User Model
```typescript
// app/models/user.ts
@column()
public googleId!: string | null
```

### OAuth Controller
```typescript
// app/controllers/oauth_controller.ts
export default class OauthController {
  async redirectToGoogle({ ally, response }: HttpContext)
  async handleGoogleCallback({ ally, request, response }: HttpContext)
  async getOAuthUser({ auth, response }: HttpContext)
}
```

### Configuration
```typescript
// config/ally.ts
const allyConfig = defineConfig({
  google: services.google({
    clientId: env.get('GOOGLE_CLIENT_ID'),
    clientSecret: env.get('GOOGLE_CLIENT_SECRET'),
    callbackUrl: 'http://localhost:3333/auth/google/callback',
  }),
})
```

## Flow Diagram

```
1. Frontend → GET /auth/google/redirect
2. Server → Return Google OAuth URL
3. Frontend → Redirect user to Google OAuth URL
4. User → Login di Google
5. Google → Redirect ke /auth/google/callback dengan code
6. Server → Exchange code untuk user info
7. Server → Create/Update user in database
8. Server → Generate access token
9. Server → Return user + token
```

## Error Handling

### Common Errors:
1. **User denied access**: HTTP 400 dengan message "User denied access to Google account"
2. **Invalid credentials**: HTTP 500 dengan message "Failed to authenticate with Google"
3. **Non-OAuth user accessing OAuth endpoint**: HTTP 400 dengan message "User is not authenticated via OAuth"

### Database Transaction:
- Semua operasi database menggunakan transaction
- Rollback otomatis jika terjadi error
- Commit hanya jika semua operasi berhasil

## Security Features

1. **Unique Google ID**: Kolom `google_id` memiliki constraint UNIQUE
2. **Email Verification**: Email dari Google sudah terverifikasi otomatis
3. **Role Management**: User OAuth otomatis mendapat role "pembeli"
4. **Token Expiration**: Access token expired dalam 7 hari
5. **Random Password**: User OAuth mendapat password random (tidak bisa login manual)

## Frontend Integration

### React/Vue.js Example:
```javascript
// Redirect ke Google OAuth
const redirectToGoogle = async () => {
  const response = await fetch('/auth/google/redirect')
  const data = await response.json()
  window.location.href = data.data.redirect_url
}

// Handle callback (jika menggunakan SPA)
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')
  
  if (code) {
    // Call /auth/google/callback dengan code
    handleGoogleCallback(code)
  }
}, [])
```

### Flutter Example:
```dart
// Menggunakan url_launcher untuk redirect
await launch('http://localhost:3333/auth/google/redirect');

// Handle callback di webview atau deep link
```

## Testing

### Postman Testing:
1. **Test Redirect**:
   - GET `http://localhost:3333/auth/google/redirect`
   - Expect: redirect_url in response

2. **Test Callback** (Manual):
   - Gunakan redirect_url di browser
   - Login dengan Google
   - Lihat callback URL dengan code parameter

3. **Test OAuth User Info**:
   - GET `http://localhost:3333/auth/oauth/user`
   - Header: `Authorization: Bearer <token>`

## Production Considerations

1. **HTTPS Required**: Google OAuth memerlukan HTTPS di production
2. **Domain Whitelist**: Tambahkan domain production di Google Console
3. **Environment Variables**: Gunakan credentials production yang berbeda
4. **Error Logging**: Monitor error untuk debugging
5. **Rate Limiting**: Implementasi rate limiting untuk OAuth endpoints

## Equivalent Laravel Implementation

Implementasi ini equivalent dengan Laravel Socialite:

```php
// Laravel Controller
public function redirectToGoogle()
{
    return Socialite::driver('google')->redirect();
}

public function handleGoogleCallback()
{
    $user = Socialite::driver('google')->user();
    // Create or update user logic...
}
```

## Troubleshooting

### Common Issues:
1. **Environment variables not set**: Pastikan GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET sudah diset
2. **Callback URL mismatch**: Pastikan callback URL di Google Console sama dengan config
3. **Database error**: Cek koneksi database dan migration sudah dijalankan
4. **Token not working**: Pastikan Bearer token format correct di header

### Debug Mode:
```typescript
// Enable debug logging di controller
console.log('Google user data:', googleUser)
console.log('Database user:', user)
console.log('Generated token:', token)
```
