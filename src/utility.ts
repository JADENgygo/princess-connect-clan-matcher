import Vue from 'vue';
import Component from 'vue-class-component';
import firebase from 'firebase/app';
import dayjs from 'dayjs';
import {v4 as uuid} from 'uuid';

export type Tags = {name: string, label: string, values: string[]}[];

const order: any = {
	'rank': 0,
	'policy': 1,
	'login': 2,
	'chat': 3,
	'tool': 4,
	'battleCount': 5,
	'auto': 6,
	'equipmentRequest': 7,
	'battleDeclaration': 8,
	'level': 9,
	'strength': 10,
	'character': 11,
};

export function compareTags(a: any[], b: any[]): number {
	return order[a[0]] - order[b[0]];
}

export function getTags(): Tags {
	return [
		{
			name: '順位目標',
			label: 'rank',
			values: [
				'~50位目標',
				'~100位目標',
				'~150位目標',
				'~300位目標',
				'~500位目標',
				'~700位目標',
				'~1000位目標',
				'~1500位目標',
				'~2000位目標',
				'~3000位目標',
				'~4500位目標',
				'~5000位目標',
				'~7000位目標',
				'~10000位目標',
				'~15000位目標',
				'目標無し',
			]
		},
		{
			name: '活動方針',
			label: 'policy',
			values: [
				'自由にプレイ',
				'まったりプレイ',
				'がっつりプレイ',
				'初心者OK',
				'わいわいプレイ',
			],
		},
		{
			name: 'ログイン',
			label: 'login',
			values: [
				'毎日ログイン',
				'2日以内ログイン',
				'3日以内ログイン',
				'4日以内ログイン',
				'5日以内ログイン',
				'6日以内ログイン',
				'7日以内ログイン',
				'ログイン制限無し',
			],
		},
		{
			name: 'チャット',
			label: 'chat',
			values: [
				'無言OK',
				'無言NG',
			],
		},
		{
			name: 'ツール',
			label: 'tool',
			values: [
				'Discord必須(vc必須)',
				'Discord必須(vc任意)',
				'Discord必須(vc無し)',
				'Discord任意(vc任意)',
				'Discord任意(vc無し)',
				'Twitter必須',
				'Twitter任意',
				'外部ツール無し',
			],
		},
		{
			name: '凸数',
			label: 'battleCount',
			values: [
				'3凸必須',
				'2凸以上必須',
				'1凸以上必須',
				'凸数任意',
			],
		},
		{
			name: 'オート設定',
			label: 'auto',
			values: [
				'オートOK',
				'オートNG',
			],
		},
		{
			name: '装備リク',
			label: 'equipmentRequest',
			values: [
				'装備リクOK',
				'装備リクNG',
			],
		},
		{
			name: '凸宣言',
			label: 'battleDeclaration',
			values: [
				'凸宣言有り',
				'凸宣言無し',
			],
		},
		{
			name: 'レベル',
			label: 'level',
			values: [
				'要カンスト',
				'レベル100以上',
				'レベル制限無し',
			],
		},
		{
			name: '全キャラ戦力',
			label: 'strength',
			values: [
				'戦力200万以上',
				'戦力100万以上',
				'戦力制限無し',
			],
		},
		{
			name: '所持キャラ',
			label: 'character',
			values: [
				'所持キャラ確認有り',
				'所持キャラ不問',
			],
		}
	];
}

export async function addBookmark(userId: string): Promise<void> {
	const db = firebase.firestore();
	const auth = firebase.auth();
	const user: any = auth.currentUser;
	const doc: any = await db.collection('bookmarks').doc(user.uid).get();
	if (doc.exists) {
		const bookmarks = {
			userIds: [userId, ...(doc.data().userIds)],
			updated_at: dayjs().format('YYYY-MM-DDTHH:mm:ss.SSS[+09:00]') + ' ' + uuid(),
		};
		await db.collection('bookmarks').doc(user.uid).update(bookmarks);
	}
	else {
		const bookmarks = {
			userIds: [userId],
			created_at: dayjs().format('YYYY-MM-DDTHH:mm:ss.SSS[+09:00]') + ' ' + uuid(),
			updated_at: null,
		};
		await db.collection('bookmarks').doc(user.uid).set(bookmarks);
	}
}

export async function removeBookmark(userId: string): Promise<void> {
	const db = firebase.firestore();
	const auth = firebase.auth();
	const user: any = auth.currentUser;
	const doc: any = await db.collection('bookmarks').doc(user.uid).get();
	const bookmarks = {
		userIds: doc.data().userIds.filter((e: string) => e !== userId)
	};
	await db.collection('bookmarks').doc(user.uid).update(bookmarks);
}

// 以下、デバッグ用
export function showUserId(): void {
	const user = firebase.auth().currentUser;
	console.log(user?.uid);
}

export async function postClan(): Promise<void> {
	const tags = getTags();
	const tagIndices = [...Array(tags.length)].map(() => 0);
	let imageIndex = 0;

	for (let i = 0; i < 100; i++) {
		const ref0 = firebase.storage().ref(`test/test${imageIndex}.jpg`);
		const downloadUrl0 = await ref0.getDownloadURL();
		const ref1 = firebase.storage().ref(`test/test${imageIndex + 1}.jpg`);
		const downloadUrl1 = await ref1.getDownloadURL();
		const now = dayjs().format('YYYY-MM-DDTHH:mm:ss.SSS[+09:00]') + ' ' + uuid();
		const downloadUrls = [null, null, null, null];
		downloadUrls[i % 4] = downloadUrl0;
		downloadUrls[(i + 1) % 4] = downloadUrl1;
		let suffix = i.toString();
		if (i < 10) {
			suffix = '0' + i;
		}
		const tag: any = {};
		for (let i = 0; i < tags.length; ++i) {
			tag[tags[i].label] = tags[i].values[tagIndices[i]];
		}
		const userId = 'TestUserId' + suffix;
		const doc = {
			userId: userId,
			name: 'テストクラン' + suffix,
			description: 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン。' + i,
			tag: tag,
			downloadUrls: downloadUrls,
			screenName: '',
			closed: false,
			created_at: now,
			updated_at: now,
		};

		await firebase.firestore().collection('clans').doc(userId).set(doc);

		for (let i = 0; i < tagIndices.length; i++) {
			tagIndices[i]++;
			if (tagIndices[i] === tags[i].values.length) {
				tagIndices[i] = 0;
			}
		}

		imageIndex = imageIndex + 2;
		if (imageIndex === 100) {
			imageIndex = 0;
		}
	}
	console.log('complete');
}
