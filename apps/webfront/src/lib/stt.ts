import { mkPromise } from '$lib/promise-utils';
import { delay } from '$lib/time-utils';

const SpeechRecognition = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;

function callAllFns(fns: Array<() => void>): void {
	for (const fn of fns) {
		fn();
	}
}

export function isSpeechRecognitionAvailable(): boolean {
	return typeof SpeechRecognition !== 'undefined';
}

export type SRStatus = {
	isActive: boolean;
	isPaused: boolean;
	error?: SpeechRecognitionErrorEvent;
};

export type SRResultItem = {
	transcript: string;
	probability?: number;
};

export class STTEngine {
	isPaused: boolean;
	isActive: boolean;
	language: string;
	defaultLanguage: string;

	_sr: SpeechRecognition;
	_destructors: Array<() => void>;

	constructor({ language = 'en', continuous = false } = {}) {
		this.defaultContinuous = continuous;
		this.defaultLanguage = language;
		this.language = language;
		this._sr = new SpeechRecognition();
		this._sr.lang = language;
		this._sr.continuous = continuous;
		this.isActive = false;

		this._destructors = [
			() => {
				this._sr.stop();
			},

			this.addStatusListener(async ({ isActive }) => {
				this.isActive = isActive;
			})
		];
	}

	destroy() {
		callAllFns(this._destructors);
	}

	async pauseListening() {
		this._pausedArgs = [this._sr.lang, this._sr.continuous];

		return this.stopListening({ isPaused: true });
	}

	async resumeListening() {
		this.isPaused = false;
		return this.startListening(...this._pausedArgs);
	}

	async startListening(language = this.defaultLanguage, continuous = this.defaultContinuous) {
		this.isPaused = false;
		const { promise, resolve } = mkPromise();

		const unlisten = this.addStatusListener(({ isActive }) => {
			if (isActive) {
				resolve();
			}
			unlisten();
		});

		this.language = language;
		this._sr.lang = language;
		this._sr.continuous = continuous;
		this._sr.start();
		return promise;
	}

	async switchLanguage(newLanguage: string) {
		if (this.language === newLanguage) {
			return;
		}

		this.language = this._sr.lang = newLanguage;
		if (this.isActive) {
			await this.stopListening();
			await this.startListening(newLanguage);
		}
	}

	async stopListening({ isPaused = false } = {}) {
		this.isPaused = isPaused;
		if (!isPaused) {
			delete this._pausedArgs;
		}

		const { promise, resolve } = mkPromise();

		const unlisten = this.addStatusListener(({ isActive }) => {
			if (!isActive) {
				resolve();
			}
			unlisten();
		});

		this._sr.stop();
		return promise;
	}

	addStatusListener(listener: (statusInfo: SRStatus) => void) {
		const unlisteners = [
			this._addSREventListener('start', () => {
				listener({ isActive: true, isPaused: this.isPaused });
			}),

			this._addSREventListener('end', () => {
				listener({ isActive: false, isPaused: this.isPaused });
			}),

			this._addSREventListener('error', async (event) => {
				listener({ isActive: false, error: event, isPaused: this.isPaused });
			})
		];

		return () => {
			callAllFns(unlisteners);
		};
	}

	addErrorListener(listener: (e: SpeechRecognitionErrorEvent) => void) {
		return this._addSREventListener('error', listener);
	}

	addResultListener(listener: (e: SpeechRecognitionEvent) => void) {
		return this._addSREventListener('result', listener);
	}

	addMessageListener(listener: (data: SRResultItem) => void) {
		return this.addResultListener((e) => {
			listener(e.results[e.resultIndex].item(0));
		});
	}

	_addSREventListener<EN extends keyof SpeechRecognitionEventMap>(
		eventName: EN,
		listener: (this: SpeechRecognition, ev: SpeechRecognitionEventMap[EN]) => any
	) {
		this._sr.addEventListener(eventName, listener);

		return () => {
			this._sr.removeEventListener(eventName, listener);
		};
	}
}
