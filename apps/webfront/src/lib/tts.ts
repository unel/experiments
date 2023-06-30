import { mkPromise } from '$lib/promise-utils';

const synth: SpeechSynthesis = globalThis.speechSynthesis;
let SPEECH_VOICES: Array<SpeechSynthesisVoice> = [];
let VOICES_LANGUAGES: Set<string> = new Set();
let VOICES_LANGUAGE_GROUPS: Set<string> = new Set();
let SPEECH_VOICES_BY_LANGUAGE: Record<string, Set<SpeechSynthesisVoice>> = {};
let SPEECH_VOICES_BY_LANGUAGE_GROUP: Record<string, Set<SpeechSynthesisVoice>> = {};

function callAllFns(fns: Array<() => void>): void {
	for (const fn of fns) {
		fn();
	}
}

function clearData() {
	SPEECH_VOICES = [];

	VOICES_LANGUAGES = new Set();
	VOICES_LANGUAGE_GROUPS = new Set();

	SPEECH_VOICES_BY_LANGUAGE = {};
	SPEECH_VOICES_BY_LANGUAGE_GROUP = {};
}

function syncSpeechVoices() {
	clearData();
	SPEECH_VOICES = synth?.getVoices() ?? [];

	for (const voice of SPEECH_VOICES) {
		const language = voice.lang;

		const [group, shortLanguage] = language
			.toLocaleLowerCase()
			.split('-')
			.map((part) => part.trim());

		VOICES_LANGUAGES.add(language);
		VOICES_LANGUAGE_GROUPS.add(group);

		SPEECH_VOICES_BY_LANGUAGE[language] ||= new Set();
		SPEECH_VOICES_BY_LANGUAGE[language].add(voice);

		SPEECH_VOICES_BY_LANGUAGE_GROUP[group] ||= new Set();
		SPEECH_VOICES_BY_LANGUAGE_GROUP[group].add(voice);
	}
}

if (isSpeechSynthesAvailable()) {
	syncSpeechVoices();
	synth.addEventListener('voiceschanged', () => syncSpeechVoices());
}

type SPStatus = {
	isActive: boolean;
	error?: SpeechSynthesisErrorEvent;
};

type SpeachParamName = 'voice' | 'pitch' | 'rate' | 'volume' | 'lang';
export type SpeachParams = Partial<Pick<SpeechSynthesisUtterance, SpeachParamName>>;

export type SpeakingInfo = {
	elapsedTime?: number;
	charIndex?: number;
	text?: string;
	word?: string;
	wordStartIndex?: number;
	wordEndIndex?: number;
	sentence?: string;
	sentenceStartIndex?: number;
	sentenceEndIndex?: number;
};

export function isSpeechSynthesAvailable() {
	return typeof synth !== 'undefined';
}

export function getConfigurationParameters() {
	return {
		language: {
			// values: [...VOICES_LANGUAGES]
			values: [...VOICES_LANGUAGE_GROUPS]
		},
		voice: {
			// values: SPEECH_VOICES_BY_LANGUAGE
			values: SPEECH_VOICES_BY_LANGUAGE_GROUP
		},
		pitch: {
			min: 0.1,
			max: 2,
			step: 0.1
		},
		volume: {
			min: 0,
			max: 1,
			step: 0.1
		},
		rate: {
			min: 0,
			max: 3,
			step: 0.1
		}
	};
}

// speech player
export class TTSEngine {
	isActive: boolean;
	speakingStatus: SpeakingInfo;

	_defaultSpeachParams: SpeachParams;
	_utter: SpeechSynthesisUtterance;
	_destructors: Array<() => void>;

	constructor(defaultSpeachParams: SpeachParams) {
		this._defaultSpeachParams = defaultSpeachParams;
		this.isActive = false;

		this._utter = new SpeechSynthesisUtterance();
		this.speakingStatus = {
			text: ''
		};

		this._destructors = [
			() => {
				this.stop();
			},

			this.addStatusListener(({ isActive }) => {
				this.isActive = isActive;
			}),

			this.addSpeakingListener((speakingStatus) => {
				Object.assign(this.speakingStatus, speakingStatus);
			})
		];
	}

	destroy() {
		callAllFns(this._destructors);
	}

	applyConfig(speachParams: SpeachParams) {
		Object.assign(this._defaultSpeachParams, speachParams);
	}

	addStatusListener(listener: (statusInfo: SPStatus) => void) {
		const unlisteners = [
			this._addSPEventListener('start', () => {
				listener({ isActive: true });
			}),

			this._addSPEventListener('resume', () => {
				listener({ isActive: true });
			}),

			this._addSPEventListener('pause', () => {
				listener({ isActive: false });
			}),

			this._addSPEventListener('end', () => {
				listener({ isActive: false });
			}),

			this._addSPEventListener('error', (e) => {
				listener({ isActive: false, error: e });
			})
		];

		return () => {
			callAllFns(unlisteners);
		};
	}

	addSpeakingListener(listener: (info: SpeakingInfo) => any) {
		return this._addSPEventListener('boundary', ({ charIndex, elapsedTime, name, utterance }) => {
			const text = utterance.text;

			const info: SpeakingInfo = {
				text,
				charIndex,
				elapsedTime
			};

			if (name === 'word') {
				info.wordStartIndex = charIndex;

				const endWordMatch = text.substring(charIndex).match(/\w(?=\b|$)/);

				if (endWordMatch) {
					info.wordEndIndex = charIndex + (endWordMatch.index || 0);
					info.word = text.substring(info.wordStartIndex, info.wordEndIndex + 1);
				}
			}

			if (name === 'sentence') {
				info.sentenceStartIndex = charIndex;
				const endSentenceMatch = text.substring(charIndex).match(/[\.?!]+/);

				if (endSentenceMatch) {
					info.sentenceEndIndex = charIndex + (endSentenceMatch.index || 0);
					info.sentence = text.substring(info.sentenceStartIndex, info.sentenceEndIndex + 1);
				}

				info.word = undefined;
				info.wordEndIndex = undefined;
				info.wordStartIndex = undefined;
			}

			listener(info);
		});
	}

	speak(text: string, speachParams?: SpeachParams) {
		const { promise, resolve } = mkPromise();

		this._utter.text = text;
		this._syncUtterParams(speachParams);
		synth.cancel();
		synth.speak(this._utter);

		const unlisten = this.addStatusListener(({ isActive }) => {
			if (!isActive) {
				unlisten();
				resolve();
			}
		});

		return promise;
	}

	pause() {
		if (this.isActive) {
			synth.pause();
		}
	}

	stop() {
		if (this.isActive) {
			synth.cancel();
		}
	}

	_syncUtterParams(speachParams?: SpeachParams) {
		const finalSpeachParams: SpeachParams = {
			...this._defaultSpeachParams,
			...speachParams
		};

		for (const [name, value] of Object.entries(finalSpeachParams)) {
			// @ts-ignore
			this._utter[name] = value;
		}
	}

	_addSPEventListener<EN extends keyof SpeechSynthesisUtteranceEventMap>(
		eventName: EN,
		listener: (this: SpeechSynthesisUtterance, ev: SpeechSynthesisUtteranceEventMap[EN]) => any
	) {
		this._utter.addEventListener(eventName, listener);

		return () => {
			this._utter.removeEventListener(eventName, listener);
		};
	}
}
