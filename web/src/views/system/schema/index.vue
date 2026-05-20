<template><ModuleStub :title="t('message.pages.schema.title')" module="schema" /></template>
<script setup lang="ts" name="kg-schema-index">
import { useI18n } from 'vue-i18n';
import ModuleStub from '/@/views/system/common/ModuleStub.vue';
const { t } = useI18n();
</script>
