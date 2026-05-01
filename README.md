# Site Butler

A Chrome extension that blocks distracting websites until you complete a breathing exercise. Inspired by Apple Watch Mindfulness.

## How it works

1. Click the extension icon and block any site you're currently visiting
2. When you navigate to a blocked site, you're redirected to a breathing exercise
3. Complete the configured number of breaths (inhale/exhale cycles)
4. Choose whether to continue to the site or close the tab

The breathing count is configurable (1-10, default 3). Manage all blocked sites from the settings page.

## Development

```bash
npm install
npm run dev
```

Load the `dist/` folder as an unpacked extension in `chrome://extensions` (Developer mode). Changes hot-reload automatically during development.

## Production build

```bash
npm run build
```

## Tech stack

- React, TypeScript, Vite
- Tailwind CSS, Lucide Icons
- Chrome Manifest V3 (declarativeNetRequest)
- [@crxjs/vite-plugin](https://github.com/crxjs/chrome-extension-tools)
