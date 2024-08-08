import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { useSpring, animated } from 'react-spring';
import './UploadForm.css';

const UploadForm = () => {
  const [files, setFiles] = useState([]);
  const [fileStatuses, setFileStatuses] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const { getRootProps, getInputProps, open } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png']
    },
    onDrop: acceptedFiles => {
      const newFiles = acceptedFiles.map(file => ({
        file,
        status: 'pending',
        progress: 0
      }));
      setFiles([...files, ...acceptedFiles]);
      setFileStatuses([...fileStatuses, ...newFiles]);
    },
    noClick: true,
    noKeyboard: true
  });

  const handleUpload = async () => {
    if (files.length === 0) {
      open();
      return;
    }

    setProcessing(true);
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const res = await axios.post('http://localhost:5001/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: progressEvent => {
          setProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        }
      });

      const updatedFileStatuses = fileStatuses.map((fileStatus, index) => ({
        ...fileStatus,
        status: res.data.results[index] ? 'success' : 'error',
        message: res.data.results[index] ? 'File successfully processed' : 'Error processing file'
      }));

      setFileStatuses(updatedFileStatuses);
    } catch (error) {
      const updatedFileStatuses = fileStatuses.map(fileStatus => ({
        ...fileStatus,
        status: 'error',
        message: error.response ? error.response.data : error.message
      }));
      setFileStatuses(updatedFileStatuses);
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  const handleRemoveFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newFileStatuses = fileStatuses.filter((_, i) => i !== index);
    setFiles(newFiles);
    setFileStatuses(newFileStatuses);
  };

  const processingAnimation = useSpring({
    opacity: processing ? 1 : 0,
    transform: processing ? 'scale(1)' : 'scale(0.9)'
  });

  return (
    <div className="upload-form-wrapper">
      <div className="upload-form-container">
        <div className="upload-form-title">Upload Files and Extract Text</div>
        <div {...getRootProps({ className: 'dropzone' })}>
          <input {...getInputProps()} />
          <p>Drag and drop files here, or click the button below to select files</p>
          <button type="button" onClick={open} className="select-file-button">Select Files</button>
        </div>
        {files.length > 0 && (
          <table className="file-status-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {fileStatuses.map((fileStatus, index) => (
                <tr key={index}>
                  <td>{fileStatus.file.name}</td>
                  <td>{fileStatus.status === 'pending' ? 'Pending' : fileStatus.message}</td>
                  <td>
                    <button onClick={() => handleRemoveFile(index)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button onClick={handleUpload} className="upload-button">
          {processing ? 'Uploading...' : 'Upload'}
        </button>
        {processing && (
          <animated.div style={processingAnimation} className="loading">
            <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            <span>Processing files...</span>
          </animated.div>
        )}
      </div>
    </div>
  );
};

export default UploadForm;
