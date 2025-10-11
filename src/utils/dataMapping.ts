// Utility functions for mapping frontend data to database schema

export const mapStudentRegistrationData = (formData: any) => {
  return {
    user_data: {
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email
    },
    student_data: {
      interested_program: formData.interestedProgram || null,
      preferred_country: formData.preferredCountry || null,
      profile_completion_status: 'incomplete'
    }
  };
};

export const mapAgentRegistrationData = (formData: any) => {
  return {
    user_data: {
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email
    },
    agent_data: {
      company_name: formData.agencyName,
      contact_phone: formData.phoneNumber,
      agency_license_number: formData.licenseNumber || null
    }
  };
};

export const mapUniversityOfficialData = (formData: any) => {
  return {
    user_data: {
      first_name: formData.firstName || formData.fullName?.split(' ')[0] || '',
      last_name: formData.lastName || formData.fullName?.split(' ').slice(1).join(' ') || '',
      email: formData.email
    },
    university_official_data: {
      department: formData.department || null
    }
  };
};

export const validateRequiredFields = (data: any, requiredFields: string[]): string[] => {
  const missingFields: string[] = [];
  
  requiredFields.forEach(field => {
    if (!data[field] || data[field].toString().trim() === '') {
      missingFields.push(field);
    }
  });
  
  return missingFields;
};

export const sanitizeFileUpload = (file: File) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (file.size > maxSize) {
    throw new Error('File size must be less than 10MB');
  }
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('File type not supported');
  }
  
  return true;
};