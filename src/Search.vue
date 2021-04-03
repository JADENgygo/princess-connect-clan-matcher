<template>
	<div class="uk-margin-top">
		<search-form v-model="condition" v-bind:allTags="allTags" v-on:search="search($event)"></search-form>
		<div v-if="!ready" class="uk-margin-top uk-text-center">
			<div uk-spinner></div>
			<div class="uk-margin-small-top">検索中です</div>
		</div>
		<div v-else-if="userIds.length === 0" class="uk-margin-top uk-text-center uk-text-bold">
			検索結果がありません
		</div>
		<div v-else uk-grid class="uk-margin-top uk-grid-small uk-child-width-1-1">
			<div v-for="(e, i) in userIds" v-bind:key="e">
				<router-link v-bind:to="`/profile/${e}`" @click.native="saveSearchResult()">
					<div class="uk-card uk-card-default uk-card-small uk-card-hover uk-card-body">
						<div uk-grid class="uk-grid-small uk-child-width-1-1 uk-child-width-1-2@s uk-child-width-1-2@m uk-child-width-1-2@l">
							<div class="uk-flex uk-flex-middle uk-flex-center" uk-lightbox>
								<a v-bind:href="imagePaths[i]">
									<img v-bind:src="imagePaths[i]" v-bind:style="`max-height: ${imageMaxHeight}px`">
								</a>
							</div>
							<div>
								<div class="uk-text-bold">{{ names[i] }}</div>
								<div class="uk-margin-small-top">
									<div uk-grid class="uk-grid-collapse">
										<div v-for="e in clanTags[i]" v-bind:key="e">
											<label class="uk-label">{{ e }}</label>
										</div>
									</div>
								</div>
								<div class="uk-margin-small-top">{{ descriptions[i] }}</div>
							</div>
						</div>
					</div>
				</router-link>
			</div>
		</div>
		<div class="uk-text-right uk-margin-large-right"><span v-on:click="showSearchDialog()" class="float-button" uk-icon="icon: search; ratio: 2"></span></div>
		<div id="search-dialog" class="uk-flex-top uk-modal-container" uk-modal>
			<div class="uk-modal-dialog uk-modal-body uk-margin-auto-vertical">
				<button class="uk-modal-close-default" type="button" uk-close></button>
				<search-form v-model="condition" v-bind:allTags="allTags" v-on:search="search($event)"></search-form>
			</div>
		</div>
	</div>
</template>
<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import UIkit from 'uikit';
import SearchForm from './SearchForm';
import {getTags} from './utility';
import firebase from 'firebase/app';

@Component({
	components: {
		SearchForm
	}
})
export default class Search extends Vue {
	private db = firebase.firestore();
	private storage = firebase.storage();
	private allTags: {[key: string]: string[]} = {};
	private loaded: boolean = false;
	private ready: boolean = false;
	private readonly imageMaxHeight: number = 200;

	private condition: {[key: string]: any} = {
		keyword: '',
		rankTag: '',
		playTag: '',
		loginTag: '',
		silenceTag: '',
	};
	private conditionCache: {[key: string]: any} = {};
	private names: string[] = [];
	private imagePaths: string[] = [];
	private userIds: string[] = [];
	private clanTags: string[][] = [];
	private descriptions: string[] = [];
	private startCreatedAt: any = null;

	async created(): Promise<void> {
		window.addEventListener('scroll', this.load);
		this.allTags = {
			rank: [''].concat(getTags('rank')),
			play: [''].concat(getTags('play')),
			login: [''].concat(getTags('login')),
			silence: [''].concat(getTags('silence')),
		};

		const searchResult = this.$store.state.searchResult;
		if (searchResult !== null) {
			this.condition = Object.assign({}, searchResult.conditionCache);
			this.conditionCache = Object.assign({}, searchResult.conditionCache);
			this.names = searchResult.names;
			this.imagePaths = searchResult.imagePaths;
			this.userIds = searchResult.userIds;
			this.clanTags = searchResult.clanTags;
			this.descriptions = searchResult.descriptions;
			this.startCreatedAt = searchResult.startCreatedAt;
			this.ready = true;
			return;
		}

		await this.search(false);
		this.ready = true;
	}

	destroyed(): void {
		window.removeEventListener('scroll', this.load);
	}

	async load(): Promise<void> {
		if (!this.loaded && document.documentElement.scrollHeight <= Math.ceil(document.documentElement.clientHeight + document.documentElement.scrollTop)) {
			this.loaded = true;
			await this.search(true);
			this.loaded = false;
		}
	}

	async search(offset: boolean): Promise<void> {
		if (!offset) {
			this.ready = false;
			this.conditionCache = Object.assign({}, this.condition);
		}
		if (offset && this.startCreatedAt === null) {
			return;
		}

		if (!offset) {
			this.names = [];
			this.clanTags = [];
			this.descriptions = [];
			this.userIds = [];
			this.imagePaths = [];
			this.startCreatedAt = null;
		}

		let querySnapshot;
		const limit = 5;
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
		};
		querySnapshot.forEach((d: any) => {
			const doc: any = d.data();
			buf.userIds.push(d.id);
			buf.names.push(doc.name);
			buf.clanTags.push(doc.tags);
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
		});

		const searchTags = offset ? [this.conditionCache.rankTag, this.conditionCache.playTag, this.conditionCache.loginTag, this.conditionCache.silenceTag].filter(e => e !== '') :
			[this.condition.rankTag, this.condition.playTag, this.condition.loginTag, this.condition.silenceTag].filter(e => e !== '');
		const clansFiltered = [...Array(querySnapshot.docs.length)].map(() => true);
		for (let clanIndex = 0; clanIndex < clansFiltered.length; ++clanIndex) {
			for (let searchTagIndex = 0; searchTagIndex < searchTags.length; ++searchTagIndex) {
				let found = false;
				for (let i = 0; i < buf.clanTags[clanIndex].length; ++i) {
					if (buf.clanTags[clanIndex][i] === searchTags[searchTagIndex]) {
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

		this.userIds = this.userIds.concat(buf.userIds.filter((e: string, i: number) => clansFiltered[i]));
		this.names = this.names.concat(buf.names.filter((e: string, i: number) => clansFiltered[i]));
		this.imagePaths = this.imagePaths.concat(buf.imagePaths.filter((e: string, i: number) => clansFiltered[i]));
		this.clanTags = this.clanTags.concat(buf.clanTags.filter((e: string[], i: number) => clansFiltered[i]));
		this.descriptions = this.descriptions.concat(buf.descriptions.filter((e: string, i: number) => clansFiltered[i]));

		const added = clansFiltered.some(e => e);
		const enough = document.documentElement.scrollHeight !== document.documentElement.clientHeight;
		if (!added || !enough) {
			await this.search(true);
		}
		this.ready = true;
	}

	showSearchDialog(): void {
		UIkit.modal('#search-dialog').show();
	}

	saveSearchResult(): void {
		const value = {
			conditionCache: Object.assign({}, this.conditionCache),
			names: this.names,
			imagePaths: this.imagePaths,
			userIds: this.userIds,
			clanTags: this.clanTags,
			descriptions: this.descriptions,
			startCreatedAt: this.startCreatedAt,
			scrollTop: document.documentElement.scrollTop,
		};
		this.$store.commit('pushSearchResult', value);
	}
}
</script>
<style scoped>
.float-button {
	position: fixed;
	bottom: 10px;
}
</style>
