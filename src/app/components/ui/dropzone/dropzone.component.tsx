import React, { useId, useState } from 'react';

import {
  DropzoneArea,
  DropzoneDescription,
  DropzoneError,
  DropzoneField,
  DropzoneIcon,
  DropzoneInput,
  DropzoneLabel,
  DropzoneText,
} from './dropzone.styled';
import type { DropzoneProps } from './dropzone.type';

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
    <path
      d="M12 16V4M7 9l5-5 5 5M5 20h14"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Dropzone = ({
  id,
  label,
  description,
  error,
  acceptedTypes,
  multiple = true,
  disabled = false,
  onFilesSelected,
  ...rest
}: DropzoneProps) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || disabled) {
      return;
    }

    onFilesSelected(Array.from(fileList));
  };

  return (
    <DropzoneField>
      <DropzoneLabel>{label}</DropzoneLabel>

      <DropzoneArea
        htmlFor={inputId}
        $isDragging={isDragging}
        $hasError={Boolean(error)}
        $isDisabled={disabled}
        onDragEnter={event => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={event => {
          event.preventDefault();
        }}
        onDragLeave={event => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={event => {
          event.preventDefault();
          setIsDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
      >
        <DropzoneInput
          id={inputId}
          type="file"
          accept={acceptedTypes}
          multiple={multiple}
          disabled={disabled}
          onChange={event => handleFiles(event.target.files)}
          {...rest}
        />

        <DropzoneIcon>
          <UploadIcon />
        </DropzoneIcon>

        <DropzoneText>
          Drag and drop files here, or click to browse
        </DropzoneText>

        {description && (
          <DropzoneDescription>{description}</DropzoneDescription>
        )}
      </DropzoneArea>

      {error && <DropzoneError>{error}</DropzoneError>}
    </DropzoneField>
  );
};

export default Dropzone;
