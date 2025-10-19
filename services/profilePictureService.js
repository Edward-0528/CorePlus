import { supabase } from '../supabaseConfig';

/**
 * Service for handling profile picture operations with Supabase storage
 * Uses the 'profile_pictures' bucket
 */
class ProfilePictureService {
  
  /**
   * Upload a profile picture to Supabase storage
   * @param {string} uri - Local file URI (file://)
   * @param {string} userId - User ID for filename uniqueness
   * @param {string} currentImageUrl - Current profile image URL to delete (optional)
   * @returns {Promise<string|null>} Public URL of uploaded image or null if failed
   */
  async uploadProfilePicture(uri, userId, currentImageUrl = null) {
    try {
      console.log('🖼️ ProfilePictureService: Starting upload');
      console.log('📍 URI:', uri);
      console.log('👤 User ID:', userId);
      console.log('🗑️ Current image to delete:', currentImageUrl);

      // Delete the old image first if it exists
      if (currentImageUrl) {
        console.log('🧹 Deleting previous profile image...');
        const deleteSuccess = await this.deleteProfilePicture(currentImageUrl);
        if (deleteSuccess) {
          console.log('✅ Previous image deleted successfully');
        } else {
          console.log('⚠️ Failed to delete previous image, continuing with upload...');
        }
      }

      // Validate inputs
      if (!uri || !userId) {
        throw new Error('URI and userId are required');
      }

      // Create unique filename with timestamp
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `profile_${userId}_${Date.now()}.${fileExt}`;
      console.log('📁 Generated filename:', fileName);

      // React Native compatible approach: Multiple methods
      console.log('📦 Preparing image for upload...');
      
      let uploadData;
      let fileSize = 'unknown';
      
      try {
        // Method 1: Try ArrayBuffer (preferred for React Native)
        console.log('� Attempting ArrayBuffer method...');
        const response = await fetch(uri);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        
        uploadData = await response.arrayBuffer();
        fileSize = Math.round(uploadData.byteLength / 1024) + ' KB';
        console.log('✅ ArrayBuffer method successful - Size:', fileSize);
        
      } catch (arrayBufferError) {
        console.log('⚠️ ArrayBuffer failed, trying FormData method:', arrayBufferError.message);
        
        // Method 2: Try FormData as fallback
        uploadData = new FormData();
        uploadData.append('file', {
          uri: uri,
          type: 'image/jpeg',
          name: fileName,
        });
        console.log('✅ FormData method prepared');
      }

      // Upload to Supabase storage bucket
      console.log('☁️ Uploading to profile_pictures bucket...');
      console.log('📦 Upload data type:', uploadData instanceof ArrayBuffer ? 'ArrayBuffer' : 'FormData');
      
      const { data, error } = await supabase.storage
        .from('profile_pictures')
        .upload(fileName, uploadData, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false // Don't overwrite existing files
        });

      if (error) {
        console.error('❌ Storage upload error:', error);
        throw error;
      }

      console.log('✅ Upload successful:', data);

      // Generate public URL
      const { data: urlData } = supabase.storage
        .from('profile_pictures')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      console.log('🔗 Public URL generated:', publicUrl);

      // Verify the URL is accessible
      await this.verifyImageUrl(publicUrl);

      return publicUrl;

    } catch (error) {
      console.error('❌ ProfilePictureService upload failed:', error);
      console.error('❌ Error details:', {
        message: error.message,
        statusCode: error.statusCode,
        error: error.error,
        details: error.details
      });
      return null;
    }
  }

  /**
   * Delete a profile picture from storage
   * @param {string} imageUrl - Full public URL of the image
   * @returns {Promise<boolean>} Success status
   */
  async deleteProfilePicture(imageUrl) {
    try {
      if (!imageUrl) {
        console.log('🔍 No image URL provided, skipping deletion');
        return true;
      }

      // Extract filename from URL - handle different URL formats
      let fileName;
      
      if (imageUrl.includes('/storage/v1/object/public/profile_pictures/')) {
        // Standard Supabase public URL format
        fileName = imageUrl.split('/profile_pictures/').pop();
      } else {
        // Fallback: get the last part after final slash
        fileName = imageUrl.split('/').pop();
      }
      
      if (!fileName || fileName.includes('?') || fileName.includes('#')) {
        // Clean up query parameters or fragments
        fileName = fileName.split('?')[0].split('#')[0];
      }
      
      if (!fileName) {
        console.log('⚠️ Could not extract filename from URL:', imageUrl);
        return true; // Don't fail the upload if we can't delete
      }

      console.log('🗑️ Deleting profile picture:', fileName);
      console.log('🔗 Original URL:', imageUrl);

      const { error } = await supabase.storage
        .from('profile_pictures')
        .remove([fileName]);

      if (error) {
        console.error('❌ Delete error:', error);
        return false;
      }

      console.log('✅ Profile picture deleted successfully');
      return true;

    } catch (error) {
      console.error('❌ Delete profile picture failed:', error);
      return false;
    }
  }

  /**
   * Verify that an image URL is accessible
   * @param {string} url - Image URL to verify
   * @returns {Promise<boolean>} Whether the URL is accessible
   */
  async verifyImageUrl(url) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const isAccessible = response.ok;
      console.log('🔍 Image URL verification:', isAccessible ? '✅ Accessible' : '❌ Not accessible');
      return isAccessible;
    } catch (error) {
      console.log('🔍 Image URL verification: ❌ Failed to verify');
      return false;
    }
  }

  /**
   * Test bucket connectivity and permissions
   * @returns {Promise<boolean>} Whether bucket is accessible
   */
  async testBucketAccess() {
    try {
      console.log('🧪 Testing profile_pictures bucket access...');
      
      // Try to list files (this tests read access)
      const { data, error } = await supabase.storage
        .from('profile_pictures')
        .list('', { limit: 1 });

      if (error) {
        console.error('❌ Bucket access test failed:', error);
        return false;
      }

      console.log('✅ Bucket access test successful');
      return true;

    } catch (error) {
      console.error('❌ Bucket access test error:', error);
      return false;
    }
  }

  /**
   * List all profile pictures for a specific user (for cleanup purposes)
   * @param {string} userId - User ID to search for
   * @returns {Promise<string[]>} Array of filenames belonging to the user
   */
  async listUserImages(userId) {
    try {
      const { data, error } = await supabase.storage
        .from('profile_pictures')
        .list('', { limit: 100 });

      if (error) {
        console.error('❌ Failed to list user images:', error);
        return [];
      }

      // Filter files that belong to this user
      const userFiles = data
        .filter(file => file.name.includes(`profile_${userId}_`))
        .map(file => file.name);

      console.log(`🔍 Found ${userFiles.length} images for user ${userId}`);
      return userFiles;

    } catch (error) {
      console.error('❌ Error listing user images:', error);
      return [];
    }
  }

  /**
   * Clean up old profile pictures for a user (keeps only the most recent)
   * @param {string} userId - User ID to clean up
   * @param {number} keepCount - Number of most recent images to keep (default: 1)
   * @returns {Promise<number>} Number of images deleted
   */
  async cleanupUserImages(userId, keepCount = 1) {
    try {
      const userImages = await this.listUserImages(userId);
      
      if (userImages.length <= keepCount) {
        console.log(`✅ User ${userId} has ${userImages.length} images, no cleanup needed`);
        return 0;
      }

      // Sort by timestamp (newest first) and keep only the specified count
      const sortedImages = userImages.sort((a, b) => {
        const timestampA = a.match(/_(\d+)\./)?.[1] || '0';
        const timestampB = b.match(/_(\d+)\./)?.[1] || '0';
        return parseInt(timestampB) - parseInt(timestampA);
      });

      const imagesToDelete = sortedImages.slice(keepCount);
      
      if (imagesToDelete.length === 0) {
        return 0;
      }

      console.log(`🧹 Cleaning up ${imagesToDelete.length} old images for user ${userId}`);

      const { error } = await supabase.storage
        .from('profile_pictures')
        .remove(imagesToDelete);

      if (error) {
        console.error('❌ Cleanup failed:', error);
        return 0;
      }

      console.log(`✅ Successfully deleted ${imagesToDelete.length} old images`);
      return imagesToDelete.length;

    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      return 0;
    }
  }
}

// Export singleton instance
export default new ProfilePictureService();
