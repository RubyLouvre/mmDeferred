
function _resolve(promise, value) {//触发成功回调
    if (promise._state !== "pending")
        return;
    if (value && typeof value.then === "function") {
//thenable对象使用then，Promise实例使用_then
        var method = value instanceof msPromise ? "_then" : "then"
        value[method](function (val) {
            _transmit(promise, val, true)
        }, function (reason) {
            _transmit(promise, reason, false)
        });
    } else {
        _transmit(promise, value, true);
    }
}
function _reject(promise, value) {//触发失败回调
    if (promise._state !== "pending")
        return
    _transmit(promise, value, false)
}



var msPromise = function (executor) {
    this._callbacks = []
    var me = this
    if (typeof this !== "object")
        throw new TypeError("Promises must be constructed via new")
    if (typeof executor !== "function")
        throw new TypeError("not a function")

    var state = "pending"
    var lock = {}
    var fireArgs = lock
    var doneList = []
    var failList = []

    executor(function (value) {
        if (state === "pending") //如果还处于原始状态,才可以resolve
            _resolve(me, doneList, value, fired)
    }, function (reason) {
        if (state === "pending")//如果还处于原始状态,才可以reject
            _reject(me, failList, reason, fired)
    })

    this.then = function (onFulfilled, onRejected) {
        
        onFulfilled = typeof onFulfilled === "function" ? onFulfilled : ok
        onRejected = typeof onRejected === "function" ? onRejected : ng
        doneList.push(onFulfilled)
        failList.push(onRejected)
        return new msPromise(function () {

        })

    }
}