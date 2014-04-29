var Promise = function (executor) {
    this._callbacks = [];
    executor(this._resolve.bind(this), this._reject.bind(this));
};
Promise.resolve = function (value) {
    return new Promise(function (resolve) { resolve(value); });
};
Promise.reject = function (error) {
    return new Promise(function (resolve, reject) { reject(error); });
};
Promise.cast = function (value) {
    if (value instanceof Promise) return value;
    return Promise.resolve(value);
};

Promise.prototype = {

    // Private properties and methods:
    _failed: false,
    _resolved: false,
    _settled: false,
    _release: function (onSuccess, onFail) {
        if (this._failed) {
            if (typeof onFail === 'function') onFail(this._value);
            else throw this._value;
        } else {
            if (typeof onSuccess === 'function') onSuccess(this._value);
        }
    },
    _resolve: function (value) {
        if (this._resolved) return;
        this._resolved = true;
        if (value instanceof Promise) {
            value.done(this._settle.bind(this), function (error) {
                this._failed = true;
                this._settle(error);
            }.bind(this));
        } else {
            this._settle(value);
        }
    },
    _reject: function (value) {
        if (this._resolved) return;
        this._resolved = true;
        this._failed = true;
        this._settle(value);
    },
    _settle: function (value) {
        this._settled = true;
        this._value = value;
        // Do not release before `resolve` or `reject` returns
        setTimeout(this._callbacks.forEach.bind(this._callbacks, function (data) {
            this._release(data.onSuccess, data.onFail);
        }, this), 0);
    },

    // Public API:
    // Warning: Some implementations do not provide `done`
    done: function (onSuccess, onFail) {
        if (this._settled) {
            // Do not release before `done` returns
            setTimeout(this._release.bind(this, onSuccess, onFail), 0);
        } else {
            this._callbacks.push({ onSuccess: onSuccess, onFail: onFail });
        }
    },
    then: function (onSuccess, onFail) {
        var parent = this;
        return new Promise(function (resolve, reject) {
            parent.done(function (value) {
                if (typeof onSuccess === 'function') {
                    try {
                        value = onSuccess(value);
                    } catch (e) {
                        reject(e);
                        return;
                    }
                }
                resolve(value);
            }, function (value) {
                if (typeof onFail === 'function') {
                    try {
                        value = onFail(value);
                    } catch (e) {
                        reject(e);
                        return;
                    }
                    resolve(value);
                } else {
                    reject(value);
                }
            });
        });
    },
    catch: function (onFail) {
        return this.then(null, onFail);
  }
};