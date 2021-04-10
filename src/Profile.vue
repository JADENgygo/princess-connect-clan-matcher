<template>
	<div class="uk-margin-top">
		<div v-if="!ready" class="uk-text-center">
			<div uk-spinner></div>
			<div class="uk-margin-small-top uk-text-bold">ロード中です</div>
		</div>
		<div v-else class="uk-text-bold">
			{{ name }}
			<span v-if="bookmarkable">
				<a uk-icon="bookmark" class="uk-margin-small-left bookmark" v-if="bookmarked" v-on:click="removeBookmark()"></a>
				<a uk-icon="bookmark" class="uk-margin-small-left" v-else v-on:click="addBookmark()"></a>
			</span>
		</div>
		<div uk-grid class="uk-grid-collapse uk-margin-top">
			<div v-for="e in tags" v-bind:key="e">
				<label class="uk-label">{{ e }}</label>
			</div>
		</div>
		<div uk-grid class="uk-margin-top uk-grid-small uk-text-center uk-child-width-1-2 uk-child-width-1-3@s uk-child-width-1-4@m uk-child-width-1-4@l">
			<div v-for="(e, i) in imagePaths" v-bind:key="e" uk-lightbox><a v-bind:href="e"><img v-bind:src="e"></a></div>
		</div>
		<div class="uk-margin-top"><pre class="description uk-text-bold">{{ description }}</pre></div>
		<div class="uk-margin-top" v-if="screenName.trim() !== ''">
			Twitter: <a v-bind:href="'https://twitter.com/' + screenName" target="_blank">@{{ screenName }}</a>
		</div>
		<button type="button" class="uk-button uk-button-small uk-button-primary uk-margin-top" v-on:click="editProfile()" v-if="editable">編集</button>
	</div>
</template>
<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import firebase from 'firebase/app';
import dayjs from 'dayjs';
import {v4 as uuid} from 'uuid';
import * as utility from './utility';

const Props = Vue.extend({
	props: {
		userId: String,
	}
});

@Component
export default class Profile extends Props {
	private db = firebase.firestore();
	private auth = firebase.auth();
	private storage = firebase.storage();
	private name: string = '';
	private tags: string[] = [];
	private imagePaths: string[] = [];
	private description: string = '';
	private screenName: string = '';
	private editable: boolean = false;
	private bookmarkable: boolean = false;
	private bookmarked: boolean = false;
	private ready: boolean = false;

	async created(): Promise<void> {
		const d = await this.db.collection('clans').doc(this.userId).get();
		const doc: any = d.data();
		this.name = doc.name;
		const tags_: any = Object.entries(doc.tag).sort(utility.compareTags);
		for (let e of tags_) {
			this.tags.push(e[1]);
		}
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
			this.bookmarkable = true;
			const user: any = this.auth.currentUser;
			if (user.uid === this.userId) {
				this.editable = true;
			}

			const bookmarksDoc = await this.db.collection('bookmarks').doc(user.uid).get();
			if (bookmarksDoc.exists) {
				const data: any = bookmarksDoc.data();
				this.bookmarked = data.userIds.includes(this.userId);
			}
		}
		this.ready = true;
	}

	editProfile(): void {
		this.$router.push('/edit');
	}

	async addBookmark(): Promise<void> {
		await utility.addBookmark(this.userId);
		this.bookmarked = true;
	}

	async removeBookmark(): Promise<void> {
		await utility.removeBookmark(this.userId);
		this.bookmarked = false;
	}
}
</script>
<style scoped>
.bookmark >>> svg {
	color: #1E87F0;
}

.bookmark >>> polygon {
	fill: #1E87F0;
}

.description {
	border: none;
	white-space: pre-wrap;
	padding: 0;
	margin: 0;
}

</style>
