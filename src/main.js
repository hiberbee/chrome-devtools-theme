import App from './App.svelte';

const app = new App({
  target: document.querySelector('#app'),
  hydrate: true,
});

export default app;
