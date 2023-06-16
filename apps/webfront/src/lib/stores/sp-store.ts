import { writable } from "svelte/store"
import type { SP, SpeakingInfo } from "$lib/tts";

export default function createStores() {
    let prevUnsub = () => {};

    const subscribed = writable(false);
    const isActiveStore = writable(false);
    const talkingStatusStore = writable<SpeakingInfo>({ });

    const unsubscribe = () => {
        prevUnsub();
        prevUnsub = () => {};
        subscribed.set(false);
    };

    const resubscribe = (sp: SP) => {
        unsubscribe();

        const unsubStatus = sp.addStatusListener(({ isActive }) => {
            isActiveStore.set(isActive);
        });

        const unsubTalkingStatus = sp.addSpeakingListener(info => {
            talkingStatusStore.set(info);
        });

        subscribed.set(true);

        prevUnsub = () => {
            unsubStatus();
            unsubTalkingStatus();
        };
    }


    return {
        isActive: isActiveStore,
        talkingStatus: talkingStatusStore,
        subscribed,

        resubscribe,
        unsubscribe,
    };
}
