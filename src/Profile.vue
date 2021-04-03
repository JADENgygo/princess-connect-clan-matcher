<template>
	<div class="uk-margin-top">
		<div class="uk-text-bold">{{ name }}</div>
		<div uk-grid class="uk-grid-small uk-margin-top">
			<div v-for="e in tags" v-bind:key="e">
				<label class="uk-label">{{ e }}</label>
			</div>
		</div>
		<div uk-grid class="uk-margin-top uk-grid-small uk-text-center uk-child-width-1-2 uk-child-width-1-3@s uk-child-width-1-4@m uk-child-width-1-4@l">
			<div v-for="(e, i) in imagePaths" v-bind:key="e" uk-lightbox><a v-bind:href="e"><img v-bind:src="e"></a></div>
		</div>
		<div class="uk-margin-top">{{ description }}</div>
		<div class="uk-margin-top">
			連絡先: <a v-bind:href="'https://twitter.com/' + screenName" target="_blank">@{{ screenName }}</a>
		</div>
		<button type="button" class="uk-margin-top uk-button uk-button-small uk-button-primary" v-on:click="editProfile()" v-if="editable">編集</button>
	</div>
</template>
<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import firebase from 'firebase/app';

const Props = Vue.extend({
	props: {
		userId: String,
	}
});

@Component
export default class Profile extends Props {
	db = firebase.firestore();
	auth = firebase.auth();
	storage = firebase.storage();
	name: string = '';
	tags: string[] = [];
	imagePaths: string[] = [];
	description: string = '';
	screenName: string = '';
	editable: boolean = false;

	async created(): Promise<void> {
		const d = await this.db.collection('clans').doc(this.userId).get();
		const doc: any = d.data();
		this.name = doc.name;
		this.tags = doc.tags;
		this.description = doc.description;
		this.screenName = doc.screenName;
		for (let i = 0; i < 4; ++i) {
			if (doc.downloadUrls[i] === null) {
				continue;
			}
			this.imagePaths.push(doc.downloadUrls[i]);
		}
		if (this.imagePaths.length === 0) {
			this.imagePaths.push('./img/no_image.jpg');
		}

		if (this.$store.state.authentication === 'login') {
			const user: any = this.auth.currentUser;
			if (user.uid === this.userId) {
				this.editable = true;
			}
		}
	}

	editProfile(): void {
		this.$router.push('/edit');
	}
}
</script>
<style scoped>
</style>
