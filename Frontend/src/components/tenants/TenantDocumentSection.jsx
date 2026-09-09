import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Eye,
  Trash2,
  Plus,
  Loader2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Mail,
  Send,
  Info,
} from 'lucide-react';
import { STANDARD_DOCUMENTS, calculateDocumentStatus } from '../../data/tenantDocumentsConfig';
import {
  fetchTenantDocumentsAPI,
  uploadTenantDocumentAPI,
  updateTenantDocumentAPI,
  deleteTenantDocumentAPI,
  triggerTestDocumentExpiryEmailAPI,
} from '../../services/apiData';

export function TenantDocumentSection({ tenantId, onDocumentsChange, onPendingDocumentsChange }) {
  const [documents, setDocuments] = useState([]);
  const [pendingDocuments, setPendingDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploadingState, setUploadingState] = useState({}); // { [docKey]: boolean }
  const [sendingEmailState, setSendingEmailState] = useState({}); // { [docKey]: boolean }

  const handleSendTestEmail = async (recipientEmail, docName) => {
    const targetEmail = recipientEmail || 'rizwangul2426@gmail.com';
    setSendingEmailState((prev) => ({ ...prev, [docName]: true }));
    try {
      const res = await triggerTestDocumentExpiryEmailAPI(targetEmail, true);
      window.dispatchEvent(new Event('pixx_notification_updated'));
      alert(`✉️ Document expiry notification email sent successfully to ${targetEmail}!`);
    } catch (err) {
      alert(`❌ Failed to send email: ${err.message}`);
    } finally {
      setSendingEmailState((prev) => ({ ...prev, [docName]: false }));
    }
  };

  // Custom document creation form inputs
  const [newCustomDocName, setNewCustomDocName] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  // Notify parent component of pending documents whenever they change in creation mode
  useEffect(() => {
    if (!tenantId && onPendingDocumentsChange) {
      onPendingDocumentsChange(pendingDocuments);
    }
  }, [pendingDocuments, tenantId, onPendingDocumentsChange]);

  // Load existing uploaded documents if tenantId is available
  useEffect(() => {
    if (tenantId) {
      loadDocuments();
    }
  }, [tenantId]);

  const loadDocuments = async () => {
    if (!tenantId) return;
    setLoadingDocs(true);
    try {
      const docs = await fetchTenantDocumentsAPI(tenantId);
      setDocuments(docs || []);
      if (onDocumentsChange) onDocumentsChange(docs || []);
    } catch (e) {
      console.warn('[Document Load Error]', e.message);
    }
    setLoadingDocs(false);
  };

  // Find uploaded doc for a standard document name (either from backend or pending selection)
  const getUploadedStandardDoc = (name) => {
    if (tenantId) {
      return documents.find((d) => d.documentName === name && d.documentType === 'standard');
    }
    return pendingDocuments.find((d) => d.documentName === name && d.documentType === 'standard');
  };

  // Custom documents list
  const customDocuments = tenantId
    ? documents.filter((d) => d.documentType === 'custom')
    : pendingDocuments.filter((d) => d.documentType === 'custom');

  const uploadedStandardCount = STANDARD_DOCUMENTS.filter((docItem) => {
    const docName = typeof docItem === 'string' ? docItem : docItem.name;
    return Boolean(getUploadedStandardDoc(docName));
  }).length;

  // Handle Uploading / Selecting a Standard Document File
  const handleFileUpload = async (e, documentName, documentType = 'standard') => {
    const file = e.target.files[0];
    if (!file) return;

    if (!tenantId) {
      // Local pending document selection mode for NEW tenant creation
      const newPending = {
        id: `pending-${documentType}-${documentName}`,
        documentName,
        documentType,
        file,
        originalFileName: file.name,
        fileSize: file.size,
        expiryDate: '',
        isPending: true,
      };

      setPendingDocuments((prev) => {
        const filtered = prev.filter(
          (d) => !(d.documentName === documentName && d.documentType === documentType)
        );
        return [...filtered, newPending];
      });
      e.target.value = '';
      return;
    }

    // Direct Cloudinary upload for existing tenant
    const docKey = `${documentType}-${documentName}`;
    setUploadingState((prev) => ({ ...prev, [docKey]: true }));

    try {
      const existingDoc = getUploadedStandardDoc(documentName);
      const existingExpiry = existingDoc?.expiryDate
        ? new Date(existingDoc.expiryDate).toISOString().split('T')[0]
        : '';

      await uploadTenantDocumentAPI(
        tenantId,
        file,
        documentName,
        documentType,
        existingExpiry
      );

      await loadDocuments();
    } catch (err) {
      alert(err.message || 'File upload failed');
    } finally {
      setUploadingState((prev) => ({ ...prev, [docKey]: false }));
      e.target.value = '';
    }
  };

  // Handle Updating Expiry Date
  const handleExpiryChange = async (docId, newExpiryDate, docName, docType = 'standard') => {
    if (!tenantId) {
      setPendingDocuments((prev) =>
        prev.map((d) => {
          if (d.id === docId || (d.documentName === docName && d.documentType === docType)) {
            return { ...d, expiryDate: newExpiryDate };
          }
          return d;
        })
      );
      return;
    }

    if (!docId) return;
    try {
      await updateTenantDocumentAPI(docId, { expiryDate: newExpiryDate });
      await loadDocuments();
    } catch (err) {
      console.warn('[Update Expiry Error]', err.message);
    }
  };

  // Handle Deleting / Removing Document
  const handleDeleteDocument = async (docId, docName, docType = 'standard') => {
    if (!tenantId) {
      setPendingDocuments((prev) =>
        prev.filter((d) => !(d.id === docId || (d.documentName === docName && d.documentType === docType)))
      );
      return;
    }

    if (!docId) return;
    if (!window.confirm(`Are you sure you want to delete document "${docName}"?`)) return;

    try {
      await deleteTenantDocumentAPI(docId);
      await loadDocuments();
    } catch (err) {
      alert(err.message || 'Failed to delete document');
    }
  };

  // Handle Adding a Custom Document
  const handleAddCustomDocument = async (e) => {
    e.preventDefault();
    if (!newCustomDocName.trim()) {
      alert('Please enter a custom document name');
      return;
    }
    const fileInput = document.getElementById('custom-doc-file-input');
    const file = fileInput?.files[0];
    if (!file) {
      alert('Please select a file for the custom document');
      return;
    }

    const expiryInput = document.getElementById('custom-doc-expiry-input');
    const expiryDate = expiryInput?.value || '';

    if (!tenantId) {
      const newCustomPending = {
        id: `pending-custom-${Date.now()}`,
        documentName: newCustomDocName.trim(),
        documentType: 'custom',
        file,
        originalFileName: file.name,
        fileSize: file.size,
        expiryDate,
        isPending: true,
      };

      setPendingDocuments((prev) => [...prev, newCustomPending]);
      setNewCustomDocName('');
      if (fileInput) fileInput.value = '';
      if (expiryInput) expiryInput.value = '';
      setIsAddingCustom(false);
      return;
    }

    setUploadingState((prev) => ({ ...prev, custom: true }));
    try {
      await uploadTenantDocumentAPI(
        tenantId,
        file,
        newCustomDocName.trim(),
        'custom',
        expiryDate
      );

      setNewCustomDocName('');
      if (fileInput) fileInput.value = '';
      if (expiryInput) expiryInput.value = '';
      setIsAddingCustom(false);

      await loadDocuments();
    } catch (err) {
      alert(err.message || 'Failed to add custom document');
    } finally {
      setUploadingState((prev) => ({ ...prev, custom: false }));
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6 text-left">
      {/* SECTION HEADER & SUMMARY BADGE */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#04A26F]" />
            <span>Tenant Documents</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            All tenant documents are optional. Documents tagged with <span className="font-bold text-amber-700">Expiry Date (ED)</span> support expiration tracking and alert notifications.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-xs font-black text-[#04A26F]">
            <span>Documents: </span>
            <span className="text-emerald-800">{uploadedStandardCount}/{STANDARD_DOCUMENTS.length}</span>
            {customDocuments.length > 0 && (
              <span className="text-emerald-700 font-bold ml-1">+ {customDocuments.length} custom</span>
            )}
          </div>

          {tenantId && (
            <button
              type="button"
              onClick={loadDocuments}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              title="Refresh documents"
            >
              <RefreshCw className={`w-4 h-4 ${loadingDocs ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* EXPIRING & EXPIRED DOCUMENTS SUMMARY ALERT BANNER */}
      {tenantId && documents.some((d) => d.expiryDate && calculateDocumentStatus(d.expiryDate)?.status !== 'Valid') && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>Tenant Document Expiry & Automatic Email Status</span>
            </div>
          </div>
          <div className="space-y-2 pt-1">
            {documents
              .filter((d) => d.expiryDate && calculateDocumentStatus(d.expiryDate)?.status !== 'Valid')
              .map((d) => {
                const statusObj = calculateDocumentStatus(d.expiryDate);
                const isFallback = d.isFallbackRecipient;
                const recipient = d.recipientEmail || d.agentEmail || 'rizwangul2426@gmail.com';

                return (
                  <div
                    key={d._id || d.documentName}
                    className="bg-white p-3 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-900">{d.documentName}</span>
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${statusObj?.badgeClass}`}>
                          {statusObj?.status} ({statusObj?.daysRemaining !== null ? `${statusObj?.daysRemaining} days left` : ''})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium mt-1 flex items-center gap-1.5 flex-wrap">
                        <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>
                          {isFallback
                            ? `Automated reminder sent to Fallback Email: `
                            : `Automated reminder sent to Assigned Agent (${d.agentName || 'Agent'}): `}
                          <strong className="text-slate-800">{recipient}</strong>
                        </span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSendTestEmail(recipient, d.documentName)}
                      disabled={sendingEmailState[d.documentName]}
                      className="px-3 py-1.5 bg-[#04A26F] hover:bg-[#03885c] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs disabled:opacity-50"
                    >
                      {sendingEmailState[d.documentName] ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>Send Email Now</span>
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* 1. STANDARD DOCUMENTS LIST */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
          Standard Documents ({STANDARD_DOCUMENTS.length} Document Types)
        </h3>

        <div className="grid grid-cols-1 gap-3">
          {STANDARD_DOCUMENTS.map((docItem, idx) => {
            const docName = typeof docItem === 'string' ? docItem : docItem.name;
            const hasExpiryDate = typeof docItem === 'object' ? docItem.hasExpiryDate : true;

            const uploaded = getUploadedStandardDoc(docName);
            const docKey = `standard-${docName}`;
            const isUploading = uploadingState[docKey];
            const statusInfo = uploaded && uploaded.expiryDate ? calculateDocumentStatus(uploaded.expiryDate) : null;
            const inputId = `file-input-${idx}`;

            return (
              <div
                key={docName}
                className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  uploaded
                    ? 'bg-slate-50/70 border-slate-200'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Left: Document Name & Badges */}
                <div className="space-y-1 max-w-sm">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-extrabold text-slate-900">{docName}</span>
                    {hasExpiryDate && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        Expiry Date (ED)
                      </span>
                    )}
                    {uploaded ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-[#04A26F]" />
                        <span>{uploaded.isPending ? 'Selected' : 'Uploaded'}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                        Not Uploaded
                      </span>
                    )}
                  </div>

                  {uploaded && (
                    <div className="space-y-1">
                      <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2 flex-wrap">
                        <span className="truncate text-slate-700 font-bold">
                          {uploaded.originalFileName || 'File Selected'}
                        </span>
                        {statusInfo && (
                          <span className={`px-2 py-0.5 rounded-md text-[10px] border ${statusInfo.badgeClass}`}>
                            {statusInfo.status}
                            {statusInfo.daysRemaining !== null && statusInfo.daysRemaining >= 0 && (
                              <span className="ml-1 text-[9px] font-normal">({statusInfo.daysRemaining} days left)</span>
                            )}
                          </span>
                        )}
                      </div>
                      {uploaded.expiryDate && (
                        <div className="text-[11px] text-slate-600 font-medium flex items-center gap-1 flex-wrap">
                          <Mail className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>
                            Auto Email Target: <strong className="text-slate-800">{uploaded.recipientEmail || uploaded.agentEmail || 'rizwangul2426@gmail.com'}</strong>
                            {uploaded.isFallbackRecipient ? ' (Fallback Email)' : ` (Agent: ${uploaded.agentName || 'Assigned'})`}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Expiry Date & Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Expiry Date Input (if ED required) */}
                  {hasExpiryDate ? (
                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      <input
                        type="date"
                        title="Expiry Date (ED)"
                        value={uploaded?.expiryDate ? new Date(uploaded.expiryDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => handleExpiryChange(uploaded?._id || uploaded?.id, e.target.value, docName, 'standard')}
                        disabled={!uploaded}
                        className="text-xs font-semibold text-slate-800 bg-transparent outline-none disabled:opacity-50 cursor-pointer"
                      />
                    </div>
                  ) : (
                    <div className="text-[11px] font-medium text-slate-400 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100 italic">
                      No Expiry Date Required
                    </div>
                  )}

                  {/* Upload / Replace Hidden File Input */}
                  <input
                    id={inputId}
                    type="file"
                    className="hidden"
                    disabled={isUploading}
                    onChange={(e) => handleFileUpload(e, docName, 'standard')}
                  />

                  {/* Action Buttons */}
                  {uploaded ? (
                    <>
                      {uploaded.fileUrl && (
                        <a
                          href={uploaded.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:text-[#04A26F] hover:border-emerald-200 transition-colors shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </a>
                      )}

                      <label
                        htmlFor={inputId}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                      >
                        {isUploading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#04A26F]" />
                        ) : (
                          <Upload className="w-3.5 h-3.5 text-blue-600" />
                        )}
                        <span>Replace</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => handleDeleteDocument(uploaded._id || uploaded.id, docName, 'standard')}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <label
                      htmlFor={inputId}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#04A26F] hover:bg-[#038b5e] rounded-lg transition-colors cursor-pointer shadow-2xs"
                    >
                      {isUploading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
                      )}
                      <span>Upload Document</span>
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. CUSTOM DOCUMENTS LIST */}
      {customDocuments.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Custom Documents ({customDocuments.length})
          </h3>

          <div className="grid grid-cols-1 gap-3">
            {customDocuments.map((doc) => {
              const statusInfo = doc.expiryDate ? calculateDocumentStatus(doc.expiryDate) : null;
              const docId = doc._id || doc.id;

              return (
                <div
                  key={docId}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-900">{doc.documentName}</span>
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                        {doc.isPending ? 'Selected Custom' : 'Custom Document'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium truncate flex items-center gap-2">
                      <span className="truncate text-slate-700 font-bold">{doc.originalFileName || 'View Document'}</span>
                      {statusInfo && (
                        <span className={`px-2 py-0.5 rounded-md text-[10px] border ${statusInfo.badgeClass}`}>
                          {statusInfo.status}
                          {statusInfo.daysRemaining !== null && statusInfo.daysRemaining >= 0 && (
                            <span className="ml-1 text-[9px] font-normal">({statusInfo.daysRemaining} days left)</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="date"
                        title="Expiry Date"
                        value={doc.expiryDate ? new Date(doc.expiryDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => handleExpiryChange(docId, e.target.value, doc.documentName, 'custom')}
                        className="text-xs font-semibold text-slate-800 bg-transparent outline-none cursor-pointer"
                      />
                    </div>

                    {doc.fileUrl && (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:text-[#04A26F] transition-colors shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteDocument(docId, doc.documentName, 'custom')}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove Document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. ADD ANOTHER (CUSTOM) DOCUMENT FORM GENERATOR */}
      <div className="pt-4 border-t border-slate-100">
        {!isAddingCustom ? (
          <button
            type="button"
            onClick={() => setIsAddingCustom(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-extrabold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer border border-slate-200/80"
          >
            <Plus className="w-4 h-4 text-[#04A26F] stroke-[3]" />
            <span>+ Add Another Document</span>
          </button>
        ) : (
          <form onSubmit={handleAddCustomDocument} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Add Custom Document
              </h4>
              <button
                type="button"
                onClick={() => setIsAddingCustom(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">
                  Document Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Reference Letter, Guarantor ID"
                  value={newCustomDocName}
                  onChange={(e) => setNewCustomDocName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04A26F]/20 font-semibold bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">
                  File Upload *
                </label>
                <input
                  id="custom-doc-file-input"
                  type="file"
                  required
                  className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">
                  Expiry Date (Optional)
                </label>
                <input
                  id="custom-doc-expiry-input"
                  type="date"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold bg-white cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingCustom(false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploadingState.custom}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-extrabold text-white bg-[#04A26F] hover:bg-[#038b5e] rounded-lg transition-all shadow-2xs"
              >
                {uploadingState.custom && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Document</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
