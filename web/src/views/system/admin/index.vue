<template><ModuleStub :title="t('message.pages.admin.title')" module="admin" /></template>
<script setup lang="ts" name="kg-admin-index">
import { useI18n } from 'vue-i18n';
import ModuleStub from '/@/views/system/common/ModuleStub.vue';
const { t } = useI18n();
</script>
