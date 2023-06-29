<!-- source: https://loading.io/css/ -->


<div class="lds-dual-ring" />

<style>
	.lds-dual-ring {
		--size: 16;
		--color: navy;
		--width: 3;
		--mg: 0;

		display: inline-block;
		width: calc(var(--size) * 1px);
		height: calc(var(--size) * 1px);
	}
	.lds-dual-ring:after {
		content: ' ';
		display: block;
		width: calc((var(--size) - var(--mg) * 2) * 1px);
		height: calc((var(--size) - var(--mg) * 2) * 1px);

		margin: calc(var(--mg) * 1px);
		border-radius: 50%;
		border: calc(var(--width) * 1px) solid var(--color);

		border-color: var(--color) transparent var(--color) transparent;
		animation: lds-dual-ring 1.2s linear infinite;
	}
	@keyframes lds-dual-ring {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>
