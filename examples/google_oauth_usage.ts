/**
 * Example: Google OAuth Usage in AdonisJS
 * File: examples/google_oauth_usage.ts
 */

// =============================================
// 1. FRONTEND INTEGRATION EXAMPLE
// =============================================

// React/Vue.js/Angular Example
const GoogleOAuthExample = {
  // Method untuk redirect ke Google OAuth
  async redirectToGoogle() {
    try {
      const response = await fetch('http://localhost:3333/auth/google/redirect', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()

      if (result.success) {
        // Redirect user ke Google OAuth
        window.location.href = result.data.redirect_url
      } else {
        console.error('Failed to get Google OAuth URL:', result.message)
      }
    } catch (error) {
      console.error('Error redirecting to Google:', error)
    }
  },

  // Method untuk handle callback dari Google (jika menggunakan SPA)
  async handleGoogleCallback(code: string, state?: string) {
    try {
      const response = await fetch(`http://localhost:3333/auth/google/callback?code=${code}&state=${state || ''}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()

      if (result.success) {
        // Save token to localStorage or state management
        localStorage.setItem('access_token', result.data.token.token)
        localStorage.setItem('user', JSON.stringify(result.data.user))

        console.log('Login successful:', result.data.user)
        // Redirect to dashboard or home page
        window.location.href = '/dashboard'
      } else {
        console.error('Login failed:', result.message)
        alert('Login gagal: ' + result.message)
      }
    } catch (error) {
      console.error('Error handling Google callback:', error)
      alert('Terjadi kesalahan saat login')
    }
  },

  // Method untuk get user info OAuth
  async getOAuthUserInfo() {
    try {
      const token = localStorage.getItem('access_token')

      const response = await fetch('http://localhost:3333/auth/oauth/user', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()

      if (result.success) {
        return result.data.user
      } else {
        console.error('Failed to get OAuth user info:', result.message)
        return null
      }
    } catch (error) {
      console.error('Error getting OAuth user info:', error)
      return null
    }
  }
}

// =============================================
// 2. FLUTTER INTEGRATION EXAMPLE
// =============================================

/*
// Flutter Example (Dart)
import 'package:url_launcher/url_launcher.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class GoogleOAuthService {
  static const String baseUrl = 'http://localhost:3333';

  // Redirect ke Google OAuth
  static Future<void> redirectToGoogle() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/auth/google/redirect'),
        headers: {'Content-Type': 'application/json'},
      );

      final result = json.decode(response.body);

      if (result['success']) {
        final redirectUrl = result['data']['redirect_url'];

        // Launch Google OAuth URL
        if (await canLaunch(redirectUrl)) {
          await launch(redirectUrl);
        } else {
          throw 'Could not launch $redirectUrl';
        }
      } else {
        throw result['message'];
      }
    } catch (e) {
      print('Error redirecting to Google: $e');
    }
  }

  // Handle callback dari Google (gunakan webview atau deep link)
  static Future<Map<String, dynamic>?> handleGoogleCallback(String code, {String? state}) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/auth/google/callback?code=$code&state=${state ?? ''}'),
        headers: {'Content-Type': 'application/json'},
      );

      final result = json.decode(response.body);

      if (result['success']) {
        // Save token to secure storage
        await _saveToken(result['data']['token']['token']);
        await _saveUser(result['data']['user']);

        return result['data'];
      } else {
        throw result['message'];
      }
    } catch (e) {
      print('Error handling Google callback: $e');
      return null;
    }
  }

  // Get OAuth user info
  static Future<Map<String, dynamic>?> getOAuthUserInfo() async {
    try {
      final token = await _getToken();

      final response = await http.get(
        Uri.parse('$baseUrl/auth/oauth/user'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      final result = json.decode(response.body);

      if (result['success']) {
        return result['data']['user'];
      } else {
        throw result['message'];
      }
    } catch (e) {
      print('Error getting OAuth user info: $e');
      return null;
    }
  }

  // Helper methods for secure storage
  static Future<void> _saveToken(String token) async {
    // Implement secure storage (flutter_secure_storage)
  }

  static Future<void> _saveUser(Map<String, dynamic> user) async {
    // Implement secure storage
  }

  static Future<String?> _getToken() async {
    // Get token from secure storage
    return null;
  }
}
*/

// =============================================
// 3. POSTMAN TESTING EXAMPLE
// =============================================

const PostmanTestingExample = {
  // Test cases untuk Postman
  testCases: [
    {
      name: "1. Test Redirect to Google OAuth",
      method: "GET",
      url: "http://localhost:3333/auth/google/redirect",
      headers: {
        "Content-Type": "application/json"
      },
      expectedResponse: {
        success: true,
        message: "Redirect to Google OAuth",
        data: {
          redirect_url: "https://accounts.google.com/oauth/authorize?..."
        }
      }
    },
    {
      name: "2. Test Google OAuth Callback (Manual)",
      method: "GET",
      url: "http://localhost:3333/auth/google/callback?code=GOOGLE_AUTH_CODE&state=STATE_VALUE",
      note: "Dapatkan code dari URL callback setelah login Google",
      expectedResponse: {
        success: true,
        message: "Login with Google successful",
        data: {
          user: "UserObject",
          token: "TokenObject"
        }
      }
    },
    {
      name: "3. Test Get OAuth User Info",
      method: "GET",
      url: "http://localhost:3333/auth/oauth/user",
      headers: {
        "Authorization": "Bearer ACCESS_TOKEN_FROM_STEP_2"
      },
      expectedResponse: {
        success: true,
        message: "OAuth user information retrieved successfully",
        data: {
          user: "UserObject"
        }
      }
    }
  ],

  // Collection untuk Postman
  postmanCollection: {
    info: {
      name: "Google OAuth - AdonisJS",
      description: "Collection untuk testing Google OAuth implementation"
    },
    variable: [
      {
        key: "base_url",
        value: "http://localhost:3333"
      }
    ]
  }
}

// =============================================
// 4. ERROR HANDLING EXAMPLE
// =============================================

const ErrorHandlingExample = {
  // Handle berbagai jenis error
  async handleOAuthErrors(response: any) {
    if (!response.success) {
      switch (response.message) {
        case 'User denied access to Google account':
          alert('Anda menolak akses ke akun Google. Silakan coba lagi.')
          break

        case 'Failed to authenticate with Google':
          alert('Gagal autentikasi dengan Google. Silakan coba lagi.')
          break

        case 'User is not authenticated via OAuth':
          alert('Anda tidak login melalui OAuth. Silakan login ulang.')
          // Redirect to login page
          window.location.href = '/login'
          break

        default:
          alert('Terjadi kesalahan: ' + response.message)
      }
    }
  },

  // Retry mechanism
  async retryOAuthOperation(operation: () => Promise<any>, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation()
      } catch (error) {
        console.log(`Attempt ${i + 1} failed:`, error)

        if (i === maxRetries - 1) {
          throw error
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
  }
}

// =============================================
// 5. SECURITY BEST PRACTICES
// =============================================

const SecurityBestPractices = {
  // Validate token sebelum request
  validateToken(token: string): boolean {
    if (!token || token.length < 10) {
      return false
    }

    // Check token format (Bearer token)
    if (!token.startsWith('oat_')) {
      return false
    }

    return true
  },

  // Secure token storage
  secureTokenStorage: {
    save(token: string) {
      // Gunakan secure storage, bukan localStorage untuk production
      if (typeof window !== 'undefined') {
        localStorage.setItem('oauth_token', token)
      }
    },

    get(): string | null {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('oauth_token')
      }
      return null
    },

    remove() {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('oauth_token')
      }
    }
  },

  // CSRF Protection
  generateState(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15)
  }
}

export {
  GoogleOAuthExample,
  PostmanTestingExample,
  ErrorHandlingExample,
  SecurityBestPractices
}
