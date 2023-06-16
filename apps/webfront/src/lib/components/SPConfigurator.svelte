<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    import { getConfigurationParameters, isSpeechSynthesAvailable, type SpeachParams } from "$lib/tts";


    export let includeGroups: Array<string> | undefined;
    export let includeLangs: Array<string> | undefined;


    if (isSpeechSynthesAvailable()) {
        globalThis.speechSynthesis.addEventListener('voiceschanged', () => syncParams());
    }

    const dispatchEvent = createEventDispatcher<{
        config: SpeachParams
    }>();

    let params = getConfigurationParameters();
    let languages = params.language.values;

    let langGroupNames: Set<string> = new Set([]);
    const langGroups: Record<string, Array<{
        fullName: string,
        shortName: string,
        group: string,
    }>> = {};


    function syncParams() {
        params = getConfigurationParameters();
        languages = params.language.values;

        for (const language of languages) {
            const [group, lang] = language.toLocaleLowerCase().split('-').map(part => part.trim());

            if (includeGroups && !includeGroups.includes(group)) {
                continue;
            }

            if (includeLangs && !includeLangs.includes(lang)) {
                continue;
            }

            langGroups[group] = langGroups[group] || [];
            langGroups[group].push({
                fullName: language,
                group,
                shortName: lang,
            });

            langGroupNames.add(group);
        }
    }



    let activeLanguage: string;
    let activeVoice: SpeechSynthesisVoice;
    let currentRate = 1;
    let currentPitch = 1;
    let currentVolume = 1;

    $: voices = params.voice.values[activeLanguage] || [];

    $: {
        if (!activeLanguage && languages.length) {
            activeLanguage = languages[0];
        }
    }

    $: {
        if (voices.length && !activeVoice || voices.indexOf(activeVoice) == -1) {
            activeVoice = voices[0];
        }
    }

    $: {
        const config: SpeachParams = {
            rate: currentRate,
            pitch: currentPitch,
            volume: currentVolume,
        };

        if (activeVoice) {
            config.voice = activeVoice;
        }

        dispatchEvent('config', config)
    }
</script>

<form>
    <div class="form-group">
        <select class="form-select" bind:value={activeLanguage}>
            {#each Array.from(langGroupNames) as langGroupName}
                {#if langGroups[langGroupName].length > 1}
                    <optgroup label={langGroupName}>
                        {#each langGroups[langGroupName] as language}
                        <option value={language.fullName}>{language.shortName}</option>
                        {/each}
                    </optgroup>
                {:else}
                    {#each langGroups[langGroupName] as language}
                        <option value={language.fullName}>{language.shortName}</option>
                    {/each}
                {/if}
            {/each}
        </select>

        <select class="form-select" bind:value={activeVoice}>
            {#each voices as voice}
                <option value={voice}>{voice.name.split('-')[0]}</option>
            {/each}
        </select>
    </div>

    <div class="form-group">
        <div>
            <label>rate: {currentRate.toFixed(1)}</label>

            <input type="range" name="rate" min={params.rate.min} max={params.rate.max} step={params.rate.step} bind:value={currentRate} list="rate-markers" />
            <datalist id="rate-markers">
                <option value={0.1} label="minimum"></option>
                <option value={0.5} label="half speed"></option>
                <option value={1} label="norm speed"></option>
                <option value={1.5} label="norm+"></option>
                <option value={2} label="twice"></option>
                <option value={3} label="hurry"></option>
            </datalist>
        </div>

        <div>
            <label>pitch: {currentPitch.toFixed(1)}</label>

            <input type="range" name="pitch" min={params.pitch.min} max={params.pitch.max} step={params.pitch.step} bind:value={currentPitch} list="pitch-markers" />
            <datalist id="pitch-markers">
                <option value={0.1}></option>
                <option value={0.5} label="half pitch"></option>
                <option value={1} label="norm pitch"></option>
                <option value={1.5}></option>
                <option value={params.pitch.max} label="max"></option>
            </datalist>
        </div>
    </div>
</form>


<style>
    .params {
        padding: 8px;

        max-height: 200px;
        overflow: auto;
    }

    form {
        display: inline-flex;
        flex-direction: column;
    }

    .form-group {
        display: flex;
        flex-direction: row;

        column-gap: var(--space);
    }

    input[type="range"] {
        width: 100%;
        margin: 0;
    }

    datalist {
    }

    datalist option {
        padding: 0;
    }
</style>
