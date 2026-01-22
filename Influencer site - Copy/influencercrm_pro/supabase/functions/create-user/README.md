# Create User Edge Function

This edge function handles admin user creation in Supabase Auth.

## Setup

1. **Deploy the function:**
   ```bash
   supabase functions deploy create-user
   ```

2. **Set environment variables:**
   The function requires these environment variables (set in Supabase Dashboard > Edge Functions > create-user > Settings):
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (found in Project Settings > API)

3. **Verify deployment:**
   After deployment, the function will be available at:
   `https://[your-project-ref].supabase.co/functions/v1/create-user`

## Usage

The function is called automatically by the `createUser` service in `src/services/userManagementService.js`.

## Testing

You can test the function manually using curl:

```bash
curl -X POST https://[your-project-ref].supabase.co/functions/v1/create-user \
  -H "Authorization: Bearer [your-access-token]" \
  -H "apikey: [your-anon-key]" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User",
    "roleId": "[role-uuid]",
    "isActive": true
  }'
```

## Troubleshooting

- If you get "Function not found", make sure the function is deployed
- If you get "Missing authorization header", ensure you're logged in
- If you get "Failed to create user", check the Supabase logs for detailed error messages

