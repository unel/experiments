Promise.all([
	import('./env.mjs'),
	import('./my-server.mjs'),
]).then(
	([{ ENV }, { makeAndRunServer }]) => {
		console.log('running server', ENV);
		makeAndRunServer({ 
			logger: ENV.SERVER_LOG,
			port: ENV.SERVER_PORT,
			host: ENV.SERVER_HOST,
		});
		console.log('hope it is ok');
	}
);

