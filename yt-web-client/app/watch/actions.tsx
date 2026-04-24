'use client';

import { useState } from 'react';
import styles from './page.module.css';

export default function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fail silently; leave label unchanged
    }
  };

  return (
    <button type="button" onClick={onClick} className={styles.btn}>
      {copied ? 'Copied' : 'Copy demo link'}
    </button>
  );
}
