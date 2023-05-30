const SpeechRecognition = (globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition);

type SRListenerEventName = keyof SpeechRecognitionEventMap;
type SRListeners = Partial<Record<SRListenerEventName, (ev: SpeechRecognitionEvent | Event) => void>>;

type InitOptions = {
    language?: string,
    continuous?: boolean,
    listen?: SRListeners,
}

export function isSpeechRecognitionAvailable(): boolean {
    return typeof SpeechRecognition !== "undefined";
}

export function initSpeechRecognition({ language = 'en', continuous = false, listen = {} }: InitOptions = {}) {
    const rkg = new SpeechRecognition();

    rkg.lang = language;
    rkg.continuous = continuous;

    for (const [eventName, listener] of Object.entries(listen)) {
        rkg.addEventListener(eventName, listener);
    }

    return rkg;
}

export type SRStructure = {
    state: {
        isListening: boolean,
        lastError?: any,
        log: Array<{
            language: string,
            datetime: number,
            text: string,
        }>
    },
    language: string,
    speechRecogniser: SpeechRecognition,
};

type MakeSRSOptions = {
    language: string,
    continuous: boolean,
    listener: (structure: SRStructure) => void;
}

export function makeSpeechRecognitionStructure({ language, continuous, listener }: MakeSRSOptions) {
    const structure: SRStructure = {
        state: {
            isListening: false,
            log: [],
        },
        language,
        speechRecogniser: initSpeechRecognition({
            language,
            continuous,
            listen: {
                start: () => {
                    structure.state.isListening = true;
                    listener(structure);
                },
                error: (e) => {
                    structure.state.lastError = e;
                    console.error(`${language} recogniser error:`, e);
                    listener(structure);
                },
                end: () => {
                    structure.state.isListening = false;
                    listener(structure);
                },
                result: (e) => {
                    const data = (e as SpeechRecognitionEvent);
                    const item = data.results[data.resultIndex].item(0);

                    structure.state.log.push({
                        datetime: Date.now(),
                        language,
                        text: item.transcript,
                    });

                    listener(structure);
                }
            }
        })
    };

    return structure;
}
