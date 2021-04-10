<template>
	<div>
		<div v-if="!ready" class="uk-margin-top uk-text-center">
			<div uk-spinner></div>
			<div class="uk-margin-small-top uk-text-bold">ロード中です</div>
		</div>
		<div v-else-if="userIds.length === 0" class="uk-margin-top uk-text-center uk-text-bold">
			ブックマークがありません
		</div>
		<div v-else uk-grid class="uk-margin-top uk-grid-small uk-child-width-1-1">
			<div v-for="(e, i) in userIds" v-bind:key="e">
				<div class="uk-card uk-card-default uk-card-small uk-card-hover uk-card-body">
					<div uk-grid class="uk-grid-small uk-child-width-1-1 uk-child-width-1-2@s uk-child-width-1-2@m uk-child-width-1-2@l">
						<div class="uk-flex uk-flex-middle uk-flex-center" uk-lightbox>
							<a v-bind:href="imagePaths[i]">
								<img v-bind:src="imagePaths[i]" v-bind:style="`max-height: ${imageMaxHeight}px`">
							</a>
						</div>
						<div class="link-wo-line" v-on:click="goToProfile(e)">
							<span class="uk-text-bold link">{{ names[i] }}</span>
							<span v-if="bookmarkable">
								<a uk-icon="bookmark" class="uk-margin-small-left bookmark" v-if="bookmarks.includes(e)" v-on:click="removeBookmark($event, e)"></a>
								<a uk-icon="bookmark" class="uk-margin-small-left" v-else v-on:click="addBookmark($event, e)"></a>
							</span>
							<div class="uk-margin-small-top">
								<div uk-grid class="uk-grid-collapse">
									<div v-for="e in clanTags[i]" v-bind:key="e">
										<label class="link-wo-line uk-label">{{ e }}</label>
									</div>
								</div>
							</div>
							<div class="uk-margin-small-top">{{ descriptions[i] }}</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
<script lang="ts">
import Vue from 'vue';
import {Route, RawLocation} from 'vue-router';
import Component from 'vue-class-component';
import UIkit from 'uikit';
import SearchForm from './SearchForm';
import * as utility from './utility';
import firebase from 'firebase/app';

@Component
export default class Bookmark extends Vue {
	private db = firebase.firestore();
	private auth: any = firebase.auth();
	private allTags: utility.Tags = [];
	private ready: boolean = false;
	private readonly imageMaxHeight: number = 200;
	private timeoutId: number = 0;
	private firstSearched: boolean = false;
	private bookmarks: string[] = [];
	private bookmarkable: boolean = false;

	private condition: {[key: string]: any} = {
		keyword: '',
		tag: {},
	};
	private conditionCache: {[key: string]: any} = {};
	private names: string[] = [];
	private imagePaths: string[] = [];
	private userIds: string[] = [];
	private clanTags: string[][] = [];
	private descriptions: string[] = [];
	private startIndex: number | null = 0;

	async created(): Promise<void> {
		this.allTags = utility.getTags().map(e => {
			e.values = [''].concat(e.values);
			return e;
		});
		for (let e of this.allTags) {
			this.condition.tag[e.label] = {name: e.name, value: ''};
		}
		this.timeoutId = setTimeout(this.load, 100);

		const showBookmarks = async () => {
			if (this.$store.state.authentication === 'login') {
				this.bookmarkable = true;
				const user = this.auth.currentUser;
				const doc: any = await this.db.collection('bookmarks').doc(user.uid).get();
				if (doc.exists) {
					this.bookmarks = doc.data().userIds;
				}
			}
		};

		const bookmarkResult = this.$store.state.bookmarkResult;
		if (bookmarkResult !== null) {
			this.condition = Object.assign({}, JSON.parse(JSON.stringify(bookmarkResult.conditionCache)));
			this.conditionCache = Object.assign({}, JSON.parse(JSON.stringify(bookmarkResult.conditionCache)));
			this.names = bookmarkResult.names;
			this.imagePaths = bookmarkResult.imagePaths;
			this.userIds = bookmarkResult.userIds;
			this.clanTags = bookmarkResult.clanTags;
			this.descriptions = bookmarkResult.descriptions;
			this.startIndex = bookmarkResult.startIndex;
			this.ready = true;
			this.firstSearched = true;
			await showBookmarks();
			return;
		}

		await showBookmarks();
		await this.preProcessSearch(false);
	}

