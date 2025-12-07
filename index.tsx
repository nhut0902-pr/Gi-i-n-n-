import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Upload, 
  Download, 
  Image as ImageIcon, 
  Video, 
  Smartphone, 
  Zap, 
  FileVideo, 
  CheckCircle,
  AlertCircle,
  Settings,
  ArrowRight,
  Play,
  Pause,
  Code,
  Volume2,
  VolumeX,
  Music,
  FileAudio
} from 'lucide-react';

// --- Types & Constants ---
type Tab = 'image' | 'video' | 'audio' | 'tiktok';

const TIKTOK_API_ENDPOINT = 'https://www.tikwm.com/api/';

// --- Helper Functions ---

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

// --- Components ---

const Header = ({ activeTab, setActiveTab }: { activeTab: Tab, setActiveTab: (t: Tab) => void }) => (
  <header className="mb-8 text-center space-y-4">
    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono font-bold uppercase tracking-wider">
      <Zap size={14} />
      <span>Không AI &bull; Thuật toán thuần</span>
    </div>
    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-blue-200 to-blue-400 bg-clip-text text-transparent">
      Media<span className="text-blue-500">Shrink</span> Pro
    </h1>
    <p className="text-slate-400 max-w-lg mx-auto text-sm md:text-base">
      Công cụ nén ảnh/video chuyên nghiệp và tải TikTok không logo. Powered By Nhutcoder.
    </p>

    <div className="flex flex-wrap justify-center gap-2 mt-6 p-1 bg-slate-800/50 backdrop-blur rounded-xl inline-flex border border-slate-700">
      <button
        onClick={() => setActiveTab('image')}
        className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
          activeTab === 'image' 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' 
            : 'text-slate-400 hover:text-white hover:bg-slate-700'
        }`}
      >
        <ImageIcon size={18} />
        <span className="hidden md:inline">Nén Ảnh</span>
        <span className="md:hidden">Ảnh</span>
      </button>
      <button
        onClick={() => setActiveTab('video')}
        className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
          activeTab === 'video' 
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' 
            : 'text-slate-400 hover:text-white hover:bg-slate-700'
        }`}
      >
        <Video size={18} />
        <span className="hidden md:inline">Nén Video</span>
        <span className="md:hidden">Video</span>
      </button>
      <button
        onClick={() => setActiveTab('audio')}
        className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
          activeTab === 'audio' 
            ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/25' 
            : 'text-slate-400 hover:text-white hover:bg-slate-700'
        }`}
      >
        <Music size={18} />
        <span className="hidden md:inline">Tách Nhạc</span>
        <span className="md:hidden">Nhạc</span>
      </button>
      <button
        onClick={() => setActiveTab('tiktok')}
        className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
          activeTab === 'tiktok' 
            ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/25' 
            : 'text-slate-400 hover:text-white hover:bg-slate-700'
        }`}
      >
        <Smartphone size={18} />
        <span className="hidden md:inline">TikTok DL</span>
        <span className="md:hidden">TikTok</span>
      </button>
    </div>
  </header>
);

// --- Image Compressor Logic ---

