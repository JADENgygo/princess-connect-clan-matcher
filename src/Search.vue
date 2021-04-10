<template>
	<div>
		<search-form class="uk-margin-top" v-model="condition" v-bind:allTags="allTags" v-bind:grid="true" v-on:search="preProcessSearch($event)"></search-form>
		<div v-if="!ready" class="uk-margin-top uk-text-center">
			<div uk-spinner></div>
			<div class="uk-margin-small-top uk-text-bold">検索中です</div>
		</div>
		<div v-else-if="userIds.length === 0" class="uk-margin-top uk-text-center uk-text-bold">
			検索結果がありません
		</div>
		<div v-else uk-grid class="uk-margin-top uk-grid-small uk-child-width-1-1">
			<div v-for="(e, i) in userIds" v-bind:key="e">
				<div class="uk-card uk-card-default uk-card-small uk-card-hover uk-card-body">
					<div uk-grid class="uk-grid-small uk-child-width-1-1 uk-child-width-1-2@s">
						<div class="uk-flex uk-flex-middle uk-flex-center" uk-lightbox>
							<a v-bind:href="imagePaths[i]">
								<img v-bind:src="imagePaths[i]" v-bind:style="`max-height: ${imageMaxHeight}px`">
							</a>
						</div>
						<div v-on:click="goToProfile(e)" class="link-wo-line">
							<span class="uk-text-bold link">{{ names[i] }}</span>
							<span v-if="bookmarkable">
								<a uk-icon="bookmark" class="uk-margin-small-left bookmark" v-if="bookmarks.includes(e)" v-on:click="removeBookmark($event, e)"></a>
								<a uk-icon="bookmark" class="uk-margin-small-left" v-else v-on:click="addBookmark($event, e)"></a>
							</span>
							<div uk-grid class="uk-grid-collapse uk-margin-small-top">
								<div v-for="e in clanTags[i]" v-bind:key="e">
									<label class="link-label uk-label" v-on:click="searchByTag($event, e)">{{ e }}</label>
								</div>
							</div>
							<div class="uk-margin-small-top">{{ descriptions[i] }}</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div>
			<div class="uk-text-right uk-margin-large-right">
				<a href="#search-offcanvas" uk-toggle>
					<span class="float-button" uk-icon="icon: search; ratio: 2"></span>
				</a>
			</div>
			<div id="search-offcanvas" uk-offcanvas="overlay: true">
				<div class="uk-offcanvas-bar uk-text-center">
					<search-form v-model="condition" v-bind:allTags="allTags" v-bind:grid="false" v-on:search="searchByFloatButton($event)"></search-form>
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

@Component({
	components: {
		SearchForm
	},
})
export default class Search extends Vue {
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
	private closed: boolean[] = [];
	private startCreatedAt: any = null;

