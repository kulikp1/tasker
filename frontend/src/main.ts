import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { MotionPlugin } from '@vueuse/motion';
import VueViewer from 'v-viewer';
import App from './App.vue';
import router from './router';
import './lib/chartSetup';
import './assets/main.css';
import 'viewerjs/dist/viewer.css';

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(MotionPlugin);
app.use(VueViewer);
app.mount('#app');
