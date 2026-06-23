import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeftRight, BadgeCheck, Camera, Check, ChevronDown, ChevronRight,
  CircleHelp, Clock3, Combine, Download, FileArchive, FileImage, FileLock2,
  FileOutput, FilePenLine, FileSpreadsheet, FileText, FileType2, Film,
  Grid2X2, Heart, Image as ImageIcon, Images, Info, Link2, LockKeyhole,
  Menu, MessageSquareText, Mic, MicOff, Moon, MoreHorizontal, PanelLeftClose, 
  PanelLeftOpen, Presentation, RotateCw, Scissors, Search, Send, ShieldCheck,
  Sparkles, Split, Sun, UploadCloud, UserRound, Users, Video, VideoOff, Wand2,
  X, Zap,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { PDFDocument, degrees } from 'pdf-lib';
import JSZip from 'jszip';
import Peer from 'peerjs';

const categories = ['All tools', 'PDF', 'Images', 'Convert', 'Connect'];

const tools = [
  { id: 'image-compressor', title: 'Image Compressor', desc: 'Shrink JPG, PNG and WebP without the fuzzy mess.', category: 'Images', icon: ImageIcon, tone: 'sky', mode: 'image-compress', accept: 'image/*', badge: 'Popular' },
  { id: 'pdf-compressor', title: 'PDF Compressor', desc: 'Reduce PDF size while keeping text and images clear.', category: 'PDF', icon: FileArchive, tone: 'red', mode: 'generic', accept: '.pdf' },
  { id: 'pdf-word', title: 'PDF to Word', desc: 'Turn PDFs into editable Word documents.', category: 'Convert', icon: FileText, tone: 'blue', mode: 'generic', accept: '.pdf', output: 'DOCX' },
  { id: 'pdf-ppt', title: 'PDF to PowerPoint', desc: 'Create editable slides from any PDF.', category: 'Convert', icon: Presentation, tone: 'orange', mode: 'generic', accept: '.pdf', output: 'PPTX' },
  { id: 'pdf-excel', title: 'PDF to Excel', desc: 'Extract tables into clean spreadsheet rows.', category: 'Convert', icon: FileSpreadsheet, tone: 'green', mode: 'generic', accept: '.pdf', output: 'XLSX' },
  { id: 'pdf-images', title: 'PDF to Images', desc: 'Export each page as a crisp PNG or JPG.', category: 'Convert', icon: FileImage, tone: 'violet', mode: 'generic', accept: '.pdf', output: 'ZIP' },
  { id: 'images-pdf', title: 'Images to PDF', desc: 'Combine JPG, PNG, WebP and more into one PDF.', category: 'Convert', icon: Images, tone: 'indigo', mode: 'images-pdf', accept: 'image/*', multiple: true, badge: 'Browser-ready' },
  { id: 'word-pdf', title: 'Word to PDF', desc: 'Convert DOC and DOCX files into polished PDFs.', category: 'Convert', icon: FileType2, tone: 'blue', mode: 'generic', accept: '.doc,.docx', output: 'PDF' },
  { id: 'ppt-pdf', title: 'PowerPoint to PDF', desc: 'Save presentation slides as a shareable PDF.', category: 'Convert', icon: Presentation, tone: 'orange', mode: 'generic', accept: '.ppt,.pptx', output: 'PDF' },
  { id: 'excel-pdf', title: 'Excel to PDF', desc: 'Turn spreadsheets into neatly fitted pages.', category: 'Convert', icon: FileSpreadsheet, tone: 'green', mode: 'generic', accept: '.xls,.xlsx,.csv', output: 'PDF' },
  { id: 'protect-pdf', title: 'Protect PDF', desc: 'Add a password before sharing sensitive files.', category: 'PDF', icon: FileLock2, tone: 'amber', mode: 'generic', accept: '.pdf', password: true, output: 'PDF' },
  { id: 'unlock-pdf', title: 'Unlock PDF', desc: 'Enter the password and create an unlocked copy.', category: 'PDF', icon: LockKeyhole, tone: 'lime', mode: 'generic', accept: '.pdf', password: true, output: 'PDF' },
  { id: 'merge-pdf', title: 'Merge PDF', desc: 'Combine several PDFs in the order you choose.', category: 'PDF', icon: Combine, tone: 'rose', mode: 'merge', accept: '.pdf', multiple: true, badge: 'Browser-ready' },
  { id: 'split-pdf', title: 'Split PDF', desc: 'Save every PDF page as a separate file.', category: 'PDF', icon: Split, tone: 'cyan', mode: 'split', accept: '.pdf', badge: 'Browser-ready' },
  { id: 'rotate-pdf', title: 'Rotate PDF', desc: 'Fix sideways pages in a couple of clicks.', category: 'PDF', icon: RotateCw, tone: 'purple', mode: 'rotate', accept: '.pdf', badge: 'Browser-ready' },
  { id: 'edit-pdf', title: 'Edit PDF', desc: 'Add text, highlights, shapes and signatures.', category: 'PDF', icon: FilePenLine, tone: 'pink', mode: 'generic', accept: '.pdf', output: 'PDF' },
  { id: 'trim-pdf', title: 'Trim PDF Pages', desc: 'Remove margins and crop page content cleanly.', category: 'PDF', icon: Scissors, tone: 'orange', mode: 'generic', accept: '.pdf', output: 'PDF' },
  { id: 'image-converter', title: 'Image Converter', desc: 'Switch between JPG, PNG and WebP locally.', category: 'Images', icon: ArrowLeftRight, tone: 'teal', mode: 'image-convert', accept: 'image/*', badge: 'Browser-ready' },
  { id: 'share', title: 'Peer File Sharing', desc: 'Send any file directly—no cloud upload needed.', category: 'Connect', icon: Send, tone: 'blue', mode: 'peer', badge: 'Live' },
  { id: 'video', title: 'Video Conference', desc: 'Private peer-to-peer calls with screen sharing.', category: 'Connect', icon: Video, tone: 'violet', mode: 'video', badge: 'Live' },
];

