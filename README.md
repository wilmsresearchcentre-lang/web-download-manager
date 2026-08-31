# Web Download Manager

Fast media download manager with multi-thread streaming, browser extension export, and live media URL handling.

## Local run

1. Install dependencies:
   `npm install`
2. Start the app:
   `npm run dev`
3. Open:
   `http://localhost:3000`

## Production / Render deploy

This project is already set up for production-style hosting because `npm run build` creates `dist/server.cjs` and `npm run start` launches the Express server.

1. Push this repo to GitHub
2. Create a new Render service
3. Set the build command:
   `npm install && npm run build`
4. Set the start command:
   `npm run start`
5. Use environment variable:
   `PORT=3000`

## Notes

- The server listens on `0.0.0.0` for hosted deployments.
- `npm run build` was verified successfully earlier in this environment.