	async created(): Promise<void> {
		this.allTags = utility.getTags().map(e => {
			e.values = [''].concat(e.values);
			return e;
		});
		for (let e of this.allTags) {
			this.$set(this.condition.tag, e.label, {name: e.name, value: ''});
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

		const searchResult = this.$store.state.searchResult;
		if (searchResult !== null) {
			this.condition = Object.assign({}, JSON.parse(JSON.stringify(searchResult.conditionCache)));
			this.conditionCache = Object.assign({}, JSON.parse(JSON.stringify(searchResult.conditionCache)));
			this.names = searchResult.names;
			this.imagePaths = searchResult.imagePaths;
			this.userIds = searchResult.userIds;
			this.clanTags = searchResult.clanTags;
			this.descriptions = searchResult.descriptions;
			this.closed = searchResult.closed;
			this.startCreatedAt = searchResult.startCreatedAt;
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

	searchByFloatButton(offset: boolean): void {
		UIkit.offcanvas('#search-offcanvas').hide();
		window.scrollTo(0, 0);
		this.preProcessSearch(offset);
	}

	searchByTag(event: any, searchTag: string): void {
		event.stopPropagation();
		for (let e of this.allTags) {
			this.condition.tag[e.label].value = '';
			for (let tag of e.values) {
				if (searchTag === tag) {
					this.condition.tag[e.label].value = tag;
					break;
				}
			}
		}
		this.preProcessSearch(false);
	}

	async preProcessSearch(offset: boolean): Promise<void> {
		if (offset && this.startCreatedAt === null) {
			return;
		}

		if (!offset) {
			this.names = [];
			this.clanTags = [];
			this.descriptions = [];
			this.userIds = [];
			this.imagePaths = [];
			this.closed = [];
			this.startCreatedAt = null;
			this.ready = false;
			this.firstSearched = false;
			this.conditionCache = Object.assign({}, JSON.parse(JSON.stringify(this.condition)));
		}

		await this.searchClans(offset);
		this.ready = true;
		this.firstSearched = true;
	}

	async searchClans(offset: boolean): Promise<void> {
		let querySnapshot;
		const limit = 10;
		if (offset) {
			querySnapshot = await this.db.collection('clans').orderBy('updated_at', 'desc').startAfter(this.startCreatedAt).limit(limit).get();
		}
		else {
			querySnapshot = await this.db.collection('clans').orderBy('updated_at', 'desc').limit(limit).get();
		}
		if (querySnapshot.docs.length === 0) {
			this.startCreatedAt = null;
			return;
		}
		this.startCreatedAt = querySnapshot.docs[querySnapshot.docs.length - 1];

		const buf: {[key: string]: any} = {
			userIds: [],
			names: [],
			clanTags: [],
			descriptions: [],
			imagePaths: [],
			closed: [],
		};
		querySnapshot.forEach((d: any) => {
			const doc: any = d.data();
			buf.userIds.push(d.id);
			buf.names.push(doc.name);
			const tags = Object.entries(doc.tag).sort(utility.compareTags).map(e => e[1]);
			buf.clanTags.push(tags);
			let description = doc.description;
			if (100 < description.length) {
				description = description.substr(0, 99) + '…';
			}
			buf.descriptions.push(description);
			let downloadUrl = doc.downloadUrls.filter((e: string | null) => e !== null)[0];
			if (downloadUrl === undefined) {
				downloadUrl = './img/no_image.jpg';
			}
			buf.imagePaths.push(downloadUrl);
			buf.closed.push(doc.closed);
		});

		const condition = offset ? this.conditionCache : this.condition;
		let searchTags = [];
		for (let label in condition.tag) {
			searchTags.push(condition.tag[label].value);
		}
		searchTags = searchTags.filter(e => e !== '');
		const clansFiltered = [...Array(querySnapshot.docs.length)].map(() => true);
		for (let clanIndex = 0; clanIndex < clansFiltered.length; ++clanIndex) {
			for (let searchTagIndex = 0; searchTagIndex < searchTags.length; ++searchTagIndex) {
				let found = false;
				for (let key in buf.clanTags[clanIndex]) {
					if (buf.clanTags[clanIndex][key] === searchTags[searchTagIndex]) {
						found = true;
					}
				}
				if (!found) {
					clansFiltered[clanIndex] = false;
					break;
				}
			}
		}

		const keyword = offset ? this.conditionCache.keyword : this.condition.keyword;
		if (keyword !== '') {
			for (let i = 0; i < querySnapshot.docs.length; ++i) {
				if (!clansFiltered[i]) {
					continue;
				}
				if (!buf.names[i].includes(keyword) && !buf.descriptions[i].includes(keyword)) {
					clansFiltered[i] = false;
				}
			}
		}

		for (let i = 0; i < querySnapshot.docs.length; ++i) {
			if (!clansFiltered[i]) {
				continue;
			}
			if (buf.closed[i]) {
				clansFiltered[i] = false;
			}
		}

		this.userIds = this.userIds.concat(buf.userIds.filter((e: string, i: number) => clansFiltered[i]));
		this.names = this.names.concat(buf.names.filter((e: string, i: number) => clansFiltered[i]));
		this.imagePaths = this.imagePaths.concat(buf.imagePaths.filter((e: string, i: number) => clansFiltered[i]));
		this.clanTags = this.clanTags.concat(buf.clanTags.filter((e: string[], i: number) => clansFiltered[i]));
		this.descriptions = this.descriptions.concat(buf.descriptions.filter((e: string, i: number) => clansFiltered[i]));

		const added = clansFiltered.some(e => e);
		if (!added) {
			await this.searchClans(true);
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
		this.saveSearchResult();
		this.$router.push(`/profile/${userId}`);
	}

	saveSearchResult(): void {
		const value = {
			conditionCache: JSON.parse(JSON.stringify(this.conditionCache)),
			names: this.names,
			imagePaths: this.imagePaths,
			userIds: this.userIds,
			clanTags: this.clanTags,
			descriptions: this.descriptions,
			startCreatedAt: this.startCreatedAt,
			scrollTop: document.documentElement.scrollTop,
		};
		this.$store.commit('setSearchResult', value);
	}
}
</script>
<style scoped>
.float-button {
	position: fixed;
	bottom: 10px;
}

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

.link-label:hover {
	cursor: pointer;
	text-decoration: underline;
	text-decoration-color: white;
}
</style>
