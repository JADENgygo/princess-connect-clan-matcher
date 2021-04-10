<template>
	<div class="uk-container uk-margin-small-top uk-margin-bottom">
		<div class="uk-text-muted uk-text-left"><a class="uk-link-muted" href="https://twitter.com/JADENgygo">サイト作成者: @JADEN</a></div>
		<breadcrumb class="uk-margin-small-top" v-bind:routeName="$route.name + ($route.params.userId ? '/' + $route.params.userId : '')" v-bind:title="$route.meta.title"></breadcrumb>
		<div class="uk-margin-small-top"><a href="#menu" uk-toggle v-on:click="updateMenu()">メニュー</a></div>
		<div id="menu" uk-offcanvas="overlay: true; flip: true">
			<div class="uk-offcanvas-bar uk-text-center">
				<ul class="uk-nav uk-nav-default" v-on:click="closeMenu()">
					<li class="uk-active" v-if="$store.state.authentication === 'logout'"><router-link to="/login">ログイン</router-link></li>
					<li class="uk-active" v-if="$store.state.authentication === 'login'"><router-link to="/" @click.native="logout()">ログアウト</router-link></li>
					<li class="uk-active"><router-link to="/">トップ</router-link></li>
					<li class="uk-active"><router-link to="/search">クラン検索</router-link></li>
					<li class="uk-active" v-if="$store.state.authentication === 'login' && status === 'none'"><router-link to="/register">クラン登録</router-link></li>
					<li class="uk-active" v-if="$store.state.authentication === 'login' && status === 'existed'"><router-link v-bind:to="`/profile/${userId}`">クラン詳細</router-link></li>
					<li class="uk-active" v-if="$store.state.authentication === 'login' && status === 'existed'"><router-link to="/edit">クラン編集</router-link></li>
					<li class="uk-active" v-if="$store.state.authentication === 'login'"><router-link to="/bookmark">ブックマーク</router-link></li>
					<li class="uk-active" v-if="$store.state.authentication === 'login'"><router-link to="/delete">アカウント削除</router-link></li>
				</ul>
			</div>
		</div>
		<div class="uk-text-lead uk-link-text uk-text-center uk-margin-top">
			<router-link to="/">ぷりこねまっち</router-link>
		</div>
		<router-view></router-view>
		<div class="uk-margin-top" v-if="false">
			<button type="button" v-on:click="showUserId()">show user id</button>
			<button type="button" v-on:click="postClan()" class="uk-margin-left">post clan</button>
		</div>
	</div>
</template>
<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import Breadcrumb from './Breadcrumb';
import UIkit from 'uikit';
import firebase from 'firebase/app';
import * as utility from './utility';

@Component({
	components: {
		Breadcrumb
	},
})
export default class Host extends Vue {
	private auth: any = firebase.auth();
	private db = firebase.firestore();
	private status: 'existed' | 'none' = 'none';
	private userId: string = '';
	
	async logout(): Promise<void> {
		await this.auth.signOut();
	}

	async updateMenu(): Promise<void> {
		this.status = 'none';
		if (this.$store.state.authentication === 'login') {
			this.userId = this.auth.currentUser.uid;
			const doc = await this.db.collection('clans').doc(this.userId).get();
			if (doc.exists) {
				this.status = 'existed';
			}
		}
	}

	closeMenu(): void {
		UIkit.offcanvas('#menu').hide();
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
