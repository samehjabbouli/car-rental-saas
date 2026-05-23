# Easy Cars - cPanel Deployment Guide

## Deployment Steps

### 1. Upload Files to cPanel

1. Log in to cPanel at https://easy-cars.net:2083
2. Navigate to File Manager
3. Go to `public_html` or the domain root
4. Upload the following files from the deployment package:
   - `.next/` folder (entire folder)
   - `package.json`
   - `package-lock.json`
   - `server.js`

5. Also upload these configuration files:
   - `.env.local` (create with your Supabase credentials)

### 2. Create .env.local file

Create a file named `.env.local` in the root with:

```
NEXT_PUBLIC_SUPABASE_URL=https://dyesocyzpmyzxasmgxat.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5ZXNvY3l6cG15enhhc21neGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MTE2ODgsImV4cCI6MjA5NDk4NzY4OH0.dYai4mJSAmuJL8It96eNVUxAGv25z8oQu0a2l-7Pnm8
```

### 3. Install Dependencies

In cPanel Terminal or SSH:

```bash
npm install
```

### 4. Start the Server

Run the custom server:

```bash
node server.js
```

### 5. For Production (PM2)

Install PM2 for process management:

```bash
npm install -g pm2
pm2 start server.js --name "easy-cars"
pm2 save
pm2 startup
```

## Important Notes

- The application requires Node.js (v18+)
- Make sure port 3000 is open or change the port in server.js
- Supabase credentials are already configured
- Database tables must exist in Supabase

## Database Setup

Run the SQL schema in Supabase dashboard:
- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_rls_policies.sql`
- `supabase/migrations/003_seed_data.sql`

## Test Accounts

After database setup, you can create users through the register page or use the API.

## Troubleshooting

1. **Port Already in Use**: Change port in server.js
2. **Module Not Found**: Run `npm install` again
3. **Database Errors**: Check Supabase credentials in .env.local
4. **Static Files 404**: Ensure `.next/` folder is uploaded completely