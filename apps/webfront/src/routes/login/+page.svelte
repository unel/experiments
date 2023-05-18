<style>
    .MainContent {
        height: 100%;

        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        /* padding-top: var(--space-mid);

        padding-left: var(--space-large);
        padding-right: var(--space-large); */
    }

    .LoginForm {
        display: flex;
        flex-direction: column;

        max-width: 400px;
        padding: var(--space);
        border: var(--primer-borderWidth-thin, 1px) solid var(--color-border-default);
        border-radius: var(--primer-borderRadius, 2px);
    }
</style>

<script lang="ts">
    import type { ActionData } from './$types';
    import { enhance } from '$app/forms';

    export let form: ActionData;
</script>

<main class="MainContent">
    <form class="LoginForm" method="POST" action="/login" use:enhance>
        <section class="Subhead">
            <h2 class="Subhead-heading">Login</h2>
        </section>

        <section class="form-group">
            <input class="form-control" type="text" name="id" placeholder="fill your id">
        </section>

        <section class="form-group">
            <input class="form-control" type="password" name="password" placeholder="fill your password">
        </section>

        {#if form?.error}
            <section class="form-group flash flash-error">
                {form.error}
            </section>
        {/if}

        <section class="form-actions">
            <button class="btn btn-primary" type="submit">send</button>
        </section>
    </form>
</main>
