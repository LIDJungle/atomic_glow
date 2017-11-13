/* 

This uses appcache attached to a service worker process to cache images for offline retrieval for one month

Webserver expiration is set to one month. If the image has not been updated, we will get a 304 return code.
If we are without internet, we will get a 404 return code (content not found).
In this case, we return the image from cache.

If we get back a valid image that is a 200 return code and properly cors, we store it in our appcache.

*/
// https://developers.google.com/web/fundamentals/getting-started/primers/service-workers
	
	var CACHE_NAME = 'shine_cache';
	var urlsToCache = [
		"http://localhost"
	];
	self.addEventListener('install', function(event) {
		// Perform install steps
		event.waitUntil(
			caches.open(CACHE_NAME).then(function(cache) {
				console.log('Opened cache', urlsToCache);
				return cache.addAll(urlsToCache);
			})
		);
	});
	
	self.addEventListener('fetch', function(event) {
		// Can't store POST requests, so pass 'em through.
		if (event.request.method == 'POST') {
			event.respondWith(fetch(event.request)); 
			return;
		}

		// If it's not an image, we don't need to respond.
		if (event.request.headers.get('Accept').indexOf('text/html') == -1 && event.request.headers.get('Accept').indexOf('image') !== -1) {	
			//console.log("Request: ", event.request.headers.get('Accept'));
			event.waitUntil(update(event.request));
			event.respondWith(fromCache(event.request));
		}
	});
	
	function fromCache(request) {
		return caches.open(CACHE_NAME).then(function (cache) {
			return cache.match(request).then(function (matching) {
				console.log("Returning from cache.", request);
				return matching || fetch(request);
			});
		});
	}
	
	function update(request) {
		return fetch(request).then(
			function(response) {
				// Check if we received a valid response and that type is cross origin
				if(!response || response.status !== 200 || response.type !== 'cors') {
					return response;
				}
				// Cache new response
				caches.open(CACHE_NAME).then(function(cache) {
					console.log("Caching updated image", request);
					cache.put(request, response.clone());
				});
				return response;
			}
		);
	}