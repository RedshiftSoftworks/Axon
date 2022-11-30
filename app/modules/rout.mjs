import { h } from './h.mjs';
import { config } from './config.mjs';
import { tpl } from './tpl.mjs';
import { utils } from './utils.mjs';
import { enc } from './enc.mjs';
import { ls,ss } from "./storage.mjs";

const rout = {
  store: function(dest){

  },
  connect: function(dest){

    let obj = {
      src_id: 'afasdfsdfsdfsdgsgsdgsdf',
      dest_id: 'afasdfsdfsdfsdgsgsdgsdfx'
    },
    send_btn = h('button.btn.input-group-btn', 'Send message'),
    disconnect_btn = h('button.btn.btn-block.mb-2', {
      disabled: true
    },'Disonnect'),
    connect_btn = h('button.btn.btn-block.mb-2', {
      onclick: function(evt){
        evt.target.setAttribute('disabled', 'true');
        disconnect_btn.removeAttribute('disabled');
        utils.rtc_connecting(connect_globe, 'connecting');
        cnect();
      }
    }, 'Connect'),
    msg_box = h('textarea.form-input.mb-2',{
      rows: 10
    }),
    online_globe = h('span.globe.red',{
      title: 'online'
    }),
    connect_globe = h('span.globe.red',{
      title: 'webRTC not connected.'
    })



    let base = h('div.container',
      h('div.columns',
        h('div.column.col-md-12.col-4',
          connect_btn,
          disconnect_btn,
          h('input.form-input.mb-2', {
            type: 'text',
            value: 'afasdfsdfsdfsdgsgsdgsdf',
            placeholder: 'src id',
            onkeyup: function(evt){
              obj.src_id = evt.target.value;
            }
          }),
          h('input.form-input.mb-2', {
            type: 'text',
            placeholder: 'dest id',
            value: 'afasdfsdfsdfsdgsgsdgsdfx',
            onkeyup: function(evt){
              obj.dest_id = evt.target.value;
            }
          }),
          h('input.form-input.mb-2', {
            type: 'text',
            placeholder: 'session secret...',
            onkeyup: function(evt){
              obj.secret = evt.target.value;
            }
          }),
          h('div.columns',
            h('div.column.col-6.text-left',
              online_globe
            ),
            h('div.column.col-6.text-right',
              connect_globe
            )
          )
        ),
        h('div.column.col-md-12.col-8',
          h('div.columns',
            h('div.column.col-12',
              msg_box
            ),
            h('div.column.col-12',
              h('div.input-group',
                h('input.form-input.mb-2',{
                  placeholder: 'Message...',
                  onkeyup:function(evt){
                    obj.msg = evt.target.value
                  }
                }),
                send_btn
              )
            )
          )
        )
      )
    )

    dest.append(base)

    function cnect(){

      var destpeer = obj.dest_id;
      var lastPeerId = 'null';
      var peer = null; // Own peer object
      var peerId = null;
      var conn = null;

      peer = new Peer();

      peer.on('open', function (id) {
          // Workaround for peer.reconnect deleting previous id
          if (peer.id === null) {
              cl('Received null id from peer open');
              peer.id = lastPeerId;
          } else {
              lastPeerId = peer.id;
          }

          console.log('ID: ' + peer.id);

          conn = peer.connect(destpeer,{
            secure:true,
            metadata: {
              token: 'XGSFD5&EB6DYD9HSH'
            }
          })

          conn.on('open', function(x){
            cl(conn)
            utils.rtc_online(connect_globe);

            utils.new_store(function(err,res){
              if(err){return ce(err)}
              ss.set_enc('src_ecdsa', res.private.ecdsa);
              ss.set_enc('src_ecdh', res.private.ecdh);

              let ex_obj = res.public
              ex_obj.mtype = 'exchange';
              conn.send(js(ex_obj));

              send_btn.onclick = function(){
                send_btn.setAttribute('disabled', 'true');
                utils.new_store(function(err,res){
                  if(err){return ce(err)}


                  let enc_obj = {
                    public: ss.get_enc('dest_ecdh'),
                    private: ss.get_enc('src_ecdh'),
                    data: js({
                      public:res.public.ecdh,
                      data: obj.msg
                    })
                  }

                  enc.ecdsa_sign({data: enc_obj.data, private: ss.get_enc('src_ecdsa')}, function(err,sig){
                    if(err){return ce(err)}

                    enc.aes_gcm_encrypt(enc_obj, function(err,ctext){
                      if(err){return ce(err)}
                      cl(ctext)
                      ss.set_enc('src_ecdh', res.private.ecdh);
                      conn.send(js({mtype: 'msg',msg: ctext, sig:sig}));
                      send_btn.removeAttribute('disabled');
                    })
                  })

                })

              }

              disconnect_btn.onclick = function(){
                peer.destroy();
                ss.del('src_ecdsa');
                ss.del('src_ecdh');
                ss.del('dest_ecdsa');
                ss.del('dest_ecdh');
              }

            })

          });

          conn.on('data', function(data) {
            try {
              data = jp(data);
              if(data.mtype === 'exchange'){

                ss.set_enc('dest_ecdsa', data.ecdsa);
                ss.set_enc('dest_ecdh', data.ecdh);

                cl('dest keys updated');

              } else if(data.mtype === 'msg'){

                send_btn.setAttribute('disabled', 'true');

                let enc_obj = {
                  public: ss.get_enc('dest_ecdh'),
                  private: ss.get_enc('src_ecdh'),
                  data: data.msg
                }

                enc.aes_gcm_decrypt(enc_obj, function(err,ctext){
                  if(err){return ce(err)}
                  enc.ecdsa_verify({data: ctext, sig: data.sig, public: ss.get_enc('dest_ecdsa')}, function(err, isValid){
                    if(err){return ce(err)}
                    if(!isValid){
                      return ce('message tamper detected')
                    }
                    ctext = jp(ctext)
                    ss.set_enc('dest_ecdh', ctext.public);
                    msg_box.append(utils.get_time() + ' - '+ ctext.data + '\n');
                    send_btn.removeAttribute('disabled');
                  })
                })

              }
            } catch (err) {
              ce(err)
            }
          });

      });

      peer.on('disconnected', function () {
          utils.kill_keys();
          utils.rtc_offline(connect_globe);
          send_btn.onclick = null;
          connect_btn.removeAttribute('disabled');
          disconnect_btn.onclick = null;
          disconnect_btn.setAttribute('disabled', true);
          cl('Connection lost. Please reconnect');
      });

      peer.on('close', function() {
          conn = null;
          cl('Connection destroyed');
      });

      peer.on('error', function (err) {
      
      });

    }

    if(navigator.onLine){
      utils.is_online(online_globe);
    } else {
      utils.is_offline(online_globe);
    }

    window.ononline = function(){
      utils.is_online(online_globe);
    }

    window.onoffline = function(){
      utils.is_offline(online_globe);
    }


  },
  listen: function(dest){

    let obj = {
      src_id: 'afasdfsdfsdfsdgsgsdgsdfx',
      dest_id: 'afasdfsdfsdfsdgsgsdgsdf'
    },
    send_btn = h('button.btn.input-group-btn', 'Send message'),
    disconnect_btn = h('button.btn.btn-block.mb-2', {
      disabled: true
    },'Disonnect'),
    connect_btn = h('button.btn.btn-block.mb-2', {
      onclick: function(evt){
        evt.target.setAttribute('disabled', 'true');
        disconnect_btn.removeAttribute('disabled');
        utils.rtc_connecting(connect_globe, 'listening');
        cnect();
      }
    }, 'Listen'),
    msg_box = h('textarea.form-input.mb-2',{
      rows: 10
    }),
    online_globe = h('span.globe.red',{
      title: 'online'
    }),
    connect_globe = h('span.globe.red',{
      title: 'webRTC not listening.'
    })


    let base = h('div.container',
      h('div.columns',
        h('div.column.col-md-12.col-4',
          connect_btn,
          disconnect_btn,
          h('input.form-input.mb-2', {
            type: 'text',
            value: 'afasdfsdfsdfsdgsgsdgsdf',
            placeholder: 'src id',
            onkeyup: function(evt){
              obj.src_id = evt.target.value;
            }
          }),
          h('input.form-input.mb-2', {
            type: 'text',
            placeholder: 'dest id',
            value: 'afasdfsdfsdfsdgsgsdgsdfx',
            onkeyup: function(evt){
              obj.dest_id = evt.target.value;
            }
          }),
          h('input.form-input.mb-2', {
            type: 'text',
            placeholder: 'session secret...',
            onkeyup: function(evt){
              obj.secret = evt.target.value;
            }
          }),
          h('div.columns',
            h('div.column.col-6.text-left',
              online_globe
            ),
            h('div.column.col-6.text-right',
              connect_globe
            )
          )
        ),
        h('div.column.col-md-12.col-8',
          h('div.columns',
            h('div.column.col-12',
              msg_box
            ),
            h('div.column.col-12',
              h('div.input-group',
                h('input.form-input.mb-2',{
                  placeholder: 'Message...',
                  onkeyup:function(evt){
                    obj.msg = evt.target.value
                  }
                }),
                send_btn
              )
            )
          )
        )
      )
    )

    dest.append(base)

    function cnect(){

      var destpeer = obj.dest_id;
      var lastPeerId = null;
      var peer = null; // Own peer object
      var peerId = null;
      var conn = null;


      peer = new Peer(obj.src_id, {
        secure:true,

      });

      peer.on('open', function (id) {
          // Workaround for peer.reconnect deleting previous id
          if (peer.id === null) {
              console.log('Received null id from peer open');
              peer.id = lastPeerId;
          } else {
              lastPeerId = peer.id;
          }

          console.log('ID: ' + peer.id);

      });

      peer.on('connection', function (c) {
        cl(c)
        if(c.metadata.token){
          cl(c.metadata.token)
        }
        // Allow only a single connection
        if (conn && conn.open) {
            c.on('open', function() {
                c.send("Already connected to another client");
                setTimeout(function() { c.close(); }, 500);
            });
            return;
        } else {
          conn = c;
        }

        cl("Connected to: " + conn.peer);

        conn.on('open', function(){

          utils.rtc_online(connect_globe);

          utils.new_store(function(err,res){
            if(err){return ce(err)}
            ss.set_enc('src_ecdsa', res.private.ecdsa);
            ss.set_enc('src_ecdh', res.private.ecdh);

            let ex_obj = res.public
            ex_obj.mtype = 'exchange';
            conn.send(js(ex_obj));

            send_btn.onclick = function(){
              send_btn.setAttribute('disabled', 'true');
              utils.new_store(function(err,res){
                if(err){return ce(err)}


                let enc_obj = {
                  public: ss.get_enc('dest_ecdh'),
                  private: ss.get_enc('src_ecdh'),
                  data: js({
                    public:res.public.ecdh,
                    data: obj.msg
                  })
                }

                enc.ecdsa_sign({data: enc_obj.data, private: ss.get_enc('src_ecdsa')}, function(err,sig){
                  if(err){return ce(err)}

                  enc.aes_gcm_encrypt(enc_obj, function(err,ctext){
                    if(err){return ce(err)}
                    cl(ctext)
                    ss.set_enc('src_ecdh', res.private.ecdh);
                    conn.send(js({mtype: 'msg',msg: ctext, sig:sig}));
                    send_btn.removeAttribute('disabled');
                  })
                })
              })

            }

            disconnect_btn.onclick = function(){
              peer.destroy()
              utils.kill_keys();
            }

          })

        });

        conn.on('data', function(data) {
          try {
            data = jp(data);
            if(data.mtype === 'exchange'){

              ss.set_enc('dest_ecdsa', data.ecdsa);
              ss.set_enc('dest_ecdh', data.ecdh);

              cl('dest keys updated');

            } else if(data.mtype === 'msg'){

              send_btn.setAttribute('disabled', 'true');

              let enc_obj = {
                public: ss.get_enc('dest_ecdh'),
                private: ss.get_enc('src_ecdh'),
                data: data.msg
              }

              enc.aes_gcm_decrypt(enc_obj, function(err,ctext){
                if(err){return ce(err)}
                enc.ecdsa_verify({data: ctext, sig: data.sig, public: ss.get_enc('dest_ecdsa')}, function(err, isValid){
                  if(err){return ce(err)}
                  if(!isValid){
                    return ce('message tamper detected')
                  }
                  ctext = jp(ctext)
                  ss.set_enc('dest_ecdh', ctext.public);
                  msg_box.append(utils.get_time() + ' - '+ ctext.data + '\n');
                  send_btn.removeAttribute('disabled');
                })
              })

            }
          } catch (err) {
            ce(err)
          }
        });

      });

      peer.on('disconnected', function () {
        utils.kill_keys();
        utils.rtc_offline(connect_globe);
        send_btn.onclick = null;
        disconnect_btn.onclick = null;
        connect_btn.removeAttribute('disabled');
        disconnect_btn.onclick = null;
        disconnect_btn.setAttribute('disabled', true);
        cl('Connection lost. Please reconnect');
      });

      peer.on('close', function() {
          conn = null;
          console.log('Connection destroyed');
      });

      peer.on('error', function (err) {

      });
    }

    if(navigator.onLine){
      utils.is_online(online_globe);
    } else {
      utils.is_offline(online_globe);
    }

    window.ononline = function(){
      utils.is_online(online_globe);
    }

    window.onoffline = function(){
      utils.is_offline(online_globe);
    }

  },
  settings: function(dest){
    dest.append('settings')
  }
}

Object.freeze(rout);

export { rout }
