import type { AwsCredentials } from '@/types/aws';
import { ref, watch } from '@vue/composition-api';

export const defaultAwsCredentials: AwsCredentials = {
	accessKeyId: '',
	secretAccessKey: '',
	sessionToken: ''
};

export const isAuthenticatedRef = ref<boolean>();
export const currentRegionRef = ref<string>();
export const awsCredentialsRef = ref<AwsCredentials>();
export const awsAccountIdRef = ref<string>();

watch(isAuthenticatedRef, (value) => {
	if (value === false) {
		awsAccountIdRef.value = '';
		awsCredentialsRef.value = defaultAwsCredentials;
	}
	localStorage.setItem('isAuthenticated', String(value));
});

watch(currentRegionRef, (value) => {
	if (value !== undefined) {
		localStorage.setItem('currentRegion', value);
	}
});

const awsCredentialsCache: string | null = localStorage.getItem('awsCredentials');
awsCredentialsRef.value = awsCredentialsCache ? JSON.parse(awsCredentialsCache) : defaultAwsCredentials;

watch(awsCredentialsRef, (value) => {
	if (awsCredentialsRef.value !== undefined) {
		localStorage.setItem('awsCredentials', JSON.stringify(value));
	}
}, {
	deep: true
});

watch(awsAccountIdRef, (value) => {
	if (value !== undefined) {
		localStorage.setItem('awsAccountId', value);
	}
});

const isAuthenticatedCache: string | null = localStorage.getItem('isAuthenticated');
isAuthenticatedRef.value = isAuthenticatedCache === 'true';

const currentRegionCache: string | null = localStorage.getItem('currentRegion');
currentRegionRef.value = currentRegionCache ?? 'eu-central-1';

const awsAccountIdCache: string | null = localStorage.getItem('awsAccountId');
awsAccountIdRef.value = awsAccountIdCache ?? '';
