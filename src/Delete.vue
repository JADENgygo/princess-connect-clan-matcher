<template>
	<div class="uk-margin-top uk-text-center">
		<div v-if="processed">
			<div uk-spinner></div>
		</div>
		<div v-else>
			<div>アカウントを削除すると、登録した全情報が削除されます</div>
			<div class="uk-margin-top">削除する場合は、確認のために以下の数字を入力してください</div>
			<div class="uk-margin-top">{{ passcode }}</div>
			<div><input type="text" v-model="inputPasscord" class="uk-input uk-form-small uk-form-width-medium uk-margin-top" v-on:input="confirmDeletion()"></div>
			<button type="button" class="uk-button uk-button-small uk-button-danger uk-margin-top" v-on:click="deleteAccount()" v-bind:disabled="!deletable">削除</button>
		</div>
	</div>
</template>
<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import firebase from 'firebase/app';

@Component
export default class Delete extends Vue {
	private auth: any = firebase.auth();
	private db = firebase.firestore();
	private storage = firebase.storage();
	private passcode: string = '';
	private deletable: boolean = false;
	private inputPasscord: string = '';
	private processed: boolean = true;

	async created(): Promise<void> {
		for (let i = 0; i < 4; i++) {
			this.passcode += Math.floor(Math.random() * 10);
		}

		try {
			const result = await this.auth.getRedirectResult();
			if (!result.credential) {
				return;
			}

			const user = this.auth.currentUser;
			const accountsDoc = await this.db.collection('accounts').doc(user.uid).get();
			if (!accountsDoc.exists) {
				return;
			}

			const clansDoc = await this.db.collection('clans').doc(user.uid).get();
			if (clansDoc.exists) {
				const data: any = clansDoc.data();
				const ref: any = this.storage.ref();
				for (let i = 0; i < 4; i++) {
					if (data.downloadUrls[i] !== null) {
						const imageRef = ref.child(`${user.uid}/profile${i}.jpg`);
						await imageRef.delete();
					}
				}
				await this.db.collection('clans').doc(user.uid).delete();
			}
			const bookmarksDoc = await this.db.collection('bookmarks').doc(user.uid).get();
			if (bookmarksDoc.exists) {
				await this.db.collection('bookmarks').doc(user.uid).delete();
			}
			await this.db.collection('accounts').doc(user.uid).delete();
			await user.delete();
			this.$router.push('/');
		}
		catch (error) {
			// 再ログイン画面でキャンセルするとここにくる
			// ログイン状態から再ログインするので確認画面は出ない？
		}
		finally {
			this.processed = false;
		}
	}

	confirmDeletion(): void {
		this.deletable = this.passcode === this.inputPasscord;
	}

	async deleteAccount(): Promise<void> {
		this.processed = true;
		const user = this.auth.currentUser;
		await this.db.collection('accounts').doc(user.uid).set({deleted: true});
		const provider = new firebase.auth.TwitterAuthProvider();
		await this.auth.signInWithRedirect(provider);
	}
}
</script>
<style scoped>
</style>
