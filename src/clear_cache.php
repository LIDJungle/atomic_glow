<!--
	The idea here is to create a quick JS page that will have the barebones to connect to our cache and clear it.
-->

<!DOCTYPE html>
<html>
<head>
</head>
<body>
<div></div>
</body>
<script src="/glow/js/jsnlog.min.js"></script>
<script>
	var appender = JL.createAjaxAppender("example appender");
    appender.setOptions({"url": "data/logger.php", "level": 0});
	JL().setOptions({"appenders": [appender]});
	player.init();
	
	if (window && !window.onerror) {
		window.onerror = function (errorMsg, url, lineNumber, column, errorObj) {
			JL("onerrorLogger").fatalException({
				"msg": "Uncaught Exception",
				"errorMsg": errorMsg, "url": url,
				"line number": lineNumber, "column": column
			}, errorObj);

			return false;
		}
	}
	
	if ('serviceWorker' in navigator) {
	  window.addEventListener('load', function() {
		navigator.serviceWorker.register('/glow/shine_cache.js').then(function(registration) {
		  // Registration was successful
		  console.log('ServiceWorker registration successful with scope: ', registration.scope);
		}).catch(function(err) {
		  // registration failed :(
		  console.log('ServiceWorker registration failed: ', err);
		});
	  });
	}
	
	self.addEventListener('activate', function(event) {
		var cacheWhitelist = [];
		// Because javascript promises are fun...
		event.waitUntil(
			caches.keys().then(function(cacheNames) {
				return Promise.all(
					cacheNames.map(function(cacheName) {
						if (cacheWhitelist.indexOf(cacheName) === -1) {
							return caches.delete(cacheName);
						}
					})
				);
			})
		);
	});
</script>
<html>