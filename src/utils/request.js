import axios from 'axios';

const BASE_URL = '';
const request = axios.create({
  baseUrl: BASE_URL
});

request.interceptors.request.use(config => {
  // config.withCredentials = true;
  return config;
});

request.interceptors.response.use(
  res => {
    // ...
    return Promise.resolve(res);
  },
  err => {
    // ...
    console.log(err);
    return Promise.reject(err);
  }
);

export default request;
