<template>
	<div class="uk-margin-top">
		<div v-if="processed" class="uk-text-center">
			<div uk-spinner></div>
			<div class="uk-margin-small-top uk-text-bold">{{ processedMessage }}</div>
		</div>
		<div v-else>
			<div class="uk-form-stacked uk-margin-top">
				<label class="uk-form-label" for="clan-name">クラン名</label>
				<div class="uk-form-controls">
					<input type="text" id="clan-name" class="uk-input uk-form-small uk-form-width-medium" v-bind:class="{'uk-form-danger': nameRequired}" v-model="name" v-bind:placeholder="inputRequiredMessage">
				</div>
				<ul uk-accordion>
					<li>
						<a class="uk-accordion-title uk-text-small">タグ</a>
						<div class="uk-accordion-content">
							<div uk-grid class="uk-grid-small uk-form-controls">
								<div v-for="e in allTags" v-bind:key="e.label">
									<div class="uk-form-label uk-text-center">{{ e.name }}</div>
									<input type="checkbox" class="uk-checkbox" v-model="enabledTags" v-bind:value="e.label">
									<select class="uk-select uk-form-small uk-form-width-small" v-model="tag[e.label]" v-bind:disabled="!enabledTags.includes(e.label)">
										<option v-for="tag in e.values" v-bind:key="tag">{{ tag }}</option>
									</select>
								</div>
							</div>
						</div>
					</li>
				</ul>
				<div class="uk-form-label uk-margin-top">プロフィール画像</div>
				<div uk-grid class="uk-grid-small uk-text-center uk-child-width-1-2 uk-child-width-1-3@s uk-child-width-1-4@m uk-child-width-1-4@l">
					<div v-for="(e, i) in images" v-bind:key="e.url">
						<div class="uk-form-label">{{ (i + 1) + '枚目' }}</div>
						<div class="uk-form-controls">
							<img v-if="e.src !== ''" v-bind:src="e.src">
							<div uk-form-custom>
								<input type="file" v-on:change="selectImage($event, i)" accept=".jpg,.jpeg" v-bind:id="'image' + i">
								<button class="uk-margin-small-top uk-button uk-button-default uk-button-small" type="button" tabindex="-1">画像の選択</button>
							</div>
						</div>
						<button type="button" class="uk-margin-small-top uk-button uk-button-small uk-button-default" v-on:click="removeImage(i)">選択を解除</button>
					</div>
				</div>
				<label class="uk-margin-top uk-form-label" for="description">クラン説明</label>
				<div class="uk-form-controls">
					<textarea class="uk-textarea" id="description" rows="5" v-model="description"></textarea>
				</div>
				<label class="uk-margin-top uk-form-label" for="screen-name">連絡先Twitterアカウント名</label>
				<div class="uk-form-controls">
					@ <input type="text" id="screen-name" class="uk-input uk-form-small uk-form-width-small" v-model="screenName">
				</div>
				<div class="uk-margin-top"><label><input type="checkbox" class="uk-checkbox" v-model="closed"> 非公開にする</label></div>
			</div>
			<div uk-grid class="uk-grid-small uk-child-width-1-2 uk-margin-top">
				<div class="uk-text-left">
					<button type="button" class="uk-button uk-button-small uk-button-primary" v-on:click="upload()">{{ uploadButtonText }}</button>
				</div>
				<div class="uk-text-right" v-if="type === 'edit'">
					<button class="uk-button uk-button-danger uk-button-small" type="button" uk-toggle="target: #modal">削除</button>
					<div id="modal" uk-modal>
						<div class="uk-modal-dialog uk-modal-body">
							<div>クラン登録を削除しますか</div>
							<div uk-grid class="uk-margin-top uk-grid-small uk-child-width-1-2">
								<div class="uk-text-left">
									<button class="uk-button uk-button-default uk-button-small uk-modal-close" type="button">閉じる</button>
								</div>
								<div class="uk-text-right">
									<button class="uk-button uk-button-danger uk-button-small uk-modal-close" type="button" v-on:click="deleteClan()">削除</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="uk-margin-top uk-text-danger" v-if="validationMessage !== ''">{{ validationMessage }}</div>
		</div>
	</div>
