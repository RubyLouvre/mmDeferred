function Promise(fn) {
    if (typeof this !== "object")
        throw new TypeError("Promises must be constructed via new")
    if (typeof fn !== "function")
        throw new TypeError("not a function")
    var state = "pending"
    var value = null
    var callbacks = []
    var self = this

    this.then = function (onFulfilled, onRejected) {
        return new self.constructor(function (resolve, reject) {
            handle(handlerFactory(onFulfilled, onRejected, resolve, reject))
        })
    }

    function handle(deferred) {
        if (state === "pending") {
            callbacks.push(deferred)
            return
        };
        (function () {
            var cb = state ? deferred.onFulfilled : deferred.onRejected
            if (cb === null) {
                (state ? deferred.resolve : deferred.reject)(value)
                return
            }
            var ret
            try {
                ret = cb(value)
            } catch (e) {
                deferred.reject(e)
                return
            }
            deferred.resolve(ret)
        })()
    }

    function resolve(newValue) {
        try { //Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
            if (newValue === self)
                throw new TypeError("A promise cannot be resolved with itself.")
            //如果传入的是一个Promise或是一个thenable对象
            if (newValue && (typeof newValue === "object" || typeof newValue === "function")) {
                var then = newValue.then
                if (typeof then === "function") {
                    doResolve(then.bind(newValue), resolve, reject)
                    return
                }
            }
            state = true
            value = newValue
            finale()
        } catch (e) {
            reject(e)
        }
    }

    function reject(newValue) {
        state = false
        value = newValue
        finale()
    }

    function finale() {
        for (var i = 0, len = callbacks.length; i < len; i++)
            handle(callbacks[i])
        callbacks = null
    }

    doResolve(fn, resolve, reject)
}


function handlerFactory(onFulfilled, onRejected, resolve, reject) {
    return {
        onFulfilled: typeof onFulfilled === "function" ? onFulfilled : null,
        onRejected: typeof onRejected === "function" ? onRejected : null,
        resolve: resolve,
        reject: reject
    }
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve(fn, onFulfilled, onRejected) {
    var done = false;
    try {
        fn(function (value) {
            if (done)
                return
            done = true
            onFulfilled(value)
        }, function (reason) {
            if (done)
                return
            done = true
            onRejected(reason)
        })
    } catch (ex) {
        if (done)
            return
        done = true
        onRejected(ex)
    }
}