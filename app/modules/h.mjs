let cleanupFuncs = [];

let h_util = {
  isNode: function(el) {
    return el && el.nodeName && el.nodeType
  },
  isType(e, i) {
    return i === typeof e;
  },
  forEach: function(arr, cb) {
    if (arr.forEach) {
      return arr.forEach(cb)
    }
    for (let i = 0; i < arr.length; i++) {
      cb(arr[i], i)
    }
  },
  cleanup: function() {
    for (let i = 0; i < cleanupFuncs.length; i++) {
      cleanupFuncs[i]()
    }
    cleanupFuncs.length = 0
  }
}

Object.freeze(h_util);

function h() {
  let args = [].slice.call(arguments),
    e = null

  function item(l) {
    let r;

    function parseClass(string) {

      let m = string.split(/([\.#]?[^\s#.]+)/)
      if (/^\.|#/.test(m[1])) {
        e = document.createElement('div')
      }
      h_util.forEach(m, function(v) {
        let s = v.substring(1, v.length);
        if (!v) {
          return
        };
        if (!e) {
          e = document.createElement(v)
        } else if (v[0] === '.') {
          e.classList.add(s)
        } else if (v[0] === '#') {
          e.setAttribute('id', s)
        }
      })
    }

    if (l === null) {
      ;
    } else if (h_util.isType(l, 'string')) {
      if (!e) {
        parseClass(l)
      } else {
        e.appendChild(r = document.createTextNode(l))
      }
    } else if (h_util.isType(l, 'number') ||
      h_util.isType(l, 'boolean') ||
      l instanceof Date ||
      l instanceof RegExp) {
      e.appendChild(r = document.createTextNode(l.toString()))
    } else if (Object.prototype.toString.call(l) === '[object Array]') {
      h_util.forEach(l, item)
    } else if (h_util.isNode(l)) {
      e.appendChild(r = l)
    } else if (l instanceof window.Text) {
      e.appendChild(r = l)
    } else if (h_util.isType(l, 'object')) {
      for (let k in l) {
        if (h_util.isType(l[k], 'function')) {
          if (/^on\w+/.test(k)) {
            (function(k, l) {
              if (e.addEventListener) {
                e[k] = l[k];
              } else {
                e.attachEvent(k, l[k])
                cleanupFuncs.push(function() {
                  e.detachEvent(k, l[k])
                })
              }
            })(k, l)
          } else {
            // observable
            e[k] = l[k]()
            cleanupFuncs.push(l[k](function(v) {
              e[k] = v
            }))
          }
        } else if (k === 'style') {
          if (h_util.isType(l[k], 'string')) {
            e.style.cssText = l[k]
          } else {
            for (let s in l[k])(function(s, v) {
              if (h_util.isType(v, 'function')) {
                e.style.setProperty(s, v())
                cleanupFuncs.push(v(function(val) {
                  e.style.setProperty(s, val)
                }))
              } else
                var match = l[k][s].match(/(.*)\W+!important\W*$/);
              if (match) {
                e.style.setProperty(s, match[1], 'important')
              } else {
                e.style.setProperty(s, l[k][s])
              }
            })(s, l[k][s])
          }
        } else if (k === 'attrs') {
          for (let v in l[k]) {
            e.setAttribute(v, l[k][v])
          }
        } else if (k.substr(0, 5) === "data-") {
          e.setAttribute(k, l[k])
        } else {
          e[k] = l[k]
        }
      }
    } else if (h_util.isType(l, 'function')) {
      let v = l();
      e.appendChild(r = h_util.isNode(v) ? v : document.createTextNode(v));
      cleanupFuncs.push(l(function(v) {
        if (h_util.isNode(v) && r.parentElement)
          r.parentElement.replaceChild(v, r), r = v;
        else
          r.textContent = v;
      }))
    }
    return r;
  }
  while (args.length) {
    item(args.shift());
  }
  return e;
}

Object.freeze(h);

export { h }
