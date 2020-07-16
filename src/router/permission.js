import 'nprogress/nprogress.css';
import NProgress from 'nprogress';
import router from './index';
router.beforeEach((to, from, next) => {
  // ...
  NProgress.start();
  next();
  NProgress.done();
});
router.afterEach(() => {
  NProgress.done();
});
