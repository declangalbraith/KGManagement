<template><ModuleStub :title="t('message.pages.notifications.title')" module="notifications" /></template>
<script setup lang="ts" name="kg-notifications-index">
import { useI18n } from 'vue-i18n';
import ModuleStub from '/@/views/system/common/ModuleStub.vue';
const { t } = useI18n();
</script>
