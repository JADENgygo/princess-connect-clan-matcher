<template>
	<div class="uk-container uk-margin-small-top uk-margin-bottom">
		<div uk-grid class="uk-child-width-1-2">
			<div class="uk-text-muted uk-text-left"><a class="uk-link-muted" href="https://twitter.com/JADENgygo">作成者Twitter</a></div>
			<div class="uk-text-right">
				<a href="#offcanvas-nav" uk-toggle v-on:click="updateMenu()">メニュー</a>
				<div id="offcanvas-nav" uk-offcanvas="overlay: true; flip: true">
					<div class="uk-offcanvas-bar uk-text-center">
						<ul class="uk-nav uk-nav-default" v-on:click="closeMenu()">
							<li class="uk-active" v-if="$store.state.authentication === 'logout'"><router-link to="/login">ログイン</router-link></li>
							<li class="uk-active" v-if="$store.state.authentication === 'login'"><router-link to="/" @click.native="logout()">ログアウト</router-link></li>
							<li class="uk-active" v-if="$store.state.authentication === 'login' && type === 'add'"><router-link to="/register">クラン登録</router-link></li>
							<li class="uk-active" v-if="$store.state.authentication === 'login' && type === 'edit'"><router-link to="/edit">クラン情報の編集</router-link></li>
						</ul>
					</div>
				</div>
			</div>
		</div>
		<div class="uk-text-lead uk-link-text uk-text-center uk-margin-top">
			<router-link to="/">ぷりこねまっち</router-link>
		</div>
		<router-view></router-view>
		<div class="uk-margin-top" v-if="true">
			<button type="button" v-on:click="showUserId()">show user id</button>
			<button type="button" v-on:click="postClan()" class="uk-margin-left">post clan</button>
		</div>
	</div>
</template>
<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import UIkit from 'uikit';
import firebase from 'firebase/app';
import * as utility from './utility';

@Component
export default class Host extends Vue {
	private auth: any = firebase.auth();
	private db = firebase.firestore();
	private type: 'edit' | 'add' = 'add';
	
	logout(): void {
		this.auth.signOut().then(() => {
			this.$store.commit('logout');
		}).catch((error: any) => {
			this.$store.commit('login');
			console.error('logout error');
			console.error(error);
		});
	}

	async updateMenu(): Promise<void> {
		this.type = 'add';
		if (this.$store.state.authentication === 'login') {
			const userId = this.auth.currentUser.uid;
			const doc = await this.db.collection('clans').doc(userId).get();
			if (doc.exists) {
				this.type = 'edit';
			}
		}
	}

	closeMenu(): void {
		UIkit.offcanvas('#offcanvas-nav').hide();
	}

	private showUserId(): void {
		utility.showUserId();
	}

	private async postClan(): Promise<void> {
		await utility.postClan();
	}
}
</script>
<style scoped>
</style>
