import { xcrypt } from './xcrypt.mjs';

const LS = localStorage,
SS = sessionStorage;

let session_key = xcrypt.generateKey('hex');

const ls = {
  get: function(i){
    return jp(LS.getItem(i))
  },
  set: function(i,e){
    LS.setItem(i, js(e))
    return;
  },
  del: function(i){
    LS.removeItem(i);
  }
}

Object.freeze(ls);

const ss = {
  get: function(i){
    return jp(SS.getItem(i))
  },
  set: function(i,e){
    SS.setItem(i, js(e))
    return;
  },
  get_enc: function(i){
    try {
      let data = xcrypt.hex_decode(SS.getItem(i));
      return jp(xcrypt.utf82str(
          xcrypt.dec(data, session_key,'SERPENT','hex')
        )
      )
    } catch (err) {
      return undefined;
    }

  },
  set_enc: function(i,e){
    e = xcrypt.str2utf8(js(e));
    SS.setItem(i, xcrypt.pack(xcrypt.hex_encode(xcrypt.enc(e,session_key,'SERPENT','hex'))))
    return;
  },
  del: function(i){
    SS.removeItem(i);
  }
}
Object.freeze(ss);

export { ls, ss }