</template>
<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import firebase from 'firebase/app';
import UIkit from 'uikit';
import dayjs from 'dayjs';
import {v4 as uuid} from 'uuid';
import {getTags, Tags} from './utility';

@Component
export default class Upload extends Vue {
	private auth: any = firebase.auth();
	private db = firebase.firestore();
	private storage = firebase.storage();
	private name: string = '';
	private tag: {[key: string]: string} = {};
	private enabledTags: string[] = [];
	private allTags: Tags = [];
	private images: {src: string, data: any}[] = [...Array(4)].map(() => {
		return {src: '', data: null}
	});
	private description: string = '';
	private screenName: string = '';
	private closed: boolean = false;
	private processed: boolean = true;
	private nameRequired: boolean = false;
	private screenNameRequired: boolean = false;
	private inputRequiredMessage: string = '';
	private validationMessage: string = '';
	private type: 'edit' | 'add' = 'edit';
	private uploadButtonText: string = '登録';
	private processedMessage: string = 'ロード中です';

	async created(): Promise<void> {
		if (this.$router.currentRoute.name === 'register') {
			this.type = 'add';
		}

		this.allTags = getTags();
		for (let e of this.allTags) {
			this.tag[e.label] = e.values[0];
			if (this.type === 'add') {
				this.enabledTags.push(e.label);
			}
		}

		if (this.type === 'add') {
			this.processed = false;
			return;
		}

		const userId: string = this.auth.currentUser.uid;
		this.uploadButtonText = '変更';

		const d = await this.db.collection('clans').doc(userId).get();
		const doc: any = d.data();
		this.name = doc.name;
		for (let key in doc.tag) {
			this.tag[key] = doc.tag[key];
			this.enabledTags.push(key);
		}
		this.description = doc.description;
		this.screenName = doc.screenName;
		this.closed = doc.closed;
		for (let i = 0; i < 4; ++i) {
			this.$set(this.images[i], 'src', doc.downloadUrls[i] ?? '');
		}
		this.processed = false;
	}

	removeImage(index: number): void {
		(document.getElementById('image' + index) as HTMLInputElement).value = '';
		this.$set(this.images, index, {src: '', data: null});
	}

	async selectImage(event: any, index: number): Promise<void> {
		// 一度ダイアログで画像を選択した後に、もう一度ダイアログを開いてキャンセルすると本関数が呼ばれるがevent.target.files[0]がundefinedになるため
		if (!event.target.files[0]) {
			return;
		}
		const reader = new FileReader();
		reader.readAsArrayBuffer(event.target.files[0]);
		const validated = await new Promise(resolve => {
			reader.onload = (e: ProgressEvent<FileReader>): void => {
				const data = new Uint8Array(e.target?.result as ArrayBufferLike).subarray(0, 12);
				let header = '';
				for (let i = 0; i < data.length; ++i) {
					header += data[i].toString(16);
				}
				// jpg
				resolve(/^ffd8ff/.test(header));
			};
		});

		if (!validated) {
			UIkit.notification({
				message: 'JPEG画像のみ選択可能です',
				status: 'danger',
				pos: 'top-center',
				timeout: 5000
			});
			return;
		}

		const r = new FileReader();
		r.readAsDataURL(event.target.files[0]);
		await new Promise(resolve => {
			r.onload = () => {
				this.$set(this.images, index, {src: r.result, data: event.target.files[0]});
				resolve(true);
			};
		});
	}

