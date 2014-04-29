mmDeferred
==========

一个完全遵循Promise/A+规范的Deferred 库

<h3>api</h3>
<ol>
    <li>Deferred(mixin?):  可传入一个可选的对象或函数，修改整条Deferred链的所有Promise对象，它将返回一个Deferred对象。
    相当于jQuery的promise(obj)，将一个普通对象转换为Promise 对象的功能。
    </li>
    <li>state(), 位于Deferred对象上， 将得到Deferred对象的状态，"fulfilled", "rejected", "pedding", 一开始是"pedding"。
        当对象变成"fulfilled"或 "rejected"状态时，无法再执行resolve, reject方法。resolve会将对象改变成"fulfilled",但如何执行时抛错，会转为"rejected"状态；
        reject会将对象改变成"rejected"；notify与ensure不会改变状态；
    </li>
    <li>promise: 位于Deferred对象上， 一个对象属性，拥有then, otherwise, ensure方法，是负责收集回调的<br/>
        （相当而言，Deferred对象则有resolve, reject, notify方法，是负责触发回调的）</li>
    <li>then(resolvefn,rejectfn,notifyfn, ensurefn)，位于Promise对象上，依次用来重写默认的"resolve,reject,notify, ensur"回调</li>
    <li>ensure: 位于Promise对象上，重写默认的ensure回调——该回调不接受参数，是总会触发的回调</li>
    <li>otherwise 位于Promise对象上，重写默认的rejected回调——出错时触发的回调</li>
    <li>notify： 位于Deferred对象上，用于触发notify回调——允许多次触发的回调</li>
    <li>resolve： 位于Deferred对象上，用于触发fulfill回调——正常触发的回调</li>
    <li>reject： 位于Deferred对象上，用于触发rejected回调——出错时触发的回调</li>
    <li>all： Deferred的静态方法，要求传入多个Promise对象，当它们都正常触发时，就执行它的resolve回调。相当于jQuery的when方法，但all更标准，是社区公认的函数。</li>

    <li>any： Deferred的静态方法，要求传入多个Promise对象，最先正常触发的Promise对象，将执行它的resolve回调</li>
</ol>
<h3>example</h3>
<ul>
    <li><a href="state.html">state</a></li>
    <li><a href="state2.html">state2</a></li>
    <li><a href="state3.html">state3</a></li>
    <li><a href="resolve.html">resolve</a></li>
    <li><a href="resolve2.html">resolve2</a></li>
    <li><a href="resolve3.html">resolve3</a></li>
    <li><a href="otherwise.html">otherwise</a></li>
    <li><a href="otherwise2.html">otherwise2</a></li>
    <li><a href="then.html">then</a></li>
    <li><a href="then2.html">then2</a></li>
    <li><a href="then3.html">then2</a></li>
    <li><a href="ensure.html">ensure</a></li>
    <li><a href="ensure2.html">ensure2</a></li>
    <li><a href="all.html">all</a></li>
    <li><a href="any.html">any</a></li>
    <li><a href="mixin.html">mixin</a></li>
    <li><a href="nextTick.html">在当前浏览器下最快的异步操作检测</a></li>
</ul>
