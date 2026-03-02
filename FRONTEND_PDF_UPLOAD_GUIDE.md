# Frontend Guide: PDF Upload for Courses and Modules

This guide explains how to implement PDF file upload functionality for Courses and Modules in your frontend application.

## 📋 Overview

- **File Field Name**: `pdf_file`
- **File Type**: PDF only (`application/pdf`)
- **Max File Size**: 10MB
- **Storage Location**: Files are stored in company-specific folders:
  - Modules: `uploads/{companyId}/modules/`
  - Courses: `uploads/{companyId}/courses/`
- **Response**: The server returns the file path in the `pdf_file` field (e.g., `/uploads/2/modules/1234567890_module_document.pdf`)

## 🔌 API Endpoints

### Create Module with PDF
```
POST /api/module
Content-Type: multipart/form-data
Authorization: Bearer {token}

Form Data:
- title: string (required)
- description?: string
- volume?: number
- coefficient?: number
- status?: number
- course_ids?: number[]
- pdf_file?: File (PDF file, max 10MB)
```

### Update Module with PDF
```
PATCH /api/module/:id
Content-Type: multipart/form-data
Authorization: Bearer {token}

Form Data:
- title?: string
- description?: string
- volume?: number
- coefficient?: number
- status?: number
- course_ids?: number[]
- pdf_file?: File (PDF file, max 10MB)
```

### Create Course with PDF
```
POST /api/course
Content-Type: multipart/form-data
Authorization: Bearer {token}

Form Data:
- title: string (required)
- description?: string
- volume?: number
- coefficient?: number
- status?: number
- module_ids?: number[]
- pdf_file?: File (PDF file, max 10MB)
```

### Update Course with PDF
```
PATCH /api/course/:id
Content-Type: multipart/form-data
Authorization: Bearer {token}

Form Data:
- title?: string
- description?: string
- volume?: number
- coefficient?: number
- status?: number
- module_ids?: number[]
- pdf_file?: File (PDF file, max 10MB)
```

## 💻 React/TypeScript Implementation Examples

### TypeScript Interfaces

```typescript
interface CreateModuleDto {
  title: string;
  description?: string;
  volume?: number;
  coefficient?: number;
  status?: number;
  course_ids?: number[];
  pdf_file?: File;
}

interface Module {
  id: number;
  title: string;
  description?: string;
  volume?: number;
  coefficient?: number;
  pdf_file?: string; // File path returned from server
  status: number;
  company_id: number;
  created_at: string;
  updated_at: string;
}
```

### React Component Example - Create Module with PDF

```tsx
import React, { useState } from 'react';
import axios from 'axios';

interface CreateModuleFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const CreateModuleForm: React.FC<CreateModuleFormProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    volume: '',
    coefficient: '',
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are allowed');
        return;
      }
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setError(null);
      setPdfFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      
      // Add text fields
      formDataToSend.append('title', formData.title);
      if (formData.description) {
        formDataToSend.append('description', formData.description);
      }
      if (formData.volume) {
        formDataToSend.append('volume', formData.volume);
      }
      if (formData.coefficient) {
        formDataToSend.append('coefficient', formData.coefficient);
      }

      // Add PDF file if selected
      if (pdfFile) {
        formDataToSend.append('pdf_file', pdfFile);
      }

      const token = localStorage.getItem('token');
      const response = await axios.post('/api/module', formDataToSend, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Module created:', response.data);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create module');
      console.error('Error creating module:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title">Title *</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          required
        />
      </div>

      <div>
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={4}
        />
      </div>

      <div>
        <label htmlFor="pdf_file">PDF Document (Optional)</label>
        <input
          type="file"
          id="pdf_file"
          name="pdf_file"
          accept="application/pdf"
          onChange={handleFileChange}
        />
        {pdfFile && (
          <p className="text-sm text-gray-600">
            Selected: {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
        <p className="text-xs text-gray-500">Max size: 10MB, PDF files only</p>
      </div>

      {error && <div className="text-red-600">{error}</div>}

      <div className="flex gap-2">
        <button type="submit" disabled={isUploading}>
          {isUploading ? 'Creating...' : 'Create Module'}
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default CreateModuleForm;
```

### React Component Example - Table with PDF Upload/View

