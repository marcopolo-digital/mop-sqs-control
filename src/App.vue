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
          {{ `AccountId: ${ accountId }` }}
        </v-chip>
      </div>
      <span>
        <v-combobox
          :items="Object.values(globalProfileConfigRef.profiles)"
          v-model="globalProfileConfigRef.currentProfile"
          label="Profile"
          item-text="name"
          item-value="id"
          outlined
          dense
          class="mt-6 ml-5"
          color="teal"
        ></v-combobox>
      </span>
      <v-btn
        elevation="2"
        @click="removeCurrentProfile"
        outlined
        class="ml-3"
      >Remove Profile</v-btn>
      <v-btn
        elevation="2"
        @click="globalProfileConfigRef.currentProfile = undefined"
        outlined
        class="ml-3"
      >Add Profile</v-btn>
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
        @click="removeProfileConfig"
        outlined
      >Logout</v-btn>
    </v-app-bar>
    <v-main>
      <MessageControl
        v-if="globalProfileConfigRef.currentProfile"
      />
      <LoginForm
       v-else
      />

    </v-main>
  </v-app>
</template>

<script lang="ts">
import LoginForm from './components/LoginForm.vue';
import MessageControl from './components/MessageControl.vue';
import { computed, defineComponent } from '@vue/composition-api';
import { currentRegionRef } from './modules/awsConfig';
import awsRegions from './modules/awsRegions';
import { removeCurrentProfile, removeProfileConfig, globalProfileConfigRef } from './modules/profiles';

export default defineComponent({
	name: 'SQSControl',
	components: {
		LoginForm,
		MessageControl
	},
	setup() {
		const accountId = computed(() => {
			console.debug('computed accountId triggered', globalProfileConfigRef.value.currentProfile?.awsAccountId);
			return globalProfileConfigRef.value.currentProfile?.awsAccountId ?? 'None';
		});

		return {
			awsRegions,
			currentRegionRef,
			removeProfileConfig,
			globalProfileConfigRef,
			accountId,
			removeCurrentProfile
		};
	}

});
</script>
