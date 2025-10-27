// Document validation utilities for consistent file handling across the application

import { supabase } from '@/integrations/supabase/client';

export interface DocumentType {
  id: string;
  name: string;
  description?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateFile = (file: File, options?: {
  maxSizeMB?: number;
  allowedTypes?: string[];
}): ValidationResult => {
  const errors: string[] = [];
  const maxSize = (options?.maxSizeMB || 10) * 1024 * 1024; // Default 10MB
  
  const defaultAllowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  const allowedTypes = options?.allowedTypes || defaultAllowedTypes;
  
  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size must be less than ${options?.maxSizeMB || 10}MB`);
  }
  
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not supported`);
  }
  
  // Check file name
  if (file.name.length > 255) {
    errors.push('File name is too long (max 255 characters)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const getDocumentTypes = async (): Promise<DocumentType[]> => {
  const { data, error } = await supabase
    .from('document_types')
    .select('id, name, description')
    .order('name');
    
  if (error) {
    console.error('Error fetching document types:', error);
    return [];
  }
  
  return data || [];
};

export const getDocumentTypeByName = async (name: string): Promise<DocumentType | null> => {
  const { data, error } = await supabase
    .from('document_types')
    .select('id, name, description')
    .eq('name', name)
    .maybeSingle();
    
  if (error) {
    console.error('Error fetching document type:', error);
    return null;
  }
  
  return data;
};

// Sanitize filename to remove special characters
const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^\w\s.-]/g, '') // Remove special chars except word chars, spaces, dots, hyphens
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .toLowerCase();
};

export const uploadDocument = async (
  file: File,
  userId: string,
  bucketName: string = 'documents',
  options?: {
    folderPath?: string;
    upsert?: boolean;
  }
): Promise<{ url: string | null; error: string | null; path: string | null }> => {
  try {
    // Validate file first
    const validation = validateFile(file);
    if (!validation.isValid) {
      return {
        url: null,
        error: validation.errors.join(', '),
        path: null
      };
    }
    
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const sanitizedName = sanitizeFilename(file.name.replace(`.${fileExt}`, ''));
    const fileName = `${userId}/${timestamp}_${sanitizedName}.${fileExt}`;
    
    const { data, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, { 
        upsert: options?.upsert || false 
      });
      
    if (uploadError) {
      return {
        url: null,
        error: uploadError.message,
        path: null
      };
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);
      
    return {
      url: publicUrl,
      error: null,
      path: fileName
    };
  } catch (error: any) {
    return {
      url: null,
      error: error.message || 'Upload failed',
      path: null
    };
  }
};

export const createDocumentRecord = async (
  studentId: string,
  docTypeId: string,
  fileName: string,
  fileUrl: string,
  applicationId?: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase
      .from('documents')
      .insert({
        student_id: studentId,
        doc_type_id: docTypeId,
        file_name: fileName,
        file_url: fileUrl,
        application_id: applicationId || null,
      });
      
    if (error) {
      return {
        success: false,
        error: error.message
      };
    }
    
    return {
      success: true,
      error: null
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to create document record'
    };
  }
};

// Helper function to get student ID from user ID
export const getStudentId = async (userId: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
    
  if (error || !data) {
    console.error('Error getting student ID:', error);
    return null;
  }
  
  return data.id;
};

export const handleDocumentUpload = async (
  file: File,
  userId: string,
  documentTypeName: string,
  applicationId?: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    // Get student ID
    const studentId = await getStudentId(userId);
    if (!studentId) {
      return {
        success: false,
        error: 'Student profile not found'
      };
    }
    
    // Get document type
    const docType = await getDocumentTypeByName(documentTypeName);
    if (!docType) {
      return {
        success: false,
        error: `Document type "${documentTypeName}" not found`
      };
    }
    
    // Upload file
    const uploadResult = await uploadDocument(file, userId, 'documents');
    
    if (!uploadResult.url) {
      return {
        success: false,
        error: uploadResult.error || 'Upload failed'
      };
    }
    
    // Create document record
    const recordResult = await createDocumentRecord(
      studentId,
      docType.id,
      file.name,
      uploadResult.url,
      applicationId
    );
    
    return recordResult;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Document upload failed'
    };
  }
};