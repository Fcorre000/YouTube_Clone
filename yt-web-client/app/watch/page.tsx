'use client';
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function WatchContent() {
    const videoPrefix = 'https://storage.googleapis.com/fc-yt-processed-videos/'
    const videoSrc = useSearchParams().get('v');
    return (
        <div>
            <h1>Watch Page</h1>
            <video controls src={videoPrefix + videoSrc}/>
        </div>
    );
}

export default function Watch() {
    return (
        <Suspense>
            <WatchContent />
        </Suspense>
    )
}