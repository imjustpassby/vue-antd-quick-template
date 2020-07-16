// antd组件按需引入
// import '@/utils/antd-components.js';
// production模式可以选择cdn引入，配合webpack externals选项，减少打包体积
import antd from 'ant-design-vue';
import App from './App.vue';
import router from './router';
import store from './store';
import Vue from 'vue';
import './router/permission';
import '@/assets/style/index.less';
Vue.use(antd);
Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app');
