export type UploadProgressHandler = (progress: number) => void;

interface UploadFileWithProgressOptions {
  presignedUrl: string;
  file: File;
  contentType: string;
  onProgress?: UploadProgressHandler;
}

export function uploadFileWithProgress({
  presignedUrl,
  file,
  contentType,
  onProgress,
}: UploadFileWithProgressOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }

      reject(new Error(`Upload failed with status ${xhr.status}`));
    };

    xhr.onerror = () => reject(new Error("Upload failed due to a network error"));
    xhr.onabort = () => reject(new Error("Upload was cancelled"));

    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.send(file);
  });
}
