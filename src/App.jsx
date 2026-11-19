import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowLeft, ArrowRight, ChevronDown, Crown, Heart, Volume2, VolumeX, X } from 'lucide-react';
import { princessConfig as config } from './data/princessConfig';

const scenes = ['welcome', 'entrance', 'gallery', 'ballroom', 'garden', 'letter', 'crown', 'final'];
const petals = Array.from({ length: 22 }, (_, i) => ({ left: `${(i * 43 + 9) % 100}%`, delay: `${(i * 1.73) % 13}s`, duration: `${11 + (i % 7) * 2}s`, size: `${7 + (i % 4) * 3}px` }));
const fade = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 }, transition: { duration: 0.7, ease: 'easeInOut' } };

function decodeBase64Url(value) {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  return Uint8Array.from(atob(padded), character => character.charCodeAt(0));
}

async function decryptPhotoCollection(encodedKey) {
  if (!globalThis.crypto?.subtle) throw new Error('Secure browser cryptography is unavailable.');
  const keyBytes = decodeBase64Url(encodedKey);
  if (keyBytes.length !== 32) throw new Error('The private photo link is invalid.');
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['decrypt']);
  const manifestResponse = await fetch(`${import.meta.env.BASE_URL}secure-images/manifest.json`);
  if (!manifestResponse.ok) throw new Error('The encrypted photo manifest is unavailable.');
  const manifest = await manifestResponse.json();
  if (manifest.version !== 1 || !Array.isArray(manifest.photos)) throw new Error('The encrypted photo manifest is invalid.');
  const urls = {};
  try {
    for (const photo of manifest.photos) {
      if (!/^[-0-9a-f]{36}\.bin$/.test(photo.file) || !/^\/images\/aayushi\/[^/]+$/.test(photo.source) || !['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml'].includes(photo.type)) {
        throw new Error('The encrypted photo entry is invalid.');
      }
      const response = await fetch(`${import.meta.env.BASE_URL}secure-images/${encodeURIComponent(photo.file)}`);
      if (!response.ok) throw new Error('An encrypted photo could not be loaded.');
      const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decodeBase64Url(photo.iv) }, key, await response.arrayBuffer());
      urls[photo.source] = URL.createObjectURL(new Blob([plaintext], { type: photo.type }));
    }
    return urls;
  } catch (error) {
    Object.values(urls).forEach(URL.revokeObjectURL);
    throw error;
  }
}

function Button({ children, onClick, secondary = false, icon: Icon }) {
  return <button className={`royal-button ${secondary ? 'secondary' : ''}`} onClick={onClick}>{Icon && <Icon size={15} strokeWidth={1.5} />}<span>{children}</span><span className="button-arrow">↗</span></button>;
}
function LocalPhoto({ src, alt, fallback, photoUrls }) {
  const decryptedUrl = photoUrls[src];
  return decryptedUrl ? <img src={decryptedUrl} alt={alt} loading="lazy" /> : <div className="photo-placeholder"><Heart size={21} /><span>{fallback}</span></div>;
}
function Frame({ children, scene, setScene, audioOn, toggleAudio, petalsOn = false }) {
  return <main className={`scene scene-${scene}`}>
    <div className="scene-backdrop" />
    {petalsOn && <div className="petals" aria-hidden="true">{petals.map((p, i) => <i key={i} style={p} />)}</div>}
    <header className="topbar"><button className="brand" onClick={() => setScene('welcome')}><span className="crest"><Crown size={15} /></span><span>MAISON <b>AAYUSHI</b></span></button><div className="topbar-right"><span className="chapter">A ROYAL STORY <i>·</i> {String(scenes.indexOf(scene) + 1).padStart(2, '0')} / 08</span><button className="icon-button" aria-label={audioOn ? 'Turn music off' : 'Turn music on'} onClick={toggleAudio}>{audioOn ? <Volume2 size={17} /> : <VolumeX size={17} />}</button></div></header>
    <div className="scene-content">{children}</div>
    <footer className="bottom-mark"><span>MADE WITH LOVE, BY HARSH</span><span className="footer-heart">♥</span><span>17 · 09 · 2022</span></footer>
  </main>;
}