	destroyed(): void {
		clearTimeout(this.timeoutId);
	}

	async load(): Promise<void> {
		if (!this.firstSearched) {
			// do nothing
		}
		else if (document.documentElement.scrollHeight <= Math.ceil(document.documentElement.clientHeight + document.documentElement.scrollTop)) {
			await this.preProcessSearch(true);
		}
		this.timeoutId = setTimeout(this.load, 100);
	}

	async preProcessSearch(offset: boolean): Promise<void> {
		if (offset && this.startIndex === null) {
			return;
		}

		if (!offset) {
			this.names = [];
			this.clanTags = [];
			this.descriptions = [];
			this.userIds = [];
			this.imagePaths = [];
			this.startIndex = 0;
			this.ready = false;
			this.firstSearched = false;
			this.conditionCache = Object.assign({}, JSON.parse(JSON.stringify(this.condition)));
		}

		await this.searchBookmarks(offset);
		this.ready = true;
		this.firstSearched = true;
	}

	async searchBookmarks(offset: boolean): Promise<void> {
		const user = this.auth.currentUser;
		const bookmarksDoc: any = await this.db.collection('bookmarks').doc(user.uid).get();
		if (!bookmarksDoc.exists) {
			this.startIndex = null;
			return;
		}

		const limit = 5;
		const bookmarks = bookmarksDoc.data().userIds.slice(this.startIndex as number, (this.startIndex as number) + limit);
		if (bookmarks.length === 0) {
			this.startIndex = null;
			return;
		}

		const buf = {
			userIds: [] as string[],
			names: [] as string[],
			clanTags: [] as string[][],
			descriptions: [] as string[],
			imagePaths: [] as string[],
		};
		const querySnapshot = await this.db.collection('clans').where('userId', 'in', bookmarks).get();
		querySnapshot.forEach(doc => {
			const data = doc.data();
			if (data.closed) {
				return;
			}
			buf.userIds.push(doc.id);
			buf.names.push(data.name);
			const tags = Object.entries(data.tag).sort(utility.compareTags).map(e => e[1]) as string[];
			buf.clanTags.push(tags);
			let description = data.description;
			if (100 < description.length) {
				description = description.substr(0, 99) + '…';
			}
			buf.descriptions.push(description);
			let downloadUrl = data.downloadUrls.filter((e: string | null) => e !== null)[0];
			if (downloadUrl === undefined) {
				downloadUrl = './img/no_image.jpg';
			}
			buf.imagePaths.push(downloadUrl);
		});
		this.startIndex = (this.startIndex as number) + limit;

		for (let bookmark of bookmarks) {
			for (let i = 0; i < buf.userIds.length; ++i) {
				if (bookmark === buf.userIds[i]) {
					this.userIds.push(buf.userIds[i]);
					this.names.push(buf.names[i]);
					this.clanTags.push(buf.clanTags[i]);
					this.descriptions.push(buf.descriptions[i]);
					this.imagePaths.push(buf.imagePaths[i]);
				}
			}
		}

		if (buf.userIds.length === 0) {
			await this.searchBookmarks(true);
		}
	}

	async addBookmark(event: any, userId: string): Promise<void> {
		event.stopPropagation();
		await utility.addBookmark(userId);
		this.bookmarks.push(userId);
	}

	async removeBookmark(event: any, userId: string): Promise<void> {
		event.stopPropagation();
		await utility.removeBookmark(userId);
		this.bookmarks = this.bookmarks.filter((e: string) => e !== userId);
	}

	goToProfile(userId: string): void {
		this.saveBookmarkResult();
		this.$router.push(`/profile/${userId}`);
	}

	saveBookmarkResult(): void {
		const value = {
			conditionCache: JSON.parse(JSON.stringify(this.conditionCache)),
			names: this.names,
			imagePaths: this.imagePaths,
			userIds: this.userIds,
			clanTags: this.clanTags,
			descriptions: this.descriptions,
			startIndex: this.startIndex,
			scrollTop: document.documentElement.scrollTop,
		};
		this.$store.commit('setBookmarkResult', value);
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

.link:hover {
	cursor: pointer;
	text-decoration: underline;
	text-decoration-color: #0F6ECD;
}

.link-wo-line:hover {
	cursor: pointer;
}
</style>
