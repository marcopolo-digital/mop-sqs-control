<template>
<v-layout justify-center>
  <v-card
    elevation="4"
    class="loginCard"
  >
    <div class="text-h4">Create new Profile</div>
    <v-form>
      <v-text-field
        v-model="profileNameRef"
        label="Profile name"
        required
        clearable
      ></v-text-field>
      <v-combobox
        :items="Object.keys(awsRegions)"
        v-model="currentRegionRef"
        label="defaultRegion"
        required
        clearable
      ></v-combobox>
      <div class="text-h5">Manual Credentials Input</div>

      <v-text-field
        v-model="credentialsRef.accessKeyId"
        label="accessKeyId"
        required
        clearable
      ></v-text-field>

      <v-text-field
        v-model="credentialsRef.secretAccessKey"
        label="secretAccessKey"
        required
        clearable
      ></v-text-field>

      <v-text-field
        v-model="credentialsRef.sessionToken"
        label="sessionToken"
        clearable
      ></v-text-field>

      <v-btn
        color="success"
        class="mr-4"
        @click="checkCredentials('FIELDS')"
        :loading="isLoadingLoginButton"
      >
        Validate & Save
      </v-btn>

      <div class="text-h5 mt-10">Or Copy AWS SSO Credentials</div>
      <v-textarea
        class="textareaCredentials"
        v-model="textareaCredentialsRef"
        :placeholder="textareaCredentialsPlaceholder"
        clearable
        filled
        persistent-placeholder
        rows="4"
      ></v-textarea>

      <v-btn
        color="success"
        class="mr-4"
        @click="checkCredentials('TEXTAREA')"
        :loading="isLoadingLoginButton"
      >
        Validate & Save
      </v-btn>
    </v-form>
  </v-card>
      <v-snackbar
      :timeout="3000"
      v-model="showError"
      color="red"
      top
    >
      Invalid Credentials!
    </v-snackbar>
  </v-layout>
</template>

<script lang="ts">
/* eslint-disable max-statements-per-line */
import { defineComponent, ref } from '@vue/composition-api';
import awsRegions from '../modules/awsRegions';
import { currentRegionRef, defaultAwsCredentials } from '../modules/awsConfig';
import { GetAccessKeyInfoCommand, STSClient } from '@aws-sdk/client-sts';
import type { AwsCredentials, CredentaialsInputType } from '../types/aws';
import { createProfile } from '../modules/profiles';

export default defineComponent({
	setup() {
		const showError = ref(false);
		const credentialsRef = ref<AwsCredentials>(Object.assign({}, defaultAwsCredentials));
		const isLoadingLoginButton = ref<boolean>(false);
		const textareaCredentialsRef = ref<string>('');
		const profileNameRef = ref<string>('');
		const textareaCredentialsPlaceholder = 'export AWS_ACCESS_KEY_ID="ASIAVQMBL2T64R2UL3SD" \n' +
    'export AWS_SECRET_ACCESS_KEY="UywKsS+CZU+buFPfA5Qg+FYsSLW5JG5" \n' +
    'export AWS_SESSION_TOKEN="IQoJ8J4562luXdJH/////wE2GV15NnR3YWw"';

		function parseTextarea(): void {
			const content = textareaCredentialsRef.value;
			const rows = content.split('\n');
			rows.forEach((row) => {
				const rowParts = row.split(' ')[1].split('=');
				const key = rowParts[0];
				const value = rowParts[1].replaceAll('"', '');
				switch (key) {
					case 'AWS_ACCESS_KEY_ID': credentialsRef.value.accessKeyId = value; break;
					case 'AWS_SECRET_ACCESS_KEY': credentialsRef.value.secretAccessKey = value; break;
					case 'AWS_SESSION_TOKEN': credentialsRef.value.sessionToken = value; break;
				}
			});
		}

		async function checkCredentials(inputType: CredentaialsInputType): Promise<void> {
			if (inputType === 'TEXTAREA') {
				parseTextarea();
			}
			isLoadingLoginButton.value = true;
			const stsClient = new STSClient({
				region: currentRegionRef.value,
				credentials: credentialsRef.value
			});
			const stsCommand = new GetAccessKeyInfoCommand({
				AccessKeyId: credentialsRef.value.accessKeyId
			});
			try {
				const stsResult = await stsClient.send(stsCommand);
				createProfile({
					name: profileNameRef.value ?? 'New Profile',
					credentials: credentialsRef.value,
					awsAccountId: stsResult.Account as string
				});

				credentialsRef.value = Object.assign({}, defaultAwsCredentials);
				textareaCredentialsRef.value = '';
				profileNameRef.value = '';
			} catch (error) {
				console.log(error);
				showError.value = true;
			}
			isLoadingLoginButton.value = false;
		}

		return {
			checkCredentials,
			awsRegions,
			currentRegionRef,
			showError,
			credentialsRef,
			isLoadingLoginButton,
			textareaCredentialsRef,
			textareaCredentialsPlaceholder,
			profileNameRef
		};
	}
});

</script>

<style scoped>
.loginCard {
  padding: 50px;
  margin: 50px;
  min-width: 800px;
}
.textareaCredentials{
  font-size: 14px;
}
</style>
