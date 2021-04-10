import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export const store = new Vuex.Store({
	state: {
		authentication: 'logout',
		searchResult: null,
		bookmarkResult: null,
	},
	mutations: {
		login(state) {
			state.authentication = 'login';
		},
		logout(state) {
			state.authentication = 'logout';
		},
		setSearchResult(state, value) {
			state.searchResult = value;
		},
		setBookmarkResult(state, value) {
			state.bookmarkResult = value;
		},
	}
});
