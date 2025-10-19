# 🖼️ Profile Pictures Setup Guide

## 📋 **Current Issue**
When users try to upload a profile picture in the Edit Profile modal, it errors out because the image has nowhere to go. The code was trying to upload to a bucket called `'profile-images'` but your Supabase has a bucket called `'profile_pictures'`.

## ✅ **Fixed**
1. **Bucket name corrected** - Changed from `'profile-images'` to `'profile_pictures'`
2. **Enhanced error handling** - Added detailed logging to identify issues
3. **Created ProfilePictureService** - Centralized service for all profile picture operations
4. **Added bucket testing** - Automatic testing when Edit Profile modal opens

## 🔧 **Supabase Setup Required**

### 1. **Verify Bucket Exists**
In your Supabase dashboard:
1. Go to **Storage** → **Buckets**
2. Confirm `profile_pictures` bucket exists
3. If not, create it with these settings:
   - Name: `profile_pictures`
   - Public bucket: ✅ **YES** (for easy image viewing)

### 2. **Set Up RLS Policies**
Go to **Storage** → **Buckets** → `profile_pictures` → **Policies**

#### **Policy 1: Allow Upload (INSERT)**
```sql
-- Name: "Users can upload their own profile pictures"
-- Operation: INSERT
-- Target Roles: authenticated

-- Policy Definition:
auth.uid()::text = (storage.foldername(name))[1]

-- This allows users to upload files to folders named with their user ID
```

#### **Policy 2: Allow Viewing (SELECT)**
```sql
-- Name: "Anyone can view profile pictures"
-- Operation: SELECT  
-- Target Roles: public

-- Policy Definition:
true

-- This allows anyone to view/download profile pictures (needed for displaying them)
```

#### **Policy 3: Allow Deletion (DELETE)**
```sql
-- Name: "Users can delete their own profile pictures"
-- Operation: DELETE
-- Target Roles: authenticated

-- Policy Definition:
auth.uid()::text = (storage.foldername(name))[1]

-- This allows users to delete only their own files
```

### 3. **File Structure**
With these policies, files will be stored as:
```
profile_pictures/
  ├── user-id-1/
  │   └── profile_user-id-1_timestamp.jpg
  ├── user-id-2/
  │   └── profile_user-id-2_timestamp.png
  └── ...
```

## 🧪 **Testing the Setup**

### Option 1: Automatic Test
The Edit Profile modal now automatically tests bucket access when opened. Check the console logs:
- ✅ `Bucket access test successful` = Working properly
- ❌ `Bucket access test failed` = Setup needed

### Option 2: Manual Test
Add this to your App.js temporarily:

```javascript
import testProfilePicturesBucket from './simpleProfilePicturesTest';

// In your component:
useEffect(() => {
  testProfilePicturesBucket();
}, []);
```

## 🔍 **Debugging Profile Picture Issues**

The new implementation adds detailed logging:

```
🖼️ ProfilePictureService: Starting upload
📍 URI: file:///path/to/image.jpg
👤 User ID: 12345
📁 Generated filename: profile_12345_1697462400000.jpg
📦 Blob created - Size: 145 KB
📦 Blob type: image/jpeg
☁️ Uploading to profile_pictures bucket...
✅ Upload successful: {path: "profile_12345_1697462400000.jpg"}
🔗 Public URL generated: https://your-project.supabase.co/storage/v1/object/public/profile_pictures/profile_12345_1697462400000.jpg
🔍 Image URL verification: ✅ Accessible
```

## 🚨 **Common Issues & Solutions**

### "Storage bucket not found"
- ❌ Problem: `profile_pictures` bucket doesn't exist
- ✅ Solution: Create the bucket in Supabase dashboard

### "Insufficient permissions"
- ❌ Problem: RLS policies not set up correctly
- ✅ Solution: Add the INSERT and SELECT policies above

### "Upload works but image doesn't display"
- ❌ Problem: SELECT policy missing or bucket not public
- ✅ Solution: Enable public access and add SELECT policy

### "Can't delete old images"
- ❌ Problem: DELETE policy missing
- ✅ Solution: Add DELETE policy for authenticated users

## 🎯 **Expected User Flow**
1. User taps "Edit Profile"
2. User taps profile picture area
3. User selects image from gallery
4. Image uploads to `profile_pictures/user-id/filename.jpg`
5. Public URL saves to user metadata
6. Profile picture displays in app

## 📱 **Files Modified**
- `components/modals/EditProfileModal.js` - Fixed bucket name and added service
- `services/profilePictureService.js` - New centralized service  
- `simpleProfilePicturesTest.js` - Testing utility

Your profile picture uploads should now work correctly once the Supabase bucket and policies are properly configured! 🎉
