<template>
	<div>
		<ul class="uk-breadcrumb">
			<li><router-link to="/">トップ</router-link></li>
			<li v-if="routeName !== 'root'"><router-link v-bind:to="'/' + routeName">{{ title }}</router-link></li>
		</ul>
	</div>
</template>
<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';

const Props = Vue.extend({
	props: {
		routeName: String,
		title: String,
	}
});

@Component
export default class Breadcrumb extends Props {
}
</script>
<style scoped>
ul {
	margin: 0;
}
</style>
