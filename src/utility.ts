import firebase from 'firebase/app';
import dayjs from 'dayjs';
import {v4 as uuid} from 'uuid';

export function getTags(kind: string): string[] {
	switch (kind) {
		case 'rank':
			return [
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
			];
			break;
		case 'play':
			return [
				'自由にプレイ',
				'まったりプレイ',
				'がっつりプレイ',
				'初心者OK',
				'わいわいプレイ',
			];
			break;
		case 'login':
			return [
				'毎日ログイン',
				'2日以内ログイン',
			];
			break;
		case 'silence':
			return [
				'無言OK',
				'無言NG',
			];
			break;
		default:
			console.error('getTags invalid kind', kind);
			break;
	}
	return [];
}

export function showUserId(): void {
	const user = firebase.auth().currentUser;
	console.log(user?.uid);
}

export async function postClan(): Promise<void> {
	const rankTags = getTags('rank');
	const playTags = getTags('play');
	const loginTags = getTags('login');
	const silenceTags = getTags('silence');
	const tags = [rankTags, playTags, loginTags, silenceTags].flat();
	let x = 0;
	let y = 0;
	let z = 0;
	let w = 0;

	for (let i = 0; i < 10; i++) {
		const now = dayjs().format('YYYY-MM-DDTHH:mm:ss.SSS[+09:00]') + ' ' + uuid();
		const doc = {
			name: 'テストクラン' + i,
			description: 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン。' + i,
			tags: [rankTags[0], playTags[y], loginTags[z], silenceTags[w]],
			downloadUrls: [null, null, null, null],
			created_at: now,
			updated_at: now,
		};
		let suffix = i.toString();
		if (i < 10) {
			suffix = '0' + i;
		}
		await firebase.firestore().collection('clans').doc('TestUserId' + suffix).set(doc);

		x++;
		y++;
		z++;
		w++;
		if (x === rankTags.length) {
			x = 0;
		}
		if (y === playTags.length) {
			y = 0;
		}
		if (z === loginTags.length) {
			z = 0;
		}
		if (w === silenceTags.length) {
			w = 0;
		}
	}
	console.log('complete');
}
