const SpeechRecognition = (globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition);

type SRListenerEventName = keyof SpeechRecognitionEventMap;
type SRListeners = Partial<Record<SRListenerEventName, (ev: SpeechRecognitionEvent | Event) => void>>;

type InitOptions = {
    lang?: string,
    continuous?: boolean,
    listen?: SRListeners,
}
export function initSpeechRecognition({ lang = 'en', continuous = false, listen = {} }: InitOptions = {}) {
    if (typeof SpeechRecognition === "undefined") {
        return undefined;
    }

    const rkg = new SpeechRecognition();

    rkg.lang = lang;
    rkg.continuous = continuous;

    for (const [eventName, listener] of Object.entries(listen)) {
        rkg.addEventListener(eventName, listener);
    }

    return rkg;
}
