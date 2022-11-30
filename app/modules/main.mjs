window.js = JSON.stringify;
window.jp = JSON.parse;
window.cl = console.log;
window.ce = console.error;
window.wcs = window.crypto.subtle;

import './peer.mjs'
import { config } from './config.mjs';
import { h } from './h.mjs';
import { utils } from './utils.mjs';
import { enc } from './enc.mjs';
import { tpl } from "./tpl.mjs";


window.onload = function(){

  let win = window,
  doc = document;
  utils.pre(doc, win, function(err){
    if(err){return ce(err)}
    tpl.base(win, doc)
  })

  win.onload = null;

}
