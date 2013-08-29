(function() {
    //http://www.codingserf.com/index.php/2013/06/dropdownlist2/
    // 允许传入一个对象，它将混入到整条Deferred链的所有Promise对象 
    function Deferred(mixin) {
        function ok(x) {
            return x
        }
        function ng(e) {
            throw e
        }
        var dfd = {
            callback: {
                resolve: ok,
                reject: ng,
                notify: ok,
                ensure: ok
            },
            dirty: false,
            state: "pending",
            promise: {
                then: function(onResolve, onReject, onNotify) {
                    return _post(onResolve, onReject, onNotify)
                },
                otherwise: function(onReject) {
                    return _post(0, onReject)
                },
                //https://github.com/cujojs/when/issues/103
                ensure: function(onEnsure) {
                    return _post(0, 0, 0, onEnsure)
                },
                _next: null
            }
        }
        if (typeof mixin === "function") {
            mixin(dfd.promise)
        } else if (mixin && typeof mixin === "object") {
            for (var i in mixin) {
                if (!dfd.promise[i]) {
                    dfd.promise[i] = mixin[i]
                }
            }
        }



//http://thanpol.as/javascript/promises-a-performance-hits-you-should-be-aware-of/
        "resolve,reject,notify".replace(/\w+/g, function(method) {
            dfd[method] = function(val) {
                var that = this, args = arguments
                //http://promisesaplus.com/ 4.1
                if (that.dirty) {
                    _fire.call(that, method, args)
                } else {
                    Deferred.nextTick(function() {
                        _fire.call(that, method, args)
                    })
                }
            }
        })
        return dfd
        function _post() {
            //  var deferred = !this.dirty ? dfd : (dfd.promise._next = Deferred(mixin))
            //  console.log(deferred.dirty)
            var index = -1, fns = arguments;
            "resolve,reject,notify, ensure".replace(/\w+/g, function(method) {
                var fn = fns[++index];
                if (typeof fn === "function") {
                    dfd.callback[method] = fn;
                    dfd.dirty = true
                }
            })
            var deferred = dfd.promise._next = Deferred(mixin)
            return deferred.promise;
        }

        function _fire(method, array) {
            var next = "resolve", value
            try {
                if (this.state === "pending" || method === "notify") {
                    var fn = this.callback[method]
                    value = fn.apply(this, array);
                    array = [value]
                    if (method !== "notify") {
                        this.state = method === "resolve" ? "fulfilled" : "rejected"
                    } else {
                        next = "notify"
                    }
                }
            } catch (e) {
                next = "reject";
                array = [e];
            }
            var ensure = this.callback.ensure
            if (ok !== ensure) {
                try {
                    ensure.call(this)
                } catch (e) {
                    next = "reject";
                    array = [e];
                }
            }
            var nextDeferred = this.promise._next
            if (Deferred.isPromise(value)) {
                value._next = nextDeferred
            } else {
                if (nextDeferred) {
                    _fire.call(nextDeferred, next, array);
                }
            }
        }

    }
    window.Deferred = Deferred;
    Deferred.isPromise = function(obj) {
        return !!(obj && typeof obj.then === "function");
    };

    function some(any, promises) {
        var deferred = Deferred(), n = 0, result = [], end
        function loop(promise, index) {
            promise.then(function(ret) {
                if (!end) {
                    result[index] = ret//保证回调的顺序
                    n++;
                    if (any || n >= promises.length) {
                        deferred.resolve(any ? ret : result);
                        end = true
                    }
                }
            }, function(e) {
                end = true
                deferred.reject(e);
            })
        }
        for (var i = 0, l = promises.length; i < l; i++) {
            loop(promises[i], i)
        }
        return deferred.promise;
    }
    Deferred.all = function() {
        return some(false, arguments)
    }
    Deferred.any = function() {
        return some(true, arguments)
    };
//http://www.raychase.net/1329
//http://www.cnblogs.com/iamzhanglei/archive/2013/02/24/2924680.html
    var BrowserMutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    if (BrowserMutationObserver) {//chrome firefox
        Deferred.nextTick = function(callback) {
            var input = document.createElement("input")
            var observer = new BrowserMutationObserver(function(mutations) {
                mutations.forEach(function() {
                    callback()
                });
            });
            observer.observe(input, {attributes: true});
            input.setAttribute("value", Math.random())
        }
    } else if (window.VBArray) {//IE
        Deferred.nextTick = function(callback) {
            var node = document.createElement("script");
            node.onreadystatechange = function() {
                callback()
                node.onreadystatechange = null
                node.parentNode && node.parentNode.removeChild(node);
                node = null;
            };
            document.documentElement.appendChild(node);
        }
    } else if (window.postMessage && window.addEventListener) {//safar opera
        Deferred.nextTick = function(callback) {
            function onGlobalMessage(event) {
                if (typeof event.data === "string" && event.data.indexOf("usePostMessage") === 0) {
                    callback()
                }
            }
            window.addEventListener("message", onGlobalMessage);
            var now = new Date - 0;
            window.postMessage("usePostMessage" + now, "*");
        }
    } else {
        Deferred.nextTick = function(callback) {
            setTimeout(callback, 0)
        }
    }


})()
