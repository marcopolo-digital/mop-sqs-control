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
        <v-chip
          class="ma-2 ml-5"
          color="orange"
        >
          {{ `AccountId: ${awsAccountIdRef}` }}
        </v-chip>
      </div>
      <span>
        <v-combobox
          :items="Object.keys(awsRegions)"
          v-model="currentRegionRef"
          label="Region"
          outlined
          dense
          class="mt-6 ml-5"
          color="teal"
        ></v-combobox>
      </span>
      <v-spacer></v-spacer>
      <v-btn
        elevation="2"
        @click="logout"
        outlined
      >Logout</v-btn>
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
import { isAuthenticatedRef, awsAccountIdRef, currentRegionRef, awsCredentialsRef, defaultAwsCredentials } from './modules/awsConfig'
import awsRegions from './modules/awsRegions'

export default defineComponent({
	name: 'SQSControl',
	components: {
		LoginForm,
		MessageControl
	},
	setup() {
		function logout() {
			localStorage.removeItem('awsCredentials')
			awsCredentialsRef.value = defaultAwsCredentials
			isAuthenticatedRef.value = false
		}

		return {
			isAuthenticatedRef,
			awsRegions,
			awsAccountIdRef,
			currentRegionRef,
			logout
		}
	}

})
</script>
