const path = require('path')
const webpack = require('webpack')
const isProduction = process.env.NODE_ENV === 'production' // 是否是生产环境
const CompressionWebpackPlugin = require('compression-webpack-plugin') // 开启gzip压缩， 按需引用
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
/**
 * 代码压缩工具
 *
 * @dependency terser-webpack-plugin
 */
const TerserPlugin = require('terser-webpack-plugin')

const port = 9111

/**
 * 普通代理模式
 */
const devProxy = {
  '/api': {
    target: 'http://localhost:8080', // 代理的 API 地址
    changeOrigin: true, // 将主机标头的原点更改为目标URL
    secure: false,
    pathRewrite: {
      '^/api': ''
    }
  }
}

function getExternals() {
  return {
    'ant-design-vue': 'antd',
    // eslint-disable-next-line prettier/prettier
    vue: 'Vue',
    'vue-router': 'VueRouter',
    // eslint-disable-next-line prettier/prettier
    vuex: 'Vuex',
    // eslint-disable-next-line prettier/prettier
    axios: 'axios',
    // eslint-disable-next-line prettier/prettier
    nprogress: 'NProgress'
  }
}

module.exports = {
  indexPath: 'index.html',
  assetsDir: 'static',
  lintOnSave: false,

  // 部署应用包时的基本 URL 为相对路径
  publicPath: './',

  // 生产环境下的 source map
  productionSourceMap: false,

  //代理
  devServer: {
    port: port,
    proxy: devProxy
  },

  css: {
    extract: isProduction,
    requireModuleExtension: true,
    loaderOptions: {
      less: {
        javascriptEnabled: true
      }
    }
  },

  pluginOptions: {},

  configureWebpack: {
    plugins: [
      new CompressionWebpackPlugin({
        filename: '[path].gz[query]',
        algorithm: 'gzip',
        test: /\.(js|css|html)(\?.*)?$/i,
        threshold: 10240,
        minRatio: 0.8
      }),
      new webpack.ContextReplacementPlugin(/moment[\\/]locale$/, /zh-cn/) // 只引入 moment 的中文包
      // new BundleAnalyzerPlugin({ analyzerPort: 8888 }) //生产模式开启查看打包分析结果
    ],
    devtool: !isProduction ? 'cheap-module-eval-source-map' : false,
    performance: {
      // 控制webpack如何通知超出特定文件限制的资产和入口点
      hints: false // 关闭提示
    },
    externals: process.env.NODE_ENV === 'production' ? getExternals() : {},
    optimization: {
      minimizer: [
        // ============代码压缩 start============
        new TerserPlugin({
          cache: true,
          parallel: true,
          sourceMap: false, // Must be set to true if using source-maps in production
          extractComments: true, // 删除注释
          terserOptions: {
            // https://github.com/webpack-contrib/terser-webpack-plugin#terseroptions
            output: {
              comments: true // 删除注释
            },
            compress: {
              warnings: false, // 若打包错误，则注释这行
              drop_debugger: true,
              drop_console: true,
              pure_funcs: ['console.log']
            }
          }
        })
        // ============代码压缩 end============
      ],
      splitChunks: {
        cacheGroups: {
          // eslint-disable-next-line prettier/prettier
          vendor: {
            chunks: 'all',
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            minChunks: 1,
            maxInitialRequests: 5,
            minSize: 0,
            priority: 100
          },
          'async-vendors': {
            test: /[\\/]node_modules[\\/]/,
            minChunks: 1,
            chunks: 'async',
            name: 'async-vendors'
          },
          // eslint-disable-next-line prettier/prettier
          commons: {
            name: 'chunk-commons',
            test: path.join(__dirname, 'src/components'), // can customize your rules
            maxInitialRequests: 5,
            minSize: 0,
            priority: 60,
            reuseExistingChunk: true
          },
          // eslint-disable-next-line prettier/prettier
          runtimeChunk: {
            name: 'manifest'
          }
        }
      }
    }
  },

  runtimeCompiler: true
}
