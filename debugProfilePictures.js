import { supabase } from '../supabaseConfig.js';

/**
 * Debug script to test profile picture upload functionality
 */

const testBucketAccess = async () => {
  console.log('🧪 Testing profile_pictures bucket access...');
  
  try {
    // Test 1: Check bucket exists
    const { data, error } = await supabase.storage
      .from('profile_pictures')  
      .list('', { limit: 1 });

    if (error) {
      console.error('❌ Bucket access failed:', error);
      return false;
    }

    console.log('✅ Bucket access successful!');
    console.log('📂 Found', data?.length || 0, 'files in bucket');
    
    // Test 2: Check upload permissions with a tiny test file
    const testContent = new TextEncoder().encode('test');
    const testFileName = `test_${Date.now()}.txt`;
    
    console.log('🧪 Testing upload permissions...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile_pictures')
      .upload(testFileName, testContent);
      
    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError);
      return false;
    }
    
    console.log('✅ Upload test successful:', uploadData);
    
    // Cleanup test file
    await supabase.storage
      .from('profile_pictures')
      .remove([testFileName]);
      
    console.log('🧹 Test file cleaned up');
    
    return true;
    
  } catch (error) {
    console.error('❌ Bucket test error:', error);
    return false;
  }
};

// Test the upload with simulated file
const testProfilePictureUpload = async (testUserId = 'test-user-123') => {
  console.log('🖼️ Testing profile picture upload process...');
  
  try {
    // Create a minimal test image (1x1 pixel PNG in base64)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    const testImageBuffer = Buffer.from(testImageBase64, 'base64');
    
    const fileName = `profile_${testUserId}_${Date.now()}.png`;
    
    console.log('📁 Generated filename:', fileName);
    console.log('📦 Test image size:', testImageBuffer.length, 'bytes');
    
    // Upload test image
    const { data, error } = await supabase.storage
      .from('profile_pictures')
      .upload(fileName, testImageBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });
      
    if (error) {
      console.error('❌ Profile picture upload failed:', error);
      return null;
    }
    
    console.log('✅ Upload successful:', data);
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('profile_pictures')
      .getPublicUrl(fileName);
      
    console.log('🔗 Public URL:', urlData.publicUrl);
    
    // Cleanup test file
    await supabase.storage
      .from('profile_pictures')
      .remove([fileName]);
      
    console.log('🧹 Test file cleaned up');
    
    return urlData.publicUrl;
    
  } catch (error) {
    console.error('❌ Profile picture test error:', error);
    return null;
  }
};

export { testBucketAccess, testProfilePictureUpload };
