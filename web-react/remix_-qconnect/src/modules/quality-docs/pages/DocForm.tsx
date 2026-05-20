import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FILE_TYPES, FileType, FILE_TYPE_CONFIGS, FIELD_POOL } from '../config/fileTypes';
import { QualityDocsService } from '../services/api';

export function DocForm() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<FileType | ''>('');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  const config = selectedType ? FILE_TYPE_CONFIGS[selectedType] : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;
    
    setSubmitting(true);
    try {
      const newDoc = await QualityDocsService.createDoc({
        ...formData,
        fileType: selectedType,
      });
      navigate(`/quality-docs/${newDoc.id}`);
    } catch (error) {
      console.error('Failed to create doc', error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (fieldName: string, isRequired: boolean) => {
    const fieldConfig = FIELD_POOL[fieldName as keyof typeof FIELD_POOL];
    if (!fieldConfig) return null;

    return (
      <div key={fieldName} className="space-y-2">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {fieldConfig.label} {isRequired && <span className="text-red-500">*</span>}
        </label>
        {fieldConfig.type === 'textarea' ? (
          <textarea 
            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            onChange={e => setFormData({...formData, [fieldName]: e.target.value})}
            required={isRequired}
          />
        ) : fieldConfig.type === 'select' ? (
          <select 
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            onChange={e => setFormData({...formData, [fieldName]: e.target.value})}
            required={isRequired}
          >
            <option value="">请选择</option>
            {('options' in fieldConfig ? fieldConfig.options as string[] : []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        ) : (
          <input 
            type="text"
            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            onChange={e => setFormData({...formData, [fieldName]: e.target.value})}
            required={isRequired}
          />
        )}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">新建质量文档</h1>
        <p className="text-muted-foreground">选择文件类型并填写相关信息</p>
      </div>

      <div className="bg-card border rounded-lg p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">文件类型 <span className="text-red-500">*</span></label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={selectedType}
              onChange={e => setSelectedType(e.target.value as FileType)}
              required
            >
              <option value="">请选择文件类型</option>
              {FILE_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {config && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-2 gap-4">
                {config.requiredFields.map(field => renderField(field, true))}
                {config.optionalFields.map(field => renderField(field, false))}
              </div>
              
              <div className="pt-4 border-t flex justify-end gap-2">
                <button 
                  type="button"
                  onClick={() => navigate('/quality-docs')}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-transparent hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 disabled:opacity-50"
                >
                  {submitting ? '保存中...' : '保存草稿'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
