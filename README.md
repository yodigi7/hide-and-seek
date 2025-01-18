# Hide and Seek

## Pages

### /test

This is where you can play as the seeker against a random moving hider. This is where I was testing the beginning layout of my game to see how it worked and got it working totally on the client side.

### /seeker

This will try to connect to the backend as the seeker player. The game will start as soon as both people are connected.

### /hider

This is the same as the seeker endpoint but will try to connect you to the back end as the hider player instead.

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open

# to make available on LAN across devices
npm run dev -- --host
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.
