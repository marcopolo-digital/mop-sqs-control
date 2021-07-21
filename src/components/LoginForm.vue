<template>
<v-layout justify-center>
  <v-card
    elevation="4"
    class="loginCard"
  >
    <v-form>
      <v-combobox
        :items="Object.keys(awsRegions)"
        v-model="currentRegionRef"
        label="defaultRegion"
        required
        clearable
      ></v-combobox>

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
        @click="checkCredentials"
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

import { defineComponent, ref } from '@vue/composition-api'
import awsRegions from '../modules/awsRegions'
import { currentRegionRef, defaultAwsCredentials, awsAccountIdRef, isAuthenticatedRef, awsCredentialsRef } from '../modules/awsConfig'
import { GetAccessKeyInfoCommand, STSClient } from '@aws-sdk/client-sts'
import { AwsCredentials } from '../types/aws'

export default defineComponent({
	setup() {
		const showError = ref(false)
		const credentialsRef = ref<AwsCredentials>(Object.assign({}, defaultAwsCredentials))
		const isLoadingLoginButton = ref<boolean>(false)

		async function checkCredentials() {
			isLoadingLoginButton.value = true
			const stsClient = new STSClient({
				region: currentRegionRef.value,
				credentials: credentialsRef.value
			})
			const stsCommand = new GetAccessKeyInfoCommand({
				AccessKeyId: credentialsRef.value.accessKeyId
			})
			try {
				const stsResult = await stsClient.send(stsCommand)
				awsCredentialsRef.value = credentialsRef.value
				awsAccountIdRef.value = stsResult.Account
				credentialsRef.value = defaultAwsCredentials
				isAuthenticatedRef.value = true
			} catch (error) {
				console.log(error)
				showError.value = true
			}
			isLoadingLoginButton.value = false
		}

		return {
			checkCredentials,
			awsRegions,
			currentRegionRef,
			showError,
			credentialsRef,
			isLoadingLoginButton
		}
	}
})

</script>

<style scoped>
.loginCard {
  padding: 50px;
  margin: 50px;
  min-width: 500px;
}
</style>
