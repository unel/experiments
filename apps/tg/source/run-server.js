Promise.all([
    import('./env.mjs'),
    import('./telegraf.mjs'),
]).then(
    ([{ ENV }, { bot, chatLog }]) => {
        console.log('running bot', ENV);
        bot.launch();
        console.log('hope it is ok');
    }
);
