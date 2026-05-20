<template><ModuleStub :title="t('message.pages.audit.title')" module="audit" /></template>
<script setup lang="ts" name="kg-audit-index">
import { useI18n } from 'vue-i18n';
import ModuleStub from '/@/views/system/common/ModuleStub.vue';
const { t } = useI18n();
</script>
