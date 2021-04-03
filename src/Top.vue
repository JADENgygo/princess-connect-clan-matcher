<template>
	<div class="uk-margin-top uk-text-center">
		<div>本サイトについて</div>
		<div class="uk-margin-top">ぷりこねさーちが再開するまでの代わりのサイトです。<span class="uk-text-warning">本家とは無関係です。</span></div>
		<div class="uk-margin-top"><router-link to="/search">はじめる</router-link></div>
	</div>
</template>
<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';

@Component
export default class TopPage extends Vue {
}
</script>
<style scoped>
</style>
