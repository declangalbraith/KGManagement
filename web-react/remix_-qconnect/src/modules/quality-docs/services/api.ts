import { QualityDoc, AuditLog } from '../types';
import { MOCK_DOCS, MOCK_AUDIT_LOGS } from '../mocks/data';

// 适配现有系统的 mock service
// 实际项目中应替换为真实的 API 请求 (e.g., axios.get('/api/quality-docs'))

export const QualityDocsService = {
  async getDocs(params?: { showArchived?: boolean; showDeleted?: boolean }): Promise<QualityDoc[]> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    let docs = [...MOCK_DOCS];
    
    if (params?.showDeleted) {
      return docs.filter(doc => doc.isDeleted);
    }
    
    if (params?.showArchived) {
      return docs.filter(doc => doc.isArchived && !doc.isDeleted);
    }
    
    return docs.filter(doc => !doc.isArchived && !doc.isDeleted);
  },

  async archiveDoc(id: string, userId: string, userName: string): Promise<QualityDoc | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = MOCK_DOCS.findIndex(d => d.id === id);
    if (index === -1) return null;
    MOCK_DOCS[index].isArchived = true;
    MOCK_DOCS[index].updateDate = new Date().toISOString();
    
    MOCK_AUDIT_LOGS.unshift({
      id: `log-${Date.now()}`,
      docId: id,
      action: 'ARCHIVE',
      operatorId: userId,
      operatorName: userName,
      timestamp: new Date().toISOString(),
      details: 'Archive Document'
    });
    return MOCK_DOCS[index];
  },

  async restoreArchivedDoc(id: string, userId: string, userName: string): Promise<QualityDoc | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = MOCK_DOCS.findIndex(d => d.id === id);
    if (index === -1) return null;
    MOCK_DOCS[index].isArchived = false;
    MOCK_DOCS[index].updateDate = new Date().toISOString();
    
    MOCK_AUDIT_LOGS.unshift({
      id: `log-${Date.now()}`,
      docId: id,
      action: 'RESTORE_ARCHIVE',
      operatorId: userId,
      operatorName: userName,
      timestamp: new Date().toISOString(),
      details: 'Restore from Archive'
    });
    return MOCK_DOCS[index];
  },

  async deleteDoc(id: string, userId: string, userName: string): Promise<QualityDoc | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = MOCK_DOCS.findIndex(d => d.id === id);
    if (index === -1) return null;
    MOCK_DOCS[index].isDeleted = true;
    MOCK_DOCS[index].updateDate = new Date().toISOString();
    
    MOCK_AUDIT_LOGS.unshift({
      id: `log-${Date.now()}`,
      docId: id,
      action: 'DELETE',
      operatorId: userId,
      operatorName: userName,
      timestamp: new Date().toISOString(),
      details: 'Move to Recycle Bin'
    });
    return MOCK_DOCS[index];
  },

  async restoreDeletedDoc(id: string, userId: string, userName: string): Promise<QualityDoc | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = MOCK_DOCS.findIndex(d => d.id === id);
    if (index === -1) return null;
    MOCK_DOCS[index].isDeleted = false;
    MOCK_DOCS[index].updateDate = new Date().toISOString();
    
    MOCK_AUDIT_LOGS.unshift({
      id: `log-${Date.now()}`,
      docId: id,
      action: 'RESTORE_DELETE',
      operatorId: userId,
      operatorName: userName,
      timestamp: new Date().toISOString(),
      details: 'Restore from Recycle Bin'
    });
    return MOCK_DOCS[index];
  },

  async getDocById(id: string): Promise<QualityDoc | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_DOCS.find(doc => doc.id === id) || null;
  },

  async createDoc(data: Partial<QualityDoc>): Promise<QualityDoc> {
    await new Promise(resolve => setTimeout(resolve, 800));
    const newDoc: QualityDoc = {
      ...data,
      id: `doc-${Date.now()}`,
      uniqueId: `QD-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
      version: 'V1.0',
      isLatest: true,
      status: 'DRAFT',
      createDate: new Date().toISOString(),
      updateDate: new Date().toISOString(),
      attachments: data.attachments || [],
    } as QualityDoc;
    MOCK_DOCS.push(newDoc);
    return newDoc;
  },

  async updateDoc(id: string, updates: Partial<QualityDoc>): Promise<QualityDoc | null> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = MOCK_DOCS.findIndex(d => d.id === id);
    if (index === -1) return null;
    const updatedDoc = { ...MOCK_DOCS[index], ...updates, updateDate: new Date().toISOString() };
    MOCK_DOCS[index] = updatedDoc;
    return updatedDoc;
  },

  async checkOutDoc(id: string, userId: string, userName: string): Promise<QualityDoc | null> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = MOCK_DOCS.findIndex(d => d.id === id);
    if (index === -1) return null;
    const doc = MOCK_DOCS[index];
    if (doc.isCheckedOut) throw new Error("Document is already checked out.");
    
    // In a real system, checking out might create a new draft Document record 
    // or just lock the current one. Here we'll just lock it with a flag and increment minor version on check-in.
    doc.isCheckedOut = true;
    doc.checkedOutBy = userName;
    doc.checkedOutAt = new Date().toISOString();
    doc.updateDate = new Date().toISOString();
    
    MOCK_AUDIT_LOGS.unshift({
      id: `log-${Date.now()}`,
      docId: id,
      action: 'CHECK_OUT',
      operatorId: userId,
      operatorName: userName,
      timestamp: new Date().toISOString(),
      details: 'Check Out Document'
    });

    return { ...doc };
  },

  async cancelCheckOutDoc(id: string, userId: string): Promise<QualityDoc | null> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = MOCK_DOCS.findIndex(d => d.id === id);
    if (index === -1) return null;
    const doc = MOCK_DOCS[index];
    if (!doc.isCheckedOut) throw new Error("Document is not checked out.");
    
    doc.isCheckedOut = false;
    doc.checkedOutBy = undefined;
    doc.checkedOutAt = undefined;
    doc.updateDate = new Date().toISOString();

    MOCK_AUDIT_LOGS.unshift({
      id: `log-${Date.now()}`,
      docId: id,
      action: 'CANCEL_CHECK_OUT',
      operatorId: userId,
      operatorName: doc.checkedOutBy || 'System',
      timestamp: new Date().toISOString(),
      details: 'Cancel Check Out'
    });

    return { ...doc };
  },

  async checkInDoc(id: string, userId: string, userName: string, newVersion?: string, comment?: string): Promise<QualityDoc | null> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = MOCK_DOCS.findIndex(d => d.id === id);
    if (index === -1) return null;
    const doc = MOCK_DOCS[index];
    if (!doc.isCheckedOut) throw new Error("Document is not checked out.");
    
    doc.isCheckedOut = false;
    doc.checkedOutBy = undefined;
    doc.checkedOutAt = undefined;
    if (newVersion) {
        doc.version = newVersion;
    }
    // Return to draft after check-in, ready to submit for approval
    doc.status = 'DRAFT'; 
    doc.updateDate = new Date().toISOString();

    MOCK_AUDIT_LOGS.unshift({
      id: `log-${Date.now()}`,
      docId: id,
      action: 'CHECK_IN',
      operatorId: userId,
      operatorName: userName,
      timestamp: new Date().toISOString(),
      details: comment || 'Check In Document'
    });

    return { ...doc };
  },

  async getAuditLogs(docId: string): Promise<AuditLog[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_AUDIT_LOGS.filter(log => log.docId === docId);
  }
};
