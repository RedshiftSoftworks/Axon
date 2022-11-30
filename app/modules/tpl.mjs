import { h } from './h.mjs';
import { utils } from './utils.mjs';
import { ls,ss } from "./storage.mjs";
import { xcrypt } from './xcrypt.mjs';
import { enc } from './enc.mjs';
import { config } from './config.mjs';
import { cnsl } from './cnsl.mjs';
import { rout } from './rout.mjs';

const tpl = {
  app_main: function(){

    let sb_main = tpl.sb_main(),
    nav_right = h('div.navbar-section.hide-md',
      tpl.nav_link('listen', 'broadcast-tower'),
      tpl.nav_link('connect', 'plug'),
      tpl.nav_link('store', 'users'),
      tpl.rss_link(),
      tpl.nav_link('settings', 'cog')
    )

    return h('app-main',
      sb_main,
      h('header.navbar.navbar-main',
        h('section.navbar-section',
          h('div.icon-bars.mr-4.cp.flik',{
             onclick: function(){
               sb_main.firstChild.classList.toggle('active');
               sb_main.lastChild.classList.toggle('hidden')
             }
           }),
          h('div.mr-2', 'Crypto Mail')
        ),
        nav_right
      ),
      h('div.container')
    )
  },
  nav_link: function(i, ico){
    return h('div.nav-lnk.ml-4.icon-'+ico, {
        title: i,
        onclick: function(evt){
          location.hash = '/'+ i.replace(/ /g, '_')
        }
      }
    )
  },
  rss_link: function(){
    return h('div.nav-lnk.ml-4.icon-rss', {
        title: 'atom feed',
        target: '_blank',
        onclick: function(evt){
          window.open(location.origin + '/feed/atom')
        }
      }
    )
  },
  sb_link: function(i, sb, mask){
    return h('div.sb-lnk', {
        onclick: function(){
          sb.classList.toggle('active');
          mask.classList.toggle('hidden');
          location.hash = '/'+ i.replace(/ /g, '_')
        }
      },
      utils.capitalize(i),
      h('span.icon-chevron-right.lnk-r')
    )
  },
  sb_main: function(){
    let sb_content = h('div.off-canvas-content'),
    mask = h('div.off-canvas-mask.hidden', {
      onclick: function(){
        this.parentNode.firstChild.classList.toggle('active');
        this.classList.toggle('hidden');
      }
    }),
    sb_main = h('div.off-canvas',
      h('div.off-canvas-sidebar',
        sb_content,
        h('div.off-canvas-content',
          h('p', 'test')
        )
      ),
      mask
    ),
    arr = config.nav_items;

    for (let i = 0; i < arr.length; i++) {
      sb_content.append(tpl.sb_link(arr[i], sb_main.firstChild, mask))
    }

    return sb_main
  },
  app_sub: function(){
    return h('app-sub',
      tpl.to_top(),
    )
  },
  to_top: function(){

      let item = h('div.to-top.hidden.sh-9', {
        onclick: function(){
          utils.totop(0);
        }
      });

      window.addEventListener('scroll', utils.debounce(function(evt){
        let top = window.pageYOffset || document.scrollTop;

        if(top === NaN || !top){
          item.classList.add('hidden')
        } else if(item.classList.contains('hidden')){
          item.classList.remove('hidden');
        }
        top = null;
        return;
      }, 250))

      item.append(
        h('i.icon-chevron-up')
      )
      return item;
  },
  base: function(win,doc){

    let app_main = tpl.app_main(),
    main_content = app_main.lastChild,
    lhash = location.hash.split('/');

    win.onhashchange = function(){
      cl('hit')
      let dest = location.hash.slice(2);
      cl(dest)
      doc.title = dest

      utils.empty(main_content, function(){
        rout[dest](main_content);
      })
    }

    doc.body.append(
      h('app-sandbox',
        app_main,
        tpl.app_sub()
      )
    )

    if(lhash.length > 1 && config.nav_items.indexOf(lhash[1]) !== -1){
      doc.title = lhash[1]
      rout[lhash[1]](main_content);
    } else {
      location.hash = '/'+ config.nav_items[config.nav_base]
    }

  },
  input_txt: function(){
    return h('input.form-input.mb-2', {
      type: 'text',
      placeholder: 'contact',
      readOnly: true
    })
  },
  new_store_mdl: function(){

    let obj = {
      api: enc.rnd_id(),
      id: enc.uuidv4()
    },
    ecdsa_ta = h('input.form-input.mb-2', {
      type: 'text',
      readOnly: true
    }),
    ecdh_ta = h('input.form-input.mb-2', {
      type: 'text',
      readOnly: true
    });

    utils.new_store(function(err,res){
      if(err){return cl(err)}
      Object.assign(obj, res)
      ecdsa_ta.value = js(obj.ecdsa);
      ecdh_ta.value = js(obj.ecdh);
    })

    let mdl = h('div.modal',
      h('span.modal-overlay',{
        onclick: function(){
          this.parentNode.classList.remove('active')
        }
      }),
      h('div.modal-container',
        h('div.modal-header',
          h('h4.text-center', 'New Store')
        ),
        h('div.modal-body',
          h('label.form-label', 'Store username'),
          h('input.form-input.mb-2', {
            type: 'text',
            placeholder: 'enter username',
            onkeyup: function(evt){
              obj.username = evt.target.value;
            }
          }),
          h('label.form-label', 'Store password'),
          h('input.form-input.mb-2', {
            type: 'text',
            placeholder: 'enter password',
            onkeyup: function(evt){
              obj.password = evt.target.value;
            }
          }),
          h('label.form-label', 'Store api'),
          h('input.form-input.mb-2', {
            type: 'text',
            readOnly: true,
            value: obj.api
          }),
          h('label.form-label', 'Store id'),
          h('input.form-input.mb-2', {
            type: 'text',
            readOnly: true,
            value: obj.id
          }),
          h('label.form-label', 'ECDSA keypair'),
          ecdsa_ta,
          h('label.form-label', 'ECDH keypair'),
          ecdh_ta
        ),
        h('div.modal-footer',

        )
      )
    )

    return mdl
  }
}

Object.freeze(tpl);


export { tpl }
