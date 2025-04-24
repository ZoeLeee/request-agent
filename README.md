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

1. After installing the extension, click the extension icon to open the monitoring interface
2. View all network requests in the left panel
3. Click on a request to view detailed information on the right
4. Switch to the "Rules" tab to create interception rules
5. Set URL matching pattern, match type, and custom response
6. Click "Save Rule" to apply the new rule


