import UIkit from 'uikit';
import Icons from './uikit-icons';
import './uikit.min.css';
import Vue from 'vue';
import VueRouter from 'vue-router';
import Vuex from 'vuex';
import Host from './Host';
import Top from './Top';
import Search from './Search';
import Profile from './Profile';
import Login from './Login';
import Upload from './Upload';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/storage';

const firebaseConfig = {
	apiKey: "AIzaSyA2_udhyWb6xMgqpEQJDBi5hGmz3tJH2_Y",
	authDomain: "princess-connect-clan-searcher.firebaseapp.com",
	projectId: "princess-connect-clan-searcher",
	storageBucket: "princess-connect-clan-searcher.appspot.com",
	messagingSenderId: "802067432056",
	appId: "1:802067432056:web:8dc754f279df0fac9f238d",
	measurementId: "G-131PNM5BKN",
	databaseURL: 'gs://princess-connect-clan-searcher.appspot.com/',
};

firebase.initializeApp(firebaseConfig);

(UIkit.use as (UIkit: object) => void)(Icons);

Vue.config.productionTip = false;

Vue.use(Vuex);

const store = new Vuex.Store({
	state: {
		authentication: 'logout',
		searchResult: null,
	},
	mutations: {
		login(state) {
			state.authentication = 'login';
		},
		logout(state) {
			state.authentication = 'logout';
		},
		pushSearchResult(state, value) {
			state.searchResult = value;
		},
	}
});

Vue.use(VueRouter);

const router: VueRouter = new VueRouter({
	routes: [
		{path: '/', component: Top, name: 'root'},
		{path: '/search', component: Search, name: 'search'},
		{path: '/login', component: Login, name: 'login'},
		{path: '/register', component: Upload, name: 'register'},
		{path: '/edit', component: Upload, name: 'edit'},
		{path: '/profile/:userId', component: Profile, props: true, name: 'profile'},
	],
	scrollBehavior(to, from, savedPosition) {
		if (to.name === 'search' && from.name === 'profile') {
			if (store.state.searchResult === null) {
				return;
			}
			const position = Object.assign({}, savedPosition) as {x: number, y: number};
			position['y'] = (store.state.searchResult as any).scrollTop;
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
		if (to.name === 'delete' || to.name === 'register' || to.name === 'edit') {
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
		store.commit('pushSearchResult', null);
	}

	next();
});

async function start() {
	firebase.auth().getRedirectResult().then((result: any) => {
		if (!result.user) {
			return;
		}
	}).catch(error => {
		store.commit('logout');
		console.error('redirect result error');
		console.error(error);
	});

	await new Promise(resolve => {
		firebase.auth().onAuthStateChanged((user: any) => {
			if (user) {
				store.commit('login');
			}
			else {
				store.commit('logout');
			}
			resolve(user);
		});
	});

	new Vue({
		el: '#app',
		components: {
			Host,
		},
		template: '<Host/>',
		router,
		store
	});
}

start();