const browserReady = new Set(['image-compress', 'image-convert', 'images-pdf', 'merge', 'split', 'rotate']);

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), 3);
  return `${(bytes / 1024 ** i).toFixed(i ? 1 : 0)} ${units[i]}`;
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function useProgress() {
  const [progress, setProgress] = useState(0);
  const animate = async (work) => {
    setProgress(6);
    const timer = setInterval(() => setProgress((p) => Math.min(p + Math.ceil(Math.random() * 9), 88)), 120);
    try {
      const result = await work();
      clearInterval(timer);
      setProgress(100);
      return result;
    } catch (error) {
      clearInterval(timer);
      setProgress(0);
      throw error;
    }
  };
  return { progress, setProgress, animate };
}

function Brand({ compact = false }) {
  return (
    <div className="brand">
      <img src="/sujal-logo.jpg" alt="Sujal Wagholikar logo" />
      {!compact && <div><strong>Sujal</strong><span>File Studio</span></div>}
    </div>
  );
}

function Sidebar({ open, setOpen, activeCategory, setActiveCategory }) {
  return (
    <aside className={`sidebar ${open ? 'open' : 'closed'}`}>
      <div className="sidebar-top">
        <Brand compact={!open} />
        <button className="icon-button desktop-collapse" onClick={() => setOpen(!open)} aria-label="Toggle sidebar">
          {open ? <PanelLeftClose size={19} /> : <PanelLeftOpen size={19} />}
        </button>
      </div>
      <nav className="main-nav" aria-label="Main navigation">
        <button className={activeCategory === 'All tools' ? 'active' : ''} onClick={() => setActiveCategory('All tools')}><Grid2X2 /><span>Dashboard</span></button>
        <button onClick={() => setActiveCategory('PDF')}><FileText /><span>PDF tools</span></button>
        <button onClick={() => setActiveCategory('Images')}><ImageIcon /><span>Image tools</span></button>
        <button onClick={() => setActiveCategory('Convert')}><ArrowLeftRight /><span>Convert</span></button>
        <button onClick={() => setActiveCategory('Connect')}><Users /><span>Connect</span><em>2</em></button>
      </nav>
      <div className="nav-label">Workspace</div>
      <nav className="main-nav muted-nav">
        <button><Clock3 /><span>Recent files</span></button>
        <button><Heart /><span>Favorites</span></button>
      </nav>
      <div className="privacy-card">
        <div className="shield"><ShieldCheck /></div>
        {open && <><strong>Privacy first</strong><p>Browser-ready tools keep your files on this device.</p></>}
      </div>
      <div className="sidebar-user">
        <img src="/sujal-logo.jpg" alt="Profile" />
        {open && <div><strong>Sujal Wagholikar</strong><span>Workspace owner</span></div>}
        {open && <MoreHorizontal size={18} />}
      </div>
    </aside>
  );
}

