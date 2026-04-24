'use client';

import { useEffect, useRef, useState } from 'react';
import { User } from 'firebase/auth';

import { onAuthStateChangedHelper, signInWithGoogle } from '../firebase/firebase';
import { uploadVideo } from '../firebase/functions';
import styles from './page.module.css';

type Status = 'idle' | 'uploading' | 'success' | 'error';

const STEPS: Array<[string, string]> = [
  ['Client calls generateUploadUrl', 'Cloud Function · v4 signed URL, 15 min expiry'],
  ['Direct PUT to raw bucket', 'gs://fc-yt-raw-videos/<uid>-<ts>'],
  ['Pub/Sub notifies the worker', 'POST /process-video'],
  ['ffmpeg transcodes to 360p', 'scale=-1:360, AAC audio'],
  ['Thumbnail extracted at 5s', 'Uploaded to thumbnails bucket'],
  ['Firestore doc updated', 'status: "processed"'],
];

const META: Array<[string, string]> = [
  ['Container', 'MP4 / MOV / WEBM'],
  ['Max size', '2 GB (demo: keep small)'],
  ['Output', 'H.264 · 360p · AAC'],
  ['Thumbnail', 'Auto @ 5s mark'],
];

export default function UploadPage() {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string>('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = onAuthStateChangedHelper(setUser);
    return () => unsub();
  }, []);

  const handleFile = async (file: File) => {
    setStatus('uploading');
    setMessage(`Uploading ${file.name}...`);
    try {
      await uploadVideo(file);
      setStatus('success');
      setMessage(
        `${file.name} uploaded. Processing takes 2 to 4 minutes; it will appear on the home page once the worker finishes.`,
      );
    } catch (err) {
      setStatus('error');
      setMessage(`Upload failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.item(0);
    if (f) handleFile(f);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = () => setDragOver(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!user || status === 'uploading') return;
    const f = e.dataTransfer.files?.item(0);
    if (f) handleFile(f);
  };

  const dropzoneClass = [
    styles.dropzone,
    styles.frameCorners,
    dragOver ? styles.dragOver : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <main className={styles.page}>
      <header className={styles.head}>
        <div className={styles.kicker}>Try the upload pipeline</div>
        <h1 className={styles.h1}>
          Upload a video.
          <br />
          Watch the pipeline run.
        </h1>
        <p className={styles.subhead}>
          Drop a small test clip to exercise the full flow end to end: signed URL, direct GCS
          upload, Pub/Sub trigger, ffmpeg transcode, thumbnail generation, Firestore write.
          Processing usually finishes in 2 to 4 minutes.
        </p>
      </header>

      <div className={styles.grid}>
        <section
          className={dropzoneClass}
          onDragEnter={onDragOver}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <span aria-hidden className={styles.cornerBottomLeft} />
          <span aria-hidden className={styles.cornerBottomRight} />

          <div className={styles.dzInner}>
            <div className={styles.reel} aria-hidden>
              +
            </div>
            <h2 className={styles.dzTitle}>Drop a test clip</h2>
            <p className={styles.dzSub}>
              Requires Google sign-in · small files recommended for demo purposes
            </p>

            <input
              ref={fileInputRef}
              id="upload-file"
              type="file"
              accept="video/*"
              onChange={onFileChange}
              className={styles.fileInput}
              disabled={!user || status === 'uploading'}
            />

            {user ? (
              <label
                htmlFor="upload-file"
                className={`${styles.btn} ${styles.btnPrimary} ${
                  status === 'uploading' ? styles.btnDisabled : ''
                }`}
              >
                {status === 'uploading' ? 'Uploading…' : 'Choose file'}
              </label>
            ) : (
              <button
                type="button"
                onClick={() => signInWithGoogle()}
                className={`${styles.btn} ${styles.btnPrimary}`}
              >
                Sign in to upload
              </button>
            )}

            {status !== 'idle' && (
              <p
                className={`${styles.statusMsg} ${
                  status === 'success'
                    ? styles.statusSuccess
                    : status === 'error'
                    ? styles.statusError
                    : styles.statusProgress
                }`}
              >
                {message}
              </p>
            )}

            <div className={styles.metaRow}>
              {META.map(([k, v]) => (
                <div key={k} className={styles.metaCell}>
                  <b>{k}</b>
                  {v}
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className={styles.side}>
          <div className={styles.card}>
            <h3 className={styles.cardHead}>What happens when you hit upload</h3>
            <ol className={styles.list}>
              {STEPS.map(([name, sub]) => (
                <li key={name}>
                  {name}
                  <span className={styles.muted}>{sub}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardHead}>Heads up</h3>
            <p className={styles.note}>
              This is a <b>demo project</b>. Uploads are visible to any authenticated user on the
              live deploy. Do not upload anything private. Raw files are deleted after processing;
              transcodes live in a public bucket.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
