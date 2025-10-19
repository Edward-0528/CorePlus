/**
 * Test script to verify Supabase profile_pictures bucket setup
 * Run this to check if your bucket is properly configured
 */

import { supabase } from './supabaseConfig.js';

const testProfilePicturesBucket = async () => {
  console.log('🧪 Testing profile_pictures bucket configuration...\n');

  try {
    // Test 1: Check if bucket exists and is accessible
    console.log('1️⃣ Testing bucket access...');
    const { data: listData, error: listError } = await supabase.storage
      .from('profile_pictures')
      .list('', { limit: 1 });

    if (listError) {
      console.error('❌ Bucket access failed:', listError);
      console.log('💡 Make sure:');
      console.log('   - Bucket "profile_pictures" exists in Supabase Storage');
      console.log('   - Bucket is set to public or has proper RLS policies');
      console.log('   - Your Supabase project URL and anon key are correct');
      return false;
    }

    console.log('✅ Bucket access successful');

    // Test 2: Check bucket policies
    console.log('\n2️⃣ Testing upload permissions...');
    
    // Create a tiny test file
    const testBlob = new Blob(['test'], { type: 'text/plain' });
    const testFileName = `test_${Date.now()}.txt`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile_pictures')
      .upload(testFileName, testBlob);

    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError);
      console.log('💡 Check RLS policies for profile_pictures bucket:');
      console.log('   - Allow INSERT for authenticated users');
      console.log('   - Allow SELECT for public access (for viewing images)');
      return false;
    }

    console.log('✅ Upload permissions working');

    // Test 3: Check public URL generation
    console.log('\n3️⃣ Testing public URL generation...');
    
    const { data: urlData } = supabase.storage
      .from('profile_pictures')
      .getPublicUrl(testFileName);

    if (!urlData?.publicUrl) {
      console.error('❌ Public URL generation failed');
      return false;
    }

    console.log('✅ Public URL generated:', urlData.publicUrl);

    // Test 4: Cleanup test file
    console.log('\n4️⃣ Cleaning up test file...');
    
    const { error: deleteError } = await supabase.storage
      .from('profile_pictures')
      .remove([testFileName]);

    if (deleteError) {
      console.warn('⚠️ Could not clean up test file:', deleteError);
    } else {
      console.log('✅ Test file cleaned up');
    }

    console.log('\n🎉 All tests passed! Profile pictures bucket is properly configured.');
    console.log('\n📝 Recommended RLS policies for profile_pictures bucket:');
    console.log('');
    console.log('1. INSERT policy (for uploads):');
    console.log('   - Target: INSERT');
    console.log('   - Policy: auth.uid()::text = (storage.foldername(name))[1]');
    console.log('   - Description: Users can only upload to their own folder');
    console.log('');
    console.log('2. SELECT policy (for viewing):');
    console.log('   - Target: SELECT');
    console.log('   - Policy: true');
    console.log('   - Description: Anyone can view profile pictures');
    console.log('');
    console.log('3. DELETE policy (for cleanup):');
    console.log('   - Target: DELETE');
    console.log('   - Policy: auth.uid()::text = (storage.foldername(name))[1]');
    console.log('   - Description: Users can only delete their own files');

    return true;

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
};

// Export for manual testing
export default testProfilePicturesBucket;

// Auto-run if this file is executed directly
if (typeof window === 'undefined') {
  testProfilePicturesBucket();
}
