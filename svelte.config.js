import adapter from "sveltekit-adapter-chrome-extension";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    appDir: "app",
    adapter: adapter(),
  },
};

export default config;
