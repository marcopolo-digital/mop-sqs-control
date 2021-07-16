import './initCompositionApi'
import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import 'vue-json-pretty/lib/styles.css'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import VueJsonPretty from 'vue-json-pretty'

Vue.component('vue-json-pretty', VueJsonPretty)
Vue.config.productionTip = false
Vue.config.devtools = true

new Vue({
	vuetify,
	render: (h) => h(App)
}).$mount('#app')