	upload(): void {
		let error = false;
		this.nameRequired = false;
		this.screenNameRequired = false;
		if (this.name === '') {
			this.nameRequired = true;
			this.inputRequiredMessage = '入力は必須です';
			this.validationMessage = '入力欄に不備があります';
			error = true;
		}
		if (error) {
			return;
		}
		this.processed = true;
		this.processedMessage = 'アップロード中です';
		if (this.type === 'add') {
			this.addClan();
		}
		else {
			this.editClan();
		}
	}

	async addClan(): Promise<void> {
		const userId: string = this.auth.currentUser.uid;

		const downloadUrls = [null, null, null, null];
		for (let i = 0; i < 4; ++i) {
			if (this.images[i].data !== null) {
				const ref: any = this.storage.ref();
				const imageRef = ref.child(`${userId}/profile${i}.jpg`);
				await imageRef.put(this.images[i].data);
				const reference = this.storage.ref(`${userId}/profile${i}.jpg`);
				downloadUrls[i] = await reference.getDownloadURL();
			}
		}

		const now = dayjs().format('YYYY-MM-DDTHH:mm:ss.SSS[+09:00]') + ' ' + uuid();
		const tag_ = Object.assign({}, this.tag);
		for (let key in tag_) {
			if (!this.enabledTags.includes(key)) {
				delete tag_[key];
			}
		}
		const doc = {
			userId: userId,
			name: this.name,
			description: this.description,
			tag: tag_,
			downloadUrls: downloadUrls,
			screenName: this.screenName,
			closed: this.closed,
			created_at: now,
			updated_at: now,
		};
		await this.db.collection('clans').doc(userId).set(doc);
		this.$router.push(`/profile/${userId}`);
	}

	async editClan(): Promise<void> {
		const userId: string = this.auth.currentUser.uid;
		const d: any = await this.db.collection('clans').doc(userId).get();
		const doc = d.data();
		const existingUrls = doc.downloadUrls;
		const downloadUrls: (string | null)[] = [null, null, null, null];
		for (let i = 0; i < 4; ++i) {
			if (this.images[i].src !== '' && this.images[i].data === null) {
				downloadUrls[i] = this.images[i].src;
				continue;
			}
			const ref: any = this.storage.ref();
			const imageRef = ref.child(`${userId}/profile${i}.jpg`);
			if (this.images[i].data !== null) {
				await imageRef.put(this.images[i].data);
				const reference = this.storage.ref(`${userId}/profile${i}.jpg`);
				downloadUrls[i] = await reference.getDownloadURL();
			}
			else if (this.images[i].src === '' && existingUrls[i] !== null) {
				await imageRef.delete();
				downloadUrls[i] = null;
			}
		}

		const tag_ = Object.assign({}, this.tag);
		for (let key in tag_) {
			if (!this.enabledTags.includes(key)) {
				delete tag_[key];
			}
		}
		const doc_ = {
			name: this.name,
			description: this.description,
			tag: tag_,
			screenName: this.screenName,
			closed: this.closed,
			downloadUrls: downloadUrls,
			updated_at: dayjs().format('YYYY-MM-DDTHH:mm:ss.SSS[+09:00]') + ' ' + uuid(),
		};
		await this.db.collection('clans').doc(userId).update(doc_);

		this.$router.push(`/profile/${userId}`);
	}

	async deleteClan(): Promise<void> {
		this.processed = true;
		this.processedMessage = '削除処理中です';
		const userId: string = this.auth.currentUser.uid;
		const doc: any = await this.db.collection('clans').doc(userId).get();
		const downloadUrls = doc.data().downloadUrls;
		const ref: any = this.storage.ref();
		for (let i = 0; i < 4; ++i) {
			if (downloadUrls[i] !== null) {
				const imageRef = ref.child(`${userId}/profile${i}.jpg`);
				await imageRef.delete();
			}
		}

		await this.db.collection('clans').doc(userId).delete();
		this.$router.push('/');
	}
}
</script>
<style scoped>
</style>
