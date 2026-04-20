// Mini pub/sub para estado da aplicacao
const state = {};
const listeners = {};

export function get(key) { return state[key]; }

export function set(key, value) {
  state[key] = value;
  (listeners[key] || []).forEach(cb => cb(value));
}

export function on(key, callback) {
  if (!listeners[key]) listeners[key] = [];
  listeners[key].push(callback);
}

export function off(key, callback) {
  if (!listeners[key]) return;
  listeners[key] = listeners[key].filter(cb => cb !== callback);
}
