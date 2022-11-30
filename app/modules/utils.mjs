import { h } from './h.mjs';
import { tpl } from './tpl.mjs';
import { config } from './config.mjs';
import { ls,ss } from "./storage.mjs";
import { xcrypt } from './xcrypt.mjs';
import { cnsl } from './cnsl.mjs';
import { enc } from './enc.mjs';

const utils = {

  pre: function(doc, win, cb){

    utils.fetchJSON('./app/data/fonts.json', function(err,res){
      if(err){return cb(err)}

      for (let i = 0; i < res.length; i++) {
        utils.add_font(res[i], doc);
      }
      cb(false)
      /*
      utils.add_styles(doc, 'main', function(){
        cb(false)
      });
      */
    })
  },
  add_styles: function(doc, styl, cb){

    utils.fetchJSON(config.app_path + 'app/data/styles.json', function(err,res){
      if(err){
        cnsl(['[task:styles] ', 'Styles failed to fetch'], ['red','magenta']);
        return ce(err)
      }
      cnsl(['[auth:verify] ', 'styles hash test 1 pass'], ['lime','cyan']);

      let theme = ls.get('growlithe');
      try {
        let sheet = new CSSStyleSheet();
        sheet.replaceSync(res.main);
        if(theme){
          sheet.deleteRule(0)
          sheet.insertRule(':root{--gr:'+ theme +'!important;}',0)
        }
        doc.adoptedStyleSheets = [sheet];
      } catch (err) {
        //fallback for shit browsers
        cnsl(['[task:styles] ', 'outdated browser detected, loading fallback styles...'], ['orange','cyan']);
        let s = doc.createElement('link');
        s.type = 'text/css';
        s.rel = 'stylesheet';
        s.href = URL.createObjectURL(new Blob([res.main], {type : 'text/css'}));
        doc.head.appendChild(s);
        doc.adoptedStyleSheets = [s.sheet];
        if(theme){
          setTimeout(function(){
            doc.adoptedStyleSheets[0].deleteRule(0)
            doc.adoptedStyleSheets[0].insertRule(':root{--gr:'+ theme +'!important;}',0)
          },2000)
        }
      } finally {
        cb()
      }

    })
  },
  ud_theme: function(doc, r){
    doc.adoptedStyleSheets[0].deleteRule(0)
    doc.adoptedStyleSheets[0].insertRule(':root{--gr:'+ r +'!important;}',0)
    cnsl(['[task:theme] ', 'updating theme...'], ['lime','cyan']);
  },
  add_font: function(obj, doc){
    let buff = new Uint8Array(xcrypt.base64_decode(obj.data)).buffer;
    new FontFace(obj.name, buff, {
      style: obj.style,
      weight: obj.weight
    }).load().then(function(res) {
      doc.fonts.add(res);
    }).catch(function(err) {
      cnsl(['[task:fonts] ', obj.name +' failed to load.'], ['red','cyan']);
    });
  },
  shuffle: function(arr) {
    return arr.sort(() => Math.random() - 0.5);
  },
  fetchJSON: function(url, cb){

    fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip'
      }
    })
    .then(function(res){
      if (res.status >= 200 && res.status < 300) {
        //let auth = res.headers.get('Digest').slice(9);
        res.json().then(function(data) {
          cb(false,data)
        });
      } else {
        return Promise.reject(new Error(res.statusText))
      }
    })
    .catch(function(err){
      cb(err)
    })
  },
  fix_date: function(i){
    return i.replace('T', ' ').split('.')[0];
  },
  globe_change: function(i,a,b,c,d){
    i.classList.add(a);
    i.classList.remove(b,c);
    i.title = d;
  },
  is_online: function(i){
    utils.globe_change(i,'green','red', 'orange','online');
    ss.set('voltorb', true);
    cnsl(['[monitor:connection] ', 'web connection connected.'], ['lime','cyan']);
  },
  is_offline: function(i){
    utils.globe_change(i,'red','green', 'orange', 'offline');
    ss.set('voltorb', false);
    cnsl(['[monitor:connection] ', 'web connection disconnected.'], ['red','magenta']);
  },
  rtc_online: function(i){
    let msg = 'webRTC connected.';
    utils.globe_change(i,'green','red', 'orange', msg);
    cnsl(['[monitor:webRTC] ', msg], ['lime','cyan']);
    utils.toast('success', msg);
  },
  rtc_offline: function(i){
    let msg = 'webRTC disconnected.';
    utils.globe_change(i,'red','green', 'orange', msg);
    cnsl(['[monitor:webRTC] ', msg], ['red','magenta']);
    utils.toast('danger', msg);
  },
  rtc_connecting: function(i,e){
    let msg = 'webRTC '+ e +'....';
    utils.globe_change(i,'orange','green', 'red', msg);
    cnsl(['[monitor:webRTC] ', msg], ['red','magenta']);
    utils.toast('warning', msg);
  },
  emptySync: function(i){
    while (i.firstChild) {
      i.removeChild(i.firstChild);
    }
  },
  empty: function(i, cb){
    while (i.firstChild) {
      i.removeChild(i.firstChild);
    }
    cb()
  },
  totop: function(i){
    window.scroll({
      top: i,
      left: 0,
      behavior: 'smooth'
    });
  },
  toast: function(i, msg){
    const toast = h('div#toast.alert.alert-'+ i, {
        role: "alert"
    }, msg);
    document.body.append(toast);
    setTimeout(function(){
      toast.classList.add('fadeout');
      setTimeout(function(){
        toast.remove();
      },1000)
    },3000)
    return;
  },
  date2ts: function(x){
    return Date.parse(x);
  },
  format_date: function(i){
    let date = new Date(i),
    dd = date.getDate(),
    mm = date.getMonth()+1,
    yyyy = date.getFullYear();

    if(dd < 10){
      dd = '0' + dd
    }

    if(mm < 10){
      mm = '0' + mm
    };

    return [yyyy, mm, dd].join('-')
  },
  get_time: function(){
    return new Date().toTimeString().split(' ')[0];
  },
  get_year: function(){
    let d = new Date();
    return d.getFullYear();
  },
  debounce: function(func, wait, immediate) {
  	var timeout;
  	return function() {
  		var context = this, args = arguments;
  		var later = function() {
  			timeout = null;
  			if (!immediate) func.apply(context, args);
  		};
  		var callNow = immediate && !timeout;
  		clearTimeout(timeout);
  		timeout = setTimeout(later, wait);
  		if (callNow) func.apply(context, args);
  	};
  },
  capitalize: function(str) {
   try {
     let x = str[0] || str.charAt(0);
     return x  ? x.toUpperCase() + str.substr(1) : '';
   } catch (err) {
     if(err){return str;}
   }
  },
  formatBytes: function(bytes, decimals) {
    if (bytes === 0){
      return '0 Bytes';
    }
    const k = 1024,
    dm = decimals < 0 ? 0 : decimals,
    sizes = ['Bytes', 'KB', 'MB', 'GB'],
    i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  },
  snake_case: function(str){
    try {
      return str.replace(/ /g, '_');
    } catch (err) {
      if(err){return str;}
    }
  },
  un_snake_case: function(str){
    try {
      return str.replace(/_/g, ' ');
    } catch (err) {
      if(err){return str;}
    }
  },
 fs_write: function(data, filename, ctype){
    var file = new Blob([data], {type: ctype +';charset=utf-8'});
    if (window.navigator.msSaveOrOpenBlob){
        window.navigator.msSaveOrOpenBlob(file, filename);
    } else {
        var a = document.createElement("a"),
        url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        cnsl(['[task:export] ', 'attempting to export '+ filename], ['blue','cyan']);
        setTimeout(function() {
            window.URL.revokeObjectURL(url);
            a.remove();
        }, 1000);
    }
  },
  new_store: function(cb){

    enc.ec_gen('ECDSA', ["sign", "verify"], function(err, ecdsa){
      if(err){return cl(err)}
      enc.ec_gen('ECDH', ["deriveKey"], function(err, ecdh){
        if(err){return cb(err)}
        let obj = {
          public:{
            ecdsa: ecdsa.public,
            ecdh: ecdh.public
          },
          private:{
            ecdsa: ecdsa.private,
            ecdh: ecdh.private
          }
        }
        cb(false, obj)
      })
    })

  },
  kill_keys: function(){
    ss.del('src_ecdsa');
    ss.del('src_ecdh');
    ss.del('dest_ecdsa');
    ss.del('dest_ecdh');
    cl('all keypairs cleared')
  }
}


Object.freeze(utils);


export { utils }
