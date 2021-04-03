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

	login(): void {
		const provider = new firebase.auth.TwitterAuthProvider();
		firebase.auth().signInWithRedirect(provider).catch(error => {
			const errorCode = error.code;
			const errorMessage = error.message;
			const credential = error.credential;
			console.error('login error');
			console.error(errorCode, errorMessage, credential);
		});
	}
}
</script>
<style scoped>
</style>
