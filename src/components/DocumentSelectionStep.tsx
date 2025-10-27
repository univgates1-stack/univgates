import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileUpload } from '@/components/FileUpload';

interface Document {
  id: string;
  file_name: string;
  file_url: string;
  doc_type_id: string;
  uploaded_at: string;
  is_verified: boolean;
  document_types?: {
    name: string;
    description: string | null;
  } | null;
}

const DOCUMENTS_BUCKET = 'documents';

const getStoragePathFromPublicUrl = (fileUrl: string): string | null => {
  try {
    const parsed = new URL(fileUrl);
    const prefix = '/storage/v1/object/public/';
    const idx = parsed.pathname.indexOf(prefix);
    if (idx === -1) return null;
    const pathWithBucket = parsed.pathname.substring(idx + prefix.length);
    const [bucketName, ...pathParts] = pathWithBucket.split('/');
    if (!bucketName || pathParts.length === 0) return null;
    return decodeURIComponent(pathParts.join('/'));
  } catch (_error) {
    return null;
  }
};

interface DocumentSelectionStepProps {
  studentId: string;
  applicationId: string;
  requiredDocuments?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  onSavingChange?: (saving: boolean) => void;
  enableAutoWatermark?: boolean;
}

const DOCUMENT_DISPLAY_INFO: Record<string, { title: string; description?: string }> = {
  'Degree Certificate': {
    title: 'Degree Certificate',
    description: 'Proof of graduation from your previous institution.',
  },
  'Standardized Exams': {
    title: 'Standardized Exams',
    description: 'Add your standardized test scores (SAT, TOEFL, IELTS, etc.).',
  },
  'Academic Transcript': {
    title: 'Academic Transcript',
    description: 'Official record of your academic performance.',
  },
  'Diploma/Certificate': {
    title: 'Diploma/Certificate',
    description: 'Provide your diploma or certificate if available.',
  },
  'Nüfus Kayıt Örneği': {
    title: 'Nüfus Kayıt Örneği',
    description: 'Official population registry extract (Turkey).',
  },
  'Additional Documents': {
    title: 'Additional Documents',
    description: 'Upload any extra supporting materials.',
  },
  'Payment Receipt': {
    title: 'Payment Receipt',
    description: 'Proof of tuition payment issued by your bank.',
  },
};

const getDisplayInfoForDocument = (doc: Document) => {
  const typeName = doc.document_types?.name;

  if (typeName && DOCUMENT_DISPLAY_INFO[typeName]) {
    return {
      title: DOCUMENT_DISPLAY_INFO[typeName].title,
      description: DOCUMENT_DISPLAY_INFO[typeName].description ?? doc.document_types?.description ?? undefined,
    };
  }

  if (DOCUMENT_DISPLAY_INFO[doc.file_name]) {
    return DOCUMENT_DISPLAY_INFO[doc.file_name];
  }

  if (typeName) {
    return {
      title: typeName,
      description: doc.document_types?.description ?? undefined,
    };
  }

  return {
    title: doc.file_name,
  };
};

