<template>
	<div class="uk-container">
		<div class="uk-margin-small-top uk-text-muted uk-text-right">サイト作成者: <a class="uk-link-muted" href="https://twitter.com/JADENgygo">@JADENgygo</a></div>
		<div class="uk-text-lead uk-text-center uk-margin-top">ガチャ告知画像<span class="title-break">ジェネレーター</span></div>
	</div>
</template>
<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import UIkit from 'uikit';

@Component
export default class Host extends Vue {
	mounted(): void {
	}

}
</script>
<style scoped>
@media screen and (max-width: 420px) {
	.title-break::before {
		content: '\A';
		white-space: pre;
	}
}
</style>
