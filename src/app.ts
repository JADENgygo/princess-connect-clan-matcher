import UIkit from 'uikit';
import 'uikit/dist/css/uikit.min.css';
import Icons from 'uikit/dist/js/uikit-icons';
import Vue from 'vue';
import Host from './Host';
import {store} from './store';
import {router} from './router';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/storage';

const spinner = document.createElement('div');
spinner.setAttribute('uk-spinner', '');
spinner.style.margin = '0 0 10px 0';

const loadMessage = document.createElement('div');
loadMessage.textContent = 'ロード中です';
loadMessage.style.fontWeight = 'bold';

const div = document.createElement('div');
div.id = 'first-load';
div.style.textAlign = 'center';
div.style.position = 'absolute';
div.style.top = (document.documentElement.clientHeight / 2) + 'px';
div.appendChild(spinner);
div.appendChild(loadMessage);
document.body.appendChild(div);
div.style.left = (document.documentElement.clientWidth - div.clientWidth) / 2 + 'px';

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

async function start() {
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
		store,
	});
	document.getElementById('first-load')?.remove();
}

start();
