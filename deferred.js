(function() {
    //http://www.codingserf.com/index.php/2013/06/dropdownlist2/
    function Deferred() {
        var state = "pending", dirty = false;
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
            state: function() {
                return state
            },
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

//http://thanpol.as/javascript/promises-a-performance-hits-you-should-be-aware-of/
        "resolve,reject,notify".replace(/\w+/g, function(method) {
            dfd[method] = function(val) {
                var that = this
                //http://promisesaplus.com/ 4.1
                if (dirty) {
                    _fire.call(that, method, val)
                } else {
                    Deferred.nextTick(function() {
                        _fire.call(that, method, val)
                    })
                }
            }
        })
        return dfd
        function _post() {
            var deferred = !dirty ? dfd : (dfd.promise._next = Deferred())
            var index = -1, fns = arguments;
            "resolve,reject,notify, ensure".replace(/\w+/g, function(method) {
                var fn = fns[++index];
                if (typeof fn === "function") {
                    deferred.callback[method] = fn;
                    dirty = true
                }
            })
            return deferred.promise;
        }

        function _fire(method, value) {
            var next = "resolve";
            try {
                if (state === "pending" || method === "notify") {
                    var fn = this.callback[method]
                    value = fn.call(this, value);
                    if (method !== "notify") {
                        state = method === "resolve" ? "fulfilled" : "rejected"  
                    } else {
                        next = "notify"
                    }
                }
            } catch (e) {
                next = "reject";
                value = e;
            }
            var ensure = this.callback.ensure
            if (ok !== ensure) {
                try {
                    ensure.call(this)
                } catch (e) {
                    next = "reject";
                    value = e;
                }
            }
            var nextDeferred = this.promise._next
            if (Deferred.isPromise(value)) {
                value._next = nextDeferred
            } else {
                if (nextDeferred) {
                    _fire.call(nextDeferred, next, value);
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