function Header({ sidebarOpen, setSidebarOpen, query, setQuery, dark, setDark }) {
  return (
    <header className="topbar">
      <button className="icon-button mobile-menu" aria-label="Open menu" onClick={() => setSidebarOpen(!sidebarOpen)}><Menu /></button>
      <div className="searchbox">
        <Search size={19} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search 20 tools…" />
        <span>⌘ K</span>
      </div>
      <div className="top-actions">
        <button className="icon-button" onClick={() => setDark(!dark)} aria-label="Toggle theme">{dark ? <Sun /> : <Moon />}</button>
        <button className="help-button"><CircleHelp size={18} /><span>Help</span></button>
        <img className="header-avatar" src="/sujal-logo.jpg" alt="Sujal" />
      </div>
    </header>
  );
}

function ToolCard({ tool, onOpen, favorite, onFavorite }) {
  const Icon = tool.icon;
  return (
    <article className="tool-card" onClick={() => onOpen(tool)}>
      <div className="tool-card-top">
        <div className={`tool-icon ${tool.tone}`}><Icon /></div>
        <button className={`heart-button ${favorite ? 'liked' : ''}`} onClick={(e) => { e.stopPropagation(); onFavorite(tool.id); }} aria-label="Favorite tool">
          <Heart size={18} fill={favorite ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="card-title-line">
        <h3>{tool.title}</h3>
        {tool.badge && <span className={`badge ${tool.badge === 'Live' ? 'live' : ''}`}>{tool.badge}</span>}
      </div>
      <p>{tool.desc}</p>
      <button className="open-tool">Open tool <ChevronRight size={17} /></button>
    </article>
  );
}

function ProgressBar({ value, label = 'Processing' }) {
  return (
    <div className="progress-wrap">
      <div className="progress-copy"><span>{value === 100 ? 'Complete' : label}</span><strong>{value}%</strong></div>
      <div className="progress-track"><span style={{ width: `${value}%` }} /></div>
    </div>
  );
}

function DropZone({ files, setFiles, accept, multiple = false }) {
  const inputRef = useRef(null);
  const add = (list) => setFiles(multiple ? Array.from(list) : Array.from(list).slice(0, 1));
  return (
    <>
      <div
        className="drop-zone"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); add(e.dataTransfer.files); }}
      >
        <div className="upload-orbit"><UploadCloud /></div>
        <strong>Drop your {multiple ? 'files' : 'file'} here</strong>
        <p>or click to browse from your device</p>
        <button type="button">Choose {multiple ? 'files' : 'a file'}</button>
        <input ref={inputRef} type="file" accept={accept} multiple={multiple} hidden onChange={(e) => add(e.target.files)} />
      </div>
      {!!files.length && (
        <div className="file-list">
          {files.map((file, index) => (
            <div className="file-row" key={`${file.name}-${index}`}>
              <div className="mini-file"><FileOutput /></div>
              <div><strong>{file.name}</strong><span>{formatBytes(file.size)}</span></div>
              <button onClick={() => setFiles(files.filter((_, i) => i !== index))}><X size={17} /></button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

async function imageToCanvas(file) {
  const img = new Image();
  const url = URL.createObjectURL(file);
  await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = url; });
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.getContext('2d').drawImage(img, 0, 0);
  URL.revokeObjectURL(url);
  return canvas;
}

function BrowserFileTool({ tool, toast }) {
  const [files, setFiles] = useState([]);
  const [quality, setQuality] = useState(72);
  const [format, setFormat] = useState('image/webp');
  const [rotation, setRotation] = useState(90);
  const [result, setResult] = useState(null);
  const { progress, setProgress, animate } = useProgress();

  useEffect(() => { setResult(null); setProgress(0); }, [files]);

  const process = async () => {
    if (!files.length) return toast('Choose a file first.');
    try {
      const output = await animate(async () => {
        if (tool.mode === 'image-compress' || tool.mode === 'image-convert') {
          const canvas = await imageToCanvas(files[0]);
          const mime = tool.mode === 'image-convert' ? format : (files[0].type === 'image/png' ? 'image/webp' : 'image/jpeg');
          const blob = await new Promise((resolve) => canvas.toBlob(resolve, mime, tool.mode === 'image-compress' ? quality / 100 : .92));
          const ext = mime.split('/')[1].replace('jpeg', 'jpg');
          return { blob, name: `${files[0].name.replace(/\.[^.]+$/, '')}-${tool.mode === 'image-compress' ? 'compressed' : 'converted'}.${ext}` };
        }
        if (tool.mode === 'images-pdf') {
          const doc = new jsPDF({ unit: 'px', format: 'a4', orientation: 'portrait', hotfixes: ['px_scaling'] });
          for (let i = 0; i < files.length; i++) {
            const canvas = await imageToCanvas(files[i]);
            if (i) doc.addPage();
            const pw = doc.internal.pageSize.getWidth(), ph = doc.internal.pageSize.getHeight();
            const scale = Math.min((pw - 48) / canvas.width, (ph - 48) / canvas.height);
            const w = canvas.width * scale, h = canvas.height * scale;
            doc.addImage(canvas.toDataURL('image/jpeg', .9), 'JPEG', (pw - w) / 2, (ph - h) / 2, w, h);
          }
          return { blob: doc.output('blob'), name: 'sujal-images.pdf' };
        }
        if (tool.mode === 'merge') {
          const merged = await PDFDocument.create();
          for (const file of files) {
            const source = await PDFDocument.load(await file.arrayBuffer());
            const pages = await merged.copyPages(source, source.getPageIndices());
            pages.forEach((page) => merged.addPage(page));
          }
          return { blob: new Blob([await merged.save()], { type: 'application/pdf' }), name: 'sujal-merged.pdf' };
        }
        if (tool.mode === 'split') {
          const source = await PDFDocument.load(await files[0].arrayBuffer());
          const zip = new JSZip();
          for (let i = 0; i < source.getPageCount(); i++) {
            const doc = await PDFDocument.create();
            const [page] = await doc.copyPages(source, [i]);
            doc.addPage(page);
            zip.file(`page-${i + 1}.pdf`, await doc.save());
          }
          return { blob: await zip.generateAsync({ type: 'blob' }), name: 'sujal-split-pages.zip' };
        }
        if (tool.mode === 'rotate') {
          const doc = await PDFDocument.load(await files[0].arrayBuffer());
          doc.getPages().forEach((page) => page.setRotation(degrees((page.getRotation().angle + Number(rotation)) % 360)));
          return { blob: new Blob([await doc.save()], { type: 'application/pdf' }), name: 'sujal-rotated.pdf' };
        }
        return null;
      });
      setResult(output);
      toast('Your file is ready to download.');
    } catch (error) {
      console.error(error);
      toast('That file could not be processed. Please try another one.');
    }
  };

  return (
    <div className="tool-workspace">
      <DropZone files={files} setFiles={setFiles} accept={tool.accept} multiple={tool.multiple} />
      {tool.mode === 'image-compress' && <div className="setting-row"><div><strong>Image quality</strong><span>Higher means a larger file</span></div><input type="range" min="20" max="95" value={quality} onChange={(e) => setQuality(e.target.value)} /><b>{quality}%</b></div>}
      {tool.mode === 'image-convert' && <div className="setting-row"><div><strong>Output format</strong><span>Choose your new image type</span></div><select value={format} onChange={(e) => setFormat(e.target.value)}><option value="image/webp">WebP</option><option value="image/jpeg">JPG</option><option value="image/png">PNG</option></select></div>}
      {tool.mode === 'rotate' && <div className="setting-row"><div><strong>Rotate all pages</strong><span>Clockwise rotation</span></div><select value={rotation} onChange={(e) => setRotation(e.target.value)}><option value="90">90°</option><option value="180">180°</option><option value="270">270°</option></select></div>}
      {progress > 0 && <ProgressBar value={progress} />}
      {result && <div className="result-card"><div className="result-check"><Check /></div><div><strong>{result.name}</strong><span>{formatBytes(result.blob.size)} · Ready on this device</span></div><button onClick={() => downloadBlob(result.blob, result.name)}><Download size={18} /> Download</button></div>}
      <button className="primary-action" disabled={!files.length || (progress > 0 && progress < 100)} onClick={process}><Wand2 size={18} />{progress > 0 && progress < 100 ? `Processing ${progress}%` : tool.title}</button>
    </div>
  );
}

function ServiceTool({ tool, toast }) {
  const [files, setFiles] = useState([]);
  const [password, setPassword] = useState('');
  const [ready, setReady] = useState(false);
  const { progress, animate } = useProgress();
  const prepare = async () => {
    if (!files.length) return toast('Choose a file first.');
    if (tool.password && !password) return toast('Enter the PDF password first.');
    await animate(() => new Promise((resolve) => setTimeout(resolve, 1250)));
    setReady(true);
  };
  const downloadReport = () => {
    const copy = `Sujal File Studio\n\n${tool.title} request prepared\nInput: ${files[0].name}\nTarget: ${tool.output || 'optimized file'}\n\nThis advanced conversion requires a server-side processing connector in production. No file was uploaded by this frontend preview.`;
    downloadBlob(new Blob([copy], { type: 'text/plain' }), `${tool.id}-integration-report.txt`);
  };
  return (
    <div className="tool-workspace">
      <div className="service-note"><Info size={18} /><span><strong>Integration-ready</strong> The complete interface is built. This operation needs a secure server conversion engine for production.</span></div>
      <DropZone files={files} setFiles={(next) => { setFiles(next); setReady(false); }} accept={tool.accept} multiple={tool.multiple} />
      {tool.password && <label className="password-field"><span>PDF password</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" /></label>}
      {progress > 0 && <ProgressBar value={progress} label="Preparing secure request" />}
      {ready && <div className="result-card"><div className="result-check"><Check /></div><div><strong>Processing request is ready</strong><span>Download the backend integration report</span></div><button onClick={downloadReport}><Download size={18} /> Download</button></div>}
      <button className="primary-action" disabled={!files.length || (progress > 0 && progress < 100)} onClick={prepare}><Wand2 size={18} />Prepare {tool.output || 'file'}</button>
    </div>
  );
}

function PeerShare({ toast }) {
  const [peerId, setPeerId] = useState('Creating secure link…');
  const [target, setTarget] = useState('');
  const [file, setFile] = useState(null);
  const [connection, setConnection] = useState(null);
  const [status, setStatus] = useState('Waiting for another device');
  const [progress, setProgress] = useState(0);
  const peerRef = useRef(null);
  useEffect(() => {
    const peer = new Peer();
    peerRef.current = peer;
    peer.on('open', (id) => setPeerId(id));
    peer.on('connection', (conn) => bindConnection(conn));
    peer.on('error', () => setStatus('Could not reach the peer network'));
    return () => peer.destroy();
  }, []);
  const bindConnection = (conn) => {
    conn.on('open', () => { setConnection(conn); setStatus('Connected — ready to send'); });
    conn.on('data', (payload) => {
      if (payload?.type === 'file') {
        downloadBlob(new Blob([payload.data]), payload.name);
        toast(`${payload.name} received.`);
      }
    });
  };
  const connect = () => {
    if (!target.trim()) return toast('Enter the other device code.');
    setStatus('Connecting…');
    bindConnection(peerRef.current.connect(target.trim(), { reliable: true }));
  };
  const send = async () => {
    if (!connection?.open || !file) return toast('Connect and choose a file first.');
    setProgress(14);
    const timer = setInterval(() => setProgress((p) => Math.min(p + 11, 90)), 90);
    connection.send({ type: 'file', name: file.name, data: await file.arrayBuffer() });
    clearInterval(timer); setProgress(100); toast('File sent directly to the other device.');
  };
  return (
    <div className="connect-workspace">
      <div className="room-code"><span>Your device code</span><div><strong>{peerId}</strong><button onClick={() => { navigator.clipboard.writeText(peerId); toast('Device code copied.'); }}><Link2 size={17} /> Copy</button></div></div>
      <div className="connect-divider"><span>connect to another device</span></div>
      <div className="join-row"><input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Paste their device code" /><button onClick={connect}>Connect</button></div>
      <div className={`connection-status ${connection?.open ? 'online' : ''}`}><i />{status}</div>
      <label className="mini-drop"><UploadCloud /><span>{file ? file.name : 'Choose any document, image or video'}</span><input hidden type="file" onChange={(e) => setFile(e.target.files[0])} /></label>
      {progress > 0 && <ProgressBar value={progress} label="Sending directly" />}
      <button className="primary-action" onClick={send} disabled={!file || !connection?.open}><Send size={18} /> Send file</button>
    </div>
  );
}

function VideoRoom({ toast }) {
  const [peerId, setPeerId] = useState('Creating room…');
  const [target, setTarget] = useState('');
  const [stream, setStream] = useState(null);
  const [mic, setMic] = useState(true);
  const [camera, setCamera] = useState(true);
  const localRef = useRef(null), remoteRef = useRef(null), peerRef = useRef(null), streamRef = useRef(null);
  useEffect(() => {
    const peer = new Peer(); peerRef.current = peer;
    peer.on('open', setPeerId);
    peer.on('call', async (call) => {
      const local = streamRef.current || await startMedia();
      call.answer(local); call.on('stream', (remote) => { remoteRef.current.srcObject = remote; });
    });
    return () => { peer.destroy(); streamRef.current?.getTracks().forEach((track) => track.stop()); };
  }, []);
  const startMedia = async () => {
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = media;
      setStream(media); setTimeout(() => { if (localRef.current) localRef.current.srcObject = media; });
      return media;
    } catch { toast('Camera or microphone access was not available.'); throw new Error('Media unavailable'); }
  };
  const join = async () => {
    if (!target) return toast('Enter a room code.');
    const local = stream || await startMedia();
    const call = peerRef.current.call(target, local);
    call.on('stream', (remote) => { remoteRef.current.srcObject = remote; });
  };
  const toggleTrack = (type) => {
    const track = stream?.getTracks().find((item) => item.kind === type);
    if (!track) return;
    track.enabled = !track.enabled;
    type === 'audio' ? setMic(track.enabled) : setCamera(track.enabled);
  };
  return (
    <div className="video-workspace">
      <div className="video-grid">
        <div><video ref={remoteRef} autoPlay playsInline /><span><Users size={15} /> Guest</span></div>
        <div><video ref={localRef} autoPlay playsInline muted /><span><UserRound size={15} /> You</span></div>
      </div>
      <div className="video-controls">
        <button onClick={() => toggleTrack('audio')} className={!mic ? 'off' : ''}>{mic ? <Mic /> : <MicOff />}</button>
        <button onClick={() => toggleTrack('video')} className={!camera ? 'off' : ''}>{camera ? <Camera /> : <VideoOff />}</button>
        <button onClick={() => toast('Screen sharing can be added after the call connects.')}><Film /></button>
      </div>
      <div className="room-line"><div><span>Your room code</span><strong>{peerId}</strong></div><button onClick={() => navigator.clipboard.writeText(peerId)}><Link2 size={17} /> Copy</button></div>
      <div className="join-row"><input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Enter a room code" /><button onClick={join}>Join call</button></div>
      {!stream && <button className="primary-action" onClick={startMedia}><Video size={18} /> Start camera</button>}
    </div>
  );
}

function ToolModal({ tool, onClose, toast }) {
  const Icon = tool.icon;
  useEffect(() => {
    const handler = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler); document.body.classList.add('modal-open');
    return () => { window.removeEventListener('keydown', handler); document.body.classList.remove('modal-open'); };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="tool-modal" role="dialog" aria-modal="true" aria-label={tool.title}>
        <div className="modal-header">
          <div className={`tool-icon ${tool.tone}`}><Icon /></div>
          <div><div className="modal-eyebrow">{tool.category} TOOL</div><h2>{tool.title}</h2><p>{tool.desc}</p></div>
          <button className="close-button" aria-label="Close tool" onClick={onClose}><X /></button>
        </div>
        {browserReady.has(tool.mode) && <BrowserFileTool tool={tool} toast={toast} />}
        {tool.mode === 'generic' && <ServiceTool tool={tool} toast={toast} />}
        {tool.mode === 'peer' && <PeerShare toast={toast} />}
        {tool.mode === 'video' && <VideoRoom toast={toast} />}
        <div className="modal-foot"><ShieldCheck size={17} /><span>{browserReady.has(tool.mode) ? 'This tool processes files locally in your browser.' : 'Your workspace is designed for secure processing.'}</span><a href="#privacy">Privacy</a></div>
      </section>
    </div>
  );
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 860);
  const [activeCategory, setActiveCategory] = useState('All tools');
  const [query, setQuery] = useState('');
  const [selectedTool, setSelectedTool] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [toastMessage, setToastMessage] = useState('');
  const [dark, setDark] = useState(false);
  const toastTimer = useRef(null);

  const toast = (message) => {
    clearTimeout(toastTimer.current); setToastMessage(message);
    toastTimer.current = setTimeout(() => setToastMessage(''), 3300);
  };
  useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; }, [dark]);
  useEffect(() => {
    const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); document.querySelector('.searchbox input')?.focus(); } };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, []);

  const visibleTools = useMemo(() => tools.filter((tool) => {
    const categoryMatch = activeCategory === 'All tools' || tool.category === activeCategory;
    const text = `${tool.title} ${tool.desc} ${tool.category}`.toLowerCase();
    return categoryMatch && text.includes(query.toLowerCase());
  }), [activeCategory, query]);

  return (
    <div className={`app-shell ${sidebarOpen ? '' : 'sidebar-closed'}`}>
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
      {sidebarOpen && <button className="mobile-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close menu" />}
      <main className="main-content">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} query={query} setQuery={setQuery} dark={dark} setDark={setDark} />
        <div className="page-wrap">
          <section className="welcome-row">
            <div><span className="hello"><Sparkles size={16} /> GOOD TO SEE YOU, SUJAL</span><h1>What do you want to make simpler today?</h1><p>Convert, compress, edit, share and meet—all from one tidy workspace.</p></div>
            <div className="quick-buttons"><button onClick={() => setSelectedTool(tools.find((t) => t.id === 'share'))}><Send size={18} /> Share a file</button><button onClick={() => setSelectedTool(tools.find((t) => t.id === 'video'))}><Video size={18} /> Start a call</button></div>
          </section>

          <section className="feature-banner">
            <div className="banner-copy"><span className="banner-pill"><Zap size={15} /> DIRECT. PRIVATE. FAST.</span><h2>Files move. <em>Ideas stay yours.</em></h2><p>Powerful file tools with local browser processing wherever possible. No clutter, no mystery.</p><button onClick={() => setSelectedTool(tools[0])}>Compress an image <ChevronRight size={17} /></button></div>
            <div className="banner-visual" aria-hidden="true">
              <div className="visual-card back"><FileText /><span>report.pdf</span></div>
              <div className="visual-card front"><ImageIcon /><span>photo.webp</span><i><Check size={13} /></i></div>
              <div className="visual-chip"><ShieldCheck /><span>Processed locally<strong>Your files stay private</strong></span></div>
            </div>
          </section>

          <section className="trust-strip" id="privacy">
            <div><span><ShieldCheck /></span><p><strong>Private by design</strong>Local processing for supported tools</p></div>
            <div><span><Zap /></span><p><strong>No waiting around</strong>Simple workflows with live progress</p></div>
            <div><span><BadgeCheck /></span><p><strong>Always clear</strong>No surprise uploads or hidden steps</p></div>
          </section>

          <section className="tools-section">
            <div className="section-head"><div><h2>Your tools</h2><p>Everything you need, one click away.</p></div><span>{visibleTools.length} tools</span></div>
            <div className="category-tabs">
              {categories.map((category) => <button key={category} className={activeCategory === category ? 'active' : ''} onClick={() => setActiveCategory(category)}>{category}</button>)}
            </div>
            {visibleTools.length ? <div className="tool-grid">{visibleTools.map((tool) => <ToolCard key={tool.id} tool={tool} onOpen={setSelectedTool} favorite={favorites.includes(tool.id)} onFavorite={(id) => setFavorites((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id])} />)}</div> : <div className="empty-state"><Search /><h3>No matching tools</h3><p>Try a shorter search or choose another category.</p></div>}
          </section>

          <footer><Brand /><p>Simple tools for everyday files.</p><div><a href="#privacy">Privacy</a><a href="#privacy">Security</a><a href="#privacy">Help</a></div><span>© 2026 Sujal Wagholikar</span></footer>
        </div>
      </main>
      {selectedTool && <ToolModal tool={selectedTool} onClose={() => setSelectedTool(null)} toast={toast} />}
      <div className={`toast ${toastMessage ? 'show' : ''}`}><Check size={17} />{toastMessage}</div>
    </div>
  );
}

export default App;
