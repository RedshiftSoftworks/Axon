import { config } from './config.mjs';
import { xcrypt } from './xcrypt.mjs';

const enc = {
  rnd: function(i){
    return window.crypto.getRandomValues(new Uint8Array(i))
  },
  rnd_id: function(){
    return xcrypt.hex_encode(window.crypto.getRandomValues(new Uint8Array(16)))
  },
  uuidv4: function() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, function(c){
      return (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    });
  },
  pbkdf2_rnd: function(len,cb){
    wcs.importKey('raw', enc.rnd(512),{name: 'PBKDF2'},false,['deriveBits'])
    .then(function(key) {
      wcs.deriveBits({
        "name": "PBKDF2",
        salt: enc.rnd(512),
        iterations: 10000,
        hash: {name: "SHA-512"}},
        key, len
      )
      .then(function(bits){
        cb(false, new Uint8Array(bits));
      })
      .catch(function(err){
        cb(err);
      });
    })
    .catch(function(err){
      cb(err);
    });
  },
  aes_gcm_derive: function(obj, cb){

    wcs.importKey("jwk", obj.private,{name: "ECDH",namedCurve:"P-521"},true,["deriveKey"])
    .then(function(privateKey){
      wcs.importKey("jwk", obj.public,{name: "ECDH",namedCurve:"P-521"},true,[])
      .then(function(publicKey){

        wcs.deriveKey({name:"ECDH",namedCurve: "P-521",public: publicKey},privateKey,{name: "AES-GCM",length: 256},false,["encrypt", "decrypt"])
        .then(function(keydata){
            cb(false, keydata);
        })
        .catch(function(err){
          cb(err);
        });
      })
      .catch(function(err){
        cb(err)
      });
    })
    .catch(function(err){
      cb(err)
    });

  },
  aes_gcm_encrypt: function(obj, cb){

    enc.aes_gcm_derive(obj, function(err,key){
      if(err){return cb(err)}
      let iv = window.crypto.getRandomValues(new Uint8Array(12)),
      data = new Uint8Array(xcrypt.str2utf8(obj.data));
      wcs.encrypt({name: "AES-GCM",iv: iv,tagLength: 128},key,data)
      .then(function(ctext){
        ctext = xcrypt.pack(xcrypt.hex_encode(new Uint8Array(ctext)) + xcrypt.hex_encode(iv))
        cb(false, ctext);
      })
      .catch(function(err){
        cb(err);
      });
    })
  },
  aes_gcm_decrypt: function(obj, cb){

    let iv = obj.data.substring(obj.data.length - 24),
    data = new Uint8Array(xcrypt.hex_decode(obj.data.slice(0,-24)));

    iv = new Uint8Array(xcrypt.hex_decode(iv));


    enc.aes_gcm_derive(obj, function(err,key){
      if(err){return cb(err)}
      wcs.decrypt({name: "AES-GCM",iv:iv,tagLength: 128},key,data)
      .then(function(ptext){
          ptext = xcrypt.utf82str(new Uint8Array(ptext))
          cb(false, ptext)
      })
      .catch(function(err){
        cb(err);
      });
    })
  },
  ec_gen: function(ktype, actions, cb){

    wcs.generateKey({name: ktype,namedCurve: "P-521"},true,actions).then(function(key){
      wcs.exportKey("jwk", key.publicKey).then(function(publicKey){
        wcs.exportKey("jwk", key.privateKey).then(function(privateKey){
            cb(false, {
              public: publicKey,
              private: privateKey
            })
        })
        .catch(function(err){
          cb(err);
        });
      })
      .catch(function(err){
        cb(err);
      });
    })
    .catch(function(err){
      cb(err);
    });

  },
  ecdsa_sign: function(obj,cb){
    let data = new Uint8Array(xcrypt.str2utf8(obj.data));
    wcs.importKey("jwk",obj.private,{name: "ECDSA",namedCurve: "P-521"},true,["sign"])
      .then(function(privateKey){
        wcs.sign({name: "ECDSA",hash: {name: "SHA-512"}},privateKey, data)
        .then(function(sig){
          sig = xcrypt.pack(xcrypt.hex_encode(new Uint8Array(sig)));
          cb(false, sig);
        })
        .catch(function(err){
          cb(err);
        });
      })
      .catch(function(err){
        cb(err);
      });

  },
  ecdsa_verify: function(obj,cb){
    let data = new Uint8Array(xcrypt.str2utf8(obj.data));
    let sig = new Uint8Array(xcrypt.hex_decode(obj.sig));
    wcs.importKey("jwk",obj.public,{name: "ECDSA",namedCurve: "P-521"},true,["verify"])
      .then(function(publicKey){
        wcs.verify({name: "ECDSA",hash: {name: "SHA-512"}},publicKey,sig,data)
        .then(function(isvalid){
            cb(false, isvalid);
        })
        .catch(function(err){
          cb(err);
        });
      })
      .catch(function(err){
        cb(err);
      });
  }
}

Object.freeze(xcrypt);

export { enc }
