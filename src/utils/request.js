import axios from 'axios'
import md5 from 'md5'
import qs from 'query-string'
const request = axios.create({
  baseURL:
    process.env.NODE_ENV === 'production'
      ? 'https://ipassby.cloud'
      : 'http://localhost:9111'
})

// object对象存放每次new CancelToken生成的方法
const source = {}

// 每次请求前都会把api放在此数组中，响应成功后清除此请求api
let requestList = []
// 参数不同，url相同，不需要取消，这时source的key应该设置为md5(fullUrl)
let whitelist = []
// 参数不同，url相同，需要取消，这时source的key应该设置为md5(url)
let shouldCancelList = []
whitelist = whitelist.map(el => md5(el))
shouldCancelList = shouldCancelList.map(el => md5(el))

request.interceptors.request.use(config => {
  // 针对get请求，取消上一次url相同的请求
  const url = md5(config.url)
  const fullUrl = md5(config.url + JSON.stringify(config.params))

  if (isNormalCancel(fullUrl, config) || isInWhitelist(url, fullUrl, config)) {
    cancelRequest(fullUrl)
    delete source[fullUrl]
  }

  if (isInShouldCancelList(url, config)) {
    cancelRequest(url)
    delete source[url]
  }

  const cfg = {
    // source对象保存取消方法
    cancelToken: new axios.CancelToken(function executor(c) {
      if (shouldCancelList.includes(url)) {
        source[url] = c
        requestList.push(url)
      } else {
        source[fullUrl] = c
        requestList.push(fullUrl)
      }
    }),
    ...config
  }

  if (cfg.method === 'post' || cfg.method === 'put' || cfg.method === 'patch') {
    cfg.data = qs.stringify(config.data)
    cfg.headers['Content-Type'] =
      'application/x-www-form-urlencoded;charset=UTF-8'
  }

  config.withCredentials = true

  return cfg
})

request.interceptors.response.use(
  res => {
    // 请求完成后，将此请求从请求列表中移除
    const fullUrl = md5(res.config.url)
    const frontIndex = fullUrl.indexOf('/api')
    const tailIndex =
      fullUrl.indexOf('?') > 0 ? fullUrl.indexOf('?') : fullUrl.length
    const url = fullUrl.substring(frontIndex, tailIndex)
    requestList = requestList.filter(el => el === url)
    delete source[url]
    return Promise.resolve(res)
  },
  err => {
    return Promise.reject(err)
  }
)

function cancelRequest(api, allCancel = false) {
  // 请求列表里存在此api，即发起重复请求，把之前的请求取消掉
  if (requestList.includes(api) && typeof source[api] === 'function') {
    source[api]('终止请求')
  } else if (!api && allCancel) {
    // allCancel为true则请求列表里的请求全部取消
    requestList.forEach(el => {
      source[el]('批量终止请求')
    })
  }
}

function isInWhitelist(url, fullUrl, config) {
  return (
    requestList.length > 0 &&
    fullUrl in source &&
    whitelist.includes(url) &&
    config.method === 'get'
  )
}

function isInShouldCancelList(url, config) {
  return (
    requestList.length > 0 &&
    url in source &&
    shouldCancelList.includes(url) &&
    config.method === 'get'
  )
}

function isNormalCancel(fullUrl, config) {
  return requestList.length > 0 && fullUrl in source && config.method === 'get'
}

export default request.request
