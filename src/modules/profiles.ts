import type { Optional, Profile, ProfileConfig } from '@/types/aws';
import { v4 as uuidv4 } from 'uuid';
import { watch, ref } from '@vue/composition-api';
import Vue from 'vue';
import { refreshQueues } from './sqsClient';

const newProfileConfig: ProfileConfig = {
	currentProfile: undefined,
	profiles: {}
};

export const globalProfileConfigRef = ref<ProfileConfig>(newProfileConfig);
const configStorageKey = 'profileConfig';

watch(globalProfileConfigRef, (profileConfig) => {
	console.log('globalProfileConfigRef changed, save it! Current Profile is now ', profileConfig.currentProfile?.name, profileConfig);
	localStorage.setItem(configStorageKey, JSON.stringify(profileConfig));
	refreshQueues();
}, {
	deep: true,
	immediate: false
});

const profileConfigRaw: string | null = localStorage.getItem(configStorageKey);
console.debug('profileConfigRaw', profileConfigRaw);
if (profileConfigRaw) {
	try {
		const parsedProfileConfig = JSON.parse(profileConfigRaw);
		globalProfileConfigRef.value = parsedProfileConfig;
		console.debug('globalProfileConfigRef.value', globalProfileConfigRef.value);
	} catch (error) {
		console.log('Cant parse profileConfigRaw');
	}
}

export function createProfile(profile: Optional<Profile, 'id'>): void {
	profile.id = uuidv4();
	profile.name ??= 'New Profile';
	Vue.set(globalProfileConfigRef.value.profiles, profile.id, profile);
	Vue.set(globalProfileConfigRef.value, 'currentProfile', profile);
}

export function removeCurrentProfile(): void {
	const currentProfile = globalProfileConfigRef.value.currentProfile;
	if (!currentProfile) return;
	Vue.delete(globalProfileConfigRef.value.profiles, currentProfile.id);
	const otherProfiles = Object.values(globalProfileConfigRef.value.profiles);
	globalProfileConfigRef.value.currentProfile = otherProfiles.length ? otherProfiles[0] : undefined;
}

export function removeProfileConfig(): void{
	console.debug('removeProfileConfig');
	globalProfileConfigRef.value = newProfileConfig;
}

