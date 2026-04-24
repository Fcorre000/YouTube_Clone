import Image from 'next/image';
import Link from 'next/link';

import { getVideos, Video } from '../firebase/functions';
import Thumb from '../components/Thumb';
import { REPO_URL } from '../config';
import CopyLinkButton from './actions';
import styles from './page.module.css';

export const revalidate = 30;

const PROCESSED_PREFIX = 'https://storage.googleapis.com/fc-yt-processed-videos/';

const FALLBACK_DESC =
  'This is demo content. In the live project, this description field is a Firestore document property and the player streams an H.264/360p transcode from a public GCS bucket.';

function GhIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.42c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.33.95.1-.74.4-1.24.72-1.53-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.75.11 3.04.73.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.26 5.69.41.36.78 1.06.78 2.15v3.19c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

function relativeAge(createdAt?: number): string {
  if (!createdAt) return 'Demo upload';
  const diff = Math.max(0, Date.now() - createdAt);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))} min ago`;
  if (diff < day) return `${Math.floor(diff / hour)} hr ago`;
  if (diff < week) return `${Math.floor(diff / day)} days ago`;
  if (diff < month) return `${Math.floor(diff / week)} weeks ago`;
  return `${Math.floor(diff / month)} months ago`;
}

function RelatedThumb({ video }: { video: Video }) {
  if (video.thumbnailUrl) {
    return (
      <Image
        src={video.thumbnailUrl}
        alt={video.title || 'related video'}
        fill
        sizes="140px"
        className={styles.relatedThumbImg}
      />
    );
  }
  return <Thumb id={video.id || video.filename || 'related'} className={styles.relatedThumbImg} />;
}

type PageProps = {
  searchParams: Promise<{ v?: string }>;
};

export default async function WatchPage({ searchParams }: PageProps) {
  const { v } = await searchParams;
  const allVideos = await getVideos();
  const current = allVideos.find((x) => x.filename === v) ?? allVideos[0];
  const videoSrc = v ? `${PROCESSED_PREFIX}${v}` : undefined;
  const related = allVideos.filter((x) => x.filename !== current?.filename).slice(0, 4);

  return (
    <>
      <div className={styles.stage}>
        <div className={styles.player}>
          {videoSrc ? (
            <video
              className={styles.video}
              controls
              src={videoSrc}
              poster={current?.thumbnailUrl}
              preload="metadata"
            />
          ) : (
            <div className={styles.videoFallback}>No video selected</div>
          )}
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.main}>
          <div className={styles.category}>Sample · Demo</div>
          <h1 className={styles.title}>{current?.title || 'Untitled upload'}</h1>

          <div className={styles.byline}>
            <span className={styles.author}>Demo user</span>
            <span className={styles.meta}>placeholder author</span>
            <span className={styles.spacer} />
            <span className={styles.meta}>{relativeAge(current?.createdAt)}</span>
          </div>

          <p className={styles.desc}>{current?.description || FALLBACK_DESC}</p>

          <div className={styles.actions}>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              <GhIcon />
              <span>View code</span>
            </a>
            {videoSrc && (
              <a
                href={videoSrc}
                target="_blank"
                rel="noreferrer"
                className={styles.btn}
              >
                Playback config
              </a>
            )}
            <a
              href={`${REPO_URL}/blob/main/yt-api-service/functions/src/index.ts`}
              target="_blank"
              rel="noreferrer"
              className={styles.btn}
            >
              Firestore doc
            </a>
            <CopyLinkButton />
          </div>

          <div className={styles.techPanel}>
            <h4 className={styles.techHead}>What is happening behind this player</h4>
            <div className={styles.kv}>
              <span className={styles.k}>Source</span>
              <span className={styles.v}>
                storage.googleapis.com/<b>fc-yt-processed-videos</b>/{current?.filename || '<filename>'}
              </span>
              <span className={styles.k}>Codec</span>
              <span className={styles.v}>
                H.264 · <b>360p</b> · AAC stereo
              </span>
              <span className={styles.k}>Origin</span>
              <span className={styles.v}>
                Uploaded raw → ffmpeg worker on Cloud Run → processed bucket
              </span>
              <span className={styles.k}>Metadata</span>
              <span className={styles.v}>
                Firestore · <b>videos/{current?.id || '<id>'}</b> · {`{ uid, filename, status, title, thumbnailUrl, createdAt }`}
              </span>
              <span className={styles.k}>Idempotency</span>
              <span className={styles.v}>
                Worker checks Firestore before work; sets <b>status: &quot;processing&quot;</b>
              </span>
              <span className={styles.k}>Auth</span>
              <span className={styles.v}>
                Firebase Auth (Google sign-in) · read rules allow any authenticated user
              </span>
            </div>
          </div>
        </div>

        <aside className={styles.aside}>
          <h3 className={styles.asideTitle}>More samples</h3>
          {related.length === 0 ? (
            <p className={styles.asideEmpty}>No other uploads yet.</p>
          ) : (
            related.map((r) => (
              <Link
                key={r.id || r.filename}
                href={`/watch?v=${r.filename}`}
                className={styles.relatedItem}
              >
                <div className={styles.relatedThumb}>
                  <RelatedThumb video={r} />
                </div>
                <div className={styles.relatedContent}>
                  <h5 className={styles.relatedTitle}>{r.title || 'Untitled upload'}</h5>
                  <div className={styles.relatedMeta}>
                    Demo user · {relativeAge(r.createdAt)}
                  </div>
                </div>
              </Link>
            ))
          )}
        </aside>
      </div>
    </>
  );
}
