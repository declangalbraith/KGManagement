<template>
	<div class="kg-qdocs-form">
		<div class="kg-qdocs-form__head">
			<el-button circle @click="router.back()"><el-icon><ArrowLeft /></el-icon></el-button>
			<h1>{{ t('message.pages.qualityDocs.create') }}</h1>
		</div>
		<el-card shadow="never">
			<el-form label-position="top">
				<el-form-item label="文档名称" required>
					<el-input v-model="form.name" />
				</el-form-item>
				<el-row :gutter="16">
					<el-col :span="12">
						<el-form-item label="文件类型" required>
							<el-select v-model="form.fileType" class="w100">
								<el-option
									v-for="opt in QUALITY_DOC_FILE_TYPES"
									:key="opt"
									:label="opt"
									:value="opt"
								/>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="文档编号" required>
							<el-input v-model="form.docNumber" />
						</el-form-item>
					</el-col>
				</el-row>
				<el-form-item label="描述">
					<el-input v-model="form.description" type="textarea" :rows="3" />
				</el-form-item>
				<el-upload drag action="#" :auto-upload="false">
					<el-icon class="el-icon--upload"><UploadFilled /></el-icon>
					<div>拖拽或点击上传附件</div>
				</el-upload>
			</el-form>
			<div class="kg-qdocs-form__actions">
				<el-button @click="saveDraft">{{ t('message.pages.qualityDocs.saveDraft') }}</el-button>
				<el-button type="primary" @click="submit">{{ t('message.pages.qualityDocs.submit') }}</el-button>
			</div>
		</el-card>
	</div>
</template>

<script setup lang="ts" name="kg-quality-docs-create">
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { ArrowLeft, UploadFilled } from '@element-plus/icons-vue';
import { QUALITY_DOC_FILE_TYPES } from '../constants';

const { t } = useI18n();
const router = useRouter();
const form = reactive({ name: '', fileType: QUALITY_DOC_FILE_TYPES[0], docNumber: '', description: '' });

function saveDraft() {
	ElMessage.success(t('message.pages.qualityDocs.saved'));
}
function submit() {
	if (!form.name) return ElMessage.warning('请填写文档名称');
	ElMessage.success(t('message.pages.qualityDocs.submitted'));
	router.push('/document-management?tab=quality');
}
</script>

<style scoped lang="scss">
.kg-qdocs-form__head {
	display: flex;
	gap: 12px;
	align-items: center;
	margin-bottom: 16px;
	h1 {
		margin: 0;
		font-size: 22px;
	}
}
.kg-qdocs-form__actions {
	margin-top: 16px;
	display: flex;
	gap: 8px;
}
.w100 {
	width: 100%;
}
</style>
