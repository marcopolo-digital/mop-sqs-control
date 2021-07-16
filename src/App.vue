<template>
  <v-app>
    <v-app-bar
      app
      color="primary"
      dark
    >
      <div class="d-flex align-center">
        <v-img
          alt="Vuetify Logo"
          class="shrink mr-2"
          contain
          src="https://cdn.vuetifyjs.com/images/logos/vuetify-logo-dark.png"
          transition="scale-transition"
          width="40"
        />
        <span>Marc O'Polo SQS Control</span>
        <v-spacer></v-spacer>
        <v-btn
          elevation="2"
          @click="logout"
        >Logout</v-btn>
      </div>

    </v-app-bar>

    <v-main>
      <MessageControl
        v-if="isAuthenticatedRef"
      />
      <LoginForm
       v-else
      />

    </v-main>
  </v-app>
</template>

<script lang="ts">
import LoginForm from './components/LoginForm.vue'
import MessageControl from './components/MessageControl.vue'
import { defineComponent } from '@vue/composition-api'
import { isAuthenticatedRef } from './modules/awsConfig'

export default defineComponent({
	name: 'SQSControl',
	components: {
		LoginForm,
		MessageControl
	},
	setup() {
		function logout() {
			isAuthenticatedRef.value = false
		}

		return {
			isAuthenticatedRef,
			logout
		}
	}

})
</script>
