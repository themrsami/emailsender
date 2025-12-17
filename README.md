# Mail Sender

A modern email automation app built with Next.js and Server Actions. Send batch emails with scheduling, delays, and optional CV attachments.

## Features

- **Password Protected** - Secure access with site password
- **Two Sending Modes:**
  - **Server-Side (QStash)** - Close browser anytime, emails sent automatically
  - **Client-Side** - Real-time progress, browser must stay open
- **Batch Email Processing** - Upload JSON file with multiple emails
- **CV Attachment** - Optional PDF attachment for all emails
- **Random Delays** - Configurable min/max delay between emails
- **Schedule Sending** - Pick date/time with custom calendar
- **Progress Tracking** - Real-time success/failure display

## Tech Stack

- Next.js 16 with App Router
- Server Actions
- Nodemailer (Gmail SMTP)
- Upstash QStash (server-side scheduling)
- Lucide React Icons
- TypeScript

## Setup

### 1. Clone and Install

```bash
git clone https://github.com/themrsami/emailsender.git
cd emailsender
pnpm install
```

### 2. Environment Variables

Create `.env.local`:

```env
# Site Password
SITE_PASSWORD=your_password_here

# QStash (from https://upstash.com)
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=your_token
QSTASH_CURRENT_SIGNING_KEY=your_signing_key
QSTASH_NEXT_SIGNING_KEY=your_next_signing_key

# App URL (set after deploying to Vercel)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 3. Gmail App Password

1. Enable 2-Step Verification on your Google account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Generate a new app password for "Mail"
4. Use this password in the app (not your regular Gmail password)

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## JSON Email Format

```json
[
  {
    "to": "recipient@example.com",
    "subject": "Email Subject",
    "body": "Email body content here.\n\nUse \\n for new lines."
  },
  {
    "to": "another@example.com",
    "subject": "Another Subject",
    "body": "Another email body."
  }
]
```

## Deployment (Vercel)

1. Push to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Add all environment variables
4. Deploy
5. Update `NEXT_PUBLIC_APP_URL` with your Vercel URL
6. Redeploy

## How It Works

### Client-Side Mode
- Browser sends emails one by one
- Waits random delay between min/max
- Shows real-time progress
- **Browser must stay open**

### Server-Side Mode (QStash)
- Emails queued to Upstash QStash
- QStash calls `/api/send-queued-email` at scheduled times
- **Browser can be closed after queuing**
- Uses delay in seconds (timezone independent)

## License

MIT
