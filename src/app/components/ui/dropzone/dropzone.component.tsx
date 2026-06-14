import React, { useId, useState } from 'react';

import IconSVG from '../iconSVG';
import StyledDropzone from './dropzone.styled';
import type { DropzoneProps } from './dropzone.type';

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
    <StyledDropzone
      data-is-dragging={isDragging ? 'true' : 'false'}
      data-has-error={error ? 'true' : 'false'}
      data-is-disabled={disabled ? 'true' : 'false'}
    >
      <span className="dropzone-label">{label}</span>

      <label
        className="dropzone-area"
        htmlFor={inputId}
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
        <input
          className="dropzone-input"
          id={inputId}
          type="file"
          accept={acceptedTypes}
          multiple={multiple}
          disabled={disabled}
          onChange={event => handleFiles(event.target.files)}
          {...rest}
        />

        <span className="dropzone-icon">
          <IconSVG name="upload" />
        </span>

        <span className="dropzone-text">
          Drag and drop files here, or click to browse
        </span>

        {description && (
          <span className="dropzone-description">{description}</span>
        )}
      </label>

      {error && <p className="dropzone-error">{error}</p>}
    </StyledDropzone>
  );
};

export default Dropzone;
