# Request Agent - Network Request Monitor and Interceptor

[中文文档](./README-zh.md)

This is a browser extension built with the [Plasmo framework](https://docs.plasmo.com/) for monitoring, analyzing, and intercepting network requests. The project was bootstrapped with [`plasmo init`](https://www.npmjs.com/package/plasmo).

## Features

- Real-time monitoring of all network requests in the browser
- Detailed display of request information including URL, method, timestamp, type, etc.
- Filter requests by URL, method, or type
- Create custom interception rules with exact matching, contains matching, and regex matching
- Customize response content to modify request results
- Intuitive user interface for viewing request details and editing rules

## Development Guide

### Getting Started

First, run the development server:

```bash
pnpm dev
# or
npm run dev
```

Open your browser and load the appropriate development build. For example, if you are developing for Chrome browser with Manifest V3, use: `build/chrome-mv3-dev`.

### Project Structure

- `background/index.ts`: Background script that intercepts network requests and stores request information
- `tabs/index.tsx`: Main interface that displays request list and details, allows creation and management of interception rules
- `tabs/index.css`: Main interface styles

### Customization

You can extend functionality by modifying the following files:

- Modify `background/index.ts` to enhance request interception and processing logic
- Modify `tabs/index.tsx` to improve user interface and interaction experience

For more development guidance, [visit the Plasmo Documentation](https://docs.plasmo.com/)

## Making Production Build

Run the following:

```bash
pnpm build
# or
npm run build
```

This will create a production bundle for your extension, ready to be packaged and published to various app stores.

## Submit to the Webstores

The easiest way to deploy your Plasmo extension is to use the built-in [bpp](https://bpp.browser.market) GitHub Action. Prior to using this action, make sure to build your extension and upload the first version to the store to establish basic credentials. Then, follow [this setup instruction](https://docs.plasmo.com/framework/workflows/submit) and you'll be on your way to automated submission!

## Usage Instructions

1. Open DevTools (F12) and switch to the "Request Agent" panel.
2. In the toolbar, click "Enable" to turn on Debug Mode to allow request interception and logging.
3. Use the left vertical navigation to switch views:
   - Network: real-time request list, with top filter input and "Clear Requests" action
   - Rules: manage interception rules, with filter, "New Rule" and "Clear Rules"
4. In Network view:
   - Click any request to see details (Headers, Response, etc.)
   - From details, quickly prefill a new rule based on this request (URL auto-filled)
5. In Rules view:
   - Create or edit a rule by setting "URL Pattern", "Match Type (exact/contains/regex)", and "Response Content" (prefer JSON)
   - Click "Save Rule"; when matched, requests will be intercepted and return the custom response
6. Debug Mode notes:
   - The mode auto-disables when the panel closes or on connection errors
   - Errors are shown via a top-right Toast notification
7. Notes:
   - Fetching response content directly may be limited by browser security policies for cross-origin resources
   - Headers like host/origin are filtered to avoid copying invalid headers


