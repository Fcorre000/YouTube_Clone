import Image from "next/image";
import Link from "next/link";

import { getVideos, Video } from "./firebase/functions";
import Footer from "./components/Footer";
import Thumb from "./components/Thumb";
import styles from "./page.module.css";

export const revalidate = 30;

const PIPELINE_STEPS: Array<[string, string, string]> = [
  ["01", "Client requests signed URL", "Cloud Function"],
  ["02", "Direct PUT to raw bucket", "GCS"],
  ["03", "Pub/Sub fan-out", "Pub/Sub"],
  ["04", "Worker transcodes → 360p", "ffmpeg · Cloud Run"],
  ["05", "Thumbnail @ 5s mark", "ffmpeg"],
  ["06", "Metadata written", "Firestore"],
  ["07", "Playback from CDN", "GCS public"],
];

const STACK_CHIPS: Array<{ bold: string; rest?: string }> = [
  { bold: "Next.js 15" },
  { bold: "React 19" },
  { bold: "TypeScript" },
  { bold: "Firebase", rest: "· Auth + Firestore" },
  { bold: "Cloud Run" },
  { bold: "Pub/Sub" },
  { bold: "GCS" },
  { bold: "ffmpeg" },
  { bold: "Docker" },
];

function relativeAge(createdAt?: number): string {
  if (!createdAt) return "Demo upload";
  const now = Date.now();
  const diff = Math.max(0, now - createdAt);
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

function PlayGlyph({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7 5v14l12-7z" />
    </svg>
  );
}

function CardThumb({ video }: { video: Video }) {
  if (video.thumbnailUrl) {
    return (
      <Image
        src={video.thumbnailUrl}
        alt={video.title || "video thumbnail"}
        fill
        sizes="(max-width: 900px) 50vw, 25vw"
        className={styles.thumbImg}
      />
    );
  }
  return <Thumb id={video.id || video.filename || "unknown"} className={styles.thumbImg} />;
}

function FeatureThumb({ video }: { video: Video }) {
  if (video.thumbnailUrl) {
    return (
      <Image
        src={video.thumbnailUrl}
        alt={video.title || "featured video thumbnail"}
        fill
        priority
        sizes="100vw"
        className={styles.featureThumbImg}
      />
    );
  }
  return <Thumb id={video.id || video.filename || "featured"} className={styles.featureThumbImg} />;
}

export default async function Home() {
  const videos = await getVideos();
  const feature = videos[0];

  return (
    <>
      <div className={styles.page}>
        <section className={styles.intro}>
          <div>
            <div className={styles.kicker}>
              <span className={styles.kickerDot} aria-hidden />
              Portfolio demo · not a real product
            </div>
            <h1 className={styles.h1}>
              Reel, <em className={styles.h1Em}>a</em> YouTube-style streaming demo.
            </h1>
            <p className={styles.lede}>
              <b>End-to-end video platform</b> I built to practice production patterns:
              signed-URL uploads to GCS, a ffmpeg worker on Cloud Run triggered by Pub/Sub,
              Firestore as source of truth, and a Next.js front end. Uploaded content on this
              page is real; the interesting part is the pipeline, not the catalog.
            </p>
            <div className={styles.stack}>
              {STACK_CHIPS.map((c) => (
                <span key={c.bold} className={styles.chip}>
                  <b>{c.bold}</b>
                  {c.rest ? ` ${c.rest}` : null}
                </span>
              ))}
            </div>
          </div>

          <aside className={styles.pipeline}>
            <h4 className={styles.pipelineHead}>Upload pipeline</h4>
            <div className={styles.flow}>
              {PIPELINE_STEPS.map(([step, name, svc]) => (
                <div key={step} className={styles.flowRow}>
                  <span className={styles.flowStep}>{step}</span>
                  <span className={styles.flowName}>{name}</span>
                  <span className={styles.flowSvc}>{svc}</span>
                </div>
              ))}
            </div>
          </aside>
        </section>

        {feature && (
          <Link href={`/watch?v=${feature.filename}`} className={styles.feature}>
            <div className={styles.featureThumb}>
              <FeatureThumb video={feature} />
            </div>
            <div className={styles.featurePlay} aria-hidden>
              <PlayGlyph />
            </div>
            <div className={styles.featureContent}>
              <div className={styles.featureTag}>Demo video · sample content</div>
              <h2 className={styles.featureTitle}>{feature.title || "Latest upload"}</h2>
              <div className={styles.featureMeta}>
                <span>Uploaded via the demo pipeline</span>
                <span>Transcoded 360p</span>
              </div>
            </div>
          </Link>
        )}

        <div className={styles.sectionHead}>
          <h3 className={styles.sectionTitle}>Sample catalog</h3>
          <span className={styles.sectionKicker}>
            {videos.length} item{videos.length === 1 ? "" : "s"} · pulled from Firestore
          </span>
        </div>

        <div className={styles.grid}>
          {videos.map((v) => (
            <Link
              key={v.id || v.filename}
              href={`/watch?v=${v.filename}`}
              className={styles.card}
            >
              <div className={styles.thumbWrap}>
                <CardThumb video={v} />
                <div className={styles.thumbOverlay}>
                  <span>Sample</span>
                  <span />
                </div>
              </div>
              <h4 className={styles.cardTitle}>{v.title || "Untitled upload"}</h4>
              <div className={styles.byline}>
                <span>Demo user</span>
                <span className={styles.bylineSep}>/</span>
                <span>{relativeAge(v.createdAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}