const ImageCompressor = () => {
  const [file, setFile] = useState<File | null>(null);
  const [targetSizeKB, setTargetSizeKB] = useState<number>(200);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResultBlob(null);
      setProgress(0);
    }
  };

  const processImage = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(10);

    try {
      // Create an image bitmap
      const imageBitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      let width = imageBitmap.width;
      let height = imageBitmap.height;
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Canvas context failed");
      
      ctx.drawImage(imageBitmap, 0, 0, width, height);
      setProgress(30);

      // Compression Loop
      let quality = 0.9;
      let blob: Blob | null = null;
      let attempts = 0;
      const targetSizeBytes = targetSizeKB * 1024;

      const toBlobPromise = (q: number) => new Promise<Blob | null>(resolve => {
        canvas.toBlob(b => resolve(b), file.type === 'image/png' ? 'image/jpeg' : file.type, q);
      });

      // Binary search approach mixed with scaling
      while (attempts < 10) {
        blob = await toBlobPromise(quality);
        setProgress(30 + (attempts * 5));

        if (!blob) break;

        if (blob.size <= targetSizeBytes) {
          break; // Goal reached
        }

        // Reduce quality
        if (quality > 0.1) {
          quality -= 0.1;
        } else {
          // If quality is maxed out low, reduce dimension
          width *= 0.8;
          height *= 0.8;
          canvas.width = width;
          canvas.height = height;
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(imageBitmap, 0, 0, width, height);
          quality = 0.5; // Reset quality for new size
        }
        attempts++;
      }

      setResultBlob(blob);
      setProgress(100);
    } catch (err) {
      console.error(err);
      alert('Lỗi nén ảnh. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
      <div className="p-6 md:p-8">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <ImageIcon className="text-blue-500" />
          Trình Nén Ảnh Thông Minh
        </h2>

        {!file ? (
          <div className="border-2 border-dashed border-slate-600 rounded-xl p-12 text-center hover:bg-slate-700/30 transition-colors relative group">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center gap-4 text-slate-400 group-hover:text-blue-400 transition-colors">
              <Upload size={48} />
              <div className="text-lg font-medium">Kéo thả hoặc chọn ảnh</div>
              <div className="text-sm opacity-60">Hỗ trợ PNG, JPG, WEBP (Max 50MB)</div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* File Info */}
            <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
              <img 
                src={URL.createObjectURL(file)} 
                alt="Preview" 
                className="w-16 h-16 object-cover rounded-lg border border-slate-600" 
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate text-white">{file.name}</div>
                <div className="text-sm text-slate-400">Gốc: {formatBytes(file.size)}</div>
              </div>
              <button 
                onClick={() => setFile(null)}
                className="text-slate-400 hover:text-red-400 p-2"
              >
                ✕
              </button>
            </div>

            {/* Controls */}
            <div className="bg-slate-700/30 p-5 rounded-xl space-y-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-slate-300">Dung lượng mong muốn:</label>
                <span className="text-blue-400 font-mono font-bold">{targetSizeKB} KB</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="5000" 
                step="10"
                value={targetSizeKB}
                onChange={(e) => setTargetSizeKB(Number(e.target.value))}
                className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-slate-500 font-mono">
                <span>10KB</span>
                <span>5MB</span>
              </div>
            </div>

            {/* Action */}
            {!resultBlob ? (
              <button
                onClick={processImage}
                disabled={isProcessing}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-3"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang xử lý {progress}%...
                  </>
                ) : (
                  <>
                    <Settings size={20} />
                    Bắt đầu nén
                  </>
                )}
              </button>
            ) : (
              <div className="animate-fade-in space-y-4">
                <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-green-400" />
                    <div>
                      <div className="font-bold text-green-400">Hoàn tất!</div>
                      <div className="text-sm text-green-300/80">
                        {formatBytes(file.size)} ➜ <span className="font-bold text-white">{formatBytes(resultBlob.size)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Giảm được</div>
                    <div className="font-mono font-bold text-white">
                      {Math.round(((file.size - resultBlob.size) / file.size) * 100)}%
                    </div>
                  </div>
                </div>
                
                <a 
                  href={URL.createObjectURL(resultBlob)}
                  download={`compressed_${file.name}`}
                  className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-green-900/20 transition-all flex items-center justify-center gap-3"
                >
                  <Download size={20} />
                  Tải xuống ngay
                </a>
                
                <button 
                  onClick={() => { setResultBlob(null); setProgress(0); }}
                  className="w-full py-3 text-slate-400 hover:text-white text-sm"
                >
                  Nén ảnh khác
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Video Compressor Logic (Improved & Robust) ---

const VideoCompressor = () => {
  const [file, setFile] = useState<File | null>(null);
  const [targetSizeMB, setTargetSizeMB] = useState<number>(4);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [log, setLog] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setResultBlob(null);
      setProgress(0);
      setDuration(0);
      setLog('');
      if (videoRef.current) {
        videoRef.current.src = URL.createObjectURL(selectedFile);
      }
    }
  };

  const getSupportedMimeType = () => {
    const types = [
      'video/webm; codecs=vp9',
      'video/webm; codecs=vp8',
      'video/webm; codecs=h264',
      'video/webm',
      'video/mp4'
    ];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) return t;
    }
    return '';
  };

  const calculateBitrate = () => {
    if (!duration) return 2500000;
    const targetBytes = targetSizeMB * 1024 * 1024;
    // Safety margin 0.7 for overhead and audio
    const bps = Math.floor((targetBytes * 8) / duration * 0.7); 
    return Math.max(bps, 100000); // Min 100kbps
  };

  const startCompression = async () => {
    if (!videoRef.current || !file) return;
    
    setIsProcessing(true);
    setProgress(0);
    setLog('Đang khởi tạo...');
    chunksRef.current = [];
    
    const mimeType = getSupportedMimeType();
    if (!mimeType) {
      alert('Trình duyệt của bạn không hỗ trợ chuẩn nén video này. Vui lòng dùng Chrome/Edge trên PC.');
      setIsProcessing(false);
      return;
    }

    try {
      const videoEl = videoRef.current;
      const bps = calculateBitrate();

      // --- Audio Capture Magic (Web Audio API) ---
      let stream: MediaStream;
      
      try {
        // @ts-ignore
        const captureStreamFunc = videoEl.captureStream || videoEl.mozCaptureStream;
        if (!captureStreamFunc) throw new Error("captureStream not supported");
        
        const videoStream = captureStreamFunc.call(videoEl) as MediaStream;

        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
            audioCtxRef.current = new AudioContext();
          }
          const ctx = audioCtxRef.current;
          
          const source = ctx.createMediaElementSource(videoEl);
          const dest = ctx.createMediaStreamDestination();
          
          source.connect(dest);
          
          const audioTrack = dest.stream.getAudioTracks()[0];
          const videoTrack = videoStream.getVideoTracks()[0];
          
          if (audioTrack && videoTrack) {
            stream = new MediaStream([videoTrack, audioTrack]);
            setLog('Chế độ âm thanh: WebAudio (Chất lượng cao)');
          } else {
            stream = videoStream;
            setLog('Chế độ âm thanh: Tiêu chuẩn');
          }
        } else {
          stream = videoStream;
        }
      } catch (e) {
        console.warn("Advanced audio capture failed, falling back", e);
        // @ts-ignore
        stream = (videoEl.captureStream || videoEl.mozCaptureStream).call(videoEl);
      }

      const recorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        bitsPerSecond: bps
      });

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setResultBlob(blob);
        setIsProcessing(false);
        setLog('Hoàn tất!');
        
        if (audioCtxRef.current) {
          audioCtxRef.current.close();
          audioCtxRef.current = null;
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.onerror = (e: any) => {
        console.error("Recorder error:", e);
        alert("Lỗi ghi hình: " + (e.error?.message || "Unknown error"));
        setIsProcessing(false);
      };

      videoEl.currentTime = 0;
      videoEl.muted = false; 
      videoEl.volume = 0; 
      
      if (!audioCtxRef.current && navigator.userAgent.indexOf("Chrome") > -1) {
         videoEl.volume = 0.05; 
         setLog('Đang nén... (Vui lòng không tắt tab)');
      }

      await videoEl.play();
      recorder.start();

      videoEl.onended = () => {
        if (recorder.state === 'recording') recorder.stop();
      };
      
      videoEl.ontimeupdate = () => {
         if (duration > 0) {
           setProgress(Math.round((videoEl.currentTime / duration) * 100));
         }
      };

    } catch (err: any) {
      console.error(err);
      alert(`Không thể khởi động trình nén: ${err.message}`);
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
      <div className="p-6 md:p-8">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Video className="text-indigo-500" />
          Trình Nén Video (Tái Mã Hóa)
        </h2>

        {!file ? (
          <div className="border-2 border-dashed border-slate-600 rounded-xl p-12 text-center hover:bg-slate-700/30 transition-colors relative group">
            <input 
              type="file" 
              accept="video/*" 
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center gap-4 text-slate-400 group-hover:text-indigo-400 transition-colors">
              <FileVideo size={48} />
              <div className="text-lg font-medium">Chọn Video MP4/MOV</div>
              <div className="text-sm opacity-60">Hỗ trợ file 10MB, 20MB, 45MB...</div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400">
                <FileVideo size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate text-white">{file.name}</div>
                <div className="text-sm text-slate-400">Gốc: {formatBytes(file.size)}</div>
              </div>
              <button onClick={() => { setFile(null); setResultBlob(null); setIsProcessing(false); }} className="text-slate-400 hover:text-red-400">✕</button>
            </div>

            <div className="relative bg-black rounded-lg overflow-hidden flex justify-center">
               <video 
                  ref={videoRef}
                  className={`max-h-[200px] w-auto ${isProcessing ? 'opacity-50' : ''}`}
                  onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                  controls={!isProcessing}
                  crossOrigin="anonymous"
                />
                {isProcessing && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/70 px-4 py-2 rounded-lg text-white font-mono text-sm">
                      Đang xử lý...
                    </div>
                  </div>
                )}
            </div>

            {!resultBlob && (
              <div className="bg-slate-700/30 p-5 rounded-xl space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-slate-300">Dung lượng đích:</label>
                  <span className="text-indigo-400 font-mono font-bold">{targetSizeMB} MB</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="20" 
                  step="0.5"
                  value={targetSizeMB}
                  onChange={(e) => setTargetSizeMB(Number(e.target.value))}
                  className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-sm text-indigo-200">
                   Độ dài: {formatTime(duration)} <br/>
                   Tốc độ bit (Bitrate): ~{Math.round(calculateBitrate() / 1000)} kbps
                </div>
                <div className="flex items-start gap-2 text-xs text-yellow-400/80">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <p>Tool sử dụng kỹ thuật phát và ghi lại. Vui lòng giữ tab này mở cho đến khi hoàn tất.</p>
                </div>
              </div>
            )}
            
            {log && <div className="text-xs font-mono text-slate-400 text-center">{log}</div>}

            {!resultBlob ? (
               <button
                 onClick={startCompression}
                 disabled={isProcessing}
                 className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-900/20 transition-all flex items-center justify-center gap-3"
               >
                 {isProcessing ? (
                   <>
                     <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     Đang xử lý {progress}%...
                   </>
                 ) : (
                   <>
                     <Settings size={20} />
                     Bắt đầu nén (Re-encode)
                   </>
                 )}
               </button>
            ) : (
               <div className="animate-fade-in space-y-4">
                 <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <CheckCircle className="text-green-400" />
                     <div>
                       <div className="font-bold text-green-400">Hoàn tất!</div>
                       <div className="text-sm text-green-300/80">
                         File WebM: <span className="font-bold text-white">{formatBytes(resultBlob.size)}</span>
                       </div>
                     </div>
                   </div>
                 </div>
                 
                 <a 
                   href={URL.createObjectURL(resultBlob)}
                   download={`compressed_${file.name.split('.')[0]}.webm`}
                   className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-green-900/20 transition-all flex items-center justify-center gap-3"
                 >
                   <Download size={20} />
                   Tải Video Mới
                 </a>
                 
                 <button 
                   onClick={() => { setFile(null); setResultBlob(null); }}
                   className="w-full py-3 text-slate-400 hover:text-white text-sm"
                 >
                   Nén video khác
                 </button>
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Audio Extractor Logic ---

const AudioExtractor = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResultBlob(null);
      setProgress(0);
      setDuration(0);
      if (videoRef.current) {
        videoRef.current.src = URL.createObjectURL(e.target.files[0]);
      }
    }
  };

  const startExtraction = async () => {
    if (!videoRef.current || !file) return;

    setIsProcessing(true);
    setProgress(0);
    chunksRef.current = [];

    try {
      const videoEl = videoRef.current;
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      
      // Use WebAudio to capture pure audio
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      
      // Create source
      const source = ctx.createMediaElementSource(videoEl);
      const dest = ctx.createMediaStreamDestination();
      source.connect(dest);
      
      // We do NOT connect to ctx.destination to avoid hearing it loudly
      
      const recorder = new MediaRecorder(dest.stream, {
        mimeType: 'audio/webm' 
        // audio/webm is widely supported. 
        // Chrome/Firefox will use Opus codec (high quality, low size)
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setResultBlob(blob);
        setIsProcessing(false);
        // Clean up
        source.disconnect();
        videoEl.currentTime = 0;
      };

      videoEl.currentTime = 0;
      videoEl.muted = false; 
      videoEl.volume = 0; // Silent play
      
      await videoEl.play();
      recorder.start();

      videoEl.onended = () => {
        if (recorder.state === 'recording') recorder.stop();
        setProgress(100);
      };

      videoEl.ontimeupdate = () => {
        if (duration > 0) {
          setProgress(Math.round((videoEl.currentTime / duration) * 100));
        }
      };

    } catch (err: any) {
      console.error(err);
      alert('Lỗi khi tách nhạc: ' + err.message);
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
      <div className="p-6 md:p-8">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Music className="text-amber-500" />
          Tách Nhạc (Video sang Âm thanh)
        </h2>

        {!file ? (
          <div className="border-2 border-dashed border-slate-600 rounded-xl p-12 text-center hover:bg-slate-700/30 transition-colors relative group">
            <input 
              type="file" 
              accept="video/*" 
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center gap-4 text-slate-400 group-hover:text-amber-400 transition-colors">
              <FileAudio size={48} />
              <div className="text-lg font-medium">Chọn Video để tách nhạc</div>
              <div className="text-sm opacity-60">MP4, MOV, WebM...</div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
              <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-400">
                <Music size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate text-white">{file.name}</div>
                <div className="text-sm text-slate-400">
                   Gốc: {formatBytes(file.size)} {duration > 0 && `• ${formatTime(duration)}`}
                </div>
              </div>
              <button onClick={() => { setFile(null); setResultBlob(null); }} className="text-slate-400 hover:text-red-400">✕</button>
            </div>

            {/* Hidden Video Player */}
            <video 
              ref={videoRef}
              className="hidden"
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
              crossOrigin="anonymous"
            />

            {!resultBlob ? (
              <button
                onClick={startExtraction}
                disabled={isProcessing}
                className="w-full py-4 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-lg shadow-amber-900/20 transition-all flex items-center justify-center gap-3"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang xử lý {progress}%...
                  </>
                ) : (
                  <>
                    <Zap size={20} />
                    Tách lấy file Audio
                  </>
                )}
              </button>
            ) : (
              <div className="animate-fade-in space-y-4">
                 <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <CheckCircle className="text-green-400" />
                     <div>
                       <div className="font-bold text-green-400">Thành công!</div>
                       <div className="text-sm text-green-300/80">
                         File Nhạc: <span className="font-bold text-white">{formatBytes(resultBlob.size)}</span>
                       </div>
                     </div>
                   </div>
                 </div>
                 
                 <a 
                   href={URL.createObjectURL(resultBlob)}
                   download={`audio_${file.name.split('.')[0]}.webm`}
                   className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-green-900/20 transition-all flex items-center justify-center gap-3"
                 >
                   <Download size={20} />
                   Tải File Nhạc
                 </a>
                 
                 <button 
                   onClick={() => { setFile(null); setResultBlob(null); }}
                   className="w-full py-3 text-slate-400 hover:text-white text-sm"
                 >
                   Tách file khác
                 </button>
              </div>
            )}
            
            {!resultBlob && !isProcessing && (
              <p className="text-xs text-center text-slate-500">
                Hệ thống sẽ phát video ngầm và ghi lại âm thanh chất lượng cao.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- TikTok Downloader Logic ---

const TikTokDownloader = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  const handleFetch = async () => {
    if (!url.includes('tiktok.com')) {
      setError('Link không hợp lệ. Vui lòng dán link TikTok chuẩn.');
      return;
    }
    setLoading(true);
    setError('');
    setData(null);

    try {
      // Using a public API (TikWM) to fetch video data without watermark
      // Note: This relies on a 3rd party public API.
      const response = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
      const result = await response.json();

      if (result.code === 0) {
        setData(result.data);
      } else {
        setError('Không tìm thấy video hoặc API đang bận. Thử lại sau.');
      }
    } catch (err) {
      setError('Lỗi kết nối. Có thể do chặn CORS trên môi trường này.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
      <div className="p-6 md:p-8">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Smartphone className="text-pink-500" />
          Tải TikTok Không Logo
        </h2>

        <div className="space-y-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Dán link video TikTok vào đây..." 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-xl p-4 pr-12 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
            />
            {url && (
              <button 
                onClick={() => setUrl('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={handleFetch}
            disabled={loading || !url}
            className="w-full py-4 bg-pink-600 hover:bg-pink-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-pink-900/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'Đang lấy dữ liệu...' : 'Lấy Video Ngay'}
          </button>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
              {error.includes('CORS') && (
                 <a 
                   href="https://tikwm.com/" 
                   target="_blank" 
                   rel="noreferrer"
                   className="underline font-bold ml-1"
                 >
                   Mở trang nguồn
                 </a>
              )}
            </div>
          )}

          {data && (
            <div className="animate-fade-in mt-6 bg-slate-900/50 rounded-xl border border-slate-700 p-4">
              <div className="flex gap-4 mb-4">
                <img src={data.cover} alt="Cover" className="w-24 h-32 object-cover rounded-lg bg-slate-800" />
                <div className="flex-1 min-w-0 py-1">
                  <div className="text-sm font-bold text-white line-clamp-2 mb-1">{data.title}</div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                    <img src={data.author.avatar} className="w-5 h-5 rounded-full" />
                    <span>{data.author.nickname}</span>
                  </div>
                  <div className="flex gap-2 text-xs font-mono text-slate-500">
                    <span>Ví dụ: {formatBytes(data.size || 5000000)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <a 
                  href={data.play} 
                  target="_blank" 
                  rel="noreferrer"
                  download
                  className="py-3 px-4 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Download size={16} />
                  Tải Video (Không Logo)
                </a>
                <a 
                  href={data.music} 
                  target="_blank" 
                  rel="noreferrer"
                  download
                  className="py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Download size={16} />
                  Tải MP3 Nhạc
                </a>
              </div>
              <div className="text-center mt-3">
                 <p className="text-xs text-slate-500">Nếu nút tải không hoạt động, chuột phải vào nút chọn "Lưu liên kết thành..."</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

const App = () => {
  const [activeTab, setActiveTab] = useState<Tab>('image');

  return (
    <div className="min-h-screen py-10 px-4 md:px-6">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="animate-fade-in">
        {activeTab === 'image' && <ImageCompressor />}
        {activeTab === 'video' && <VideoCompressor />}
        {activeTab === 'audio' && <AudioExtractor />}
        {activeTab === 'tiktok' && <TikTokDownloader />}
      </main>

      <footer className="text-center text-slate-500 text-sm mt-12 pb-6">
        <div className="flex flex-col items-center gap-2">
          <div className="font-mono text-xs opacity-50">Xây dựng bằng React & API Trình duyệt</div>
          <div className="flex items-center gap-2 text-blue-400 font-bold bg-blue-500/5 px-4 py-2 rounded-full border border-blue-500/10">
            <Code size={14} />
            Powered By Nhutcoder
          </div>
        </div>
      </footer>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);