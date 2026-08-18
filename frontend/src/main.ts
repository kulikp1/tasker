import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { MotionPlugin } from '@vueuse/motion';
import VueViewer from 'v-viewer';
import App from './App.vue';
import router from './router';
import './lib/chartSetup';
import './assets/main.css';
import 'viewerjs/dist/viewer.css';
import { logDrag } from './lib/dragDebug';

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(MotionPlugin);
app.use(VueViewer);
// TEMPORARY - see dragDebug.ts. Vue swallows lifecycle-hook errors (e.g. a failed Sortable
// init inside vuedraggable's mounted()) into its own handler instead of a raw window 'error'
// event, so the on-device debug panel needs this too or it'd never see that kind of failure.
app.config.errorHandler = (err, _instance, info) => {
  logDrag(`VUE ERROR (${info}): ${err instanceof Error ? err.message : String(err)}`);
  console.error(err);
};
app.mount('#app');
