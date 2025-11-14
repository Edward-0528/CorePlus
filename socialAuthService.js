import { supabase } from './supabaseConfig';
import { Linking } from 'react-native';

export const socialAuthService = {
  // Google Sign In
  signInWithGoogle: async () => {
    try {
      console.log('🔐 Initiating Google OAuth for Core Plus...');
      const startTime = Date.now();
      
      // Check if we're in production and handle gracefully
      if (!supabase || !supabase.auth) {
        throw new Error('Supabase not properly initialized');
      }

      // Add timeout wrapper for OAuth request
      const oauthPromise = supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'core-plus://auth/callback',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            hd: '', // Optional: restrict to specific domain
          },
          scopes: 'openid email profile',
          // Additional options to improve user experience
          skipBrowserRedirect: false,
        },
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OAuth timeout after 15s')), 15000)
      );

      const { data, error } = await Promise.race([oauthPromise, timeoutPromise]);
      console.log(`⏱️ OAuth request took ${Date.now() - startTime}ms`);

      console.log('Google OAuth response:', { data, error });

      if (error) {
        console.error('OAuth error:', error);
        throw error;
      }

      // Open the OAuth URL in the device's browser
      if (data?.url) {
        console.log('Opening OAuth URL:', data.url);
        const canOpen = await Linking.canOpenURL(data.url);
        console.log('Can open URL:', canOpen);
        
        if (canOpen) {
          await Linking.openURL(data.url);
        } else {
          throw new Error('Cannot open OAuth URL - check app permissions');
        }
      } else {
        throw new Error('No OAuth URL received from Supabase');
      }

      return { success: true, data };
    } catch (error) {
      console.error('Google OAuth error:', error);
      
      // Provide more user-friendly error messages
      let userMessage = error.message;
      if (error.message.includes('network')) {
        userMessage = 'Network error. Please check your internet connection.';
      } else if (error.message.includes('auth')) {
        userMessage = 'Authentication service unavailable. Please try again later.';
      }
      
      return { success: false, error: userMessage };
    }
  },

  // Apple Sign In (iOS only)
  signInWithApple: async () => {
    try {
      console.log('🍎 Initiating Apple OAuth with Supabase...');
      const startTime = Date.now();
      
      // Add timeout wrapper for OAuth request
      const oauthPromise = supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: 'core-plus://auth/callback',
        },
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Apple OAuth timeout after 15s')), 15000)
      );

      const { data, error } = await Promise.race([oauthPromise, timeoutPromise]);
      console.log(`⏱️ Apple OAuth took ${Date.now() - startTime}ms`);

      if (error) throw error;

      // Open the OAuth URL in the device's browser
      if (data?.url) {
        const canOpen = await Linking.canOpenURL(data.url);
        if (canOpen) {
          await Linking.openURL(data.url);
        } else {
          throw new Error('Cannot open OAuth URL');
        }
      } else {
        throw new Error('No OAuth URL received from Supabase');
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Facebook Sign In
  signInWithFacebook: async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: 'core-plus://auth/callback',
        },
      });

      if (error) throw error;

      // Open the OAuth URL in the device's browser
      if (data?.url) {
        const canOpen = await Linking.canOpenURL(data.url);
        if (canOpen) {
          await Linking.openURL(data.url);
        } else {
          throw new Error('Cannot open OAuth URL');
        }
      } else {
        throw new Error('No OAuth URL received from Supabase');
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // GitHub Sign In
  signInWithGitHub: async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: 'core-plus://auth/callback',
        },
      });

      if (error) throw error;

      // Open the OAuth URL in the device's browser
      if (data?.url) {
        const canOpen = await Linking.canOpenURL(data.url);
        if (canOpen) {
          await Linking.openURL(data.url);
        } else {
          throw new Error('Cannot open OAuth URL');
        }
      } else {
        throw new Error('No OAuth URL received from Supabase');
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Handle OAuth callback
  handleOAuthCallback: async (url) => {
    try {
      const { data, error } = await supabase.auth.getSessionFromUrl({ url });
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};
