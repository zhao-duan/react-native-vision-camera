const TAG = 'CameraUtils'

const Utils = {
  //节流
  throttle(fn, interval) {
    // 1.记录上一次的开始时间
    let lastTime = 0

    // 2.事件触发时, 真正执行的函数
    const _throttle = function () {

      // 2.1.获取当前事件触发时的时间
      const nowTime = new Date().getTime()

      // 2.2.使用当前触发的时间和之前的时间间隔以及上一次开始的时间, 计算出还剩余多长时间需要去触发函数
      const remainTime = interval - (nowTime - lastTime)
      //第一次会执行，原因是nowTime刚开始是一个很大的数字，结果为负数
      //若最后一次没能满足条件，不会执行
      if (remainTime <= 0) {
        // 2.3.真正触发函数
        fn()
        // 2.4.保留上次触发的时间
        lastTime = nowTime
      }
    }
    return _throttle
  },
  isEmptyObject(obj) {
    return Object.keys(obj).length === 0;
  }

}

export default Utils