function App() {
  const [scene, setScene] = useState('welcome');
  const [memoryIndex, setMemoryIndex] = useState(null);
  const [letterOpen, setLetterOpen] = useState(false);
  const [crownClaimed, setCrownClaimed] = useState(false);
  const [finalNote, setFinalNote] = useState(false);
  const [audioOn, setAudioOn] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [cameraMessage, setCameraMessage] = useState('');
  const [doorsOpen, setDoorsOpen] = useState(false);
  const [privatePhotoUrls, setPrivatePhotoUrls] = useState({});
  const [photoStatus, setPhotoStatus] = useState('locked');
  const audioRef = useMemo(() => typeof Audio !== 'undefined' ? new Audio(config.audio.src) : null, []);
  useEffect(() => {
    if (memoryIndex === null) return undefined;
    const closeOnEscape = event => { if (event.key === 'Escape') setMemoryIndex(null); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [memoryIndex]);
  useEffect(() => { if (!audioRef) return; audioRef.loop = true; audioRef.volume = 0.32; return () => { audioRef.pause(); }; }, [audioRef]);
  useEffect(() => {
    const secret = new URLSearchParams(window.location.hash.slice(1)).get('key');
    if (!secret) return undefined;
    let active = true;
    let createdUrls = {};
    setPhotoStatus('unlocking');
    decryptPhotoCollection(secret).then(urls => {
      createdUrls = urls;
      if (active) { setPrivatePhotoUrls(urls); setPhotoStatus('ready'); }
      else Object.values(urls).forEach(URL.revokeObjectURL);
    }).catch(() => { if (active) setPhotoStatus('error'); });
    return () => { active = false; Object.values(createdUrls).forEach(URL.revokeObjectURL); };
  }, []);
  const toggleAudio = async () => { if (!audioRef) return; if (audioOn) { audioRef.pause(); setAudioOn(false); return; } setAudioReady(true); try { await audioRef.play(); setAudioOn(true); } catch { setAudioOn(false); } };
  const go = (next) => { setScene(next); setMemoryIndex(null); };
  const explainCamera = () => setCameraMessage('Live face tracking is not included in this build, so this experience does not open your camera. Your crowned portrait is the royal keepsake.');
  return <Frame scene={scene} setScene={go} audioOn={audioOn} toggleAudio={toggleAudio} petalsOn={['garden', 'final', 'crown'].includes(scene)}>
    <AnimatePresence>
      {scene === 'welcome' && <motion.section key="welcome" className="welcome-screen" {...fade}>
        <div className="welcome-art"><div className="sun-orb" /><div className="welcome-palace"><div className="palace-main"><i /><i /><i /></div><div className="palace-wing left" /><div className="palace-wing right" /><div className="palace-dome"><b /></div><div className="palace-spire s1" /><div className="palace-spire s2" /><div className="palace-spire s3" /><div className="palace-ground" /></div><div className="light-grain" /></div>
        <div className="welcome-copy"><span className="eyebrow"><i /> {config.welcomeTitle} <i /></span><h1>For the girl who<br /><em>deserves a kingdom.</em></h1><p>{config.welcomeLine}</p><Button onClick={() => { if (!audioReady && config.audio.enabledByDefault) toggleAudio(); go('entrance'); }}>Enter your kingdom</Button><div className="scroll-cue"><span>AN EXPERIENCE MADE FOR YOU</span><ChevronDown size={13} /></div></div>
        <div className="side-label">A PRIVATE WORLD · EST. 2022</div>
      </motion.section>}
      {scene === 'entrance' && <motion.section key="entrance" className="entrance-screen" {...fade}>
        <div className="entrance-architecture"><div className={`arch-frame ${doorsOpen ? 'doors-open' : ''}`}><div className="arch-inner"><div className="door door-left"><span className="door-inset" /><span className="door-handle" /></div><div className="door door-right"><span className="door-inset" /><span className="door-handle" /></div><div className="door-glow" /></div><div className="arch-keystone">✦</div><div className="pillar p-left" /><div className="pillar p-right" /><div className="staircase"><i /><i /><i /><i /><i /></div><div className="runner" /></div><div className="chandelier">✧<b>✧</b></div></div>
        <div className="entrance-copy"><span className="eyebrow">THE PALACE AWAITS</span><h2>Every princess deserves<br />a kingdom of <em>her own.</em></h2><p>Your kingdom has been waiting for you.</p><Button onClick={() => { if (doorsOpen) return; setDoorsOpen(true); window.setTimeout(() => { setDoorsOpen(false); go('gallery'); }, 1700); }}>Open the royal doors</Button><span className="tiny-note">A world, made just for you</span></div>
      </motion.section>}
      {scene === 'gallery' && <motion.section key="gallery" className="gallery-screen" {...fade}>
        <div className="section-heading"><span className="eyebrow">A COLLECTION OF US</span><h2>Little moments.<br /><em>A whole lifetime.</em></h2><p>Eight pieces of our story, kept close in the palace gallery.</p></div>
        <div className="gallery-grid">{config.memories.map((memory, i) => <button className={`memory-card card-${i % 4}`} key={memory.title} onClick={() => setMemoryIndex(i)}><div className="memory-photo"><LocalPhoto src={memory.image} alt={memory.title} fallback="Our story, in the making" photoUrls={privatePhotoUrls} /><span className="photo-wash" /><span className="memory-number">{String(i + 1).padStart(2, '0')}</span><span className="memory-open">↗</span></div><span className="memory-title">{memory.title}</span></button>)}</div>
        <div className="gallery-bottom"><span><i /> {photoStatus === 'ready' ? 'PRIVATE MEMORIES UNLOCKED' : photoStatus === 'unlocking' ? 'UNLOCKING PRIVATE MEMORIES' : photoStatus === 'error' ? 'CHECK THE PRIVATE PHOTO LINK' : 'OPEN THE PRIVATE LINK TO UNLOCK MEMORIES'}</span><Button secondary onClick={() => go('ballroom')}>Continue the story</Button></div>
      </motion.section>}
      {scene === 'ballroom' && <motion.section key="ballroom" className="ballroom-screen" {...fade}><div className="ballroom-art"><div className="ballroom-arch" /><div className="ballroom-window w1" /><div className="ballroom-window w2" /><div className="ballroom-chandelier">✧</div><div className="ballroom-floor" /><div className="ballroom-reflection" /></div><div className="ballroom-content"><div className="plaque"><span>✦</span><p>A little kingdom,<br />made for one very special girl.</p><span>✦</span></div><span className="eyebrow">A MOMENT, JUST FOR YOU</span><h2>Among all the beautiful things<br />in this world, <em>you will always<br />be my favourite.</em></h2><Button onClick={() => go('garden')}>Wander into the garden</Button></div><span className="ballroom-caption">THE ROYAL BALLROOM</span></motion.section>}
      {scene === 'garden' && <motion.section key="garden" className="garden-screen" {...fade}><div className="garden-sun" /><div className="garden-palace"><div className="garden-dome" /><i /><i /><i /></div><div className="garden-horizon" /><div className="garden-path" /><div className="garden-beds left-bed">{Array.from({ length: 26 }, (_, i) => <i key={i} style={{ '--x': `${i % 8 * 13}%`, '--y': `${Math.floor(i / 8) * 28 + (i % 3) * 4}%` }} />)}</div><div className="garden-beds right-bed">{Array.from({ length: 26 }, (_, i) => <i key={i} style={{ '--x': `${i % 8 * 13}%`, '--y': `${Math.floor(i / 8) * 28 + (i % 3) * 4}%` }} />)}</div><div className="garden-fountain"><span /><i /><b /></div><div className="gazebo"><i /><i /><b /></div><div className="garden-copy"><span className="eyebrow">THE GARDEN OF LITTLE WONDERS</span><h2>A garden grows wherever<br /><em>you are.</em></h2><p>Your smile makes even ordinary days beautiful.<br />If I could choose again, I would still choose you.</p><p className="garden-whisper">Every version of my future has you in it.</p><Button onClick={() => go('letter')}>Open your letter</Button></div><div className="garden-sign">THE ROSE GARDEN <span>✦</span> EST. FOR AAYUSHI</div></motion.section>}
      {scene === 'letter' && <motion.section key="letter" className="letter-screen" {...fade}><div className="letter-intro"><span className="eyebrow">WORDS I WANT YOU TO KEEP</span><h2>A letter from <em>my heart.</em></h2><p>Written for you, to open whenever you need a reminder.</p></div><div className={`letter-object ${letterOpen ? 'opened' : ''}`}><div className="letter-paper"><div className="letter-paper-top">✦ &nbsp; FOR AAYUSHI &nbsp; ✦</div><div className="letter-copy">{config.letter.split('\n').map((line, i) => line ? <p key={i}>{line}</p> : <div key={i} className="letter-gap" />)}</div><div className="letter-flourish">❧</div></div><button className="wax-seal" aria-label="Open the letter" onClick={() => setLetterOpen(v => !v)}><span>H</span></button><div className="envelope-flap" /></div><div className="letter-action">{!letterOpen ? <Button onClick={() => setLetterOpen(true)}>Break the seal</Button> : <Button onClick={() => go('crown')}>A little more magic</Button>}</div><div className="letter-chrome">PAPER, SEALED WITH LOVE <span>♥</span> ALWAYS YOURS</div></motion.section>}
      {scene === 'crown' && <motion.section key="crown" className="crown-screen" {...fade}><div className="crown-aura" /><div className={`crown-stage ${crownClaimed ? 'claimed' : ''}`}><div className="crown-sparkles">{Array.from({ length: 28 }, (_, i) => <i key={i} style={{ '--i': i }} />)}</div><div className="cushion"><span /></div><div className="royal-crown"><div className="crown-points"><i /><i /><i /><i /><i /></div><div className="crown-band"><span>◆</span><i>◇</i><span>◆</span><i>◇</i><span>◆</span></div><div className="crown-base" /></div><span className="crown-shadow" /></div><div className="crown-copy"><span className="eyebrow">THE MOMENT YOU WERE BORN FOR</span><h2>Every kingdom needs a queen.<br /><em>This kingdom already has one.</em></h2>{!crownClaimed ? <Button onClick={() => setCrownClaimed(true)} icon={Crown}>Claim your crown</Button> : <><p className="revealed-name">HER HIGHNESS<br /><strong>AAYUSHI SHAH</strong></p><Button secondary onClick={explainCamera}>About live crown fitting</Button>{cameraMessage && <p className="camera-note">{cameraMessage}</p>}</>}</div><div className="crown-footer">A CROWN, FOR THE ONE WHO HAS ALWAYS RULED MY HEART</div><button className="next-scene" onClick={() => go('final')} aria-label="Continue to the final surprise"><ArrowDown size={16} /></button></motion.section>}
      {scene === 'final' && <motion.section key="final" className="final-screen" {...fade}><div className="final-glow" /><div className="final-palace"><div className="final-dome" /><i /><i /><i /><span className="final-lights">✦　✧　✦</span></div><div className="fireworks">{Array.from({ length: 9 }, (_, i) => <i key={i} style={{ '--i': i }} />)}</div><div className="final-portrait"><LocalPhoto src="/images/aayushi/aayushi-portrait.jpg" alt="Aayushi" fallback="Your royal portrait" photoUrls={privatePhotoUrls} /><div className="portrait-crown"><Crown size={25} /></div></div><div className="final-copy"><span className="eyebrow">A DAY MADE FOR A PRINCESS</span><h1>Happy<br /><em>Princess Day</em></h1><div className="final-name"><span>PRINCESS</span><strong>AAYUSHI SHAH</strong></div><p className="final-quote">Today, tomorrow and every day,<br />you will always be my princess.</p><p className="final-thanks">{config.finalMessage}</p><div className="final-actions"><Button onClick={() => { setLetterOpen(false); setCrownClaimed(false); setFinalNote(false); go('welcome'); }}>Relive your royal journey</Button><Button secondary onClick={() => setFinalNote(true)}>Our story, forever</Button></div></div><div className="final-signoff">WITH ALL MY LOVE, HARSH <Heart size={12} /></div>{finalNote && <div className="note-backdrop" onClick={() => setFinalNote(false)}><motion.div className="forever-note" initial={{ opacity: 0, scale: .92 }} animate={{ opacity: 1, scale: 1 }} onClick={e => e.stopPropagation()}><button className="close-note" onClick={() => setFinalNote(false)} aria-label="Close"><X size={18} /></button><span className="eyebrow">OUR STORY, FOREVER</span><div className="note-heart">♥</div><p>Somewhere between college days, cafe tables, Kutch skies and all our playful teasing, you became my favourite place to be.</p><p>On <em>{config.anniversary}</em>, our story began. I still feel lucky that it is ours to keep writing.</p><span className="signature">Always yours, Harsh</span></motion.div></div>}</motion.section>}
    </AnimatePresence>
    <AnimatePresence>{memoryIndex !== null && <motion.div className="memory-overlay" role="dialog" aria-modal="true" aria-labelledby="memory-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><button type="button" className="memory-nav prev" onClick={() => setMemoryIndex((memoryIndex + config.memories.length - 1) % config.memories.length)} aria-label="Previous memory"><ArrowLeft /></button><div className="memory-modal"><div className="modal-photo"><LocalPhoto src={config.memories[memoryIndex].image} alt={config.memories[memoryIndex].title} fallback="A place in our story" photoUrls={privatePhotoUrls} /></div><div className="modal-detail"><span className="eyebrow">A MEMORY TO KEEP · {String(memoryIndex + 1).padStart(2, '0')}</span><h2 id="memory-title">{config.memories[memoryIndex].title}</h2>{config.memories[memoryIndex].date && <span className="modal-date">{config.memories[memoryIndex].date}</span>}<p>{config.memories[memoryIndex].caption}</p><div className="modal-progress">{String(memoryIndex + 1).padStart(2, '0')} <i /> {String(config.memories.length).padStart(2, '0')}</div></div></div><button type="button" className="memory-nav next" onClick={() => setMemoryIndex((memoryIndex + 1) % config.memories.length)} aria-label="Next memory"><ArrowRight /></button><button type="button" className="modal-close" onClick={event => { event.stopPropagation(); setMemoryIndex(null); }} aria-label="Close memory"><X /></button></motion.div>}</AnimatePresence>
    {scene === 'crown' && <button className="crown-continue" onClick={() => go('final')}>ENTER THE FINAL REVEAL <ArrowRight size={14} /></button>}
  </Frame>;
}
export default App;
