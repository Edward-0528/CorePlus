/**
 * Simple profile pictures bucket test for React Native
 * Add this to your App.js temporarily to test the bucket
 */

import { supabase } from './supabaseConfig';

const testProfilePicturesBucket = async () => {
  console.log('🧪 Testing profile_pictures bucket...');

  try {
    // Test bucket access
    const { data, error } = await supabase.storage
      .from('profile_pictures')
      .list('', { limit: 1 });

    if (error) {
      console.error('❌ Bucket test failed:', error);
      console.log('💡 Possible issues:');
      console.log('- Bucket "profile_pictures" does not exist');
      console.log('- Incorrect RLS policies');
      console.log('- Wrong Supabase project configuration');
      return false;
    }

    console.log('✅ Bucket access successful!');
    console.log('📂 Found', data?.length || 0, 'files in bucket');
    return true;

  } catch (error) {
    console.error('❌ Test error:', error);
    return false;
  }
};

export default testProfilePicturesBucket;
