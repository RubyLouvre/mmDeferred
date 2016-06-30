var nativePromise = window.Promise
if (/native code/.test(nativePromise)) {
    module.exports = nativePromise
} else {
    var RESOLVED = 0
    var REJECTED = 1
    var PENDING = 2


    function Promise(executor) {

        this.state = PENDING
        this.value = undefined
        this.deferred = []

        var promise = this

        try {
            executor(function (x) {
                promise.resolve(x)
            }, function (r) {
                promise.reject(r)
            })
        } catch (e) {
            promise.reject(e)
        }
    }

    Promise.reject = function (r) {
        return new Promise(function (resolve, reject) {
            reject(r)
        })
    }

    Promise.resolve = function (x) {
        return new Promise(function (resolve, reject) {
            resolve(x)
        })
    }

    Promise.all = function (iterable) {
        return new Promise(function (resolve, reject) {
            var count = 0, result = []

            if (iterable.length === 0) {
                resolve(result)
            }

            function resolver(i) {
                return function (x) {
                    result[i] = x
                    count += 1

                    if (count === iterable.length) {
                        resolve(result)
                    }
                }
            }

            for (var i = 0; i < iterable.length; i += 1) {
                Promise.resolve(iterable[i]).then(resolver(i), reject)
            }
        })
    }

    Promise.race = function (iterable) {
        return new Promise(function (resolve, reject) {
            for (var i = 0; i < iterable.length; i += 1) {
                Promise.resolve(iterable[i]).then(resolve, reject)
            }
        })
    }

    var p = Promise.prototype

    p.resolve = function resolve(x) {
        var promise = this

        if (promise.state === PENDING) {
            if (x === promise) {
                throw new TypeError('Promise settled with itself.')
            }

            var called = false

            try {
                var then = x && x['then']

                if (x !== null && typeof x === 'object' && typeof then === 'function') {
                    then.call(x, function (x) {
                        if (!called) {
                            promise.resolve(x)
                        }
                        called = true

                    }, function (r) {
                        if (!called) {
                            promise.reject(r)
                        }
                        called = true
                    })
                    return
                }
            } catch (e) {
                if (!called) {
                    promise.reject(e)
                }
                return
            }

            promise.state = RESOLVED
            promise.value = x
            promise.notify()
        }
    }

    p.reject = function reject(reason) {
        var promise = this

        if (promise.state === PENDING) {
            if (reason === promise) {
                throw new TypeError('Promise settled with itself.')
            }

            promise.state = REJECTED
            promise.value = reason
            promise.notify()
        }
    }

    p.notify = function notify() {
        var promise = this

        nextTick(function () {
            if (promise.state !== PENDING) {
                while (promise.deferred.length) {
                    var deferred = promise.deferred.shift(),
                            onResolved = deferred[0],
                            onRejected = deferred[1],
                            resolve = deferred[2],
                            reject = deferred[3]

                    try {
                        if (promise.state === RESOLVED) {
                            if (typeof onResolved === 'function') {
                                resolve(onResolved.call(undefined, promise.value))
                            } else {
                                resolve(promise.value)
                            }
                        } else if (promise.state === REJECTED) {
                            if (typeof onRejected === 'function') {
                                resolve(onRejected.call(undefined, promise.value))
                            } else {
                                reject(promise.value)
                            }
                        }
                    } catch (e) {
                        reject(e)
                    }
                }
            }
        })
    }

    p.then = function then(onResolved, onRejected) {
        var promise = this

        return new Promise(function (resolve, reject) {
            promise.deferred.push([onResolved, onRejected, resolve, reject])
            promise.notify()
        })
    }

    p.catch = function (onRejected) {
        return this.then(undefined, onRejected)
    }


    function oneObject(array, val) {
        if (typeof array === "string") {
            array = array.match(rword) || []
        }
        var result = {},
                value = val !== void 0 ? val : 1
        for (var i = 0, n = array.length; i < n; i++) {
            result[array[i]] = value
        }
        return result
    }


    /*视浏览器情况采用最快的异步回调*/
    var nextTick = new function () {// jshint ignore:line
        var tickImmediate = window.setImmediate
        var tickObserver = window.MutationObserver
        if (tickImmediate) {
            return tickImmediate.bind(window)
        }

        var queue = []
        function callback() {
            var n = queue.length
            for (var i = 0; i < n; i++) {
                queue[i]()
            }
            queue = queue.slice(n)
        }

        if (tickObserver) {
            var node = document.createTextNode("avalon")
            new tickObserver(callback).observe(node, {characterData: true})// jshint ignore:line
            var bool = false
            return function (fn) {
                queue.push(fn)
                bool = !bool
                node.data = bool
            }
        }


        return function (fn) {
            setTimeout(fn, 4)
        }
    }

    module.exports = Promise
}


//https://github.com/ecomfe/er/blob/master/src/Deferred.js
//http://jser.info/post/77696682011/es6-promises
