import Vue from 'vue';
import VueRouter from 'vue-router';
import {store} from './store';
import Host from './Host';
import Top from './Top';
import Search from './Search';
import Bookmark from './Bookmark';
import Profile from './Profile';
import Login from './Login';
import Delete from './Delete';
import Upload from './Upload';
import firebase from 'firebase/app';

Vue.use(VueRouter);

export const router: VueRouter = new VueRouter({
	routes: [
		{path: '/', component: Top, name: 'root', meta: {title: 'トップ'}},
		{path: '/login', component: Login, name: 'login', meta: {title: 'ログイン'}},
		{path: '/register', component: Upload, name: 'register', meta: {title: 'クラン登録'}},
		{path: '/edit', component: Upload, name: 'edit', meta: {title: 'クラン編集'}},
		{path: '/delete', component: Delete, name: 'delete', meta: {title: 'アカウント削除'}},
		{path: '/search', component: Search, name: 'search', meta: {title: 'クラン検索'}},
		{path: '/bookmark', component: Bookmark, name: 'bookmark', meta: {title: 'ブックマーク'}},
		{path: '/profile/:userId', component: Profile, props: true, name: 'profile', meta: {title: 'クラン詳細'}},
	],
	scrollBehavior(to, from, savedPosition) {
		const toSearchFomProfile = to.name === 'search' && from.name === 'profile';
		const toBookmarkFomProfile = to.name === 'bookmark' && from.name === 'profile';
		if (!toSearchFomProfile && !toBookmarkFomProfile) {
			return;
		}
		if (toSearchFomProfile) {
			if (store.state.searchResult === null) {
				return;
			}
			const position = Object.assign({}, savedPosition) as {x: number, y: number};
			position['y'] = (store.state.searchResult as any).scrollTop;
			return position;
		}
		if (toBookmarkFomProfile) {
			if (store.state.bookmarkResult === null) {
				return;
			}
			const position = Object.assign({}, savedPosition) as {x: number, y: number};
			position['y'] = (store.state.bookmarkResult as any).scrollTop;
			return position;
		}
	}
});

router.beforeEach(async (to, from, next) => {
	if (to.name === undefined || to.name === null) {
		next('/');
		return;
	}

	if (store.state.authentication === 'logout') {
		if (['delete', 'register', 'edit', 'delete', 'bookmark'].includes(to.name)) {
			next('/');
			return;
		}
	}
	else {
		if (to.name === 'login') {
			next('/');
			return;
		}
		if (to.name === 'register') {
			const userId: string = (firebase.auth() as any).currentUser.uid;
			const doc = await firebase.firestore().collection('clans').doc(userId).get();
			if (doc.exists) {
				next('/');
				return;
			}
		}
		if (to.name === 'edit') {
			const userId: string = (firebase.auth() as any).currentUser.uid;
			const doc = await firebase.firestore().collection('clans').doc(userId).get();
			if (!doc.exists) {
				next('/');
				return;
			}
		}
	}

	if (to.name === 'profile') {
		const userId = to.params.userId;
		const clansDoc = await firebase.firestore().collection('clans').doc(userId).get();
		if (!clansDoc.exists) {
			next('/');
			return;
		}
	}

	if (!((to.name === 'search' && from.name === 'profile') || (to.name === 'profile' && from.name === 'search'))) {
		store.commit('setSearchResult', null);
	}

	if (!((to.name === 'bookmark' && from.name === 'profile') || (to.name === 'profile' && from.name === 'bookmark'))) {
		store.commit('setBookmarkResult', null);
	}

	next();
});
