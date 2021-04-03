<template>
	<div>
		<div class="uk-form-stacked">
			<label class="uk-form-label" v-bind:for="keywordId">検索キーワード</label>
			<div class="uk-form-controls">
				<input type="text" v-bind:id="keywordId" class="uk-input uk-form-small uk-form-width-medium" v-model="condition.keyword" v-on:keypress="inputKeyword($event)">
			</div>
			<div class="uk-form-label uk-margin-top">検索タグ</div>
			<div uk-grid class="uk-grid-small uk-form-controls">
				<div>
					<select class="uk-select uk-form-small uk-form-width-small" v-model="condition.rankTag">
						<option v-for="e in allTags.rank">{{ e }}</option>
					</select>
				</div>
				<div>
					<select class="uk-select uk-form-small uk-form-width-small" v-model="condition.playTag">
						<option v-for="e in allTags.play">{{ e }}</option>
					</select>
				</div>
				<div>
					<select class="uk-select uk-form-small uk-form-width-small" v-model="condition.loginTag">
						<option v-for="e in allTags.login">{{ e }}</option>
					</select>
				</div>
				<div>
					<select class="uk-select uk-form-small uk-form-width-small" v-model="condition.silenceTag">
						<option v-for="e in allTags.silence">{{ e }}</option>
					</select>
				</div>
			</div>
		</div>
		<button type="button" class="uk-button uk-button-small uk-button-primary uk-margin-top" v-on:click="search(false)">検索</button>
	</div>
</template>
<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {v4 as uuid} from 'uuid';

const ModelProps = Vue.extend({
	model: {
		prop: 'condition',
		event: 'change',
	},
	props: {
		condition: Object,
		allTags: Object,
	}
});

@Component
export default class SearchForm extends ModelProps {
	keywordId: string = 'keyword' + new Date().toISOString() + uuid();

	search(offset: boolean): void {
		this.$emit('change', this.condition);
		this.$emit('search', offset);
	}

	inputKeyword(event: any): void {
		if (event.keyCode === 13) {
			this.search(false);
		}
	}
}
</script>
<style scoped>
</style>
