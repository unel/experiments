import { ENV } from './env.mjs';
import { Telegraf } from 'telegraf';


const bot = new Telegraf(ENV.TG_BOT_TOKEN);
const chatLog = [];

function isAuthorizedPerson(userId) {
    return userId === Number(ENV.TG_BOT_AUTHOR);
}

function isAuthorizedMessage(message) {
    return isAuthorizedPerson(message.from.id);
}

bot.start(
    (ctx) => {
        console.log('i started', ctx);
        chatLog.push(ctx);
        ctx.reply('hallow');
    }
);

bot.telegram.setMyCommands([
    { command: 'ask', description: 'try to ask ai about something' }
]);
bot.command(
    'ask',
    (ctx) => {
        if (isAuthorizedMessage(ctx.update.message)) {
            ctx.reply('ok, i ask');
        } else {
            ctx.reply('sor, u ant otorized 4 that');
        }
    }
);

bot.on(
    'message',
    (ctx) => {
        const message = ctx.update.message;
        console.log('i got message', message);
        chatLog.push(ctx);

        if (isAuthorizedMessage(message)) {
            ctx.reply('yes sir!');
        } else {
            ctx.reply('well, okay..');
        }
    }
);

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

export { bot, chatLog }
