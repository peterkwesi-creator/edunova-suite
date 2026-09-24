"use client";

import {
  ClipboardEvent,
  DragEvent,
  useEffect,
  useRef,
  useState,
} from "react";

type ImageUploadProps = {
  value?: string | null;
  onChange: (imageUrl: string | null) => void;
  uploadFolder?:
    | "news"
    | "gallery"
    | "schools"
    | "students"
    | "teachers";
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
};

const DEFAULT_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif";

const DEFAULT_MAX_SIZE_MB = 10;

export default function ImageUpload({
  value,
  onChange,
  uploadFolder = "gallery",
  accept = DEFAULT_ACCEPT,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  label = "Upload Image",
  description = "Drag & drop an image here, click to browse, or paste an image",
  disabled = false,
  className = "",
}: ImageUploadProps) {
  const inputRef =
    useRef<HTMLInputElement | null>(null);

  const [preview, setPreview] =
    useState<string | null>(value ?? null);

  const [isDragging, setIsDragging] =
    useState(false);

  const [isUploading, setIsUploading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    setPreview(value ?? null);
  }, [value]);

  function validateFile(file: File) {
    const allowedTypes = accept
      .split(",")
      .map((type) => type.trim())
      .filter(Boolean);

    if (
      allowedTypes.length > 0 &&
      !allowedTypes.includes(file.type)
    ) {
      return "Please select a supported image type.";
    }

    if (file.size <= 0) {
      return "The selected image is empty.";
    }

    const maxBytes =
      maxSizeMB * 1024 * 1024;

    if (file.size > maxBytes) {
      return `Image must be smaller than ${maxSizeMB}MB.`;
    }

    return null;
  }

  async function uploadFile(
    file: File | null
  ) {
    if (
      !file ||
      disabled ||
      isUploading
    ) {
      return;
    }

    setError(null);

    const validationError =
      validateFile(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    const localPreview =
      URL.createObjectURL(file);

    setPreview((oldPreview) => {
      if (
        oldPreview?.startsWith("blob:")
      ) {
        URL.revokeObjectURL(oldPreview);
      }

      return localPreview;
    });

    setIsUploading(true);

    try {
      const formData = new FormData();

      formData.append("file", file);
      formData.append(
        "folder",
        uploadFolder
      );

      const response = await fetch(
        "/api/uploads/images",
        {
          method: "POST",
          body: formData,
        }
      );

      const text =
        await response.text();

      let data: {
        url?: string;
        error?: string;
      } = {};

      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(
            "The server returned an invalid upload response."
          );
        }
      }

      if (
        !response.ok ||
        !data.url
      ) {
        throw new Error(
          data.error ||
            "Failed to upload image."
        );
      }

      if (
        localPreview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(
          localPreview
        );
      }

      setPreview(data.url);
      onChange(data.url);
    } catch (err) {
      if (
        localPreview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(
          localPreview
        );
      }

      setPreview(value ?? null);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to upload image."
      );
    } finally {
      setIsUploading(false);
    }
  }

  function handleInputChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0] ?? null;

    uploadFile(file);

    event.target.value = "";
  }

  function handleDragOver(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    if (
      disabled ||
      isUploading
    ) {
      return;
    }

    event.dataTransfer.dropEffect =
      "copy";

    setIsDragging(true);
  }

  function handleDragLeave(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    if (
      event.currentTarget.contains(
        event.relatedTarget as Node
      )
    ) {
      return;
    }

    setIsDragging(false);
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    if (
      disabled ||
      isUploading
    ) {
      return;
    }

    setIsDragging(false);

    const file =
      event.dataTransfer.files?.[0] ??
      null;

    uploadFile(file);
  }

  function handlePaste(
    event: ClipboardEvent<HTMLDivElement>
  ) {
    if (
      disabled ||
      isUploading
    ) {
      return;
    }

    const items =
      event.clipboardData.items;

    for (const item of items) {
      if (
        item.type.startsWith(
          "image/"
        )
      ) {
        const file =
          item.getAsFile();

        if (file) {
          event.preventDefault();
          uploadFile(file);
          return;
        }
      }
    }
  }

  function handleBrowse() {
    if (
      disabled ||
      isUploading
    ) {
      return;
    }

    inputRef.current?.click();
  }

  function handleRemove() {
    if (
      disabled ||
      isUploading
    ) {
      return;
    }

    setError(null);
    setPreview(null);
    onChange(null);
  }

  return (
    <div
      className={`w-full ${className}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        disabled={
          disabled || isUploading
        }
        className="hidden"
      />

      <div className="mb-2">
        <label className="block text-sm font-semibold text-gray-800">
          {label}
        </label>
      </div>

      <div
        role="button"
        tabIndex={
          disabled || isUploading
            ? -1
            : 0
        }
        aria-label={label}
        onClick={handleBrowse}
        onKeyDown={(event) => {
          if (
            disabled ||
            isUploading
          ) {
            return;
          }

          if (
            event.key === "Enter" ||
            event.key === " "
          ) {
            event.preventDefault();
            handleBrowse();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPaste={handlePaste}
        className={`
          relative
          w-full
          min-h-[240px]
          overflow-hidden
          rounded-2xl
          border-2
          border-dashed
          transition-all
          duration-200
          ${
            disabled ||
            isUploading
              ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-70"
              : isDragging
                ? "cursor-copy border-blue-500 bg-blue-50"
                : "cursor-pointer border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50"
          }
        `}
      >
        {preview ? (
          <div className="relative flex min-h-[240px] items-center justify-center bg-white p-4">
            <img
              src={preview}
              alt="Selected image preview"
              className="max-h-[320px] max-w-full rounded-xl object-contain"
            />

            {!disabled &&
              !isUploading && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleRemove();
                  }}
                  className="absolute right-3 top-3 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-red-700"
                >
                  Remove
                </button>
              )}

            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/75">
                <div className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-lg">
                  Uploading image...
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex min-h-[240px] flex-col items-center justify-center px-6 py-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-3xl">
              📷
            </div>

            <p className="text-base font-bold text-gray-800">
              {isDragging
                ? "Drop your image here"
                : label}
            </p>

            <p className="mt-2 max-w-lg text-sm leading-6 text-gray-500">
              {description}
            </p>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleBrowse();
              }}
              disabled={
                disabled ||
                isUploading
              }
              className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Browse Files
            </button>

            <p className="mt-3 text-xs text-gray-400">
              JPG, PNG, WEBP or GIF · Max{" "}
              {maxSizeMB}MB
            </p>

            <p className="mt-1 text-xs text-gray-400">
              You can also paste an image
              with Ctrl + V
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}