```tsx
import React, { useState } from 'react';
import axios from 'axios';

interface ModuleTableProps {
  modules: Module[];
  onUpdate: () => void;
}

const ModuleTable: React.FC<ModuleTableProps> = ({ modules, onUpdate }) => {
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (moduleId: number, file: File) => {
    setUploadingId(moduleId);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('pdf_file', file);

      const token = localStorage.getItem('token');
      await axios.patch(`/api/module/${moduleId}`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      onUpdate(); // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload PDF');
    } finally {
      setUploadingId(null);
    }
  };

  const handleFileChange = (moduleId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are allowed');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      handleFileUpload(moduleId, file);
    }
  };

  const handleViewPdf = (pdfPath: string) => {
    // Open PDF in new tab
    window.open(pdfPath, '_blank');
  };

  const handleDownloadPdf = (pdfPath: string, moduleTitle: string) => {
    // Create a temporary link to download the file
    const link = document.createElement('a');
    link.href = pdfPath;
    link.download = `${moduleTitle}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {error && <div className="alert alert-error">{error}</div>}
      
      <table className="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>PDF Document</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {modules.map((module) => (
            <tr key={module.id}>
              <td>{module.title}</td>
              <td>{module.description || '-'}</td>
              <td>
                {module.pdf_file ? (
                  <div className="flex gap-2 items-center">
                    <span className="text-sm text-green-600">✓ PDF attached</span>
                    <button
                      onClick={() => handleViewPdf(module.pdf_file!)}
                      className="btn btn-sm btn-primary"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDownloadPdf(module.pdf_file!, module.title)}
                      className="btn btn-sm btn-secondary"
                    >
                      Download
                    </button>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">No PDF</span>
                )}
              </td>
              <td>
                <label className="btn btn-sm btn-outline">
                  {uploadingId === module.id ? 'Uploading...' : 'Upload PDF'}
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => handleFileChange(module.id, e)}
                    style={{ display: 'none' }}
                    disabled={uploadingId === module.id}
                  />
                </label>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ModuleTable;
```

### Using Axios with FormData

```typescript
// Helper function to create/update module with PDF
async function createModuleWithPdf(moduleData: CreateModuleDto, pdfFile?: File) {
  const formData = new FormData();
  
  // Append all text fields
  Object.entries(moduleData).forEach(([key, value]) => {
    if (key !== 'pdf_file' && value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(item => formData.append(key, item.toString()));
      } else {
        formData.append(key, value.toString());
      }
    }
  });
  
  // Append PDF file if provided
  if (pdfFile) {
    formData.append('pdf_file', pdfFile);
  }

  const response = await axios.post('/api/module', formData, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}
```

## ✅ Validation Checklist

- [ ] File type is PDF (`application/pdf`)
- [ ] File size is less than 10MB
- [ ] FormData is used for multipart/form-data requests
- [ ] Content-Type header is set to `multipart/form-data`
- [ ] Authorization token is included in headers
- [ ] Error handling for file upload failures
- [ ] Loading state during upload
- [ ] Display existing PDF if available
- [ ] Ability to view/download existing PDFs
- [ ] Ability to replace existing PDF with new upload

## 📝 Notes

1. **File Path**: The server returns the file path (e.g., `/uploads/2/modules/1234567890_document.pdf`). Use this path to display or download the file.

2. **Base URL**: Make sure your frontend can access the uploaded files. If files are served statically, ensure your backend serves the `uploads` directory.

3. **Update vs Create**: When updating, if you don't send a `pdf_file`, the existing PDF will remain unchanged. To remove a PDF, you would need to send an empty string or null (if the backend supports it).

4. **File Replacement**: When uploading a new PDF, it will replace the existing one. The old file is not automatically deleted (you may want to implement cleanup on the backend).

5. **Same Implementation for Courses**: The same pattern applies to Courses - just replace `/api/module` with `/api/course` and adjust field names accordingly.

## 🔍 Testing

1. Create a module/course without PDF → Should work
2. Create a module/course with PDF → Should upload and save path
3. Update module/course with new PDF → Should replace existing PDF
4. Upload non-PDF file → Should show error
5. Upload file > 10MB → Should show error
6. View existing PDF → Should open in new tab
7. Download existing PDF → Should download file

