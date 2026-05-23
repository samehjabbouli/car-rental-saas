# Easy Cars Deployment Guide

## Current Status: 80% Complete ✅

All application files have been successfully uploaded and extracted to your cPanel hosting.

---

## Remaining Setup Steps (Manual - 5 minutes)

Since cPanel API doesn't provide Node.js application management, you'll need to complete the setup via the web interface.

### Step 1: Setup Node.js Application in cPanel

1. **Login to cPanel**
   - URL: https://easy-cars.net:2083
   - Username: `easysql`
   - Password: `Samehraul77`

2. **Navigate to Node.js App Setup**
   - Go to **Software** → **Setup Node.js App**
   - Click **Create Application**

3. **Configure the Application**
   | Setting | Value |
   |---------|-------|
   | **App mode** | Production |
   | **Node.js version** | 18.x or 20.x (latest stable) |
   | **Application root** | `/home/easycars/nextjs-app` |
   | **Application startup file** | `server.js` |
   | **Application URL** | `easy-cars.net` (or leave blank) |

4. **Click Create**

### Step 2: Install Dependencies

1. After creating the app, cPanel will show the application details
2. Click **Edit** to open the terminal or use **Run NPM Install**
3. Or connect via SSH (if enabled) and run:
   ```bash
   cd /home/easycars/nextjs-app
   npm install
   npm run build
   ```

### Step 3: Start the Application

1. In the Node.js App setup page, click **Start/Restart**
2. The application should now be running

---

## Verification

Test the application by visiting:
- **https://easy-cars.net** - Should show the Easy Cars login page
- **https://easy-cars.net/api/health** - Should return JSON response

---

## Files Location on Server

```
/home/easycars/nextjs-app/
├── .env.local          # Environment variables (Supabase credentials)
├── .next/              # Production build
├── package.json         # Dependencies
├── server.js           # Custom Node.js server
└── src/                # Source code
```

---

## Support

If you encounter issues:
1. Check the Node.js application log in cPanel
2. Verify environment variables are set correctly
3. Ensure the port matches between cPanel and server.js

---

## Alternative: Contact Hosting Provider

If you're unable to complete these steps, contact your hosting provider and ask them to:
1. Enable Node.js support
2. Create a Node.js application pointing to `/home/easycars/nextjs-app`
3. Set the startup file to `server.js`
4. Run `npm install` and `npm run build`