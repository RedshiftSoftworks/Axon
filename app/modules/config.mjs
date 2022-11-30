const base_path = location.href.split('/')[1];
const config = {
  app_path: base_path,
  nav_items: ['store','connect', 'listen', 'settings'],
  nav_base: 0
}

Object.freeze(config);

export { config }
