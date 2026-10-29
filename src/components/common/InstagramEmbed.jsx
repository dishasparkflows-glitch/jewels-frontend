/* eslint-disable react/prop-types */
import { useEffect, useRef } from 'react';

const cleanInstagramUrl = (url = '') => {
  if (!url) return '';
  let cleaned = url.trim();
  if (cleaned.startsWith('http://')) {
    cleaned = 'https://' + cleaned.slice(7);
  }
  if (!cleaned.includes('www.instagram.com') && cleaned.includes('instagram.com')) {
    cleaned = cleaned.replace('instagram.com', 'www.instagram.com');
  }
  // Strip query parameters and hash
  cleaned = cleaned.split(/[?#]/)[0];
  if (!cleaned.endsWith('/')) {
    cleaned += '/';
  }
  return cleaned;
};

export default function InstagramEmbed({ url, captioned = false }) {
  const containerRef = useRef(null);
  const cleanUrl = cleanInstagramUrl(url);

  useEffect(() => {
    if (!cleanUrl) return;

    const processEmbed = () => {
      if (window.instgrm?.Embeds?.process) {
        window.instgrm.Embeds.process(containerRef.current);
      }
    };

    if (window.instgrm?.Embeds) {
      processEmbed();
      return;
    }

    let script = document.getElementById('instagram-embed-script');
    if (!script) {
      script = document.createElement('script');
      script.id = 'instagram-embed-script';
      script.src = 'https://www.instagram.com/embed.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        processEmbed();
      };
      document.body.appendChild(script);
    } else {
      script.addEventListener('load', processEmbed);
      const poll = setInterval(() => {
        if (window.instgrm?.Embeds) {
          processEmbed();
          clearInterval(poll);
        }
      }, 300);
      return () => {
        script.removeEventListener('load', processEmbed);
        clearInterval(poll);
      };
    }
  }, [cleanUrl]);

  if (!cleanUrl) return null;

  return (
    <div ref={containerRef} className="w-full h-full relative" style={{ overflow: 'hidden' }}>
      <style>{`
        .instagram-media, .instagram-media-rendered {
          margin: 0 !important;
          border-radius: 12px !important;
        }
      `}</style>
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={`${cleanUrl}?utm_source=ig_embed&utm_campaign=loading`}
        data-instgrm-version="14"
        data-instgrm-captioned={captioned ? 'true' : undefined}
        style={{
          background: '#FFF',
          border: '0',
          borderRadius: '12px',
          margin: '0',
          maxWidth: '540px',
          minWidth: '326px',
          padding: '0',
          width: 'calc(100% - 2px)',
        }}
      >
        <div style={{ padding: '16px' }}>
          <a
            href={cleanUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#FFFFFF',
              lineHeight: '0',
              padding: '0',
              textAlign: 'center',
              textDecoration: 'none',
              width: '100%',
              display: 'block',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <div
                style={{
                  backgroundColor: '#F4F4F4',
                  borderRadius: '50%',
                  flexGrow: 0,
                  height: '40px',
                  marginRight: '14px',
                  width: '40px',
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center' }}>
                <div style={{ backgroundColor: '#F4F4F4', borderRadius: '4px', flexGrow: 0, height: '14px', marginBottom: '6px', width: '100px' }} />
                <div style={{ backgroundColor: '#F4F4F4', borderRadius: '4px', flexGrow: 0, height: '14px', width: '60px' }} />
              </div>
            </div>
            <div style={{ padding: '19% 0' }} />
            <div style={{ display: 'block', height: '50px', margin: '0 auto 12px', width: '50px' }}>
              <svg width="50" height="50" viewBox="0 0 60 60" version="1.1" xmlns="http://www.w3.org/2000/svg" style={{ fill: '#c7c7c7' }}>
                <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                  <g fill="#c7c7c7">
                    <path d="M30,5.8 C43.3,5.8 54.2,16.7 54.2,30 C54.2,43.3 43.3,54.2 30,54.2 C16.7,54.2 5.8,43.3 5.8,30 C5.8,16.7 16.7,5.8 30,5.8 Z M30,0 C13.4,0 0,13.4 0,30 C0,46.6 13.4,60 30,60 C46.6,60 60,46.6 60,30 C60,13.4 46.6,0 30,0 Z" />
                    <path d="M30,14.6 C21.5,14.6 14.6,21.5 14.6,30 C14.6,38.5 21.5,45.4 30,45.4 C38.5,45.4 45.4,38.5 45.4,30 C45.4,21.5 38.5,14.6 30,14.6 Z M30,20.4 C35.3,20.4 39.6,24.7 39.6,30 C39.6,35.3 35.3,39.6 30,39.6 C24.7,39.6 20.4,35.3 20.4,30 C20.4,24.7 24.7,20.4 30,20.4 Z" />
                  </g>
                </g>
              </svg>
            </div>
            <div style={{ paddingTop: '8px' }}>
              <div style={{ color: '#3897f0', fontFamily: 'Arial,sans-serif', fontSize: '14px', fontStyle: 'normal', fontWeight: 550, lineHeight: '18px' }}>
                View post on Instagram
              </div>
            </div>
          </a>
        </div>
      </blockquote>
    </div>
  );
}
