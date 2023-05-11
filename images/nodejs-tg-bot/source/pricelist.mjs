import { encoding_for_model } from '@dqbd/tiktoken';


// price in $
// data from https://openai.com/pricing (2023-05-11)
const pricesFor1KTokens = {
    'gpt-3.5-turbo': 0.002,
    'gpt-4': {
        ctx8k: {
            prompt: 0.03,
            completion: 0.06,
        },

        ctx32k: {
            prompt: 0.06,
            completion: 0.12,
        },
    },

    ada: {
        training: 0.0004,
        usage: 0.0016,
    },

    babbadge: {
        training: 0.0006,
        usage: 0.0024,
    },

    curie: {
        training: 0.0030,
        usage: 0.0120,
    },

    davinci: {
        training: 0.0300,
        usage: 0.1200,
    }
};

const fineTuningModels = new Set(['ada', 'babbadge', 'curie', 'davinci'])

// works:
export function getEncodingForModel(modelName) {
    try {
        return encoding_for_model(modelName);
    } catch (e) {
        console.error('error in getEncodingForModel', e);
        return encoding_for_model('gpt2');
    }
}

export function computeTokensCount(modelName, str) {
    const encoding = getEncodingForModel(modelName);

    return encoding.encode(str).length;
}

export function computeStringPrice({ modelName, string, context }) {
    const tokensCount = computeTokensCount(modelName, string);

    return computeTokensPrice({ modelName, tokensCount, context });
}

export function computeTokensPrice({ modelName, tokensCount, context }) {
    const tokensThousands = tokensCount / 1000;

    const lcModel = String(modelName).toLowerCase();
    const modelPrice = pricesFor1KTokens[lcModel];

    if (lcModel === 'gpt-3.5-turbo') {
        return modelPrice * tokensCount;
    }

    if (lcModel === 'gpt-4') {
        if (tokensThousands <= 8) {
            return modelPrice.ctx8k[context] * tokensThousands;
        }

        if (tokensThousands <= 32) {
            return modelPrice.ctx32k[context] * tokensThousands;
        }

        return NaN;
    }

    if (fineTuningModels.has(lcModel)) {
        return modelPrice[context] * tokensThousands
    }

    return NaN;
}
