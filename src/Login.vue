<template>
	<div class="uk-margin-top uk-text-center">
		<div class="uk-margin-top">ログイン</div>
		<input type="image" class="uk-margin-small-top" v-bind:src="loginIconPath" width="40" height="40" v-on:click="login()">
	</div>
</template>
<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import firebase from 'firebase/app';

@Component
export default class Login extends Vue {
	loginIconPath: string = './img/twitter_icon.svg';

	async login(): Promise<void> {
		const provider = new firebase.auth.TwitterAuthProvider();
		await firebase.auth().signInWithRedirect(provider);
	}
}
</script>
<style scoped>
</style>
