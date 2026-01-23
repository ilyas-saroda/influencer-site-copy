# 🔧 Login Authentication Debug Guide

## 🚨 **Issue Identified**
The "Database error granting user" error occurs because the `profiles` table has **missing Row Level Security (RLS) policies**. When a user successfully authenticates with Supabase, the AuthContext tries to load their profile from the `profiles` table, but gets blocked by RLS.

## 🛠️ **Immediate Fix Required**

### **Step 1: Run the RLS Fix Script**
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the entire contents of `FIX_LOGIN_RLS_POLICIES.sql`
4. **Click "Run"** to execute the script

### **Step 2: Verify the Fix**
After running the script, you should see:
- ✅ "Login RLS Policies Fix Complete!" message
- ✅ Policy verification results showing profiles and users policies
- ✅ User count verification

### **Step 3: Test Login**
1. Clear browser cache (Ctrl+Shift+R)
2. Try logging in again with your credentials
3. Check browser console for detailed logs

## 🔍 **What the Fix Does**

### **RLS Policies Created**
```sql
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile  
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
```

### **Automatic Profile Creation**
- Creates missing profiles for existing auth users
- Sets up trigger to auto-create profiles for new users
- Handles both `profiles` and `users` tables

## 🐛 **Debugging Steps if Still Failing**

### **1. Check Browser Console**
Open browser dev tools (F12) and look for:
- 🔍 "Loading profile for user: [UUID]"
- 🔍 "Profile query result: { data, error }"
- ❌ Any red error messages

### **2. Common Error Patterns**

#### **RLS Permission Error**
```
❌ Profile load error details: {
  code: "42501",
  message: "permission denied for table profiles"
}
🚨 RLS Permission Error - This usually means:
   1. RLS policies are missing on the profiles table
   2. The user does not have a profile record
   3. The RLS policy does not allow the user to read their own profile
   SOLUTION: Run FIX_LOGIN_RLS_POLICIES.sql in Supabase SQL Editor
```

#### **Missing Profile Error**
```
⚠️ No profile found for user: [UUID]
🔧 Attempting to create profile for existing user...
✅ Created profile for existing user: { profile data }
```

#### **Invalid Credentials Error**
```
❌ Supabase auth error: {
  message: "Invalid login credentials"
}
```

### **3. Manual Database Verification**
Run these queries in Supabase SQL Editor:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('profiles', 'users');

-- Check current user
SELECT auth.uid(), current_user;

-- Test profile access
SELECT * FROM public.profiles WHERE id = auth.uid();

-- Check if policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename IN ('profiles', 'users');
```

## 🔧 **Advanced Troubleshooting**

### **If User Profile Still Missing**
```sql
-- Manually create profile for specific user
INSERT INTO public.profiles (id, email, full_name)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name
FROM auth.users au
WHERE au.email = 'your-email@example.com';
```

### **If RLS Still Not Working**
```sql
-- Temporarily disable RLS for testing (NOT FOR PRODUCTION)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Test login, then re-enable
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

## 📋 **Prevention Checklist**

### **Before Production Deployment**
- [ ] Run `FIX_LOGIN_RLS_POLICIES.sql` in production
- [ ] Verify all auth users have corresponding profiles
- [ ] Test login with multiple user roles
- [ ] Check RLS policies are correctly applied
- [ ] Verify auto-creation trigger works

### **Regular Maintenance**
- [ ] Monitor auth.user vs profiles table consistency
- [ ] Check RLS policy effectiveness
- [ ] Review audit logs for auth failures
- [ ] Test new user signup flow

## 🚀 **Expected Flow After Fix**

1. **User enters credentials** → Supabase Auth validates
2. **Auth successful** → AuthContext receives user session
3. **Profile loading** → RLS allows user to read their own profile
4. **Profile found** → User redirected to dashboard
5. **Profile missing** → Auto-creation attempt → Success → Redirect

## 📞 **If Issues Persist**

1. **Check Supabase Project Settings**:
   - RLS should be enabled for the project
   - Auto-confirm users should be enabled during development
   - JWT settings should be correct

2. **Verify Environment Variables**:
   ```env
   VITE_SUPABASE_URL=your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Check Network/Connectivity**:
   - No ad blockers blocking Supabase
   - Correct project URL in .env
   - Valid API keys

---

## ✅ **Success Indicators**

After successful fix, you should see:
- ✅ Login completes without errors
- ✅ Console shows "✅ Profile loaded successfully"
- ✅ User redirected to executive dashboard
- ✅ Toast notification "Welcome back, [email]!"
- ✅ No "Database error granting user" message

The login system should now work seamlessly with proper RLS protection and automatic profile management!
