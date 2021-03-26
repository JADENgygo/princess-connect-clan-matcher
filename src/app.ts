import UIkit from 'uikit';
import './uikit.min.css';
import './style.css';
import Vue from 'vue';
import VueRouter from 'vue-router';
import Host from './Host';

Vue.config.productionTip = false;

/*
const router: VueRouter = new VueRouter({
	routes: [
		{path: '/', component: TopPage},
		{path: '/sticker/guild-house', component: GuildHouse},
		{path: '/sticker/:subject', component: OtherSticker, props: true},
	]
});

Vue.use(VueRouter);
*/

new Vue({
	el: '#app',
	components: {
		Host
	},
	template: '<Host/>'
});
