import { handler } from './build/handler.js';
import express from 'express';

const app = express();

// add a route that lives separately from the SvelteKit app
app.use((req, res, next) => {
    console.log('node/req', Date.now(), req.url);
    next();
});

// let SvelteKit handle everything else, including serving prerendered pages and static assets
app.use(handler);

app.listen(6666, () => {
    console.log('listening on port 6666');
});