export function DocumentSelectionStep({
  studentId,
  applicationId,
  requiredDocuments = [],
  onSelectionChange,
  onSavingChange,
  enableAutoWatermark = true,
}: DocumentSelectionStepProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [autoSaving, setAutoSaving] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { toast } = useToast();
  const autoSaveRequestCount = useRef(0);
  const isMountedRef = useRef(true);
  const watermarkAttemptsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    fetchDocuments();
    loadExistingSelection();
  }, [studentId, applicationId]);
  useEffect(() => {
    if (!enableAutoWatermark) {
      return;
    }
    watermarkAttemptsRef.current.clear();
  }, [studentId, applicationId, enableAutoWatermark]);


  const persistSelection = async (docIds: Set<string>) => {
    const idsArray = Array.from(docIds);
    autoSaveRequestCount.current += 1;
    if (isMountedRef.current) {
      setAutoSaving(true);
    }
    setSaveError(null);
    onSavingChange?.(true);

    try {
      const { data: existingApp, error: fetchError } = await supabase
        .from('applications')
        .select('application_data')
        .eq('id', applicationId)
        .single();

      if (fetchError) throw fetchError;

      const existingData = (existingApp?.application_data as any) || {};
      const updatedData = {
        ...existingData,
        shared_document_ids: idsArray,
      };

      const { error: updateError } = await supabase
        .from('applications')
        .update({ application_data: updatedData })
        .eq('id', applicationId);

      if (updateError) throw updateError;

      if (isMountedRef.current) {
        setLastSavedAt(new Date());
      }
      onSelectionChange?.(idsArray);
    } catch (error: any) {
      console.error('Failed to save document selection:', error);
      if (isMountedRef.current) {
        setSaveError(error.message || 'Unable to save selection');
      }
      if (isMountedRef.current) {
        toast({
          title: 'Auto-save failed',
          description: 'We could not save your document selection. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      autoSaveRequestCount.current = Math.max(0, autoSaveRequestCount.current - 1);
      if (autoSaveRequestCount.current === 0) {
        if (isMountedRef.current) {
          setAutoSaving(false);
        }
        onSavingChange?.(false);
      }
    }
  };

  const loadExistingSelection = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('application_data')
        .eq('id', applicationId)
        .single();

      if (error) throw error;
      
      const appData = data?.application_data as any;
      if (appData?.shared_document_ids && Array.isArray(appData.shared_document_ids)) {
        const ids = new Set(appData.shared_document_ids);
        if (isMountedRef.current) {
          setSelectedDocs(ids);
          setLastSavedAt(new Date());
        }
        onSelectionChange?.(Array.from(ids));
      }
    } catch (error: any) {
      console.error('Failed to load existing selection:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          id,
          file_name,
          file_url,
          doc_type_id,
          uploaded_at,
          is_verified,
          document_types ( name, description )
        `)
        .eq('student_id', studentId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      if (isMountedRef.current) {
        setDocuments((data as Document[]) || []);
      }
    } catch (error: any) {
      if (isMountedRef.current) {
        toast({
          title: 'Error',
          description: 'Failed to load documents',
          variant: 'destructive',
        });
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!enableAutoWatermark) {
      return;
    }

    if (documents.length === 0 || selectedDocs.size === 0) {
      return;
    }

    const documentMap = new Map(documents.map((doc) => [doc.id, doc]));
    const pendingDocumentIds = Array.from(selectedDocs).filter((id) => {
      if (watermarkAttemptsRef.current.has(id)) {
        return false;
      }

      const document = documentMap.get(id);
      if (!document) {
        return false;
      }

      if (!document.file_url) {
        watermarkAttemptsRef.current.add(id);
        return false;
      }

      if (document.file_url.includes('?v=')) {
        watermarkAttemptsRef.current.add(id);
        return false;
      }

      const storagePath = getStoragePathFromPublicUrl(document.file_url);
      if (!storagePath) {
        console.warn('Unable to determine storage path for document', document.id);
        watermarkAttemptsRef.current.add(id);
        return false;
      }

      return true;
    });

    if (pendingDocumentIds.length === 0) {
      return;
    }

    const runWatermark = async () => {
      let shouldRefresh = false;

      for (const id of pendingDocumentIds) {
        const document = documentMap.get(id);
        if (!document) continue;

        const storagePath = getStoragePathFromPublicUrl(document.file_url);
        watermarkAttemptsRef.current.add(id);

        if (!storagePath) {
          continue;
        }

        try {
          const { error } = await supabase.functions.invoke('watermark_documents', {
            body: { bucket: DOCUMENTS_BUCKET, path: storagePath },
          });

          if (error) {
            console.error('Failed to trigger watermark for document', { id, error });
          } else {
            shouldRefresh = true;
          }
        } catch (error) {
          console.error('Failed to trigger watermark for document', { id, error });
        }
      }

      if (shouldRefresh) {
        await fetchDocuments();
      }
    };

    void runWatermark();
  }, [documents, selectedDocs, enableAutoWatermark]);

  const handleFileSelect = async (file: File | null) => {
    if (!file) return;

    setUploading(true);
    try {
      // Upload to Supabase storage
      const fileName = `${studentId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      // Get a valid document type ID (use first available type as fallback)
      const { data: docTypes } = await supabase
        .from('document_types')
        .select('id')
        .limit(1)
        .single();

      // Create document record
      const { data: newDoc, error: docError } = await supabase
        .from('documents')
        .insert({
          student_id: studentId,
          file_name: file.name,
          file_url: publicUrl,
          doc_type_id: docTypes?.id || null,
        })
        .select(`
          id,
          file_name,
          file_url,
          doc_type_id,
          uploaded_at,
          is_verified,
          document_types ( name, description )
        `)
        .single();

      if (docError) throw docError;

      toast({
        title: 'Document Uploaded',
        description: 'Your document has been uploaded successfully.',
      });

      if (newDoc && isMountedRef.current) {
        const insertedDoc = newDoc as Document;
        setDocuments((prev) => {
          const next = prev.filter((existing) => existing.id !== insertedDoc.id);
          return [insertedDoc, ...next];
        });
        const updatedSelection = new Set(selectedDocs);
        updatedSelection.add(insertedDoc.id);
        if (isMountedRef.current) {
          setSelectedDocs(updatedSelection);
        }
        await persistSelection(updatedSelection);
      } else {
        await fetchDocuments();
      }
      if (isMountedRef.current) {
        setShowUpload(false);
      }
    } catch (error: any) {
      if (isMountedRef.current) {
        toast({
          title: 'Upload Failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      if (isMountedRef.current) {
        setUploading(false);
      }
    }
  };

  const handleToggleDocument = (docId: string) => {
    const newSelected = new Set(selectedDocs);
    if (newSelected.has(docId)) {
      newSelected.delete(docId);
    } else {
      newSelected.add(docId);
    }
    setSelectedDocs(newSelected);
    void persistSelection(newSelected);
  };

  if (loading) {
    return <div className="text-center py-8">Loading documents...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Required Documents List */}
      {requiredDocuments.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg text-blue-900">Required Documents</CardTitle>
            <CardDescription className="text-blue-700">
              The university requires the following documents for this application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {requiredDocuments.map((doc, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-blue-800">
                  <FileText className="h-4 w-4" />
                  {doc}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Your Documents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Your Documents</CardTitle>
              <CardDescription>
                Select the documents you want to share with the university
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowUpload(!showUpload)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload New
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showUpload && (
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <FileUpload
                  onFileSelect={handleFileSelect}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  maxSize={10}
                  placeholder={uploading ? "Uploading..." : "Upload a document"}
                />
              </CardContent>
            </Card>
          )}

          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No documents uploaded yet</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowUpload(true)}
              >
                Upload Your First Document
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => {
                const selected = selectedDocs.has(doc.id);
                const displayInfo = getDisplayInfoForDocument(doc);

                return (
                  <label
                    key={doc.id}
                    className={`flex items-start gap-3 rounded-lg border p-4 transition-colors cursor-pointer ${
                      selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <Checkbox
                      checked={selected}
                      onCheckedChange={() => handleToggleDocument(doc.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">
                          {displayInfo.title}
                          {displayInfo.title !== doc.file_name && (
                            <span className="ml-2 text-xs text-muted-foreground">({doc.file_name})</span>
                          )}
                        </span>
                        {doc.is_verified ? (
                          <Badge variant="outline" className="text-green-700 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-700 border-orange-200">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                      {displayInfo.description && (
                        <p className="text-xs text-muted-foreground flex items-start gap-1">
                          <Info className="h-3 w-3 mt-[2px]" />
                          {displayInfo.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>
          {selectedDocs.size} document{selectedDocs.size !== 1 ? 's' : ''} selected
        </span>
        <div className="flex items-center gap-2">
          <span className={saveError ? 'text-destructive' : ''}>
            {saveError
              ? 'Auto-save failed. Please retry.'
              : autoSaving
                ? 'Saving…'
                : lastSavedAt
                  ? `Auto-saved at ${lastSavedAt.toLocaleTimeString()}`
                  : 'Selection saved'}
          </span>
          {saveError && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto px-0"
              onClick={() => void persistSelection(new Set(selectedDocs))}
            >
              Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
