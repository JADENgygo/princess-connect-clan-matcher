<template>
	<div>
		<div class="uk-form-stacked">
			<label class="uk-form-label" v-bind:for="keywordId">検索キーワード</label>
			<div class="uk-form-controls">
				<input type="text" v-bind:id="keywordId" class="uk-input uk-form-small uk-form-width-medium" v-bind:value="condition.keyword" v-on:input="updateKeyword($event.target.value)"
					v-on:keypress="inputKeyword($event)">
			</div>
			<ul uk-accordion v-bind:id="accordionId">
				<li>
					<a class="uk-accordion-title uk-text-small" v-on:click="addClickCount()">検索タグ</a>
					<div class="uk-accordion-content">
						<div v-bind:uk-grid="grid" v-bind:class="{'uk-grid-small': grid}" class="uk-form-controls">
							<div v-for="(e, i) of allTags" v-bind:key="e.name">
								<div v-bind:class="{'uk-margin-small-top': !grid && i !== 0}" class="uk-form-label uk-text-center">{{ e.name }}</div>
								<select class="uk-select uk-form-small uk-form-width-small" v-bind:value="condition.tag[e.label].value" v-on:change="updateTag($event.target.value, e.label)">
									<option v-for="tag of e.values">{{ tag }}</option>
								</select>
							</div>
						</div>
					</div>
				</li>
			</ul>
		</div>
		<button type="button" class="uk-button uk-button-small uk-button-primary" v-on:click="search(false)">検索</button>
	</div>
</template>
<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import UIkit from 'uikit';
import {v4 as uuid} from 'uuid';

const ModelProps = Vue.extend({
	model: {
		prop: 'condition',
		event: 'change',
	},
	props: {
		condition: Object,
		allTags: Array,
		grid: Boolean,
	}
});

@Component
export default class SearchForm extends ModelProps {
	keywordId: string = 'keyword' + new Date().toISOString() + uuid();
	accordionId: string = 'accordion' + new Date().toISOString() + uuid();
	clickCount: number = 0;

	updateKeyword(value: string): void {
		const condition = JSON.parse(JSON.stringify(this.condition));
		condition.keyword = value;
		this.$emit('change', condition);
	}

	updateTag(value: string, label: string): void {
		const condition = JSON.parse(JSON.stringify(this.condition));
		condition.tag[label].value = value;
		this.$emit('change', condition);
	}
	
	search(offset: boolean): void {
		if (this.clickCount % 2 === 1) {
			const accordion = document.getElementById(this.accordionId) as HTMLElement;
			UIkit.accordion(accordion).toggle(0, true);
		}
		this.clickCount = 0;
		this.$emit('search', offset);
	}

	inputKeyword(event: any): void {
		if (event.keyCode === 13) {
			this.search(false);
		}
	}

	addClickCount(): void {
		this.clickCount++;
	}
}
</script>
<style scoped>
</style>
