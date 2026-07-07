# AI-Powered Website Builder App

A complete, production-ready AI-powered Website Builder consisting of a Node.js/Express API Backend, Next.js 15 Admin Dashboard Frontend, and a Cloudflare Worker for wildcard subdomain dynamic rendering.

## Project Structure

```text
ai-website-builder/
├── backend/
│   ├── src/
│   │   ├── config/          # DB connection
│   │   ├── controllers/     # REST request endpoints handlers
│   │   ├── middleware/      # JWT auth guard, roles assertion
│   │   ├── models/          # MongoDB/Mongoose schemas
│   │   ├── routes/          # REST route mounts
│   │   ├── services/        # Cloudflare KV & R2 S3 interfaces
│   │   └── app.js           # Server bootstrapper
│   ├── public/uploads/      # Fallback uploads directory (for local mock mode)
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js App Router (Dashboard, editor, logins)
│   │   ├── utils/           # API integration fetch helpers
│   │   └── components/
│   ├── package.json
│   └── tailwind.config.ts
│
└── cloudflare-worker/
    ├── src/
    │   └── index.js         # Domain router, KV fetches, HTML compilers
    └── wrangler.toml        # Cloudflare bindings
```

---

## 🚀 Quick Start (Local Development)

### 1. MongoDB Database Setup
Ensure you have a MongoDB instance running locally. By default, the backend connects to:
`mongodb://127.0.0.1:27017/ai-website-builder`

### 2. Startup Backend API
Navigate to the `backend/` folder, install packages, copy environment details, and run the server:
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```
*Note:* If you don't fill in Cloudflare R2/KV credentials in `.env`, the backend automatically falls back to:
- **Local disk files storage** for uploads (`http://localhost:5001/uploads/*`).
- **Local in-memory map storage** for KV publications.

### 3. Startup Frontend Dashboard
Navigate to the `frontend/` folder, install packages, and spin up Next.js:
```bash
cd ../frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Step-by-Step Testing Flow

1. **Create Account**:
   - Access [http://localhost:3000/login](http://localhost:3000/login).
   - Click **Register** tab.
   - Enter details. The very first user created becomes an **Admin** automatically.
   
2. **Submit Business Profile**:
   - Navigate to **Create Website** tab.
   - Input your details (Company Name: `Grip Logistics`, Category: `Logistics`, Location: `New Delhi`, description, services).
   - Upload a sample logo or gallery images.
   - Click **Save & Register**. It is saved with status `DRAFT`.

3. **Generate AI Layout**:
   - Navigate to **Websites** table.
   - Locate the newly registered company and click **Generate Website**.
   - The backend processes details and outputs standard section layouts (Hero, About, Services, Gallery, Contact) populated with tailored copywriting copy. Status changes to `GENERATED`.

4. **Customize in Builder**:
   - Click **Edit Sections** next to your company in the table.
   - Adjust theme colors, font families (Inter, Outfit, Poppins), or update SEO keywords on the left panel.
   - Move sections up/down or add new sections.
   - Click any section to reveal property inputs in the inspector panel on the right (update texts, change side images, add service items).
   - Click **Apply Changes** to save.

5. **Preview Viewports**:
   - Click **Preview** to view how the website looks on Desktop, Tablet, and Mobile screens.

6. **Publish to KV**:
   - Click **Publish Website** (or **Publish to KV** in the Editor).
   - The backend stores a snap version in MongoDB and publishes the layout payload to Cloudflare KV. Status becomes `PUBLISHED`.

---

## ☁️ Cloudflare Deployment Guide

### Cloudflare KV Setup
1. Create a KV namespace on your Cloudflare dashboard named `WEBSITE_STORE`.
2. Grab the namespace ID.
3. Update your `wrangler.toml` inside the `cloudflare-worker` folder:
   ```toml
   kv_namespaces = [
     { binding = "WEBSITE_STORE", id = "YOUR_KV_NAMESPACE_ID" }
   ]
   ```

### Cloudflare R2 Setup
1. Create an R2 bucket named `brand-assets`.
2. Navigate to **Manage R2 API Tokens** on your Account sidebar.
3. Create a token with edit permissions.
4. Retrieve the Access Key ID and Secret Access Key.
5. Provide these parameters in your backend `.env` variables list:
   ```env
   CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
   CLOUDFLARE_API_TOKEN=your_worker_api_token
   CLOUDFLARE_KV_NAMESPACE_ID=your_kv_namespace_id
   CLOUDFLARE_R2_BUCKET_NAME=brand-assets
   CLOUDFLARE_R2_ACCESS_KEY_ID=your_r2_access_key
   CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_r2_secret
   CLOUDFLARE_R2_PUBLIC_URL=https://your-r2-public-subdomain.r2.dev
   ```

### Wildcard Subdomain Mapping
1. Configure wildcard subdomains routing inside Cloudflare DNS panel:
   - Add a CNAME record: `*` pointing to your worker domain (e.g. `ai-website-builder-worker.username.workers.dev` or a custom domain).
2. The Cloudflare Worker will parse incoming request hostnames (e.g. `grip-logistics.domain.com`), read the layout JSON key `grip-logistics` from KV, and output the responsive Tailwind page immediately!
