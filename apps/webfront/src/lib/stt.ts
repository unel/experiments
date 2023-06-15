const SpeechRecognition = (globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition);

function callAllFns(fns: Array<() => void>): void {
	for (const fn of fns) {
		fn();
	}
}

export function isSpeechRecognitionAvailable(): boolean {
	return typeof SpeechRecognition !== "undefined";
}

export type SRStatus = {
	isActive: boolean,
	error?: Error,
};

export type SRResultItem = {
	transcript: string,
	probability?: number,
};

export class SR {
	_sr: SpeechRecognition;
	isActive: boolean;
	_destructors: Array<() => void>;

	constructor({ language='en', continuous=false } = {}) {
		this._sr = new SpeechRecognition();
		this._sr.lang = language;
		this._sr.continuous = continuous;
		this.isActive = false;

		this._destructors = [
			() => { this._sr.stop(); },

			this.addStatusListener(({ isActive }) => {
				this.isActive = isActive;
			}),
		];
	}

	destroy() {
		callAllFns(this._destructors);
	}

	startListening() {
		this._sr.start();
	}

	stopListening() {
		this._sr.stop();
	}

	addStatusListener(listener: (statusInfo: SRStatus) => void) {
		const unlisteners = [
			this._addSREventListener('start', () => {
				listener({ isActive: true });
			}),

			this._addSREventListener('end', () => {
				listener({ isActive: false });
			}),

			this._addSREventListener('error', (e) => {
				listener({ isActive: false, error: e });
			}),
		];

		return () => {
			callAllFns(unlisteners);
		}
	}

	addErrorListener(listener: (e: SpeechRecognitionErrorEvent) => void) {
		return this._addSREventListener('error', listener);
	}

	addResultListener(listener: (e: SpeechRecognitionEvent) => void) {
		return this._addSREventListener('result', listener);
	}

	addMessageListener(listener: (data: SRResultItem) => void) {
		return this.addResultListener((e) => {
			listener(e.results[e.resultIndex].item(0))
		});
	}

	_addSREventListener<EN extends keyof SpeechRecognitionEventMap>(eventName: EN, listener: (this: SpeechRecognition, ev: SpeechRecognitionEventMap[EN]) => any) {
		this._sr.addEventListener(eventName, listener);

		return () => {
			this._sr.removeEventListener(eventName, listener);
		};
	}
}
