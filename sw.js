// Helper for the installed app on each business website. This file never needs updating.
// - The business page: newest from the web, saved copy when offline.
// - The shared app file (one copy for every business): opens instantly from the phone,
//   and the newest version is downloaded in the background for next time.
// - App data (schedules, logins) always goes live to Google and is never saved here.
var CACHE = 'sb-site-3', APP = 'https://bansgrp-cmd.github.io/BGISCHAPP/';
var SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(SHELL).catch(function () { }).then(function () { return fetch(APP + 'app.js', { mode: 'no-cors' }).then(function (r) { return c.put(APP + 'app.js', r); }).catch(function () { }); });
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k.indexOf('sb-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
function saveCopy(key, r) { if (r && (r.ok || r.type === 'opaque')) { var c = r.clone(); caches.open(CACHE).then(function (k) { k.put(key, c); }); } return r; }
self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  if (url.origin === location.origin && (req.mode === 'navigate' || /index\.html$/.test(url.pathname))) {
    e.respondWith(fetch(req).then(function (r) { return saveCopy('./index.html', r); }).catch(function () { return caches.match('./index.html'); }));
    return;
  }
  if (req.url.indexOf(APP) === 0) {
    var key = req.url.split('?')[0];
    e.respondWith(caches.match(key).then(function (hit) {
      var net = fetch(req).then(function (r) { return saveCopy(key, r); }).catch(function () { return hit; });
      if (hit) { e.waitUntil(net.catch(function () { })); return hit; }
      return net;
    }));
    return;
  }
  if (url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then(function (hit) {
      var net = fetch(req).then(function (r) { return saveCopy(req, r); }).catch(function () { return hit; });
      return hit || net;
    }));
  }
});
// phone notifications (reminders, schedule posted, requests…)
self.addEventListener('push', function (e) {
  var d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) { d = { b: e.data ? e.data.text() : '' }; }
  var o = { body: d.b || '', icon: 'icon-192.png', badge: 'favicon-32.png', data: { u: d.u || './' } };
  if (d.g) { o.tag = d.g; o.renotify = true; }
  e.waitUntil(self.registration.showNotification(d.t || 'Schedule', o));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var u = new URL((e.notification.data && e.notification.data.u) || './', self.registration.scope).href;
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (l) {
    for (var i = 0; i < l.length; i++) if ('focus' in l[i]) return l[i].focus();
    return clients.openWindow(u);
  }));
});
// room for future additions without touching each business website again
try { importScripts(APP + 'sw-extra.js'); } catch (e) { }
